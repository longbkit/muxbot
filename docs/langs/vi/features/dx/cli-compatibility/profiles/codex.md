[English](../../../../../../features/dx/cli-compatibility/profiles/codex.md) | [Tiếng Việt](./codex.md)

# Codex CLI Profile

## Tóm tắt

Codex là CLI shape định hướng mặc định hiện tại trong `clisbot`.

Mô hình continuity của nó mạnh, nhưng startup readiness model vẫn generic hơn Gemini.

## Capability mapping

### `start`

Support: `Strong`

Current basis:

- command: `codex`
- startup args gồm:
  - `--dangerously-bypass-approvals-and-sandbox`
  - `--no-alt-screen`
  - `-C {workspace}`
- trust prompt handling đã bật

### `probe`

Support: `Partial`

Current basis:

- chưa có `startupReadyPattern` riêng
- startup thành công khi tmux bootstrap thấy post-trust snapshot không rỗng và không có blocker đã cấu hình
- vì vậy readiness ở cấp `probe` vẫn nghiêng về heuristic

Hệ quả:

- `waiting_input` và `ready` vẫn normalize được
- nhưng public profile cần thừa nhận proof hiện tại yếu hơn một ready regex chuyên dụng

### `sessionId`

Support: `Strong`

Current basis:

- create mode: `runner`
- capture mode: `status-command`
- status command: `/status`
- capture pattern: session id dạng gần như UUID

### `resume`

Support: `Strong`

Current basis:

- command mode resume
- shape hiện tại:
  - `codex resume {sessionId} --dangerously-bypass-approvals-and-sandbox --no-alt-screen -C {workspace}`

### `recover`

Support: `Strong`

Current basis:

- `agents` persist `sessionKey -> sessionId`
- runner có thể tạo lại tmux host và dùng lại stored Codex `sessionId`

### `attach`

Support: `Strong`

Current basis:

- tmux snapshot capture và observer flow đã có
- transcript normalization đã nhận ra snapshot và status line kiểu Codex

### `interrupt`

Support: `Partial`

Current basis:

- interrupt path hiện tại gửi `Escape`
- normalization nhận ra running footer như `Working (...)` và `Esc to interrupt`

Hệ quả:

- interrupt dùng được về mặt vận hành
- nhưng confirmation vẫn gián tiếp và cần giữ ở mức best-effort trong compatibility contract

## Running snapshot signal

- `Working (...)`
- duration footer với gợi ý interrupt

Đây là tín hiệu đủ mạnh cho running snapshot, nhưng vẫn nên xem chúng là observation signal riêng của Codex chứ không phải contract truth tự thân.

## Drift risk chính

- chưa có startup ready pattern explicit
- shape output của `/status` có thể drift
- model release drift có thể resume session cũ trên model mới hơn, ảnh hưởng hiệu năng hoặc continuity feel
- UI chrome và redraw behavior của Codex vẫn có thể làm pane-derived heuristic bị lệch
