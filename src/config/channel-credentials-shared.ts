import { join } from "node:path";
import type {
  ClisbotConfig,
  SlackBotConfig,
  TelegramBotConfig,
} from "./schema.ts";
import { extractEnvReferenceName, normalizeEnvReference } from "../shared/env-references.ts";
import { getDefaultCredentialsDir } from "../shared/paths.ts";

const TOKEN_ENV_PATTERN = /^[A-Z_][A-Z0-9_]*$/;

export type SlackPersistentAccountConfig = SlackBotConfig;
export type TelegramPersistentAccountConfig = TelegramBotConfig;

export type RuntimeCredentialDocument = {
  slack?: Record<string, { appToken?: string; botToken?: string }>;
  telegram?: Record<string, { botToken?: string }>;
};

export type ParsedTokenInput =
  | {
      kind: "env";
      envName: string;
      placeholder: string;
    }
  | {
      kind: "mem";
      secret: string;
    };

export type ResolvedCredentialSource =
  | {
      source: "cli-ephemeral";
      detail: string;
    }
  | {
      source: "credential-file";
      detail: string;
      paths: string[];
    }
  | {
      source: "env";
      detail: string;
      names: string[];
    }
  | {
      source: "config-inline";
      detail: string;
    };

export type ResolvedSlackCredential = {
  accountId: string;
  appToken: string;
  botToken: string;
  source: ResolvedCredentialSource;
};

export type ResolvedTelegramCredential = {
  accountId: string;
  botToken: string;
  source: ResolvedCredentialSource;
};

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function normalizeAccountId(accountId?: string | null) {
  const trimmed = accountId?.trim();
  return trimmed ? trimmed : undefined;
}

export function getSlackBotsRecord(
  config: ClisbotConfig["bots"]["slack"],
) {
  const { defaults, ...bots } = config;
  return bots;
}

export function getTelegramBotsRecord(
  config: ClisbotConfig["bots"]["telegram"],
) {
  const { defaults, ...bots } = config;
  return bots;
}

function normalizeAccountEnvSegment(accountId: string) {
  return accountId
    .trim()
    .replaceAll(/[^a-zA-Z0-9]+/g, "_")
    .replaceAll(/_+/g, "_")
    .replaceAll(/^_|_$/g, "")
    .toUpperCase() || "DEFAULT";
}

export function getConfiguredDefaultAccountId(params: {
  defaultAccount?: string;
  defaultBotId?: string;
  accounts?: unknown;
  bots?: Record<string, unknown>;
}) {
  const explicit =
    normalizeAccountId(params.defaultBotId) ??
    normalizeAccountId(params.defaultAccount);
  if (explicit) {
    return explicit;
  }

  const bots = params.bots ??
    (isRecord(params.accounts) ? (params.accounts as Record<string, unknown>) : {});

  if ("default" in bots) {
    return "default";
  }

  const firstAccountId = Object.keys(bots)[0];
  return normalizeAccountId(firstAccountId) ?? "default";
}

export function getTelegramMemEnvName(accountId: string) {
  return `CLISBOT_MEM_TELEGRAM__${normalizeAccountEnvSegment(accountId)}__BOT_TOKEN`;
}

export function getSlackMemAppEnvName(accountId: string) {
  return `CLISBOT_MEM_SLACK__${normalizeAccountEnvSegment(accountId)}__APP_TOKEN`;
}

export function getSlackMemBotEnvName(accountId: string) {
  return `CLISBOT_MEM_SLACK__${normalizeAccountEnvSegment(accountId)}__BOT_TOKEN`;
}

export function trimString(value?: string) {
  return value?.trim() ?? "";
}

export function getTelegramAccountConfig(
  config: ClisbotConfig["bots"]["telegram"],
  accountId: string,
) {
  return getTelegramBotsRecord(config)[accountId] as TelegramPersistentAccountConfig | undefined;
}

export function getSlackAccountConfig(
  config: ClisbotConfig["bots"]["slack"],
  accountId: string,
) {
  return getSlackBotsRecord(config)[accountId] as SlackPersistentAccountConfig | undefined;
}

export function getTelegramEnvReference(
  config: ClisbotConfig["bots"]["telegram"],
  accountId: string,
) {
  const account = getTelegramAccountConfig(config, accountId);
  return trimString(account?.botToken);
}

export function getSlackEnvReference(
  config: ClisbotConfig["bots"]["slack"],
  accountId: string,
) {
  const account = getSlackAccountConfig(config, accountId);
  return {
    appToken: trimString(account?.appToken),
    botToken: trimString(account?.botToken),
  };
}

export function getCredentialSkipPaths(parsed: unknown) {
  const skipPaths: string[] = [];
  const bots = isRecord(parsed) ? parsed.bots : undefined;

  if (!isRecord(bots)) {
    return skipPaths;
  }

  const slack = isRecord(bots.slack) ? bots.slack : undefined;
  if (slack) {
    for (const [botId, bot] of Object.entries(slack)) {
      if (botId === "defaults" || !isRecord(bot)) {
        continue;
      }
      skipPaths.push(
        `bots.slack.${botId}.appToken`,
        `bots.slack.${botId}.botToken`,
      );
    }
  }

  const telegram = isRecord(bots.telegram) ? bots.telegram : undefined;
  if (telegram) {
    for (const [botId, bot] of Object.entries(telegram)) {
      if (botId === "defaults" || !isRecord(bot)) {
        continue;
      }
      skipPaths.push(`bots.telegram.${botId}.botToken`);
    }
  }

  return skipPaths;
}

export function parseTokenInput(value: string): ParsedTokenInput {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error("Expected a token value or env reference");
  }

  const normalizedEnv = normalizeEnvReference(trimmed);
  const envName = extractEnvReferenceName(normalizedEnv);
  if (envName) {
    return {
      kind: "env",
      envName,
      placeholder: `\${${envName}}`,
    };
  }

  if (TOKEN_ENV_PATTERN.test(trimmed)) {
    return {
      kind: "env",
      envName: trimmed,
      placeholder: `\${${trimmed}}`,
    };
  }

  return {
    kind: "mem",
    secret: trimmed,
  };
}

export function getCanonicalTelegramBotTokenPath(
  accountId: string,
  env: NodeJS.ProcessEnv = process.env,
) {
  return join(getDefaultCredentialsDir(env), "telegram", accountId, "bot-token");
}

export function getCanonicalSlackAppTokenPath(
  accountId: string,
  env: NodeJS.ProcessEnv = process.env,
) {
  return join(getDefaultCredentialsDir(env), "slack", accountId, "app-token");
}

export function getCanonicalSlackBotTokenPath(
  accountId: string,
  env: NodeJS.ProcessEnv = process.env,
) {
  return join(getDefaultCredentialsDir(env), "slack", accountId, "bot-token");
}
