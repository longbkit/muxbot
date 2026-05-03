[English](../../../../features/control/README.md) | [Tiếng Việt](./README.md)

# Control

## Tóm tắt

Control là hệ hướng tới operator để inspect và can thiệp vào `clisbot`.

## Trạng thái

In Progress

## Vì sao tồn tại

Những người vận hành hệ thống cần các control surface hạng nhất, tách biệt khỏi end-user channels.

Việc attach vào tmux, kiểm tra health, restart session, hay clear broken state không nên được mô hình hóa như chat UX.

Các thay đổi follow-up behavior có phạm vi theo session do end user yêu cầu không thuộc về đây.

Chúng thuộc về agents runtime policy, vì đó là một phần của conversation contract chứ không phải operator intervention.

Permission semantics cũng không thuộc về đây.

Chúng thuộc về auth, vì control là một surface tiêu thụ quyết định auth, không phải owner của auth model.

## Phạm vi

- inspect flows
- attach flows
- restart và stop flows
- authorized chat-channel recovery ingress cho cùng một semantics điều khiển
- health và debug views
- inspect và cancel persisted managed loops
- inspect, create, và clear durable queued prompts
- operator-safe intervention points
- config reload watch behavior

## Không nằm trong phạm vi

- end-user message rendering
- runner detail riêng của từng CLI
- channel routing
- sở hữu auth model

## Task folder liên quan

- [docs/tasks/features/control](../../../../tasks/features/control)

## Feature docs liên quan

- [loops-cli.md](./loops-cli.md)
- [queues-cli.md](./queues-cli.md)
- [runner-debug-cli.md](./runner-debug-cli.md)

## Test docs liên quan

- [docs/tests/features/control](../../../../tests/features/control/README.md)

## Phụ thuộc

- [Auth](../auth/README.md)
- [Agents](../agents/README.md)
- [Runners](../runners/README.md)

## Trọng tâm hiện tại

Đường inspect tmux giờ đã có runner debug CLI hạng nhất cho list, inspect, và watch.

Control follow-on work hiện tại vẫn còn rộng hơn lát cắt đã ship:

- intervention action phong phú hơn
- recovery command từ chat-channel cho runner restart hoặc reset ở current session
- health và recovery flow rõ ràng hơn
- config reload watch behavior

Config thuộc control hiện tại:

- `control.configReload.watch`
- `control.configReload.watchDebounceMs`
