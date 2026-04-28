import { basename, dirname, join } from "node:path";
import { ensureDir, fileExists, readTextFile, writeTextFile } from "../shared/fs.ts";
import { collapseHomePath, expandHomePath } from "../shared/paths.ts";
import { applyDynamicPathDefaults, assertNoLegacyPrivilegeCommands } from "./config-document.ts";
import {
  CURRENT_SCHEMA_VERSION,
  normalizeConfigDocumentShape,
  shouldUpgradeConfigSchema,
} from "./config-migration.ts";
import { normalizeConfigDirectMessageRoutes } from "./direct-message-routes.ts";
import { normalizeConfigGroupRoutes } from "./group-routes.ts";
import { pruneConfigForPersistence } from "./persisted-config.ts";
import { clisbotConfigSchema } from "./schema.ts";

function readSchemaVersion(value: unknown) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return undefined;
  }
  const meta = (value as Record<string, unknown>).meta;
  if (typeof meta !== "object" || meta === null || Array.isArray(meta)) {
    return undefined;
  }
  const schemaVersion = (meta as Record<string, unknown>).schemaVersion;
  return typeof schemaVersion === "string" ? schemaVersion.trim() : undefined;
}

function logUpgradeStage(message: string) {
  console.warn(`clisbot config upgrade: ${message}`);
}

function renderBackupTimestamp(date = new Date()) {
  return date.toISOString().replaceAll(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

async function reserveBackupPath(configPath: string, schemaVersion: string | undefined) {
  const backupDir = join(dirname(configPath), "backups");
  await ensureDir(backupDir);
  const versionLabel = (schemaVersion || "unknown").replaceAll(/[^a-zA-Z0-9._-]/g, "_");
  const baseName = `${basename(configPath)}.${versionLabel}.${renderBackupTimestamp()}`;
  let candidate = join(backupDir, baseName);
  let suffix = 1;
  while (await fileExists(candidate)) {
    candidate = join(backupDir, `${baseName}.${suffix}`);
    suffix += 1;
  }
  return candidate;
}

export async function upgradeEditableConfigFileIfNeeded(configPath: string) {
  const expandedConfigPath = expandHomePath(configPath);
  const originalText = await readTextFile(expandedConfigPath);
  const rawConfig = JSON.parse(originalText);
  const fromVersion = readSchemaVersion(rawConfig);

  if (!shouldUpgradeConfigSchema(fromVersion)) {
    return { upgraded: false as const };
  }

  const versionLabel = fromVersion || "legacy";
  const backupPath = await reserveBackupPath(expandedConfigPath, fromVersion);
  await writeTextFile(backupPath, originalText.endsWith("\n") ? originalText : `${originalText}\n`);
  logUpgradeStage(
    `backup ${versionLabel} config to ${collapseHomePath(backupPath)}`,
  );
  logUpgradeStage(`preparing ${versionLabel} -> ${CURRENT_SCHEMA_VERSION}`);

  const normalizedDocument = normalizeConfigDocumentShape(rawConfig);
  assertNoLegacyPrivilegeCommands(normalizedDocument);
  logUpgradeStage(`dry-run validating ${CURRENT_SCHEMA_VERSION} config`);
  const normalizedConfig = normalizeConfigGroupRoutes(
    normalizeConfigDirectMessageRoutes(
      clisbotConfigSchema.parse(applyDynamicPathDefaults(normalizedDocument)),
      {
        exactAdmissionMode: "explicit",
      },
    ),
  );
  logUpgradeStage(`applying ${CURRENT_SCHEMA_VERSION} config to ${collapseHomePath(expandedConfigPath)}`);
  const persistedConfig = pruneConfigForPersistence(normalizedConfig, {
    forceRunnerStartupDefaults: true,
  });
  await writeTextFile(
    expandedConfigPath,
    `${JSON.stringify({
      ...persistedConfig,
      meta: {
        ...normalizedConfig.meta,
        lastTouchedAt: new Date().toISOString(),
      },
    }, null, 2)}\n`,
  );

  logUpgradeStage(
    `applied ${versionLabel} -> ${CURRENT_SCHEMA_VERSION}; backup: ${collapseHomePath(backupPath)}`,
  );
  return {
    upgraded: true as const,
    backupPath,
    fromVersion: versionLabel,
    toVersion: CURRENT_SCHEMA_VERSION,
  };
}
