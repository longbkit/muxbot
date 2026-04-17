import { applyTemplate, expandHomePath } from "../shared/paths.ts";
import {
  buildRunnerFromToolTemplate,
  DEFAULT_AGENT_TOOL_TEMPLATES,
  type AgentBootstrapMode,
  type AgentCliToolId,
  inferAgentCliToolId,
} from "../config/agent-tool-presets.ts";
import { type ClisbotConfig } from "../config/schema.ts";
import { readEditableConfig, writeEditableConfig } from "../config/config-file.ts";
import { applyBootstrapTemplate, getBootstrapWorkspaceState } from "../agents/bootstrap.ts";
import { formatBinding } from "../config/bindings.ts";
import { parseBotType } from "./channel-bootstrap-flags.ts";
import type {
  AdditionalMessageMode,
  ResponseMode,
} from "../channels/mode-config-shared.ts";

function getEditableConfigPath() {
  return process.env.CLISBOT_CONFIG_PATH;
}

type AgentBindingTarget = {
  channel: "slack" | "telegram";
  accountId?: string;
};

function parseBinding(raw: string): AgentBindingTarget {
  const [channel, accountId] = raw.split(":", 2);
  if (channel !== "slack" && channel !== "telegram") {
    throw new Error(`Unsupported binding channel: ${channel}`);
  }

  return {
    channel,
    accountId: accountId?.trim() || undefined,
  };
}

function parseRepeatedOption(args: string[], name: string) {
  const values: string[] = [];
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] !== name) {
      continue;
    }

    const value = args[index + 1]?.trim();
    if (!value) {
      throw new Error(`Missing value for ${name}`);
    }
    values.push(value);
  }

  return values;
}

function parseSingleOption(args: string[], name: string) {
  const values = parseRepeatedOption(args, name);
  if (values.length === 0) {
    return undefined;
  }
  return values[values.length - 1];
}

function hasFlag(args: string[], name: string) {
  return args.includes(name);
}

function renderAgentsHelp() {
  return [
    "clisbot agents",
    "",
    "Usage:",
    "  clisbot agents --help",
    "  clisbot agents help",
    "  clisbot agents list [--bindings] [--json]",
    "  clisbot agents add <id> --cli <codex|claude|gemini> [--workspace <path>] [--startup-option <arg>]... [--bot-type <personal|team>] [--bind <channel[:accountId]>]...",
    "  clisbot agents bootstrap <id> --bot-type <personal|team> [--force]",
    "  clisbot agents bindings [--agent <id>] [--json]",
    "  clisbot agents bind --agent <id> --bind <channel[:accountId]>",
    "  clisbot agents unbind --agent <id> [--bind <channel[:accountId]> | --all]",
    "  clisbot agents response-mode <status|set|clear> --agent <id> [capture-pane|message-tool]",
    "  clisbot agents additional-message-mode <status|set|clear> --agent <id> [queue|steer]",
    "",
    "Notes:",
    "  - `agents add` is the lower-level manual surface; first-run `clisbot start` and `clisbot init` can bootstrap the first `default` agent for you",
    "  - `--cli` is required on `agents add`; supported tools are `codex`, `claude`, and `gemini`",
    "  - omit `--startup-option` to inherit the built-in startup args for the selected CLI tool",
    "  - `--bind slack`, `--bind telegram`, or `--bind <channel>:<accountId>` creates top-level fallback bindings",
    "  - explicit route `agentId` on Slack or Telegram still wins before these fallback bindings",
    "  - `response-mode` and `additional-message-mode` mutate per-agent overrides under `agents.list[]`",
  ].join("\n");
}

function parseResponseMode(raw: string | undefined): ResponseMode {
  if (raw === "capture-pane" || raw === "message-tool") {
    return raw;
  }
  throw new Error("Usage: agents response-mode <status|set|clear> ...");
}

function parseAdditionalMessageMode(raw: string | undefined): AdditionalMessageMode {
  if (raw === "queue" || raw === "steer") {
    return raw;
  }
  throw new Error("Usage: agents additional-message-mode <status|set|clear> ...");
}

function removeConsumedArgs(args: string[], consumedNames: string[]) {
  const names = new Set(consumedNames);
  const remaining: string[] = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!names.has(arg)) {
      remaining.push(arg);
      continue;
    }

    index += 1;
  }

  return remaining;
}

function resolveWorkspacePath(config: ClisbotConfig, agentId: string, customWorkspace?: string) {
  const template = customWorkspace ?? config.agents.defaults.workspace;
  return expandHomePath(
    applyTemplate(template, {
      agentId,
    }),
  );
}

function areStringArraysEqual(left: string[], right: string[]) {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((value, index) => value === right[index]);
}

function areJsonEqual(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export type AddAgentParams = {
  configPath?: string;
  agentId: string;
  cliTool: AgentCliToolId;
  workspace?: string;
  startupOptions?: string[];
  bootstrap?: AgentBootstrapMode;
  bindings?: AgentBindingTarget[];
};

function ensureAgentMissing(config: ClisbotConfig, agentId: string) {
  if (config.agents.list.some((entry) => entry.id === agentId)) {
    throw new Error(`Agent already exists: ${agentId}`);
  }
}

function getAgentEntry(config: ClisbotConfig, agentId: string) {
  return config.agents.list.find((entry) => entry.id === agentId);
}

function ensureAgentExists(config: ClisbotConfig, agentId: string) {
  const entry = getAgentEntry(config, agentId);
  if (!entry) {
    throw new Error(`Unknown agent: ${agentId}`);
  }

  return entry;
}

function resolveAgentTool(config: ClisbotConfig, agentId: string) {
  const entry = ensureAgentExists(config, agentId);
  const cliTool = entry.cliTool ?? inferAgentCliToolId(entry.runner?.command);
  if (!cliTool) {
    throw new Error(`Unable to infer CLI tool for agent: ${agentId}`);
  }

  return cliTool;
}

function upsertBinding(config: ClisbotConfig, agentId: string, target: AgentBindingTarget) {
  const existingIndex = config.bindings.findIndex((binding) => {
    return (
      binding.match.channel === target.channel &&
      (binding.match.accountId ?? "") === (target.accountId ?? "")
    );
  });

  if (existingIndex >= 0) {
    config.bindings[existingIndex] = {
      match: {
        channel: target.channel,
        accountId: target.accountId,
      },
      agentId,
    };
    return;
  }

  config.bindings.push({
    match: {
      channel: target.channel,
      accountId: target.accountId,
    },
    agentId,
  });
}

function removeBinding(config: ClisbotConfig, agentId: string, target?: AgentBindingTarget) {
  config.bindings = config.bindings.filter((binding) => {
    if (binding.agentId !== agentId) {
      return true;
    }

    if (!target) {
      return false;
    }

    return !(
      binding.match.channel === target.channel &&
      (binding.match.accountId ?? "") === (target.accountId ?? "")
    );
  });
}

async function listAgents(args: string[]) {
  const { config } = await readEditableConfig(getEditableConfigPath());
  const printJson = hasFlag(args, "--json");
  const includeBindings = hasFlag(args, "--bindings");

  const summaries = config.agents.list.map((agent) => ({
    id: agent.id,
    cliTool: agent.cliTool ?? agent.runner?.command ?? config.agents.defaults.runner.command,
    responseMode: agent.responseMode,
    additionalMessageMode: agent.additionalMessageMode,
    workspace:
      agent.workspace ??
      config.agents.defaults.workspace.replaceAll("{agentId}", agent.id),
    startupOptions:
      agent.startupOptions ??
      (agent.cliTool
        ? DEFAULT_AGENT_TOOL_TEMPLATES[agent.cliTool]?.startupOptions ??
          agent.runner?.args ??
          config.agents.defaults.runner.args
        : agent.runner?.args ?? config.agents.defaults.runner.args),
    bootstrapMode: agent.bootstrap?.mode,
    bootstrapState: getBootstrapWorkspaceState(
      resolveWorkspacePath(config, agent.id, agent.workspace),
      agent.bootstrap?.mode,
      agent.cliTool ?? inferAgentCliToolId(agent.runner?.command) ?? undefined,
    ),
    bindings: config.bindings
      .filter((binding) => binding.agentId === agent.id)
      .map((binding) => formatBinding(binding.match)),
  }));

  if (printJson) {
    console.log(JSON.stringify(summaries, null, 2));
    return;
  }

  if (summaries.length === 0) {
    console.log("No agents configured.");
    return;
  }

  console.log("Configured agents:");
  for (const summary of summaries) {
    const parts = [
      `- ${summary.id}`,
      `tool=${summary.cliTool}`,
      `workspace=${summary.workspace}`,
      `responseMode=${summary.responseMode ?? "inherit"}`,
      `additionalMessageMode=${summary.additionalMessageMode ?? "inherit"}`,
    ];
    if (summary.bootstrapMode) {
      parts.push(`bootstrap=${summary.bootstrapMode}:${summary.bootstrapState}`);
    }
    if (includeBindings && summary.bindings.length > 0) {
      parts.push(`bindings=${summary.bindings.join(",")}`);
    }
    console.log(parts.join(" "));
  }
}

export async function addAgentToEditableConfig(params: AddAgentParams) {
  const { config, configPath } = await readEditableConfig(params.configPath ?? getEditableConfigPath());
  ensureAgentMissing(config, params.agentId);

  const cliTool = params.cliTool;
  const bindings = params.bindings ?? [];
  const toolTemplate = DEFAULT_AGENT_TOOL_TEMPLATES[cliTool];
  const resolvedStartupOptions =
    params.startupOptions && params.startupOptions.length > 0
      ? params.startupOptions
      : toolTemplate.startupOptions;
  const runner = buildRunnerFromToolTemplate(cliTool, toolTemplate, resolvedStartupOptions);
  const workspacePath = resolveWorkspacePath(config, params.agentId, params.workspace);
  const startupOptionsOverride = areStringArraysEqual(
    resolvedStartupOptions,
    toolTemplate.startupOptions,
  )
    ? undefined
    : resolvedStartupOptions;
  const runnerOverride = areJsonEqual(runner, config.agents.defaults.runner)
    ? undefined
    : runner;

  if (params.bootstrap) {
    await applyBootstrapTemplate(workspacePath, params.bootstrap, cliTool);
  }

  config.agents.list.push({
    id: params.agentId,
    cliTool,
    startupOptions: startupOptionsOverride,
    workspace: params.workspace,
    bootstrap: params.bootstrap ? { mode: params.bootstrap } : undefined,
    runner: runnerOverride,
  });

  for (const binding of bindings) {
    upsertBinding(config, params.agentId, binding);
  }

  await writeEditableConfig(configPath, config);

  return {
    configPath,
    workspacePath,
    bindings,
    startupOptions: resolvedStartupOptions,
  };
}

async function addAgent(args: string[]) {
  const agentId = args[0]?.trim();
  if (!agentId) {
    throw new Error("Usage: agents add <id> --cli <codex|claude|gemini> [--workspace <path>] [--startup-option <arg>]... [--bot-type <personal|team>] [--bind <channel[:accountId]>]...");
  }
  if (hasFlag(args, "--bootstrap")) {
    throw new Error("agents add no longer accepts --bootstrap; use --bot-type personal or --bot-type team");
  }
  if (hasFlag(args, "--mode")) {
    throw new Error("agents add does not use --mode; use --bot-type personal or --bot-type team");
  }

  const cliTool = parseSingleOption(args, "--cli") as AgentCliToolId | undefined;
  if (!cliTool || !(cliTool in DEFAULT_AGENT_TOOL_TEMPLATES)) {
    throw new Error("agents add requires --cli codex, --cli claude, or --cli gemini");
  }

  const workspace = parseSingleOption(args, "--workspace");
  const startupOptions = parseRepeatedOption(args, "--startup-option");
  let bootstrap: AgentBootstrapMode | undefined;
  const botType = parseSingleOption(args, "--bot-type");
  if (botType) {
    bootstrap = parseBotType(botType);
  }

  const bindings = parseRepeatedOption(args, "--bind").map(parseBinding);
  const result = await addAgentToEditableConfig({
    agentId,
    cliTool,
    workspace,
    startupOptions,
    bootstrap,
    bindings,
  });

  console.log(`Added agent ${agentId} with tool ${cliTool}.`);
  if (bindings.length > 0) {
    console.log(`Bindings: ${bindings.map(formatBinding).join(", ")}`);
  }
  if (bootstrap) {
    console.log(
      `Bootstrap files seeded for ${bootstrap} in ${result.workspacePath}`,
    );
  }
}

async function bootstrapAgent(args: string[]) {
  const agentId = args[0]?.trim();
  if (!agentId) {
    throw new Error(
      "Usage: agents bootstrap <id> --bot-type <personal|team> [--force]",
    );
  }
  if (hasFlag(args, "--mode")) {
    throw new Error("agents bootstrap no longer accepts --mode; use --bot-type personal or --bot-type team");
  }
  if (hasFlag(args, "--bootstrap")) {
    throw new Error(
      "agents bootstrap does not use --bootstrap; use --bot-type personal or --bot-type team",
    );
  }

  const botType = parseSingleOption(args, "--bot-type");
  if (!botType) {
    throw new Error("agents bootstrap requires --bot-type personal or --bot-type team");
  }
  const mode = parseBotType(botType);

  const force = hasFlag(args, "--force");
  const { config, configPath } = await readEditableConfig(getEditableConfigPath());
  const entry = ensureAgentExists(config, agentId);
  const tool = resolveAgentTool(config, agentId);
  const workspacePath = resolveWorkspacePath(config, agentId, entry.workspace);

  await applyBootstrapTemplate(workspacePath, mode, tool, {
    force,
  });
  entry.bootstrap = {
    mode,
  };
  await writeEditableConfig(configPath, config);

  console.log(
    `${force ? "Rebootstrapped" : "Bootstrapped"} agent ${agentId} with ${tool}/${mode} in ${workspacePath}.`,
  );
}

async function listBindings(args: string[]) {
  const { config } = await readEditableConfig(getEditableConfigPath());
  const agentId = parseSingleOption(args, "--agent");
  const printJson = hasFlag(args, "--json");
  const bindings = config.bindings
    .filter((binding) => !agentId || binding.agentId === agentId)
    .map((binding) => ({
      binding: formatBinding(binding.match),
      agentId: binding.agentId,
    }));

  if (printJson) {
    console.log(JSON.stringify(bindings, null, 2));
    return;
  }

  if (bindings.length === 0) {
    console.log("No bindings configured.");
    return;
  }

  console.log("Configured bindings:");
  for (const binding of bindings) {
    console.log(`- ${binding.binding} -> ${binding.agentId}`);
  }
}

async function bindAgent(args: string[]) {
  const agentId = parseSingleOption(args, "--agent");
  const bindingValue = parseSingleOption(args, "--bind");
  if (!agentId || !bindingValue) {
    throw new Error("Usage: agents bind --agent <id> --bind <channel[:accountId]>");
  }

  const { config, configPath } = await readEditableConfig(getEditableConfigPath());
  ensureAgentExists(config, agentId);
  const binding = parseBinding(bindingValue);
  upsertBinding(config, agentId, binding);
  await writeEditableConfig(configPath, config);
  console.log(`Bound ${formatBinding(binding)} to ${agentId}.`);
}

async function unbindAgent(args: string[]) {
  const agentId = parseSingleOption(args, "--agent");
  if (!agentId) {
    throw new Error("Usage: agents unbind --agent <id> [--bind <channel[:accountId]> | --all]");
  }

  const removeAll = hasFlag(args, "--all");
  const bindingValue = parseSingleOption(args, "--bind");
  if (!removeAll && !bindingValue) {
    throw new Error("Usage: agents unbind --agent <id> [--bind <channel[:accountId]> | --all]");
  }

  const { config, configPath } = await readEditableConfig(getEditableConfigPath());
  ensureAgentExists(config, agentId);
  removeBinding(config, agentId, removeAll ? undefined : parseBinding(bindingValue!));
  await writeEditableConfig(configPath, config);
  console.log(removeAll ? `Removed all bindings for ${agentId}.` : `Removed ${bindingValue} from ${agentId}.`);
}

async function runAgentResponseModeCli(args: string[]) {
  const action = args[0];
  if (action !== "status" && action !== "set" && action !== "clear") {
    throw new Error("Usage: agents response-mode <status|set|clear> --agent <id> [capture-pane|message-tool]");
  }

  const agentId = parseSingleOption(args, "--agent");
  if (!agentId) {
    throw new Error("Usage: agents response-mode <status|set|clear> --agent <id> [capture-pane|message-tool]");
  }

  const { config, configPath } = await readEditableConfig(getEditableConfigPath());
  const agent = ensureAgentExists(config, agentId);

  if (action === "status") {
    console.log(`agent: ${agent.id}`);
    console.log(`responseMode: ${agent.responseMode ?? "(inherit)"}`);
    console.log(`config: ${configPath}`);
    return;
  }

  if (action === "clear") {
    delete agent.responseMode;
    await writeEditableConfig(configPath, config);
    console.log(`cleared responseMode for ${agent.id}`);
    console.log(`responseMode: (inherit)`);
    console.log(`config: ${configPath}`);
    return;
  }

  const responseMode = parseResponseMode(args[1]);
  agent.responseMode = responseMode;
  await writeEditableConfig(configPath, config);
  console.log(`updated responseMode for ${agent.id}`);
  console.log(`responseMode: ${responseMode}`);
  console.log(`config: ${configPath}`);
}

async function runAgentAdditionalMessageModeCli(args: string[]) {
  const action = args[0];
  if (action !== "status" && action !== "set" && action !== "clear") {
    throw new Error("Usage: agents additional-message-mode <status|set|clear> --agent <id> [queue|steer]");
  }

  const agentId = parseSingleOption(args, "--agent");
  if (!agentId) {
    throw new Error("Usage: agents additional-message-mode <status|set|clear> --agent <id> [queue|steer]");
  }

  const { config, configPath } = await readEditableConfig(getEditableConfigPath());
  const agent = ensureAgentExists(config, agentId);

  if (action === "status") {
    console.log(`agent: ${agent.id}`);
    console.log(`additionalMessageMode: ${agent.additionalMessageMode ?? "(inherit)"}`);
    console.log(`config: ${configPath}`);
    return;
  }

  if (action === "clear") {
    delete agent.additionalMessageMode;
    await writeEditableConfig(configPath, config);
    console.log(`cleared additionalMessageMode for ${agent.id}`);
    console.log("additionalMessageMode: (inherit)");
    console.log(`config: ${configPath}`);
    return;
  }

  const additionalMessageMode = parseAdditionalMessageMode(args[1]);
  agent.additionalMessageMode = additionalMessageMode;
  await writeEditableConfig(configPath, config);
  console.log(`updated additionalMessageMode for ${agent.id}`);
  console.log(`additionalMessageMode: ${additionalMessageMode}`);
  console.log(`config: ${configPath}`);
}

export async function runAgentsCli(args: string[]) {
  const subcommand = args[0];
  const rest = args.slice(1);

  if (!subcommand || subcommand === "--help" || subcommand === "-h" || subcommand === "help") {
    console.log(renderAgentsHelp());
    return;
  }

  if (subcommand === "list") {
    await listAgents(rest);
    return;
  }

  if (subcommand === "add") {
    await addAgent(rest);
    return;
  }

  if (subcommand === "bindings") {
    await listBindings(rest);
    return;
  }

  if (subcommand === "bootstrap") {
    await bootstrapAgent(rest);
    return;
  }

  if (subcommand === "response-mode") {
    await runAgentResponseModeCli(rest);
    return;
  }

  if (subcommand === "additional-message-mode") {
    await runAgentAdditionalMessageModeCli(rest);
    return;
  }

  if (subcommand === "bind") {
    await bindAgent(rest);
    return;
  }

  if (subcommand === "unbind") {
    await unbindAgent(rest);
    return;
  }

  throw new Error(renderAgentsHelp());
}
