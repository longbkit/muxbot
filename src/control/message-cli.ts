import { AgentService, type AgentSessionTarget } from "../agents/agent-service.ts";
import { readFile } from "node:fs/promises";
import {
  loadConfig,
  type LoadConfigOptions,
  type LoadedConfig,
} from "../config/load-config.ts";
import { listChannelPlugins } from "../channels/registry.ts";
import { type ChannelPlugin } from "../channels/channel-plugin.ts";
import type { ParsedMessageCommand, MessageAction } from "../channels/message-command.ts";
import {
  parseMessageInputFormat,
  parseMessageRenderMode,
} from "../channels/message-format.ts";

function getConfigPath() {
  return process.env.CLISBOT_CONFIG_PATH;
}

type MessageCliDependencies = {
  loadConfig: (configPath?: string, options?: LoadConfigOptions) => Promise<LoadedConfig>;
  plugins: ChannelPlugin[];
  print: (text: string) => void;
    recordConversationReply: (params: {
      loadedConfig: LoadedConfig;
      target: AgentSessionTarget;
      kind?: "reply" | "progress" | "final";
      source?: "channel" | "message-tool";
    }) => Promise<void>;
};

const defaultMessageCliDependencies: MessageCliDependencies = {
  loadConfig,
  plugins: listChannelPlugins(),
  print: (text) => console.log(text),
  recordConversationReply: async ({ loadedConfig, target, kind, source }) => {
    const agentService = new AgentService(loadedConfig);
    await agentService.recordConversationReply(target, kind, source);
  },
};

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

function parseMessageBodyFileOption(args: string[]) {
  const bodyFileValues = parseRepeatedOption(args, "--body-file");
  const messageFileValues = parseRepeatedOption(args, "--message-file");
  if (bodyFileValues.length > 0 && messageFileValues.length > 0) {
    throw new Error("--body-file and --message-file are aliases; use only one");
  }
  return bodyFileValues.at(-1) ?? messageFileValues.at(-1);
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

function resolveReplyKind(command: ParsedMessageCommand) {
  if (command.final) {
    return "final" as const;
  }
  if (command.progress) {
    return "progress" as const;
  }
  return "reply" as const;
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
    messageFile: parseMessageBodyFileOption(rest),
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
    progress: hasFlag(rest, "--progress"),
    final: hasFlag(rest, "--final"),
    json: hasFlag(rest, "--json"),
    inputFormat: parseMessageInputFormat(parseOptionValue(rest, "--input")),
    renderMode: parseMessageRenderMode(parseOptionValue(rest, "--render")),
  };
}

export function renderMessageHelp() {
  return [
    "clisbot message",
    "",
    "Usage:",
    "  clisbot message send --channel <slack|telegram> --target <dest> [--message <text> | --body-file <path>] [--input <plain|md|html|mrkdwn|blocks>] [--render <native|none|html|mrkdwn|blocks>] [--account <id>] [--media <path-or-url>] [--reply-to <id>] [--thread-id <id>] [--force-document] [--silent] [--progress|--final]",
    "  clisbot message poll --channel <slack|telegram> --target <dest> --poll-question <text> --poll-option <value> [--poll-option <value>] [--account <id>] [--thread-id <id>] [--silent]",
    "  clisbot message react --channel <slack|telegram> --target <dest> --message-id <id> --emoji <emoji> [--account <id>] [--remove]",
    "  clisbot message reactions --channel <slack|telegram> --target <dest> --message-id <id> [--account <id>]",
    "  clisbot message read --channel <slack|telegram> --target <dest> [--account <id>] [--limit <n>]",
    "  clisbot message edit --channel <slack|telegram> --target <dest> --message-id <id> [--message <text> | --body-file <path>] [--input <plain|md|html|mrkdwn|blocks>] [--render <native|none|html|mrkdwn|blocks>] [--account <id>]",
    "  clisbot message delete --channel <slack|telegram> --target <dest> --message-id <id> [--account <id>]",
    "  clisbot message pin --channel <slack|telegram> --target <dest> --message-id <id> [--account <id>]",
    "  clisbot message unpin --channel <slack|telegram> --target <dest> [--message-id <id>] [--account <id>]",
    "  clisbot message pins --channel <slack|telegram> --target <dest> [--account <id>]",
    "  clisbot message search --channel <slack|telegram> --target <dest> --query <text> [--account <id>] [--limit <n>]",
    "",
    "Send/Edit Content Options:",
    "  --message <text>              Inline message body",
    "  --body-file <path>            Read the message body from a file",
    "                                Alias: --message-file (compat only)",
    "  --input <plain|md|html|mrkdwn|blocks>",
    "                               Input content format. Default: md",
    "  --render <native|none|html|mrkdwn|blocks>",
    "                               Output rendering mode. Default: native",
    "",
    "Render Rules:",
    "  native                        Channel-owned default rendering",
    "                                - Telegram: Markdown/plain -> safe HTML",
    "                                - Slack: Markdown/plain -> mrkdwn",
    "  none                          Content is already destination-native",
    "                                - Telegram: use with --input html",
    "                                - Slack: use with --input mrkdwn or blocks",
    "  blocks                        Slack only. Render Markdown into Block Kit",
    "  html                          Telegram only",
    "  mrkdwn                        Slack only",
    "",
    "Examples:",
    "  clisbot message send --channel telegram --target -1001234567890 --thread-id 42 --message \"## Status\"",
    "  clisbot message send --channel telegram --target -1001234567890 --thread-id 42 --input html --render none --message \"<b>Status</b>\"",
    "  clisbot message send --channel slack --target channel:C1234567890 --thread-id 1712345678.123456 --message \"## Status\"",
    "  clisbot message send --channel slack --target channel:C1234567890 --thread-id 1712345678.123456 --input mrkdwn --render none --message \"*Status*\"",
    "  clisbot message send --channel slack --target channel:C1234567890 --thread-id 1712345678.123456 --input blocks --render none --body-file ./reply-blocks.json",
  ].join("\n");
}

async function resolveCommandMessage(command: ParsedMessageCommand) {
  if (!command.messageFile) {
    return command;
  }
  if (command.message) {
    throw new Error("--message cannot be used together with --body-file or --message-file");
  }
  return {
    ...command,
    message: await readFile(command.messageFile, "utf8"),
  };
}

function assertTarget(command: ParsedMessageCommand) {
  if (!command.target) {
    throw new Error("--target is required");
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
  const resolvedCommand = await resolveCommandMessage(command);
  if (resolvedCommand.progress && resolvedCommand.final) {
    throw new Error("--progress and --final cannot be used together");
  }
  assertTarget(resolvedCommand);

  const loadedConfig = await dependencies.loadConfig(getConfigPath(), {
    materializeChannels: [resolvedCommand.channel],
  });
  const plugin = dependencies.plugins.find((entry) => entry.id === resolvedCommand.channel);
  if (!plugin) {
    throw new Error(`Unsupported message channel: ${resolvedCommand.channel}`);
  }

  const execution = await plugin.runMessageCommand(loadedConfig, resolvedCommand);
  const replyTarget =
    resolvedCommand.action === "send" || resolvedCommand.action === "poll"
      ? plugin.resolveMessageReplyTarget({
        loadedConfig,
        command: resolvedCommand,
        botId: execution.botId,
      })
      : null;
  if (replyTarget) {
    await dependencies.recordConversationReply({
      loadedConfig,
      target: replyTarget,
      kind: resolveReplyKind(command),
      source: "message-tool",
    });
  }

  if (command.json) {
    dependencies.print(JSON.stringify(execution.result, null, 2));
    return;
  }

  dependencies.print(JSON.stringify(execution.result, null, 2));
}
