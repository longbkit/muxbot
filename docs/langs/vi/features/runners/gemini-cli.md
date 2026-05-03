[English](../../../../features/runners/gemini-cli.md) | [Tiếng Việt](./gemini-cli.md)

# Hỗ trợ Gemini CLI ở tầng runner

## Tóm tắt

`clisbot` giờ đã có runner wiring hạng nhất cho Gemini CLI ở đúng boundary kiến trúc như Codex và Claude:

- tool preset và bootstrap support
- tmux startup readiness gating
- runner-owned session-id capture và resume
- Gemini-specific transcript normalization
- explicit startup blocker handling cho các tình huống chờ authentication

## Truth hiện tại

Gemini support là thật, nhưng có một điều kiện vận hành rất quan trọng:

- Gemini phải được authenticate sẵn theo cách runtime dùng lại được, hoặc
- environment phải cung cấp một headless-compatible auth path như `GEMINI_API_KEY` hoặc Vertex AI credentials

Nếu thiếu điều kiện đó, `clisbot` giờ fail nhanh và truthful thay vì giả vờ tmux session đã sẵn sàng.

Gemini hiện cũng có một giới hạn ở routed-delivery:

- hành vi `message-tool` của Gemini vẫn cần prompt-side hardening và live validation thêm cho routed reply trên Slack hoặc Telegram

## Vì sao tồn tại

Gemini là một phần của bộ ba CLI dự kiến launch cùng Claude và Codex.

Điều đó chỉ có nghĩa nếu Gemini support không bị xem như một hứa hẹn mơ hồ cho tương lai.

Runner cần một contract explicit cho:

- khi nào Gemini thật sự sẵn sàng để submit prompt
- session continuity của Gemini được capture và resume thế nào
- Gemini-specific startup blocker hiện ra cho operator ra sao

## Runner contract

Preset Gemini hiện tại:

- command: `gemini`
- startup args: `--approval-mode=yolo --sandbox=false`
- trust prompt automation: bật cho màn hình untrusted-folder hiện tại của Gemini khi `trustWorkspace` được bật
- startup ready pattern: `Type your message or @path/to/file`
- session-id create mode: do runner sinh
- session-id capture mode: `status-command` qua `/stats session`
- session-id resume mode: `command` qua `--resume {sessionId}`

## Hành vi startup

Gemini startup hiện đi theo các quy tắc rõ ràng:

1. Nếu ready pattern cấu hình xuất hiện, session được xem là ready.
2. Nếu trust prompt do runner quản lý xuất hiện trước và `trustWorkspace` bật, runner sẽ dismiss nó rồi tiếp tục chờ readiness.
3. Nếu một startup blocker đã cấu hình xuất hiện trước, runner fail startup ngay và kill tmux session nửa sống nửa chết đó.
4. Nếu ready pattern vẫn không xuất hiện trước khi hết startup budget, runner dùng bounded fresh-start retry policy trước khi fail hẳn.

Built-in blocker hiện tại:

- Gemini OAuth code-flow prompt:
  - `Please visit the following URL to authorize the application`
  - `Enter the authorization code:`
- Gemini auth-setup hoặc sign-in recovery screen:
  - `How would you like to authenticate for this project?`
  - `Failed to sign in.`
  - `Manual authorization is required but the current session is non-interactive`

## Ghi chú về trust flow

Gemini runner support từng ship với `trustWorkspace: false` vì đường Gemini được validate trước đó chưa lộ ra runner-managed trust screen.

Live validation về sau cho thấy hành vi first-start khác:

- Gemini có thể dừng ở untrusted-folder screen trước cả ready prompt
- màn hình đó chặn ready pattern mặc định
- bước trust-dismiss sau startup là quá muộn cho trường hợp này

Quy tắc hiện tại:

- Gemini giờ dùng cùng trust-flow handling model do runner sở hữu như các CLI còn lại
- startup polling sẽ dismiss trust screen của Gemini trước khi tiếp tục tiến về ready banner

Một hệ quả vận hành quan trọng:

- đổi preset default không tự rewrite existing agent config
- nếu một Gemini agent cũ đã persist `runner.trustWorkspace: false`, override đó phải được sửa trong config thì live runtime mới dùng hành vi mới

## Routed reply delivery

Gemini cũng đã được validate trên đường `message-tool`.

Hành vi quan sát được hiện chưa đủ mạnh để biến nó thành default:

- Gemini có thể in ra command `clisbot message send ...` thay vì thực thi nó
- wording mạnh hơn có thể lại đẩy Gemini vào một execution-approval prompt phụ cho shell command cục bộ

Quy tắc delivery hiện tại:

- routed Gemini conversation tiếp tục dùng `responseMode` đã cấu hình ở channel hoặc agent
- Gemini-specific prompt wording chỉ thêm độ rõ rằng user-facing message phải được gửi bằng `clisbot message send ...`
- prompt nên làm rõ intended send workflow mà không dùng cách nói quá gượng ép

## Session continuity

Quy tắc continuity hiện tại:

- `agents` sở hữu `sessionKey`
- `agents` persist Gemini `sessionId`
- tmux runner sở hữu cách Gemini `sessionId` được capture và tái dùng

Implementation hiện tại dùng session kiểu UUID native của Gemini:

- capture bằng `/stats session`
- resume bằng `gemini --resume <sessionId>`

Cách này tránh phải dùng heuristic continuity giả như `--resume latest`.

## Không nằm trong phạm vi

- tự động hóa Google OAuth bên trong `clisbot`
- che giấu yêu cầu authenticate của Gemini bằng fallback logic ngầm
- tuyên bố rằng routed Gemini trên Slack hoặc Telegram đã “proven” nếu chưa có live end-to-end validation thật với auth đầy đủ

## Trạng thái validation

Đã được bao phủ:

- config và CLI wiring
- bootstrap templates
- readiness và blocker gating
- chiến lược session-id capture và resume
- normalization coverage

Vẫn còn phụ thuộc môi trường:

- full success-path end-to-end validation trên một Gemini runtime đã authenticate thật

## Tài liệu liên quan

- [tmux Runner](./tmux-runner.md)
- [Runner Tests](../../../../tests/features/runners/README.md)
- [New CLI Test Suites](../../../../tests/new-cli-tests-suites.md)
- [CLI Trust-Flow Drift Must Update Runner Defaults And Existing Agent Config](../../../../lessons/2026-04-13-cli-trust-flow-drift-must-update-runner-defaults-and-existing-agent-config.md)
