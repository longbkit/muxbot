[English](../../../../features/channels/README.md) | [Tiếng Việt](./README.md)

# Ngữ cảnh chat và kênh giao tiếp

## Tóm tắt

Đây là nhóm tài liệu về các ngữ cảnh chat giao tiếp trực tiếp với người dùng của `clisbot`.

Nó sở hữu mọi ngữ cảnh chat nói chuyện với thế giới bên ngoài:

- Slack hiện tại
- Telegram hiện tại
- truy cập tương thích API như một kênh khác
- hướng mở rộng Zalo theo ba nhánh riêng:
  - `zalo-bot`
  - `zalo-oa`
  - `zalo-personal`
- Discord và các tích hợp tương tự trong tương lai

## Trạng thái

Active

## Vì sao tồn tại

Mục tiêu của dự án là đưa coding agent có thể dùng thực tế ra các ngữ cảnh chat quen thuộc, chứ không chỉ qua API trực tiếp.

Nhóm này là nơi toàn bộ các ngữ cảnh chat đó được định nghĩa và giữ ranh giới.

## Phạm vi

- nhận tin nhắn và request đầu vào
- nhận file và attachment từ các channel được hỗ trợ
- nhận diện loại hội thoại như Slack `dm`, `group`, `channel`
- nhận diện loại hội thoại có awareness về `topic` với các ngữ cảnh chat hỗ trợ sub-surface rõ ràng như Telegram forum topics
- direct-message access control như `open`, `pairing`, `allowlist`, `disabled`
- luồng trả lời pairing code cho DM bị khóa lúc onboarding
- slash command ở ranh giới channel
- phản hồi gửi ra ngoài và cập nhật tiến độ trực tiếp
- phản hồi xử lý sớm có thể nhìn thấy được, như ack reaction, trạng thái thread của Slack assistant, hay tin nhắn processing trong thread
- hành vi của thread và reply
- hành vi transport riêng của từng channel, gồm hỗ trợ edit hay đường lui append-only
- gộp các đoạn tin nhắn dài cho những channel có live reply được edit
- render mặc định theo hướng chat-first cho từng channel
- làm gọn transcript từ output runner đã chuẩn hóa, gồm bỏ phần chrome trên và dưới khi cần
- pattern lệnh tường minh để xin xem transcript toàn phiên khi người dùng thật sự cần
- điều khiển kiểu quan sát như attach, detach, interval watch cho session chạy lâu
- concurrency ở tầng nhận channel để một cuộc hội thoại dài không chặn các cuộc hội thoại khác trên cùng channel account
- cơ chế replay có giới hạn cho tin nhắn gần đây, để một mention về sau có thể kéo lại một đuôi ngắn các message đã bị bỏ qua thay vì phát lại toàn bộ lịch sử

## Không nằm trong phạm vi

- cơ chế nội bộ riêng của backend runner
- quy tắc ownership chuẩn của agent session
- các thao tác điều khiển chỉ dành cho người vận hành

## Task folder liên quan

- [docs/tasks/features/channels](../../../../tasks/features/channels)

## Test docs liên quan

- [docs/tests/features/channels](../../../../tests/features/channels/README.md)

## Research liên quan

- [Slack Thread Follow-Up Behavior](../../../../research/channels/2026-04-05-slack-thread-follow-up-behavior.md)
- [OpenClaw Telegram Topics And Slack-Parity Plan](../../../../research/channels/2026-04-05-openclaw-telegram-topics-and-parity-plan.md)
- [OpenClaw Pairing Implementation](../../../../research/channels/2026-04-06-openclaw-pairing-implementation.md)
- [OpenClaw CLI Command Surfaces And Slack Telegram Send Syntax](../../../../research/channels/2026-04-09-openclaw-cli-command-surfaces-and-slack-telegram-send-syntax.md)
- [OpenClaw Channel Standardization Vs Clisbot Gaps](../../../../research/channels/2026-04-10-openclaw-channel-standardization-vs-clisbot-gaps.md)
- [OpenClaw Structured Channel Rendering Techniques For Slack And Telegram](../../../../research/channels/2026-04-14-openclaw-structured-channel-rendering-techniques.md)
- [OpenClaw Zalo Paths And Official Zalo Bot Platform](../../../../research/channels/2026-04-18-openclaw-zalo-paths-and-official-zalo-bot-platform.md)

## Feature docs liên quan

- [Thao tác tin nhắn và định tuyến bot](./message-actions-and-channel-accounts.md)
- [Định dạng lệnh `message` và các chế độ render](./message-command-formatting-and-render-modes.md)
- [Wrapper phản hồi tiến độ của agent và prompt đi kèm](./agent-progress-reply-wrapper-and-prompt.md)
- [Streaming mode và cơ chế bàn giao bản nháp `message-tool`](./streaming-mode-and-message-tool-draft-preview-handoff.md)
- [Prompt template](./prompt-templates.md)
- [Mức hiển thị transcript và verbose level](./transcript-visibility-and-verbose-levels.md)
- [Render có cấu trúc theo channel và các năng lực ngữ cảnh chat gốc](./structured-channel-rendering-and-native-surface-capabilities.md)
- [Lệnh slash `/loop`](./loop-slash-command.md)
- [Phát lại hội thoại gần đây](./recent-conversation-replay.md)
- [Zalo Bot, Zalo OA, And Zalo Personal Channel Strategy](../../../../tasks/features/channels/2026-04-18-zalo-bot-oa-and-personal-channel-strategy.md)
- [Official Zalo Bot Platform Channel MVP](../../../../tasks/features/channels/2026-04-18-zalo-bot-platform-channel-mvp.md)

## Phụ thuộc

- [Agents](../agents/README.md)
- [Runners](../runners/README.md)
- [Cấu hình](../configuration/README.md)
- [Trình bày transcript và streaming](../../architecture/transcript-presentation-and-streaming.md)

## Trọng tâm hiện tại

Giữ Slack MVP và Telegram vận hành đúng thực tế theo đúng contract đang áp dụng:

- ngữ cảnh chat một người nằm dưới `directMessages`
- ngữ cảnh chat nhiều người nằm dưới `groups`
- id dành cho người vận hành giữ dạng dễ đọc như `dm:<id|*>`, `group:<id>`, `group:*`, `topic:<chatId>:<topicId>`
- Slack `channel:<id>` chỉ còn là input tương thích ngược
- tên gọi hướng tới con người cho ngữ cảnh chat nhiều người vẫn là `group`, kể cả transport thật là Slack channel hay Telegram topic
- follow-up trên Slack thread phải bám theo session key và trạng thái bot đã từng tham gia thread đó
- DM trên Slack và Telegram mặc định dùng `policy: "pairing"` theo hướng của OpenClaw
- ngữ cảnh chat dùng chung mặc định giữ thế phòng thủ an toàn: admission `allowlist` cộng `requireMention: true`
- onboarding cho ngữ cảnh chat dùng chung cần nhất quán giữa Slack và Telegram
- Slack nên có ack sớm, processing status, và processing reply trong thread
- routed conversation hỗ trợ `/attach`, `/detach`, `/watch`, `/status`, và `/loop`
- việc gửi theo kiểu quan sát là best-effort: lỗi send hay edit tạm thời không được làm chết runner supervision
- recent replay hiện chỉ giữ 5 inbound routed message gần nhất cộng `lastProcessedMarker`
- Telegram phải respect retry-after và pace live edit để tránh 429
- Telegram polling không được block toàn cục theo thứ tự cứng
- Slack và Telegram hiện cùng chia sẻ seam `ChannelPlugin`, nhưng semantics của transport và vòng lặp provider vẫn phải do chính provider sở hữu
- hướng mở rộng cho kênh Việt Nam được tách rõ theo ba nhánh: `zalo-bot`, `zalo-oa`, rồi mới tới `zalo-personal`
