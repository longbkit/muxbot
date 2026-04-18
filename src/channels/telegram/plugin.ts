import type { AgentSessionTarget } from "../../agents/agent-service.ts";
import type { ChannelPlugin } from "../channel-plugin.ts";
import type { ParsedMessageCommand } from "../message-command.ts";
import {
  listTelegramBots,
  resolveTelegramBotCredentials,
  type TelegramBotCredentialConfig,
} from "../../config/channel-bots.ts";
import { TelegramPollingService } from "./service.ts";
import { deleteTelegramMessageAction, editTelegramMessage, listTelegramPins, pinTelegramMessage, reactTelegramMessage, sendTelegramMessage, sendTelegramPoll, unpinTelegramMessage, unsupportedTelegramHistoryAction } from "./message-actions.ts";
import { resolveTelegramConversationRoute } from "./route-config.ts";
import { resolveTelegramConversationTarget } from "./session-routing.ts";

function resolveTelegramReplyTarget(params: {
  loadedConfig: Parameters<ChannelPlugin["resolveMessageReplyTarget"]>[0]["loadedConfig"];
  command: ParsedMessageCommand;
  botId: string;
}): AgentSessionTarget | null {
  if (!params.command.target) {
    return null;
  }

  const chatId = Number(params.command.target);
  if (!Number.isFinite(chatId)) {
    return null;
  }

  const topicId = params.command.threadId ? Number(params.command.threadId) : undefined;
  const resolved = resolveTelegramConversationRoute({
    loadedConfig: params.loadedConfig,
    chatType: chatId > 0 ? "private" : "supergroup",
    chatId,
    topicId: Number.isFinite(topicId) ? topicId : undefined,
    isForum: Number.isFinite(topicId),
    botId: params.botId,
  });
  if (!resolved.route) {
    return null;
  }

  return resolveTelegramConversationTarget({
    loadedConfig: params.loadedConfig,
    agentId: resolved.route.agentId,
    botId: params.botId,
    chatId,
    userId: chatId > 0 ? chatId : undefined,
    conversationKind:
      resolved.conversationKind === "topic"
        ? "topic"
        : resolved.conversationKind === "dm"
          ? "dm"
          : "group",
    topicId: Number.isFinite(topicId) ? topicId : undefined,
  });
}

export const telegramChannelPlugin: ChannelPlugin = {
  id: "telegram",
  isEnabled: (loadedConfig) => loadedConfig.raw.bots.telegram.defaults.enabled,
  listBots: (loadedConfig) =>
    listTelegramBots(loadedConfig.raw.bots.telegram).map(({ botId, config }) => ({
      botId,
      config,
    })),
  createRuntimeService: (context, bot) =>
    new TelegramPollingService(
      context.loadedConfig,
      context.agentService,
      context.processedEventsStore,
      context.activityStore,
      bot.botId,
      bot.config as TelegramBotCredentialConfig,
      context.reportLifecycle,
    ),
  renderHealthSummary: (state) => {
    switch (state) {
      case "starting":
        return "Telegram channel is starting.";
      case "disabled":
        return "Telegram channel is disabled in config.";
      case "stopped":
        return "Telegram channel is stopped.";
    }
  },
  renderActiveHealthSummary: (serviceCount) =>
    `Telegram polling connected for ${serviceCount} bot(s).`,
  markStartupFailure: (store, error) => store.markTelegramFailure(error),
  runMessageCommand: async (loadedConfig, command) => {
    const bot = resolveTelegramBotCredentials(
      loadedConfig.raw.bots.telegram,
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
      forceDocument: command.forceDocument,
      silent: command.silent,
      inputFormat: command.inputFormat,
      renderMode: command.renderMode,
    };

    switch (command.action) {
      case "send":
        return { botId: bot.botId, result: await sendTelegramMessage(shared) };
      case "poll":
        return { botId: bot.botId, result: await sendTelegramPoll(shared) };
      case "react":
        return { botId: bot.botId, result: await reactTelegramMessage(shared) };
      case "reactions":
        return {
          botId: bot.botId,
          result: await unsupportedTelegramHistoryAction("reactions"),
        };
      case "read":
        return {
          botId: bot.botId,
          result: await unsupportedTelegramHistoryAction("read"),
        };
      case "edit":
        return { botId: bot.botId, result: await editTelegramMessage(shared) };
      case "delete":
        return {
          botId: bot.botId,
          result: await deleteTelegramMessageAction(shared),
        };
      case "pin":
        return { botId: bot.botId, result: await pinTelegramMessage(shared) };
      case "unpin":
        return { botId: bot.botId, result: await unpinTelegramMessage(shared) };
      case "pins":
        return { botId: bot.botId, result: await listTelegramPins(shared) };
      case "search":
        return {
          botId: bot.botId,
          result: await unsupportedTelegramHistoryAction("search"),
        };
    }
  },
  resolveMessageReplyTarget: resolveTelegramReplyTarget,
};
