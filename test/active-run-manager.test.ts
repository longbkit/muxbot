import { afterEach, describe, expect, mock, spyOn, test } from "bun:test";
import { ActiveRunManager } from "../src/agents/active-run-manager.ts";
import type { AgentSessionState } from "../src/agents/session-state.ts";
import type { ResolvedAgentTarget } from "../src/agents/resolved-target.ts";
import type { RunnerSessionService } from "../src/agents/runner-session.ts";
import type { RunUpdate } from "../src/agents/run-observation.ts";
import type { TmuxClient } from "../src/runners/tmux/client.ts";

function createResolvedTarget(): ResolvedAgentTarget {
  return {
    agentId: "agent-1",
    sessionKey: "session-1",
    mainSessionKey: "session-1",
    sessionName: "tmux-agent-1",
    workspacePath: "/tmp/agent-1",
    runner: {
      command: "codex",
      args: [],
      trustWorkspace: true,
      startupDelayMs: 3000,
      promptSubmitDelayMs: 10,
      sessionId: {
        create: {
          mode: "explicit",
          args: [],
        },
        capture: {
          mode: "off",
          statusCommand: "/status",
          pattern: "",
          timeoutMs: 1000,
          pollIntervalMs: 100,
        },
        resume: {
          mode: "explicit",
          args: [],
        },
      },
    },
    stream: {
      captureLines: 200,
      updateIntervalMs: 500,
      idleTimeoutMs: 60_000,
      noOutputTimeoutMs: 60_000,
      maxRuntimeMs: 900_000,
      maxRuntimeLabel: "15 minutes",
    },
    session: {
      name: "{agentId}",
    },
  } as unknown as ResolvedAgentTarget;
}

function createUpdate(
  resolved: ResolvedAgentTarget,
  params: Partial<RunUpdate> = {},
): RunUpdate {
  return {
    status: "running",
    agentId: resolved.agentId,
    sessionKey: resolved.sessionKey,
    sessionName: resolved.sessionName,
    workspacePath: resolved.workspacePath,
    snapshot: "",
    fullSnapshot: "",
    initialSnapshot: "",
    ...params,
  };
}

function createManager(resolved: ResolvedAgentTarget) {
  return new ActiveRunManager(
    {} as TmuxClient,
    {} as AgentSessionState,
    {} as RunnerSessionService,
    () => resolved,
  );
}

function createRun(resolved: ResolvedAgentTarget, observers: Map<string, any>) {
  const update = createUpdate(resolved, { snapshot: "initial" });
  return {
    resolved,
    observers,
    observerFailures: new Map<string, number>(),
    initialResult: {
      promise: Promise.resolve(createUpdate(resolved, { status: "completed" })),
      resolve: () => {},
      reject: () => {},
      settled: false,
    },
    latestUpdate: update,
  };
}

describe("ActiveRunManager observer delivery", () => {
  afterEach(() => {
    mock.restore();
  });

  test("keeps retryable transport failures attached so later updates can recover", async () => {
    const resolved = createResolvedTarget();
    const manager = createManager(resolved);
    const consoleSpy = spyOn(console, "error").mockImplementation(() => {});
    let failingCalls = 0;
    const healthySnapshots: string[] = [];
    const run = createRun(
      resolved,
      new Map([
        [
          "flaky-telegram",
          {
            id: "flaky-telegram",
            mode: "live" as const,
            onUpdate: async (update: RunUpdate) => {
              failingCalls += 1;
              if (update.snapshot === "first update") {
                throw Object.assign(new TypeError("fetch failed"), {
                  cause: { code: "ETIMEDOUT" },
                });
              }
              healthySnapshots.push(`flaky:${update.snapshot}`);
            },
          },
        ],
        [
          "healthy-observer",
          {
            id: "healthy-observer",
            mode: "live" as const,
            onUpdate: async (update: RunUpdate) => {
              healthySnapshots.push(`healthy:${update.snapshot}`);
            },
          },
        ],
      ]),
    );

    await expect(
      (manager as any).notifyRunObservers(
        run,
        createUpdate(resolved, { snapshot: "first update" }),
      ),
    ).resolves.toBeUndefined();
    await expect(
      (manager as any).notifyRunObservers(
        run,
        createUpdate(resolved, { snapshot: "second update" }),
      ),
    ).resolves.toBeUndefined();

    expect(failingCalls).toBe(2);
    expect(run.observers.has("flaky-telegram")).toBe(true);
    expect(run.observerFailures.get("flaky-telegram")).toBeUndefined();
    expect(healthySnapshots).toEqual([
      "healthy:first update",
      "flaky:second update",
      "healthy:second update",
    ]);
    expect(consoleSpy).toHaveBeenCalledTimes(1);
  });

  test("detaches non-retryable observer failures immediately", async () => {
    const resolved = createResolvedTarget();
    const manager = createManager(resolved);
    const consoleSpy = spyOn(console, "error").mockImplementation(() => {});
    let failingCalls = 0;
    const run = createRun(
      resolved,
      new Map([
        [
          "broken-observer",
          {
            id: "broken-observer",
            mode: "live" as const,
            onUpdate: async () => {
              failingCalls += 1;
              throw new Error("cannot read property 'text' of undefined");
            },
          },
        ],
      ]),
    );

    await expect(
      (manager as any).notifyRunObservers(
        run,
        createUpdate(resolved, { snapshot: "first update" }),
      ),
    ).resolves.toBeUndefined();
    await expect(
      (manager as any).notifyRunObservers(
        run,
        createUpdate(resolved, { snapshot: "second update" }),
      ),
    ).resolves.toBeUndefined();

    expect(failingCalls).toBe(1);
    expect(run.observers.has("broken-observer")).toBe(false);
    expect(consoleSpy).toHaveBeenCalledTimes(1);
  });
});
