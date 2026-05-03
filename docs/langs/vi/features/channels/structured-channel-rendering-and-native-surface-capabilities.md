[English](../../../../features/channels/structured-channel-rendering-and-native-surface-capabilities.md) | [Tiếng Việt](./structured-channel-rendering-and-native-surface-capabilities.md)

# Render có cấu trúc theo channel và các năng lực ngữ cảnh chat gốc

## Tóm tắt

Tính năng này cho `clisbot` một lớp output bám sát ngữ cảnh chat gốc của Slack và Telegram.

Mục tiêu không chỉ là một text template có thể cấu hình.

Mục tiêu là kiểm soát việc một reply được render ra sao, update thế nào, reply vào đâu, và có thể tương tác trên từng ngữ cảnh chat như thế nào.

## Vì sao tồn tại

`clisbot` đã có:

- channel routing
- bot-aware routing
- prompt template
- agent reply wrapper

Nhưng nó vẫn thiếu một model rõ ràng cho structured output ở ngữ cảnh chat gốc.

Nếu không có lớp này:

- Slack thiếu Block Kit và interaction pattern phong phú hơn
- Telegram thiếu HTML formatting an toàn và UX native cho command hay button
- streaming ồn hơn mức cần thiết
- fallback behavior trở thành chắp vá, khó review

## Phạm vi

- intent model dùng chung cho việc render channel của Slack và Telegram
- renderer do channel sở hữu cho structured output
- draft preview bằng cách edit một in-flight reply duy nhất khi channel hỗ trợ
- reply-target rule truthful theo từng channel
- action surface gốc như button, menu, và phản hồi trạng thái gọn
- degraded path hoặc fallback behavior phải tường minh khi capability không có
- status và debug output phải nói thật render path nào đang thắng

## Không nằm trong phạm vi

- một block schema chung cho mọi channel
- thay thế prompt-template configuration
- chuyển transport ownership của provider ra khỏi `channels`
- làm hết mọi interaction nâng cao của Slack và Telegram ngay ở pass đầu

## Hình dạng cốt lõi

### Intent dùng chung, render riêng theo channel

Lớp dùng chung nên quyết định:

- reply là plain text hay structured
- preview edit có cho phép không
- reply nên target message hiện tại hay thread
- affordance tương tác nào được bật

Còn lớp channel quyết định intent đó biến thành output thực như thế nào.

### Fallback là hành vi hạng nhất

Ví dụ:

- Slack structured reply vẫn cần fallback text
- Telegram formatted reply vẫn cần retry về plain text
- preview edit flow cần append-only fallback truthful

### Status thuộc về chính feature

Người vận hành phải nhìn được:

- renderer nào đang thắng
- preview edit có đang bật không
- reply dùng structured output hay fallback
- reply-target mode hiện tại là gì

## Kỳ vọng theo channel

### Slack

`clisbot` nên hỗ trợ:

- Block Kit reply có fallback text
- single-message preview streaming bằng edit
- command, menu, và action ở ngữ cảnh chat phong phú hơn khi Slack hỗ trợ
- processing feedback kiểu Slack như ack reaction hoặc thread status

### Telegram

`clisbot` nên hỗ trợ:

- Telegram-safe HTML formatting
- plain-text fallback khi parse fail
- single-message preview streaming bằng edit
- inline keyboard
- đăng ký menu lệnh gốc
- reply-target behavior explicit cho message reply và topic

## Phụ thuộc

- [Bề mặt chat và kênh giao tiếp](./README.md)
- [Thao tác tin nhắn và định tuyến bot](./message-actions-and-channel-accounts.md)
- [Wrapper phản hồi tiến độ của agent và prompt đi kèm](./agent-progress-reply-wrapper-and-prompt.md)
- [Prompt template](./prompt-templates.md)

## Research liên quan

- [OpenClaw Structured Channel Rendering Techniques For Slack And Telegram](../../../../research/channels/2026-04-14-openclaw-structured-channel-rendering-techniques.md)

## Task liên quan

- [Render có cấu trúc theo channel và các năng lực ngữ cảnh chat gốc](../../../../tasks/features/channels/2026-04-14-structured-channel-rendering-and-native-surface-capabilities.md)
