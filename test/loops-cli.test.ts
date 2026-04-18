import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { clisbotConfigSchema } from "../src/config/schema.ts";
import { renderDefaultConfigTemplate } from "../src/config/template.ts";
import { runLoopsCli } from "../src/control/loops-cli.ts";

function buildConfig(params: {
  socketPath: string;
  storePath: string;
  workspaceTemplate: string;
}) {
  const config = clisbotConfigSchema.parse(JSON.parse(renderDefaultConfigTemplate()));
  config.app.session.storePath = params.storePath;
  config.agents.defaults.workspace = params.workspaceTemplate;
  config.agents.defaults.runner.defaults.tmux.socketPath = params.socketPath;
  config.agents.defaults.runner.defaults.trustWorkspace = false;
  config.agents.defaults.runner.defaults.startupDelayMs = 1;
  config.agents.defaults.runner.defaults.promptSubmitDelayMs = 1;
  config.agents.defaults.runner.defaults.stream.captureLines = 80;
  config.agents.defaults.runner.defaults.stream.updateIntervalMs = 1000;
  config.agents.defaults.runner.defaults.stream.idleTimeoutMs = 60_000;
  config.agents.defaults.runner.defaults.stream.noOutputTimeoutMs = 60_000;
  config.agents.defaults.runner.defaults.stream.maxRuntimeSec = 900;
  config.agents.defaults.runner.defaults.stream.maxRuntimeMin = undefined;
  config.agents.defaults.runner.defaults.stream.maxMessageChars = 4000;
  config.agents.defaults.runner.codex.sessionId = {
    create: {
      mode: "runner",
      args: [],
    },
    capture: {
      mode: "status-command",
      statusCommand: "/status",
      pattern: "session id:\\s*(.+)",
      timeoutMs: 10,
      pollIntervalMs: 1,
    },
    resume: {
      mode: "command",
      args: ["resume", "{sessionId}"],
    },
  };
  config.agents.list = [{ id: "default" }];
  config.app.control.configReload.watch = false;
  config.app.control.sessionCleanup.enabled = false;
  config.bots.slack.defaults.enabled = false;
  config.bots.telegram.defaults.enabled = false;
  return config;
}

describe("loops cli", () => {
  let tempDir = "";
  let previousConfigPath: string | undefined;
  const originalLog = console.log;

  afterEach(() => {
    process.env.CLISBOT_CONFIG_PATH = previousConfigPath;
    console.log = originalLog;
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test("list and status render the same active loop inventory", async () => {
    tempDir = mkdtempSync(join(tmpdir(), "clisbot-loops-cli-"));
    previousConfigPath = process.env.CLISBOT_CONFIG_PATH;
    process.env.CLISBOT_CONFIG_PATH = join(tempDir, "clisbot.json");
    const storePath = join(tempDir, "sessions.json");
    writeFileSync(
      process.env.CLISBOT_CONFIG_PATH,
      JSON.stringify(
        buildConfig({
          socketPath: join(tempDir, "clisbot.sock"),
          storePath,
          workspaceTemplate: join(tempDir, "workspaces", "{agentId}"),
        }),
        null,
        2,
      ),
    );
    writeFileSync(
      storePath,
      JSON.stringify(
        {
          "agent:default:slack:channel:C1:thread:100": {
            agentId: "default",
            sessionKey: "agent:default:slack:channel:C1:thread:100",
            workspacePath: join(tempDir, "workspaces", "default"),
            runnerCommand: "codex",
            intervalLoops: [
              {
                id: "loop123",
                intervalMs: 300_000,
                maxRuns: 20,
                attemptedRuns: 5,
                executedRuns: 4,
                skippedRuns: 1,
                createdAt: 1,
                updatedAt: 2,
                nextRunAt: 1_700_000_000_000,
                promptText: "check CI",
                promptSummary: "check CI",
                promptSource: "custom",
                force: false,
              },
            ],
            updatedAt: 2,
          },
        },
        null,
        2,
      ),
    );

    const logs: string[] = [];
    console.log = ((value?: unknown) => {
      logs.push(String(value ?? ""));
    }) as typeof console.log;

    await runLoopsCli(["list"]);
    const listOutput = logs.join("\n");
    expect(listOutput).toContain("clisbot loops list");
    expect(listOutput).toContain("activeLoops.global: `1`");
    expect(listOutput).toContain("loop123");
    expect(listOutput).toContain("interval: `5m`");
    expect(listOutput).toContain("session: `agent:default:slack:channel:C1:thread:100`");

    logs.length = 0;
    await runLoopsCli(["status"]);
    const statusOutput = logs.join("\n");
    expect(statusOutput).toContain("clisbot loops status");
    expect(statusOutput).toContain("activeLoops.global: `1`");
    expect(statusOutput).toContain("loop123");
    expect(statusOutput).toContain("interval: `5m`");
  });

  test("cancel <id> removes a single persisted loop", async () => {
    tempDir = mkdtempSync(join(tmpdir(), "clisbot-loops-cli-"));
    previousConfigPath = process.env.CLISBOT_CONFIG_PATH;
    process.env.CLISBOT_CONFIG_PATH = join(tempDir, "clisbot.json");
    const storePath = join(tempDir, "sessions.json");
    writeFileSync(
      process.env.CLISBOT_CONFIG_PATH,
      JSON.stringify(
        buildConfig({
          socketPath: join(tempDir, "clisbot.sock"),
          storePath,
          workspaceTemplate: join(tempDir, "workspaces", "{agentId}"),
        }),
        null,
        2,
      ),
    );
    writeFileSync(
      storePath,
      JSON.stringify(
        {
          sessionA: {
            agentId: "default",
            sessionKey: "sessionA",
            workspacePath: join(tempDir, "workspaces", "default"),
            runnerCommand: "codex",
            intervalLoops: [
              {
                id: "loop123",
                intervalMs: 300_000,
                maxRuns: 20,
                attemptedRuns: 0,
                executedRuns: 0,
                skippedRuns: 0,
                createdAt: 1,
                updatedAt: 1,
                nextRunAt: 1_700_000_000_000,
                promptText: "check CI",
                promptSummary: "check CI",
                promptSource: "custom",
                force: false,
              },
              {
                id: "loop456",
                intervalMs: 600_000,
                maxRuns: 20,
                attemptedRuns: 0,
                executedRuns: 0,
                skippedRuns: 0,
                createdAt: 1,
                updatedAt: 1,
                nextRunAt: 1_700_000_100_000,
                promptText: "check deploy",
                promptSummary: "check deploy",
                promptSource: "custom",
                force: false,
              },
            ],
            updatedAt: 1,
          },
        },
        null,
        2,
      ),
    );

    const logs: string[] = [];
    console.log = ((value?: unknown) => {
      logs.push(String(value ?? ""));
    }) as typeof console.log;

    await runLoopsCli(["cancel", "loop123"]);

    const output = logs.join("\n");
    expect(output).toContain("Cancelled loop `loop123`.");
    expect(output).toContain("activeLoops.global: `1`");

    const store = JSON.parse(readFileSync(storePath, "utf8")) as {
      sessionA: { intervalLoops: Array<{ id: string }> };
    };
    expect(store.sessionA.intervalLoops.map((loop) => loop.id)).toEqual(["loop456"]);
  });

  test("cancel --all removes every persisted loop across the app", async () => {
    tempDir = mkdtempSync(join(tmpdir(), "clisbot-loops-cli-"));
    previousConfigPath = process.env.CLISBOT_CONFIG_PATH;
    process.env.CLISBOT_CONFIG_PATH = join(tempDir, "clisbot.json");
    const storePath = join(tempDir, "sessions.json");
    writeFileSync(
      process.env.CLISBOT_CONFIG_PATH,
      JSON.stringify(
        buildConfig({
          socketPath: join(tempDir, "clisbot.sock"),
          storePath,
          workspaceTemplate: join(tempDir, "workspaces", "{agentId}"),
        }),
        null,
        2,
      ),
    );
    writeFileSync(
      storePath,
      JSON.stringify(
        {
          sessionA: {
            agentId: "default",
            sessionKey: "sessionA",
            workspacePath: join(tempDir, "workspaces", "default"),
            runnerCommand: "codex",
            intervalLoops: [
              {
                id: "loop123",
                intervalMs: 300_000,
                maxRuns: 20,
                attemptedRuns: 0,
                executedRuns: 0,
                skippedRuns: 0,
                createdAt: 1,
                updatedAt: 1,
                nextRunAt: 1_700_000_000_000,
                promptText: "check CI",
                promptSummary: "check CI",
                promptSource: "custom",
                force: false,
              },
            ],
            updatedAt: 1,
          },
          sessionB: {
            agentId: "default",
            sessionKey: "sessionB",
            workspacePath: join(tempDir, "workspaces", "default"),
            runnerCommand: "codex",
            intervalLoops: [
              {
                id: "loop456",
                kind: "calendar",
                cadence: "daily",
                localTime: "07:00",
                hour: 7,
                minute: 0,
                timezone: "Asia/Ho_Chi_Minh",
                maxRuns: 20,
                attemptedRuns: 3,
                executedRuns: 3,
                skippedRuns: 0,
                createdAt: 1,
                updatedAt: 1,
                nextRunAt: 1_700_000_100_000,
                promptText: "daily summary",
                promptSummary: "daily summary",
                promptSource: "custom",
                force: false,
              },
            ],
            updatedAt: 1,
          },
        },
        null,
        2,
      ),
    );

    const logs: string[] = [];
    console.log = ((value?: unknown) => {
      logs.push(String(value ?? ""));
    }) as typeof console.log;

    await runLoopsCli(["cancel", "--all"]);

    const output = logs.join("\n");
    expect(output).toContain("Cancelled 2 active loops across the whole app.");
    expect(output).toContain("activeLoops.global: `0`");

    const store = JSON.parse(readFileSync(storePath, "utf8")) as Record<
      string,
      { intervalLoops?: unknown[] }
    >;
    expect(store.sessionA?.intervalLoops ?? []).toEqual([]);
    expect(store.sessionB?.intervalLoops ?? []).toEqual([]);
  });
});
