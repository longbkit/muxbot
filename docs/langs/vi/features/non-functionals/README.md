[English](../../../../features/non-functionals/README.md) | [Tiếng Việt](./README.md)

# Các thư mục non-functional

## Mục đích

Dùng `docs/features/non-functionals/` cho các vùng chất lượng cắt ngang qua nhiều feature sản phẩm.

Đây là chỗ đúng cho:

- performance
- security
- accessibility
- reliability
- tracing
- monitoring
- product analytics
- architecture conformance

## Vì sao tồn tại

Các chủ đề này rất quan trọng, nhưng không nên bị chôn trong một feature folder cụ thể khi ảnh hưởng của chúng bao trùm cả repository.

Giữ chúng ở đây sẽ làm ownership và điều hướng rõ hơn.

## Quy tắc thư mục

- dùng stable area name
- giữ tree nông
- chỉ tạo folder khi area đó có đủ material để biện minh

## Quy tắc workflow

- theo dõi area state trong [docs/features/feature-tables.md](../feature-tables.md)
- theo dõi implementation work trong `docs/tasks/`
- giữ folder này tập trung vào overview, scope, và hướng dẫn cross-cutting
