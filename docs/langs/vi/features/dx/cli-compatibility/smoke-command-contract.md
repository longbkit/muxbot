[English](../../../../../features/dx/cli-compatibility/smoke-command-contract.md) | [Tiếng Việt](./smoke-command-contract.md)

# Real-CLI Smoke Command Contract

## Tóm tắt

Trang này định nghĩa operator-facing contract cho real-CLI smoke surface đầu tiên.

Đích thiết kế là:

- dễ chạy bằng tay
- machine-readable đủ cho automation
- đủ ổn định để future canary hay dashboard có thể build lên trên

## Primary command

### Một CLI, một scenario

```text
clisbot runner smoke --cli <codex|claude|gemini> --scenario <name> --json
```

### Suite cho bộ ba khởi động

```text
clisbot runner smoke --cli all --suite launch-trio --json
```

## Flag bắt buộc

### `--cli`

Giá trị cho phép:

- `codex`
- `claude`
- `gemini`
- `all`

Quy tắc:

- `all` chỉ hợp lệ khi đi với `--suite`
- nếu dùng `--scenario` thì phải chọn một CLI cụ thể

### `--scenario`

Giá trị cho batch đầu:

- `startup_ready`
- `first_prompt_roundtrip`
- `session_id_roundtrip`
- `interrupt_during_run`
- `recover_after_runner_loss`

Quy tắc:

- loại trừ lẫn nhau với `--suite`
- bắt buộc khi `--cli` là một CLI cụ thể

### `--suite`

Giá trị cho batch đầu:

- `launch-trio`

Quy tắc:

- loại trừ lẫn nhau với `--scenario`
- ban đầu sẽ chạy:
  - `startup_ready`
  - `first_prompt_roundtrip`
  - `session_id_roundtrip`

## Flag tùy chọn nên có

- `--workspace <path>`
- `--agent <id>`
- `--artifact-dir <path>`
- `--timeout-ms <n>`
- `--keep-session`
- `--json`

`--keep-session` đặc biệt hữu ích khi operator muốn giữ nguyên live runner session để tự attach xem sau khi fail.

## Exit code

- `0`: scenario hoặc suite kết thúc mà không có classified failure
- `1`: scenario hoặc suite có ít nhất một classified failure
- `2`: input command sai hoặc tổ hợp flag không hợp lệ
- `3`: lỗi smoke framework trước khi scenario hoàn tất

## Schema kết quả của scenario

Mỗi lần chạy một scenario nên emit một JSON object kiểu:

```json
{
  "kind": "runner-smoke-result",
  "version": "v0",
  "cli": "codex",
  "scenario": "startup_ready",
  "ok": true,
  "grade": "strong",
  "startedAt": "2026-04-17T13:30:00.000Z",
  "finishedAt": "2026-04-17T13:30:09.000Z",
  "durationMs": 9000,
  "retryCount": 2,
  "detectionLatencyMs": 3100,
  "versionBefore": "0.30.2",
  "versionAfter": "0.30.2",
  "workspaceMode": "fresh-copy",
  "finalState": "ready",
  "failureClass": null,
  "errorCode": null,
  "artifactDir": "~/.clisbot/artifacts/runner-smoke/2026-04-17T13-30-00Z-codex-startup_ready"
}
```

## Schema kết quả của suite

Launch-trio suite nên emit một roll-up object có:

- `kind: "runner-smoke-suite-result"`
- `suite: "launch-trio"`
- `ok`
- tổng `durationMs`
- `results` theo từng CLI và scenario
- `summary` cho từng CLI, ví dụ:
  - `launchReady`
  - `continuityReady`
  - `interruptConfidence`

## Transition timeline schema

Mỗi artifact bundle nên có `transitions.json`, ví dụ:

```json
[
  {
    "at": "2026-04-17T13:30:01.000Z",
    "step": "start",
    "state": "starting",
    "note": "Runner instance created"
  },
  {
    "at": "2026-04-17T13:30:04.000Z",
    "step": "probe",
    "state": "waiting_input",
    "note": "Backend reached ready prompt"
  },
  {
    "at": "2026-04-17T13:30:09.000Z",
    "step": "final",
    "state": "ready",
    "note": "Scenario completed"
  }
]
```

## Khuyến nghị mạnh cho batch đầu

`runner smoke` ở batch đầu nên giữ read-only từ góc nhìn operator:

- chạy một scenario
- tạo result JSON
- lưu artifact
- chưa thêm operator semantics mang tính mutate nặng

Làm vậy surface hẹp hơn và dễ tin cậy hơn.

## Surface này phải giúp Bạn Long trả lời nhanh

Sau một lần chạy, output phải cho biết:

- CLI thật có launch không
- nó có tới `ready` truthful không
- prompt submission có thật sự chạy không
- continuity có thực sự resume không
- nếu fail thì fail ở đúng đoạn nào
