[English](../../../overview/README.md) | [Tiếng Việt](../../vi/overview/README.md) | [简体中文](./README.md) | [한국어](../../ko/overview/README.md)

# 项目总览

## 目的

`docs/overview/` 用来帮助读者快速理解：

- 这个项目是什么
- 它想解决什么问题
- 其他文档必须尊重哪些原始需求

## 主要文件

- [human-requirements.md](../../../overview/human-requirements.md)：原始人类需求说明，当前仍以英文原文为准
- [launch-mvp-path.md](./launch-mvp-path.md)：当前发布顺序
- [prioritization.md](./prioritization.md)：优先级判断视角
- [specs-review-checklist-draft.md](./specs-review-checklist-draft.md)：spec 评审清单草案

## 项目目标

`clisbot` 是长生命周期 AI coding agent 的通信桥。

核心思路是：

- 一个 AI coding CLI 对应一个持久化 tmux session
- 这些 agent 可以被暴露到 Slack、Telegram，以及未来更多通信入口
- 用户可以更低成本、更真实地复用 subscription 型 coding CLI，而不是完全依赖 API-only 方案
- tmux 是当前稳定性和可扩展性的核心边界

## 当前 MVP

- Slack Socket Mode
- tmux-backed agents
- TypeScript + Bun
- 一个 agent workspace 可被多个 conversation session 复用
- 默认 workspace：`~/.clisbot/workspaces/default`
- 默认 config：`~/.clisbot/clisbot.json`
