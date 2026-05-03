[English](../../../../architecture/v0.2/final-layered-architecture.md) | [Tiếng Việt](./final-layered-architecture.md)

# Kiến trúc phân lớp cuối cùng

Source of truth:

- [docs/overview/human-requirements.md](../../overview/human-requirements.md)

Mục tiêu:

Giữ model nhỏ, nhưng giữ ownership đủ sắc để route, conversation, active run, runner protocol, và global scheduling không sụp hết vào một blob.

## 5 layer

| Layer | Sở hữu | Main concepts | Không được sở hữu |
| --- | --- | --- | --- |
| `Surface` | route truth và rendering truth | `Surface`, `SurfaceRoute` | session continuity, run state, runner protocol |
| `Session` | conversation continuity | `Session`, `SessionQueue`, `SessionLoop` | route rendering, active run lifecycle, runner protocol |
| `Run Control` | active execution truth | `Run`, `RunState`, `SteeringInput` | route truth, session identity, runner transport |
| `Runner` | raw executor truth | `Runner`, `TmuxRunner`, `ApiRunner`, `SdkRunner` | queue policy, steering policy, session truth |
| `Workload` | fresh-work scheduling truth | `Backlog`, `GlobalLoop`, `RunnerPool` | session identity, active run truth, runner protocol |

## Quy tắc single-truth

Mỗi layer chỉ được giữ một loại truth.

Nếu một concept muốn quyết định cùng lúc hai thứ sau, hãy tách nó ra:

- reply xuất hiện ở đâu
- các turn có còn thuộc cùng một conversation hay không
- hiện đang có gì chạy
- hệ thống nói chuyện với tmux, API, hoặc SDK ra sao
- fresh work có nên đợi hay bắt đầu ngay

## Tóm tắt từng layer

- `Surface`: cuộc hội thoại xuất hiện ở đâu
- `Session`: nó thuộc về conversation nào
- `Run Control`: cái gì đang được thực thi ngay lúc này
- `Runner`: việc thực thi thực sự diễn ra như thế nào
- `Workload`: công việc nằm ngoài một active session

## Quy tắc placement

| Nếu concept chủ yếu quyết định... | Thì đặt nó ở... |
| --- | --- |
| reply nên hiện ở đâu | `Surface` |
| hai turn có thuộc cùng một conversation không | `Session` |
| prompt có còn đang đợi theo session order hay không | `Session` |
| active run đang starting, running, detached, hay terminal | `Run Control` |
| cách nói chuyện với tmux, API, hoặc SDK | `Runner` |
| fresh work có nên đợi vì áp lực concurrency hay không | `Workload` |

## Quy tắc multiplicity

Chỉ được sinh thêm coordination object khi multiplicity thật sự tạo ra policy.

Lý do tốt:

- nhiều session prompt cần sequential workflow
- nhiều loop cần scheduling
- nhiều runner cần concurrency cap
- nhiều backlog item cần admission policy

Lý do tệ:

- gom helper lại cho gọn
- chỉ để forward call
- giấu ownership sau một generic wrapper

## Fast FAQ

| Câu hỏi | Trả lời |
| --- | --- |
| Mapping `sessionKey -> sessionId` nằm ở đâu? | `Session` |
| Một `Session` có thể link nhiều runner `sessionId` theo thời gian không? | Có. `Session` sở hữu một `sessionId` active tại một thời điểm, nhưng có thể giữ historical link. |
| Compaction có mặc định tạo session mới không? | Không. Compaction ở lại trong `Session` hiện tại trừ khi có quyết định rotate hoặc recovery riêng. |
| `queued` thuộc về đâu? | `Session`, vì đó là thứ tự queue trước khi có active run. |
| Steering thuộc về đâu? | `Run Control` |
| Session queue nằm ở đâu? | `Session` |
| Session-bound loops nằm ở đâu? | `Session` |
| Global loops và backlog nằm ở đâu? | `Workload` |
| tmux pane hoặc API submission nằm ở đâu? | `Runner` |
| Active run state và run transitions nằm ở đâu? | `Run Control` |
| Logic của Slack thread hay Telegram topic nằm ở đâu? | `Surface` |
| Một API-compatible completion route sẽ fit ở đâu? | Đi vào từ `Surface`, rồi vẫn theo đường `Session -> Run Control -> Runner`. |

## Danh sách phải dọn ngay khi thấy

Nếu nằm sai layer, hãy xóa hoặc chuyển nó đi:

- surface logic đi quyết định execution state
- session logic đi nói raw tmux hoặc API protocol
- run-control logic đi render reply theo route-specific rule
- runner logic đi quyết định queue, backlog, hoặc loop policy
- workload logic đi rewrite session identity

## Bài test đơn giản cuối cùng

Nếu reviewer hỏi:

- “cuộc hội thoại này sống ở đâu?” -> `Session`
- “hiện đang chạy cái gì?” -> `Run Control`
- “nó nói chuyện với tmux hay API thế nào?” -> `Runner`
- “reply nên hiện ở đâu?” -> `Surface`
- “vì sao việc này bị delay hoặc được start fresh?” -> `Workload`

Nếu câu trả lời không bật ra ngay, kiến trúc đang bị rò.
