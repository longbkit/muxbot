[English](../../../features/README.md) | [Tiếng Việt](./README.md) | [简体中文](../../zh-CN/features/README.md) | [한국어](../../ko/features/README.md)

# Tài liệu tính năng

## Mục đích

`docs/features/` là nhóm tài liệu để trả lời:

- hiện có những vùng tính năng nào
- trạng thái từng vùng đang ra sao
- tài liệu chính của từng nhóm tính năng nằm ở đâu
- thư mục task nào đang làm phần triển khai

Hiện tiếng Việt đã có mirror đầy đủ cho toàn bộ các doc con đang tồn tại dưới `docs/features/`.

## Cửa vào quan trọng nhất

- [Bảng trạng thái tính năng](./feature-tables.md): index chuẩn của feature state

## Nhóm feature chính

- [Agents](./agents/README.md)
- [Phân quyền](./auth/README.md)
- [Bề mặt chat và kênh giao tiếp](./channels/README.md)
- [Cấu hình](./configuration/README.md)
- [Điều khiển và vận hành](./control/README.md)
- [DX](./dx/README.md)
- [Runners](./runners/README.md)
- [Phi chức năng](./non-functionals/README.md)

## Cách đọc hợp lý

1. Mở `feature-tables.md`
2. Chọn đúng vùng feature
3. Đọc trang vào chính của vùng đó
4. Chỉ khi cần chi tiết triển khai mới đi tiếp sang `docs/tasks/` hoặc `docs/tests/`

## Nguyên tắc

- `docs/features/` giữ phần mô tả tính năng và lý do tồn tại
- `docs/tasks/` giữ execution detail
- mỗi vùng tính năng nên có một trang vào chính rõ ràng
- link sang task docs thay vì copy backlog vào đây
