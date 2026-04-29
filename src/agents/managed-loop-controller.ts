import {
  computeNextCalendarLoopRunAtMs,
  type LoopCalendarCadence,
} from "./loop-command.ts";
import {
  createStoredCalendarLoop,
  createStoredIntervalLoop,
} from "./loop-control-shared.ts";
import type {
  IntervalLoopStatus,
  StoredLoop,
  StoredLoopSender,
  StoredLoopSurfaceBinding,
} from "./loop-state.ts";
import type { RunUpdate } from "./run-observation.ts";
import type { AgentSessionTarget, ResolvedAgentTarget } from "./resolved-target.ts";
import { AgentSessionState } from "./session-state.ts";
import { SurfaceRuntime } from "./surface-runtime.ts";

type LoopConfig = {
  maxRunsPerLoop: number;
  maxActiveLoops: number;
};

type ManagedIntervalLoop = {
  target: AgentSessionTarget;
  loop: StoredLoop;
  timer?: ReturnType<typeof setTimeout>;
};

type PromptQueueResult = {
  positionAhead: number;
  result: Promise<RunUpdate>;
  persisted?: Promise<void>;
};

type LoopControllerDeps = {
  sessionState: AgentSessionState;
  surfaceRuntime: SurfaceRuntime;
  getLoopConfig: () => LoopConfig;
  resolveTarget: (target: AgentSessionTarget) => ResolvedAgentTarget;
  isSessionBusy: (target: AgentSessionTarget) => Promise<boolean>;
  enqueuePrompt: (
    target: AgentSessionTarget,
    prompt: string | (() => string),
    callbacks: {
      observerId?: string;
      onUpdate: (update: RunUpdate) => Promise<void> | void;
    },
  ) => PromptQueueResult;
  shouldSuppressShutdownError: (error: unknown) => boolean;
};

export type CreateIntervalLoopParams = {
  target: AgentSessionTarget;
  promptText: string;
  canonicalPromptText?: string;
  protectedControlMutationRule?: string;
  promptSummary: string;
  promptSource: "custom" | "LOOP.md";
  surfaceBinding?: StoredLoopSurfaceBinding;
  intervalMs: number;
  maxRuns: number;
  createdBy?: string;
  sender?: StoredLoopSender;
  force: boolean;
};

export type CreateCalendarLoopParams = {
  target: AgentSessionTarget;
  promptText: string;
  canonicalPromptText?: string;
  protectedControlMutationRule?: string;
  promptSummary: string;
  promptSource: "custom" | "LOOP.md";
  surfaceBinding?: StoredLoopSurfaceBinding;
  cadence: LoopCalendarCadence;
  dayOfWeek?: number;
  localTime: string;
  hour: number;
  minute: number;
  timezone: string;
  maxRuns: number;
  createdBy?: string;
  sender?: StoredLoopSender;
};

export class ManagedLoopController {
  private loopTimers = new Set<ReturnType<typeof setTimeout>>();
  private intervalLoops = new Map<string, ManagedIntervalLoop>();

  constructor(private readonly deps: LoopControllerDeps) {}

  clear() {
    for (const managed of this.intervalLoops.values()) {
      if (managed.timer) {
        clearTimeout(managed.timer);
      }
    }
    this.intervalLoops.clear();
    for (const timer of this.loopTimers) {
      clearTimeout(timer);
    }
    this.loopTimers.clear();
  }

  async reconcilePersistedIntervalLoops() {
    const persistedLoops = await this.deps.sessionState.listIntervalLoops();
    const persistedIds = new Set<string>();
    for (const persisted of persistedLoops) {
      persistedIds.add(persisted.id);
      if (persisted.attemptedRuns >= persisted.maxRuns) {
        this.dropManagedIntervalLoop(persisted.id);
        continue;
      }
      if (this.intervalLoops.has(persisted.id)) {
        continue;
      }
      this.intervalLoops.set(persisted.id, {
        target: {
          agentId: persisted.agentId,
          sessionKey: persisted.sessionKey,
        },
        loop: persisted,
      });
      this.scheduleIntervalLoopTimer(
        persisted.id,
        Math.max(0, persisted.nextRunAt - Date.now()),
      );
    }

    for (const loopId of this.intervalLoops.keys()) {
      if (!persistedIds.has(loopId)) {
        this.dropManagedIntervalLoop(loopId);
      }
    }
  }

  async createIntervalLoop(params: CreateIntervalLoopParams) {
    this.assertActiveLoopCapacity();
    const loop = createStoredIntervalLoop(params);
    await this.deps.sessionState.setIntervalLoop(
      this.deps.resolveTarget(params.target),
      loop,
    );
    this.intervalLoops.set(loop.id, {
      target: params.target,
      loop,
    });
    await this.runIntervalLoopIteration(loop.id, {
      notifyStart: false,
    });
    return this.getIntervalLoop(loop.id);
  }

  async createCalendarLoop(params: CreateCalendarLoopParams) {
    this.assertActiveLoopCapacity();
    const loop = createStoredCalendarLoop(params);
    await this.deps.sessionState.setIntervalLoop(
      this.deps.resolveTarget(params.target),
      loop,
    );
    this.intervalLoops.set(loop.id, {
      target: params.target,
      loop,
    });
    this.scheduleIntervalLoopTimer(loop.id, Math.max(0, loop.nextRunAt - Date.now()));
    return this.getIntervalLoop(loop.id);
  }

  async cancelIntervalLoop(loopId: string) {
    const managed = this.intervalLoops.get(loopId);
    if (!managed) {
      return false;
    }

    if (managed.timer) {
      clearTimeout(managed.timer);
      this.loopTimers.delete(managed.timer);
    }
    this.intervalLoops.delete(loopId);
    await this.deps.sessionState.removeIntervalLoop(
      this.deps.resolveTarget(managed.target),
      loopId,
    );
    return true;
  }

  async cancelIntervalLoopsForSession(target: AgentSessionTarget) {
    const matching = [...this.intervalLoops.values()]
      .filter((managed) => managed.target.sessionKey === target.sessionKey)
      .map((managed) => managed.loop.id);
    for (const loopId of matching) {
      await this.cancelIntervalLoop(loopId);
    }
    return matching.length;
  }

  async cancelAllIntervalLoops() {
    const ids = [...this.intervalLoops.keys()];
    for (const loopId of ids) {
      await this.cancelIntervalLoop(loopId);
    }
    return ids.length;
  }

  listIntervalLoops(params?: { sessionKey?: string }): IntervalLoopStatus[] {
    return [...this.intervalLoops.values()]
      .filter((managed) => !params?.sessionKey || managed.target.sessionKey === params.sessionKey)
      .map((managed) => this.toLoopStatus(managed))
      .sort((left, right) => left.nextRunAt - right.nextRunAt);
  }

  getIntervalLoop(loopId: string): IntervalLoopStatus | null {
    const managed = this.intervalLoops.get(loopId);
    return managed ? this.toLoopStatus(managed) : null;
  }

  getActiveIntervalLoopCount() {
    return this.intervalLoops.size;
  }

  private assertActiveLoopCapacity() {
    const maxActive = this.deps.getLoopConfig().maxActiveLoops;
    if (this.intervalLoops.size >= maxActive) {
      throw new Error(
        `Active loop count exceeds the configured max of \`${maxActive}\`. Cancel an existing loop first.`,
      );
    }
  }

  private toLoopStatus(managed: ManagedIntervalLoop): IntervalLoopStatus {
    return {
      ...managed.loop,
      agentId: managed.target.agentId,
      sessionKey: managed.target.sessionKey,
      remainingRuns: Math.max(0, managed.loop.maxRuns - managed.loop.attemptedRuns),
    };
  }

  private async isManagedLoopPersisted(managed: ManagedIntervalLoop) {
    const entry = await this.deps.sessionState.getEntry(managed.target.sessionKey);
    return (entry?.loops ?? entry?.intervalLoops ?? []).some((loop) => loop.id === managed.loop.id);
  }

  private dropManagedIntervalLoop(loopId: string) {
    const managed = this.intervalLoops.get(loopId);
    if (!managed) {
      return;
    }

    if (managed.timer) {
      clearTimeout(managed.timer);
      this.loopTimers.delete(managed.timer);
    }
    this.intervalLoops.delete(loopId);
  }

  private async runIntervalLoopIteration(
    loopId: string,
    options: { notifyStart?: boolean } = {},
  ) {
    const managed = this.intervalLoops.get(loopId);
    if (!managed) {
      return;
    }
    if (!(await this.isManagedLoopPersisted(managed))) {
      this.dropManagedIntervalLoop(loopId);
      return;
    }

    const attemptedRuns = managed.loop.attemptedRuns + 1;
    const now = Date.now();
    const nextLoopState = this.buildNextLoopState(managed.loop, attemptedRuns, now);
    if (await this.deps.isSessionBusy(managed.target)) {
      await this.skipLoopIteration(loopId, managed, nextLoopState, attemptedRuns, now);
      return;
    }

    nextLoopState.executedRuns += 1;
    if (!(await this.updateManagedIntervalLoop(managed, nextLoopState))) {
      this.dropManagedIntervalLoop(loopId);
      return;
    }
    await this.executeLoopIteration(
      loopId,
      managed.target,
      nextLoopState,
      attemptedRuns,
      now,
      options.notifyStart !== false,
    );
  }

  private buildNextLoopState(loop: StoredLoop, attemptedRuns: number, now: number): StoredLoop {
    return {
      ...loop,
      attemptedRuns,
      updatedAt: now,
      nextRunAt: this.computeNextManagedLoopRunAtMs(loop, now),
    };
  }

  private async skipLoopIteration(
    loopId: string,
    managed: ManagedIntervalLoop,
    nextLoopState: StoredLoop,
    attemptedRuns: number,
    now: number,
  ) {
    nextLoopState.skippedRuns += 1;
    if (!(await this.updateManagedIntervalLoop(managed, nextLoopState))) {
      this.dropManagedIntervalLoop(loopId);
      return;
    }
    if (attemptedRuns >= managed.loop.maxRuns) {
      await this.cancelIntervalLoop(loopId);
      return;
    }
    this.scheduleIntervalLoopTimer(loopId, Math.max(0, nextLoopState.nextRunAt - now));
  }

  private async executeLoopIteration(
    loopId: string,
    target: AgentSessionTarget,
    nextLoopState: StoredLoop,
    attemptedRuns: number,
    now: number,
    notifyStart: boolean,
  ) {
    await this.notifyAndEnqueueLoop(loopId, target, nextLoopState, attemptedRuns, notifyStart);
    if (attemptedRuns >= nextLoopState.maxRuns) {
      await this.cancelIntervalLoop(loopId);
      return;
    }
    this.scheduleIntervalLoopTimer(loopId, Math.max(0, nextLoopState.nextRunAt - now));
  }

  private async notifyAndEnqueueLoop(
    loopId: string,
    target: AgentSessionTarget,
    nextLoopState: StoredLoop,
    attemptedRuns: number,
    notifyStart: boolean,
  ) {
    if (notifyStart) {
      await this.deps.surfaceRuntime.notifyManagedLoopStart(target, nextLoopState);
    }
    const promptText = await this.deps.surfaceRuntime.buildManagedLoopPrompt(
      target.agentId,
      nextLoopState,
    );
    const { result } = this.deps.enqueuePrompt(target, promptText, {
      observerId: `loop:${loopId}:${attemptedRuns}`,
      onUpdate: async () => undefined,
    });
    void result.catch((error) => {
      if (!this.deps.shouldSuppressShutdownError(error)) {
        console.error("loop execution failed", error);
      }
    });
  }

  private scheduleIntervalLoopTimer(loopId: string, delayMs: number) {
    const managed = this.intervalLoops.get(loopId);
    if (!managed) {
      return;
    }

    if (managed.timer) {
      clearTimeout(managed.timer);
      this.loopTimers.delete(managed.timer);
    }

    const timer = setTimeout(() => {
      this.loopTimers.delete(timer);
      const current = this.intervalLoops.get(loopId);
      if (!current) {
        return;
      }
      current.timer = undefined;
      void this.runIntervalLoopIteration(loopId, { notifyStart: true }).catch((error) => {
        if (!this.deps.shouldSuppressShutdownError(error)) {
          console.error("loop execution failed", error);
        }
      });
    }, delayMs);
    managed.timer = timer;
    this.loopTimers.add(timer);
  }

  private async updateManagedIntervalLoop(
    managed: ManagedIntervalLoop,
    nextLoopState: StoredLoop,
  ) {
    const replaced = await this.deps.sessionState.replaceIntervalLoopIfPresent(
      this.deps.resolveTarget(managed.target),
      nextLoopState,
    );
    if (!replaced) {
      return false;
    }
    managed.loop = nextLoopState;
    return true;
  }

  private computeNextManagedLoopRunAtMs(loop: StoredLoop, nowMs: number) {
    if (loop.kind === "calendar") {
      return (
        computeNextCalendarLoopRunAtMs({
          cadence: loop.cadence,
          dayOfWeek: loop.dayOfWeek,
          hour: loop.hour,
          minute: loop.minute,
          timezone: loop.timezone,
          nowMs,
        }) ?? nowMs + 60_000
      );
    }
    return nowMs + loop.intervalMs;
  }
}
