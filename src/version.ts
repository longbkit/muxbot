import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

let cachedVersion: string | undefined;

export function getMuxbotVersion() {
  if (cachedVersion) {
    return cachedVersion;
  }

  const packageJsonPath = join(dirname(fileURLToPath(import.meta.url)), "..", "package.json");
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as { version?: string };
  cachedVersion = packageJson.version ?? "0.0.0";
  return cachedVersion;
}
