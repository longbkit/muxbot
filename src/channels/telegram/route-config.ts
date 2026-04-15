import { type LoadedConfig } from "../../config/load-config.ts";
import {
  buildSharedChannelRoute,
  type SharedChannelRoute,
  type SharedChannelRouteOverride,
} from "../route-policy.ts";
import { type TelegramConversationKind } from "./session-routing.ts";

export type TelegramRoute = SharedChannelRoute;

export type TelegramResolvedRoute = {
  conversationKind: TelegramConversationKind;
  route: TelegramRoute | null;
};

type TelegramRouteOverride = SharedChannelRouteOverride;

function buildRoute(
  loadedConfig: LoadedConfig,
  params: {
    route?: TelegramRouteOverride | null;
    requireMention: boolean;
    accountId?: string;
  },
): TelegramRoute {
  const telegramConfig = loadedConfig.raw.channels.telegram;
  return buildSharedChannelRoute({
    loadedConfig,
    channel: "telegram",
    channelConfig: telegramConfig,
    route: params.route,
    requireMention: params.requireMention,
    accountId: params.accountId,
  });
}

function resolveGroupRoute(
  loadedConfig: LoadedConfig,
  chatId: number,
  topicId?: number,
  accountId?: string,
): TelegramRoute | null {
  const telegramConfig = loadedConfig.raw.channels.telegram;
  const groupRoute = telegramConfig.groups[String(chatId)] ?? telegramConfig.groups["*"];
  const topicRoute =
    topicId != null ? groupRoute?.topics?.[String(topicId)] : undefined;

  if (groupRoute || topicRoute) {
    return buildRoute(loadedConfig, {
      route: {
        ...groupRoute,
        ...topicRoute,
      },
      requireMention: groupRoute?.requireMention ?? true,
      accountId,
    });
  }

  if (telegramConfig.groupPolicy === "open") {
    return buildRoute(loadedConfig, {
      requireMention: true,
      accountId,
    });
  }

  return null;
}

function resolveDirectMessageRoute(loadedConfig: LoadedConfig, accountId?: string) {
  const telegramConfig = loadedConfig.raw.channels.telegram;
  if (!telegramConfig.directMessages.enabled) {
    return null;
  }

  return buildRoute(loadedConfig, {
    route: telegramConfig.directMessages,
    requireMention: false,
    accountId,
  });
}

export function resolveTelegramConversationRoute(params: {
  loadedConfig: LoadedConfig;
  chatType: "private" | "group" | "supergroup" | "channel";
  chatId: number;
  topicId?: number;
  isForum?: boolean;
  accountId?: string;
}) {
  if (params.chatType === "private") {
    return {
      conversationKind: "dm" as const,
      route: resolveDirectMessageRoute(params.loadedConfig, params.accountId),
    };
  }

  if (params.chatType !== "group" && params.chatType !== "supergroup") {
    return {
      conversationKind: "group" as const,
      route: null,
    };
  }

  const conversationKind =
    params.isForum || params.topicId != null ? ("topic" as const) : ("group" as const);

  return {
    conversationKind,
    route: resolveGroupRoute(
      params.loadedConfig,
      params.chatId,
      params.topicId,
      params.accountId,
    ),
  };
}
