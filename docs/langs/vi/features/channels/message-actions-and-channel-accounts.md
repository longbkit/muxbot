[English](../../../../features/channels/message-actions-and-channel-accounts.md) | [Tiếng Việt](./message-actions-and-channel-accounts.md)

# Message Actions And Bot Routing

## Tóm tắt

Lát cắt này thêm operator-facing `message` CLI và routing có awareness về bot cho Slack và Telegram.

Mục tiêu là đạt được operator behavior theo kiểu OpenClaw nhưng không phá vỡ ranh giới hiện có của `clisbot`:

- channels sở hữu transport behavior ở phía provider
- configuration sở hữu chọn bot và route
- agents giữ backend-agnostic

## Phạm vi

- operator CLI `clisbot message ...`
- bot config cho Slack và Telegram dưới bot map do provider sở hữu
- chọn `defaultBotId`
- route selection có awareness về bot
- message action cho Slack và Telegram đi qua provider adapter

## Message action nằm trong phạm vi

- `send`
- `poll`
- `react`
- `reactions`
- `read`
- `edit`
- `delete`
- `pin`
- `unpin`
- `pins`
- `search`

## Ghi chú kiến trúc

- bot config vẫn nằm dưới `bots.slack` và `bots.telegram`
- route table vẫn thuộc về từng bot
- route resolution tách riêng khỏi agent execution
- message action của provider vẫn nằm trong channel adapter, không chuyển sang `agents`

## Phụ thuộc

- [Bề mặt chat và kênh giao tiếp](./README.md)
- [Cấu hình](../configuration/README.md)
- [OpenClaw CLI Command Surfaces And Slack Telegram Send Syntax](../../../../research/channels/2026-04-09-openclaw-cli-command-surfaces-and-slack-telegram-send-syntax.md)
- [docs/tasks/features/channels](../../../../tasks/features/channels)
