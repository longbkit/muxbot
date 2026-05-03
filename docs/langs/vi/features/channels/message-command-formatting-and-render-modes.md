[English](../../../../features/channels/message-command-formatting-and-render-modes.md) | [Tiếng Việt](./message-command-formatting-and-render-modes.md)

# Định dạng lệnh `message` và các chế độ render

## Tóm tắt

`clisbot message send` và `clisbot message edit` hiện có contract nội dung rõ ràng:

- `--message` hoặc `--body-file` chọn nguồn của body
- `--input` khai báo body đang ở format nào
- `--render` khai báo `clisbot` phải gửi nó ra channel đích theo cách nào

Mục tiêu là giữ giao diện dùng cho người vận hành và agent ngắn, dễ đoán, và dễ review.

## Vì sao tồn tại

Trước đây `message send` gần như chỉ nghĩ theo plain text.

Điều đó không đủ khi `clisbot` cần:

- Telegram-safe HTML có retry về plain text
- Slack `mrkdwn`
- raw Slack Block Kit
- native fallback rendering từ đầu vào Markdown

Nếu không có `input` và `render` rõ ràng:

- prompt trở nên nhập nhằng
- agent phải đoán output contract của từng channel
- người vận hành không biết body là native payload hay fallback do renderer sở hữu
- Slack và Telegram bị ép đi qua một text path thấp nhất, giả tạo

## Phạm vi

- `clisbot message send`
- `clisbot message edit`
- `--body-file`
- `--input`
- `--render`
- render ownership riêng cho Slack và Telegram

## Không nằm trong phạm vi

- mọi loại Block Kit nâng cao ở phase 1
- một rich-text schema chung cho mọi channel
- âm thầm convert các tổ hợp format sai

## Mặc định hiện tại

- `--input md`
- `--render native`

Cách hiểu mặc định là:

- caller viết nội dung kiểu Markdown quen thuộc
- channel adapter chọn native rendering path tốt nhất hiện đang hỗ trợ

## Body source

- `--message <text>`: body inline
- `--body-file <path>`: đọc body từ file
- `--message-file <path>`: alias tương thích ngược của `--body-file`
- `--file <path-or-url>`: attachment flag ưu tiên cho file cục bộ hoặc URL
- `--media <path-or-url>`: alias tương thích ngược của `--file`

Hướng sản phẩm hiện tại:

- operator workflow có thể dùng `--body-file` cho payload dài
- prompt guidance cho agent nên ưu tiên `--file`, không nên thiên về `--media`
- reply guidance cho bot và injected reply vẫn nên ưu tiên `--message` với inline text hoặc heredoc

## Input format

- `plain`: text không định dạng
- `md`: Markdown-like text để channel render
- `html`: đầu vào HTML
- `mrkdwn`: Slack-native `mrkdwn`
- `blocks`: mảng JSON Block Kit thô của Slack

## Render mode

- `native`: render mặc định do channel sở hữu
- `none`: không transform, xem input như destination-native
- `html`: xuất explicit HTML khi channel hỗ trợ
- `mrkdwn`: xuất explicit Slack `mrkdwn`
- `blocks`: xuất explicit Slack Block Kit

## Ma trận contract theo channel

### Telegram

- path ưu tiên:
  - `--input md --render native`
  - convert Markdown-like input thành Telegram-safe HTML
- direct native path:
  - `--input html --render none`
- explicit native-render path:
  - `--input md --render html`
- path không hợp lệ:
  - Telegram không nhận `mrkdwn`
  - Telegram không hỗ trợ raw `blocks`

### Slack

- path ưu tiên:
  - `--input md --render native`
  - convert Markdown-like input thành Slack `mrkdwn`
- direct native text path:
  - `--input mrkdwn --render none`
- direct native structured path:
  - `--input blocks --render none`
- explicit fallback-structured path:
  - `--input md --render blocks`
- path không hợp lệ:
  - Slack không nhận HTML rendering

## Renderer behavior hiện tại

### Telegram

- Markdown input được convert sang Telegram-safe HTML
- inline formatting, heading, list, blockquote, fenced code block được hỗ trợ ở mức thực dụng
- URL an toàn như `http://`, `https://`, `tg://`, `mailto:` được auto-link khi dùng native rendering
- link không an toàn hoặc cấu trúc không hỗ trợ sẽ degrade về escaped text dễ đọc
- nếu Telegram reject HTML payload, transport sẽ retry bằng plain text thay vì fail im lặng

### Slack

- Markdown input với `native` sẽ ra Slack `mrkdwn` dễ đọc
- Markdown input với `blocks` sẽ ra một Block Kit MVP:
  - đoạn mở đầu trước heading đầu tiên thành `context`
  - `H1` và `H2` thành `header`
  - major section phía sau được ngăn bằng `divider`
  - `H3` thành `section` in đậm
  - `H4+` flatten thành paragraph có dòng tiêu đề in đậm
  - list và fenced code block vẫn phải đọc được
- raw Block Kit đi thẳng khi dùng `--input blocks --render none`
- Block Kit send vẫn phải có readable API fallback text cho accessibility, notification, history read, và degraded client

## Quy tắc phải giữ truthful

- tổ hợp channel/render không hợp lệ phải fail sớm
- `--message` và `--body-file` loại trừ lẫn nhau
- `--message-file` chỉ là compatibility alias
- docs, help text, và runtime behavior phải đồng bộ
- `native` phải tiếp tục là lựa chọn dễ giải thích và ổn định

## Ví dụ

Telegram mặc định:

```bash
clisbot message send \
  --channel telegram \
  --target -1001234567890 \
  --topic-id 42 \
  --message "## Status\n\n- step 1 done"
```

Telegram HTML đã render sẵn:

```bash
clisbot message send \
  --channel telegram \
  --target -1001234567890 \
  --topic-id 42 \
  --input html \
  --render none \
  --message "<b>Status</b>\n\nstep 1 done"
```

Slack native rendering mặc định:

```bash
clisbot message send \
  --channel slack \
  --target channel:C1234567890 \
  --thread-id 1712345678.123456 \
  --message "## Status\n\n- step 1 done"
```

Slack raw Block Kit:

```bash
clisbot message send \
  --channel slack \
  --target channel:C1234567890 \
  --thread-id 1712345678.123456 \
  --input blocks \
  --render none \
  --body-file ./reply-blocks.json
```

## Tài liệu liên quan

- [Bề mặt chat và kênh giao tiếp](./README.md)
- [Thao tác tin nhắn và định tuyến bot](./message-actions-and-channel-accounts.md)
- [Render có cấu trúc theo channel và các năng lực ngữ cảnh chat gốc](./structured-channel-rendering-and-native-surface-capabilities.md)
- [Lệnh CLI](../../user-guide/cli-commands.md)
- [Phản hồi tiến độ của agent](../../user-guide/agent-progress-replies.md)
