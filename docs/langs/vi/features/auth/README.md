[English](../../../../features/auth/README.md) | [Tiếng Việt](./README.md)

# Authorization

## Tóm tắt

Authorization quyết định ai được làm gì trong `clisbot`.

Hiện tại ranh giới là:

- admission của ngữ cảnh chat và surface audience policy được lưu trong config
- app permission và agent permission được resolve bởi auth

## Trạng thái

Active

## Contract hiện tại

### Quy tắc ở mức surface

- `disabled` nghĩa là tắt hoàn toàn và im lặng, kể cả với app `owner` và app `admin`
- trên ngữ cảnh chat dùng chung đã được bật, app `owner` và app `admin` có thể bypass allowlist check
- `blockUsers` vẫn thắng
- shared allowlist failure bị deny trước khi vào runner

Deny text hiện tại cho ngữ cảnh chat dùng chung:

`You are not allowed to use this bot in this group. Ask a bot owner or admin to add you to \`allowUsers\` for this surface.`

### DM và shared defaults

- DM defaults nằm ở `directMessages["*"]`
- shared defaults nằm ở `groups["*"]`
- CLI ids vẫn giữ dạng dễ đọc cho người:
  - `dm:*`
  - `group:*`
  - `group:<id>`
  - `topic:<chatId>:<topicId>`

### App roles

- app `owner` và app `admin` bypass DM pairing
- app `owner` và app `admin` không bypass `groupPolicy` / `channelPolicy` admission; sau khi group được admit và enable, họ mới bypass sender allowlist
- họ không bypass `disabled`
- họ không bypass `blockUsers`

## Implementation invariants

- owner/admin sender-policy bypass chỉ có hiệu lực sau khi surface đã được admit và enable
- `disabled` mạnh hơn convenience dành cho owner/admin
- `blockUsers` mạnh hơn allowlist bypass
- shared allowlist rejection phải diễn ra trước runner ingress
- shared deny text giữ cách gọi generic theo mental model nhiều-người, nên vẫn dùng từ `group`

## Trọng tâm hiện tại

Lát cắt auth đã được ship hiện nay gồm:

- app roles và agent roles
- first-owner claim
- DM pairing bypass cho owner/admin
- ngữ cảnh chat dùng chung audience gating cho Slack và Telegram
- hành vi deny-before-runner rõ ràng cho shared allowlist failure

Lát cắt auth tiếp theo là:

- command-level permission enforcement cho các action nhạy cảm trên các surface đã được admit

## Tài liệu liên quan

- [Quyền truy cập và vai trò](../../user-guide/auth-and-roles.md)
- [Cấu hình](../configuration/README.md)
- [Audience-Scoped Access And Delegated Specialist Bots](../../../../tasks/features/auth/2026-04-21-audience-scoped-access-and-delegated-specialist-bots.md)
