import { sleep } from "../shared/process.ts";

type QueueTask<T> = () => Promise<T>;
type QueueCanStart = () => Promise<boolean> | boolean;

const QUEUE_PENDING_POLL_INTERVAL_MS = 25;

export type PendingQueueItem = {
  id: string;
  text: string;
  createdAt: number;
};

type QueueEntry<T> = {
  id: string;
  text?: string;
  createdAt: number;
  status: "pending" | "running";
  canStart?: QueueCanStart;
  task: QueueTask<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
  result: Promise<T>;
};

type QueueState = {
  running: boolean;
  entries: QueueEntry<unknown>[];
};

export class ClearedQueuedTaskError extends Error {
  constructor() {
    super("Queued task was cleared before execution.");
    this.name = "ClearedQueuedTaskError";
  }
}

export class AgentJobQueue {
  private states = new Map<string, QueueState>();
  private nextId = 1;

  enqueue<T>(
    key: string,
    task: QueueTask<T>,
    options: { text?: string; canStart?: QueueCanStart } = {},
  ) {
    const state = this.getOrCreateState(key);
    const positionAhead = state.entries.length;
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: unknown) => void;
    const result = new Promise<T>((resolvePromise, rejectPromise) => {
      resolve = resolvePromise;
      reject = rejectPromise;
    });
    void result.catch(() => undefined);
    const entry: QueueEntry<T> = {
      id: String(this.nextId++),
      text: options.text,
      createdAt: Date.now(),
      status: "pending",
      canStart: options.canStart,
      task,
      resolve,
      reject,
      result,
    };
    state.entries.push(entry as QueueEntry<unknown>);
    void this.drain(key, state);

    return { positionAhead, result };
  }

  isBusy(sessionKey: string) {
    for (const [key, state] of this.states.entries()) {
      if ((key === sessionKey || key.startsWith(`${sessionKey}:`)) && state.entries.length > 0) {
        return true;
      }
    }

    return false;
  }

  listPending(key: string): PendingQueueItem[] {
    const state = this.states.get(key);
    if (!state) {
      return [];
    }

    return state.entries
      .filter((entry) => entry.status === "pending" && entry.text)
      .map((entry) => ({
        id: entry.id,
        text: entry.text!,
        createdAt: entry.createdAt,
      }));
  }

  clearPending(key: string) {
    const state = this.states.get(key);
    if (!state) {
      return 0;
    }

    const keptEntries = state.entries.filter((entry) => entry.status === "running");
    const removedEntries = state.entries.filter((entry) => entry.status === "pending");
    state.entries = keptEntries;
    for (const entry of removedEntries) {
      entry.reject(new ClearedQueuedTaskError());
    }
    if (state.entries.length === 0 && !state.running) {
      this.states.delete(key);
    }
    return removedEntries.length;
  }

  private getOrCreateState(key: string) {
    const existing = this.states.get(key);
    if (existing) {
      return existing;
    }

    const state: QueueState = {
      running: false,
      entries: [],
    };
    this.states.set(key, state);
    return state;
  }

  private async drain(key: string, state: QueueState) {
    if (state.running) {
      return;
    }

    state.running = true;
    try {
      while (true) {
        const nextEntry = state.entries.find((entry) => entry.status === "pending");
        if (!nextEntry) {
          break;
        }

        if (nextEntry.canStart && !(await nextEntry.canStart())) {
          await sleep(QUEUE_PENDING_POLL_INTERVAL_MS);
          continue;
        }

        nextEntry.status = "running";
        try {
          nextEntry.resolve(await nextEntry.task());
        } catch (error) {
          nextEntry.reject(error);
        } finally {
          state.entries = state.entries.filter((entry) => entry !== nextEntry);
        }
      }
    } finally {
      state.running = false;
      if (state.entries.length === 0) {
        this.states.delete(key);
      }
    }
  }
}
