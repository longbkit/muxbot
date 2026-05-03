[English](../../../user-guide/claude-cli.md) | [Tiếng Việt](./claude-cli.md)

# Hướng dẫn Claude CLI

## Tóm tắt

`Claude` dùng được trong `clisbot`, nhưng hiện có hai hành vi ở phía người vận hành cần chú ý hơn so với `codex`:

- Claude có thể dừng ở bước plan approval do chính Claude dựng ra
- Claude vẫn có thể tiếp tục dùng auto-mode classifier dù đã được khởi chạy với bypass-permissions

## Sự thật hiện tại

`clisbot` khởi chạy Claude với `--dangerously-skip-permissions`.

Thiết lập đó giúp giảm các permission prompt của Claude.

Nhưng hiện tại nó **không** đảm bảo Claude sẽ tránh hoàn toàn:

- gate plan approval
- quyết định của auto-mode classifier

Ở thời điểm này chưa có launch arg hay runner mode nào của `clisbot` được coi là bản sửa đã được kiểm chứng cho hai hành vi đó.

## Vấn đề 1: Gate plan approval

Hành vi đã quan sát:

- Claude có thể hiện một bước xác nhận kiểu "plan completed"
- lúc đó người vận hành phải chọn tiếp tục hay chỉnh lại kế hoạch
- chuyện này vẫn có thể xảy ra ngay cả khi đang chạy routed work với toàn quyền

Vì sao khó chịu:

- nếu không nhìn được terminal state thì run sẽ giống như đang bị treo
- nó phá cảm giác kỳ vọng rằng "full permission" nghĩa là cứ tiếp tục chạy

Workaround hiện tại:

1. bật `/streaming on` cho các routed conversation thiên về coding
2. nếu stream cho thấy Claude đang chờ ở màn hình plan approval, gửi `/nudge`
3. hành vi hiện quan sát được là `/nudge` sẽ gửi Enter, thường chấp nhận lựa chọn mặc định và cho run đi tiếp
4. với các session dài, dùng `/attach` để tiếp tục theo dõi live

## Vấn đề 2: lệch sang auto mode

Hành vi đã quan sát:

- Claude vẫn có thể route công việc qua auto-mode classifier ngay cả sau khi đã launch với bypass-permissions
- điều này có thể ảnh hưởng cả những việc local đơn giản như sửa file hay chạy shell
- sau một bước plan approval, Claude có thể tiếp tục cư xử như đang ở auto mode thay vì quay lại trạng thái mà người vận hành mong đợi từ bypass-permissions

Hệ quả hiện tại:

- `--dangerously-skip-permissions` không đồng nghĩa với "không bao giờ dùng semantics của plan hay auto"
- nếu bạn muốn hành vi của Claude dễ đoán hơn, hãy tắt auto mode ngay trong chính Claude trước khi route nó qua `clisbot`

Nên đổi ở đâu:

- Claude UI `/config`
- file cấu hình của Claude `~/.claude/settings.json`

## Khuyến nghị cho người vận hành

- dùng `codex` làm mặc định nếu bạn muốn trải nghiệm coding mượt nhất
- dùng `claude` khi bản thân Claude mới là ưu tiên, nhưng nên theo dõi sát hơn ở các run coding dài
- bật `/streaming on` sớm nếu task dễ kích hoạt flow planning

## Tài liệu liên quan

- [Hồ sơ Claude trong contract tương thích](../features/dx/cli-compatibility/profiles/claude.md)
- [Lệnh gốc của CLI](./native-cli-commands.md)
