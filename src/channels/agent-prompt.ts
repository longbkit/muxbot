import type { ChannelInteractionIdentity } from "./interaction-processing.ts";
import { getMuxbotWrapperPath } from "../control/muxbot-wrapper.ts";

export type ChannelAgentPromptConfig = {
  enabled: boolean;
  maxProgressMessages: number;
  requireFinalResponse: boolean;
};

export function buildAgentPromptText(params: {
  text: string;
  identity: ChannelInteractionIdentity;
  config: ChannelAgentPromptConfig;
  responseMode?: "capture-pane" | "message-tool";
}) {
  if (!params.config.enabled) {
    return params.text;
  }

  const systemBlock = renderAgentPromptInstruction(params);
  return `<system>\n${systemBlock}\n</system>\n\n<user>\n${params.text}\n</user>`;
}

function renderAgentPromptInstruction(params: {
  identity: ChannelInteractionIdentity;
  config: ChannelAgentPromptConfig;
  responseMode?: "capture-pane" | "message-tool";
}) {
  const wrapperPath = getMuxbotWrapperPath();
  const replyCommand = buildReplyCommand({
    wrapperPath,
    identity: params.identity,
  });
  const lines = [
    `[${renderPromptTimestamp()}] ${renderSurfaceDescription(params.identity)}`,
    "",
    "You are operating inside muxbot.",
    "Use the exact local muxbot wrapper below when you need to send progress updates or the final response back to the user.",
    (params.responseMode ?? "message-tool") === "message-tool"
      ? "channel auto-delivery is disabled for this conversation; send user-facing progress updates and the final response yourself with the reply command"
      : "channel auto-delivery remains enabled for this conversation",
    "reply command:",
    replyCommand,
    `progress updates: at most ${params.config.maxProgressMessages}`,
    params.config.requireFinalResponse
      ? "final response: send exactly 1 final user-facing response"
      : "final response: optional",
    "keep progress updates short and meaningful",
    "use plain ASCII spaces in the shell command",
    "do not use muxbot message send to simulate user input",
    "do not send progress updates for trivial internal steps",
  ];

  if (params.identity.senderId) {
    lines.push(`sender id: \`${params.identity.senderId}\``);
  }

  return lines.join("\n");
}

function renderPromptTimestamp() {
  const date = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZoneName: "shortOffset",
  });
  return formatter.format(date).replace(",", "");
}

function renderSurfaceDescription(identity: ChannelInteractionIdentity) {
  if (identity.platform === "slack") {
    const scope =
      identity.conversationKind === "dm"
        ? `Slack direct message in channel ${identity.channelId ?? "unknown"}`
        : `Slack message in channel ${identity.channelId ?? "unknown"}`;
    return identity.threadTs ? `${scope} thread ${identity.threadTs}` : scope;
  }

  const scope =
    identity.conversationKind === "topic"
      ? `Telegram topic ${identity.topicId ?? "unknown"} in chat ${identity.chatId ?? "unknown"}`
      : `Telegram message in chat ${identity.chatId ?? "unknown"}`;
  return scope;
}

function buildReplyCommand(params: {
  wrapperPath: string;
  identity: ChannelInteractionIdentity;
}) {
  const lines = [`${params.wrapperPath} message send \\`];
  if (params.identity.platform === "slack") {
    lines.push("  --channel slack \\");
    lines.push(`  --target channel:${params.identity.channelId ?? ""} \\`);
    if (params.identity.threadTs) {
      lines.push(`  --thread-id ${params.identity.threadTs} \\`);
    }
    lines.push('  --message "$(cat <<\'__MUXBOT_MESSAGE__\'');
    lines.push("<short progress update>");
    lines.push("__MUXBOT_MESSAGE__");
    lines.push(')"');
    return lines.join("\n");
  }

  lines.push("  --channel telegram \\");
  lines.push(`  --target ${params.identity.chatId ?? ""} \\`);
  if (params.identity.topicId) {
    lines.push(`  --thread-id ${params.identity.topicId} \\`);
  }
  lines.push('  --message "$(cat <<\'__MUXBOT_MESSAGE__\'');
  lines.push("<short progress update>");
  lines.push("__MUXBOT_MESSAGE__");
  lines.push(')"');
  return lines.join("\n");
}
