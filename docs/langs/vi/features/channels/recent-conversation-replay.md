[English](../../../../features/channels/recent-conversation-replay.md) | [Tiếng Việt](./recent-conversation-replay.md)

# Recent Conversation Replay

## Tóm tắt

Slack và Telegram hiện dùng chung một quy tắc replay recent context cho routed conversation.

Khi bot chỉ được invoke ở message sau, còn các message trước bị bỏ qua vì mention policy hay timing follow-up, `clisbot` có thể kéo lại một đuôi ngắn các message gần đây vào prompt tiếp theo.

## Contract

Theo từng routed conversation boundary, `clisbot` chỉ persist:

- `lastProcessedMarker`
- 5 `recentMessages` mới nhất

Boundary là routed session key đang có:

- Slack channel thread: `channelId + threadTs`
- Slack non-thread channel route: `channelId`
- Telegram DM: `chatId`
- Telegram group: `chatId`
- Telegram topic: `chatId + topicId`

Marker là native theo platform:

- Slack: `ts`
- Telegram: `message_id`

## Quy tắc ghi

Với mỗi inbound routed message trong boundary đó:

- append vào `recentMessages`
- cắt danh sách còn 5 item mới nhất
- giữ lại marker-only entry khi message không nên replay như text, để processed boundary vẫn truthful

`lastProcessedMarker` chỉ update khi message thật sự được chấp nhận vào agent execution:

- enqueue prompt bình thường
- enqueue queued prompt
- submit steer vào active run

Nó không tăng khi:

- chỉ giao nhận hoặc hiển thị
- `/status`, `/help`, `/stop`, `/attach`, `/detach`, hay control command khác
- pairing hoặc unrouted surface

## Quy tắc replay

Trước khi build prompt mới cho agent:

1. đi ngược `recentMessages` từ mới nhất về cũ
2. dừng khi gặp marker khớp `lastProcessedMarker`
3. mọi thứ sau marker đó là unprocessed tail
4. loại message hiện tại ra khỏi replay tail
5. prepend phần replay còn lại vào prompt hiện tại

Nếu processed marker đã rơi khỏi cửa sổ 5 message, `clisbot` sẽ replay toàn bộ phần window còn sống. Đó là bounded-loss tradeoff đã được chấp nhận.

## Ghi chú phạm vi

- replay này chỉ ở phạm vi conversation, không phải global
- mục tiêu là vá các khoảng trống ngắn gần đây, không phải dựng lại một thread dài
- replay block chỉ ảnh hưởng prompt; không đổi user-visible channel text
- mention-only message vẫn có thể đẩy processed marker đi lên dù chính nó không đóng góp text để replay
