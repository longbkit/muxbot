[English](../../../overview/specs-review-checklist-draft.md) | [Tiếng Việt](../../vi/overview/specs-review-checklist-draft.md) | [简体中文](./specs-review-checklist-draft.md) | [한국어](../../ko/overview/specs-review-checklist-draft.md)

# Spec 评审清单草案

## 状态

草案

实验性的评审辅助工具。

还不是仓库的正式标准。

## 目的

在实现方案逐渐固化之前，用这份清单快速复查 feature spec。

它的设计目标是保持：

- 简短
- 足够 MECE，方便实际评审
- 随团队学习持续更新也不费力

## 评审状态标签

在待评审的 spec 或 guide 顶部使用一个标签：

- `explore`
- `spec-ready`
- `alpha`
- `beta`
- `official`

如果状态本身说不清，这份 spec 就还没准备好进入评审。

## 7 个检查门

### 1. 结果

- 用户或 operator 价值是否一目了然？
- 这个问题现在是否值得解决？
- 如果 user guide 读起来依旧偏弱，这个 feature 是否应该取消或重新收缩范围？

### 2. 角色与 Surface

- 涉及哪些用户类型或角色？
- 每个动作分别属于哪个 surface：user guide、prompt、slash command、routed runtime、operator CLI、还是 config？
- 谁能在什么地方做什么？

### 3. 行为与强制约束

- 当前行为是什么？
- 目标行为是什么？
- 哪些部分只是建议性描述？
- 哪些部分是硬约束？
- 分辨与生效顺序是否写清楚了？

### 4. 默认值与安全性

- 默认值和 fallback 是否安全？
- 一个看似中性的 fallback 会不会被误读成高权限状态？
- 受保护的边界是否清楚：可编辑模板与受保护 prompt block、route-local 规则与全局 auth 之间是否分得开？

### 5. Operator 流程

- 一个真实 operator 是否能在不理解架构上下文的情况下走完主流程？
- 添加、删除、修改、debug 流程是否都被覆盖？
- 拒绝与失败路径是否清楚并且可执行？

### 6. 过渡与风险

- 兼容策略是否明确：compatibility mode、migration，还是 fail-fast replacement？
- 主要回归风险是否被明确点出来？
- 是否还残留模糊不清的新旧行为并存？

### 7. 证据与成熟度

- 在需要时，是否同时具备面向开发者的 spec 与面向用户或 operator 的 guide？
- 文案是否匹配当前 runtime truth，而不是只描述计划中的 target truth？
- 成熟度标签是否诚实？
- 以当前标签来看，验证计划是否足够？

## 快速结论

一份 spec 通常可以认为状态不错，当它满足：

- 7 个检查门都有清晰答案
- 没有哪一门依赖隐藏假设
- user guide 与 dev spec 讲的是同一个故事
- 状态标签符合现实

常见的止步信号：

- 价值仍然说服力不足
- operator 流程依旧混乱
- 建议性行为与强制行为仍混在一起
- fallback 语义依然显得有风险
- guide 弱到这个 feature 可能根本不值得发布

## 备注

- 这份清单适合用于评审，不是用来替代 feature docs 或 task docs。
- 如果它反复抓到同一种缺失项，可以再把那条规则提升进 spec template。
