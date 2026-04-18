import { MissingEnvVarError } from "./env-substitution.ts";
import type { ClisbotConfig } from "./schema.ts";
import {
  getCanonicalSlackAppTokenPath,
  getCanonicalSlackBotTokenPath,
  getCanonicalTelegramBotTokenPath,
  getConfiguredDefaultAccountId,
  getCredentialSkipPaths,
  getSlackAccountConfig,
  getSlackBotsRecord,
  getSlackEnvReference,
  getSlackMemAppEnvName,
  getSlackMemBotEnvName,
  getTelegramAccountConfig,
  getTelegramBotsRecord,
  getTelegramEnvReference,
  getTelegramMemEnvName,
  normalizeAccountId,
  parseTokenInput,
  type ParsedTokenInput,
  type ResolvedCredentialSource,
  type ResolvedSlackCredential,
  type ResolvedTelegramCredential,
  type SlackPersistentAccountConfig,
  type TelegramPersistentAccountConfig,
  trimString,
} from "./channel-credentials-shared.ts";
import {
  clearSlackRuntimeCredential,
  clearTelegramRuntimeCredential,
  getConfigReloadMtimeMs,
  getRuntimeCredentialDocument,
  persistSlackCredential,
  persistTelegramCredential,
  readOptionalCanonicalCredentialFile,
  readRequiredCredentialFile,
  removeRuntimeCredentials,
  setSlackRuntimeCredential,
  setTelegramRuntimeCredential,
} from "./channel-runtime-credentials.ts";
import { extractEnvReferenceName } from "../shared/env-references.ts";
import {
  collapseHomePath,
  expandHomePath,
} from "../shared/paths.ts";

export class MissingMemCredentialError extends Error {
  constructor(
    readonly provider: "slack" | "telegram",
    readonly accountId: string,
  ) {
    super(
      provider === "telegram"
        ? `Telegram account ${accountId} is configured with credentialType=mem but no runtime credential is available.`
        : `Slack account ${accountId} is configured with credentialType=mem but no runtime credential is available.`,
    );
    this.name = "MissingMemCredentialError";
  }
}

export function validatePersistentChannelCredentials(config: ClisbotConfig) {
  const validateTokenField = (value: string | undefined, configPath: string) => {
    const trimmed = trimString(value);
    if (!trimmed) {
      return;
    }
    if (extractEnvReferenceName(trimmed)) {
      return;
    }
    throw new Error(
      `Raw channel token literals are not allowed in clisbot.json (${configPath}). Use an env placeholder, credentialType=mem, or credentialType=tokenFile.`,
    );
  };

  for (const accountId of Object.keys(getSlackBotsRecord(config.bots.slack))) {
    const account = getSlackAccountConfig(config.bots.slack, accountId);
    validateTokenField(account?.appToken, `bots.slack.${accountId}.appToken`);
    validateTokenField(account?.botToken, `bots.slack.${accountId}.botToken`);
  }

  for (const accountId of Object.keys(getTelegramBotsRecord(config.bots.telegram))) {
    const account = getTelegramAccountConfig(config.bots.telegram, accountId);
    validateTokenField(account?.botToken, `bots.telegram.${accountId}.botToken`);
  }
}

export function resolveTelegramCredential(params: {
  config: ClisbotConfig["bots"]["telegram"];
  accountId?: string | null;
  env?: NodeJS.ProcessEnv;
  runtimeCredentialsPath?: string;
}): ResolvedTelegramCredential {
  const env = params.env ?? process.env;
  const accountId = normalizeAccountId(params.accountId) ?? getConfiguredDefaultAccountId({
    defaultBotId: params.config.defaults.defaultBotId,
    bots: getTelegramBotsRecord(params.config),
  });
  const account = getTelegramAccountConfig(params.config, accountId);

  if (account?.credentialType === "mem") {
    const envName = getTelegramMemEnvName(accountId);
    const secret = env[envName]?.trim() ||
      getRuntimeCredentialDocument(params.runtimeCredentialsPath).telegram?.[accountId]?.botToken
        ?.trim();
    if (!secret) {
      throw new MissingMemCredentialError("telegram", accountId);
    }
    return {
      accountId,
      botToken: secret,
      source: {
        source: "cli-ephemeral",
        detail: "source=cli-ephemeral restartRequiresPersistence=yes",
      },
    };
  }

  const explicitTokenFile = trimString(account?.tokenFile);
  const canonicalTokenFile = getCanonicalTelegramBotTokenPath(accountId, env);
  if (explicitTokenFile) {
    return {
      accountId,
      botToken: readRequiredCredentialFile(
        explicitTokenFile,
        `bots.telegram.${accountId}.tokenFile`,
      ),
      source: {
        source: "credential-file",
        detail: `source=credential-file path=${collapseHomePath(expandHomePath(explicitTokenFile))}`,
        paths: [expandHomePath(explicitTokenFile)],
      },
    };
  }

  if (account?.credentialType === "tokenFile") {
    return {
      accountId,
      botToken: readRequiredCredentialFile(
        canonicalTokenFile,
        `bots.telegram.${accountId}`,
      ),
      source: {
        source: "credential-file",
        detail: `source=credential-file path=${collapseHomePath(canonicalTokenFile)}`,
        paths: [canonicalTokenFile],
      },
    };
  }

  const canonicalToken = readOptionalCanonicalCredentialFile(canonicalTokenFile);
  if (canonicalToken) {
    return {
      accountId,
      botToken: canonicalToken,
      source: {
        source: "credential-file",
        detail: `source=credential-file path=${collapseHomePath(canonicalTokenFile)}`,
        paths: [canonicalTokenFile],
      },
    };
  }

  const envReference = getTelegramEnvReference(params.config, accountId);
  const envName = extractEnvReferenceName(envReference);
  if (envName) {
    const value = env[envName]?.trim();
    if (!value) {
      throw new MissingEnvVarError(
        envName,
        `bots.telegram.${accountId}.botToken`,
      );
    }
    return {
      accountId,
      botToken: value,
      source: {
        source: "env",
        detail: `source=env name=${envName}`,
        names: [envName],
      },
    };
  }

  if (envReference.trim()) {
    return {
      accountId,
      botToken: envReference.trim(),
      source: {
        source: "config-inline",
        detail: "source=config-inline legacyCompatibility=yes",
      },
    };
  }

  throw new Error(`Unknown Telegram account: ${accountId}`);
}

export function resolveSlackCredential(params: {
  config: ClisbotConfig["bots"]["slack"];
  accountId?: string | null;
  env?: NodeJS.ProcessEnv;
  runtimeCredentialsPath?: string;
}): ResolvedSlackCredential {
  const env = params.env ?? process.env;
  const accountId = normalizeAccountId(params.accountId) ?? getConfiguredDefaultAccountId({
    defaultBotId: params.config.defaults.defaultBotId,
    bots: getSlackBotsRecord(params.config),
  });
  const account = getSlackAccountConfig(params.config, accountId);

  if (account?.credentialType === "mem") {
    const appEnvName = getSlackMemAppEnvName(accountId);
    const botEnvName = getSlackMemBotEnvName(accountId);
    const runtime = getRuntimeCredentialDocument(params.runtimeCredentialsPath).slack?.[accountId];
    const appToken = env[appEnvName]?.trim() || runtime?.appToken?.trim();
    const botToken = env[botEnvName]?.trim() || runtime?.botToken?.trim();
    if (!appToken || !botToken) {
      throw new MissingMemCredentialError("slack", accountId);
    }
    return {
      accountId,
      appToken,
      botToken,
      source: {
        source: "cli-ephemeral",
        detail: "source=cli-ephemeral restartRequiresPersistence=yes",
      },
    };
  }

  const explicitAppTokenFile = trimString(account?.appTokenFile);
  const explicitBotTokenFile = trimString(account?.botTokenFile);
  if (explicitAppTokenFile || explicitBotTokenFile) {
    if (!explicitAppTokenFile || !explicitBotTokenFile) {
      throw new Error(
        `Slack account ${accountId} requires both appTokenFile and botTokenFile when either one is configured.`,
      );
    }
    return {
      accountId,
      appToken: readRequiredCredentialFile(
        explicitAppTokenFile,
        `bots.slack.${accountId}.appTokenFile`,
      ),
      botToken: readRequiredCredentialFile(
        explicitBotTokenFile,
        `bots.slack.${accountId}.botTokenFile`,
      ),
      source: {
        source: "credential-file",
        detail:
          `source=credential-file appPath=${collapseHomePath(expandHomePath(explicitAppTokenFile))} ` +
          `botPath=${collapseHomePath(expandHomePath(explicitBotTokenFile))}`,
        paths: [
          expandHomePath(explicitAppTokenFile),
          expandHomePath(explicitBotTokenFile),
        ],
      },
    };
  }

  const canonicalAppTokenFile = getCanonicalSlackAppTokenPath(accountId, env);
  const canonicalBotTokenFile = getCanonicalSlackBotTokenPath(accountId, env);
  if (account?.credentialType === "tokenFile") {
    return {
      accountId,
      appToken: readRequiredCredentialFile(
        canonicalAppTokenFile,
        `bots.slack.${accountId}`,
      ),
      botToken: readRequiredCredentialFile(
        canonicalBotTokenFile,
        `bots.slack.${accountId}`,
      ),
      source: {
        source: "credential-file",
        detail:
          `source=credential-file appPath=${collapseHomePath(canonicalAppTokenFile)} ` +
          `botPath=${collapseHomePath(canonicalBotTokenFile)}`,
        paths: [canonicalAppTokenFile, canonicalBotTokenFile],
      },
    };
  }

  const canonicalAppToken = readOptionalCanonicalCredentialFile(canonicalAppTokenFile);
  const canonicalBotToken = readOptionalCanonicalCredentialFile(canonicalBotTokenFile);
  if (canonicalAppToken || canonicalBotToken) {
    if (!canonicalAppToken || !canonicalBotToken) {
      throw new Error(
        `Slack canonical credential files for account ${accountId} are incomplete.`,
      );
    }
    return {
      accountId,
      appToken: canonicalAppToken,
      botToken: canonicalBotToken,
      source: {
        source: "credential-file",
        detail:
          `source=credential-file appPath=${collapseHomePath(canonicalAppTokenFile)} ` +
          `botPath=${collapseHomePath(canonicalBotTokenFile)}`,
        paths: [canonicalAppTokenFile, canonicalBotTokenFile],
      },
    };
  }

  const envReference = getSlackEnvReference(params.config, accountId);
  const appEnvName = extractEnvReferenceName(envReference.appToken);
  const botEnvName = extractEnvReferenceName(envReference.botToken);
  if (appEnvName && botEnvName) {
    const appToken = env[appEnvName]?.trim();
    const botToken = env[botEnvName]?.trim();
    if (!appToken) {
      throw new MissingEnvVarError(
        appEnvName,
        `bots.slack.${accountId}.appToken`,
      );
    }
    if (!botToken) {
      throw new MissingEnvVarError(
        botEnvName,
        `bots.slack.${accountId}.botToken`,
      );
    }
    return {
      accountId,
      appToken,
      botToken,
      source: {
        source: "env",
        detail: `source=env app=${appEnvName} bot=${botEnvName}`,
        names: [appEnvName, botEnvName],
      },
    };
  }

  if (envReference.appToken.trim() && envReference.botToken.trim()) {
    return {
      accountId,
      appToken: envReference.appToken.trim(),
      botToken: envReference.botToken.trim(),
      source: {
        source: "config-inline",
        detail: "source=config-inline legacyCompatibility=yes",
      },
    };
  }

  throw new Error(`Unknown Slack account: ${accountId}`);
}

export function materializeRuntimeChannelCredentials(
  config: ClisbotConfig,
  options: {
    env?: NodeJS.ProcessEnv;
    runtimeCredentialsPath?: string;
    materializeChannels?: Array<"slack" | "telegram">;
  } = {},
) {
  const env = options.env ?? process.env;
  const nextConfig = structuredClone(config) as ClisbotConfig;
  const materializeChannels = options.materializeChannels ?? [];
  const materializeAll = materializeChannels.length === 0;
  const shouldMaterializeTelegram =
    materializeAll || materializeChannels.includes("telegram");
  const shouldMaterializeSlack =
    materializeAll || materializeChannels.includes("slack");

  if (shouldMaterializeTelegram && nextConfig.bots.telegram.defaults.enabled) {
    const accountIds = Object.keys(getTelegramBotsRecord(nextConfig.bots.telegram));
    const ids = accountIds.length > 0
      ? accountIds
      : [getConfiguredDefaultAccountId({
        defaultBotId: nextConfig.bots.telegram.defaults.defaultBotId,
        bots: getTelegramBotsRecord(nextConfig.bots.telegram),
      })];
    const resolvedAccounts: Record<string, TelegramPersistentAccountConfig> = {};
    for (const accountId of ids) {
      const existing = (getTelegramAccountConfig(nextConfig.bots.telegram, accountId) ?? {}) as
        TelegramPersistentAccountConfig;
      if (existing.enabled === false) {
        continue;
      }
      let resolved: ResolvedTelegramCredential | undefined;
      try {
        resolved = resolveTelegramCredential({
          config: config.bots.telegram,
          accountId,
          env,
          runtimeCredentialsPath: options.runtimeCredentialsPath,
        });
      } catch (error) {
        if (!(error instanceof MissingMemCredentialError)) {
          throw error;
        }
      }
      if (!resolved) {
        continue;
      }
      resolvedAccounts[accountId] = {
        ...existing,
        botToken: resolved.botToken,
      };
    }
    for (const [accountId, resolved] of Object.entries(resolvedAccounts)) {
      const current = nextConfig.bots.telegram[accountId] as TelegramPersistentAccountConfig | undefined;
      if (!current) {
        continue;
      }
      nextConfig.bots.telegram[accountId] = {
        ...current,
        botToken: resolved.botToken,
      };
    }
  }

  if (shouldMaterializeSlack && nextConfig.bots.slack.defaults.enabled) {
    const accountIds = Object.keys(getSlackBotsRecord(nextConfig.bots.slack));
    const ids = accountIds.length > 0
      ? accountIds
      : [getConfiguredDefaultAccountId({
        defaultBotId: nextConfig.bots.slack.defaults.defaultBotId,
        bots: getSlackBotsRecord(nextConfig.bots.slack),
      })];
    const resolvedAccounts: Record<string, SlackPersistentAccountConfig> = {};
    for (const accountId of ids) {
      const existing = (getSlackAccountConfig(nextConfig.bots.slack, accountId) ?? {}) as
        SlackPersistentAccountConfig;
      if (existing.enabled === false) {
        continue;
      }
      let resolved: ResolvedSlackCredential | undefined;
      try {
        resolved = resolveSlackCredential({
          config: config.bots.slack,
          accountId,
          env,
          runtimeCredentialsPath: options.runtimeCredentialsPath,
        });
      } catch (error) {
        if (!(error instanceof MissingMemCredentialError)) {
          throw error;
        }
      }
      if (!resolved) {
        continue;
      }
      resolvedAccounts[accountId] = {
        ...existing,
        appToken: resolved.appToken,
        botToken: resolved.botToken,
      };
    }
    for (const [accountId, resolved] of Object.entries(resolvedAccounts)) {
      const current = nextConfig.bots.slack[accountId] as SlackPersistentAccountConfig | undefined;
      if (!current) {
        continue;
      }
      nextConfig.bots.slack[accountId] = {
        ...current,
        appToken: resolved.appToken,
        botToken: resolved.botToken,
      };
    }
  }

  return nextConfig;
}

export function describeTelegramCredentialSource(params: {
  config: ClisbotConfig["bots"]["telegram"];
  accountId?: string | null;
  env?: NodeJS.ProcessEnv;
  runtimeCredentialsPath?: string;
}) {
  const env = params.env ?? process.env;
  const accountId = normalizeAccountId(params.accountId) ?? getConfiguredDefaultAccountId({
    defaultBotId: params.config.defaults.defaultBotId,
    bots: getTelegramBotsRecord(params.config),
  });
  const account = getTelegramAccountConfig(params.config, accountId);
  if (account?.credentialType === "mem") {
    const envName = getTelegramMemEnvName(accountId);
    const runtimeBotToken = getRuntimeCredentialDocument(params.runtimeCredentialsPath).telegram?.[accountId]
      ?.botToken?.trim();
    return {
      source: "cli-ephemeral" as const,
      detail: env[envName]?.trim() || runtimeBotToken
        ? "source=cli-ephemeral restartRequiresPersistence=yes"
        : "source=cli-ephemeral available=no restartRequiresPersistence=yes",
    };
  }
  return resolveTelegramCredential(params).source;
}

export function describeSlackCredentialSource(params: {
  config: ClisbotConfig["bots"]["slack"];
  accountId?: string | null;
  env?: NodeJS.ProcessEnv;
  runtimeCredentialsPath?: string;
}) {
  const env = params.env ?? process.env;
  const accountId = normalizeAccountId(params.accountId) ?? getConfiguredDefaultAccountId({
    defaultBotId: params.config.defaults.defaultBotId,
    bots: getSlackBotsRecord(params.config),
  });
  const account = getSlackAccountConfig(params.config, accountId);
  if (account?.credentialType === "mem") {
    const appEnvName = getSlackMemAppEnvName(accountId);
    const botEnvName = getSlackMemBotEnvName(accountId);
    const runtime = getRuntimeCredentialDocument(params.runtimeCredentialsPath).slack?.[accountId];
    return {
      source: "cli-ephemeral" as const,
      detail:
        env[appEnvName]?.trim() || env[botEnvName]?.trim() || runtime?.appToken?.trim() || runtime?.botToken?.trim()
          ? "source=cli-ephemeral restartRequiresPersistence=yes"
          : "source=cli-ephemeral available=no restartRequiresPersistence=yes",
    };
  }
  return resolveSlackCredential(params).source;
}

export {
  clearSlackRuntimeCredential,
  clearTelegramRuntimeCredential,
  getCanonicalSlackAppTokenPath,
  getCanonicalSlackBotTokenPath,
  getCanonicalTelegramBotTokenPath,
  getConfigReloadMtimeMs,
  getCredentialSkipPaths,
  getSlackMemAppEnvName,
  getSlackMemBotEnvName,
  getTelegramMemEnvName,
  parseTokenInput,
  persistSlackCredential,
  persistTelegramCredential,
  removeRuntimeCredentials,
  setSlackRuntimeCredential,
  setTelegramRuntimeCredential,
};
export type {
  ParsedTokenInput,
  ResolvedCredentialSource,
  ResolvedSlackCredential,
  ResolvedTelegramCredential,
};
