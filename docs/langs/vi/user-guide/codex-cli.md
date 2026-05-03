[English](../../../user-guide/codex-cli.md) | [Tiếng Việt](./codex-cli.md)

# Hướng dẫn Codex CLI

## Tóm tắt

`Codex` hiện là lựa chọn mặc định được khuyến nghị cho các tác vụ code đi qua route trong `clisbot`.

Trong ba CLI khởi chạy chính đang hỗ trợ, đây là lựa chọn có độ ổn định vận hành tốt nhất ở thời điểm hiện tại.

## Vì sao đây là mặc định

- độ liền mạch của session tốt
- hành vi coding theo route ổn định
- ít tạo bất ngờ cho người vận hành hơn Claude ở thời điểm hiện tại
- ít vướng gate về auth hơn Gemini ở thời điểm hiện tại

## Lưu ý hiện tại

- readiness lúc startup vẫn dựa nhiều vào heuristic hơn là tín hiệu thật sự tường minh
- xác nhận interrupt vẫn là best-effort
- output của `/status` đôi lúc vẫn có thể làm lệch một số heuristic tương thích

## Khuyến nghị cho người vận hành

- nếu bạn muốn mặc định an toàn nhất cho trải nghiệm coding trong Slack hoặc Telegram, hãy bắt đầu với `codex`
- nếu cần chi tiết hơn về ranh giới tương thích, xem [Hồ sơ Codex trong contract tương thích](../features/dx/cli-compatibility/profiles/codex.md)
