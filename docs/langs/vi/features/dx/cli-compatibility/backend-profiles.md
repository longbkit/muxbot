[English](../../../../../features/dx/cli-compatibility/backend-profiles.md) | [Tiếng Việt](./backend-profiles.md)

# Hồ sơ CLI trong contract tương thích

## Tóm tắt

Trang này map bộ ba CLI hiện tại vào contract tương thích CLI v0:

- Codex
- Claude
- Gemini

Mục tiêu không phải nhắc lại mọi chi tiết implementation của runner.

Mục tiêu là nói rõ capability nào hiện đã vững, capability nào mới ở mức best-effort, và rủi ro lệch hành vi đang tập trung ở đâu.

## Cách đọc

Dùng các mức hỗ trợ sau:

- `Strong`: sản phẩm hiện đã có cơ chế rõ ràng cho capability đó
- `Partial`: capability dùng được nhưng cơ chế hiện tại vẫn còn generic, mong manh, hoặc chưa được đặc tả đủ
- `Unsupported`: sản phẩm hiện chưa tuyên bố hỗ trợ capability đó

## Bảng so sánh

| CLI | Start | Probe Ready / Waiting Input | Session Id Strategy | Resume | Recover After Pane Loss | Attach Observe | Interrupt | Main Drift Risk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Codex | Strong | Partial | runner-created + `/status` capture | Strong | Strong | Strong | Partial | chưa có ready pattern tường minh |
| Claude | Strong | Partial | tường minh qua `--session-id` | Strong | Strong | Strong | Partial | chưa có ready pattern tường minh, cộng thêm plan-approval và auto-mode drift |
| Gemini | Strong | Strong | runner-created + `/stats session` capture | Strong | Strong | Strong | Partial | auth/setup blocker và drift ở màn hình upstream |

## Sự thật chung giữa các CLI

Cả ba CLI hiện tại cùng chia sẻ các đặc điểm sau:

- execution hiện đều chạy qua tmux runner
- trust prompt do runner sở hữu
- observation và transcript capture đã tồn tại qua runner
- interrupt hiện mới dùng `Escape` theo cách generic, nên cần xem là best-effort cho tới khi có xác nhận hỗ trợ rõ ràng
- khôi phục sau khi mất pane phụ thuộc vào việc dựng lại runner instance nhưng vẫn giữ `sessionKey`, rồi tái dùng `sessionId` do CLI cung cấp nếu có

## Khác biệt giá trị nhất

Khác biệt quan trọng nhất hiện tại là độ rõ ràng của trạng thái khởi động:

- Gemini đã có `startupReadyPattern` tường minh
- Codex và Claude thì chưa

Nghĩa là Gemini hiện cho contract readiness đọc được bằng máy rõ nhất, còn Codex và Claude vẫn dựa nhiều hơn vào heuristic sau bước xử lý trust prompt.

## Tóm tắt cho người vận hành

- `Codex` hiện là lựa chọn ổn định nhất cho routed coding work.
- `Claude` dùng được, nhưng người vận hành nên chấp nhận rủi ro từ luồng plan approval và bộ phân loại auto mode do chính Claude tạo ra.
- `Gemini` dùng được khi auth trong runtime environment đã ổn, nhưng startup và routed delivery vẫn nhạy với môi trường hơn Codex.

## Hồ sơ từng CLI

- [Codex](./profiles/codex.md)
- [Claude](./profiles/claude.md)
- [Gemini](./profiles/gemini.md)
