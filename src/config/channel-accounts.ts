import type {
  BotRouteConfig,
  ClisbotConfig,
  CommandPrefixesConfig,
  FollowUpConfig,
  SlackBotConfig,
  SlackProviderDefaultsConfig,
  SurfaceNotificationsConfig,
  TelegramBotConfig,
  TelegramProviderDefaultsConfig,
} from "./schema.ts";

export type SlackAccountConfig = {
  appToken: string;
  botToken: string;
};

export type TelegramAccountConfig = {
  botToken: string;
};

export type ResolvedSlackBotConfig = Omit<SlackBotConfig, "directMessages" | "groups"> &
  SlackProviderDefaultsConfig & {
    id: string;
    directMessages: Record<string, BotRouteConfig>;
    groups: Record<string, BotRouteConfig>;
    appToken: string;
    botToken: string;
  };

export type ResolvedTelegramBotConfig = Omit<TelegramBotConfig, "directMessages" | "groups"> &
  TelegramProviderDefaultsConfig & {
    id: string;
    directMessages: Record<string, BotRouteConfig>;
    groups: Record<string, TelegramBotConfig["groups"][string]>;
    botToken: string;
  };

function resolveDirectMessageRoute(
  routes: Record<string, BotRouteConfig>,
  subjectId?: string | number | null,
) {
  const normalizedSubjectId =
    typeof subjectId === "number" ? String(subjectId) : subjectId?.trim();

  if (normalizedSubjectId) {
    const exactRoute = routes[`dm:${normalizedSubjectId}`];
    if (exactRoute) {
      return exactRoute;
    }
  }

  return routes["dm:*"] ?? routes["*"];
}

function normalizeAccountId(accountId?: string | null) {
  const normalized = accountId?.trim();
  return normalized ? normalized : undefined;
}

function cloneCommandPrefixes(value?: Partial<CommandPrefixesConfig>) {
  return {
    slash: [...(value?.slash ?? [])],
    bash: [...(value?.bash ?? [])],
  };
}

function cloneSurfaceNotifications(
  value?: Partial<SurfaceNotificationsConfig>,
) {
  return {
    ...(value?.queueStart ? { queueStart: value.queueStart } : {}),
    ...(value?.loopStart ? { loopStart: value.loopStart } : {}),
  };
}

function cloneFollowUp(value?: Partial<FollowUpConfig>) {
  return {
    ...(value?.mode ? { mode: value.mode } : {}),
    ...(value?.participationTtlSec
      ? { participationTtlSec: value.participationTtlSec }
      : {}),
    ...(value?.participationTtlMin
      ? { participationTtlMin: value.participationTtlMin }
      : {}),
  };
}

function cloneBotRoute(route: BotRouteConfig | undefined) {
  if (!route) {
    return undefined;
  }

  return {
    ...route,
    allowUsers: [...(route.allowUsers ?? [])],
    blockUsers: [...(route.blockUsers ?? [])],
    commandPrefixes: route.commandPrefixes
      ? cloneCommandPrefixes(route.commandPrefixes)
      : undefined,
    surfaceNotifications: route.surfaceNotifications
      ? cloneSurfaceNotifications(route.surfaceNotifications)
      : undefined,
    followUp: route.followUp ? cloneFollowUp(route.followUp) : undefined,
  } satisfies BotRouteConfig;
}

function cloneSlackRoutes(routes: Record<string, BotRouteConfig>) {
  return Object.fromEntries(
    Object.entries(routes).map(([key, route]) => [key, cloneBotRoute(route)!]),
  );
}

function cloneTelegramRoutes(routes: TelegramBotConfig["groups"]) {
  return Object.fromEntries(
    Object.entries(routes).map(([key, route]) => [
      key,
      {
        ...route,
        allowUsers: [...(route.allowUsers ?? [])],
        blockUsers: [...(route.blockUsers ?? [])],
        commandPrefixes: route.commandPrefixes
          ? cloneCommandPrefixes(route.commandPrefixes)
          : undefined,
        surfaceNotifications: route.surfaceNotifications
          ? cloneSurfaceNotifications(route.surfaceNotifications)
          : undefined,
        followUp: route.followUp ? cloneFollowUp(route.followUp) : undefined,
        topics: Object.fromEntries(
          Object.entries(route.topics ?? {}).map(([topicId, topicRoute]) => [
            topicId,
            cloneBotRoute(topicRoute)!,
          ]),
        ),
      },
    ]),
  );
}

function getSlackBotsRecord(
  config: ClisbotConfig["bots"]["slack"],
) {
  const { defaults, ...bots } = config;
  return bots;
}

function getTelegramBotsRecord(
  config: ClisbotConfig["bots"]["telegram"],
) {
  const { defaults, ...bots } = config;
  return bots;
}

function getConfiguredDefaultBotId(params: {
  defaultBotId?: string;
  bots: Record<string, unknown>;
}) {
  const explicit = normalizeAccountId(params.defaultBotId);
  if (explicit) {
    return explicit;
  }

  if ("default" in params.bots) {
    return "default";
  }

  const firstBotId = Object.keys(params.bots)[0];
  return normalizeAccountId(firstBotId) ?? "default";
}

export function resolveSlackAccountId(
  config: ClisbotConfig["bots"]["slack"],
  accountId?: string | null,
) {
  return normalizeAccountId(accountId) ?? getConfiguredDefaultBotId({
    defaultBotId: config.defaults.defaultBotId,
    bots: getSlackBotsRecord(config),
  });
}

export function resolveTelegramAccountId(
  config: ClisbotConfig["bots"]["telegram"],
  accountId?: string | null,
) {
  return normalizeAccountId(accountId) ?? getConfiguredDefaultBotId({
    defaultBotId: config.defaults.defaultBotId,
    bots: getTelegramBotsRecord(config),
  });
}

export function getSlackBotConfig(
  config: ClisbotConfig["bots"]["slack"],
  accountId: string,
) {
  return getSlackBotsRecord(config)[accountId] as SlackBotConfig | undefined;
}

export function getTelegramBotConfig(
  config: ClisbotConfig["bots"]["telegram"],
  accountId: string,
) {
  return getTelegramBotsRecord(config)[accountId] as TelegramBotConfig | undefined;
}

export function resolveSlackBotConfig(
  config: ClisbotConfig["bots"]["slack"],
  accountId?: string | null,
): ResolvedSlackBotConfig {
  const resolvedAccountId = resolveSlackAccountId(config, accountId);
  const providerDefaults = config.defaults;
  const botConfig = getSlackBotConfig(config, resolvedAccountId);
  if (!botConfig) {
    throw new Error(`Unknown Slack bot: ${resolvedAccountId}`);
  }

  return {
    ...providerDefaults,
    ...botConfig,
    id: resolvedAccountId,
    commandPrefixes: {
      slash:
        botConfig.commandPrefixes?.slash ??
        providerDefaults.commandPrefixes.slash,
      bash:
        botConfig.commandPrefixes?.bash ??
        providerDefaults.commandPrefixes.bash,
    },
    surfaceNotifications: {
      queueStart:
        botConfig.surfaceNotifications?.queueStart ??
        providerDefaults.surfaceNotifications?.queueStart ??
        "brief",
      loopStart:
        botConfig.surfaceNotifications?.loopStart ??
        providerDefaults.surfaceNotifications?.loopStart ??
        "brief",
    },
    followUp: {
      mode: botConfig.followUp?.mode ?? providerDefaults.followUp.mode,
      participationTtlSec:
        botConfig.followUp?.participationTtlSec ??
        providerDefaults.followUp.participationTtlSec,
      participationTtlMin:
        botConfig.followUp?.participationTtlMin ??
        providerDefaults.followUp.participationTtlMin,
    },
    directMessages: {
      ...cloneSlackRoutes(providerDefaults.directMessages),
      ...cloneSlackRoutes(botConfig.directMessages ?? {}),
    },
    groups: cloneSlackRoutes(botConfig.groups ?? {}),
    appToken: botConfig.appToken?.trim() ?? "",
    botToken: botConfig.botToken?.trim() ?? "",
  };
}

export function resolveTelegramBotConfig(
  config: ClisbotConfig["bots"]["telegram"],
  accountId?: string | null,
): ResolvedTelegramBotConfig {
  const resolvedAccountId = resolveTelegramAccountId(config, accountId);
  const providerDefaults = config.defaults;
  const botConfig = getTelegramBotConfig(config, resolvedAccountId);
  if (!botConfig) {
    throw new Error(`Unknown Telegram bot: ${resolvedAccountId}`);
  }

  return {
    ...providerDefaults,
    ...botConfig,
    id: resolvedAccountId,
    commandPrefixes: {
      slash:
        botConfig.commandPrefixes?.slash ??
        providerDefaults.commandPrefixes.slash,
      bash:
        botConfig.commandPrefixes?.bash ??
        providerDefaults.commandPrefixes.bash,
    },
    surfaceNotifications: {
      queueStart:
        botConfig.surfaceNotifications?.queueStart ??
        providerDefaults.surfaceNotifications?.queueStart ??
        "brief",
      loopStart:
        botConfig.surfaceNotifications?.loopStart ??
        providerDefaults.surfaceNotifications?.loopStart ??
        "brief",
    },
    followUp: {
      mode: botConfig.followUp?.mode ?? providerDefaults.followUp.mode,
      participationTtlSec:
        botConfig.followUp?.participationTtlSec ??
        providerDefaults.followUp.participationTtlSec,
      participationTtlMin:
        botConfig.followUp?.participationTtlMin ??
        providerDefaults.followUp.participationTtlMin,
    },
    directMessages: {
      ...cloneSlackRoutes(providerDefaults.directMessages),
      ...cloneSlackRoutes(botConfig.directMessages ?? {}),
    },
    groups: cloneTelegramRoutes(botConfig.groups ?? {}),
    botToken: botConfig.botToken?.trim() ?? "",
  };
}

export function resolveSlackDirectMessageConfig(
  config: ResolvedSlackBotConfig,
  userId?: string | null,
) {
  return resolveDirectMessageRoute(config.directMessages, userId);
}

export function resolveTelegramDirectMessageConfig(
  config: ResolvedTelegramBotConfig,
  senderId?: string | number | null,
) {
  return resolveDirectMessageRoute(config.directMessages, senderId);
}

export function resolveSlackAccountConfig(
  config: ClisbotConfig["bots"]["slack"],
  accountId?: string | null,
): { accountId: string; config: SlackAccountConfig } {
  const resolved = resolveSlackBotConfig(config, accountId);
  if (resolved.appToken && resolved.botToken) {
    return {
      accountId: resolved.id,
      config: {
        appToken: resolved.appToken,
        botToken: resolved.botToken,
      },
    };
  }

  throw new Error(`Unknown Slack bot: ${resolved.id}`);
}

export function resolveTelegramAccountConfig(
  config: ClisbotConfig["bots"]["telegram"],
  accountId?: string | null,
): { accountId: string; config: TelegramAccountConfig } {
  const resolved = resolveTelegramBotConfig(config, accountId);
  if (resolved.botToken) {
    return {
      accountId: resolved.id,
      config: {
        botToken: resolved.botToken,
      },
    };
  }

  throw new Error(`Unknown Telegram bot: ${resolved.id}`);
}

export function listSlackAccounts(
  config: ClisbotConfig["bots"]["slack"],
): Array<{ accountId: string; config: SlackAccountConfig }> {
  return Object.entries(getSlackBotsRecord(config))
    .filter(([, bot]) => bot.enabled !== false)
    .map(([accountId]) => {
      const resolved = resolveSlackBotConfig(config, accountId);
      return {
        accountId,
        config: {
          appToken: resolved.appToken,
          botToken: resolved.botToken,
        },
      };
    })
    .filter(({ config }) => config.appToken.trim() && config.botToken.trim());
}

export function listTelegramAccounts(
  config: ClisbotConfig["bots"]["telegram"],
): Array<{ accountId: string; config: TelegramAccountConfig }> {
  return Object.entries(getTelegramBotsRecord(config))
    .filter(([, bot]) => bot.enabled !== false)
    .map(([accountId]) => {
      const resolved = resolveTelegramBotConfig(config, accountId);
      return {
        accountId,
        config: {
          botToken: resolved.botToken,
        },
      };
    })
    .filter(({ config }) => config.botToken.trim());
}
