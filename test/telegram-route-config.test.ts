import { describe, expect, test } from "bun:test";
import { resolveTelegramConversationRoute } from "../src/channels/telegram/route-config.ts";
import { resolveTelegramConversationTarget } from "../src/channels/telegram/session-routing.ts";
import type { LoadedConfig } from "../src/config/load-config.ts";
import { clisbotConfigSchema } from "../src/config/schema.ts";
import { renderDefaultConfigTemplate } from "../src/config/template.ts";

function createLoadedConfig(): LoadedConfig {
  const config = clisbotConfigSchema.parse(
    JSON.parse(
      renderDefaultConfigTemplate({
        slackEnabled: false,
        telegramEnabled: true,
      }),
    ),
  );
  config.bots.defaults.dmScope = "per-channel-peer";
  config.bots.telegram.defaults.allowBots = false;
  config.bots.telegram.defaults.groupPolicy = "allowlist";
  config.bots.telegram.defaults.streaming = "all";
  config.bots.telegram.defaults.response = "final";
  config.bots.telegram.defaults.responseMode = "message-tool";
  config.bots.telegram.defaults.additionalMessageMode = "steer";
  config.bots.telegram.defaults.verbose = "minimal";
  config.bots.telegram.defaults.followUp = {
    mode: "auto",
    participationTtlMin: 5,
  };
  config.bots.telegram.defaults.timezone = "UTC";
  config.bots.telegram.default = {
    ...config.bots.telegram.default,
    enabled: true,
    botToken: "telegram-token",
    groups: {
      "-1001": {
        enabled: true,
        requireMention: true,
        allowBots: false,
        agentId: "default",
        allowUsers: [],
        blockUsers: [],
        topics: {
          "4": {
            enabled: true,
            requireMention: false,
            allowBots: false,
            agentId: "claude",
            allowUsers: [],
            blockUsers: [],
            verbose: "off",
            timezone: "Asia/Ho_Chi_Minh",
          },
        },
      },
    },
    directMessages: {
      "dm:*": {
        enabled: true,
        policy: "open",
        allowUsers: [],
        blockUsers: [],
        requireMention: false,
        allowBots: false,
        agentId: "default",
      },
    },
  };
  config.agents.list = [{ id: "default" }, { id: "claude" }];

  return {
    configPath: "/tmp/clisbot.json",
    processedEventsPath: "/tmp/processed.json",
    stateDir: "/tmp",
    raw: {
      ...config,
      session: {
        ...config.app.session,
        dmScope: config.bots.defaults.dmScope,
      },
      control: config.app.control,
      tmux: config.agents.defaults.runner.defaults.tmux,
    },
  };
}

describe("Telegram route resolution", () => {
  test("resolves forum topic overrides from parent group config", () => {
    const resolved = resolveTelegramConversationRoute({
      loadedConfig: createLoadedConfig(),
      chatType: "supergroup",
      chatId: -1001,
      topicId: 4,
      isForum: true,
    });

    expect(resolved.conversationKind).toBe("topic");
    expect(resolved.route?.agentId).toBe("claude");
    expect(resolved.route?.requireMention).toBe(false);
    expect(resolved.route?.verbose).toBe("off");
    expect(resolved.route?.timezone).toBe("Asia/Ho_Chi_Minh");
    expect("privilegeCommands" in (resolved.route ?? {})).toBe(false);
  });

  test("uses agent additionalMessageMode when the route does not override it", () => {
    const loadedConfig = createLoadedConfig();
    loadedConfig.raw.bots.telegram.defaults.groupPolicy = "open";
    loadedConfig.raw.agents.list = [
      {
        id: "default",
        additionalMessageMode: "queue",
      },
    ];

    const resolved = resolveTelegramConversationRoute({
      loadedConfig,
      chatType: "supergroup",
      chatId: -2001,
      isForum: false,
    });

    expect(resolved.route?.additionalMessageMode).toBe("queue");
  });

  test("inherits telegram route verbose from channel defaults", () => {
    const resolved = resolveTelegramConversationRoute({
      loadedConfig: createLoadedConfig(),
      chatType: "private",
      chatId: 123,
    });

    expect(resolved.route?.verbose).toBe("minimal");
  });

  test("isolates forum topics by topic id", () => {
    const target = resolveTelegramConversationTarget({
      loadedConfig: createLoadedConfig(),
      agentId: "claude",
      chatId: -1001,
      userId: 123,
      conversationKind: "topic",
      topicId: 4,
    });

    expect(target.sessionKey).toBe("agent:claude:telegram:group:-1001:topic:4");
  });

  test("isolates direct messages by peer by default", () => {
    const target = resolveTelegramConversationTarget({
      loadedConfig: createLoadedConfig(),
      agentId: "default",
      chatId: 12345,
      userId: 12345,
      conversationKind: "dm",
    });

    expect(target.sessionKey).toBe("agent:default:telegram:dm:12345");
  });

  test("does not expose route-local privilege commands anymore", () => {
    const resolved = resolveTelegramConversationRoute({
      loadedConfig: createLoadedConfig(),
      chatType: "private",
      chatId: 12345,
      isForum: false,
    });

    expect("privilegeCommands" in (resolved.route ?? {})).toBe(false);
  });

  test("uses bot fallback agent when route agent is not overridden", () => {
    const loadedConfig = createLoadedConfig();
    loadedConfig.raw.bots.telegram.default.directMessages["dm:*"]!.agentId = undefined;
    loadedConfig.raw.bots.telegram.default.agentId = "bound-agent";

    const resolved = resolveTelegramConversationRoute({
      loadedConfig,
      chatType: "private",
      chatId: 12345,
      isForum: false,
    });

    expect(resolved.route?.agentId).toBe("bound-agent");
  });

  test("uses account-specific telegram bot fallback when the bot id is provided", () => {
    const loadedConfig = createLoadedConfig();
    loadedConfig.raw.bots.telegram.ops = {
      enabled: true,
      botToken: "ops-telegram-token",
      agentId: "ops-agent",
      directMessages: {
        "dm:*": {
          enabled: true,
          policy: "open",
          allowUsers: [],
          blockUsers: [],
          requireMention: false,
          allowBots: false,
        },
      },
      groups: {},
    };

    const resolved = resolveTelegramConversationRoute({
      loadedConfig,
      chatType: "private",
      chatId: 12345,
      isForum: false,
      accountId: "ops",
    });

    expect(resolved.route?.agentId).toBe("ops-agent");
  });
});
