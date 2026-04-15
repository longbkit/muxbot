import { renderChannelSetupHelpLines } from "./startup-bootstrap.ts";

const AUTH_USER_GUIDE_DOC_PATH = "docs/user-guide/auth-and-roles.md";

export function renderChannelsHelp() {
  return [
    "clisbot channels",
    "",
    "Usage:",
    "  clisbot channels",
    "  clisbot channels --help",
    "  clisbot channels enable <slack|telegram>",
    "  clisbot channels disable <slack|telegram>",
    "  clisbot channels add telegram-group <chatId> [--topic <topicId>] [--agent <id>] [--require-mention true|false]",
    "  clisbot channels remove telegram-group <chatId> [--topic <topicId>]",
    "  clisbot channels add slack-channel <channelId> [--agent <id>] [--require-mention true|false]",
    "  clisbot channels remove slack-channel <channelId>",
    "  clisbot channels add slack-group <groupId> [--agent <id>] [--require-mention true|false]",
    "  clisbot channels remove slack-group <groupId>",
    "  clisbot channels response-mode status --channel <slack|telegram> [--target <target>] [--topic <topicId>]",
    "  clisbot channels response-mode set <capture-pane|message-tool> --channel <slack|telegram> [--target <target>] [--topic <topicId>]",
    "  clisbot channels additional-message-mode status --channel <slack|telegram> [--target <target>] [--topic <topicId>]",
    "  clisbot channels additional-message-mode set <queue|steer> --channel <slack|telegram> [--target <target>] [--topic <topicId>]",
    "  clisbot channels set-token <slack-app|slack-bot|telegram-bot> <value>",
    "  clisbot channels clear-token <slack-app|slack-bot|telegram-bot>",
    "",
    "Policy guide:",
    "  - Slack DMs still follow channels.slack.directMessages.policy",
    "  - Telegram DMs still follow channels.telegram.directMessages.policy",
    "  - Slack public channels need channels.slack.channels.<channelId>",
    "  - Slack private groups need channels.slack.groups.<groupId>",
    "  - Telegram groups need channels.telegram.groups.<chatId>",
    "  - Telegram forum topics need channels.telegram.groups.<chatId>.topics.<topicId>",
    "  - Adding a route puts that surface on the allowlist; other channels, groups, or topics still need to be added explicitly",
    "  - Tune route settings such as requireMention and followUp in clisbot.json when a surface should behave differently",
    `  - Manage routed auth and /bash access in ${AUTH_USER_GUIDE_DOC_PATH}`,
    "  - Response delivery can be tuned with responseMode: `capture-pane` or `message-tool`",
    "  - Busy-session follow-up can be tuned with additionalMessageMode: `steer` or `queue`",
    "  - Slack response-mode targets use `channel:<id>`, `group:<id>`, or `dm:<id>`",
    "  - Slack additional-message-mode targets use `channel:<id>`, `group:<id>`, or `dm:<id>`",
    "  - Telegram response-mode targets use a numeric chat id; negative ids are groups, positive ids are direct messages",
    "  - Telegram additional-message-mode targets use a numeric chat id; negative ids are groups, positive ids are direct messages",
    "  - Telegram topics add `--topic <topicId>` on top of the group chat id",
    "  - Use pairing or allowlist DM policy when you do not want open direct-message access",
    "",
    "Response mode examples:",
    "  - clisbot channels response-mode status --channel slack",
    "  - clisbot channels response-mode set message-tool --channel slack --target channel:C123",
    "  - clisbot channels response-mode set capture-pane --channel slack --target group:G123",
    "  - clisbot channels response-mode set message-tool --channel slack --target dm:D123",
    "  - clisbot channels response-mode set message-tool --channel telegram --target -1001234567890",
    "  - clisbot channels response-mode set capture-pane --channel telegram --target -1001234567890 --topic 42",
    "  - clisbot channels response-mode set message-tool --channel telegram --target 123456789",
    "  - clisbot channels additional-message-mode status --channel slack --target channel:C123",
    "  - clisbot channels additional-message-mode set steer --channel slack --target channel:C123",
    "  - clisbot channels additional-message-mode set queue --channel slack --target group:G123",
    "  - clisbot channels additional-message-mode set steer --channel slack --target dm:D123",
    "  - clisbot channels additional-message-mode set steer --channel telegram --target -1001234567890",
    "  - clisbot channels additional-message-mode set queue --channel telegram --target -1001234567890 --topic 42",
    "  - clisbot channels additional-message-mode set steer --channel telegram --target 123456789",
    "",
    "Discovery tips:",
    "  - Telegram: use `/whoami` in the target group or topic to get chatId and topicId",
    "  - Slack: get channelId or groupId from the Slack conversation link",
    "",
    "Next steps:",
    "  - Run `clisbot status` to inspect routes and current channel state",
    "  - Run `clisbot logs` if the bot is still not responding",
    ...renderChannelSetupHelpLines("", { includePrivilegeHelp: false }),
  ].join("\n");
}

export function renderPostChangeGuidance(
  action: "enable" | "disable",
  channel: "slack" | "telegram",
) {
  if (action === "disable") {
    console.log("Run `clisbot status` to confirm the runtime state after config reload.");
    return;
  }

  if (channel === "slack") {
    console.log("Slack next steps:");
    console.log("  - direct messages still follow channels.slack.directMessages.policy");
    console.log("  - public channels need channels.slack.channels.<channelId>");
    console.log("  - private groups need channels.slack.groups.<groupId>");
    console.log("  - get channelId or groupId from the Slack conversation link");
  } else {
    console.log("Telegram next steps:");
    console.log("  - direct messages still follow channels.telegram.directMessages.policy");
    console.log("  - groups need channels.telegram.groups.<chatId>");
    console.log("  - forum topics need channels.telegram.groups.<chatId>.topics.<topicId>");
    console.log("  - use `/whoami` inside Telegram to get chatId and topicId");
  }

  console.log("Run `clisbot status` to inspect routes and current channel state.");
  console.log("Run `clisbot logs` if the bot is still not responding.");
  for (const line of renderChannelSetupHelpLines()) {
    console.log(line);
  }
}

export function renderSuccessBanner() {
  console.log("");
  console.log("+---------+");
  console.log("| SUCCESS |");
  console.log("+---------+");
  console.log("");
}

export function renderRouteAddGuidance(params: {
  channel: "slack" | "telegram";
  kind: "channel" | "group" | "topic";
  routeId: string;
}) {
  if (params.channel === "slack") {
    const routeLabel = params.kind === "channel" ? "channel" : "group";
    const routePath = params.kind === "channel"
      ? `channels.slack.channels."${params.routeId}"`
      : `channels.slack.groups."${params.routeId}"`;

    console.log("Slack route next steps:");
    console.log(`  - route added: ${routePath}`);
    console.log(
      "  - direct messages still follow channels.slack.directMessages.policy (`open`, `pairing`, `allowlist`, or `disabled`)",
    );
    console.log(
      `  - this ${routeLabel} still follows channels.slack.groupPolicy and route settings such as requireMention and followUp`,
    );
    console.log(
      "  - if you want pairing-style access control for DMs, set channels.slack.directMessages.policy to `pairing`",
    );
    console.log(
      "  - if you want stricter route access, keep Slack groups on allowlist and only add the channels/groups you trust",
    );
    console.log(`  - manage routed auth and /bash access in ${AUTH_USER_GUIDE_DOC_PATH}`);
  } else {
    const [chatId, topicId] = params.routeId.split("/");
    const routePath = params.kind === "topic"
      ? `channels.telegram.groups."${chatId}".topics."${topicId}"`
      : `channels.telegram.groups."${params.routeId}"`;

    console.log("Telegram route next steps:");
    console.log(`  - route added: ${routePath}`);
    console.log(
      "  - direct messages still follow channels.telegram.directMessages.policy (`open`, `pairing`, `allowlist`, or `disabled`)",
    );
    console.log(
      `  - this ${params.kind} is now on the Telegram allowlist; other groups or topics still need to be added explicitly`,
    );
    console.log(
      "  - if you want pairing-style access control for DMs, set channels.telegram.directMessages.policy to `pairing`",
    );
    console.log(
      "  - tune route settings such as requireMention and followUp in clisbot.json if this surface should behave differently",
    );
    console.log(`  - manage routed auth and /bash access in ${AUTH_USER_GUIDE_DOC_PATH}`);
  }

  console.log("Run `clisbot status` to inspect routes and current channel state.");
  console.log("Run `clisbot logs` if the bot is still not responding.");
  for (const line of renderChannelSetupHelpLines()) {
    console.log(line);
  }
}
