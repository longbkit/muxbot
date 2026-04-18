import type { ClisbotConfig } from "./schema.ts";
import type {
  ParsedSlackAccountFlags,
  ParsedTelegramAccountFlags,
} from "../control/channel-bootstrap-flags.ts";
import {
  clearSlackRuntimeCredential,
  clearTelegramRuntimeCredential,
  getSlackMemAppEnvName,
  getSlackMemBotEnvName,
  getTelegramMemEnvName,
  persistSlackCredential,
  persistTelegramCredential,
  setSlackRuntimeCredential,
  setTelegramRuntimeCredential,
} from "./channel-credentials.ts";

export type ChannelBootstrapAccounts = {
  slackAccounts: ParsedSlackAccountFlags[];
  telegramAccounts: ParsedTelegramAccountFlags[];
};

function getFirstAccountId(accounts: Array<{ accountId: string }>) {
  return accounts[0]?.accountId ?? "default";
}

function getEnabledBotIds(bots: Record<string, { enabled?: boolean }>) {
  return Object.entries(bots)
    .filter(([, bot]) => bot.enabled !== false)
    .map(([botId]) => botId);
}

function getSlackBots(config: ClisbotConfig) {
  const { defaults, ...bots } = config.bots.slack;
  return bots;
}

function getTelegramBots(config: ClisbotConfig) {
  const { defaults, ...bots } = config.bots.telegram;
  return bots;
}

function reconcileSlackConfiguredAccounts(config: ClisbotConfig) {
  const enabledBotIds = getEnabledBotIds(getSlackBots(config));
  if (enabledBotIds.length === 0) {
    config.bots.slack.defaults.enabled = false;
    return;
  }

  if (
    !config.bots.slack.defaults.defaultBotId ||
    !enabledBotIds.includes(config.bots.slack.defaults.defaultBotId)
  ) {
    config.bots.slack.defaults.defaultBotId = enabledBotIds[0];
  }
}

function reconcileTelegramConfiguredAccounts(config: ClisbotConfig) {
  const enabledBotIds = getEnabledBotIds(getTelegramBots(config));
  if (enabledBotIds.length === 0) {
    config.bots.telegram.defaults.enabled = false;
    return;
  }

  if (
    !config.bots.telegram.defaults.defaultBotId ||
    !enabledBotIds.includes(config.bots.telegram.defaults.defaultBotId)
  ) {
    config.bots.telegram.defaults.defaultBotId = enabledBotIds[0];
  }
}

function applySlackAccountConfig(
  config: ClisbotConfig,
  account: ParsedSlackAccountFlags,
) {
  if (!account.appToken || !account.botToken) {
    throw new Error(`Slack account ${account.accountId} is incomplete`);
  }

  const existing = config.bots.slack[account.accountId];
  config.bots.slack[account.accountId] = account.appToken.kind === "env" &&
      account.botToken.kind === "env"
    ? {
        ...existing,
        enabled: true,
        appToken: account.appToken.placeholder,
        botToken: account.botToken.placeholder,
      }
    : {
        ...existing,
        enabled: true,
        credentialType: "mem",
        appToken: "",
        botToken: "",
      };
}

function applyTelegramAccountConfig(
  config: ClisbotConfig,
  account: ParsedTelegramAccountFlags,
) {
  if (!account.botToken) {
    throw new Error(`Telegram account ${account.accountId} is incomplete`);
  }

  const existing = config.bots.telegram[account.accountId];
  config.bots.telegram[account.accountId] = account.botToken.kind === "env"
    ? {
        ...existing,
        enabled: true,
        botToken: account.botToken.placeholder,
      }
    : {
        ...existing,
        enabled: true,
        credentialType: "mem",
        botToken: "",
      };
}

export function buildBootstrapRuntimeMemEnv(
  accounts: ChannelBootstrapAccounts,
  env: NodeJS.ProcessEnv = process.env,
) {
  const extraEnv: NodeJS.ProcessEnv = { ...env };

  for (const account of accounts.telegramAccounts) {
    if (account.botToken?.kind !== "mem") {
      continue;
    }
    extraEnv[getTelegramMemEnvName(account.accountId)] = account.botToken.secret;
  }

  for (const account of accounts.slackAccounts) {
    if (account.appToken?.kind !== "mem" || account.botToken?.kind !== "mem") {
      continue;
    }
    extraEnv[getSlackMemAppEnvName(account.accountId)] = account.appToken.secret;
    extraEnv[getSlackMemBotEnvName(account.accountId)] = account.botToken.secret;
  }

  return extraEnv;
}

export function deactivateExpiredMemAccounts(
  config: ClisbotConfig,
  activeMemAccounts: Partial<Record<"slack" | "telegram", Set<string>>> = {},
) {
  const summaries: string[] = [];
  const activeSlackMemAccounts = activeMemAccounts.slack ?? new Set<string>();
  const activeTelegramMemAccounts = activeMemAccounts.telegram ?? new Set<string>();

  for (const [accountId, account] of Object.entries(getSlackBots(config))) {
    if (account.credentialType !== "mem" || activeSlackMemAccounts.has(accountId)) {
      continue;
    }
    if (account.enabled !== false) {
      summaries.push(`Disabled expired slack/${accountId} (credentialType=mem).`);
    }
    account.enabled = false;
  }

  for (const [accountId, account] of Object.entries(getTelegramBots(config))) {
    if (account.credentialType !== "mem" || activeTelegramMemAccounts.has(accountId)) {
      continue;
    }
    if (account.enabled !== false) {
      summaries.push(`Disabled expired telegram/${accountId} (credentialType=mem).`);
    }
    account.enabled = false;
  }

  reconcileSlackConfiguredAccounts(config);
  reconcileTelegramConfiguredAccounts(config);

  return summaries;
}

export function applyBootstrapAccountsToConfig(
  config: ClisbotConfig,
  accounts: ChannelBootstrapAccounts,
  options: {
    firstRun: boolean;
  },
) {
  if (options.firstRun) {
    config.bots.slack.defaults.enabled = accounts.slackAccounts.length > 0;
    for (const botId of Object.keys(getSlackBots(config))) {
      delete config.bots.slack[botId];
    }
    config.bots.slack.defaults.defaultBotId = getFirstAccountId(accounts.slackAccounts);

    config.bots.telegram.defaults.enabled = accounts.telegramAccounts.length > 0;
    for (const botId of Object.keys(getTelegramBots(config))) {
      delete config.bots.telegram[botId];
    }
    config.bots.telegram.defaults.defaultBotId = getFirstAccountId(accounts.telegramAccounts);
  }

  if (accounts.slackAccounts.length > 0) {
    config.bots.slack.defaults.enabled = true;
    if (!config.bots.slack.defaults.defaultBotId) {
      config.bots.slack.defaults.defaultBotId = getFirstAccountId(accounts.slackAccounts);
    }
    for (const account of accounts.slackAccounts) {
      applySlackAccountConfig(config, account);
    }
    reconcileSlackConfiguredAccounts(config);
  }

  if (accounts.telegramAccounts.length > 0) {
    config.bots.telegram.defaults.enabled = true;
    if (!config.bots.telegram.defaults.defaultBotId) {
      config.bots.telegram.defaults.defaultBotId = getFirstAccountId(accounts.telegramAccounts);
    }
    for (const account of accounts.telegramAccounts) {
      applyTelegramAccountConfig(config, account);
    }
    reconcileTelegramConfiguredAccounts(config);
  }
}

export function stageBootstrapRuntimeCredentials(
  accounts: ChannelBootstrapAccounts,
  runtimeCredentialsPath?: string,
) {
  for (const account of accounts.slackAccounts) {
    if (account.appToken?.kind !== "mem" || account.botToken?.kind !== "mem") {
      continue;
    }
    setSlackRuntimeCredential({
      accountId: account.accountId,
      appToken: account.appToken.secret,
      botToken: account.botToken.secret,
      runtimeCredentialsPath,
    });
  }

  for (const account of accounts.telegramAccounts) {
    if (account.botToken?.kind !== "mem") {
      continue;
    }
    setTelegramRuntimeCredential({
      accountId: account.accountId,
      botToken: account.botToken.secret,
      runtimeCredentialsPath,
    });
  }
}

export function persistBootstrapMemCredentials(
  config: ClisbotConfig,
  accounts: ChannelBootstrapAccounts,
  runtimeCredentialsPath?: string,
) {
  const summaries: string[] = [];

  for (const account of accounts.slackAccounts) {
    if (account.appToken?.kind !== "mem" || account.botToken?.kind !== "mem") {
      continue;
    }
    persistSlackCredential({
      accountId: account.accountId,
      appToken: account.appToken.secret,
      botToken: account.botToken.secret,
    });
    config.bots.slack[account.accountId] = {
      ...(config.bots.slack[account.accountId] ?? {}),
      enabled: true,
      credentialType: "tokenFile",
      appToken: "",
      botToken: "",
      appTokenFile: undefined,
      botTokenFile: undefined,
    };
    clearSlackRuntimeCredential({
      accountId: account.accountId,
      runtimeCredentialsPath,
    });
    summaries.push(`Persisted slack/${account.accountId} to credential file.`);
  }

  for (const account of accounts.telegramAccounts) {
    if (account.botToken?.kind !== "mem") {
      continue;
    }
    persistTelegramCredential({
      accountId: account.accountId,
      botToken: account.botToken.secret,
    });
    config.bots.telegram[account.accountId] = {
      ...(config.bots.telegram[account.accountId] ?? {}),
      enabled: true,
      credentialType: "tokenFile",
      botToken: "",
      tokenFile: undefined,
    };
    clearTelegramRuntimeCredential({
      accountId: account.accountId,
      runtimeCredentialsPath,
    });
    summaries.push(`Persisted telegram/${account.accountId} to credential file.`);
  }

  reconcileSlackConfiguredAccounts(config);
  reconcileTelegramConfiguredAccounts(config);

  return summaries;
}
