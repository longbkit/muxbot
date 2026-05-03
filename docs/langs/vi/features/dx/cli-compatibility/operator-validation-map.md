[English](../../../../../features/dx/cli-compatibility/operator-validation-map.md) | [Tiếng Việt](./operator-validation-map.md)

# Bản đồ kiểm chứng cho người vận hành với CLI thật

## Trạng thái

Draft v0

## Tóm tắt

Trang này biến checklist con người thành một bản đồ kiểm chứng theo góc nhìn của người vận hành.

Mục tiêu không phải nhắc lại các mối lo, mà là trả lời:

- rủi ro thật là gì
- tái hiện nó có chủ đích như thế nào
- người vận hành nên dùng giao diện nào
- tín hiệu và metric nào đáng đo
- artifact nào chứng minh kết quả

Tài liệu này cố ý đi từ lát rủi ro trước, không đi từ scenario trước.

## Vì sao tồn tại

Nếu giao diện DX chỉ bắt đầu bằng các scenario "đẹp", rất dễ bỏ lỡ painpoint thật:

- first launch trên workspace thật sự mới
- update banner và auto-update exit
- session-id capture tới trễ hoặc mong manh
- state inference đúng nhưng quá trễ
- prompt paste behavior bị lệch bởi special character
- steering giữa lúc run đang diễn ra
- không có đường dẫn bằng chứng dễ đọc khi detector đang vật lộn

Đó không phải chi tiết phụ. Đó là những ranh giới quyết định ứng dụng có thể tin một CLI thật hay không.

## Nguyên tắc thiết kế

Đơn vị chính nên là **risk slice**, không phải transcript và cũng không phải golden scenario.

Mỗi risk slice nên định nghĩa:

- reproduction setup
- giao diện cho người vận hành
- normalized outcome
- measured timing
- artifact dễ đọc với con người

Scenario vẫn có thể tồn tại về sau, nhưng nên được dựng từ chính các risk slice này.

## Ma trận risk slice

| Risk Slice | Vì sao quan trọng | Tái hiện có chủ đích thế nào | Cần đo gì | Artifact bắt buộc |
| --- | --- | --- | --- | --- |
| Fresh workspace launch | bắt được trust/setup instability chỉ có ở first launch | chạy CLI trong workspace copy mới, không có runner state cũ | startup blocker class, time to first stable state, retries before settle | first pane snapshot, transitions timeline, final probe JSON |
| CLI version drift | bắt được upstream behavior change sau khi upgrade | chạy ngay sau lúc đổi version hoặc khi startup có update banner | version before/after, update notice seen, exit/restart behavior, settle result | startup snapshot, version record, failure classification |
| Session id acquisition | chứng minh continuity path là thật | thử cả injection path lẫn capture path | session id source, time to first session id, retry count, capture success rate | snapshot quanh lúc id xuất hiện, probe output, session record |
| Ready-state detection | chứng minh prompt được gửi đúng lúc | probe liên tục từ lúc launch tới khi ready hoặc blocked | false positive, false negative, detection latency, retry count | probe timeline, pane snapshot ở mỗi lần state đổi |
| Prompt paste and submit | chứng minh input thật sự được đưa vào và chạy | submit prompt fixture đi đúng production tmux path | input accepted, submit success, time from submit to running, settle result | pre-submit snapshot, post-submit snapshot, final snapshot |
| Special-character safety | bắt trường hợp CLI nhảy sang mode khác | gửi prompt chứa `/`, `$`, `@`, multiline block, leading whitespace variant | prompt có còn literal không, alternate mode có bật không, submit path có đổi không | raw prompt fixture, pane snapshot trước và sau submit |
| Live running and steer | chứng minh state truth trong long run | gửi long-running prompt rồi chèn một steer giữa chừng | running-state continuity, timer movement, steer accepted, final settle | running snapshot, steer event record, final result |
| Human observability | giữ niềm tin cho người vận hành khi hệ thống báo lỗi | lưu và hiển thị đúng pane text mà detector đã dùng | người thật có giải thích được classification nhanh không | watch output, summary markdown, latest snapshot path |

## Workspace mode

Bề mặt này cần model workspace mode một cách rõ ràng, không để ngầm hiểu.

### `current`

Dùng workspace hiện tại và CLI environment hiện tại.

Phù hợp khi muốn biết setup đang dùng hôm nay có khỏe không.

### `fresh-copy`

Copy repo hiện tại sang một workspace path tạm thời mới rồi launch ở đó, không tái dùng runner artifact cũ.

Phù hợp để tái hiện trust/setup lần launch đầu mà không phá workspace hiện tại.

Đây là mode quan trọng nhất cho vấn đề trust prompt.

### `fresh-empty`

Launch CLI trong thư mục tạm trống hoàn toàn.

Phù hợp khi muốn tách repository-specific trust/setup ra khỏi generic startup behavior.

### `existing-session`

Cố ý tái dùng logical session trước đó.

Phù hợp cho continuity, resume, và pane-loss recovery.

## Mapping painpoint

### 1. Workspace Trust And First Launch

Không được xem nó như lỗi startup chung chung.

Luồng tái hiện cần:

- tạo workspace path tạm thời
- không dùng lại runner state cũ cho path đó
- launch CLI ở đó
- probe tới khi settle vào một trong các trạng thái:
  - `ready`
  - `blocked:trust`
  - `blocked:auth`
  - `failed`

Cái cần nhất:

- một command để launch trong `fresh-copy`
- một giao diện `watch` để người vận hành nhìn trực tiếp trust prompt
- metric cho biết mất bao lâu mới phân loại ổn định
- và hệ thống có từng nói dối `ready` quá sớm hay không

### 2. Version Update Flow

Độ lệch phiên bản cần được xem là một risk slice riêng:

- ghi version của CLI lúc bắt đầu
- nếu version đầu và cuối khác nhau thì phải báo rõ
- nếu có update banner thì classify run vào update drift, kể cả khi sau đó lỗi theo kiểu khác

### 3. Session Id Capture

Có hai đường rõ ràng:

- **provided session id**
- **captured session id**

Phải kiểm chứng riêng. Với đường capture, hệ thống phải lộ rõ:

- command hay cơ chế trigger capture
- retry count
- độ trễ tới lần capture đầu tiên
- capture có cần side-effect slash flow hay không

Kết quả phải nói continuity là:

- `injected`
- `captured`
- `missing`
- `unsupported`

### 4. Ready Detection And State Truth

Không chỉ đúng, mà còn phải đúng đủ nhanh để dùng được.

Slice này vì vậy cần cả correctness lẫn latency:

- first observed stable state
- time from launch to stable state
- number of probe retries
- contradictory state flip trước khi settle

### 5. Prompt Paste And Submit Stability

Việc kiểm chứng phải đi đúng production path, không dùng một injection path quá "sạch" rồi né mất rủi ro thật.

Bộ fixture tối thiểu:

- plain short prompt
- multiline prompt
- prompt bắt đầu bằng `/`
- prompt chứa `$skill`
- prompt chứa `@file`
- prompt mà leading whitespace có ý nghĩa

Slice này phải phân biệt:

- text hiện ra trong pane nhưng không submit
- submit có xảy ra nhưng input bị mutate
- CLI chuyển sang mode khác
- run bắt đầu và settle bình thường

### 6. Long Run And Steering

Rủi ro chính không chỉ là việc steer message có gửi đi được hay không.

Rủi ro là hệ thống có còn giữ đúng sự thật về trạng thái `running` trước, trong, và sau steering hay không.

### 7. Human Observability

Mọi kết luận tự động đều cần một đường dẫn bằng chứng mà con người đọc được.

Mỗi lần validate real CLI phải để lại:

- summary markdown ngắn
- latest pane snapshot text
- transitions timeline
- đủ thông tin đường dẫn để người vận hành attach hoặc inspect ngay

## Recommended surface

### `runner probe`

- trả lời CLI hiện khỏe hay không
- phân loại current state
- lộ timing và retry

### `runner watch`

- cho con người đối chiếu normalized state với trạng thái thật trong pane

### `runner send`

- validate real paste-and-submit path

### `runner test`

- gói các giao diện low-level thành các bài kiểm tra tên ngắn như:
  - `launch`
  - `roundtrip`
  - `session`
  - `steer`
  - `interrupt`
  - `recover`

## Rollout thực dụng nhất

Nếu batch kế tiếp phải gọn mà vẫn chạm đúng painpoint:

1. `runner probe` với hỗ trợ workspace mode và timing metric
2. `runner watch` với pane output dễ đọc cho con người
3. `runner send` với prompt fixture cho special-character và submit-risk
4. `runner test launch`
5. `runner test roundtrip`
6. `runner test session`

## Anti-pattern

- coi luồng trust ở workspace mới là startup failure chung chung
- chôn update banner trong free-form log
- claim continuity nhưng không nói session id tới từ đâu
- báo state mà không có timing hay retry context
- validate prompt submission chỉ bằng input đã được “làm sạch”
- chỉ giữ JSON mà không có pane view dễ đọc cho con người

## Quan hệ với doc khác

- [Checklist con người](./human-checklist.md) giữ nguyên painpoint gốc
- [Capability Contract](./capability-contract.md) định nghĩa model đọc được bằng máy
- [Giao diện smoke cho CLI thật](./real-cli-smoke-surface.md) mô tả điểm kiểm chứng ở tầng cao hơn

Trang này là cầu nối giữa painpoint thô và command surface tương lai.
