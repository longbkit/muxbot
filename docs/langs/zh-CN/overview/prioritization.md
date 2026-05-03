[English](../../../overview/prioritization.md) | [Tiếng Việt](../../vi/overview/prioritization.md) | [简体中文](./prioritization.md) | [한국어](../../ko/overview/prioritization.md)

# 优先级视角

## 目的

这页文档定义了 `clisbot` 当前的任务优先级判断视角。

适用场景：

- 判断哪些 task 应该算 `P0`
- 判断哪些工作应该先进入 `docs/tasks/backlog.md`
- 复查某个 task 到底是战略型产品工作，还是只是局部打磨

## 核心规则

优先做那些能让 `clisbot` 变得：

- 更稳定
- 更快
- 更容易扩展新的 CLI backend
- 更容易扩展新的通信渠道
- 在真实聊天 surface 里更自然、更好用
- 更容易做端到端验证
- 更容易让 AI agent 在这个 repo 里直接使用并持续改进

如果一个 task 只是局部改善其中一点，它依然可能重要。

如果一个 task 同时改善了多点，它通常应该更快上升。

## 当前优先主题

### 1. 稳定性与运行时真实性

这项始终排在最前面。

`clisbot` 是一个长生命周期 agent runtime，不只是本地小脚本。

这意味着 backlog 应该强烈偏向：

- 故障隔离
- 真实的 active-run 状态
- 有边界的恢复与自愈
- 能反映真实 runtime 状态的 health surface
- 不会悄悄退化的 channel 与 runner 行为

## 2. 速度与低摩擦响应时间

速度不是打磨项。

route 慢、submit 慢、follow-up 慢、channel 回复慢，都会直接降低产品质量。

因此 backlog 应该持续推进：

- channel 到 runner 的延迟
- submit latency
- follow-up 响应速度
- preview 和最终回复速度
- 出问题时 operator 的 debug 速度

## 3. 更容易接入新的 CLI backend

架构应该让新 CLI 的接入成本随着时间下降。

这意味着优先推进：

- 更干净的 runner contract
- 更少的 backend 特有泄漏跑出 runner 边界
- 更清晰的兼容预期
- 可复用的验证与 smoke surface
- 更少只绑死在 Codex、Claude、Gemini 上的隐性假设

## 4. 更容易接入新的渠道

架构也应该让新增渠道的成本随时间下降。

这意味着优先推进：

- 稳定的 channel plugin 边界
- channel 自己拥有的 transport 与 rendering 边界
- 可复用的 route、status、auth、lifecycle 模式
- 更少 Slack-only 或 Telegram-only 的假设泄漏到共享层

## 5. 原生聊天体验

Slack、Telegram 以及未来渠道，应该让人感觉是原生聊天体验，而不是终端镜像。

这意味着优先推进：

- 原生渲染
- 强 follow-up 行为
- 清晰的 thread / topic 感知
- 正确的回复目标
- 有价值的处理中反馈
- 更贴合渠道习惯的会话体验

## 6. 端到端验证与 AI 可操作的 hook

这个项目应该容易通过真实端到端流程验证，而不只是依赖单元测试。

这意味着优先推进：

- 端到端测试 surface
- smoke 与 canary 流程
- 稳定的 runner-debug workflow
- artifact 捕获
- 让 AI agent 能可靠使用的 message / control hook

## 7. 改善这个 repo 自身的 AI workflow

`clisbot` 应该成为团队最先真正改善 AI 协作工程流的地方之一。

这意味着优先推进：

- 更好的 agent 回复 workflow
- 更好的 review 与回归循环
- 更清晰的 prompt / command contract
- 让 AI 工作更快更安全的 repo 本地工具
- 让下一个 AI agent 不用重走一遍全量摸索的文档

## 优先级判断启发式

如果一个 task 满足以下任意一项或多项，就应当视作强 `P0` 候选：

- 去掉真实的稳定性或真实性风险
- 改善关键用户路径上的速度
- 明显降低新增 CLI 的难度
- 明显降低新增渠道的难度
- 提升 Slack / Telegram 核心 surface 的原生聊天体验
- 增加可复用的端到端验证杠杆
- 以可复利的方式改善 repo 的 AI workflow

以下类型通常优先级更低：

- 只有局部收益的打磨
- 不能带来真正简化的窄范围改名
- 让耦合更深的一次性 workaround
- 在基础还不够稳之前做的猜测性扩展

## 如何和 Backlog 一起使用

- `docs/tasks/backlog.md` 仍然是状态与优先级的真实来源。
- 这一页解释优先级应该怎么判断。
- 如果某个计划中的 task 和这些主题冲突，应先重写 task 说明，再决定是否提升优先级。

## 相关文档

- [Overview](README.md)
- [Launch MVP Path](launch-mvp-path.md)
- [Task Docs](../../../tasks/README.md)
- [Backlog](../../../tasks/backlog.md)
- [Stability](../../../features/non-functionals/stability/README.md)
- [DX](../../../features/dx/README.md)
