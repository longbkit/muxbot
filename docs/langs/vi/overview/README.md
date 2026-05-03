[English](../../../overview/README.md) | [Tiếng Việt](./README.md) | [简体中文](../../zh-CN/overview/README.md) | [한국어](../../ko/overview/README.md)

# Tổng quan dự án

## Mục đích

`docs/overview/` là nơi giúp người đọc hiểu nhanh:

- dự án này là gì
- mục tiêu của nó là gì
- những yêu cầu gốc nào các doc khác phải tôn trọng

## File chính

- [human-requirements.md](./human-requirements.md): bản tiếng Việt tham khảo của ghi chú gốc
- [launch-mvp-path.md](./launch-mvp-path.md): thứ tự ra mắt hiện tại
- [prioritization.md](./prioritization.md): lăng kính ưu tiên
- [specs-review-checklist-draft.md](./specs-review-checklist-draft.md): checklist nháp để review spec

## Mục tiêu dự án

`clisbot` là cầu nối giao tiếp cho các AI coding agent chạy bền theo session dài.

Ý tưởng chính:

- một coding CLI chạy trong một tmux session bền
- agent đó được đưa ra Slack, Telegram, và về sau là các kênh giao tiếp khác
- người dùng tận dụng subscription CLI rẻ hơn và thật hơn so với API-only stack
- tmux là ranh giới chính cho độ bền và khả năng scale

## MVP hiện tại

- Slack Socket Mode
- tmux-backed agents
- TypeScript + Bun
- một workspace agent có thể được route lại qua nhiều conversation session
- default workspace: `~/.clisbot/workspaces/default`
- default config: `~/.clisbot/clisbot.json`
