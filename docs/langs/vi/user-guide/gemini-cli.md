[English](../../../user-guide/gemini-cli.md) | [Tiếng Việt](./gemini-cli.md)

# Hướng dẫn Gemini CLI

## Tóm tắt

`Gemini` dùng được trong `clisbot`, nhưng nhạy với môi trường hơn `codex`.

Vấn đề chính không nằm ở độ liền mạch của session.

Vấn đề chính là chất lượng khởi động và phản hồi qua route khi phần auth hoặc phần thiết lập của Gemini chưa sạch sẵn từ trước.

## Điểm mạnh hiện tại

- ready pattern rõ ràng
- blocker ở giai đoạn startup lộ rõ
- mô hình capture và resume `sessionId` khá chắc

## Lưu ý hiện tại

- Gemini cần được xác thực sẵn theo cách mà runtime có thể dùng lại
- hành vi routed reply trong một số flow `message-tool` vẫn chưa tốt như mong muốn
- các màn hình auth và thiết lập từ upstream vẫn có thể thay đổi

## Khuyến nghị cho người vận hành

- nếu Gemini đã được auth sẵn và bạn thực sự muốn dùng Gemini, đây vẫn là một routed CLI khả dụng
- nếu muốn mặc định an toàn hơn cho đa số trường hợp, vẫn nên ưu tiên `codex`
- nếu cần thêm chi tiết triển khai, xem [Hồ sơ Gemini trong contract tương thích](../features/dx/cli-compatibility/profiles/gemini.md)
