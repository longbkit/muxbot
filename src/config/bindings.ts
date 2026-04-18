import type { LoadedConfig } from "./load-config.ts";
import type { ClisbotConfig } from "./schema.ts";
import {
  getSlackBotConfig,
  getTelegramBotConfig,
  resolveSlackAccountId,
  resolveTelegramAccountId,
} from "./channel-accounts.ts";

export type BindingMatch = {
  channel: "slack" | "telegram";
  accountId?: string;
};

export function formatBinding(match: BindingMatch) {
  return match.accountId ? `${match.channel}:${match.accountId}` : match.channel;
}

function getRawConfig(config: LoadedConfig | ClisbotConfig) {
  return "raw" in config ? config.raw : config;
}

export function resolveBoundAgentId(
  config: LoadedConfig | ClisbotConfig,
  match: BindingMatch,
): string | null {
  const raw = getRawConfig(config);

  if (match.channel === "slack") {
    const accountId = resolveSlackAccountId(raw.bots.slack, match.accountId);
    return getSlackBotConfig(raw.bots.slack, accountId)?.agentId ?? null;
  }

  const accountId = resolveTelegramAccountId(raw.bots.telegram, match.accountId);
  return getTelegramBotConfig(raw.bots.telegram, accountId)?.agentId ?? null;
}

export function resolveTopLevelBoundAgentId(
  config: LoadedConfig | ClisbotConfig,
  match: BindingMatch,
): string | null {
  return resolveBoundAgentId(config, match);
}
