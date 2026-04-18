import { type LoadedConfig } from "../../config/load-config.ts";
import {
  resolveSlackBotConfig,
  resolveSlackDirectMessageConfig,
} from "../../config/channel-bots.ts";
import {
  buildSharedChannelRoute,
  type SharedChannelRoute,
  type SharedChannelRouteOverride,
} from "../route-policy.ts";
import { type SlackConversationKind } from "./session-routing.ts";

export type SlackRoute = SharedChannelRoute & {
  replyToMode: "thread" | "all";
};

export type SlackResolvedRoute = {
  conversationKind: SlackConversationKind;
  route: SlackRoute | null;
};

type SlackRouteOverride = SharedChannelRouteOverride;

function isAdmittedRoute(route: SlackRouteOverride | undefined | null) {
  return !!route && route.enabled !== false && route.policy !== "disabled";
}

function buildRoute(loadedConfig: LoadedConfig, params: {
  route?: SlackRouteOverride | null;
  requireMention: boolean;
  botId?: string;
  accountId?: string;
}): SlackRoute {
  const slackConfig = resolveSlackBotConfig(
    loadedConfig.raw.bots.slack,
    params.botId ?? params.accountId,
  );
  return {
    ...buildSharedChannelRoute({
      loadedConfig,
      channel: "slack",
      channelConfig: slackConfig,
      route: params.route,
      requireMention: params.requireMention,
    }),
    replyToMode: slackConfig.replyToMode,
  };
}

function resolveChannelRoute(
  loadedConfig: LoadedConfig,
  channelId: string,
  botId?: string,
  accountId?: string,
): SlackRoute | null {
  const resolvedBotId = botId ?? accountId;
  const slackConfig = resolveSlackBotConfig(loadedConfig.raw.bots.slack, resolvedBotId);
  const route = slackConfig.groups[`channel:${channelId}`] ?? slackConfig.groups["*"];
  if (isAdmittedRoute(route)) {
    return buildRoute(loadedConfig, {
      route,
      requireMention: false,
      botId: resolvedBotId,
    });
  }

  if (slackConfig.channelPolicy === "open") {
    return buildRoute(loadedConfig, {
      requireMention: true,
      botId: resolvedBotId,
    });
  }

  return null;
}

function resolveGroupRoute(
  loadedConfig: LoadedConfig,
  channelId: string,
  botId?: string,
  accountId?: string,
): SlackRoute | null {
  const resolvedBotId = botId ?? accountId;
  const slackConfig = resolveSlackBotConfig(loadedConfig.raw.bots.slack, resolvedBotId);
  const route = slackConfig.groups[`group:${channelId}`] ?? slackConfig.groups["*"];
  if (isAdmittedRoute(route)) {
    return buildRoute(loadedConfig, {
      route,
      requireMention: false,
      botId: resolvedBotId,
    });
  }

  if (slackConfig.groupPolicy === "open") {
    return buildRoute(loadedConfig, {
      requireMention: true,
      botId: resolvedBotId,
    });
  }

  return null;
}

function resolveDirectMessageRoute(
  loadedConfig: LoadedConfig,
  userId?: string,
  botId?: string,
  accountId?: string,
): SlackRoute | null {
  const resolvedBotId = botId ?? accountId;
  const slackConfig = resolveSlackBotConfig(loadedConfig.raw.bots.slack, resolvedBotId);
  const route = resolveSlackDirectMessageConfig(slackConfig, userId);
  if (!isAdmittedRoute(route)) {
    return null;
  }

  return buildRoute(loadedConfig, {
    route,
    requireMention: false,
    botId: resolvedBotId,
  });
}

export function resolveSlackConversationRoute(
  loadedConfig: LoadedConfig,
  event: any,
  options: {
    botId?: string;
    accountId?: string;
  } = {},
): SlackResolvedRoute {
  const channelType = (event.channel_type as string | undefined)?.trim().toLowerCase();
  const channelId = event.channel as string | undefined;

  if (channelType === "im") {
    return {
      conversationKind: "dm",
      route: resolveDirectMessageRoute(
        loadedConfig,
        typeof event.user === "string" ? event.user.trim().toUpperCase() : undefined,
        options.botId,
        options.accountId,
      ),
    };
  }

  if (channelType === "mpim") {
    return {
      conversationKind: "group",
      route: channelId
        ? resolveGroupRoute(loadedConfig, channelId, options.botId, options.accountId)
        : null,
    };
  }

  return {
    conversationKind: "channel",
    route: channelId
      ? resolveChannelRoute(loadedConfig, channelId, options.botId, options.accountId)
      : null,
  };
}
