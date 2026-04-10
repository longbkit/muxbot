import { AgentService, type AgentSessionTarget } from "../agents/agent-service.ts";
import { loadConfig, type LoadedConfig } from "../config/load-config.ts";
import { resolveSlackConversationRoute } from "../channels/slack/route-config.ts";
import { resolveSlackConversationTarget } from "../channels/slack/session-routing.ts";
import { resolveTelegramConversationRoute } from "../channels/telegram/route-config.ts";
import { resolveTelegramConversationTarget } from "../channels/telegram/session-routing.ts";
import {
  resolveSlackAccountConfig,
  resolveTelegramAccountConfig,
} from "../config/channel-accounts.ts";
import {
  deleteSlackMessageAction,
  editSlackMessage,
  getSlackReactions,
  listSlackPins,
  pinSlackMessage,
  reactSlackMessage,
  readSlackMessages,
  searchSlackMessages,
  sendSlackMessage,
  sendSlackPoll,
  unpinSlackMessage,
} from "../channels/slack/message-actions.ts";
import {
  deleteTelegramMessageAction,
  editTelegramMessage,
  listTelegramPins,
  pinTelegramMessage,
  reactTelegramMessage,
  sendTelegramMessage,
  sendTelegramPoll,
  unpinTelegramMessage,
  unsupportedTelegramHistoryAction,
} from "../channels/telegram/message-actions.ts";

function getConfigPath() {
  return process.env.MUXBOT_CONFIG_PATH;
}

type MessageAction =
  | "send"
  | "poll"
  | "react"
  | "reactions"
  | "read"
  | "edit"
  | "delete"
  | "pin"
  | "unpin"
  | "pins"
  | "search";

type ParsedMessageCommand = {
  action: MessageAction;
  channel: "slack" | "telegram";
  account?: string;
  target?: string;
  message?: string;
  media?: string;
  messageId?: string;
  emoji?: string;
  remove: boolean;
  threadId?: string;
  replyTo?: string;
  limit?: number;
  query?: string;
  pollQuestion?: string;
  pollOptions: string[];
  forceDocument: boolean;
  silent: boolean;
  json: boolean;
};

type MessageCliDependencies = {
  loadConfig: (
    configPath?: string,
  ) => Promise<{
    raw: {
      channels: {
        slack: unknown;
        telegram: unknown;
      };
    };
  }>;
  resolveSlackAccountConfig: (
    config: unknown,
    accountId?: string | null,
  ) => { accountId: string; config: { appToken: string; botToken: string } };
  resolveTelegramAccountConfig: (
    config: unknown,
    accountId?: string | null,
  ) => { accountId: string; config: { botToken: string } };
  slack: {
    send: (params: unknown) => Promise<unknown>;
    poll: (params: unknown) => Promise<unknown>;
    react: (params: unknown) => Promise<unknown>;
    reactions: (params: unknown) => Promise<unknown>;
    read: (params: unknown) => Promise<unknown>;
    edit: (params: unknown) => Promise<unknown>;
    delete: (params: unknown) => Promise<unknown>;
    pin: (params: unknown) => Promise<unknown>;
    unpin: (params: unknown) => Promise<unknown>;
    pins: (params: unknown) => Promise<unknown>;
    search: (params: unknown) => Promise<unknown>;
  };
  telegram: {
    send: (params: unknown) => Promise<unknown>;
    poll: (params: unknown) => Promise<unknown>;
    react: (params: unknown) => Promise<unknown>;
    edit: (params: unknown) => Promise<unknown>;
    delete: (params: unknown) => Promise<unknown>;
    pin: (params: unknown) => Promise<unknown>;
    unpin: (params: unknown) => Promise<unknown>;
    pins: (params: unknown) => Promise<unknown>;
    unsupported: (action: string) => Promise<unknown>;
  };
  print: (text: string) => void;
  recordConversationReply: (params: {
    loadedConfig: LoadedConfig;
    target: AgentSessionTarget;
  }) => Promise<void>;
};

const defaultMessageCliDependencies: MessageCliDependencies = {
  loadConfig,
  resolveSlackAccountConfig: resolveSlackAccountConfig as MessageCliDependencies["resolveSlackAccountConfig"],
  resolveTelegramAccountConfig:
    resolveTelegramAccountConfig as MessageCliDependencies["resolveTelegramAccountConfig"],
  slack: {
    send: sendSlackMessage as MessageCliDependencies["slack"]["send"],
    poll: sendSlackPoll as MessageCliDependencies["slack"]["poll"],
    react: reactSlackMessage as MessageCliDependencies["slack"]["react"],
    reactions: getSlackReactions as MessageCliDependencies["slack"]["reactions"],
    read: readSlackMessages as MessageCliDependencies["slack"]["read"],
    edit: editSlackMessage as MessageCliDependencies["slack"]["edit"],
    delete: deleteSlackMessageAction as MessageCliDependencies["slack"]["delete"],
    pin: pinSlackMessage as MessageCliDependencies["slack"]["pin"],
    unpin: unpinSlackMessage as MessageCliDependencies["slack"]["unpin"],
    pins: listSlackPins as MessageCliDependencies["slack"]["pins"],
    search: searchSlackMessages as MessageCliDependencies["slack"]["search"],
  },
  telegram: {
    send: sendTelegramMessage as MessageCliDependencies["telegram"]["send"],
    poll: sendTelegramPoll as MessageCliDependencies["telegram"]["poll"],
    react: reactTelegramMessage as MessageCliDependencies["telegram"]["react"],
    edit: editTelegramMessage as MessageCliDependencies["telegram"]["edit"],
    delete: deleteTelegramMessageAction as MessageCliDependencies["telegram"]["delete"],
    pin: pinTelegramMessage as MessageCliDependencies["telegram"]["pin"],
    unpin: unpinTelegramMessage as MessageCliDependencies["telegram"]["unpin"],
    pins: listTelegramPins as MessageCliDependencies["telegram"]["pins"],
    unsupported:
      unsupportedTelegramHistoryAction as MessageCliDependencies["telegram"]["unsupported"],
  },
  print: (text) => console.log(text),
  recordConversationReply: async ({ loadedConfig, target }) => {
    const agentService = new AgentService(loadedConfig);
    await agentService.recordConversationReply(target);
  },
};

function normalizeSlackFollowUpTarget(rawTarget: string) {
  const target = rawTarget.trim();
  if (!target) {
    return null;
  }

  if (target.startsWith("channel:")) {
    return {
      conversationKind: "channel" as const,
      channelId: target.slice("channel:".length),
      channelType: "channel" as const,
    };
  }

  if (target.startsWith("group:")) {
    return {
      conversationKind: "group" as const,
      channelId: target.slice("group:".length),
      channelType: "mpim" as const,
    };
  }

  if (target.startsWith("dm:")) {
    return {
      conversationKind: "dm" as const,
      channelId: target.slice("dm:".length),
      channelType: "im" as const,
    };
  }

  if (target.startsWith("user:")) {
    return null;
  }

  const rawId = target;
  if (rawId.startsWith("D")) {
    return {
      conversationKind: "dm" as const,
      channelId: rawId,
      channelType: "im" as const,
    };
  }
  if (rawId.startsWith("G")) {
    return {
      conversationKind: "group" as const,
      channelId: rawId,
      channelType: "mpim" as const,
    };
  }
  if (rawId.startsWith("C")) {
    return {
      conversationKind: "channel" as const,
      channelId: rawId,
      channelType: "channel" as const,
    };
  }

  return null;
}

function resolveSlackReplyTarget(params: {
  loadedConfig: LoadedConfig;
  command: ParsedMessageCommand;
  accountId: string;
}): AgentSessionTarget | null {
  if (!params.command.target) {
    return null;
  }

  const normalized = normalizeSlackFollowUpTarget(params.command.target);
  if (!normalized) {
    return null;
  }

  const resolved = resolveSlackConversationRoute(
    params.loadedConfig,
    {
      channel_type: normalized.channelType,
      channel: normalized.channelId,
    },
    {
      accountId: params.accountId,
    },
  );
  if (!resolved.route) {
    return null;
  }

  return resolveSlackConversationTarget({
    loadedConfig: params.loadedConfig,
    agentId: resolved.route.agentId,
    accountId: params.accountId,
    channelId: normalized.channelId,
    conversationKind: normalized.conversationKind,
    threadTs: params.command.threadId ?? params.command.replyTo,
    messageTs: params.command.replyTo ?? params.command.threadId,
    replyToMode: resolved.route.replyToMode,
  });
}

function resolveTelegramReplyTarget(params: {
  loadedConfig: LoadedConfig;
  command: ParsedMessageCommand;
  accountId: string;
}): AgentSessionTarget | null {
  if (!params.command.target) {
    return null;
  }

  const chatId = Number(params.command.target);
  if (!Number.isFinite(chatId)) {
    return null;
  }

  const topicId = params.command.threadId ? Number(params.command.threadId) : undefined;
  const dm = chatId > 0;
  const resolved = resolveTelegramConversationRoute({
    loadedConfig: params.loadedConfig,
    chatType: dm ? "private" : "supergroup",
    chatId,
    topicId: Number.isFinite(topicId) ? topicId : undefined,
    isForum: Number.isFinite(topicId),
    accountId: params.accountId,
  });
  if (!resolved.route) {
    return null;
  }

  return resolveTelegramConversationTarget({
    loadedConfig: params.loadedConfig,
    agentId: resolved.route.agentId,
    accountId: params.accountId,
    chatId,
    userId: dm ? chatId : undefined,
    conversationKind:
      resolved.conversationKind === "topic"
        ? "topic"
        : resolved.conversationKind === "dm"
        ? "dm"
        : "group",
    topicId: Number.isFinite(topicId) ? topicId : undefined,
  });
}

function resolveConversationReplyTarget(params: {
  loadedConfig: LoadedConfig;
  command: ParsedMessageCommand;
  accountId: string;
}) {
  if (params.command.action !== "send" && params.command.action !== "poll") {
    return null;
  }

  if (params.command.channel === "slack") {
    return resolveSlackReplyTarget(params);
  }

  return resolveTelegramReplyTarget(params);
}

function parseRepeatedOption(args: string[], name: string) {
  const values: string[] = [];
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] !== name) {
      continue;
    }
    const value = args[index + 1]?.trim();
    if (!value) {
      throw new Error(`Missing value for ${name}`);
    }
    values.push(value);
  }
  return values;
}

function parseOptionValue(args: string[], name: string) {
  const values = parseRepeatedOption(args, name);
  return values.length > 0 ? values.at(-1) : undefined;
}

function parseIntegerOption(args: string[], name: string) {
  const raw = parseOptionValue(args, name);
  if (!raw) {
    return undefined;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${name} requires a number`);
  }
  return parsed;
}

function hasFlag(args: string[], name: string) {
  return args.includes(name);
}

function parseMessageCommand(args: string[]): ParsedMessageCommand | null {
  const rawAction = args[0];
  if (!rawAction || rawAction === "--help" || rawAction === "-h" || rawAction === "help") {
    return null;
  }
  const action = rawAction as MessageAction;
  const rest = args.slice(1);
  const channel = parseOptionValue(rest, "--channel");
  if (channel !== "slack" && channel !== "telegram") {
    throw new Error("--channel <slack|telegram> is required");
  }

  return {
    action,
    channel,
    account: parseOptionValue(rest, "--account"),
    target: parseOptionValue(rest, "--target"),
    message: parseOptionValue(rest, "--message") ?? parseOptionValue(rest, "-m"),
    media: parseOptionValue(rest, "--media"),
    messageId: parseOptionValue(rest, "--message-id"),
    emoji: parseOptionValue(rest, "--emoji"),
    remove: hasFlag(rest, "--remove"),
    threadId: parseOptionValue(rest, "--thread-id"),
    replyTo: parseOptionValue(rest, "--reply-to"),
    limit: parseIntegerOption(rest, "--limit"),
    query: parseOptionValue(rest, "--query"),
    pollQuestion: parseOptionValue(rest, "--poll-question"),
    pollOptions: parseRepeatedOption(rest, "--poll-option"),
    forceDocument: hasFlag(rest, "--force-document"),
    silent: hasFlag(rest, "--silent"),
    json: hasFlag(rest, "--json"),
  };
}

export function renderMessageHelp() {
  return [
    "muxbot message",
    "",
    "Usage:",
    "  muxbot message send --channel <slack|telegram> --target <dest> --message <text> [--account <id>] [--media <path-or-url>] [--reply-to <id>] [--thread-id <id>] [--force-document] [--silent]",
    "  muxbot message poll --channel <slack|telegram> --target <dest> --poll-question <text> --poll-option <value> [--poll-option <value>] [--account <id>] [--thread-id <id>] [--silent]",
    "  muxbot message react --channel <slack|telegram> --target <dest> --message-id <id> --emoji <emoji> [--account <id>] [--remove]",
    "  muxbot message reactions --channel <slack|telegram> --target <dest> --message-id <id> [--account <id>]",
    "  muxbot message read --channel <slack|telegram> --target <dest> [--account <id>] [--limit <n>]",
    "  muxbot message edit --channel <slack|telegram> --target <dest> --message-id <id> --message <text> [--account <id>]",
    "  muxbot message delete --channel <slack|telegram> --target <dest> --message-id <id> [--account <id>]",
    "  muxbot message pin --channel <slack|telegram> --target <dest> --message-id <id> [--account <id>]",
    "  muxbot message unpin --channel <slack|telegram> --target <dest> [--message-id <id>] [--account <id>]",
    "  muxbot message pins --channel <slack|telegram> --target <dest> [--account <id>]",
    "  muxbot message search --channel <slack|telegram> --target <dest> --query <text> [--account <id>] [--limit <n>]",
  ].join("\n");
}

function assertTarget(command: ParsedMessageCommand) {
  if (!command.target) {
    throw new Error("--target is required");
  }
}

async function runSlackMessageCommand(
  command: ParsedMessageCommand,
  dependencies: MessageCliDependencies,
) {
  const loadedConfig = await dependencies.loadConfig(getConfigPath());
  const account = dependencies.resolveSlackAccountConfig(
    loadedConfig.raw.channels.slack,
    command.account,
  );
  const shared = {
    botToken: account.config.botToken,
    target: command.target!,
    threadId: command.threadId,
    replyTo: command.replyTo,
    message: command.message,
    media: command.media,
    messageId: command.messageId,
    emoji: command.emoji,
    remove: command.remove,
    limit: command.limit,
    query: command.query,
    pollQuestion: command.pollQuestion,
    pollOptions: command.pollOptions,
  };

  switch (command.action) {
    case "send":
      return {
        loadedConfig,
        accountId: account.accountId,
        result: await dependencies.slack.send(shared),
      };
    case "poll":
      return {
        loadedConfig,
        accountId: account.accountId,
        result: await dependencies.slack.poll(shared),
      };
    case "react":
      return { loadedConfig, accountId: account.accountId, result: await dependencies.slack.react(shared) };
    case "reactions":
      return { loadedConfig, accountId: account.accountId, result: await dependencies.slack.reactions(shared) };
    case "read":
      return { loadedConfig, accountId: account.accountId, result: await dependencies.slack.read(shared) };
    case "edit":
      return { loadedConfig, accountId: account.accountId, result: await dependencies.slack.edit(shared) };
    case "delete":
      return { loadedConfig, accountId: account.accountId, result: await dependencies.slack.delete(shared) };
    case "pin":
      return { loadedConfig, accountId: account.accountId, result: await dependencies.slack.pin(shared) };
    case "unpin":
      return { loadedConfig, accountId: account.accountId, result: await dependencies.slack.unpin(shared) };
    case "pins":
      return { loadedConfig, accountId: account.accountId, result: await dependencies.slack.pins(shared) };
    case "search":
      return { loadedConfig, accountId: account.accountId, result: await dependencies.slack.search(shared) };
  }
}

async function runTelegramMessageCommand(
  command: ParsedMessageCommand,
  dependencies: MessageCliDependencies,
) {
  const loadedConfig = await dependencies.loadConfig(getConfigPath());
  const account = dependencies.resolveTelegramAccountConfig(
    loadedConfig.raw.channels.telegram,
    command.account,
  );
  const shared = {
    botToken: account.config.botToken,
    target: command.target!,
    threadId: command.threadId,
    replyTo: command.replyTo,
    message: command.message,
    media: command.media,
    messageId: command.messageId,
    emoji: command.emoji,
    remove: command.remove,
    limit: command.limit,
    query: command.query,
    pollQuestion: command.pollQuestion,
    pollOptions: command.pollOptions,
    forceDocument: command.forceDocument,
    silent: command.silent,
  };

  switch (command.action) {
    case "send":
      return {
        loadedConfig,
        accountId: account.accountId,
        result: await dependencies.telegram.send(shared),
      };
    case "poll":
      return {
        loadedConfig,
        accountId: account.accountId,
        result: await dependencies.telegram.poll(shared),
      };
    case "react":
      return { loadedConfig, accountId: account.accountId, result: await dependencies.telegram.react(shared) };
    case "reactions":
      return { loadedConfig, accountId: account.accountId, result: await dependencies.telegram.unsupported("reactions") };
    case "read":
      return { loadedConfig, accountId: account.accountId, result: await dependencies.telegram.unsupported("read") };
    case "edit":
      return { loadedConfig, accountId: account.accountId, result: await dependencies.telegram.edit(shared) };
    case "delete":
      return { loadedConfig, accountId: account.accountId, result: await dependencies.telegram.delete(shared) };
    case "pin":
      return { loadedConfig, accountId: account.accountId, result: await dependencies.telegram.pin(shared) };
    case "unpin":
      return { loadedConfig, accountId: account.accountId, result: await dependencies.telegram.unpin(shared) };
    case "pins":
      return { loadedConfig, accountId: account.accountId, result: await dependencies.telegram.pins(shared) };
    case "search":
      return { loadedConfig, accountId: account.accountId, result: await dependencies.telegram.unsupported("search") };
  }
}

export async function runMessageCli(
  args: string[],
  dependencies: MessageCliDependencies = defaultMessageCliDependencies,
) {
  const command = parseMessageCommand(args);
  if (!command) {
    dependencies.print(renderMessageHelp());
    return;
  }
  assertTarget(command);

  const execution = command.channel === "slack"
    ? await runSlackMessageCommand(command, dependencies)
    : await runTelegramMessageCommand(command, dependencies);

  const replyTarget = resolveConversationReplyTarget({
    loadedConfig: execution.loadedConfig,
    command,
    accountId: execution.accountId,
  });
  if (replyTarget) {
    await dependencies.recordConversationReply({
      loadedConfig: execution.loadedConfig,
      target: replyTarget,
    });
  }

  if (command.json) {
    dependencies.print(JSON.stringify(execution.result, null, 2));
    return;
  }

  dependencies.print(JSON.stringify(execution.result, null, 2));
}
