[English](../../../../../features/dx/cli-compatibility/capability-contract.md) | [Tiếng Việt](./capability-contract.md)

# Contract capability cho tương thích CLI

## Trạng thái

Draft v0

## Tóm tắt

Tài liệu này định nghĩa contract tương thích đã chuẩn hóa đầu tiên cho các CLI tương tác phía upstream.

Contract này ưu tiên DX đọc được bằng máy và các giao diện cho người vận hành. Nó cố ý nghiêm hơn với dữ kiện đã chuẩn hóa so với raw terminal text.

## Quy tắc thiết kế

- Chuẩn hóa dữ kiện, không chuẩn hóa toàn bộ transcript.
- Ưu tiên capability và state invariant hơn là match banner riêng của từng CLI.
- Hành vi không được hỗ trợ phải được nói thẳng.
- Tách conversation identity khỏi runner instance identity.
- Contract phải dùng được cho runner dựa trên tmux hôm nay và cả runner không dùng tmux về sau.

## Thuật ngữ lõi

### `sessionKey`

Đây là định danh hội thoại logic do tầng agents chọn.

Nó không phải tmux target và cũng không phải CLI-native session id.

### `sessionId`

Đây là conversation id do chính CLI cung cấp khi upstream CLI có khái niệm đó.

Nó có thể không có, tới trễ, không được hỗ trợ, hoặc chỉ recover được sau startup.

### `runnerInstanceId`

Đây là định danh của nơi thực thi cho tiến trình CLI đang chạy.

Hôm nay nó thường map tới tmux-backed runner instance.

### `locator`

Đây là phần thông tin đọc được bằng máy ở mức tối thiểu để nhắm đúng live runner instance.

Ví dụ:

```json
{
  "runnerInstanceId": "runner_default_abc123",
  "hostKind": "tmux",
  "hostRef": "clisbot:agent-default:telegram-1207"
}
```

### `normalizedState`

Đây là bộ từ vựng trạng thái dùng chung của giao diện tương thích.

Giá trị v0:

- `starting`
- `ready`
- `waiting_input`
- `running`
- `blocked`
- `interrupted`
- `lost`
- `exited`
- `failed`
- `unknown`

## Common response envelope

Mọi phản hồi capability nên được chuẩn hóa về shape:

```json
{
  "ok": true,
  "capability": "probe",
  "cli": "codex",
  "observedAt": "2026-04-17T13:20:00.000Z",
  "session": {
    "sessionKey": "telegram:default:-1003455688247:1207",
    "sessionId": "sess_abc123",
    "runnerInstanceId": "runner_default_abc123",
    "locator": {
      "runnerInstanceId": "runner_default_abc123",
      "hostKind": "tmux",
      "hostRef": "clisbot:agent-default:telegram-1207"
    }
  },
  "state": {
    "normalizedState": "waiting_input",
    "running": false,
    "waitingInput": true,
    "inputAccepted": true
  },
  "warnings": [],
  "error": null
}
```

Response lỗi phải giữ cùng các top-level key và điền `error` rõ ràng.

## Error code chuẩn

- `UNSUPPORTED`
- `NOT_FOUND`
- `NOT_READY`
- `BLOCKED`
- `SESSION_ID_UNAVAILABLE`
- `PANE_LOST`
- `TIMEOUT`
- `CONFLICT`
- `BACKEND_ERROR`
- `INVALID_INPUT`

## Capability set

Bộ capability của v0:

- `start`
- `probe`
- `send`
- `attach`
- `resume`
- `recover`
- `interrupt`

Việc thu thập session id được model như một sub-result được hỗ trợ rõ ràng của `probe`.

## Capability contract

### 1. `start`

Bắt đầu một runner instance mới cho một hội thoại logic, có thể kèm requested session id hoặc resume preference.

Ví dụ input:

```json
{
  "capability": "start",
  "cli": "codex",
  "sessionKey": "telegram:default:-1003455688247:1207",
  "workspacePath": "/home/node/projects/clisbot",
  "agentId": "default",
  "resumePolicy": "fresh",
  "requestedSessionId": null,
  "reason": "new-turn"
}
```

Invariants:

- phải trả về `runnerInstanceId` hoặc fail rõ ràng
- không được claim `ready` trước khi `probe` chứng minh
- không được lén đổi `fresh` thành resume

### 2. `probe`

Inspect live runner instance và trả về readiness, trạng thái chạy, sự thật về `waiting_input`, sự thật về mất pane, và kết quả thu thập session id đã được chuẩn hóa.

Ví dụ input:

```json
{
  "capability": "probe",
  "cli": "codex",
  "locator": {
    "runnerInstanceId": "runner_default_abc123",
    "hostKind": "tmux",
    "hostRef": "clisbot:agent-default:telegram-1207"
  },
  "waitMs": 1000,
  "includeSnapshot": true
}
```

Invariants:

- `probe` là nguồn truth cho `ready`, `waiting_input`, `running`, `blocked`, `lost`
- phải expose session-id capture là một trong:
  - `captured`
  - `pending`
  - `unsupported`
  - `lost`
- caller không phải tự parse raw pane text

### 3. `send`

Gửi prompt hoặc control input tới live runner instance đang được nhắm tới.

Invariants:

- phải phân biệt `submitted`, `rejected`, `queued`, `uncertain`
- không được suy ra model đã chấp nhận input nếu việc giao tới terminal còn mơ hồ
- có thể nhắm tới cả trạng thái `running` để steer tiếp, nhưng kết quả phải nói rõ đó là supported hay best-effort

### 4. `attach`

Gắn observation stream hoặc snapshot view vào live runner instance mà không cướp quyền điều khiển.

Invariants:

- `attach` dùng để quan sát, không để chuyển control ownership
- running timer chỉ nên hiện trong running snapshot
- consumer phải bỏ qua được nhiễu trong raw transcript mà vẫn dùng được event stream

### 5. `resume`

Tạo hoặc khôi phục live runner instance cho một session id do CLI cung cấp và đã biết từ trước.

Invariants:

- phải phân biệt `resumed`, `fresh_started`, `unsupported`, `not_found`
- không được âm thầm start mới khi policy là `require-resume`

### 6. `recover`

Phục hồi sau host-level loss, đặc biệt là mất pane hay runner instance biến mất, trong khi cố giữ định danh hội thoại logic nếu có thể.

Invariants:

- `recover` là câu trả lời rõ ràng cho trường hợp mất pane
- phải nói được session identity có được giữ không
- không được che giấu lúc nào cần manual intervention

### 7. `interrupt`

Yêu cầu CLI dừng hoặc nhường lần chạy hiện tại.

Invariants:

- phải phân biệt `sent` với `confirmed`
- phải nói rõ nếu mức hỗ trợ chỉ là best-effort hoặc hoàn toàn không được hỗ trợ
- truth cuối cùng nên dựa vào `probe`, không chỉ dựa vào heuristic từ raw key

## Mapping surface CLI gợi ý

Bề mặt đầu tiên đọc được bằng máy cho người vận hành nên map như sau:

- `runner probe --json` -> `probe`
- `runner send --json` -> `send`
- `runner attach --json` -> `attach`
- `runner start --json` -> `start`
- `runner resume --json` -> `resume`
- `runner recover --json` -> `recover`
- `runner interrupt --json` -> `interrupt`

`probe` nên là nơi canonical để trả lời:

- CLI này đã ready chưa
- nó có đang đợi input không
- nó còn đang chạy không
- session-id capture có thành công không
- host pane có bị mất không

## Điều contract này cố ý tránh

- exact raw pane-text schema
- channel rendering policy
- transcript history semantics
- public capability name mang mùi tmux-only
- giả vờ mọi CLI đều hỗ trợ resume, interrupt, hay session id giống nhau
