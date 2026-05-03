[English](../../../../../features/dx/cli-compatibility/bootstrap-trust-and-readiness-report.md) | [Tiếng Việt](./bootstrap-trust-and-readiness-report.md)

# Báo cáo trust và readiness khi khởi động

## Trạng thái

Draft v0

## Tóm tắt

Tài liệu này định nghĩa một mẫu báo cáo có thể tái dùng cho hành vi khởi động lần đầu trên CLI thật.

Hãy dùng nó khi người vận hành cần câu trả lời cụ thể cho các câu hỏi như:

- lần launch đầu ở workspace mới có diễn ra đúng không
- trust và startup mất bao lâu
- cần bao nhiêu status probe trước khi settle
- trust của workspace có thực sự persist ở lần launch sau không
- runner có phân loại state đúng thực tế hay chỉ đúng sau một lúc lâu

Báo cáo phải dùng được cho Codex hôm nay, và dễ điều chỉnh cho Claude, Gemini, hay CLI sau này.

## Vì sao cần tài liệu này

Luồng người vận hành từng dùng để debug trust của Codex rất đáng được chuẩn hóa, vì nó chạm đúng ranh giới dễ vỡ nhất khi tích hợp CLI mới:

- first launch trên workspace thật sự mới
- trust hoặc setup prompt
- ready-state inference
- session-id capture timing
- reinvoke trên cùng workspace

Nếu không có contract báo cáo chuẩn, kết quả rất dễ trôi thành screenshot rời rạc, timing mơ hồ, hoặc "truyền miệng nội bộ" riêng của từng CLI.

## Mô hình sự thật cốt lõi

Không được gộp hai trạng thái này làm một.

### `runner ready`

CLI đã đủ tương tác để runner gửi probe hay prompt kế tiếp.

Ví dụ:

- prompt đã hiện
- ready banner đã hiện
- có thể gửi status command và chờ settle

### `workspace trusted`

CLI đã chấp nhận trust cho workspace theo cách có persist, nên nó ảnh hưởng thật tới behavior cục bộ của workspace đó.

Với Codex, bằng chứng mạnh nhất hiện tại là:

- pass 1 trên workspace mới có trust prompt
- pass 2 trên đúng cùng đường dẫn workspace thì trust prompt không quay lại

Không dùng riêng một status probe thành công để kết luận workspace đã trusted nếu semantics của CLI không bảo đảm điều đó.

## Khi nào dùng báo cáo này

- tích hợp CLI mới
- nâng phiên bản Codex, Claude, hoặc Gemini sau khi có lệch hành vi
- điều tra flake ở lần launch đầu
- kiểm tra trust logic hoặc ready-state logic còn phản ánh đúng thực tế không
- so sánh hành vi giữa các CLI bằng cùng một report shape

## Workspace mode bắt buộc

### Pass 1: `fresh-workspace`

Launch CLI đích trong một workspace path hoàn toàn mới, không có runner state cũ cho path đó.

Mục tiêu:

- quan sát trực tiếp trust/setup của lần launch đầu
- đo thời gian tới lúc probe ổn định

### Pass 2: `same-workspace-reinvoke`

Launch lại chính CLI đó trên đúng cùng workspace path sau khi pass 1 đã hoàn tất.

Mục tiêu:

- xác nhận trust hay trạng thái thiết lập lần đầu có persist thật hay không
- tách biệt `runner ready` với `workspace trusted`

## Measurement bắt buộc

### Pass 1

- thời điểm bắt đầu
- lúc trust prompt đầu tiên hiện ra
- lúc gửi trust action đầu tiên
- lúc prompt bình thường hay ready banner hiện sau trust
- lần gửi status-probe đầu tiên
- dấu hiệu nhìn thấy được đầu tiên của status-probe
- status result đầu tiên đã settle
- tổng thời gian bootstrap hoàn tất
- số lần retry status trước khi settle
- `sessionId` cuối cùng nếu CLI hỗ trợ

### Pass 2

- xác nhận đúng cùng workspace path
- trust prompt có hiện lại hay không
- lần gửi status-probe đầu tiên
- status result đầu tiên đã settle
- `sessionId` cuối cùng nếu có

### Tóm tắt phân loại

- `runnerReadyPass1`
- `workspaceTrustedPersisted`
- `statusProbeSettled`
- `statusRetryCount`
- `sameWorkspace`

## Artifact bắt buộc

Mỗi lần chạy phải để lại:

- `summary.json`
- `notes.md`
- pane snapshot ở mỗi mốc chuyển trạng thái
- final pane snapshot của pass 1
- final pane snapshot của pass 2

Yêu cầu tối thiểu:

- con người mở một file là thấy được trust có xuất hiện ở pass 1 hay không
- mở một file là thấy trust không quay lại ở pass 2
- timing phải đọc được mà không cần replay nguyên session

## Mẫu báo cáo

### Header

- tên CLI
- workspace mode đã dùng
- đường dẫn gốc của trace

### Pass 1

- workspace path
- có trust hay không
- trust timing
- ready timing
- status timing
- settle timing
- retry count
- stored session id

### Pass 2

- workspace path
- xác nhận cùng workspace
- có trust hay không
- status timing
- settle timing
- stored session id

### Kết luận

- runner đã trở nên ready đúng chưa
- workspace trust có persist không
- kết quả đã đủ ổn để tin cậy vận hành chưa
- artifact nào chứng minh kết luận đó

## Ghi chú theo từng CLI

### Codex

- pass 1 ở workspace mới có thể hiện trust
- pass 2 trên đúng workspace đó không nên hiện lại trust nếu trust thật sự đã áp dụng
- `/status` là probe cho `runner ready`, không phải bằng chứng duy nhất của workspace trust

### Claude

Claude có thể có trust prompt khác, đồng thời có thêm planning hay approval behavior. Báo cáo vẫn cần giữ cùng cấu trúc hai pass.

### Gemini

Gemini có thể trộn trust, auth, và ready-banner delay. Báo cáo cần giữ riêng trust/setup timing với ready-pattern timing.

### CLI tương lai

Nếu CLI không có status command, hãy thay bằng readiness probe nhỏ nhất nhưng vẫn phản ánh đúng thực tế, đồng thời giữ nguyên vocabulary và cấu trúc của báo cáo.

## Câu nhờ trợ lý gợi ý

```text
Run a bootstrap trust and readiness report for <cli> on a fresh workspace, then reinvoke on the same workspace. Measure trust timing, first ready timing, first status-probe timing, settle timing, retry count, and whether trust persisted across reinvoke. Save raw artifacts and summarize the result with exact times.
```

## Quan hệ với DX doc khác

Đơn vị kiểm chứng này được dựng từ các risk slice trong:

- [Bản đồ kiểm chứng cho người vận hành](./operator-validation-map.md)

Nó cần luôn bám theo:

- [Checklist con người](./human-checklist.md)
- [Giao diện smoke cho CLI thật](./real-cli-smoke-surface.md)
- [Contract capability](./capability-contract.md)
