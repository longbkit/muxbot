import { type LoadedConfig } from "../../config/load-config.ts";
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

function buildRoute(loadedConfig: LoadedConfig, params: {
  route?: SlackRouteOverride | null;
  requireMention: boolean;
  accountId?: string;
}): SlackRoute {
  const slackConfig = loadedConfig.raw.channels.slack;
  return {
    ...buildSharedChannelRoute({
      loadedConfig,
      channel: "slack",
      channelConfig: slackConfig,
      route: params.route,
      requireMention: params.requireMention,
      accountId: params.accountId,
    }),
    replyToMode: slackConfig.replyToMode,
  };
}

function resolveChannelRoute(
  loadedConfig: LoadedConfig,
  channelId: string,
  accountId?: string,
): SlackRoute | null {
  const slackConfig = loadedConfig.raw.channels.slack;
  const route = slackConfig.channels[channelId] ?? slackConfig.channels["*"];
  if (route) {
    return buildRoute(loadedConfig, {
      route,
      requireMention: false,
      accountId,
    });
  }

  if (slackConfig.channelPolicy === "open") {
    return buildRoute(loadedConfig, {
      requireMention: true,
      accountId,
    });
  }

  return null;
}

function resolveGroupRoute(
  loadedConfig: LoadedConfig,
  channelId: string,
  accountId?: string,
): SlackRoute | null {
  const slackConfig = loadedConfig.raw.channels.slack;
  const route = slackConfig.groups[channelId] ?? slackConfig.groups["*"];
  if (route) {
    return buildRoute(loadedConfig, {
      route,
      requireMention: false,
      accountId,
    });
  }

  if (slackConfig.groupPolicy === "open") {
    return buildRoute(loadedConfig, {
      requireMention: true,
      accountId,
    });
  }

  return null;
}

function resolveDirectMessageRoute(
  loadedConfig: LoadedConfig,
  accountId?: string,
): SlackRoute | null {
  const slackConfig = loadedConfig.raw.channels.slack;
  if (!slackConfig.directMessages.enabled) {
    return null;
  }

  return buildRoute(loadedConfig, {
    route: slackConfig.directMessages,
    requireMention: false,
    accountId,
  });
}

export function resolveSlackConversationRoute(
  loadedConfig: LoadedConfig,
  event: any,
  options: {
    accountId?: string;
  } = {},
): SlackResolvedRoute {
  const channelType = (event.channel_type as string | undefined)?.trim().toLowerCase();
  const channelId = event.channel as string | undefined;

  if (channelType === "im") {
    return {
      conversationKind: "dm",
      route: resolveDirectMessageRoute(loadedConfig, options.accountId),
    };
  }

  if (channelType === "mpim") {
    return {
      conversationKind: "group",
      route: channelId
        ? resolveGroupRoute(loadedConfig, channelId, options.accountId)
        : null,
    };
  }

  return {
    conversationKind: "channel",
    route: channelId
      ? resolveChannelRoute(loadedConfig, channelId, options.accountId)
      : null,
  };
}
