[English](../../../architecture/runtime-architecture.md) | [Tiếng Việt](./runtime-architecture.md)

# Kiến trúc runtime

## Trạng thái

Tài liệu tham chiếu kiến trúc đang áp dụng

## Mục đích

Tài liệu này định nghĩa contract runtime bền của `clisbot`, đặc biệt là ranh giới giữa:

- `agents`
- `runners`
- persistence
- session continuity
- run lifecycle

Tài liệu này tồn tại để giữ product mental model không bị rò rỉ theo quirks của tmux hay backend.

## Quy tắc cốt lõi

`agents` sở hữu operating truth của hệ thống.

`runners` sở hữu cách từng backend thực thi công việc.

Persistence chỉ lưu lượng tối thiểu cần để continuity, recovery, và operator inspection sống qua restart.

## Ranh giới runtime

### Agents sở hữu

- agent identity
- session continuity
- queue state
- loop state
- workspace ownership
- mapping giữa routed surface và session
- run lifecycle truth ở tầng ứng dụng

### Runners sở hữu

- start / stop backend session
- submit prompt
- submit steering
- capture backend output
- parse backend-specific artifacts
- các quirks khi attach / resume / recover

### Persistence sở hữu

- những gì phải sống qua restart
- những gì cần để resume continuity
- những gì operator cần inspect một cách truthful

Persistence không được biến thành live runtime truth nếu bộ nhớ hiện tại đang biết thông tin mới hơn.

## Session continuity

Public mental model nên giữ đơn giản:

- một cuộc hội thoại trong `clisbot` được neo vào `sessionKey`
- `sessionKey` đó hiện map vào một `sessionId` active của native tool
- mapping đó có thể đổi về sau, nhưng không nên đổi ngẫu nhiên

Quy tắc:

- `SessionService` sở hữu `sessionKey -> sessionId`
- runners chỉ pass, capture, hoặc resume `sessionId`
- user bình thường không nên phải nghĩ về `sessionId`

## Persistence rule

Persist càng sớm càng tốt khi continuity truth đổi, nhưng không được spam write vô nghĩa.

Ví dụ:

- nếu runtime memory vừa biết `sessionId` mới, hãy persist nó sớm trong startup / rotation flow
- đừng persist lại cùng một giá trị trên mọi lần `watch`, `status`, hoặc read surface lặp đi lặp lại

Mục tiêu là:

- không làm mất continuity id quan trọng
- không biến read surface thành write loop

## Runtime truth và persisted truth

Khi runtime memory và persistence lệch nhau:

- ưu tiên runtime truth cho session live hiện tại
- vẫn cho operator biết giá trị đó đã persist hay chưa

Ví dụ diagnostic nên có thể hiện:

- `(persisted)`
- `(not persisted yet)`

## Run lifecycle

Active run là một truth riêng.

Nó không nên bị trộn vào:

- queue state
- route state
- persistence projection

Run lifecycle tối thiểu cần phân biệt được:

- đang start
- đang chạy
- detached nhưng vẫn active
- đã hoàn tất
- timeout
- error

## Runtime projection

`SessionRuntimeState` là persisted projection cho operator và recovery, không phải nguồn truth cuối cùng cho live run.

Các trạng thái hiện dùng:

- `idle`
- `running`
- `detached`

Quy tắc:

- `detached` vẫn là active
- `idle` nghĩa là không còn active runtime projection
- projection phải được đối chiếu với runner backend trước khi chặn công việc mới nếu không có in-memory active run

## Recovery rule

Recovery phải fail theo hướng an toàn về continuity.

Điều này có nghĩa:

- nếu session có khả năng resume mà bằng chứng đang mơ hồ, đừng tự ý mở conversation mới
- đừng xóa stored `sessionId` chỉ vì một lần capture hoặc startup yếu
- chỉ mở conversation mới khi có reason rõ ràng như `/new`, explicit rebind, hoặc backend reset đã được xác nhận

## tmux-specific rule

tmux là runner backend hiện tại, không phải public runtime model.

Vì vậy:

- tmux pane id không phải canonical state
- tmux window id không phải public continuity concept
- tmux-specific attach / capture logic phải ở runner boundary

`clisbot` có thể dựa vào tmux để chạy bền, nhưng product model không được buộc người dùng phải hiểu tmux internals.

## Operator-facing rule

Operator surface như:

- `clisbot status`
- `clisbot logs`
- `clisbot runner list`
- `clisbot watch`
- `clisbot inspect`

phải truthful về:

- runtime có đang sống không
- session nào đang active
- `sessionId` hiện tại là gì
- giá trị đó đến từ runtime memory, persistence, hay cả hai

Nhưng các surface này không được âm thầm đổi continuity state chỉ vì một lần inspect.

## Quy tắc đặt tên ở runtime

Ưu tiên tên boring, rõ owner:

- `SessionService` cho continuity và session-owned mutation
- `RunnerService` cho backend execution behavior
- `sessionMapping.*` cho continuity seam hướng mental model
- `runnerSessionId.*` cho runner-native mechanics

Tránh:

- tên quá abstract như `bind*` nếu nó làm mờ việc “set active mapping”
- đưa internal type lớn như `ResolvedAgentTarget` ra seam public mà chỉ cần một write reference nhỏ

## Vì sao ranh giới này quan trọng

Nếu continuity, queue, lifecycle, và backend mechanics bị nhập vào nhau:

- recovery sẽ khó truthful
- diagnostics sẽ bắt đầu nói dối
- đổi backend về sau sẽ đắt
- code rất dễ xóa continuity state nhầm trong các path lỗi

## Checklist review

Khi review runtime code hoặc doc:

1. logic này đang đổi session truth hay runner mechanics?
2. field này là persisted continuity hay transient backend artifact?
3. read surface này có đang âm thầm mutate state không?
4. path này có tự mở conversation mới khi evidence còn mơ hồ không?
5. runner-specific concern có đang bị đẩy lên product model không?
