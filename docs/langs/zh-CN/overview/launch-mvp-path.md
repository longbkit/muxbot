[English](../../../overview/launch-mvp-path.md) | [Tiếng Việt](../../vi/overview/launch-mvp-path.md) | [简体中文](./launch-mvp-path.md) | [한국어](../../ko/overview/launch-mvp-path.md)

# MVP 发布路径

## 目的

这份文档把当前的发布顺序明确下来。

可以把它当作一条简短的 roadmap 视角，用于：

- 社区读者
- 产品优先级判断
- backlog 复盘

更细的执行细节仍然应该放在已链接的 task 文档里。

## 发布原则

- 产品可以跨多层和多种 surface 配置，但默认值必须清楚
- status 和 debug surface 要足够真实，让 operator 看得出当前激活的是哪一层
- 首次启动的阻力要尽可能低
- 稳定性和运行时真实性是 launch gate，不是后补的打磨项
- naming、config shape、用户可见 surface 的清晰度，都是产品质量的一部分

## 当前快照

1. 先打地基：
   - 无摩擦启动与持久化 credential
   - 稳定的 runtime 以及真实可依赖的 status / debug surface
   - `/loop` 作为当前最有区分度的 workflow 能力
2. 国际发布门槛：
   - Claude、Codex、Gemini CLI 都要支持稳定并经过充分验证
   - 当前共享频道组合保持为 Slack + Telegram
3. 越南发布包：
   - 保持同一组 CLI
   - 增加 Zalo Bot Platform
   - 增加 Zalo Official Account
   - 增加 Zalo Personal
4. 下一波扩展：
   - 增加 Discord、WhatsApp、Google Workspace、Microsoft Teams 等渠道
   - 根据真实用户需求再增加 Cursor、Amp、OpenCode、Qwen、Kilo、Minimax 等 agentic CLI
5. 仍未关闭的决策：
   - 是否必须在更大范围公开发布前，把各 CLI 的原生命令兼容、override 与自定义能力一并补齐

## 第 0 阶段：地基

这些不是可做可不做的打磨项。

它们是 launch gate：

- 无需先折腾环境也能快速启动
- 第一次成功后能持久保存 credential
- runner 与 channel 行为稳定且真实
- operator 能看到 credential 来源、route 状态和 runtime 健康度
- `/loop` 作为当前处理重复或定时工作的核心亮点

## 第 1 阶段：国际核心发布

第一轮大范围发布，首先要证明一组通用 CLI 组合：

- Claude
- Codex
- Gemini

这一阶段的完成定义：

- 每个 CLI 都能通过现有 Slack 与 Telegram 组合正常工作
- 每个 CLI 都有足够的 setup、runtime、interrupt 验证，值得信任
- 文档和状态 surface 能清楚说明各 CLI 的特定注意事项

后续 CLI 扩展不应稀释这一轮核心验证门槛。

## 第 2 阶段：越南发布包

面向越南市场时，产品包应在相同核心 CLI 组合之上增加：

- Zalo Bot Platform
- Zalo Official Account
- Zalo Personal

这是一项渠道组合里程碑，不是另一条产品路线。

## 第 3 阶段：核心后扩展

在核心三件套被证明之后：

- 根据真实用户需求扩展 CLI 支持
- 只有拿到需求快照之后，再优先考虑 Cursor、Amp、OpenCode、Qwen、Kilo、Minimax
- 不要把所有可能支持的 CLI 都当作同等优先级的发布工作

在 Slack、Telegram 以及越南市场的 Zalo 渠道包稳定之后：

- 扩展到 Discord
- 扩展到 WhatsApp
- 扩展到 Google Workspace
- 扩展到 Microsoft Teams

## 原生 Slash Command

这仍然是一个会影响发布形态的明确决策点。

系统现在已经支持 `clisbot` 自有的 slash command，以及原生命令的 pass-through fallback。

尚未关闭的问题是：在更大范围发布前，是否还需要补齐：

- 每个 CLI 的原生命令兼容说明
- 保留命令冲突处理
- override 或重命名入口
- 针对命令前缀冲突的 operator / 用户自定义能力

## Backlog 链接

- [Common CLI Launch Coverage And Validation](../../../tasks/features/runners/2026-04-13-common-cli-launch-coverage-and-validation.md)
- [Zalo Bot, Zalo OA, And Zalo Personal Channel Strategy](../../../tasks/features/channels/2026-04-18-zalo-bot-oa-and-personal-channel-strategy.md)
- [Vietnam Channel Launch Package](../../../tasks/features/channels/2026-04-13-vietnam-channel-launch-package.md)
- [Secondary CLI Expansion Prioritization](../../../tasks/features/runners/2026-04-13-secondary-cli-expansion-prioritization.md)
- [Post-MVP Channel Expansion Wave](../../../tasks/features/channels/2026-04-13-post-mvp-channel-expansion-wave.md)
- [Native Slash Command Compatibility And Overrides](../../../tasks/features/agents/2026-04-13-native-slash-command-compatibility-and-overrides.md)
