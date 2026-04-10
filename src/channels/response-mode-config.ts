import { readEditableConfig, writeEditableConfig } from "../config/config-file.ts";
import type { ChannelInteractionIdentity } from "./interaction-processing.ts";

export type ResponseMode = "capture-pane" | "message-tool";
export type ResponseModeChannel = "slack" | "telegram";

export type ConfiguredResponseModeTarget = {
  channel: ResponseModeChannel;
  target?: string;
  topic?: string;
};

function getEditableConfigPath() {
  return process.env.MUXBOT_CONFIG_PATH;
}

type ConfigTargetBinding = {
  get: () => ResponseMode | undefined;
  set: (value: ResponseMode) => void;
  label: string;
};

function resolveSlackConfigTarget(
  config: Awaited<ReturnType<typeof readEditableConfig>>["config"],
  params: {
    target?: string;
    conversationKind?: ChannelInteractionIdentity["conversationKind"];
  },
): ConfigTargetBinding {
  if (!params.target) {
    return {
      get: () => config.channels.slack.responseMode,
      set: (value) => {
        config.channels.slack.responseMode = value;
      },
      label: "slack",
    };
  }

  const [kind, rawId] = params.target.split(":", 2);
  const targetId = rawId?.trim();

  if (!targetId) {
    throw new Error("Slack response-mode target must use channel:<id>, group:<id>, or dm:<id>.");
  }

  if (kind === "dm" || params.conversationKind === "dm") {
    return {
      get: () => config.channels.slack.directMessages.responseMode ?? config.channels.slack.responseMode,
      set: (value) => {
        config.channels.slack.directMessages.responseMode = value;
      },
      label: `slack dm ${targetId}`,
    };
  }

  if (kind === "channel") {
    const route = config.channels.slack.channels[targetId];
    if (!route) {
      throw new Error(`Route not configured yet: slack channel ${targetId}. Add the route first.`);
    }
    return {
      get: () => route.responseMode ?? config.channels.slack.responseMode,
      set: (value) => {
        route.responseMode = value;
      },
      label: `slack channel ${targetId}`,
    };
  }

  if (kind === "group") {
    const route = config.channels.slack.groups[targetId];
    if (!route) {
      throw new Error(`Route not configured yet: slack group ${targetId}. Add the route first.`);
    }
    return {
      get: () => route.responseMode ?? config.channels.slack.responseMode,
      set: (value) => {
        route.responseMode = value;
      },
      label: `slack group ${targetId}`,
    };
  }

  throw new Error("Slack response-mode target must use channel:<id>, group:<id>, or dm:<id>.");
}

function resolveTelegramConfigTarget(
  config: Awaited<ReturnType<typeof readEditableConfig>>["config"],
  params: {
    target?: string;
    topic?: string;
    conversationKind?: ChannelInteractionIdentity["conversationKind"];
  },
): ConfigTargetBinding {
  if (!params.target) {
    return {
      get: () => config.channels.telegram.responseMode,
      set: (value) => {
        config.channels.telegram.responseMode = value;
      },
      label: "telegram",
    };
  }

  const chatId = params.target.trim();
  if (!chatId) {
    throw new Error("Telegram response-mode target must be a numeric chat id.");
  }

  const topicId = params.topic?.trim();
  const isDirectMessage = !chatId.startsWith("-") || params.conversationKind === "dm";
  if (isDirectMessage) {
    if (topicId) {
      throw new Error("Telegram direct-message targets do not support --topic.");
    }
    return {
      get: () =>
        config.channels.telegram.directMessages.responseMode ?? config.channels.telegram.responseMode,
      set: (value) => {
        config.channels.telegram.directMessages.responseMode = value;
      },
      label: `telegram dm ${chatId}`,
    };
  }

  const group = config.channels.telegram.groups[chatId];
  if (!group) {
    throw new Error(`Route not configured yet: telegram group ${chatId}. Add the route first.`);
  }

  if (topicId) {
    const topic = group.topics?.[topicId];
    if (!topic) {
      throw new Error(`Route not configured yet: telegram group ${chatId} --topic ${topicId}. Add the topic route first.`);
    }
    return {
      get: () => topic.responseMode ?? group.responseMode ?? config.channels.telegram.responseMode,
      set: (value) => {
        topic.responseMode = value;
      },
      label: `telegram topic ${chatId}/${topicId}`,
    };
  }

  return {
    get: () => group.responseMode ?? config.channels.telegram.responseMode,
    set: (value) => {
      group.responseMode = value;
    },
    label: `telegram group ${chatId}`,
  };
}

function resolveConfigTarget(
  config: Awaited<ReturnType<typeof readEditableConfig>>["config"],
  params: ConfiguredResponseModeTarget & {
    conversationKind?: ChannelInteractionIdentity["conversationKind"];
  },
) {
  if (params.channel === "slack") {
    return resolveSlackConfigTarget(config, {
      target: params.target,
      conversationKind: params.conversationKind,
    });
  }

  return resolveTelegramConfigTarget(config, {
    target: params.target,
    topic: params.topic,
    conversationKind: params.conversationKind,
  });
}

export async function getConversationResponseMode(params: {
  identity: ChannelInteractionIdentity;
}) {
  const { config } = await readEditableConfig(getEditableConfigPath());
  const target = resolveConfigTarget(config, {
    channel: params.identity.platform,
    target:
      params.identity.platform === "slack"
        ? params.identity.conversationKind === "dm"
          ? `dm:${params.identity.channelId ?? ""}`
          : `${params.identity.conversationKind === "group" ? "group" : "channel"}:${params.identity.channelId ?? ""}`
        : params.identity.chatId,
    topic: params.identity.topicId,
    conversationKind: params.identity.conversationKind,
  });

  return {
    label: target.label,
    responseMode: target.get(),
  };
}

export async function setConversationResponseMode(params: {
  identity: ChannelInteractionIdentity;
  responseMode: ResponseMode;
}) {
  const { config, configPath } = await readEditableConfig(getEditableConfigPath());
  const target = resolveConfigTarget(config, {
    channel: params.identity.platform,
    target:
      params.identity.platform === "slack"
        ? params.identity.conversationKind === "dm"
          ? `dm:${params.identity.channelId ?? ""}`
          : `${params.identity.conversationKind === "group" ? "group" : "channel"}:${params.identity.channelId ?? ""}`
        : params.identity.chatId,
    topic: params.identity.topicId,
    conversationKind: params.identity.conversationKind,
  });
  target.set(params.responseMode);
  await writeEditableConfig(configPath, config);
  return {
    configPath,
    label: target.label,
    responseMode: params.responseMode,
  };
}

export async function getConfiguredResponseMode(params: ConfiguredResponseModeTarget) {
  const { config, configPath } = await readEditableConfig(getEditableConfigPath());
  const target = resolveConfigTarget(config, params);
  return {
    configPath,
    label: target.label,
    responseMode: target.get(),
  };
}

export async function setConfiguredResponseMode(params: ConfiguredResponseModeTarget & {
  responseMode: ResponseMode;
}) {
  const { config, configPath } = await readEditableConfig(getEditableConfigPath());
  const target = resolveConfigTarget(config, params);
  target.set(params.responseMode);
  await writeEditableConfig(configPath, config);
  return {
    configPath,
    label: target.label,
    responseMode: params.responseMode,
  };
}
