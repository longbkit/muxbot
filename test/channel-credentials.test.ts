import { afterEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  getCanonicalTelegramBotTokenPath,
  getTelegramMemEnvName,
  materializeRuntimeChannelCredentials,
  parseTokenInput,
  setTelegramRuntimeCredential,
  validatePersistentChannelCredentials,
} from "../src/config/channel-credentials.ts";
import {
  applyBootstrapAccountsToConfig,
  deactivateExpiredMemAccounts,
} from "../src/config/channel-account-management.ts";
import { clisbotConfigSchema, type ClisbotConfig } from "../src/config/schema.ts";
import { renderDefaultConfigTemplate } from "../src/config/template.ts";

function createConfig(): ClisbotConfig {
  const config = clisbotConfigSchema.parse(
    JSON.parse(
      renderDefaultConfigTemplate({
        slackEnabled: false,
        telegramEnabled: true,
      }),
    ),
  );
  config.bots.telegram.default.botToken = "${TELEGRAM_BOT_TOKEN}";
  return config;
}

describe("channel credentials", () => {
  let tempDir = "";
  const originalHome = process.env.CLISBOT_HOME;

  afterEach(() => {
    process.env.CLISBOT_HOME = originalHome;
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
      tempDir = "";
    }
  });

  test("parses env placeholders and literal token input", () => {
    expect(parseTokenInput("TELEGRAM_BOT_TOKEN")).toEqual({
      kind: "env",
      envName: "TELEGRAM_BOT_TOKEN",
      placeholder: "${TELEGRAM_BOT_TOKEN}",
    });
    expect(parseTokenInput("${TELEGRAM_BOT_TOKEN}")).toEqual({
      kind: "env",
      envName: "TELEGRAM_BOT_TOKEN",
      placeholder: "${TELEGRAM_BOT_TOKEN}",
    });
    expect(parseTokenInput("123456:abc")).toEqual({
      kind: "mem",
      secret: "123456:abc",
    });
  });

  test("materializes credentialType=mem from the runtime credential store", () => {
    tempDir = mkdtempSync(join(tmpdir(), "clisbot-channel-credentials-"));
    process.env.CLISBOT_HOME = tempDir;
    const config = createConfig();
    config.bots.telegram.default.credentialType = "mem";
    config.bots.telegram.default.botToken = "";
    setTelegramRuntimeCredential({
      accountId: "default",
      botToken: "telegram-mem-token",
    });

    const resolved = materializeRuntimeChannelCredentials(config);
    expect(resolved.bots.telegram.default.botToken).toBe("telegram-mem-token");
  });

  test("materializes credentialType=mem from runtime env injection", () => {
    const config = createConfig();
    config.bots.telegram.default.credentialType = "mem";
    config.bots.telegram.default.botToken = "";

    const resolved = materializeRuntimeChannelCredentials(config, {
      env: {
        ...process.env,
        [getTelegramMemEnvName("default")]: "telegram-mem-env-token",
      },
    });

    expect(resolved.bots.telegram.default.botToken).toBe("telegram-mem-env-token");
  });

  test("skips missing mem accounts instead of throwing during materialization", () => {
    const config = createConfig();
    config.bots.telegram.default.credentialType = "mem";
    config.bots.telegram.default.botToken = "";

    const resolved = materializeRuntimeChannelCredentials(config);
    expect(resolved.bots.telegram.default.botToken).toBe("");
    expect(resolved.bots.telegram.default.credentialType).toBe("mem");
  });

  test("deactivates expired mem accounts and disables the channel when none remain", () => {
    const config = createConfig();
    config.bots.telegram.default.enabled = true;
    config.bots.telegram.default.credentialType = "mem";
    config.bots.telegram.default.botToken = "";

    const lines = deactivateExpiredMemAccounts(config);

    expect(lines).toEqual([
      "Disabled expired telegram/default (credentialType=mem).",
    ]);
    expect(config.bots.telegram.default.enabled).toBe(false);
    expect(config.bots.telegram.defaults.enabled).toBe(false);
    expect(config.bots.telegram.default.botToken).toBe("");
  });

  test("bootstrap account application keeps channel root tokens empty", () => {
    const config = createConfig();

    applyBootstrapAccountsToConfig(
      config,
      {
        slackAccounts: [
          {
            accountId: "default",
            appToken: {
              kind: "env",
              envName: "SLACK_APP_TOKEN",
              placeholder: "${SLACK_APP_TOKEN}",
            },
            botToken: {
              kind: "env",
              envName: "SLACK_BOT_TOKEN",
              placeholder: "${SLACK_BOT_TOKEN}",
            },
          },
        ],
        telegramAccounts: [
          {
            accountId: "default",
            botToken: {
              kind: "env",
              envName: "TELEGRAM_BOT_TOKEN",
              placeholder: "${TELEGRAM_BOT_TOKEN}",
            },
          },
        ],
      },
      { firstRun: true },
    );

    expect(config.bots.slack.default.appToken).toBe("${SLACK_APP_TOKEN}");
    expect(config.bots.slack.default.botToken).toBe("${SLACK_BOT_TOKEN}");
    expect(config.bots.telegram.default.botToken).toBe("${TELEGRAM_BOT_TOKEN}");
  });

  test("prefers the canonical credential file before env-backed fallback", () => {
    tempDir = mkdtempSync(join(tmpdir(), "clisbot-channel-credentials-"));
    process.env.CLISBOT_HOME = tempDir;
    const config = createConfig();
    const canonicalPath = getCanonicalTelegramBotTokenPath("default");
    mkdirSync(join(tempDir, "credentials", "telegram", "default"), { recursive: true });
    writeFileSync(canonicalPath, "telegram-file-token\n", { encoding: "utf8", mode: 0o600 });

    const resolved = materializeRuntimeChannelCredentials(config, {
      env: {
        ...process.env,
        TELEGRAM_BOT_TOKEN: "telegram-env-token",
      },
    });

    expect(resolved.bots.telegram.default.botToken).toBe("telegram-file-token");
  });

  test("can materialize only the requested channel credentials", () => {
    const config = createConfig();
    config.bots.slack.defaults.enabled = true;
    config.bots.slack.default.appToken = "${SLACK_APP_TOKEN}";
    config.bots.slack.default.botToken = "${SLACK_BOT_TOKEN}";

    const resolved = materializeRuntimeChannelCredentials(config, {
      env: {
        ...process.env,
        TELEGRAM_BOT_TOKEN: "telegram-env-token",
      },
      materializeChannels: ["telegram"],
    });

    expect(resolved.bots.telegram.default.botToken).toBe("telegram-env-token");
    expect(resolved.bots.slack.default?.appToken).toBe("${SLACK_APP_TOKEN}");
    expect(resolved.bots.slack.default?.botToken).toBe("${SLACK_BOT_TOKEN}");
  });

  test("rejects raw persistent config token literals", () => {
    const config = createConfig();
    config.bots.telegram.default.botToken = "123456:abc";
    expect(() => validatePersistentChannelCredentials(config)).toThrow(
      "Raw channel token literals are not allowed",
    );
  });
});
