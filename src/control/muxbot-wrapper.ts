import { chmod } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { fileExists, writeTextFile } from "../shared/fs.ts";
import { APP_HOME_DIR, ensureDir, expandHomePath } from "../shared/paths.ts";

export const DEFAULT_MUXBOT_BIN_DIR = join(APP_HOME_DIR, "bin");
export const DEFAULT_MUXBOT_WRAPPER_PATH = join(DEFAULT_MUXBOT_BIN_DIR, "muxbot");

function shellQuote(value: string) {
  if (/^[a-zA-Z0-9_./:@=-]+$/.test(value)) {
    return value;
  }
  return `'${value.replaceAll("'", `'\"'\"'`)}'`;
}

function getMuxbotMainScriptPath() {
  return fileURLToPath(new URL("../main.ts", import.meta.url));
}

export function getMuxbotWrapperPath() {
  return expandHomePath(process.env.MUXBOT_WRAPPER_PATH || DEFAULT_MUXBOT_WRAPPER_PATH);
}

export function getMuxbotWrapperDir() {
  return dirname(getMuxbotWrapperPath());
}

export function renderMuxbotWrapperScript() {
  const execPath = process.execPath;
  const mainScriptPath = getMuxbotMainScriptPath();

  return [
    "#!/usr/bin/env bash",
    "set -euo pipefail",
    `exec ${shellQuote(execPath)} ${shellQuote(mainScriptPath)} "$@"`,
    "",
  ].join("\n");
}

export async function ensureMuxbotWrapper() {
  const wrapperPath = getMuxbotWrapperPath();
  const wrapperDir = dirname(wrapperPath);
  await ensureDir(wrapperDir);

  const nextScript = renderMuxbotWrapperScript();
  const existing = await fileExists(wrapperPath) ? await Bun.file(wrapperPath).text() : null;
  if (existing !== nextScript) {
    await writeTextFile(wrapperPath, nextScript);
  }

  await chmod(wrapperPath, 0o755);
  return wrapperPath;
}
