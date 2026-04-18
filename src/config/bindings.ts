import type { LoadedConfig } from "./load-config.ts";
import type { ClisbotConfig } from "./schema.ts";
import {
  getSlackBotRecord,
  getTelegramBotRecord,
  resolveSlackBotId,
  resolveTelegramBotId,
} from "./channel-bots.ts";

export type BindingMatch = {
  channel: "slack" | "telegram";
  botId?: string;
  accountId?: string;
};

export function formatBinding(match: BindingMatch) {
  const botId = match.botId ?? match.accountId;
  return botId ? `${match.channel}:${botId}` : match.channel;
}

function getRawConfig(config: LoadedConfig | ClisbotConfig) {
  return "raw" in config ? config.raw : config;
}

export function resolveBoundAgentId(
  config: LoadedConfig | ClisbotConfig,
  match: BindingMatch,
): string | null {
  const raw = getRawConfig(config);
  const requestedBotId = match.botId ?? match.accountId;

  if (match.channel === "slack") {
    const botId = resolveSlackBotId(raw.bots.slack, requestedBotId);
    return getSlackBotRecord(raw.bots.slack, botId)?.agentId ?? null;
  }

  const botId = resolveTelegramBotId(raw.bots.telegram, requestedBotId);
  return getTelegramBotRecord(raw.bots.telegram, botId)?.agentId ?? null;
}

export function resolveTopLevelBoundAgentId(
  config: LoadedConfig | ClisbotConfig,
  match: BindingMatch,
): string | null {
  return resolveBoundAgentId(config, match);
}
