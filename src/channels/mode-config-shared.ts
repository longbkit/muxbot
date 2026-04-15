import type { ClisbotConfig } from "../config/schema.ts";
import type { ChannelIdentity } from "./channel-identity.ts";

export type ResponseMode = "capture-pane" | "message-tool";
export type AdditionalMessageMode = "queue" | "steer";
export type StreamingMode = "off" | "latest" | "all";
export type SurfaceModeChannel = "slack" | "telegram";
export type SurfaceModeField = "responseMode" | "additionalMessageMode" | "streaming";

export type ConfiguredSurfaceModeTarget = {
  channel: SurfaceModeChannel;
  target?: string;
  topic?: string;
};

type SurfaceModeValueMap = {
  responseMode: ResponseMode;
  additionalMessageMode: AdditionalMessageMode;
  streaming: StreamingMode;
};

type SurfaceModeSource = Partial<{
  [K in SurfaceModeField]: SurfaceModeValueMap[K];
}>;

type SurfaceModeTargetBinding<TField extends SurfaceModeField> = {
  get: () => SurfaceModeValueMap[TField] | undefined;
  set: (value: SurfaceModeValueMap[TField]) => void;
  label: string;
};

type TelegramGroupRoute = ClisbotConfig["channels"]["telegram"]["groups"][string];
type TelegramTopicRoute = TelegramGroupRoute["topics"][string];

function createTelegramGroupRoute(): TelegramGroupRoute {
  return {
    requireMention: true,
    allowBots: false,
    topics: {},
  };
}

function ensureTelegramGroupRoute(config: ClisbotConfig, chatId: string) {
  const existing = config.channels.telegram.groups[chatId];
  if (existing) {
    return existing;
  }

  const created = createTelegramGroupRoute();
  config.channels.telegram.groups[chatId] = created;
  return created;
}

function ensureTelegramTopicRoute(config: ClisbotConfig, chatId: string, topicId: string) {
  const group = ensureTelegramGroupRoute(config, chatId);
  const existing = group.topics[topicId];
  if (existing) {
    return existing;
  }

  const created: TelegramTopicRoute = {};
  group.topics[topicId] = created;
  return created;
}

function getModeValue<TField extends SurfaceModeField>(
  source: SurfaceModeSource,
  field: TField,
) {
  return source[field] as SurfaceModeValueMap[TField] | undefined;
}

function setModeValue<TField extends SurfaceModeField>(
  source: SurfaceModeSource,
  field: TField,
  value: SurfaceModeValueMap[TField],
) {
  source[field] = value;
}

const EMPTY_MODE_SOURCE: SurfaceModeSource = {};

function resolveSlackConfigTarget<TField extends SurfaceModeField>(
  config: ClisbotConfig,
  field: TField,
  params: {
    target?: string;
    conversationKind?: ChannelIdentity["conversationKind"];
  },
): SurfaceModeTargetBinding<TField> {
  if (!params.target) {
    return {
      get: () => getModeValue(config.channels.slack, field),
      set: (value) => {
        setModeValue(config.channels.slack, field, value);
      },
      label: "slack",
    };
  }

  const [kind, rawId] = params.target.split(":", 2);
  const targetId = rawId?.trim();

  if (!targetId) {
    throw new Error(`Slack ${renderFieldLabel(field)} target must use channel:<id>, group:<id>, or dm:<id>.`);
  }

  if (kind === "dm" || params.conversationKind === "dm") {
    return {
      get: () =>
        getModeValue(config.channels.slack.directMessages, field) ??
        getModeValue(config.channels.slack, field),
      set: (value) => {
        setModeValue(config.channels.slack.directMessages, field, value);
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
      get: () => getModeValue(route, field) ?? getModeValue(config.channels.slack, field),
      set: (value) => {
        setModeValue(route, field, value);
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
      get: () => getModeValue(route, field) ?? getModeValue(config.channels.slack, field),
      set: (value) => {
        setModeValue(route, field, value);
      },
      label: `slack group ${targetId}`,
    };
  }

  throw new Error(`Slack ${renderFieldLabel(field)} target must use channel:<id>, group:<id>, or dm:<id>.`);
}

function resolveTelegramConfigTarget<TField extends SurfaceModeField>(
  config: ClisbotConfig,
  field: TField,
  params: {
    target?: string;
    topic?: string;
    conversationKind?: ChannelIdentity["conversationKind"];
  },
): SurfaceModeTargetBinding<TField> {
  if (!params.target) {
    return {
      get: () => getModeValue(config.channels.telegram, field),
      set: (value) => {
        setModeValue(config.channels.telegram, field, value);
      },
      label: "telegram",
    };
  }

  const chatId = params.target.trim();
  if (!chatId) {
    throw new Error(`Telegram ${renderFieldLabel(field)} target must be a numeric chat id.`);
  }

  const topicId = params.topic?.trim();
  const isDirectMessage = !chatId.startsWith("-") || params.conversationKind === "dm";
  if (isDirectMessage) {
    if (topicId) {
      throw new Error("Telegram direct-message targets do not support --topic.");
    }
    return {
      get: () =>
        getModeValue(config.channels.telegram.directMessages, field) ??
        getModeValue(config.channels.telegram, field),
      set: (value) => {
        setModeValue(config.channels.telegram.directMessages, field, value);
      },
      label: `telegram dm ${chatId}`,
    };
  }

  const group = config.channels.telegram.groups[chatId];
  if (topicId) {
    const topic = group?.topics?.[topicId];
    return {
      get: () =>
        getModeValue(topic ?? EMPTY_MODE_SOURCE, field) ??
        getModeValue(group ?? EMPTY_MODE_SOURCE, field) ??
        getModeValue(config.channels.telegram, field),
      set: (value) => {
        setModeValue(ensureTelegramTopicRoute(config, chatId, topicId), field, value);
      },
      label: `telegram topic ${chatId}/${topicId}`,
    };
  }

  if (!group) {
    return {
      get: () => getModeValue(config.channels.telegram, field),
      set: (value) => {
        setModeValue(ensureTelegramGroupRoute(config, chatId), field, value);
      },
      label: `telegram group ${chatId}`,
    };
  }

  return {
    get: () => getModeValue(group, field) ?? getModeValue(config.channels.telegram, field),
    set: (value) => {
      setModeValue(group, field, value);
    },
    label: `telegram group ${chatId}`,
  };
}

export function resolveConfiguredSurfaceModeTarget<TField extends SurfaceModeField>(
  config: ClisbotConfig,
  field: TField,
  params: ConfiguredSurfaceModeTarget & {
    conversationKind?: ChannelIdentity["conversationKind"];
  },
) {
  if (params.channel === "slack") {
    return resolveSlackConfigTarget(config, field, {
      target: params.target,
      conversationKind: params.conversationKind,
    });
  }

  return resolveTelegramConfigTarget(config, field, {
    target: params.target,
    topic: params.topic,
    conversationKind: params.conversationKind,
  });
}

export function buildConfiguredTargetFromIdentity(identity: ChannelIdentity) {
  return {
    channel: identity.platform,
    target:
      identity.platform === "slack"
        ? identity.conversationKind === "dm"
          ? `dm:${identity.channelId ?? ""}`
          : `${identity.conversationKind === "group" ? "group" : "channel"}:${identity.channelId ?? ""}`
        : identity.chatId,
    topic: identity.topicId,
    conversationKind: identity.conversationKind,
  } satisfies ConfiguredSurfaceModeTarget & {
    conversationKind: ChannelIdentity["conversationKind"];
  };
}

function renderFieldLabel(field: SurfaceModeField) {
  if (field === "responseMode") {
    return "response-mode";
  }
  if (field === "additionalMessageMode") {
    return "additional-message-mode";
  }
  return "streaming";
}
