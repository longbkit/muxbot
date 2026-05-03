[English](../../../../../../features/dx/cli-compatibility/profiles/gemini.md) | [Tiếng Việt](./gemini.md)

# Gemini CLI Profile

## Tóm tắt

Gemini hiện có startup contract explicit rõ nhất trong bộ ba CLI khởi động đầu tiên.

Điểm yếu lớn nhất của nó không nằm ở session continuity, mà nằm ở environment và auth gating.

## Capability mapping

### `start`

Support: `Strong`

Current basis:

- command: `gemini`
- startup args gồm:
  - `--approval-mode=yolo`
  - `--sandbox=false`
- trust prompt handling đã bật
- đã cấu hình explicit startup blocker

### `probe`

Support: `Strong`

Current basis:

- ready pattern explicit:
  - `Type your message or @path/to/file`
- có startup blocker rõ ràng cho OAuth và sign-in recovery flow

Hệ quả:

- Gemini là ví dụ mạnh nhất hiện tại của một readiness contract đủ cứng
- `probe` có thể tách `ready` khỏi auth-blocked startup truthful hơn nhiều so với Codex và Claude

### `sessionId`

Support: `Strong`

Current basis:

- create mode: `runner`
- capture mode: `status-command`
- status command: `/stats session`
- capture pattern: session id dạng gần như UUID

### `resume`

Support: `Strong`

Current basis:

- command mode resume
- shape hiện tại:
  - `gemini --resume {sessionId} --approval-mode=yolo --sandbox=false`

### `recover`

Support: `Strong`

Current basis:

- `agents` persist `sessionKey -> sessionId`
- runner có thể tạo lại tmux và dùng lại Gemini session id bằng `--resume`

### `attach`

Support: `Strong`

Current basis:

- tmux snapshot capture và observer flow đã có
- transcript normalization đã nhận ra Gemini snapshot và running timer line hiện tại

### `interrupt`

Support: `Partial`

Current basis:

- interrupt path hiện gửi `Escape`
- normalization nhận ra running clue:
  - `Thinking... (esc to cancel, <duration>)`

Vì vậy running-state observation khá explicit, nhưng interrupt confirmation vẫn chỉ là best-effort cho tới khi có confirmation path mạnh hơn.

## Running snapshot signal

- `Thinking... (esc to cancel, <duration>)`

Đây là timer line quan trọng và cần được giữ trong running snapshot.

## Drift risk chính

- auth/setup screen của upstream có thể drift
- ready pattern hay output của `/stats session` có thể drift
- routed message-tool behavior của Gemini vẫn yếu hơn mong muốn ở một số live channel flow

## Lưu ý cho operator

Gemini support là có thật, nhưng nó phụ thuộc vào auth usable trong runtime environment.

Nếu Gemini rơi vào OAuth hoặc sign-in flow, normalized state đúng phải là `blocked`, không phải `ready`.
