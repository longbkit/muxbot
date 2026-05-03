[English](../../../migrations/README.md) | [Tiếng Việt](./README.md) | [简体中文](../../zh-CN/migrations/README.md) | [한국어](../../ko/migrations/README.md)

# Migration thủ công

## Mục đích

`docs/migrations/` chỉ dùng khi update cần thao tác thủ công từ người vận hành.

Hiện tiếng Việt mới dịch trang vào này. Các doc con dưới `docs/migrations/` vẫn đang rơi về bản gốc tiếng Bạn cho tới khi có mirror tương ứng.

Với luồng update của agent hoặc bot:

- đọc [index.md](../../../migrations/index.md) trước
- nếu không có thao tác thủ công thì không cần tài liệu migration riêng

## Cấu trúc

- [index.md](../../../migrations/index.md): file quyết định ngắn, dễ cho agent đọc
- `vA.B.C-to-vX.Y.Z.md`: runbook khi buộc phải làm thủ công
- [templates/migration.md](../../../migrations/templates/migration.md): template chuẩn

## Khi nào cần viết tài liệu migration

Chỉ tạo migration note khi một trong các điểm sau không còn an toàn hoặc không còn tự động:

- manual action
- update path
- breaking change
- rollback
- intermediate version

## Trạng thái hiện tại

Hiện chưa có stable update path nào buộc phải đọc migration runbook thủ công.
