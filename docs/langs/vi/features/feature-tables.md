[English](../../../features/feature-tables.md) | [Tiếng Việt](./feature-tables.md)

# Bảng tính năng của clisbot

## Mục đích

File này là chỉ mục ở mức feature cho `docs/features/`.

Dùng nó để theo dõi:

- trạng thái hiện tại của từng feature
- feature doc chính
- task folder liên quan
- ghi chú ngắn mới nhất cần cho việc điều hướng

Không biến file này thành backlog.

Execution detail phải nằm trong `docs/tasks/`.

## Chú giải trạng thái

- `Proposed`
- `Planned`
- `Active`
- `Stable`
- `Paused`
- `Archived`

## Các vùng tính năng

| State | Area | Feature | Main Doc | Tasks Folder | Updated | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Active | surface | channels | [channels](./channels/README.md) | [channels tasks](../../../tasks/features/channels) | 2026-04-18 | Channels giờ có first-class plugin seam, và hướng mở rộng tại Việt Nam được tách rõ thành `zalo-bot`, `zalo-oa`, và `zalo-personal` thay vì gộp chung thành một provider Zalo mơ hồ. |
| Active | platform | auth | [auth](./auth/README.md) | [auth tasks](../../../tasks/features/auth) | 2026-04-24 | Auth giờ bao gồm first-owner claim, shared-route audience gating, silent `disabled` surfaces, shared allowlist enforcement trước khi vào runner, và invariant rõ ràng giữa owner/admin với allowlist. |
| Active | core | agents | [agents](./agents/README.md) | [agents tasks](../../../tasks/features/agents) | 2026-05-03 | Tầng agents giờ sở hữu session continuity qua `SessionMapping`, giữ stored session id khi recovery còn mơ hồ, và chú thích truth của persistence bên cạnh durable queue state trong diagnostics. |
| Active | core | runners | [runners](./runners/README.md) | [runner tasks](../../../tasks/features/runners) | 2026-05-03 | Runners giờ tiếp tục monitor cả các long-run sau khi detach, đồng thời siết trust-prompt handling và sự truthful của first-submit quanh startup, `/status`, và steering flow. |
| Active | ops | control | [control](./control/README.md) | [control tasks](../../../tasks/features/control) | 2026-05-03 | Control giờ có operator queue inspection và queue creation qua `clisbot queues`, cùng runner debug surfaces không cần recapture live pane chỉ để đoán session identity. |
| Active | platform | configuration | [configuration](./configuration/README.md) | [configuration tasks](../../../tasks/features/configuration) | 2026-04-24 | Configuration giờ chuẩn hóa policy cho ngữ cảnh chat trên `directMessages` và `groups` với raw id cộng `*`, coi `group:*` là default multi-user sender policy node, và vẫn giữ compatibility với route key của bản phát hành `0.1.43`. |
| Planned | developer-experience | dx | [dx](./dx/README.md) | [dx tasks](../../../tasks/features/dx) | 2026-04-17 | DX giờ có một front door hạng nhất cho machine-readable operator surfaces, upstream CLI compatibility contracts, và validation fake-vs-real về sau. |

## Các vùng non-functional

| State | Area | Feature | Main Doc | Tasks Folder | Updated | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Active | non-functional | architecture conformance | [architecture-conformance](./non-functionals/architecture-conformance/README.md) | [docs/tasks](../../../tasks) | 2026-05-01 | Dùng vùng này để giữ implementation bám theo architecture documents; bằng chứng audit lặp lại hiện nằm dưới `docs/audits/architecture-conformance/`. |
| Planned | non-functional | security | [security](./non-functionals/security/README.md) | [security tasks](../../../tasks/features/security) | 2026-04-17 | Security cần một front door hạng nhất cho ngữ cảnh chat dùng chung trust boundary, chống lạm dụng, và chặn bot-to-bot loop. |
| Active | non-functional | stability | [stability](./non-functionals/stability/README.md) | [stability tasks](../../../tasks/features/stability) | 2026-05-03 | Stability giờ bao gồm recovery cho restart false-failure có giới hạn, trust-prompt handling bị trì hoãn trước prompt submission, và queue/session recovery truthful hơn mà không xóa continuity khi bằng chứng còn yếu. |
| Planned | non-functional | runtime benchmarks | [runtime-benchmarks](./non-functionals/runtime-benchmarks/README.md) | [runtime-benchmark tasks](../../../tasks/features/runtime-benchmarks) | 2026-04-04 | Chỉ so Bun, Go, và Rust sau khi contract MVP trên Bun đã được neo bằng shared tests. |

## Quy tắc cập nhật

- Thêm hoặc cập nhật đúng một dòng cho mỗi stable feature area.
- Giữ state ngắn và rõ.
- Link tới đúng một front door doc cho mỗi feature.
- Link tới đúng một task folder khi implementation work đã tồn tại.
- Giữ note ở mức một câu ngắn.
- Đưa phạm vi sâu hơn, rationale, và subtasks sang các doc đã link thay vì nhồi hết vào đây.
