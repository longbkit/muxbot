[English](../../../../features/dx/README.md) | [Tiếng Việt](./README.md)

# DX

## Tóm tắt

DX là nhóm tài liệu về trải nghiệm của người phát triển và người vận hành, tập trung vào các giao diện điều khiển đọc được bằng máy, contract tương thích, và luồng kiểm chứng để `clisbot` vẫn dễ vận hành dù các CLI phía upstream thay đổi liên tục.

## Trạng thái

Planned

## Vì sao tồn tại

Có những sự thật quan trọng của sản phẩm không nằm ở trải nghiệm chat cho người dùng cuối:

- một CLI thực sự hỗ trợ được những gì
- người vận hành và automation kiểm tra điều đó bằng cách nào
- contract đọc được bằng máy nào đủ an toàn để làm nền
- độ lệch tương thích được phát hiện ra sao trước khi thành lỗi production

Những mối quan tâm này không nên bị rải rác khắp `agents`, `runners`, `stability`, và các ghi chú lẻ.

## Phạm vi

- giao diện điều khiển đọc được bằng máy cho người vận hành và người phát triển
- contract tương thích cho các CLI tương tác ở phía upstream
- chuẩn hóa capability và tài liệu hồ sơ cho từng CLI
- thiết kế bộ regression cho CLI giả lập
- chiến lược canary cho CLI thật và quy ước artifact
- ma trận capability và tài liệu phân loại lệch hành vi

## Không nằm trong phạm vi

- trải nghiệm channel dành cho người dùng cuối
- semantics sản phẩm của agent
- ownership chi tiết của implementation runner
- theo dõi incident ở tầng cắt ngang

## Task folder liên quan

- [docs/tasks/features/dx](../../../../tasks/features/dx)

## Feature docs liên quan

- [Tương thích CLI](./cli-compatibility/README.md)
- [Checklist con người cho tương thích CLI thật](./cli-compatibility/human-checklist.md)
- [Bản đồ kiểm chứng cho người vận hành với CLI thật](./cli-compatibility/operator-validation-map.md)
- [Báo cáo trust và readiness khi khởi động](./cli-compatibility/bootstrap-trust-and-readiness-report.md)

## Phụ thuộc

- [Agents](../agents/README.md)
- [Runners](../runners/README.md)
- [Control](../control/README.md)
- [Stability](../non-functionals/stability/README.md)

## Trọng tâm hiện tại

Contract DX v0 đã được tài liệu hóa.

Batch triển khai tiếp theo nên:

- map các giao diện `runner ... --json` sang contract tương thích đã công bố
- đưa ra giao diện smoke đầu tiên cho CLI thật trên Codex, Claude, và Gemini
- giữ bộ regression CLI giả lập bám cùng một vocabulary capability, không tạo ra mô hình thứ hai
