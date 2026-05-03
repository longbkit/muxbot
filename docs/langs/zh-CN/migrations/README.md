[English](../../../migrations/README.md) | [Tiếng Việt](../../vi/migrations/README.md) | [简体中文](./README.md) | [한국어](../../ko/migrations/README.md)

# 手动迁移

## 目的

`docs/migrations/` 只在升级流程需要运维者手动操作时使用。

当前中文只完成了这一页入口。子文档仍先回退到英文原文。

对于 agent 或 bot 的更新流程：

- 先读 [index.md（英文原文）](../../../migrations/index.md)
- 如果没有手动操作，就不需要单独的迁移 runbook

## 结构

- [index.md（英文原文）](../../../migrations/index.md)：短小、适合 agent 读取的判断入口
- `vA.B.C-to-vX.Y.Z.md`：真正需要手动执行时的 runbook
- [templates/migration.md（英文原文）](../../../migrations/templates/migration.md)：模板

## 编写规则

只有在以下任一项不再安全或不再自动时，才需要单独写迁移说明：

- manual action
- update path
- breaking change
- rollback
- intermediate version

## 当前状态

目前没有稳定版本升级路径需要单独的手动 migration runbook。
