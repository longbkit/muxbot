import type { AgentSessionTarget } from "../../agents/agent-service.ts";
import type { ChannelPlugin } from "../channel-plugin.ts";
import type { ParsedMessageCommand } from "../message-command.ts";
import {
  listSlackBots,
  resolveSlackBotCredentials,
  type SlackBotCredentialConfig,
} from "../../config/channel-bots.ts";
import { SlackSocketService } from "./service.ts";
import { deleteSlackMessageAction, editSlackMessage, getSlackReactions, listSlackPins, pinSlackMessage, reactSlackMessage, readSlackMessages, searchSlackMessages, sendSlackMessage, sendSlackPoll, unpinSlackMessage } from "./message-actions.ts";
import { resolveSlackConversationRoute } from "./route-config.ts";
import { resolveSlackConversationTarget } from "./session-routing.ts";

function normalizeSlackFollowUpTarget(rawTarget: string) {
  const target = rawTarget.trim();
  if (!target) {
    return null;
  }

  if (target.startsWith("channel:")) {
    return {
      conversationKind: "channel" as const,
      channelId: target.slice("channel:".length),
      channelType: "channel" as const,
    };
  }

  if (target.startsWith("group:")) {
    return {
      conversationKind: "group" as const,
      channelId: target.slice("group:".length),
      channelType: "mpim" as const,
    };
  }

  if (target.startsWith("dm:")) {
    return {
      conversationKind: "dm" as const,
      channelId: target.slice("dm:".length),
      channelType: "im" as const,
    };
  }

  if (target.startsWith("user:")) {
    return null;
  }

  if (target.startsWith("D")) {
    return {
      conversationKind: "dm" as const,
      channelId: target,
      channelType: "im" as const,
    };
  }
  if (target.startsWith("G")) {
    return {
      conversationKind: "group" as const,
      channelId: target,
      channelType: "mpim" as const,
    };
  }
  if (target.startsWith("C")) {
    return {
      conversationKind: "channel" as const,
      channelId: target,
      channelType: "channel" as const,
    };
  }

  return null;
}

function resolveSlackReplyTarget(params: {
  loadedConfig: Parameters<ChannelPlugin["resolveMessageReplyTarget"]>[0]["loadedConfig"];
  command: ParsedMessageCommand;
  botId: string;
}): AgentSessionTarget | null {
  if (!params.command.target) {
    return null;
  }

  const normalized = normalizeSlackFollowUpTarget(params.command.target);
  if (!normalized) {
    return null;
  }

  const resolved = resolveSlackConversationRoute(
    params.loadedConfig,
    {
      channel_type: normalized.channelType,
      channel: normalized.channelId,
    },
    {
      botId: params.botId,
    },
  );
  if (!resolved.route) {
    return null;
  }

  return resolveSlackConversationTarget({
    loadedConfig: params.loadedConfig,
    agentId: resolved.route.agentId,
    botId: params.botId,
    channelId: normalized.channelId,
    conversationKind: normalized.conversationKind,
    threadTs: params.command.threadId ?? params.command.replyTo,
    messageTs: params.command.replyTo ?? params.command.threadId,
    replyToMode: resolved.route.replyToMode,
  });
}

export const slackChannelPlugin: ChannelPlugin = {
  id: "slack",
  isEnabled: (loadedConfig) => loadedConfig.raw.bots.slack.defaults.enabled,
  listBots: (loadedConfig) =>
    listSlackBots(loadedConfig.raw.bots.slack).map(({ botId, config }) => ({
      botId,
      config,
    })),
  createRuntimeService: (context, bot) =>
    new SlackSocketService(
      context.loadedConfig,
      context.agentService,
      context.processedEventsStore,
      context.activityStore,
      bot.botId,
      bot.config as SlackBotCredentialConfig,
    ),
  renderHealthSummary: (state) => {
    switch (state) {
      case "starting":
        return "Slack channel is starting.";
      case "disabled":
        return "Slack channel is disabled in config.";
      case "stopped":
        return "Slack channel is stopped.";
    }
  },
  renderActiveHealthSummary: (serviceCount) =>
    `Slack Socket Mode connected for ${serviceCount} bot(s).`,
  markStartupFailure: (store, error) => store.markSlackFailure(error),
  runMessageCommand: async (loadedConfig, command) => {
    const bot = resolveSlackBotCredentials(
      loadedConfig.raw.bots.slack,
      command.account,
    );
    const shared = {
      botToken: bot.config.botToken,
      target: command.target!,
      threadId: command.threadId,
      replyTo: command.replyTo,
      message: command.message,
      media: command.media,
      messageId: command.messageId,
      emoji: command.emoji,
      remove: command.remove,
      limit: command.limit,
      query: command.query,
      pollQuestion: command.pollQuestion,
      pollOptions: command.pollOptions,
      inputFormat: command.inputFormat,
      renderMode: command.renderMode,
    };

    switch (command.action) {
      case "send":
        return { botId: bot.botId, result: await sendSlackMessage(shared) };
      case "poll":
        return { botId: bot.botId, result: await sendSlackPoll(shared) };
      case "react":
        return { botId: bot.botId, result: await reactSlackMessage(shared) };
      case "reactions":
        return { botId: bot.botId, result: await getSlackReactions(shared) };
      case "read":
        return { botId: bot.botId, result: await readSlackMessages(shared) };
      case "edit":
        return { botId: bot.botId, result: await editSlackMessage(shared) };
      case "delete":
        return { botId: bot.botId, result: await deleteSlackMessageAction(shared) };
      case "pin":
        return { botId: bot.botId, result: await pinSlackMessage(shared) };
      case "unpin":
        return { botId: bot.botId, result: await unpinSlackMessage(shared) };
      case "pins":
        return { botId: bot.botId, result: await listSlackPins(shared) };
      case "search":
        return { botId: bot.botId, result: await searchSlackMessages(shared) };
    }
  },
  resolveMessageReplyTarget: resolveSlackReplyTarget,
};
