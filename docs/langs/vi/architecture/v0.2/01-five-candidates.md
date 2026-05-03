[English](../../../../architecture/v0.2/01-five-candidates.md) | [Tiếng Việt](./01-five-candidates.md)

# Năm phương án kiến trúc

Source of truth của tài liệu này:

- [docs/overview/human-requirements.md](../../overview/human-requirements.md)

Không dùng bất kỳ doc nào khác trong repo làm đầu vào kiến trúc cho pass này.

## Requirement digest dùng để xác minh

Đây là các yêu cầu quyết định được rút ra từ human brief:

| ID | Requirement |
| --- | --- |
| R1 | Session là một conversation context có `sessionKey` ổn định, theo thời gian map vào một `sessionId` active phía runner, nhưng vẫn có thể liên kết với nhiều `sessionId` trong lịch sử. |
| R2 | Chat surface không đồng nghĩa với session. Một channel, thread, group, hoặc topic có thể là nơi cuộc hội thoại diễn ra. |
| R3 | Runner là một lớp executor abstraction. Hôm nay tmux CLI là chính, về sau có thể có API/SDK/ACP variant. |
| R4 | Có thể cần manager hoặc pool cho nhiều object cùng loại, nhưng chỉ khi điều đó có lý do thật. |
| R5 | Runner cần một state machine để update caller của nó. |
| R6 | Session queue là sequential workflow, khác với prompt queue nội bộ của CLI. |
| R7 | Steering là direct injection path vào một turn đang chạy. |
| R8 | Có thể có global backlog nằm ngoài bất kỳ session nào và nó có thể spawn fresh session. |
| R9 | Loops có thể gắn với session hoặc ở mức global, và có thể inject theo queue mode hoặc steer mode. |
| R10 | Runner pool có thể cần để cap concurrent execution. |

## Candidate A. Session-centric core

### Ý tưởng cốt lõi

Biến `Session` thành aggregate chính. Gần như mọi thứ treo xung quanh nó.

### Main objects

- `ChatSurface`
- `Session`
- `SessionQueue`
- `SessionLoopList`
- `RunnerBinding`
- `Runner`
- `RunnerStateMachine`
- `Backlog`
- `RunnerPool`

### Quy tắc owner

- `ChatSurface` chỉ map inbound message vào một `Session`.
- `Session` sở hữu:
  - current linked `sessionId`
  - queue các prompt đang chờ
  - session-bound loops
  - steering admission
  - quan hệ với active runner execution
- `Runner` chỉ thực thi.
- `Backlog` sở hữu công việc có thể tạo fresh session.

### Điểm hấp dẫn

- Gần nhất với mental model của con người: “một cuộc hội thoại có một session”.
- Queue và loop rất tự nhiên khi đặt trong session.
- Dễ giải thích với operator.

### Điểm yếu chính

- Có nguy cơ nhồi quá nhiều trách nhiệm vào `Session`:
  - workflow
  - execution state
  - queueing
  - steering
  - sessionId mapping

### Xác minh

| Requirement | Kết quả | Ghi chú |
| --- | --- | --- |
| R1 | Pass | Session sở hữu tự nhiên mapping `sessionKey -> sessionId`. |
| R2 | Pass | Chat surface được tách rõ khỏi session. |
| R3 | Pass | Runner vẫn là abstraction độc lập. |
| R4 | Partial | Vẫn cần kỷ luật để không sinh quá nhiều manager. |
| R5 | Pass | Có runner state machine. |
| R6 | Pass | Session queue rất hợp chỗ này. |
| R7 | Pass | Steering có thể là action do session sở hữu. |
| R8 | Pass | Backlog ở ngoài session. |
| R9 | Pass | Session loop rất hợp; global loop vẫn cần danh sách riêng. |
| R10 | Pass | Runner pool có thể để bên ngoài. |

## Candidate B. Surface-centric routing core

### Ý tưởng cốt lõi

Biến `ChatSurface` thành aggregate trung tâm. Thread/topic/channel route là object hạng nhất; session chủ yếu chỉ còn là execution context gắn kèm.

### Main objects

- `ChatSurface`
- `SurfaceRoute`
- `SurfaceConversation`
- `SessionRef`
- `Runner`
- `RunnerStateMachine`
- `SurfaceQueue`
- `SurfaceLoopList`
- `Backlog`

### Quy tắc owner

- `ChatSurface` sở hữu routing, queueing, loops, và current conversation attachment.
- `Session` trở thành execution context cấp thấp hơn nằm dưới surface.

### Điểm hấp dẫn

- Rất tự nhiên cho UX kiểu Slack thread / Telegram topic.
- Hành vi của surface được làm rất explicit.

### Điểm yếu chính

- Human requirements định nghĩa session là khái niệm mạnh hơn surface.
- Có nguy cơ biến session identity thành thứ thứ yếu khi nó đáng ra phải là first-class.
- Khó hỗ trợ API surface hơn, nơi không có ngữ cảnh chat kiểu con người.

### Xác minh

| Requirement | Kết quả | Ghi chú |
| --- | --- | --- |
| R1 | Partial | Session bị hạ vai trò quá nhiều. |
| R2 | Pass | Surface được làm explicit. |
| R3 | Partial | Vẫn dùng được, nhưng đường API-like fit kém hơn. |
| R4 | Pass | Vẫn tương đối đơn giản. |
| R5 | Pass | Runner state machine vẫn có được. |
| R6 | Partial | Queue trở thành thứ do surface sở hữu thay vì session. |
| R7 | Pass | Steering vẫn khả thi. |
| R8 | Partial | Backlog trông như gắn thêm vào. |
| R9 | Partial | Global loop gượng hơn. |
| R10 | Pass | Pool vẫn khả thi. |

## Candidate C. Workflow-centric core

### Ý tưởng cốt lõi

Biến `Task` hoặc `WorkflowItem` thành object chính. Session chủ yếu là execution container cho sequential work.

### Main objects

- `WorkflowItem`
- `WorkflowQueue`
- `Session`
- `Runner`
- `RunnerStateMachine`
- `SteeringChannel`
- `LoopScheduler`
- `Backlog`
- `RunnerPool`

### Quy tắc owner

- `WorkflowQueue` sở hữu sequential prompt processing.
- `Session` là context container mà các item có thể tái dùng.
- `Runner` thực thi item hiện tại.

### Điểm hấp dẫn

- Rất hợp với chuỗi việc kiểu “coding, rồi review, rồi test”.
- Làm cho backlog và global loop trở nên rất tự nhiên.

### Điểm yếu chính

- Human requirements bắt đầu từ conversation và session, không phải workflow item.
- Thiết kế này mạnh nhưng có thể quá abstract cho MVP và cho operator clarity.

### Xác minh

| Requirement | Kết quả | Ghi chú |
| --- | --- | --- |
| R1 | Partial | Session có tồn tại nhưng không còn là vai chính. |
| R2 | Pass | Surface vẫn tách riêng. |
| R3 | Pass | Runner abstraction được giữ. |
| R4 | Partial | Số object và manager tăng nhanh. |
| R5 | Pass | Runner state machine fit tốt. |
| R6 | Pass | Mạnh nhất cho sequential queue. |
| R7 | Pass | Steering có thể bypass queue. |
| R8 | Pass | Hợp tự nhiên với backlog. |
| R9 | Pass | Loop scheduler fit tốt. |
| R10 | Pass | Pool fit tốt. |

## Candidate D. Layered control plane + runner adapters

### Ý tưởng cốt lõi

Tách theo layer thay vì xoay quanh một aggregate chính:

1. Surface layer
2. Conversation layer
3. Run control layer
4. Runner adapter layer
5. Capacity layer

### Main objects

- `ChatSurface`
- `Session`
- `Run`
- `PromptQueue`
- `SteeringInput`
- `Loop`
- `Backlog`
- `RunnerAdapter`
- `RunnerPool`

### Quy tắc owner

- Surface layer: nhận và render.
- Conversation layer: session identity và session-scoped workflow.
- Run control layer: active run, state machine, steering, dispatch.
- Runner adapter layer: tmux/API/SDK raw execution.
- Capacity layer: concurrency và admission caps.

### Điểm hấp dẫn

- Owner boundary rõ nhất.
- Hợp nhất cho bài toán “tmux bây giờ, API sau này”.
- Dễ quyết định “cái này nên thuộc về đâu”.
- Hợp với một FAQ kiểu “where should this belong?”.

### Điểm yếu chính

- Có thể trở nên quá abstract nếu layer boundary không được giữ thật gọn.
- Cần kỷ luật để tránh sinh thêm manager vô ích.

### Xác minh

| Requirement | Kết quả | Ghi chú |
| --- | --- | --- |
| R1 | Pass | Session nằm gọn trong conversation layer. |
| R2 | Pass | Surface được giữ tách riêng. |
| R3 | Pass | Runner adapter abstraction là first-class. |
| R4 | Pass | Manager là optional, không thành mặc định. |
| R5 | Pass | Run control layer sở hữu state machine. |
| R6 | Pass | Session queue nằm trong conversation layer. |
| R7 | Pass | Steering thuộc run control layer. |
| R8 | Pass | Backlog có thể sống cạnh hoặc ở trên conversation layer. |
| R9 | Pass | Session loop và global loop được tách rõ. |
| R10 | Pass | Capacity layer xử lý pool. |

## Candidate E. Actor / owner-boundary model

### Ý tưởng cốt lõi

Biểu diễn các runtime object lớn thành các actor tách owner:

- `SurfaceActor`
- `SessionActor`
- `RunActor`
- `RunnerActor`
- `BacklogActor`
- `LoopActor`
- `PoolActor`

### Main objects

- các actor ở trên cùng protocol message giữa chúng

### Quy tắc owner

- mỗi actor sở hữu state của riêng nó
- giao tiếp giữa actor là explicit
- mutation phải đi đúng theo protocol boundary

### Điểm hấp dẫn

- Boundary rất mạnh
- khó có chuyện write xuyên layer nếu actor protocol đủ sạch

### Điểm yếu chính

- trọng lượng cấu trúc quá lớn cho hiện tại
- dễ đẩy MVP vào một model “đẹp trên giấy nhưng đắt khi triển khai”

### Xác minh

| Requirement | Kết quả | Ghi chú |
| --- | --- | --- |
| R1 | Pass | Session identity vẫn first-class. |
| R2 | Pass | Surface tách rõ. |
| R3 | Pass | Runner abstraction tách bạch. |
| R4 | Partial | Actor packaging nặng hơn mức cần thiết. |
| R5 | Pass | State machine natural. |
| R6 | Pass | Queue giữ được. |
| R7 | Pass | Steering protocol rõ. |
| R8 | Pass | Backlog có chỗ riêng. |
| R9 | Pass | Loop ownership vẫn tách được. |
| R10 | Pass | Pool fit tốt. |

## Kết luận của vòng khám phá đầu

- A mạnh ở mental model của session
- D mạnh nhất ở owner boundary
- C mạnh ở workflow sophistication
- B làm session yếu đi quá sớm
- E đúng boundary nhưng đắt hơn nhu cầu hiện tại
