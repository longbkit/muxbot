[English](../../../../features/agents/README.md) | [Tiếng Việt](./README.md)

# Agents

## Tóm tắt

Tầng agents là tầng vận hành backend-agnostic của `clisbot`.

Nó sở hữu mental model bền của agent và session state của agent đó.

## Trạng thái

Active

## Vì sao tồn tại

`clisbot` không chỉ là transport wrapper gắn lên tmux.

Nó cần một hệ ổn định cho:

- agents
- sessions
- workspaces
- queueing
- memory
- tools
- skills
- subagents
- session-scoped runtime policy

Operating model đó vẫn phải còn hợp lý ngay cả khi tmux bị thay thế hoặc được bổ sung bằng runner khác.

## Phạm vi

- agent identity và ownership
- session lifecycle
- agent-scoped command dispatch
- session-scoped runtime policy và override
- workspace ownership
- queueing và quy tắc concurrency
- memory và context ownership
- model cho tools, skills, và subagents
- lifecycle và health state

## Không nằm trong phạm vi

- mechanics riêng của tmux
- rendering riêng theo channel
- UX control cho operator

## Task folder liên quan

- [docs/tasks/features/agents](../../../../tasks/features/agents)

## Test docs liên quan

- [docs/tests/features/agents](../../../../tests/features/agents/README.md)
- [Agent Commands](./commands.md)
- [Session Identity](./sessions.md)
- [Agent Workspace Attachments](./attachments.md)

## Phụ thuộc

- [Runners](../runners/README.md)
- [Cấu hình](../configuration/README.md)

## Trọng tâm hiện tại

Làm cho mô hình `agentId` cộng `sessionKey` hiện tại trở nên thật ổn định, nhưng vẫn chừa không gian truthful cho memory, tools, skills, subagents, và khả năng tự quản phong phú hơn của agent về sau.

Các hướng tăng trưởng quan trọng tiếp theo là:

- session-scoped runtime policy:
  - follow-up continuation behavior theo từng conversation
  - quiet mode tạm thời hoặc mention-only mode theo từng thread
  - runtime control APIs mà chính agent có thể gọi khi người dùng yêu cầu
  - stale runner cleanup để lấy lại tài nguyên tmux mà không reset logical conversation identity
- agent self-knowledge và context bootstrap:
  - hiểu đúng identity, capability, và limit dựa trên docs, source, và current environment
- queueing:
  - giữ `StoredSessionEntry.queues` làm canonical queue inventory trong khi runtime rút các item đó theo đúng ordering và active-run guard của `/queue`
- agent runtime introspection:
  - đọc loop, queue, và active-run state qua các control surface tiêu chuẩn trước khi mở thêm bridge rộng hơn cho agent
- giao diện work-management của agent:
  - chuẩn hóa task/work-item operation ngay bây giờ, rồi chỉ tách feature area riêng nếu backend adapter đủ lớn để biện minh
