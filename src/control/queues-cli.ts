import {
  buildStoredLoopSender,
} from "../agents/loop-control-shared.ts";
import {
  createStoredQueueItem,
  type QueuedPromptStatus,
  type StoredQueueSender,
} from "../agents/queue-state.ts";
import { DEFAULT_PROTECTED_CONTROL_RULE } from "../auth/defaults.ts";
import { resolvePrincipalAuth } from "../auth/resolve.ts";
import { resolveAgentTarget } from "../agents/resolved-target.ts";
import { AgentSessionState } from "../agents/session-state.ts";
import { SessionStore } from "../agents/session-store.ts";
import { ensureEditableConfigFile } from "../config/config-file.ts";
import {
  loadConfigWithoutEnvResolution,
  resolveSessionStorePath,
} from "../config/load-config.ts";
import { renderCliCommand } from "../shared/cli-name.ts";
import { resolveLoopCliContext, type LoopCliContext } from "./loop-cli-context.ts";
import { hasFlag, parseOptionValue } from "./loop-cli-addressing.ts";

type QueueCliAddressing = {
  channel?: "slack" | "telegram";
  target?: string;
  threadId?: string;
  topicId?: string;
  botId?: string;
  all: boolean;
};

type QueueControlState = Awaited<ReturnType<typeof loadQueueControlState>>;
type QueueCliContext = LoopCliContext;

const QUEUE_SENDER_FLAG = "--sender";
const QUEUE_SENDER_NAME_FLAG = "--sender-name";
const QUEUE_SENDER_HANDLE_FLAG = "--sender-handle";

function getEditableConfigPath() {
  return process.env.CLISBOT_CONFIG_PATH;
}

function getSessionState(sessionStorePath: string) {
  return new AgentSessionState(new SessionStore(sessionStorePath));
}

async function loadQueueControlState() {
  const configPath = await ensureEditableConfigFile(getEditableConfigPath());
  const loadedConfig = await loadConfigWithoutEnvResolution(configPath);
  const sessionStorePath = resolveSessionStorePath(loadedConfig);
  return {
    loadedConfig,
    configPath: loadedConfig.configPath,
    sessionStorePath,
    sessionState: getSessionState(sessionStorePath),
  };
}

function normalizeTelegramTarget(addressing: QueueCliAddressing): QueueCliAddressing {
  if (addressing.channel !== "telegram" || !addressing.target) {
    return addressing;
  }
  if (addressing.target.startsWith("group:")) {
    return { ...addressing, target: addressing.target.slice("group:".length) };
  }
  if (addressing.target.startsWith("topic:")) {
    const [, chatId, topicId] = addressing.target.split(":");
    return { ...addressing, target: chatId, topicId: addressing.topicId ?? topicId };
  }
  return addressing;
}

function parseQueueCliAddressing(args: string[]): QueueCliAddressing {
  if (parseOptionValue(args, "--surface") || parseOptionValue(args, "--session-key")) {
    throw new Error("Queue commands use --channel/--target addressing; --surface and --session-key are not supported.");
  }
  const channel = parseOptionValue(args, "--channel");
  if (channel && channel !== "slack" && channel !== "telegram") {
    throw new Error("--channel must be `slack` or `telegram`.");
  }
  const addressing = {
    channel: channel as QueueCliAddressing["channel"],
    target: parseOptionValue(args, "--target"),
    threadId: parseOptionValue(args, "--thread-id"),
    topicId: parseOptionValue(args, "--topic-id"),
    botId: parseOptionValue(args, "--bot") ?? parseOptionValue(args, "--account"),
    all: hasFlag(args, "--all"),
  };
  if (addressing.threadId && addressing.topicId) {
    throw new Error("Use only one of `--thread-id` or `--topic-id`.");
  }
  if (addressing.channel === "slack" && addressing.topicId) {
    throw new Error("Slack queue commands use `--thread-id`, not `--topic-id`.");
  }
  return normalizeTelegramTarget(addressing);
}

function resolveScopedContext(
  state: QueueControlState,
  addressing: QueueCliAddressing,
): QueueCliContext {
  if (!addressing.channel || !addressing.target) {
    throw new Error("--channel and --target are required for scoped queue commands.");
  }
  return resolveLoopCliContext({
    loadedConfig: state.loadedConfig,
    channel: addressing.channel,
    target: addressing.target,
    threadId: addressing.channel === "telegram" ? undefined : addressing.threadId,
    topicId:
      addressing.topicId ??
      (addressing.channel === "telegram" ? addressing.threadId : undefined),
    botId: addressing.botId,
  });
}

async function enforceQueueCreateLimit(
  state: QueueControlState,
  sessionKey: string,
) {
  const maxPending =
    state.loadedConfig.raw.control.queue?.maxPendingItemsPerSession ?? 20;
  const pendingCount =
    await state.sessionState.countPendingQueuedItemsForSessionKey(sessionKey);
  if (pendingCount >= maxPending) {
    throw new Error(
      `Session queue pending item count exceeds the configured max of \`${maxPending}\`. Clear pending queue items first.`,
    );
  }
}

function parseQueueSender(args: string[], addressing: QueueCliAddressing): StoredQueueSender {
  const sender = parseOptionValue(args, QUEUE_SENDER_FLAG)?.trim();
  if (!sender) {
    throw new Error(
      `Queue creation requires ${QUEUE_SENDER_FLAG} <principal>, for example ${QUEUE_SENDER_FLAG} telegram:1276408333 or ${QUEUE_SENDER_FLAG} slack:U1234567890.`,
    );
  }
  const [platform, ...providerParts] = sender.split(":");
  const providerId = providerParts.join(":").trim();
  if ((platform !== "slack" && platform !== "telegram") || !providerId) {
    throw new Error("--sender must be a principal like telegram:<id> or slack:<user-id>.");
  }
  if (addressing.channel && platform !== addressing.channel) {
    throw new Error(`--sender platform must match --channel ${addressing.channel}.`);
  }
  const creator = buildStoredLoopSender({
    platform,
    providerId,
    displayName: parseOptionValue(args, QUEUE_SENDER_NAME_FLAG),
    handle: parseOptionValue(args, QUEUE_SENDER_HANDLE_FLAG),
  });
  if (!creator) {
    throw new Error("--sender must include a non-empty provider id.");
  }
  return creator;
}

function assertQueueSenderMatchesContext(sender: StoredQueueSender, context: LoopCliContext) {
  const senderPlatform = sender.senderId?.split(":", 1)[0];
  if (senderPlatform && senderPlatform !== context.channel) {
    throw new Error(`--sender platform must match target channel ${context.channel}.`);
  }
}

function stripQueueArgs(args: string[]) {
  const valueFlags = new Set([
    "--channel",
    "--target",
    "--thread-id",
    "--topic-id",
    "--bot",
    "--account",
    QUEUE_SENDER_FLAG,
    QUEUE_SENDER_NAME_FLAG,
    QUEUE_SENDER_HANDLE_FLAG,
  ]);
  const remaining: string[] = [];
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === "--") {
      remaining.push(...args.slice(index + 1));
      break;
    }
    if (valueFlags.has(args[index])) {
      index += 1;
      continue;
    }
    if (args[index] !== "--all") {
      remaining.push(args[index]);
    }
  }
  return remaining;
}

function buildQueueSurfaceBinding(context: LoopCliContext) {
  return {
    platform: context.identity.platform,
    botId: context.botId,
    conversationKind: context.identity.conversationKind,
    channelId: context.identity.channelId,
    channelName: context.identity.channelName,
    chatId: context.identity.chatId,
    chatName: context.identity.chatName,
    threadTs: context.identity.threadTs,
    topicId: context.identity.topicId,
    topicName: context.identity.topicName,
  };
}

function resolveProtectedControlMutationRule(
  state: QueueControlState,
  agentId: string,
  sender: StoredQueueSender,
) {
  const auth = resolvePrincipalAuth({
    config: state.loadedConfig.raw,
    agentId,
    principal: sender.senderId,
  });
  return auth.mayManageProtectedResources ? undefined : DEFAULT_PROTECTED_CONTROL_RULE;
}

function createQueueItemForContext(params: {
  state: QueueControlState;
  context: LoopCliContext;
  promptText: string;
  sender: StoredQueueSender;
}) {
  return createStoredQueueItem({
    promptText: params.promptText,
    canonicalPromptText: params.promptText,
    protectedControlMutationRule: resolveProtectedControlMutationRule(
      params.state,
      params.context.sessionTarget.agentId,
      params.sender,
    ),
    promptSummary: params.promptText,
    createdBy: params.sender.providerId,
    sender: params.sender,
    surfaceBinding: buildQueueSurfaceBinding(params.context),
  });
}

function renderQueueInventory(params: {
  commandLabel: "list" | "status";
  sessionStorePath: string;
  queues: QueuedPromptStatus[];
}) {
  const lines = [
    `Queue ${params.commandLabel}`,
    "",
    `sessionStore: \`${params.sessionStorePath}\``,
    `items: \`${params.queues.length}\``,
    "",
  ];
  for (const item of params.queues) {
    lines.push(
      `- id: \`${item.id}\` status: \`${item.status}\` sessionKey: \`${item.sessionKey}\` queuedAt: \`${new Date(item.createdAt).toISOString()}\` prompt: \`${item.promptSummary}\``,
    );
  }
  return lines.join("\n");
}

async function listQueues(
  state: QueueControlState,
  addressing: QueueCliAddressing,
  commandLabel: "list" | "status",
) {
  const context = addressing.channel || addressing.target
    ? resolveScopedContext(state, addressing)
    : undefined;
  const sessionKey = context?.sessionTarget.sessionKey;
  const queues = await state.sessionState.listQueuedItems({
    sessionKey,
    statuses: commandLabel === "list" ? ["pending"] : ["pending", "running"],
  });
  console.log(
    renderQueueInventory({
      commandLabel,
      sessionStorePath: state.sessionStorePath,
      queues,
    }),
  );
}

async function createQueue(state: QueueControlState, args: string[]) {
  const addressing = parseQueueCliAddressing(args);
  const promptText = stripQueueArgs(args.slice(1)).join(" ").trim();
  if (!promptText) {
    throw new Error("Queue creation requires a prompt.");
  }
  const sender = parseQueueSender(args, addressing);
  if (!addressing.channel || !addressing.target) {
    throw new Error("Queue creation requires --channel/--target.");
  }
  const context = resolveScopedContext(state, addressing);
  assertQueueSenderMatchesContext(sender, context);
  const resolved = resolveAgentTarget(state.loadedConfig, context.sessionTarget);
  await enforceQueueCreateLimit(state, context.sessionTarget.sessionKey);
  const item = createQueueItemForContext({
    state,
    context,
    promptText,
    sender,
  });
  await state.sessionState.setQueuedItem(resolved, item);
  console.log(`Queued prompt \`${item.id}\` for \`${context.sessionTarget.sessionKey}\`.`);
}

async function clearQueues(state: QueueControlState, addressing: QueueCliAddressing) {
  if (addressing.all) {
    const cleared = await state.sessionState.clearAllPendingQueuedItems();
    console.log(
      `Cleared ${cleared.length} pending queued prompt${cleared.length === 1 ? "" : "s"} across the whole app.`,
    );
    return;
  }
  const context = resolveScopedContext(state, addressing);
  const sessionKey = context.sessionTarget.sessionKey;
  const cleared = await state.sessionState.clearPendingQueuedItemsForSessionKey(sessionKey);
  console.log(
    `Cleared ${cleared.length} pending queued prompt${cleared.length === 1 ? "" : "s"} for \`${sessionKey}\`.`,
  );
}

export function renderQueuesHelp() {
  return [
    "clisbot queues",
    "",
    "Usage:",
    `  ${renderCliCommand("queues list [--channel <slack|telegram> --target <route>]")}`,
    `  ${renderCliCommand("queues status [--channel <slack|telegram> --target <route>]")}`,
    `  ${renderCliCommand("queues create --channel telegram --target group:-1001234567890 --topic-id 4335 --sender telegram:1276408333 review backlog")}`,
    `  ${renderCliCommand("queues clear --channel <slack|telegram> --target <route>")}`,
    `  ${renderCliCommand("queues clear --all")}`,
    "",
    "Notes:",
    "  list shows pending queue items only; status shows pending and running queue items.",
    "  clear removes pending queue items only and does not interrupt a running prompt.",
    "  create is capped by control.queue.maxPendingItemsPerSession, default 20.",
    "  create requires explicit --channel/--target addressing plus --sender; --current is not supported.",
  ].join("\n");
}

export async function runQueuesCli(args: string[]) {
  if (args[0] === "--help" || args[0] === "help" || args.length === 0) {
    console.log(renderQueuesHelp());
    return;
  }
  const command = args[0];
  const state = await loadQueueControlState();
  if (command === "list" || command === "status") {
    await listQueues(state, parseQueueCliAddressing(args.slice(1)), command);
    return;
  }
  if (command === "create") {
    await createQueue(state, args);
    return;
  }
  if (command === "clear") {
    await clearQueues(state, parseQueueCliAddressing(args.slice(1)));
    return;
  }
  throw new Error(`Unknown queues subcommand: ${command}`);
}
