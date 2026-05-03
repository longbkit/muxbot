[English](../../../migrations/index.md) | [Tiếng Việt](./index.md)

# Chỉ mục migration

Hãy đọc file này đầu tiên khi update package. Nó chỉ tồn tại để trả lời một câu hỏi: có cần migration thủ công hay không.

```text
Path: mọi version trước 0.1.50 -> 0.1.50
Update path: trực tiếp
Manual action: không có
Risk: thấp
Automatic config update: có
Breaking change: không
Migration runbook: không có
Read next: ../updates/update-guide.md
Release note: ../releases/v0.1.50.md
```

Phạm vi này bao gồm config đã phát hành ở `0.1.43`, các config legacy cũ hơn `0.1.43`, và cả config pre-release nội bộ `0.1.44`.

Quy tắc: nếu `Manual action: none` thì không cần đọc, cũng không được tự bịa thêm migration runbook.
