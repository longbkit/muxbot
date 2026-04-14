export type ChannelIdentity = {
  platform: "slack" | "telegram";
  conversationKind: "dm" | "channel" | "group" | "topic";
  senderId?: string;
  senderName?: string;
  channelId?: string;
  channelName?: string;
  chatId?: string;
  chatName?: string;
  threadTs?: string;
  topicId?: string;
  topicName?: string;
};
