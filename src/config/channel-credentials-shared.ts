import { join } from "node:path";
import type { ClisbotConfig } from "./schema.ts";
import { extractEnvReferenceName, normalizeEnvReference } from "../shared/env-references.ts";
import { getDefaultCredentialsDir } from "../shared/paths.ts";

const ENV_REFERENCE_PATHS = [
  "channels.slack.appToken",
  "channels.slack.botToken",
  "channels.telegram.botToken",
];

const TOKEN_ENV_PATTERN = /^[A-Z_][A-Z0-9_]*$/;

export type SlackPersistentAccountConfig =
  ClisbotConfig["channels"]["slack"]["accounts"][string];
export type TelegramPersistentAccountConfig =
  ClisbotConfig["channels"]["telegram"]["accounts"][string];

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

export function getAccountsRecord(accounts: unknown) {
  if (!isRecord(accounts)) {
    return {} as Record<string, unknown>;
  }
  return accounts;
}

export function normalizeAccountId(accountId?: string | null) {
  const trimmed = accountId?.trim();
  return trimmed ? trimmed : undefined;
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
  accounts: unknown;
}) {
  const accounts = getAccountsRecord(params.accounts);
  const explicit = normalizeAccountId(params.defaultAccount);
  if (explicit) {
    return explicit;
  }

  if ("default" in accounts) {
    return "default";
  }

  const firstAccountId = Object.keys(accounts)[0];
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
  config: ClisbotConfig["channels"]["telegram"],
  accountId: string,
) {
  return getAccountsRecord(config.accounts)[accountId] as TelegramPersistentAccountConfig | undefined;
}

export function getSlackAccountConfig(
  config: ClisbotConfig["channels"]["slack"],
  accountId: string,
) {
  return getAccountsRecord(config.accounts)[accountId] as SlackPersistentAccountConfig | undefined;
}

export function getTelegramEnvReference(
  config: ClisbotConfig["channels"]["telegram"],
  accountId: string,
) {
  const account = getTelegramAccountConfig(config, accountId);
  const accountToken = trimString(account?.botToken);
  if (accountToken) {
    return accountToken;
  }
  return trimString(config.botToken);
}

export function getSlackEnvReference(
  config: ClisbotConfig["channels"]["slack"],
  accountId: string,
) {
  const account = getSlackAccountConfig(config, accountId);
  return {
    appToken: trimString(account?.appToken) || trimString(config.appToken),
    botToken: trimString(account?.botToken) || trimString(config.botToken),
  };
}

export function getCredentialSkipPaths(parsed: unknown) {
  const skipPaths = [...ENV_REFERENCE_PATHS];
  const channels = isRecord(parsed) ? parsed.channels : undefined;

  if (!isRecord(channels)) {
    return skipPaths;
  }

  const slack = isRecord(channels.slack) ? channels.slack : undefined;
  const slackAccounts = isRecord(slack?.accounts) ? slack.accounts : undefined;
  if (slackAccounts) {
    for (const accountId of Object.keys(slackAccounts)) {
      skipPaths.push(
        `channels.slack.accounts.${accountId}.appToken`,
        `channels.slack.accounts.${accountId}.botToken`,
      );
    }
  }

  const telegram = isRecord(channels.telegram) ? channels.telegram : undefined;
  const telegramAccounts = isRecord(telegram?.accounts) ? telegram.accounts : undefined;
  if (telegramAccounts) {
    for (const accountId of Object.keys(telegramAccounts)) {
      skipPaths.push(`channels.telegram.accounts.${accountId}.botToken`);
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
