[English](../../../../../features/dx/cli-compatibility/README.md) | [Tiếng Việt](./README.md)

# Tương thích CLI

## Tóm tắt

Tài liệu này định nghĩa contract capability đã được chuẩn hóa giữa `clisbot` và các CLI tương tác phía upstream như Codex, Claude, và Gemini.

## Trạng thái

Planned

## Vì sao tồn tại

Hiện repo vẫn chứng minh tính tương thích chủ yếu qua implementation của runner và các ghi chú rời cho từng CLI.

Cách đó không đủ bền vì CLI phía upstream thay đổi liên tục:

- startup banner đổi
- ready-state prompt đổi
- session-id capture timing đổi
- running indicator đổi
- interrupt semantics đổi

Hệ thống cần một "cửa chính" để nói rõ `clisbot` kỳ vọng gì ở CLI, đồng thời làm rõ kỳ vọng đó được lộ ra cho người vận hành và automation bằng cách nào.

## Phạm vi

- định nghĩa capability đã chuẩn hóa
- contract input và output cho các thao tác kiểm tra tương thích
- shared state vocabulary như `ready`, `running`, `waiting_input`, `blocked`, `lost`
- hồ sơ capability theo từng CLI
- chiến lược harness tương thích cho cả CLI giả lập lẫn CLI thật

## Quy tắc đặt tên

Trong vùng feature này, dùng nhất quán:

- `CLI`: công cụ tương tác phía upstream như Codex, Claude, Gemini
- `CLI profile`: bản tóm tắt capability và lệch hành vi của từng CLI
- `workspace mode`: chế độ môi trường để tái hiện hoặc kiểm chứng hành vi, như `current` hay `fresh-copy`
- `risk slice`: một lát rủi ro hay ranh giới dễ vỡ cụ thể cần được tái hiện và đo trực tiếp
- `test`: đơn vị kiểm chứng hướng tới người vận hành, dựng trên các giao diện `probe`, `watch`, `send` ở tầng thấp hơn
- `suite`: một nhóm test
- `session id`: cách viết trong phần diễn giải
- `sessionId`: dạng field trong schema JSON

Ngoại lệ hiện tại:

- một số tài liệu sớm vẫn dùng `runner smoke`, `smoke command`, hay `scenario`
- nếu batch sau đổi tên giao diện, ưu tiên `runner test` và xem cách gọi `smoke` là lớp chuyển tiếp

## Không nằm trong phạm vi

- quy tắc render của channel
- chi tiết triển khai thuần tmux
- semantics bộ nhớ hay hội thoại của agent
- các ghi chú kiểm chứng dùng một lần nên nằm trong task doc

## Tài liệu liên quan

- [DX](../README.md)
- [Checklist con người](./human-checklist.md)
- [Bản đồ kiểm chứng cho người vận hành](./operator-validation-map.md)
- [Báo cáo trust và readiness khi khởi động](./bootstrap-trust-and-readiness-report.md)
- [Contract capability](./capability-contract.md)
- [Hồ sơ CLI](./backend-profiles.md)
- [Giao diện smoke cho CLI thật](./real-cli-smoke-surface.md)
- [Smoke Command Contract](./smoke-command-contract.md)
- [Runners](../../runners/README.md)
- [Agents Sessions](../../agents/sessions.md)

## Trọng tâm hiện tại

Contract v0 và hồ sơ cho bộ ba CLI đầu tiên đã có.

Checklist đầu vào cho con người cũng đã được tách riêng để giữ painpoint của người vận hành luôn rõ ràng, kể cả khi contract đọc được bằng máy đang được chuẩn hóa dần.

Bản đồ kiểm chứng đã biến các painpoint đó thành các lát rủi ro có workspace mode, metric, artifact, và giao diện dành cho người vận hành rõ ràng.

Báo cáo trust và readiness lúc khởi động chuẩn hóa một đơn vị kiểm chứng rất quan trọng cho hành vi lần chạy đầu, đồng thời tạo bằng chứng rằng cùng một workspace có thể được gọi lại ổn định trên Codex, Claude, Gemini, và các CLI sau này.

Batch tiếp theo nên dùng chính contract đã công bố này để điều khiển:

- `runner probe --json`
- `runner send --json`
- `runner attach --json`
- `runner smoke`

và không để các giao diện đó trôi ngược về các heuristic riêng theo pane của từng CLI.
