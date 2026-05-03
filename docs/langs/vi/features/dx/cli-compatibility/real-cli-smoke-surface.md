[English](../../../../../features/dx/cli-compatibility/real-cli-smoke-surface.md) | [Tiếng Việt](./real-cli-smoke-surface.md)

# Giao diện smoke cho CLI thật

## Tóm tắt

Trang này định nghĩa batch DX thực dụng tiếp theo cho việc kiểm chứng CLI thật.

Mục tiêu rất thẳng:

sau batch kế tiếp, người vận hành phải chạy được một bộ kiểm tra nhỏ trên Codex, Claude, và Gemini, rồi đọc ra ngay:

- CLI nào hiện tương thích tới mức nào
- capability nào hỏng
- lỗi nằm ở startup, session, observation, interrupt, hay recovery
- artifact nào chứng minh kết quả

Bề mặt này nên được dẫn dắt bởi các risk slice trong [Bản đồ kiểm chứng cho người vận hành](./operator-validation-map.md), không chỉ bởi tên scenario.

## Batch tiếp theo nên giao gì

### 1. One-shot real-CLI smoke command

Surface đề xuất:

```text
clisbot runner smoke --cli <codex|claude|gemini> --scenario <name> --json
```

Mục đích:

- chạy một scenario trên CLI thật
- trả về một result object đã chuẩn hóa
- không bắt người vận hành phải mở tmux pane thủ công ngay từ đầu

### 2. Artifact bundle cho mỗi lần chạy

```text
~/.clisbot/artifacts/runner-smoke/<timestamp>-<cli>-<scenario>/
```

File tối thiểu:

- `result.json`
- `summary.md`
- `transitions.json`
- `snapshots/000-start.txt`
- `snapshots/001-after-submit.txt`
- `snapshots/002-final.txt`

### 3. Roll-up compatibility summary

Surface đề xuất:

```text
clisbot runner smoke --cli all --suite launch-trio --json
```

Mục đích:

- chạy một suite nhỏ trên Codex, Claude, Gemini
- xuất một bản tổng hợp tương thích cho từng CLI
- cho người vận hành thấy readiness khi khởi động chỉ trong một lần nhìn

Bản tổng hợp không được che mất bằng chứng về trust blocker, lệch cập nhật, việc thu thập session id bị trễ, hay sự thiếu ổn định khi gửi prompt.

## Workspace mode bắt buộc

Ít nhất phải model:

- `current`
- `fresh-copy`
- `existing-session`

Vì những failure có giá trị chẩn đoán nhất thường phụ thuộc vào context:

- trust/setup blocker lộ ra trên workspace mới
- continuity issue lộ ra trên existing session
- health check bình thường thường chạy trên workspace hiện tại

## Bộ scenario đề xuất cho batch đầu

### `startup_ready`

Mục tiêu:

- chứng minh CLI đi tới `ready` theo đúng thực tế

Trả lời:

- runner có launch được CLI thật không
- startup có bị chặn bởi trust, auth, setup không
- `probe` có phân biệt `ready`, `blocked`, `timeout` đúng không

Mode quan trọng nhất:

- `fresh-copy`

### `first_prompt_roundtrip`

Mục tiêu:

- chứng minh prompt mới có thể được gửi và ổn định xong

Trả lời:

- `send` có thật sự đưa trạng thái từ `waiting_input` sang `running` không
- CLI có tạo output có nghĩa không
- settlement có sạch không

Fixture rủi ro cao:

- multiline prompt
- prompt literal bắt đầu bằng `/`
- prompt chứa `$` hay `@`

### `session_id_roundtrip`

Mục tiêu:

- chứng minh đường continuity đã chọn là có thật

Trả lời:

- `sessionId` có được capture hoặc inject như kỳ vọng không
- lần startup kế tiếp có dùng lại cùng session đó không
- continuity là thật hay chỉ bị suy ra

### `interrupt_during_run`

Mục tiêu:

- chứng minh interrupt ít nhất hữu ích ở mức vận hành trên CLI thật

### `recover_after_runner_loss`

Mục tiêu:

- chứng minh pane-loss recovery cho CLI có resume

## Metric cắt ngang

Mỗi kết quả scenario nên ít nhất có:

- `durationMs`
- `retryCount`
- `detectionLatencyMs`
- `sessionIdLatencyMs` khi có liên quan
- `versionBefore`
- `versionAfter`
- `workspaceMode`
- `artifactDir`

Một kết quả chậm nhưng đúng vẫn có thể vẫn yếu về vận hành, nên các field này rất quan trọng.

## Operator nên nhìn thấy gì

Kết quả nên nói được:

- CLI nào
- scenario nào
- có `ok` không
- grade gì
- final state là gì
- failure class là gì
- artifact nằm ở đâu

## Failure classification

- `launch-failed`
- `ready-timeout`
- `auth-blocker`
- `trust-blocker`
- `submit-failed`
- `settlement-failed`
- `session-id-missing`
- `resume-failed`
- `interrupt-unconfirmed`
- `runner-lost`
- `recover-failed`
- `update-drift`
- `prompt-mode-drift`

## Bản tổng hợp phải giúp trả lời nhanh

1. CLI nào launch-ready ngay lúc này
2. CLI nào có continuity thật
3. CLI nào sống sót qua runner loss
4. CLI nào còn interrupt semantics yếu
5. Lỗi nào là drift từ upstream, lỗi nào là gap của runner bên mình

## Thứ tự triển khai gợi ý

Nếu phải giữ lean:

1. `startup_ready`
2. `first_prompt_roundtrip`
3. `session_id_roundtrip`
4. roll-up summary cho bộ ba CLI
5. rồi mới tới `interrupt_during_run` và `recover_after_runner_loss`

## Cách đọc thực dụng

Người vận hành nên nhìn một kết quả là trả lời được:

- CLI có launch đúng workspace mode đã yêu cầu không
- nó bị chặn bởi trust, auth, update drift, hay thứ khác
- state detection mất bao lâu
- phải retry bao nhiêu lần
- continuity tới từ injection hay capture
- prompt submission có còn literal không
- mở proof ở đâu
