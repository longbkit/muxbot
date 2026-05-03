[English](../../../../architecture/v0.2/02-shortlist-and-iterations.md) | [Tiếng Việt](./02-shortlist-and-iterations.md)

# Shortlist và các vòng lặp tinh chỉnh

Source of truth của tài liệu này:

- [docs/overview/human-requirements.md](../../overview/human-requirements.md)

File này so sánh năm phương án, giữ lại ba phương án tốt nhất, rồi tinh chỉnh chúng bằng cách mượn điểm mạnh từ các phương án đã bị loại.

## Các yếu tố ra quyết định

| Yếu tố | Vì sao quan trọng |
| --- | --- |
| Mental-model clarity | Con người phải giải thích được thiết kế mà không cần sa vào implementation detail. |
| Owner truthfulness | Mỗi quyết định quan trọng nên có một owner hiển nhiên. |
| Session-first fit | Requirements coi session là khái niệm chính. |
| Surface separation | Slack thread / Telegram topic không được sụp thành session identity. |
| Runner extensibility | tmux CLI bây giờ, API/SDK/ACP về sau. |
| Queue / steer / loop fit | Đây là khái niệm hạng nhất, không phải add-on phụ. |
| Backlog / fresh-session support | Công việc global nằm ngoài một session phải có chỗ ở tự nhiên. |
| KISS | Không được mang bộ máy nặng vào khi chưa cần. |
| Capacity control | Runner pool hoặc concurrency cap cần có chỗ ở rõ ràng. |

## Shortlist

Ba phương án tốt nhất là:

1. **Candidate D. Layered Control Plane + Runner Adapters**
2. **Candidate A. Session-Centric Core**
3. **Candidate C. Workflow-Centric Core**

## Vì sao Candidate B bị loại

- Nó đặt quá nhiều trọng lượng vào ngữ cảnh chat.
- Nó làm yếu khái niệm session quá sớm.
- Nó kém tự nhiên hơn cho các API surface tương lai, nơi không có route kiểu Slack hoặc Telegram.

## Vì sao Candidate E bị loại

- Tách biệt rất mạnh, nhưng cấu trúc quá nặng.
- Owner model tốt, nhưng actor packaging hiện tại quá đắt.

## Vòng tinh chỉnh 1

### Nâng cấp D bằng điểm mạnh của A và C

Lấy từ A:

- session vẫn là first-class aggregate có tên, không phải một blob ở giữa layer
- session-scoped queue và session-scoped loops là explicit

Lấy từ C:

- backlog và global loop được xem là workflow object, không bị giấu như special case

Kết quả:

- D trở thành phương án cân bằng mạnh nhất
- rủi ro còn lại là có thể phát sinh quá nhiều sub-object nếu naming không đủ kỷ luật

### Nâng cấp A bằng điểm mạnh của D và E

Lấy từ D:

- tách `RunControl` ra khỏi `Session`
- tách `RunnerAdapter` ra khỏi `RunControl`

Lấy từ E:

- thêm quy tắc owner: `Session` không được mutate trực tiếp vào runner internals

Kết quả:

- A sạch hơn hẳn
- nhưng một khi `RunControl` đã bị tách ra, A bắt đầu hội tụ về D

### Nâng cấp C bằng điểm mạnh của A và D

Lấy từ A:

- session vẫn là first-class, không chỉ còn là execution container

Lấy từ D:

- workflow logic không được sở hữu runner adapter details

Kết quả:

- C dùng được hơn nhiều
- nhưng vẫn cho cảm giác yếu hơn một kiến trúc session-first

## Vòng tinh chỉnh 2

Sau khi tinh chỉnh, shortlist trở thành:

1. **D+**
   Kiến trúc phân lớp với `Session`, `RunControl`, `Runner`, `Backlog`, và `Workload` được tách rõ.
2. **A+**
   Mô hình session-centric nhưng đã rút `RunControl` ra ngoài.
3. **C+**
   Mô hình workflow-centric nhưng tăng vai trò cho session identity.

## Chọn lại lần cuối

### Người thắng: D+

D+ thắng vì:

- vẫn giữ session là first-class
- vẫn giữ surface tách khỏi session
- vẫn giữ run lifecycle tách khỏi session workflow
- vẫn giữ raw executor detail tách khỏi run control
- cho queue, steer, loops, backlog, và pool một chỗ ở rõ ràng
- dễ nhất để biến thành FAQ kiểu “where should this belong?”

### Vì sao A+ thua

- sau khi làm sạch, nó chủ yếu trở thành một phiên bản ít explicit hơn của D+
- nó vẫn kéo quá nhiều trọng lực về `Session`

### Vì sao C+ thua

- rất mạnh cho workflow sophistication
- nhưng yếu hơn với mental model gốc dựa trên conversation

## Vòng nâng cấp cuối cho D+

Mượn nốt những phần mạnh cuối cùng từ các phương án đã bị loại:

Từ A+:

- dùng tên đơn giản
- giữ `Session` là thứ hạng nhất trong session layer

Từ C+:

- công nhận queue, backlog, và loops là workflow concept và không để chúng rò vào runner logic

Từ E:

- thêm quy tắc owner thật chặt: mỗi layer chỉ được quyết định đúng loại truth của chính nó

Từ B:

- giữ `ChatSurface` thật explicit để thread/topic không bị sụp về session identity

## Xác minh cuối trước khi viết final doc

| Requirement | Kết quả cuối của D+ |
| --- | --- |
| R1 | Được bao phủ bởi `Session` trong session layer |
| R2 | Được bao phủ bởi surface layer explicit |
| R3 | Được bao phủ bởi runner layer |
| R4 | Được bao phủ bởi quy tắc “chỉ có manager khi multiplicity thật sự cần policy” |
| R5 | Được bao phủ bởi run control state machine |
| R6 | Được bao phủ bởi session queue trong session layer |
| R7 | Được bao phủ bởi steering path trong run control layer |
| R8 | Được bao phủ bởi backlog object nằm ngoài mọi session cụ thể |
| R9 | Được bao phủ bởi session-bound loops và global loops |
| R10 | Được bao phủ bởi workload layer / runner pool |

Trong pass v0.2 này không còn raw human requirement nào chưa được bao phủ.
