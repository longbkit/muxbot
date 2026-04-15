import { AgentService } from "../agents/agent-service.ts";
import {
  getBootstrapWorkspaceState,
  type BootstrapWorkspaceState,
} from "../agents/bootstrap.ts";
import { MissingEnvVarError } from "../config/env-substitution.ts";
import {
  type LoadedConfig,
  loadConfig,
  loadConfigWithoutEnvResolution,
} from "../config/load-config.ts";
import { formatBinding } from "../config/bindings.ts";
import {
  DEFAULT_AGENT_TOOL_TEMPLATES,
  inferAgentCliToolId,
} from "../config/agent-tool-presets.ts";
import { ActivityStore } from "./activity-store.ts";
import { TmuxClient } from "../runners/tmux/client.ts";
import {
  collapseHomePath,
  getDefaultActivityStorePath,
  getDefaultConfigPath,
  getDefaultRuntimeHealthPath,
} from "../shared/paths.ts";
import {
  renderOperatorHelpLines,
} from "./startup-bootstrap.ts";
import {
  RuntimeHealthStore,
  type ChannelHealthInstance,
  type RuntimeChannelConnection,
} from "./runtime-health-store.ts";
import {
  renderRuntimeDiagnosticsSummary,
  renderStartSummary,
  renderStatusSummary,
} from "./runtime-summary-rendering.ts";
export {
  renderRuntimeDiagnosticsSummary,
  renderStartSummary,
  renderStatusSummary,
} from "./runtime-summary-rendering.ts";

export type AgentOperatorSummary = {
  id: string;
  cliTool: string;
  workspacePath: string;
  startupOptions: string[];
  responseMode?: "capture-pane" | "message-tool";
  additionalMessageMode?: "queue" | "steer";
  bootstrapMode?: string;
  bootstrapState: BootstrapWorkspaceState;
  bindings: string[];
  lastActivityAt?: string;
};

export type ChannelOperatorSummary = {
  channel: "slack" | "telegram";
  enabled: boolean;
  connection: RuntimeChannelConnection;
  defaultAgentId: string;
  streaming: "off" | "latest" | "all";
  response: "all" | "final";
  responseMode: "capture-pane" | "message-tool";
  additionalMessageMode: "queue" | "steer";
  configuredSurfaceCount: number;
  directMessagesEnabled: boolean;
  directMessagesPolicy: string;
  groupPolicy?: string;
  lastActivityAt?: string;
  lastActivityAgentId?: string;
  healthSummary?: string;
  healthDetail?: string;
  healthActions: string[];
  healthInstances: ChannelHealthInstance[];
  healthUpdatedAt?: string;
};

export type RuntimeOperatorSummary = {
  loadedConfig: LoadedConfig;
  ownerSummary: {
    ownerPrincipals: string[];
    adminPrincipals: string[];
    ownerClaimWindowMinutes: number;
  };
  agentSummaries: AgentOperatorSummary[];
  channelSummaries: ChannelOperatorSummary[];
  activeRuns: Array<{
    agentId: string;
    sessionKey: string;
    state: "running" | "detached";
    startedAt?: number;
    detachedAt?: number;
  }>;
  configuredAgents: number;
  bootstrapPendingAgents: number;
  bootstrappedAgents: number;
  runningTmuxSessions: number;
};

function deriveAgentTool(
  loadedConfig: LoadedConfig,
  agentId: string,
) {
  const entry = loadedConfig.raw.agents.list.find((item) => item.id === agentId);
  if (entry?.cliTool) {
    return {
      cliTool: entry.cliTool,
      startupOptions:
        entry.startupOptions ??
        DEFAULT_AGENT_TOOL_TEMPLATES[entry.cliTool]?.startupOptions ??
        [],
    };
  }

  const resolved = new AgentService(loadedConfig).getResolvedAgentConfig(agentId);
  return {
    cliTool: inferAgentCliToolId(resolved.runner.command) ?? resolved.runner.command,
    startupOptions: resolved.runner.args,
  };
}

function countTelegramSurfaces(loadedConfig: LoadedConfig) {
  return Object.values(loadedConfig.raw.channels.telegram.groups).reduce((total, group) => {
    return total + 1 + Object.keys(group.topics ?? {}).length;
  }, 0);
}

function countSlackSurfaces(loadedConfig: LoadedConfig) {
  return (
    Object.keys(loadedConfig.raw.channels.slack.channels).length +
    Object.keys(loadedConfig.raw.channels.slack.groups).length
  );
}

async function getRunningTmuxSessions(loadedConfig: LoadedConfig) {
  const tmux = new TmuxClient(loadedConfig.raw.tmux.socketPath);
  try {
    const sessions = await tmux.listSessions();
    return sessions.length;
  } catch {
    return 0;
  }
}

export async function getRuntimeOperatorSummary(params: {
  configPath?: string;
  runtimeRunning: boolean;
  activityPath?: string;
  healthPath?: string;
}) {
  const loadedConfig = await loadOperatorSummaryConfig(params.configPath);
  const agentService = new AgentService(loadedConfig);
  const activityStore = new ActivityStore(params.activityPath ?? getDefaultActivityStorePath());
  const activities = await activityStore.read();
  const runtimeHealthStore = new RuntimeHealthStore(
    params.healthPath ?? getDefaultRuntimeHealthPath(),
  );
  const runtimeHealth = await runtimeHealthStore.read();
  const runningTmuxSessions = params.runtimeRunning ? await getRunningTmuxSessions(loadedConfig) : 0;

  const agentSummaries = loadedConfig.raw.agents.list.map((entry) => {
    const resolved = new AgentService(loadedConfig).getResolvedAgentConfig(entry.id);
    const tool = deriveAgentTool(loadedConfig, entry.id);
    const bootstrapState = getBootstrapWorkspaceState(
      resolved.workspacePath,
      entry.bootstrap?.mode,
      tool.cliTool === "codex" || tool.cliTool === "claude" || tool.cliTool === "gemini"
        ? tool.cliTool
        : undefined,
    );

    return {
      id: entry.id,
      cliTool: tool.cliTool,
      workspacePath: resolved.workspacePath,
      startupOptions: tool.startupOptions,
      responseMode: entry.responseMode,
      additionalMessageMode: entry.additionalMessageMode,
      bootstrapMode: entry.bootstrap?.mode,
      bootstrapState,
      bindings: loadedConfig.raw.bindings
        .filter((binding) => binding.agentId === entry.id)
        .map((binding) => formatBinding(binding.match)),
      lastActivityAt: activities.agents[entry.id]?.updatedAt,
    } satisfies AgentOperatorSummary;
  });

  const slackConnection = deriveChannelConnection({
    enabled: loadedConfig.raw.channels.slack.enabled,
    runtimeRunning: params.runtimeRunning,
    recordedConnection: runtimeHealth.channels.slack?.connection,
  });
  const telegramConnection = deriveChannelConnection({
    enabled: loadedConfig.raw.channels.telegram.enabled,
    runtimeRunning: params.runtimeRunning,
    recordedConnection: runtimeHealth.channels.telegram?.connection,
  });

  const channelSummaries = [
    {
      channel: "slack" as const,
      enabled: loadedConfig.raw.channels.slack.enabled,
      connection: slackConnection,
      defaultAgentId: loadedConfig.raw.channels.slack.defaultAgentId,
      streaming: loadedConfig.raw.channels.slack.streaming,
      response: loadedConfig.raw.channels.slack.response,
      responseMode: loadedConfig.raw.channels.slack.responseMode,
      additionalMessageMode: loadedConfig.raw.channels.slack.additionalMessageMode,
      configuredSurfaceCount: countSlackSurfaces(loadedConfig),
      directMessagesEnabled: loadedConfig.raw.channels.slack.directMessages.enabled,
      directMessagesPolicy: loadedConfig.raw.channels.slack.directMessages.policy,
      groupPolicy: loadedConfig.raw.channels.slack.groupPolicy,
      lastActivityAt: activities.channels.slack?.updatedAt,
      lastActivityAgentId: activities.channels.slack?.agentId,
      healthSummary: deriveHealthSummary({
        channel: "slack",
        connection: slackConnection,
        recordedSummary: runtimeHealth.channels.slack?.summary,
      }),
      healthDetail: runtimeHealth.channels.slack?.detail,
      healthActions: runtimeHealth.channels.slack?.actions ?? [],
      healthInstances: runtimeHealth.channels.slack?.instances ?? [],
      healthUpdatedAt: runtimeHealth.channels.slack?.updatedAt,
    },
    {
      channel: "telegram" as const,
      enabled: loadedConfig.raw.channels.telegram.enabled,
      connection: telegramConnection,
      defaultAgentId: loadedConfig.raw.channels.telegram.defaultAgentId,
      streaming: loadedConfig.raw.channels.telegram.streaming,
      response: loadedConfig.raw.channels.telegram.response,
      responseMode: loadedConfig.raw.channels.telegram.responseMode,
      additionalMessageMode: loadedConfig.raw.channels.telegram.additionalMessageMode,
      configuredSurfaceCount: countTelegramSurfaces(loadedConfig),
      directMessagesEnabled: loadedConfig.raw.channels.telegram.directMessages.enabled,
      directMessagesPolicy: loadedConfig.raw.channels.telegram.directMessages.policy,
      groupPolicy: loadedConfig.raw.channels.telegram.groupPolicy,
      lastActivityAt: activities.channels.telegram?.updatedAt,
      lastActivityAgentId: activities.channels.telegram?.agentId,
      healthSummary: deriveHealthSummary({
        channel: "telegram",
        connection: telegramConnection,
        recordedSummary: runtimeHealth.channels.telegram?.summary,
      }),
      healthDetail: runtimeHealth.channels.telegram?.detail,
      healthActions: runtimeHealth.channels.telegram?.actions ?? [],
      healthInstances: runtimeHealth.channels.telegram?.instances ?? [],
      healthUpdatedAt: runtimeHealth.channels.telegram?.updatedAt,
    },
  ] satisfies ChannelOperatorSummary[];

  return {
    loadedConfig,
    ownerSummary: {
      ownerPrincipals: loadedConfig.raw.app.auth.roles.owner?.users ?? [],
      adminPrincipals: loadedConfig.raw.app.auth.roles.admin?.users ?? [],
      ownerClaimWindowMinutes: loadedConfig.raw.app.auth.ownerClaimWindowMinutes,
    },
    agentSummaries,
    channelSummaries,
    activeRuns: await agentService.listActiveSessionRuntimes(),
    configuredAgents: agentSummaries.length,
    bootstrapPendingAgents: agentSummaries.filter((item) =>
      item.bootstrapState === "missing" || item.bootstrapState === "not-bootstrapped"
    ).length,
    bootstrappedAgents: agentSummaries.filter((item) => item.bootstrapState === "bootstrapped")
      .length,
    runningTmuxSessions,
  } satisfies RuntimeOperatorSummary;
}

function deriveChannelConnection(params: {
  enabled: boolean;
  runtimeRunning: boolean;
  recordedConnection?: RuntimeChannelConnection;
}) {
  if (!params.enabled) {
    return "disabled" as const;
  }
  if (params.recordedConnection === "failed") {
    return "failed" as const;
  }
  if (!params.runtimeRunning) {
    return "stopped" as const;
  }
  return params.recordedConnection ?? "active";
}

function deriveHealthSummary(params: {
  channel: "slack" | "telegram";
  connection: RuntimeChannelConnection;
  recordedSummary?: string;
}) {
  if (params.recordedSummary) {
    return params.recordedSummary;
  }

  const label = params.channel === "slack" ? "Slack" : "Telegram";
  switch (params.connection) {
    case "disabled":
      return `${label} channel is disabled in config.`;
    case "stopped":
      return `${label} channel is stopped.`;
    case "starting":
      return `${label} channel is starting.`;
    case "active":
      return `${label} channel is active.`;
    case "failed":
      return `${label} channel failed to start.`;
  }
}

async function loadOperatorSummaryConfig(configPath?: string) {
  return await loadConfigWithoutEnvResolution(configPath);
}
