[English](../../../../features/agents/attachments.md) | [Tiếng Việt](./attachments.md)

# Attachment trong workspace của agent

## Tóm tắt

Tầng agents sở hữu cách đặt inbound attachment vào bên trong workspace của agent.

Contract hiện tại:

- channels phát hiện inbound file từ Slack hoặc Telegram
- channels tải các file đó về
- tầng agents quyết định chúng sống ở đâu trong workspace
- runners chỉ nhận local file path thông qua prompt text

## Trạng thái

Active

## Vì sao tồn tại

`clisbot` mạnh nhất khi Codex hoặc Claude có thể làm việc với file local bình thường.

Điều đó nghĩa là file từ channel phải trở thành file local trong workspace, thay vì mãi là object từ Slack hay Telegram.

## Quy tắc ownership

Tầng agents sở hữu:

- attachment directory nằm trong workspace
- cách đặt attachment theo từng session
- hình dạng path của attachment bên trong workspace

Channels sở hữu:

- phát hiện file theo từng provider
- auth tải file theo từng provider
- download file theo từng provider

Runners không được biết file đến từ Slack hay Telegram.

## Contract hiện tại

Inbound file được lưu dưới:

- `{workspacePath}/.attachments/{sessionKey}/{messageId}/...`

Prompt contract hiện tại được giữ tối giản có chủ đích:

- prepend một token `@/absolute/path` cho mỗi file đã lưu
- sau đó nối thêm user message text

Ví dụ:

```text
@/Users/example/.clisbot/workspace/default/.attachments/agent-default-main/1771/spec.md Please review this file
```

Không cần thêm metadata block nào khác trong lát cắt MVP hiện tại.

## Ràng buộc thiết kế

- file phải nằm bên trong workspace của agent
- file không được ghi thẳng ra workspace root
- storage mặc định phải nằm ẩn dưới `.attachments`
- một conversation không được overwrite file của conversation khác
- contract phải giữ được tính channel-agnostic đối với runners

## Không nằm trong phạm vi

- gửi file ra ngoài
- OCR hoặc document extraction
- media-group assembly
- attachment indexing dùng database
- object-storage offload

## Task docs liên quan

- [2026-04-06-agent-workspace-attachments.md](../../../../tasks/features/agents/2026-04-06-agent-workspace-attachments.md)

## Phụ thuộc liên quan

- [Channels](../channels/README.md)
- [Runners](../runners/README.md)
