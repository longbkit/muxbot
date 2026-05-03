[English](../../../../README.md) | [Tiếng Việt](./status.md) | [简体中文](../../zh-CN/_translations/status.md) | [한국어](../../ko/_translations/status.md)

# Trạng thái tài liệu tiếng Việt

- Phiên bản nền: `v0.1.45`
- Cập nhật lần cuối: `2026-05-03 UTC`
- Mục tiêu hiện tại: giữ mirror tree đúng theo source, giữ internal link tiếng Việt nhất quán khi có counterpart, và tiếp tục siết native wording để giảm tối đa English leakage không cần thiết.

## Trạng thái theo nhóm

| Nhóm | Coverage | Trạng thái |
| --- | --- | --- |
| README gốc của repo | `1/1` | `docs/langs/root/README.vi.md` đã bám đủ cấu trúc `README.md` gốc |
| Overview | `5/5` | Đã dịch đủ `README.md` và 4 file con trong `docs/overview/` |
| User Guide | `14/14` | Đã dịch đủ trang vào và toàn bộ 13 doc con trong `docs/user-guide/` |
| Features | `45/45` | Đã dịch đủ toàn bộ `docs/features/`, gồm root index, feature table, và các doc con của `channels`, `configuration`, `dx`, `agents`, `auth`, `control`, `runners`, và `non-functionals` |
| Architecture | `16/16` | Đã dịch đủ toàn bộ `docs/architecture/`, gồm root index, nhánh `v0.2/`, và các decision doc hiện có |
| Updates | `5/5` | Đã dịch đủ trang vào, update guide, release guide, và các template |
| Releases | `7/7` | Đã dịch đủ trang vào, các release note hiện có, `upcoming`, và template |
| Migrations | `3/3` | Đã dịch đủ trang vào và các doc con trong `docs/migrations/` |
| Glossary | `1/1` | Có bảng thuật ngữ chuẩn và đã mở rộng thêm nhóm từ cho compatibility, readiness, drift, artifact, fallback, machine-readable, human-readable, và risk slice |
| Status | `1/1` | File này là nguồn truth cho coverage hiện tại |

## Phạm vi quản lý

- `docs/langs/root/README.vi.md` là bản mirror tiếng Việt của `README.md` ở root repo.
- `docs/langs/vi/_translations/glossary.md` là nguồn thuật ngữ chuẩn cho doc tiếng Việt.
- File này là nguồn truth cho coverage, thứ tự ưu tiên dịch, trạng thái review, và mức độ còn phải rơi về tiếng Bạn của doc tiếng Việt.

## Việc còn lại theo thứ tự

1. Rà tiếp native wording cho các doc con sâu hơn trong `architecture/` và các doc leaf còn lại dưới `features/` khi có reviewer feedback mới
2. Giữ glossary đồng bộ nếu một thuật ngữ lặp lại bị đổi cách dùng ở nhiều trang
3. Tiếp tục dịch và đồng bộ các ngôn ngữ còn lại theo đúng mirror-tree contract
