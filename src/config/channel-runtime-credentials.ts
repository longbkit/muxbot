import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import {
  getCanonicalSlackAppTokenPath,
  getCanonicalSlackBotTokenPath,
  getCanonicalTelegramBotTokenPath,
  type RuntimeCredentialDocument,
} from "./channel-credentials-shared.ts";
import {
  expandHomePath,
  getDefaultCredentialsDir,
  getDefaultRuntimeCredentialsPath,
} from "../shared/paths.ts";

const CREDENTIALS_GITIGNORE_CONTENT = ["*", "!*/", "!.gitignore", ""].join("\n");

function readTrimmedFile(pathname: string) {
  return readFileSync(pathname, "utf8").trim();
}

export function readRequiredCredentialFile(pathname: string, configPath: string) {
  const expanded = expandHomePath(pathname);
  if (!existsSync(expanded)) {
    throw new Error(`Missing credential file for ${configPath}: ${expanded}`);
  }

  const value = readTrimmedFile(expanded);
  if (!value) {
    throw new Error(`Credential file is empty for ${configPath}: ${expanded}`);
  }

  return value;
}

export function readOptionalCanonicalCredentialFile(pathname: string) {
  const expanded = expandHomePath(pathname);
  if (!existsSync(expanded)) {
    return undefined;
  }

  const value = readTrimmedFile(expanded);
  if (!value) {
    throw new Error(`Credential file is empty: ${expanded}`);
  }

  return value;
}

export function getRuntimeCredentialDocument(
  runtimeCredentialsPath = getDefaultRuntimeCredentialsPath(),
): RuntimeCredentialDocument {
  const expanded = expandHomePath(runtimeCredentialsPath);
  if (!existsSync(expanded)) {
    return {};
  }

  const text = readTrimmedFile(expanded);
  if (!text) {
    return {};
  }

  return JSON.parse(text) as RuntimeCredentialDocument;
}

function writeRuntimeCredentialDocument(
  document: RuntimeCredentialDocument,
  runtimeCredentialsPath = getDefaultRuntimeCredentialsPath(),
) {
  const expanded = expandHomePath(runtimeCredentialsPath);
  mkdirSync(dirname(expanded), { recursive: true });
  writeFileSync(expanded, `${JSON.stringify(document, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600,
  });
  chmodSync(expanded, 0o600);
}

function ensureCanonicalCredentialArtifacts(env: NodeJS.ProcessEnv = process.env) {
  const credentialsDir = getDefaultCredentialsDir(env);
  mkdirSync(credentialsDir, { recursive: true });
  const ignorePath = join(credentialsDir, ".gitignore");
  if (!existsSync(ignorePath)) {
    writeFileSync(ignorePath, CREDENTIALS_GITIGNORE_CONTENT, {
      encoding: "utf8",
      mode: 0o644,
    });
  }
}

function writeSecretFile(pathname: string, value: string) {
  const expanded = expandHomePath(pathname);
  mkdirSync(dirname(expanded), { recursive: true });
  writeFileSync(expanded, `${value.trim()}\n`, {
    encoding: "utf8",
    mode: 0o600,
  });
  chmodSync(expanded, 0o600);
}

export function removeRuntimeCredentials(
  runtimeCredentialsPath = getDefaultRuntimeCredentialsPath(),
) {
  rmSync(expandHomePath(runtimeCredentialsPath), { force: true });
}

export function setTelegramRuntimeCredential(params: {
  accountId: string;
  botToken: string;
  runtimeCredentialsPath?: string;
}) {
  const document = getRuntimeCredentialDocument(params.runtimeCredentialsPath);
  document.telegram ??= {};
  document.telegram[params.accountId] = {
    botToken: params.botToken.trim(),
  };
  writeRuntimeCredentialDocument(document, params.runtimeCredentialsPath);
}

export function setSlackRuntimeCredential(params: {
  accountId: string;
  appToken: string;
  botToken: string;
  runtimeCredentialsPath?: string;
}) {
  const document = getRuntimeCredentialDocument(params.runtimeCredentialsPath);
  document.slack ??= {};
  document.slack[params.accountId] = {
    appToken: params.appToken.trim(),
    botToken: params.botToken.trim(),
  };
  writeRuntimeCredentialDocument(document, params.runtimeCredentialsPath);
}

export function clearTelegramRuntimeCredential(params: {
  accountId: string;
  runtimeCredentialsPath?: string;
}) {
  const document = getRuntimeCredentialDocument(params.runtimeCredentialsPath);
  if (document.telegram) {
    delete document.telegram[params.accountId];
  }
  writeRuntimeCredentialDocument(document, params.runtimeCredentialsPath);
}

export function clearSlackRuntimeCredential(params: {
  accountId: string;
  runtimeCredentialsPath?: string;
}) {
  const document = getRuntimeCredentialDocument(params.runtimeCredentialsPath);
  if (document.slack) {
    delete document.slack[params.accountId];
  }
  writeRuntimeCredentialDocument(document, params.runtimeCredentialsPath);
}

export function persistTelegramCredential(params: {
  accountId: string;
  botToken: string;
  env?: NodeJS.ProcessEnv;
}) {
  ensureCanonicalCredentialArtifacts(params.env);
  const path = getCanonicalTelegramBotTokenPath(params.accountId, params.env);
  writeSecretFile(path, params.botToken);
  return path;
}

export function persistSlackCredential(params: {
  accountId: string;
  appToken: string;
  botToken: string;
  env?: NodeJS.ProcessEnv;
}) {
  ensureCanonicalCredentialArtifacts(params.env);
  const appPath = getCanonicalSlackAppTokenPath(params.accountId, params.env);
  const botPath = getCanonicalSlackBotTokenPath(params.accountId, params.env);
  writeSecretFile(appPath, params.appToken);
  writeSecretFile(botPath, params.botToken);
  return {
    appPath,
    botPath,
  };
}

export function getConfigReloadMtimeMs(configPath: string) {
  return statSync(expandHomePath(configPath)).mtimeMs;
}
