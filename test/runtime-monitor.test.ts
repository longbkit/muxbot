import { describe, expect, test } from "bun:test";
import { EventEmitter } from "node:events";
import type { ChildProcess } from "node:child_process";
import type { LoadedConfig } from "../src/config/load-config.ts";
import { clisbotConfigSchema } from "../src/config/schema.ts";
import { renderDefaultConfigTemplate } from "../src/config/template.ts";
import { serveMonitor, type RuntimeMonitorState } from "../src/control/runtime-monitor.ts";
import type { ChannelPlugin } from "../src/channels/channel-plugin.ts";

function createLoadedConfig(): LoadedConfig {
  const config = clisbotConfigSchema.parse(
    JSON.parse(
      renderDefaultConfigTemplate({
        slackEnabled: false,
        telegramEnabled: true,
      }),
    ),
  );
  config.app.session.storePath = "/tmp/sessions.json";
  config.app.control.configReload.watch = false;
  config.app.control.runtimeMonitor.restartBackoff.fastRetry = {
    delaySeconds: 5,
    maxRestarts: 1,
  };
  config.app.control.runtimeMonitor.restartBackoff.stages = [{ delayMinutes: 1, maxRestarts: 1 }];
  config.app.auth.roles.owner.users = ["telegram:1276408333"];
  config.agents.defaults.workspace = "/tmp/{agentId}";
  config.agents.defaults.runner.defaults.tmux.socketPath = "/tmp/clisbot.sock";
  config.agents.defaults.runner.defaults.startupDelayMs = 1;
  config.agents.defaults.runner.defaults.startupRetryCount = 2;
  config.agents.defaults.runner.defaults.startupRetryDelayMs = 0;
  config.agents.defaults.runner.defaults.promptSubmitDelayMs = 1;
  config.agents.defaults.runner.codex.sessionId = {
    create: { mode: "runner", args: [] },
    capture: {
      mode: "off",
      statusCommand: "/status",
      pattern: "id",
      timeoutMs: 1,
      pollIntervalMs: 1,
    },
    resume: { mode: "off", args: [] },
  };
  config.agents.defaults.runner.defaults.stream.captureLines = 10;
  config.agents.defaults.runner.defaults.stream.updateIntervalMs = 10;
  config.agents.defaults.runner.defaults.stream.idleTimeoutMs = 10;
  config.agents.defaults.runner.defaults.stream.noOutputTimeoutMs = 10;
  config.agents.defaults.runner.defaults.stream.maxRuntimeSec = 10;
  config.agents.defaults.runner.defaults.stream.maxRuntimeMin = undefined;
  config.agents.defaults.runner.defaults.stream.maxMessageChars = 100;
  config.agents.list = [{ id: "default" }];
  config.bots.defaults.dmScope = "main";
  config.bots.telegram.defaults.enabled = true;
  config.bots.telegram.defaults.defaultBotId = "alerts";
  config.bots.telegram.alerts = {
    ...config.bots.telegram.default,
    enabled: true,
    name: "alerts",
    botToken: "telegram-token",
  };
  delete config.bots.telegram.default;

  return {
    configPath: "/tmp/clisbot.json",
    processedEventsPath: "/tmp/processed-events.json",
    stateDir: "/tmp/clisbot-state",
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

describe("serveMonitor", () => {
  test("restarts with backoff and alerts owners before exhausting the configured budget", async () => {
    const states: RuntimeMonitorState[] = [];
    const sentMessages: string[] = [];
    let now = Date.parse("2026-04-15T00:00:00.000Z");
    const removed = {
      pid: false,
      runtimeCredentials: false,
    };
    let spawnCount = 0;

    const plugin: ChannelPlugin = {
      id: "telegram",
      isEnabled: () => true,
      listAccounts: () => [{ accountId: "alerts", config: {} }],
      createRuntimeService: () => {
        throw new Error("not used");
      },
      renderHealthSummary: () => "unused",
      renderActiveHealthSummary: () => "unused",
      markStartupFailure: async () => undefined,
      runMessageCommand: async (_loadedConfig, command) => {
        sentMessages.push(command.message ?? "");
        return { accountId: command.account ?? "alerts", result: { ok: true } };
      },
      resolveMessageReplyTarget: () => null,
    };

    await serveMonitor(
      {
        scriptPath: "/tmp/clisbot.js",
        configPath: "/tmp/clisbot.json",
        pidPath: "/tmp/clisbot-monitor.pid",
        statePath: "/tmp/clisbot-monitor-state.json",
        runtimeCredentialsPath: "/tmp/clisbot-runtime-credentials.json",
      },
      {
        loadConfig: async () => createLoadedConfig(),
        listChannelPlugins: () => [plugin],
        writePid: async () => undefined,
        readState: async () => null,
        writeState: async (_statePath, state) => {
          states.push(state);
        },
        removePid: () => {
          removed.pid = true;
        },
        removeRuntimeCredentials: () => {
          removed.runtimeCredentials = true;
        },
        sleep: async (ms) => {
          now += ms;
        },
        now: () => now,
        spawnChild: () => {
          spawnCount += 1;
          const child = new EventEmitter() as unknown as ChildProcess;
          (child as { pid?: number }).pid = 999000 + spawnCount;
          queueMicrotask(() => {
            (child as unknown as EventEmitter).emit("exit", 1, null);
          });
          return child;
        },
        sendSignal: (() => true) as typeof process.kill,
      },
    );

    expect(spawnCount).toBe(3);
    expect(states.some((state) => state.phase === "backoff")).toBe(true);
    expect(states.some((state) => state.restart?.mode === "fast-retry")).toBe(true);
    expect(states.some((state) => state.restart?.mode === "backoff")).toBe(true);
    expect(states.at(-1)?.phase).toBe("stopped");
    expect(sentMessages).toHaveLength(2);
    expect(sentMessages[0]).toContain("entered restart backoff");
    expect(sentMessages[1]).toContain("stopped after exhausting the configured restart budget");
    expect(removed.pid).toBe(true);
    expect(removed.runtimeCredentials).toBe(true);
  });
});
