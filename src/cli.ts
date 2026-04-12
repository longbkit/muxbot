import type {
  AgentBootstrapMode,
  AgentCliToolId,
} from "./config/agent-tool-presets.ts";
import { REPO_HELP_HINT, USER_GUIDE_DOC_PATH } from "./control/startup-bootstrap.ts";
import { collapseHomePath, getDefaultConfigPath } from "./shared/paths.ts";
import { getClisbotVersion } from "./version.ts";

export type ParsedCliCommand =
  | { name: "help" }
  | { name: "version" }
  | {
      name: "start";
      cliTool?: AgentCliToolId;
      bootstrap?: AgentBootstrapMode;
      slackAppTokenRef?: string;
      slackBotTokenRef?: string;
      telegramBotTokenRef?: string;
    }
  | { name: "restart" }
  | { name: "stop"; hard: boolean }
  | { name: "status" }
  | { name: "logs"; lines: number }
  | { name: "channels"; args: string[] }
  | { name: "message"; args: string[] }
  | { name: "agents"; args: string[] }
  | { name: "pairing"; args: string[] }
  | {
      name: "init";
      cliTool?: AgentCliToolId;
      bootstrap?: AgentBootstrapMode;
      slackAppTokenRef?: string;
      slackBotTokenRef?: string;
      telegramBotTokenRef?: string;
    }
  | { name: "serve-foreground" };

export function parseCliArgs(argv: string[]): ParsedCliCommand {
  const args = argv.slice(2);
  const command = args[0];

  if (!command || command === "help" || command === "--help" || command === "-h") {
    return { name: "help" };
  }

  if (command === "version" || command === "--version" || command === "-v") {
    return { name: "version" };
  }

  if (command === "start") {
    const options = parseBootstrapOptions(args.slice(1));
    return {
      name: "start",
      ...options,
    };
  }

  if (command === "restart") {
    return { name: "restart" };
  }

  if (command === "stop") {
    return {
      name: "stop",
      hard: args.includes("--hard"),
    };
  }

  if (command === "status") {
    return { name: "status" };
  }

  if (command === "logs") {
    return {
      name: "logs",
      lines: parseLineCount(args.slice(1)),
    };
  }

  if (command === "channels") {
    return {
      name: "channels",
      args: args.slice(1),
    };
  }

  if (command === "message") {
    return {
      name: "message",
      args: args.slice(1),
    };
  }

  if (command === "agents") {
    return {
      name: "agents",
      args: args.slice(1),
    };
  }

  if (command === "pairing") {
    return {
      name: "pairing",
      args: args.slice(1),
    };
  }

  if (command === "init") {
    const options = parseBootstrapOptions(args.slice(1));
    return {
      name: "init",
      ...options,
    };
  }

  if (command === "serve-foreground") {
    return { name: "serve-foreground" };
  }

  throw new Error(`Unknown command: ${command}`);
}

export function renderCliHelp() {
  const configPath = collapseHomePath(getDefaultConfigPath());
  return [
    `clisbot v${getClisbotVersion()}`,
    "",
    "Fastest start:",
    "  1. Export default token env vars in your shell.",
    "     Slack: SLACK_APP_TOKEN and SLACK_BOT_TOKEN",
    "     Telegram: TELEGRAM_BOT_TOKEN",
    "  2. Run one of these commands:",
    "     clisbot start --cli codex --bootstrap personal-assistant",
    "     clisbot start --cli codex --bootstrap team-assistant",
    "     clisbot start --cli claude --bootstrap personal-assistant",
    "     clisbot start --cli claude --bootstrap team-assistant",
    "  3. Use `clisbot status` to see the config path, log path, tmux socket, and runtime state.",
    "",
    "Bootstrap modes:",
    "  personal-assistant  One human gets one dedicated long-lived assistant workspace and session path.",
    "  team-assistant      One shared channel or group routes into one shared assistant workspace and session path.",
    "",
    "Default token env vars:",
    "  clisbot start uses standard env names automatically on first run.",
    "  Slack requires both SLACK_APP_TOKEN and SLACK_BOT_TOKEN.",
    "  Telegram requires TELEGRAM_BOT_TOKEN.",
    "  Only use --slack-app-token, --slack-bot-token, or --telegram-bot-token when your shell uses different env var names.",
    "",
    "Usage:",
    "  clisbot start [--cli <codex|claude>] [--bootstrap <personal-assistant|team-assistant>]",
    "               [--slack-app-token <ENV_NAME|${ENV_NAME}>] [--slack-bot-token <ENV_NAME|${ENV_NAME}>]",
    "               [--telegram-bot-token <ENV_NAME|${ENV_NAME}>]",
    "  clisbot restart",
    "  clisbot stop [--hard]",
    "  clisbot status",
    "  clisbot version",
    "  clisbot logs [--lines N]",
    "  clisbot channels <subcommand>",
    "  clisbot message <subcommand>",
    "  clisbot agents <subcommand>",
    "  clisbot pairing <subcommand>",
    "  clisbot init [--cli <codex|claude>] [--bootstrap <personal-assistant|team-assistant>]",
    "              [--slack-app-token <ENV_NAME|${ENV_NAME}>] [--slack-bot-token <ENV_NAME|${ENV_NAME}>]",
    "              [--telegram-bot-token <ENV_NAME|${ENV_NAME}>]",
    "  clis <same-command>",
    "  clisbot --help",
    "",
    "Commands:",
    `  start              Seed ${configPath} if missing, optionally create the first agent, and start clisbot in the background.`,
    "  restart            Stop the running clisbot process, then start it again.",
    "  stop               Stop the running clisbot process.",
    "  stop --hard        Stop clisbot and kill all tmux sessions on the configured clisbot socket.",
    "  status             Show runtime process, config, log, and tmux socket status.",
    "  version            Show the installed clisbot version.",
    "  logs               Print the most recent clisbot log lines.",
    "  channels           Manage channel enablement, routes, and token references in config.",
    "                     enable|disable <slack|telegram>",
    "                     add telegram-group <chatId> [--topic <topicId>] [--agent <id>] [--require-mention true|false]",
    "                     remove telegram-group <chatId> [--topic <topicId>]",
    "                     add slack-channel <channelId> [--agent <id>] [--require-mention true|false]",
    "                     remove slack-channel <channelId>",
    "                     add slack-group <groupId> [--agent <id>] [--require-mention true|false]",
    "                     remove slack-group <groupId>",
    "                     set-token <slack-app|slack-bot|telegram-bot> <value>",
    "                     clear-token <slack-app|slack-bot|telegram-bot>",
    "  message            Run provider message actions such as send, react, read, edit, delete, and pins.",
    "  agents             Manage configured agents and top-level bindings.",
    "  pairing            Run the pairing control CLI.",
    `  init               Seed ${configPath} and optionally create the first agent without starting clisbot.`,
    "  --version, -v      Show the installed clisbot version.",
    "  --help             Show this help text.",
    "",
    "Package usage:",
    "  npx clisbot start",
    "  npm install -g clisbot && clisbot start",
    "  npm install -g clisbot && clis start",
    "",
    "More info:",
    `  Docs: ${USER_GUIDE_DOC_PATH}`,
    `  ${REPO_HELP_HINT}`,
  ].join("\n");
}

function parseTokenReferenceOptions(args: string[]) {
  return {
    slackAppTokenRef: parseOptionValue(args, "--slack-app-token"),
    slackBotTokenRef: parseOptionValue(args, "--slack-bot-token"),
    telegramBotTokenRef: parseOptionValue(args, "--telegram-bot-token"),
  };
}

function parseBootstrapOptions(args: string[]) {
  return {
    cliTool: parseOptionValue(args, "--cli") as AgentCliToolId | undefined,
    bootstrap: parseOptionValue(args, "--bootstrap") as AgentBootstrapMode | undefined,
    ...parseTokenReferenceOptions(args),
  };
}

function parseOptionValue(args: string[], name: string) {
  const index = args.findIndex((arg) => arg === name);
  if (index === -1) {
    return undefined;
  }

  const value = args[index + 1]?.trim();
  if (!value) {
    throw new Error(`Missing value for ${name}`);
  }

  return value;
}

function parseLineCount(args: string[]) {
  const defaultLines = 200;
  const index = args.findIndex((arg) => arg === "--lines" || arg === "-n");
  if (index === -1) {
    return defaultLines;
  }

  const rawValue = args[index + 1];
  const parsed = Number.parseInt(rawValue ?? "", 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid line count: ${rawValue ?? ""}`);
  }

  return parsed;
}
