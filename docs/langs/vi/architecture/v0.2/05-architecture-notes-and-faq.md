[English](../../../../architecture/v0.2/05-architecture-notes-and-faq.md) | [Tiếng Việt](./05-architecture-notes-and-faq.md)

# Ghi chú kiến trúc và FAQ

Source of truth:

- [docs/overview/human-requirements.md](../../overview/human-requirements.md)
- [docs/architecture/v0.2/final-layered-architecture.md](./final-layered-architecture.md)
- [docs/architecture/v0.2/03-component-flows-and-validation-loops.md](./03-component-flows-and-validation-loops.md)
- [docs/architecture/v0.2/04-layer-function-contracts.md](./04-layer-function-contracts.md)

File này giải thích các quyết định ngầm phía sau final model.

## 1. Kiến trúc này đang cố bảo vệ điều gì

Raw requirements đang trộn lẫn nhiều concern:

- chat routing
- conversation continuity
- active execution
- tích hợp tmux hoặc API
- queue, loop, và backlog behavior
- concurrency limits

Final model này chống lại một failure rất thường gặp:

mọi thứ sụp hết vào một generic runtime hoặc session service.

Vì vậy thiết kế này ép năm loại truth phải tách nhau:

- `Surface`
- `Session`
- `Run Control`
- `Runner`
- `Workload`

## 2. Những quyết định ngầm quan trọng

### Session nghĩa là system conversation, không phải runner handle

- `Session` là khái niệm durable của hệ thống.
- `sessionId` chỉ là runner-side conversation handle hiện tại.
- Một `Session` có thể liên kết với nhiều `sessionId` theo thời gian.
- Nhưng tại một thời điểm chỉ nên có một `sessionId` linked đang active.

### Compaction không phải `/new`

- Compaction ở lại trong `Session` hiện tại.
- Mặc định compaction không nên rotate sang `sessionId` mới.
- Chỉ explicit `/new` hoặc recovery-driven re-entry mới có thể rotate sang `sessionId` khác.

### Surface rộng hơn Slack hay Telegram

- Một Slack channel, Slack thread, Telegram group, Telegram topic, hay API endpoint đều là `SurfaceRoute`.
- Kiến trúc này cố ý tránh đặt tên layer theo một transport cụ thể.

### Runner là raw execution, không phải workflow

- tmux là runner chính hiện tại
- backend completion tương thích API cũng nằm được ở đây
- executor kiểu SDK hoặc ACP cũng nằm ở đây

Queue, steerability, và backlog admission không thuộc `Runner`.

### Backlog không phải session queue

- `SessionQueue` là sequential work bên trong một conversation.
- `Backlog` là work nằm ngoài một active conversation.
- `GlobalLoop` thường feed `Backlog`, không feed `SessionQueue`.

### Queued không phải active run state

- `queued` thuộc `SessionQueue`.
- active run chỉ bắt đầu khi `Run Control` claim prompt kế tiếp.
- `settled` là một category cho terminal run states, không phải literal state cần persist.

## 3. Notices

### Thiết kế này cố ý bao phủ

- channel hoặc API entry dưới dạng `Surface`
- session continuity và rotation
- sequential session work
- direct steering của active run
- tmux hiện tại và API/SDK sau này
- áp lực global workload thông qua `RunnerPool`

### Thiết kế này cố ý không giải ở đây

- exact config file shape
- auth hoặc permission model
- exact storage model
- exact tmux command details
- exact API schema shape
- monorepo layout xuyên TypeScript, Go, và Rust

Những phần đó có thể được đặt lên trên sau. Không nên để chúng bẻ cong owner model cốt lõi ngay từ đầu.

## 4. Kiểm lại với raw requirements

| Chủ đề yêu cầu gốc | Quyết định cuối |
| --- | --- |
| Session vs runner session id | `Session` sở hữu stable identity; runner `sessionId` chỉ là handle đang linked và có thể xoay |
| Slack thread vs channel, Telegram group vs topic | tất cả được xem như biến thể của `SurfaceRoute` |
| tmux trước, API hoặc SDK sau | tất cả đều nằm trong `Runner` |
| queue vs steering | queue ở `Session`; steering ở `Run Control` |
| session-bound loop vs global loop | tách giữa `Session` và `Workload` |
| backlog và concurrency cap | đều sống trong `Workload` |
| state machine để update | `Run Control` sở hữu run state và transitions |

## 5. FAQ thực dụng

### Vì sao `Run Control` phải tách khỏi `Runner`?

Vì raw executor facts và workflow decisions là hai loại truth khác nhau.

`Runner` biết tmux hoặc API vừa phát ra điều gì.
`Run Control` quyết định các runner fact đó có nghĩa gì đối với active run state và terminal outcome.

### Vì sao `SessionQueue` không nằm trong `Run Control`?

Vì queue order thuộc conversation workflow, không thuộc active execution.

`Run Control` nên quan tâm cái gì đang chạy bây giờ, không nên ôm luôn toàn bộ future prompt.

### Vì sao `Workload` không được gọi thẳng xuống `Runner`?

Vì làm vậy sẽ bypass session truth và tạo ra hidden execution path.

Ngay cả fresh work cũng phải quay lại qua `Session`, rồi mới tiếp tục sang `Run Control`.

### Vì sao vẫn phải tách `Surface` nếu nó “chỉ” route và render?

Vì channel, thread, topic, và API response behavior thay đổi thường xuyên và không nên rewrite conversation hoặc run logic.

### Khi nào mới nên sinh thêm coordination object?

Chỉ khi multiplicity thật sự tạo ra policy:

- queue ordering
- loop scheduling
- concurrency cap
- backlog admission

Không phải chỉ để bọc helper dưới một cái tên mới.

## 6. Checklist review

Khi review code theo kiến trúc này, hãy hỏi:

1. Function này có đang quyết định hơn một loại truth không?
2. Layer này có đang nói trực tiếp protocol của layer thấp hơn không?
3. Session concern có đang bị trộn với fresh-work scheduling không?
4. Transport-specific logic có đang rò lên trên `Runner` không?
5. Route-specific logic có đang rò xuống dưới `Surface` không?

Nếu câu trả lời là có, code đang drift khỏi kiến trúc.
