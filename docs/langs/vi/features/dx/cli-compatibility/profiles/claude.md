[English](../../../../../../features/dx/cli-compatibility/profiles/claude.md) | [Tiếng Việt](./claude.md)

# Claude CLI Profile

## Tóm tắt

Claude có mô hình session identity explicit mạnh nhất trong bộ ba CLI hiện tại vì `clisbot` có thể truyền trước `sessionId` ngay từ lúc startup.

Các điểm yếu hơn:

- startup readiness vẫn thiên về heuristic, chưa đủ explicit
- Claude có thể tự bật plan approval và auto-mode classifier behavior mà `clisbot` hiện chưa chặn triệt để

## Capability mapping

### `start`

Support: `Strong`

Current basis:

- command: `claude`
- startup args gồm:
  - `--dangerously-skip-permissions`
- trust prompt handling đã bật

Boundary quan trọng:

- `--dangerously-skip-permissions` chỉ bỏ qua permission prompt của Claude
- nó không bảo đảm Claude sẽ tránh được plan-confirmation hay auto-mode flow khi session đã chạy

### `probe`

Support: `Partial`

Current basis:

- chưa có `startupReadyPattern` riêng cho Claude
- readiness phụ thuộc vào trust-prompt dismissal cộng generic startup bootstrap behavior

Stabilization đã ship:

- runner đã nhận ra trust prompt mới của Claude như:
  - `Quick safety check:`
  - `Yes, I trust this folder`
  - `Enter to confirm · Esc to cancel`

Hệ quả:

- startup đã tốt hơn đáng kể
- nhưng readiness vẫn chỉ nên được đánh dấu là partial cho tới khi có ready pattern explicit

### `sessionId`

Support: `Strong`

Current basis:

- create mode: `explicit`
- startup args có `--session-id {sessionId}`
- capture mode: `off`

Điều này có nghĩa Claude không cần status-command capture sau startup để giữ continuity.

### `resume`

Support: `Strong`

Current basis:

- command mode resume
- shape hiện tại:
  - `claude --resume {sessionId} --dangerously-skip-permissions`

### `recover`

Support: `Strong`

Current basis:

- logical session continuity không phụ thuộc vào tmux process cũ còn sống
- stored Claude session id có thể tái dùng khi tạo runner instance mới

### `attach`

Support: `Strong`

Current basis:

- tmux snapshot capture và observer flow đã có
- transcript normalization đã nhận ra Claude snapshot và running timer line

### `interrupt`

Support: `Partial`

Current basis:

- interrupt hiện tại gửi `Escape`
- normalization hiện nhận ra các running clue như:
  - `Worked for ...`
  - footer row dạng `| claude | ... | <duration>`

Vì vậy runtime UX nhìn được Claude đang chạy, nhưng interrupt confirmation vẫn gián tiếp và nên được xem là best-effort.

## Running snapshot signal

- `Worked for ...`
- `Cooked for ...`
- footer duration row của Claude

Các tín hiệu này hữu ích cho running snapshot, nhưng contract cuối cùng vẫn phải dựa trên normalized state chứ không chỉ dựa vào footer text.

## Drift risk chính

- chưa có startup ready pattern explicit
- wording của trust/safety prompt có thể drift tiếp
- multiline paste và terminal settlement vẫn nhạy với thay đổi UI
- Claude có thể rơi vào plan-complete approval screen ngay cả trong routed coding work
- sau bước approval đó, Claude có thể tiếp tục theo auto-mode classifier semantics thay vì quay lại cảm giác bypass-permissions

## Lưu ý cho operator

### Plan Approval Gate

Behavior đã quan sát:

- Claude có thể chuyển sang bước xác nhận plan-complete
- chuyện này vẫn xảy ra dù runner launch bằng `--dangerously-skip-permissions`
- `clisbot` hiện chưa có startup arg nào được xác minh là tắt chắc chắn behavior đó

Workaround hiện tại:

- bật `/streaming on` cho routed coding work
- nếu run bị kẹt ở plan approval screen, gửi `/nudge`
- trong quan sát hiện tại, `/nudge` thường kích tùy chọn đầu tiên và cho run đi tiếp

Hãy xem `/nudge` như workaround vận hành, không phải Claude contract được bảo đảm.

### Auto-Mode Classifier Drift

Behavior đã quan sát:

- Claude vẫn có thể hiện auto-mode classifier dù launch theo kiểu bypass-permissions
- classifier có thể bật cả với tác vụ local đơn giản như sửa file hay chạy command
- sau plan approval, Claude có thể tiếp tục hành xử theo auto-mode

Hàm ý cho operator:

- nếu đội cần local execution path dễ đoán nhất, nên tắt Claude auto mode trong chính setting của Claude trước khi route qua `clisbot`
- `clisbot` hiện không nên claim rằng launch arg của nó một mình là đủ để tắt behavior đó
