[English](../../../../../features/non-functionals/runtime-benchmarks/README.md) | [Tiếng Việt](./README.md)

# Runtime Benchmarks

## Mục đích

Dùng folder này cho luồng so sánh performance và stability giữa các implementation dùng Bun, Go, và Rust.

## Vì sao tồn tại

Mục tiêu của dự án coi ngôn ngữ implementation như một thí nghiệm có thật.

Việc so sánh đó phải được neo bằng shared scenario và test definition, không phải cảm giác mơ hồ.

## Phạm vi

- benchmark workload
- soak-test workload
- metric definition
- acceptance threshold cho comparative run

## Workflow

- theo dõi area state trong [docs/features/feature-tables.md](../../feature-tables.md)
- theo dõi executable work trong `docs/tasks/features/runtime-benchmarks`
- giữ ground-truth scenario trong `docs/tests/features/runtime-benchmarks`
