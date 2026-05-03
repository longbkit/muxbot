[English](../../../../features/control/runner-debug-cli.md) | [Tiếng Việt](./runner-debug-cli.md)

# Runner Debug CLI

## Tóm tắt

`clisbot runner` giờ là tmux debug surface hướng tới operator để list, inspect, và watch live runner pane mà không cần chui vào raw tmux command trước.

Main `clisbot --help` giờ cũng đẩy `runner list` và `watch --latest` lên rõ hơn, còn `clisbot status` mặc định hiển thị năm runner session mới nhất.

Ví dụ:

- `clisbot runner list`
- `clisbot runner inspect --latest`
- `clisbot runner inspect --index 1`
- `clisbot runner watch <session-name> --lines 20 --interval 1s`
- `clisbot runner watch --latest --lines 20 --interval 1s`
- `clisbot runner watch --next --timeout 120s --lines 20 --interval 1s`
- `clisbot watch --latest`
- `clisbot inspect --latest`

## Phạm vi

- list live tmux runner session trên configured clisbot socket
- capture một pane snapshot từ named session
- watch một named session liên tục
- watch session có prompt mới admit gần nhất
- inspect hoặc watch session ở 1-based index in ra từ `runner list`
- chờ prompt mới được admit tiếp theo, rồi watch session đó

## Không nằm trong phạm vi

- thay raw tmux cho mọi advanced operator action
- attach interactive operator TTY vào tmux
- đo hoạt động dựa trên pane churn hoặc CPU usage
- đổi semantics của `/attach` hoặc `/watch` trong chat

## Invariants

- `runner` là operator control namespace; nó không định nghĩa lại logical session ownership
- top-level `clisbot watch` và `clisbot inspect` chỉ là shorthand cho `clisbot runner watch` và `clisbot runner inspect`
- `--index <n>` dùng đúng thứ tự 1-based được in ra từ `runner list`
- `watch --latest` nghĩa là session có prompt admit mới nhất, không phải tmux process mới nhất
- `watch --next` chờ prompt mới đầu tiên sau khi command bắt đầu, rồi bám luôn vào session đó
- việc chọn session dùng persisted session metadata trước, rồi map sang deterministic tmux session name được suy ra từ `sessionKey`
- nếu tmux runner bị recreate cho cùng logical session, nó vẫn resolve về cùng tmux session name theo naming rule hiện tại

## Nguồn dữ liệu

### tmux inventory

- nguồn: configured tmux socket từ `tmux.socketPath`
- dùng cho:
  - `runner list`
  - `runner inspect`
  - live pane capture trong `runner watch`

### admitted-turn ordering

- nguồn: `session.storePath`, field `lastAdmittedPromptAt`
- dùng cho:
  - `runner watch --latest`
  - `runner watch --next`
  - ordering hint trong `runner list`

Field này được update khi prompt được admit vào active execution, trước cả runner readiness hay pane capture.

## Command contract

### `clisbot runner list`

- in ra tmux runner session hiện có
- prefix mỗi header bằng `sessionName:` để dễ quét
- sort theo `lastAdmittedPromptAt` mới nhất khi có
- hiện `sessionId` đã lưu nếu có; nếu không thì `sessionId: not stored`
- không recapture mọi live pane chỉ để đoán `sessionId`
- hiện state đơn giản từ stored runtime nếu có, nếu không thì `state: unmanaged`
- không in thêm field `live`; bản thân command này đã là live tmux inventory
- vẫn hiện unnamed tmux-only session dù không khớp persisted metadata row nào

### `clisbot runner inspect <session-name>`

- capture một pane snapshot
- `--latest` chọn session có conversation admit prompt mới nhất
- `--index <n>` chọn theo thứ tự in từ `runner list`
- `--lines <n>` chỉnh số dòng tail của pane; mặc định là `100`

### `clisbot runner watch <session-name>`

- capture pane liên tục
- `--index <n>` chọn theo thứ tự `runner list`
- `--lines <n>` chỉnh số dòng tail của pane
- `--interval <duration>` chỉnh nhịp polling
- `--timeout <duration>` giới hạn thời gian watch khi cần
- header lúc watch hiện `session`, `agent`, `sessionId`, `lines`, và `state`
- bản thân polling khi watch không được spam persistence write nếu `sessionId` không đổi

### `clisbot runner watch --latest`

- chọn session có logical conversation admit prompt mới nhất
- không có nghĩa là tmux spawn mới nhất
- cũng không có nghĩa là pane đang churn nhiều nhất

### `clisbot runner watch --next`

- chờ prompt mới đầu tiên được admit sau khi command bắt đầu
- timeout mặc định là `120s`
- sau khi chọn được, watcher sẽ bám vào session đó

## Tài liệu liên quan

- [Control README](./README.md)
- [Session Identity](../agents/sessions.md)
- [Runtime Operations](../../user-guide/runtime-operations.md)
- [Control Test Cases](../../../../tests/features/control/README.md)
- [Task Doc](../../../../tasks/features/control/2026-04-18-runner-debug-watch-cli.md)
