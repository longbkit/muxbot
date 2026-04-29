import { AgentJobQueue, type PendingQueueItem } from "./job-queue.ts";
import type { QueuedPromptStatus, StoredQueueItem } from "./queue-state.ts";
import type { RunUpdate } from "./run-observation.ts";
import type { AgentSessionTarget, ResolvedAgentTarget } from "./resolved-target.ts";
import { AgentSessionState } from "./session-state.ts";
import { SessionService } from "./session-service.ts";
import { SurfaceRuntime } from "./surface-runtime.ts";
import type { LatencyDebugContext } from "../control/latency-debug.ts";

type QueueConfig = {
  maxPendingItemsPerSession: number;
};

type ManagedQueueItem = {
  target: AgentSessionTarget;
  item: StoredQueueItem;
  persisting?: boolean;
};

type QueueControllerDeps = {
  queue: AgentJobQueue;
  sessionState: AgentSessionState;
  activeRuns: SessionService;
  surfaceRuntime: SurfaceRuntime;
  getQueueConfig: () => QueueConfig;
  resolveTarget: (target: AgentSessionTarget) => ResolvedAgentTarget;
  hasBlockingActiveRun: (target: AgentSessionTarget) => Promise<boolean>;
  shouldSuppressShutdownError: (error: unknown) => boolean;
};

export type QueuePromptCallbacks = {
  onUpdate: (update: RunUpdate) => Promise<void> | void;
  observerId?: string;
  timingContext?: LatencyDebugContext;
  queueText?: string;
  queueItem?: StoredQueueItem;
};

export type PromptQueueResult = {
  positionAhead: number;
  result: Promise<RunUpdate>;
  persisted?: Promise<void>;
};

export class ManagedQueueController {
  private queuedItems = new Map<string, ManagedQueueItem>();

  constructor(private readonly deps: QueueControllerDeps) {}

  clear() {
    this.queuedItems.clear();
  }

  async listQueuedPrompts(target: AgentSessionTarget): Promise<PendingQueueItem[]> {
    const persisted = await this.deps.sessionState.listQueuedItems({
      sessionKey: target.sessionKey,
      statuses: ["pending"],
    });
    return persisted.map((item) => ({
      id: item.id,
      text: item.promptSummary,
      createdAt: item.createdAt,
    }));
  }

  async clearQueuedPrompts(target: AgentSessionTarget) {
    const clearedStored =
      await this.deps.sessionState.clearPendingQueuedItemsForSessionKey(target.sessionKey);
    this.deps.queue.clearPendingByIds(clearedStored.map((item) => item.id));
    return clearedStored.length;
  }

  enqueuePrompt(
    target: AgentSessionTarget,
    prompt: string | (() => string),
    callbacks: QueuePromptCallbacks,
  ): PromptQueueResult {
    const queueItem = callbacks.queueItem;
    const persisted = this.preparePersistedQueueItem(target, queueItem);
    const reconciledBeforeStart = this.reconcilePersistedQueueItems().catch((error) => {
      console.error("queue reconcile before prompt start failed", error);
    });
    const queued = this.deps.queue.enqueue<RunUpdate>(
      target.sessionKey,
      async () => {
        await persisted;
        await this.markQueueItemRunning(target, queueItem);
        const promptText = typeof prompt === "function" ? prompt() : prompt;
        return this.deps.activeRuns.executePrompt(target, promptText, {
          id: callbacks.observerId ?? `prompt:${target.sessionKey}`,
          mode: "live",
          timingContext: callbacks.timingContext,
          onUpdate: callbacks.onUpdate,
        });
      },
      {
        id: queueItem?.id,
        createdAt: queueItem?.createdAt,
        text: callbacks.queueText ?? (typeof prompt === "string" ? prompt : undefined),
        canStart: async () => {
          return this.canStartQueuedPrompt(target, reconciledBeforeStart);
        },
        onComplete: () => this.removeManagedQueueItem(target, queueItem),
        onFailure: () => this.removeManagedQueueItem(target, queueItem),
        onClear: () => this.removeManagedQueueItem(target, queueItem),
      },
    ) as PromptQueueResult;
    queued.persisted = persisted;
    return queued;
  }

  private preparePersistedQueueItem(target: AgentSessionTarget, item?: StoredQueueItem) {
    if (!item) {
      return undefined;
    }
    this.setManagedQueueItem(target, item, true);
    return this.persistQueueItem(this.deps.resolveTarget(target), item)
      .then(() => this.markPersisted(item))
      .catch((error) => {
        this.clearPendingById(item);
        throw error;
      });
  }

  private async canStartQueuedPrompt(
    target: AgentSessionTarget,
    reconciledBeforeStart: Promise<void>,
  ) {
    if (await this.deps.hasBlockingActiveRun(target)) {
      return false;
    }
    await reconciledBeforeStart;
    return !(await this.deps.hasBlockingActiveRun(target));
  }

  async reconcilePersistedQueueItems() {
    const persistedItems = await this.deps.sessionState.listQueuedItems({
      statuses: ["pending", "running"],
    });
    const persistedIds = new Set(persistedItems.map((item) => item.id));
    const removedIds = [...this.queuedItems.entries()]
      .filter(([id, managed]) => !managed.persisting && !persistedIds.has(id))
      .map(([id]) => id);
    if (removedIds.length > 0) {
      this.deps.queue.clearPendingByIds(removedIds);
      for (const id of removedIds) {
        this.queuedItems.delete(id);
      }
    }

    for (const persisted of persistedItems) {
      if (persisted.status !== "pending" || this.queuedItems.has(persisted.id)) {
        continue;
      }
      this.enqueuePersistedQueueItem(persisted);
    }
  }

  persistQueueItem(resolved: ResolvedAgentTarget, item: StoredQueueItem) {
    return this.deps.sessionState
      .countPendingQueuedItemsForSessionKey(resolved.sessionKey, {
        excludeId: item.id,
      })
      .then(async (pendingCount) => {
        const maxPending = this.deps.getQueueConfig().maxPendingItemsPerSession;
        if (pendingCount >= maxPending) {
          throw new Error(
            `Session queue pending item count exceeds the configured max of \`${maxPending}\`. Clear pending queue items first.`,
          );
        }
        await this.deps.sessionState.setQueuedItem(resolved, item);
      });
  }

  setManagedQueueItem(target: AgentSessionTarget, item: StoredQueueItem, persisting?: boolean) {
    this.queuedItems.set(item.id, {
      target,
      item,
      persisting,
    });
  }

  markPersisted(item: StoredQueueItem) {
    const managed = this.queuedItems.get(item.id);
    if (managed) {
      this.queuedItems.set(item.id, { ...managed, persisting: false });
    }
  }

  clearPendingById(item: StoredQueueItem) {
    this.deps.queue.clearPendingByIds([item.id]);
    this.queuedItems.delete(item.id);
  }

  async markQueueItemRunning(target: AgentSessionTarget, item?: StoredQueueItem) {
    if (!item) {
      return;
    }
    const now = Date.now();
    const next = {
      ...item,
      status: "running" as const,
      startedAt: now,
      updatedAt: now,
    };
    this.queuedItems.set(item.id, {
      target,
      item: next,
    });
    await this.deps.sessionState.replaceQueuedItemIfPresent(
      this.deps.resolveTarget(target),
      next,
    );
  }

  async removeManagedQueueItem(target: AgentSessionTarget, item?: StoredQueueItem) {
    if (!item) {
      return;
    }
    this.queuedItems.delete(item.id);
    await this.deps.sessionState.removeQueuedItem(this.deps.resolveTarget(target), item.id);
  }

  private enqueuePersistedQueueItem(item: QueuedPromptStatus) {
    const target = {
      agentId: item.agentId,
      sessionKey: item.sessionKey,
    };
    this.queuedItems.set(item.id, {
      target,
      item,
    });
    const queued = this.deps.queue.enqueue(
      item.sessionKey,
      async () => {
        await this.markQueueItemRunning(target, item);
        await this.deps.surfaceRuntime.notifyManagedQueueStart(target, item);
        const promptText = await this.deps.surfaceRuntime.buildManagedQueuePrompt(
          item.agentId,
          item,
        );
        return this.deps.activeRuns.executePrompt(target, promptText, {
          id: `queue:${item.id}`,
          mode: "live",
          onUpdate: async () => undefined,
        });
      },
      {
        id: item.id,
        createdAt: item.createdAt,
        text: item.promptSummary,
        canStart: async () => !(await this.deps.hasBlockingActiveRun(target)),
        onComplete: async (value: RunUpdate) => {
          await this.deps.surfaceRuntime.notifyManagedQueueSettlement(target, item, value);
          await this.removeManagedQueueItem(target, item);
        },
        onFailure: async (error: unknown) => {
          await this.deps.surfaceRuntime.notifyManagedQueueFailure(target, item, error);
          await this.removeManagedQueueItem(target, item);
        },
        onClear: () => this.removeManagedQueueItem(target, item),
      },
    );
    void queued.result.catch((error) => {
      if (this.deps.shouldSuppressShutdownError(error)) {
        return;
      }
      console.error("queued prompt execution failed", error);
    });
  }
}
