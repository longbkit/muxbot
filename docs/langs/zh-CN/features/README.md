[English](../../../features/README.md) | [Tiếng Việt](../../vi/features/README.md) | [简体中文](./README.md) | [한국어](../../ko/features/README.md)

# 功能文档

## 目的

`docs/features/` 这一层主要回答：

- 现在有哪些功能区域
- 每个区域当前处于什么状态
- 该区域的主文档在哪里
- 交付工作落在哪个 task 目录里

当前中文只完成了这一页入口。各个功能区的子文档仍先回退到英文原文。

## 最重要的入口

- [feature-tables.md（英文原文）](../../../features/feature-tables.md)：功能状态的标准索引

## 主要功能区

- [Agents](../../../features/agents/README.md)
- [Auth](../../../features/auth/README.md)
- [Channels](../../../features/channels/README.md)
- [Configuration](../../../features/configuration/README.md)
- [Control](../../../features/control/README.md)
- [DX](../../../features/dx/README.md)
- [Runners](../../../features/runners/README.md)
- [Non-functionals](../../../features/non-functionals/README.md)

## 建议阅读方式

1. 先看 `feature-tables.md`
2. 进入对应功能区的主入口文档
3. 只有在需要实现细节时再进入 `docs/tasks/` 或 `docs/tests/`

## 基本规则

- `docs/features/` 保留功能定义与存在理由
- `docs/tasks/` 保留交付细节
- 每个功能区应该有一个清晰的入口文档
- 尽量用链接，不要把 backlog 内容重复复制到这里
