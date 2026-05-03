[English](../../../../../features/non-functionals/security/README.md) | [Tiếng Việt](./README.md)

# Security

## Tóm tắt

Security là vùng non-functional cắt ngang trong `clisbot`.

Nó sở hữu các quy tắc ở mức sản phẩm để quyết định:

- ai được chạm vào bot
- inbound traffic nào được tin
- traffic mơ hồ hoặc có dấu hiệu lạm dụng bị kìm lại ra sao
- các control path hoặc execution path rủi ro được lộ ra cho operator như thế nào

## Trạng thái

Planned

## Vì sao tồn tại

`clisbot` chạy trên shared ngữ cảnh chat, thực thi AI runner, và có thể trigger recurring work.

Vì vậy security không chỉ là secret storage hoặc auth policy.

Nó còn bao gồm:

- ai được trigger work trong shared group
- bot-authored traffic có bao giờ được cho quay lại hay không
- pairing, allowlist, và role check giảm lạm dụng ra sao
- spam, replay, hoặc feedback-loop pattern được phát hiện và khống chế thế nào
- operator biết một route đang unsafe trước khi nó flood cả channel ra sao

## Phạm vi

- inbound trust boundary cho Slack và Telegram route
- pairing và allowlist posture như một phần của abuse resistance
- bot-origin policy cho ngữ cảnh chat dùng chung
- anti-abuse control như cooldown, rate limit, quarantine, và warning hiện ra cho operator
- hardening control surface cho các mutation nguy hiểm
- security audit và regression tracking

## Không nằm trong phạm vi

- generic infrastructure hardening bên ngoài repo này
- architecture conformance work vốn thuộc area khác
- performance hoặc latency work vốn thuộc stability hay benchmark

## Task folder liên quan

- [docs/tasks/features/security](../../../../../tasks/features/security)

## Research liên quan

- [OpenClaw Telegram Credential Security And Setup](../../../../../research/security/2026-04-12-openclaw-telegram-credential-security-and-setup.md)

## Phụ thuộc

- [Auth](../../auth/README.md)
- [Channels](../../channels/README.md)
- [Control](../../control/README.md)
- [Configuration](../../configuration/README.md)
- [Stability](../stability/README.md)

## Trọng tâm hiện tại

Định nghĩa một security model truthful cho shared ngữ cảnh chat:

- giữ default group behavior theo hướng human-first
- làm bot-origin handling thành thứ explicit thay vì tình cờ
- chặn abuse và feedback loop biến thành channel spam
- cho operator control đơn giản để inspect, contain, và recover những route rủi ro
