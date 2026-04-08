import {
  DEFAULT_CONFIG_PATH,
  DEFAULT_PROCESSED_EVENTS_PATH,
  DEFAULT_SESSION_STORE_PATH,
  DEFAULT_STATE_DIR,
  DEFAULT_TMUX_SOCKET_PATH,
  expandHomePath,
} from "../shared/paths.ts";
import { readTextFile } from "../shared/fs.ts";
import { resolveConfigDurationMs } from "./duration.ts";
import { resolveConfigEnvVars } from "./env-substitution.ts";
import { type AgentEntry, type MuxbotConfig, muxbotConfigSchema } from "./schema.ts";

export type ResolvedAgentConfig = {
  agentId: string;
  sessionName: string;
  workspacePath: string;
  runner: MuxbotConfig["agents"]["defaults"]["runner"];
  stream: Omit<MuxbotConfig["agents"]["defaults"]["stream"], "maxRuntimeSec" | "maxRuntimeMin"> & {
    maxRuntimeLabel: string;
    maxRuntimeMs: number;
  };
  session: MuxbotConfig["agents"]["defaults"]["session"];
};

export function resolveMaxRuntimeMs(stream: {
  maxRuntimeSec?: number;
  maxRuntimeMin?: number;
}) {
  return resolveConfigDurationMs({
    seconds: stream.maxRuntimeSec,
    minutes: stream.maxRuntimeMin,
    defaultMinutes: 15,
  });
}

export type LoadedConfig = {
  configPath: string;
  processedEventsPath: string;
  stateDir: string;
  raw: MuxbotConfig;
};

export async function loadConfig(configPath = DEFAULT_CONFIG_PATH): Promise<LoadedConfig> {
  const expandedConfigPath = expandHomePath(configPath);
  const text = await readTextFile(expandedConfigPath);
  const parsed = JSON.parse(text);
  const substituted = resolveConfigEnvVars(parsed, process.env, {
    skipPaths: getDisabledChannelTokenPaths(parsed),
  }) as unknown;
  const validated = muxbotConfigSchema.parse(substituted);

  return materializeLoadedConfig(expandedConfigPath, validated);
}

export async function loadConfigWithoutEnvResolution(
  configPath = DEFAULT_CONFIG_PATH,
): Promise<LoadedConfig> {
  const expandedConfigPath = expandHomePath(configPath);
  const text = await readTextFile(expandedConfigPath);
  const parsed = JSON.parse(text);
  const validated = muxbotConfigSchema.parse(parsed);

  return materializeLoadedConfig(expandedConfigPath, validated);
}

function materializeLoadedConfig(
  expandedConfigPath: string,
  validated: MuxbotConfig,
): LoadedConfig {
  return {
    configPath: expandedConfigPath,
    processedEventsPath: DEFAULT_PROCESSED_EVENTS_PATH,
    stateDir: DEFAULT_STATE_DIR,
    raw: {
      ...validated,
      tmux: {
        ...validated.tmux,
        socketPath: expandHomePath(validated.tmux.socketPath || DEFAULT_TMUX_SOCKET_PATH),
      },
      session: {
        ...validated.session,
        storePath: expandHomePath(validated.session.storePath || DEFAULT_SESSION_STORE_PATH),
      },
      agents: {
        ...validated.agents,
        defaults: {
          ...validated.agents.defaults,
          workspace: expandHomePath(validated.agents.defaults.workspace),
        },
        list: validated.agents.list.map((entry) => ({
          ...entry,
          workspace: entry.workspace ? expandHomePath(entry.workspace) : undefined,
        })),
      },
    },
  };
}

function getDisabledChannelTokenPaths(parsed: unknown) {
  const skipPaths: string[] = [];
  const channels = isRecord(parsed) ? parsed.channels : undefined;

  if (isRecord(channels)) {
    const slack = isRecord(channels.slack) ? channels.slack : undefined;
    if (slack?.enabled === false) {
      skipPaths.push("channels.slack.appToken", "channels.slack.botToken");
    }

    const telegram = isRecord(channels.telegram) ? channels.telegram : undefined;
    if (telegram?.enabled === false) {
      skipPaths.push("channels.telegram.botToken");
    }
  }

  return skipPaths;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function getAgentEntry(config: LoadedConfig, agentId: string): AgentEntry | undefined {
  return config.raw.agents.list.find((entry) => entry.id === agentId);
}

export function resolveSessionStorePath(config: LoadedConfig) {
  return config.raw.session.storePath || DEFAULT_SESSION_STORE_PATH;
}
