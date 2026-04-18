import { describe, expect, test } from "bun:test";
import { resolveSlackConversationRoute } from "../src/channels/slack/route-config.ts";
import { resolveSlackConversationTarget } from "../src/channels/slack/session-routing.ts";
import type { LoadedConfig } from "../src/config/load-config.ts";
import { clisbotConfigSchema } from "../src/config/schema.ts";
import { renderDefaultConfigTemplate } from "../src/config/template.ts";

function createLoadedConfig(): LoadedConfig {
  const config = clisbotConfigSchema.parse(
    JSON.parse(
      renderDefaultConfigTemplate({
        slackEnabled: true,
        telegramEnabled: false,
      }),
    ),
  );
  config.bots.defaults.dmScope = "per-channel-peer";
  config.bots.slack.defaults.allowBots = false;
  config.bots.slack.defaults.channelPolicy = "allowlist";
  config.bots.slack.defaults.groupPolicy = "allowlist";
  config.bots.slack.defaults.streaming = "all";
  config.bots.slack.defaults.response = "final";
  config.bots.slack.defaults.responseMode = "message-tool";
  config.bots.slack.defaults.additionalMessageMode = "steer";
  config.bots.slack.defaults.verbose = "minimal";
  config.bots.slack.defaults.followUp = {
    mode: "auto",
    participationTtlMin: 5,
  };
  config.bots.slack.defaults.timezone = "UTC";
  config.bots.slack.defaults.ackReaction = ":heavy_check_mark:";
  config.bots.slack.defaults.processingStatus = {
    enabled: true,
    status: "Working...",
    loadingMessages: [],
  };
  config.bots.slack.default = {
    ...config.bots.slack.default,
    enabled: true,
    appToken: "app-token",
    botToken: "bot-token",
    directMessages: {
      "dm:*": {
        enabled: true,
        policy: "open",
        allowUsers: [],
        blockUsers: [],
        requireMention: false,
        allowBots: false,
        timezone: "America/Los_Angeles",
      },
    },
    groups: {},
  };

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

describe("Slack conversation target routing", () => {
  test("isolates direct messages by peer by default", () => {
    const target = resolveSlackConversationTarget({
      loadedConfig: createLoadedConfig(),
      agentId: "default",
      channelId: "D123",
      userId: "U123",
      messageTs: "1775291908.430139",
      threadTs: "1775291908.430139",
      conversationKind: "dm",
      replyToMode: "thread",
    });

    expect(target.sessionKey).toBe("agent:default:slack:dm:u123");
    expect(target.mainSessionKey).toBe("agent:default:main");
  });

  test("resolves timezone overrides from route config", () => {
    const config = createLoadedConfig();
    config.raw.bots.slack.default.groups["channel:C123"] = {
      enabled: true,
      requireMention: true,
      allowBots: false,
      allowUsers: [],
      blockUsers: [],
      timezone: "Asia/Ho_Chi_Minh",
    };

    const resolved = resolveSlackConversationRoute(
      config,
      { channel_type: "channel", channel: "C123" },
    );

    expect(resolved.route?.timezone).toBe("Asia/Ho_Chi_Minh");
  });

  test("inherits route verbose from channel defaults and supports overrides", () => {
    const inheritedConfig = createLoadedConfig();
    inheritedConfig.raw.bots.slack.defaults.channelPolicy = "open";
    const config = createLoadedConfig();
    config.raw.bots.slack.default.groups["channel:C123"] = {
      enabled: true,
      requireMention: true,
      allowBots: false,
      allowUsers: [],
      blockUsers: [],
      verbose: "off",
    };

    const inherited = resolveSlackConversationRoute(
      inheritedConfig,
      { channel_type: "channel", channel: "C999" },
    );
    const overridden = resolveSlackConversationRoute(
      config,
      { channel_type: "channel", channel: "C123" },
    );

    expect(inherited.route?.verbose).toBe("minimal");
    expect(overridden.route?.verbose).toBe("off");
  });

  test("defaults explicit slack channel routes to no mention requirement", () => {
    const config = createLoadedConfig();
    config.raw.bots.slack.default.groups["channel:C123"] = {
      enabled: true,
      requireMention: false,
      allowBots: false,
      allowUsers: [],
      blockUsers: [],
    };

    const resolved = resolveSlackConversationRoute(
      config,
      { channel_type: "channel", channel: "C123" },
    );

    expect(resolved.route?.requireMention).toBe(false);
  });

  test("isolates Slack channel conversations by root thread id", () => {
    const target = resolveSlackConversationTarget({
      loadedConfig: createLoadedConfig(),
      agentId: "default",
      channelId: "C123",
      userId: "U123",
      messageTs: "1775291908.430139",
      threadTs: "1775291908.430139",
      conversationKind: "channel",
      replyToMode: "thread",
    });

    expect(target.parentSessionKey).toBe("agent:default:slack:channel:c123");
    expect(target.sessionKey).toBe(
      "agent:default:slack:channel:c123:thread:1775291908.430139",
    );
  });

  test("supports explicit main-scope dm collapsing when requested", () => {
    const loadedConfig = createLoadedConfig();
    loadedConfig.raw.session.dmScope = "main";

    const target = resolveSlackConversationTarget({
      loadedConfig,
      agentId: "default",
      channelId: "D123",
      userId: "U123",
      messageTs: "1775291908.430139",
      threadTs: "1775291908.430139",
      conversationKind: "dm",
      replyToMode: "thread",
    });

    expect(target.sessionKey).toBe("agent:default:main");
  });

  test("isolates Slack multi-person direct groups as group sessions", () => {
    const target = resolveSlackConversationTarget({
      loadedConfig: createLoadedConfig(),
      agentId: "default",
      channelId: "G123",
      userId: "U123",
      messageTs: "1775291908.430139",
      threadTs: "1775291908.430139",
      conversationKind: "group",
      replyToMode: "thread",
    });

    expect(target.sessionKey).toBe("agent:default:slack:group:g123");
    expect(target.parentSessionKey).toBeUndefined();
  });

  test("no longer exposes route-local privilege command config", () => {
    const loadedConfig = createLoadedConfig();
    loadedConfig.raw.bots.slack.default.groups["channel:C123"] = {
      enabled: true,
      requireMention: true,
      allowBots: false,
      allowUsers: [],
      blockUsers: [],
    };

    const channelRoute = resolveSlackConversationRoute(loadedConfig, {
      channel_type: "channel",
      channel: "C123",
    });
    const dmRoute = resolveSlackConversationRoute(loadedConfig, {
      channel_type: "im",
      channel: "D123",
    });

    expect(channelRoute.route).toBeTruthy();
    expect("privilegeCommands" in (channelRoute.route ?? {})).toBe(false);
    expect("privilegeCommands" in (dmRoute.route ?? {})).toBe(false);
  });

  test("uses bot fallback agent when route agent is not overridden", () => {
    const loadedConfig = createLoadedConfig();
    loadedConfig.raw.bots.slack.defaults.channelPolicy = "open";
    loadedConfig.raw.bots.slack.default.agentId = "bound-agent";

    const channelRoute = resolveSlackConversationRoute(loadedConfig, {
      channel_type: "channel",
      channel: "C123",
    });

    expect(channelRoute.route?.agentId).toBe("bound-agent");
  });

  test("uses agent responseMode when the route does not override it", () => {
    const loadedConfig = createLoadedConfig();
    loadedConfig.raw.bots.slack.defaults.channelPolicy = "open";
    loadedConfig.raw.agents.list = [
      {
        id: "default",
        responseMode: "capture-pane",
      },
    ];

    const channelRoute = resolveSlackConversationRoute(loadedConfig, {
      channel_type: "channel",
      channel: "C123",
    });

    expect(channelRoute.route?.responseMode).toBe("capture-pane");
  });

  test("uses agent additionalMessageMode when the route does not override it", () => {
    const loadedConfig = createLoadedConfig();
    loadedConfig.raw.bots.slack.defaults.channelPolicy = "open";
    loadedConfig.raw.agents.list = [
      {
        id: "default",
        additionalMessageMode: "queue",
      },
    ];

    const channelRoute = resolveSlackConversationRoute(loadedConfig, {
      channel_type: "channel",
      channel: "C123",
    });

    expect(channelRoute.route?.additionalMessageMode).toBe("queue");
  });

  test("uses account-specific slack bot fallback when the bot id is provided", () => {
    const loadedConfig = createLoadedConfig();
    loadedConfig.raw.bots.slack.defaults.channelPolicy = "open";
    loadedConfig.raw.bots.slack.ops = {
      enabled: true,
      appToken: "ops-app-token",
      botToken: "ops-bot-token",
      agentId: "ops-agent",
      groups: {},
      directMessages: {},
    };

    const channelRoute = resolveSlackConversationRoute(
      loadedConfig,
      {
        channel_type: "channel",
        channel: "C123",
      },
      {
        accountId: "ops",
      },
    );

    expect(channelRoute.route?.agentId).toBe("ops-agent");
  });
});
