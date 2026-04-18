import { describe, expect, test } from "bun:test";
import {
  listSlackAccounts,
  resolveSlackAccountConfig,
  resolveTelegramAccountConfig,
} from "../src/config/channel-accounts.ts";
import { clisbotConfigSchema, type ClisbotConfig } from "../src/config/schema.ts";
import { renderDefaultConfigTemplate } from "../src/config/template.ts";

function createConfig(): ClisbotConfig {
  const config = clisbotConfigSchema.parse(
    JSON.parse(
      renderDefaultConfigTemplate({
        slackEnabled: true,
        telegramEnabled: true,
      }),
    ),
  );
  config.bots.slack.defaults.defaultBotId = "work";
  config.bots.slack.work = {
    ...config.bots.slack.default,
    appToken: "work-app",
    botToken: "work-bot",
  };
  delete config.bots.slack.default;
  config.bots.telegram.defaults.defaultBotId = "alerts";
  config.bots.telegram.alerts = {
    ...config.bots.telegram.default,
    botToken: "alerts-token",
  };
  delete config.bots.telegram.default;
  return config;
}

describe("channel accounts", () => {
  test("resolves explicit slack account config", () => {
    const config = createConfig();
    const resolved = resolveSlackAccountConfig(config.bots.slack, "work");
    expect(resolved.accountId).toBe("work");
    expect(resolved.config.botToken).toBe("work-bot");
  });

  test("falls back to root slack tokens when no account map is configured", () => {
    const config = createConfig();
    config.bots.slack.default = {
      ...config.bots.slack.work,
      appToken: "root-app",
      botToken: "root-bot",
    };
    delete config.bots.slack.work;
    config.bots.slack.defaults.defaultBotId = "default";
    const resolved = resolveSlackAccountConfig(config.bots.slack);
    expect(resolved.accountId).toBe("default");
    expect(resolved.config.botToken).toBe("root-bot");
  });

  test("resolves telegram default account config", () => {
    const config = createConfig();
    const resolved = resolveTelegramAccountConfig(config.bots.telegram);
    expect(resolved.accountId).toBe("alerts");
    expect(resolved.config.botToken).toBe("alerts-token");
  });

  test("lists only valid slack accounts", () => {
    const config = createConfig();
    config.bots.slack.empty = { ...config.bots.slack.work, appToken: "", botToken: "" };
    expect(listSlackAccounts(config.bots.slack).map((entry) => entry.accountId)).toEqual([
      "work",
    ]);
  });
});
