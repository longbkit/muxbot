import type { LoopCalendarCadence } from "./loop-command.ts";
import type { ChannelIdentity } from "../channels/channel-identity.ts";

export type StoredLoopSurfaceBinding = Pick<
  ChannelIdentity,
  "platform" | "conversationKind" | "channelId" | "chatId" | "threadTs" | "topicId"
>;

type StoredLoopBase = {
  id: string;
  maxRuns: number;
  attemptedRuns: number;
  executedRuns: number;
  skippedRuns: number;
  createdAt: number;
  updatedAt: number;
  nextRunAt: number;
  promptText: string;
  canonicalPromptText?: string;
  promptSummary: string;
  promptSource: "custom" | "LOOP.md";
  createdBy?: string;
  surfaceBinding?: StoredLoopSurfaceBinding;
};

export type StoredIntervalLoop =
  | (StoredLoopBase & {
      kind?: "interval";
      intervalMs: number;
      force: boolean;
    })
  | (StoredLoopBase & {
      kind: "calendar";
      cadence: LoopCalendarCadence;
      dayOfWeek?: number;
      localTime: string;
      hour: number;
      minute: number;
      timezone: string;
      force: false;
    });

export type IntervalLoopStatus = StoredIntervalLoop & {
  agentId: string;
  sessionKey: string;
  remainingRuns: number;
};
