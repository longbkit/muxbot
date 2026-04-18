import { describe, expect, test } from "bun:test";
import {
  listSlackBots,
  resolveSlackBotCredentials,
  resolveTelegramBotCredentials,
} from "../src/config/channel-bots.ts";
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

describe("channel bots", () => {
  test("resolves explicit slack bot credentials", () => {
    const config = createConfig();
    const resolved = resolveSlackBotCredentials(config.bots.slack, "work");
    expect(resolved.botId).toBe("work");
    expect(resolved.config.botToken).toBe("work-bot");
  });

  test("falls back to root slack tokens when no bot map is configured", () => {
    const config = createConfig();
    config.bots.slack.default = {
      ...config.bots.slack.work,
      appToken: "root-app",
      botToken: "root-bot",
    };
    delete config.bots.slack.work;
    config.bots.slack.defaults.defaultBotId = "default";
    const resolved = resolveSlackBotCredentials(config.bots.slack);
    expect(resolved.botId).toBe("default");
    expect(resolved.config.botToken).toBe("root-bot");
  });

  test("resolves telegram default bot credentials", () => {
    const config = createConfig();
    const resolved = resolveTelegramBotCredentials(config.bots.telegram);
    expect(resolved.botId).toBe("alerts");
    expect(resolved.config.botToken).toBe("alerts-token");
  });

  test("lists only valid slack bots", () => {
    const config = createConfig();
    config.bots.slack.empty = { ...config.bots.slack.work, appToken: "", botToken: "" };
    expect(listSlackBots(config.bots.slack).map((entry) => entry.botId)).toEqual([
      "work",
    ]);
  });
});
