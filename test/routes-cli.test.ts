import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { writeEditableConfig } from "../src/config/config-file.ts";
import { clisbotConfigSchema } from "../src/config/schema.ts";
import { renderDefaultConfigTemplate } from "../src/config/template.ts";
import { runRoutesCli } from "../src/control/routes-cli.ts";

describe("routes cli", () => {
  let tempDir = "";
  let previousConfigPath: string | undefined;
  const originalLog = console.log;

  afterEach(() => {
    console.log = originalLog;
    process.env.CLISBOT_CONFIG_PATH = previousConfigPath;
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
      tempDir = "";
    }
  });

  async function seedConfig(agentIds = ["default", "support"]) {
    const config = clisbotConfigSchema.parse(JSON.parse(renderDefaultConfigTemplate()));
    config.agents.list = agentIds.map((id) => ({ id }));
    await writeEditableConfig(process.env.CLISBOT_CONFIG_PATH!, config);
  }

  test("adds a slack channel route with the new canonical route id", async () => {
    tempDir = mkdtempSync(join(tmpdir(), "clisbot-routes-cli-"));
    previousConfigPath = process.env.CLISBOT_CONFIG_PATH;
    process.env.CLISBOT_CONFIG_PATH = join(tempDir, "clisbot.json");
    await seedConfig();
    console.log = (() => {}) as typeof console.log;

    await runRoutesCli([
      "add",
      "--channel",
      "slack",
      "channel:C1234567890",
      "--bot",
      "default",
      "--policy",
      "open",
    ]);

    const rawConfig = JSON.parse(readFileSync(process.env.CLISBOT_CONFIG_PATH!, "utf8"));
    expect(rawConfig.bots.slack.default.groups["channel:C1234567890"]).toEqual({
      enabled: true,
      requireMention: true,
      allowUsers: [],
      blockUsers: [],
      allowBots: false,
      policy: "open",
    });
  });

  test("adds a telegram topic route and allows route-local mode overrides", async () => {
    tempDir = mkdtempSync(join(tmpdir(), "clisbot-routes-cli-"));
    previousConfigPath = process.env.CLISBOT_CONFIG_PATH;
    process.env.CLISBOT_CONFIG_PATH = join(tempDir, "clisbot.json");
    await seedConfig();
    console.log = (() => {}) as typeof console.log;

    await runRoutesCli([
      "add",
      "--channel",
      "telegram",
      "topic:-1001234567890:42",
      "--bot",
      "default",
      "--policy",
      "open",
    ]);
    await runRoutesCli([
      "set-response-mode",
      "--channel",
      "telegram",
      "topic:-1001234567890:42",
      "--bot",
      "default",
      "--mode",
      "capture-pane",
    ]);
    await runRoutesCli([
      "set-agent",
      "--channel",
      "telegram",
      "topic:-1001234567890:42",
      "--bot",
      "default",
      "--agent",
      "support",
    ]);

    const rawConfig = JSON.parse(readFileSync(process.env.CLISBOT_CONFIG_PATH!, "utf8"));
    expect(rawConfig.bots.telegram.default.groups["-1001234567890"].topics["42"]).toEqual({
      enabled: true,
      requireMention: true,
      allowUsers: [],
      blockUsers: [],
      allowBots: false,
      policy: "open",
      responseMode: "capture-pane",
      agentId: "support",
    });
  });

  test("add fails with guidance when the route already exists", async () => {
    tempDir = mkdtempSync(join(tmpdir(), "clisbot-routes-cli-"));
    previousConfigPath = process.env.CLISBOT_CONFIG_PATH;
    process.env.CLISBOT_CONFIG_PATH = join(tempDir, "clisbot.json");
    await seedConfig();
    console.log = (() => {}) as typeof console.log;

    await runRoutesCli([
      "add",
      "--channel",
      "slack",
      "channel:C1234567890",
      "--bot",
      "default",
    ]);

    await expect(
      runRoutesCli([
        "add",
        "--channel",
        "slack",
        "channel:C1234567890",
        "--bot",
        "default",
      ]),
    ).rejects.toThrow("Use a matching `set-<key>` command instead.");
  });

  test("accepts route ids after option values instead of mistaking --bot values for the route", async () => {
    tempDir = mkdtempSync(join(tmpdir(), "clisbot-routes-cli-"));
    previousConfigPath = process.env.CLISBOT_CONFIG_PATH;
    process.env.CLISBOT_CONFIG_PATH = join(tempDir, "clisbot.json");
    await seedConfig();
    console.log = (() => {}) as typeof console.log;

    await runRoutesCli([
      "add",
      "--channel",
      "slack",
      "--bot",
      "default",
      "channel:C1234567890",
      "--policy",
      "open",
    ]);

    await runRoutesCli([
      "set-agent",
      "--channel",
      "slack",
      "--bot",
      "default",
      "channel:C1234567890",
      "--agent",
      "support",
    ]);

    const rawConfig = JSON.parse(readFileSync(process.env.CLISBOT_CONFIG_PATH!, "utf8"));
    expect(rawConfig.bots.slack.default.groups["channel:C1234567890"]?.agentId).toBe("support");
  });

  test("remove fails when the route does not exist", async () => {
    tempDir = mkdtempSync(join(tmpdir(), "clisbot-routes-cli-"));
    previousConfigPath = process.env.CLISBOT_CONFIG_PATH;
    process.env.CLISBOT_CONFIG_PATH = join(tempDir, "clisbot.json");
    await seedConfig();
    console.log = (() => {}) as typeof console.log;

    await expect(
      runRoutesCli([
        "remove",
        "--channel",
        "telegram",
        "group:-1001234567890",
        "--bot",
        "default",
      ]),
    ).rejects.toThrow("Unknown route: telegram/default/group:-1001234567890");
  });

  test("list rejects unknown channel filters instead of silently showing empty results", async () => {
    tempDir = mkdtempSync(join(tmpdir(), "clisbot-routes-cli-"));
    previousConfigPath = process.env.CLISBOT_CONFIG_PATH;
    process.env.CLISBOT_CONFIG_PATH = join(tempDir, "clisbot.json");
    await seedConfig();
    console.log = (() => {}) as typeof console.log;

    await expect(runRoutesCli(["list", "--channel", "discord"])).rejects.toThrow(
      "clisbot routes",
    );
  });
});
