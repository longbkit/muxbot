export function renderTelegramRouteChoiceMessage(params: {
  chatId: number | string;
  topicId?: number | string;
  includeConfigPath?: boolean;
}) {
  const chatId = String(params.chatId);
  const topicId = params.topicId != null ? String(params.topicId) : undefined;
  const lines = [
    topicId != null
      ? "clisbot: this Telegram topic is not configured yet."
      : "clisbot: this Telegram group is not configured yet.",
    "",
    "Ask the bot owner to choose one of these:",
    "",
    "Add the whole group to the allowlist:",
    `\`clisbot routes add --channel telegram group:${chatId} --bot default\``,
    "",
    "Bind the whole group to a specific agent:",
    `\`clisbot routes set-agent --channel telegram group:${chatId} --bot default --agent <id>\``,
  ];

  if (topicId != null) {
    lines.push(
      "",
      "Or bind only this topic to a specific agent:",
      `\`clisbot routes add --channel telegram topic:${chatId}:${topicId} --bot default\``,
      `\`clisbot routes set-agent --channel telegram topic:${chatId}:${topicId} --bot default --agent <id>\``,
    );
  }

  if (params.includeConfigPath) {
    lines.push(
      "",
      topicId != null
        ? `Config path: \`bots.telegram.default.groups.\"${chatId}\".topics.\"${topicId}\"\``
        : `Config path: \`bots.telegram.default.groups.\"${chatId}\"\``,
    );
  } else {
    lines.push(
      "",
      "After that, routed commands such as `/status`, `/stop`, `/nudge`, `/followup`, and `/bash` will work here.",
    );
  }

  return lines.join("\n");
}
