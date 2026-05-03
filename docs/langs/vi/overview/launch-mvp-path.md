[English](../../../overview/launch-mvp-path.md) | [Tiếng Việt](./launch-mvp-path.md) | [简体中文](../../zh-CN/overview/launch-mvp-path.md) | [한국어](../../ko/overview/launch-mvp-path.md)

# Lộ trình ra mắt MVP

## Mục đích

Tài liệu này chốt rõ thứ tự ra mắt hiện tại.

Hãy dùng nó như một lăng kính roadmap ngắn cho:

- người đọc từ cộng đồng
- các quyết định ưu tiên sản phẩm
- việc rà backlog

Chi tiết triển khai vẫn nằm ở các tài liệu task được liên kết.

## Nguyên tắc ra mắt

- giữ sản phẩm có thể cấu hình qua nhiều lớp hoặc nhiều ngữ cảnh chat, nhưng luôn phải ship với mặc định rõ ràng
- giữ cho các công cụ trạng thái và debug đủ đúng sự thật để operator biết lớp nào đang hoạt động
- giảm ma sát của lần khởi động đầu tiên xuống thật thấp
- coi độ ổn định và tính đúng sự thật của runtime là launch gate, không phải phần đánh bóng làm sau
- coi naming, shape của config, và độ rõ ràng của ngữ cảnh chat người dùng là một phần của chất lượng sản phẩm

## Ảnh chụp hiện tại

1. Nền móng trước:
   - khởi động mượt và lưu credential bền
   - runtime ổn định cùng các công cụ trạng thái hoặc debug đúng sự thật
   - `/loop` là tính năng workflow khác biệt ở thời điểm hiện tại
2. Cửa ra mắt quốc tế:
   - Claude, Codex, và Gemini CLI đều được hỗ trợ và kiểm thử kỹ
   - gói kênh chia sẻ hiện tại giữ ở Slack và Telegram
3. Gói ra mắt tại Việt Nam:
   - giữ nguyên bộ ba CLI trên
   - thêm Zalo Bot Platform
   - thêm Zalo Official Account
   - thêm Zalo Personal
4. Làn mở rộng tiếp theo:
   - thêm các kênh như Discord, WhatsApp, Google Workspace, và Microsoft Teams
   - thêm các agentic CLI như Cursor, Amp, OpenCode, Qwen, Kilo, và Minimax dựa trên nhu cầu người dùng thật
5. Quyết định còn mở:
   - chốt xem khả năng tương thích, override, và tùy biến slash command native của từng CLI có cần hoàn tất trước khi đẩy mạnh ra công khai hay không

## Giai đoạn 0: Nền móng

Đây không phải các hạng mục đánh bóng tùy chọn.

Chúng là launch gate:

- khởi động nhanh mà không buộc phải dựng env trước
- lưu credential bền sau lần thành công đầu tiên
- runner và kênh giao tiếp ổn định, đúng sự thật
- operator nhìn thấy được trạng thái của nguồn credential, route, và runtime health
- `/loop` là tính năng nổi bật hiện tại cho công việc lặp lại hoặc theo lịch

## Giai đoạn 1: Ra mắt lõi quốc tế

Mục tiêu ra mắt rộng đầu tiên nên chứng minh được một bộ ba CLI chung:

- Claude
- Codex
- Gemini

Định nghĩa hoàn thành cho giai đoạn này:

- từng CLI đều chạy tốt qua gói Slack và Telegram hiện có
- từng CLI có đủ kiểm chứng cho setup, runtime, và luồng ngắt để đáng tin
- docs và các công cụ trạng thái làm rõ các lưu ý riêng của từng CLI

Hỗ trợ CLI về sau không nên làm loãng cửa kiểm chứng đầu tiên này.

## Giai đoạn 2: Gói ra mắt tại Việt Nam

Với Việt Nam, gói sản phẩm nên mở rộng cùng bộ ba lõi đó bằng:

- Zalo Bot Platform
- Zalo Official Account
- Zalo Personal

Đây là cột mốc của gói kênh giao tiếp, không phải đổi hướng sản phẩm.

## Giai đoạn 3: Mở rộng sau lõi

Sau khi bộ ba lõi được chứng minh:

- mở rộng hỗ trợ CLI theo nhu cầu người dùng thật
- chỉ ưu tiên Cursor, Amp, OpenCode, Qwen, Kilo, và Minimax sau khi đã có ảnh chụp nhu cầu
- tránh coi mọi CLI có thể hỗ trợ đều là hạng mục ra mắt ngang nhau

Sau khi gói kênh Slack, Telegram, và Zalo cho thị trường Việt Nam đã ổn:

- mở rộng sang Discord
- mở rộng sang WhatsApp
- mở rộng sang Google Workspace
- mở rộng sang Microsoft Teams

## Slash command native

Đây vẫn là một quyết định có ảnh hưởng trực tiếp tới cách ra mắt.

Hệ thống hiện đã hỗ trợ slash command do `clisbot` sở hữu và cả cơ chế native pass-through fallback.

Câu hỏi còn mở là liệu trước khi ra mắt rộng hơn có cần thêm:

- ghi chú tương thích slash command native theo từng CLI
- xử lý xung đột với các lệnh được dành riêng
- override hoặc đổi tên ngữ cảnh chat
- khả năng tùy biến prefix lệnh khi xảy ra xung đột cho operator hoặc người dùng

## Liên kết backlog

- [Common CLI Launch Coverage And Validation](../../../tasks/features/runners/2026-04-13-common-cli-launch-coverage-and-validation.md)
- [Zalo Bot, Zalo OA, And Zalo Personal Channel Strategy](../../../tasks/features/channels/2026-04-18-zalo-bot-oa-and-personal-channel-strategy.md)
- [Vietnam Channel Launch Package](../../../tasks/features/channels/2026-04-13-vietnam-channel-launch-package.md)
- [Secondary CLI Expansion Prioritization](../../../tasks/features/runners/2026-04-13-secondary-cli-expansion-prioritization.md)
- [Post-MVP Channel Expansion Wave](../../../tasks/features/channels/2026-04-13-post-mvp-channel-expansion-wave.md)
- [Native Slash Command Compatibility And Overrides](../../../tasks/features/agents/2026-04-13-native-slash-command-compatibility-and-overrides.md)
