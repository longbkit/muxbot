[English](../../../../../features/non-functionals/stability/README.md) | [Tiếng Việt](./README.md)

# Stability

## Tóm tắt

Stability là vùng non-functional cốt lõi trong `clisbot`.

Nó sở hữu công việc cắt ngang giúp routed conversation, session, runner, và operator-visible state vẫn truthful dưới tải thật và failure thật.

## Trạng thái

Active

## Vì sao tồn tại

Sản phẩm này còn ở pha sớm và stability là yêu cầu cốt lõi, không phải lớp polish để làm sau.

Công việc về stability không nên bị chôn trong một feature đơn lẻ như channels hay runners khi rủi ro thật cắt ngang qua nhiều layer.

Ví dụ:

- trùng event ở channel
- queue correctness dưới concurrent message
- session drift giữa ngữ cảnh chat và tmux pane
- settlement bị chậm hoặc kẹt
- restart và resume thiếu truthfulness
- live state vênh nhau giữa control, channel, và runner

## Phạm vi

- cross-cutting runtime stability invariant
- failure-mode handling và recovery rule
- phát hiện drift giữa routed conversation state và execution state
- queue và follow-up truthfulness dưới concurrency
- startup, restart, và resume stability
- operator-visible signal khi runtime state trở nên unsafe hoặc mơ hồ
- stability audit và regression tracking

## Không nằm trong phạm vi

- product behavior chỉ thuộc về một surface cụ thể
- performance benchmarking như một discipline so sánh riêng
- architecture governance rộng vốn thuộc architecture conformance

## Task folder liên quan

- [docs/tasks/features/stability](../../../../../tasks/features/stability)

## Research liên quan

- [Slack Latency And Stability Audit](../../../../../research/channels/2026-04-10-slack-latency-and-stability-audit.md)

## Phụ thuộc

- [Channels](../../channels/README.md)
- [Agents](../../agents/README.md)
- [Runners](../../runners/README.md)
- [Control](../../control/README.md)
- [Configuration](../../configuration/README.md)

## Trọng tâm hiện tại

Biến delay và stability thành metric explicit của sản phẩm, rồi kéo backlog và validation tập trung vào các khoảng hở nguy hiểm nhất về runtime truthfulness trước.

Các theme ưu tiên hiện tại:

- giảm end-to-end delay từ channel sang runner
- giữ busy/idle state truthful giữa channel layer và runner layer
- ngăn silent session drift khi tmux state bị thay đổi ngoài routed path của clisbot
- giữ follow-up, queue, và final-settlement deterministic dưới concurrent human message
- giữ channel delivery failure trong phạm vi có thể contain và recover để outage của Slack hoặc Telegram có thể tự lành khi còn cơ hội, và chỉ degrade đúng observer hoặc surface bị ảnh hưởng khi recovery đã cạn

## Quy tắc resilience

Trong vùng feature này, mục tiêu thật là resilience.

- `fail soft` tự nó không phải success condition
- graceful degradation chỉ chấp nhận được như một trạng thái trung gian có giới hạn hoặc một final truthful fallback sau khi recovery đã được thử
- thứ tự ưu tiên là:
  1. phát hiện lỗi
  2. tự recovery khi state vẫn còn đáng tin
  3. chỉ quarantine hoặc degrade đúng run, observer, session, hoặc surface bị ảnh hưởng
  4. chỉ surface explicit failure khi bounded recovery đã cạn
