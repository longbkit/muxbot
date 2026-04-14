import { describe, expect, test } from "bun:test";
import {
  hasLiteralBootstrapCredentials,
  parseBootstrapFlags,
} from "../src/control/channel-bootstrap-flags.ts";

describe("parseBootstrapFlags", () => {
  test("maps --bot-type personal to the internal bootstrap mode", () => {
    const parsed = parseBootstrapFlags([
      "--cli",
      "gemini",
      "--bot-type",
      "personal",
      "--telegram-bot-token",
      "TELEGRAM_BOT_TOKEN",
    ]);

    expect(parsed.cliTool).toBe("gemini");
    expect(parsed.bootstrap).toBe("personal-assistant");
    expect(parsed.telegramAccounts[0]?.accountId).toBe("default");
    expect(parsed.telegramAccounts[0]?.botToken?.kind).toBe("env");
  });

  test("maps --bot-type team to the internal bootstrap mode", () => {
    const parsed = parseBootstrapFlags([
      "--bot-type",
      "team",
      "--telegram-bot-token",
      "TELEGRAM_BOT_TOKEN",
    ]);

    expect(parsed.bootstrap).toBe("team-assistant");
  });

  test("keeps --bootstrap as a compatibility alias", () => {
    const parsed = parseBootstrapFlags([
      "--bootstrap",
      "team-assistant",
      "--telegram-bot-token",
      "TELEGRAM_BOT_TOKEN",
    ]);

    expect(parsed.bootstrap).toBe("team-assistant");
  });

  test("rejects unknown bot types", () => {
    expect(() =>
      parseBootstrapFlags([
        "--bot-type",
        "ops",
        "--telegram-bot-token",
        "TELEGRAM_BOT_TOKEN",
      ]),
    ).toThrow("Invalid bot type: ops");
  });

  test("does not emit literal token warnings for raw startup tokens", () => {
    const parsed = parseBootstrapFlags([
      "--slack-app-token",
      "xapp-literal",
      "--slack-bot-token",
      "xoxb-literal",
      "--telegram-account",
      "ops",
      "--telegram-bot-token",
      "123:literal",
    ]);

    expect(parsed.literalWarnings).toEqual([]);
    expect(parsed.slackAccounts[0]?.appToken?.kind).toBe("mem");
    expect(parsed.slackAccounts[0]?.botToken?.kind).toBe("mem");
    expect(parsed.telegramAccounts[0]?.botToken?.kind).toBe("mem");
  });

  test("detects literal bootstrap credentials independently of warning output", () => {
    const raw = parseBootstrapFlags([
      "--telegram-bot-token",
      "123:literal",
    ]);
    const envOnly = parseBootstrapFlags([
      "--telegram-bot-token",
      "TELEGRAM_BOT_TOKEN",
    ]);

    expect(hasLiteralBootstrapCredentials(raw)).toBe(true);
    expect(hasLiteralBootstrapCredentials(envOnly)).toBe(false);
  });
});
