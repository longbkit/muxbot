[English](../../../user-guide/native-cli-commands.md) | [Tiếng Việt](./native-cli-commands.md)

# Lệnh gốc của CLI

## Mục đích

Dùng trang này khi bạn muốn hiểu `clisbot` cùng tồn tại thế nào với hệ lệnh gốc hoặc hệ skill của coding CLI bên dưới.

Hiện tại điều này quan trọng nhất với:

- Codex
- Claude Code
- Gemini CLI

Ghi chú liên quan theo từng CLI:

- [Hướng dẫn Codex CLI](./codex-cli.md)
- [Hướng dẫn Claude CLI](./claude-cli.md)
- [Hướng dẫn Gemini CLI](./gemini-cli.md)

## Quy tắc lõi

`clisbot` giữ lại một nhóm nhỏ chat-surface control command riêng của nó, ví dụ:

- `/start`
- `/help`
- `/status`
- `/whoami`
- `/transcript`
- `/stop`
- `/new`
- `/nudge`
- `/followup ...`
- `/streaming ...`
- `/responsemode ...`
- `/additionalmessagemode ...`
- `/queue ...`
- `/steer ...`
- `/loop ...`
- `/bash ...`

Bất kỳ thứ gì bắt đầu bằng `/` nhưng **không** phải là command đã được `clisbot` giữ riêng sẽ được chuyển nguyên văn xuống CLI agent bên dưới.

Điều đó có nghĩa là `clisbot` đã giữ nguyên hệ lệnh native thay vì cố giải thích lại mọi thứ theo cách riêng.

## Điều này có nghĩa gì trong thực tế

### Claude Code

Người dùng Claude Code thường gọi lệnh gốc hoặc skill trực tiếp bằng `/...`.

Ví dụ:

- `/review`
- `/memory`
- `/agents`
- `/code-review`

Trong các ngữ cảnh chat của `clisbot`:

- nếu command đó là command riêng của `clisbot`, `clisbot` sẽ tự xử lý
- nếu không, câu lệnh gốc sẽ được chuyển nguyên văn sang Claude

Vì vậy nếu cấu hình Claude của bạn đã biết command hoặc skill gốc như `/code-review`, bạn vẫn có thể dùng nó qua Slack hoặc Telegram bằng `clisbot`.

Cách gọi nên dùng:

- Telegram hoặc ngữ cảnh chat nào chuyển nguyên thông điệp:
  - dùng `/code-review`
- Slack, nơi `/...` ở đầu dòng có thể bị Slack chặn theo cơ chế slash command riêng:
  - thêm một dấu cách ở đầu, ví dụ ` /code-review`
- prompt tự nhiên bằng ngôn ngữ thường vẫn ổn nếu đó là thói quen của bạn với Claude:
  - `Invoke /code-review`

Ví dụ:

```text
/code-review
```

Ví dụ với loop:

```text
/loop 3 /code-review
```

Ý nghĩa hiện tại:

- `clisbot` xử lý `/loop`
- phần thân của loop vẫn là `/code-review`
- mỗi vòng lặp sẽ chuyển `/code-review` sang Claude như native input

Cảnh báo quan trọng:

- **không** dùng `\code-review` hay `::code-review` cho lệnh gốc của Claude
- `\` và `::` là shortcut prefix của `clisbot`, không phải lớp dịch từ cú pháp `clisbot` sang cú pháp slash của Claude
- input lạ như `\code-review` sẽ được chuyển nguyên văn như vậy, nên Claude sẽ nhận `\code-review`, không phải `/code-review`

### Codex

Người dùng Codex thường dựa vào:

- native slash command như `/model` hoặc `/review`
- gọi skill theo tên trong prompt text thông thường
- pattern ngắn như `$gog` khi cấu hình Codex của họ hiểu đó là cách gọi skill nhanh

Trong ngữ cảnh chat của `clisbot`:

- reserved command của `clisbot` vẫn do `clisbot` xử lý
- native slash command nào không thuộc reserved set sẽ được chuyển nguyên văn
- text bình thường không phải command cũng sẽ được chuyển nguyên văn

Vì vậy nếu workflow Codex của bạn đang dùng những thứ như:

- `/review`
- `$gog`
- `$code-review`
- `use gog to check my calendar`

`clisbot` sẽ không xóa hay rewrite các input đó trước khi gửi sang Codex.

Cách gọi nên dùng cho Codex:

- nếu cấu hình Codex của bạn đã dùng cú pháp gọi nhanh kiểu `$...` như `$code-review` hoặc `$gog`, đây thường là cách sạch nhất trên ngữ cảnh chat
- cách này cũng tránh được nhập nhằng với slash command của Slack vì message không bắt đầu bằng `/`
- nếu bạn dùng native slash command của Codex như `/review`, quy tắc thêm dấu cách ở đầu dòng trên Slack vẫn áp dụng

Điểm cần phân biệt:

- `clisbot` không tự triển khai skill resolution cho Codex
- nó chỉ giữ nguyên input để Codex tự resolve native skill hoặc prompt theo đúng cách Codex vốn làm

### Gemini CLI

Về mặt kiến trúc, quy tắc pass-through tương tự cũng áp dụng cho Gemini:

- reserved command của `clisbot` sẽ do `clisbot` xử lý
- các command `/...` khác sẽ được chuyển nguyên văn

Tuy nhiên:

- hành vi lệnh gốc của Gemini trong routed Slack hoặc Telegram chưa được kiểm chứng sâu bằng Codex và Claude

Vì vậy hướng dẫn hiện tại cho người vận hành là:

- xem cơ chế chuyển nguyên lệnh gốc của Gemini là mô hình đúng theo thiết kế
- nhưng hãy tự kiểm tra command hoặc luồng mở rộng cụ thể của bạn trên route thật trước khi phụ thuộc nặng vào nó

## Buộc gọi command của `clisbot`

Nếu muốn tránh nhập nhằng và gọi thẳng control command của `clisbot`, dùng các prefix bổ sung sau:

- `::status`
- `\\status`
- `::transcript`
- `\\transcript`

Các prefix này thuộc về `clisbot`, không thuộc về coding CLI bên dưới.

Đây là lối thoát an toàn nhất khi:

- native CLI command trùng tên với command của `clisbot`
- slash handling của Slack đang cản đường
- bạn muốn chắc chắn đây là command của `clisbot` ngay cả trong một môi trường native CLI đã được tùy biến nhiều

Không dùng các prefix này cho native slash command của Claude hoặc Gemini trừ khi chính CLI đó thật sự mong đợi cú pháp đó.

## Ghi chú về Slack

Slack có thể chặn slash-style message trước khi `clisbot` nhìn thấy.

Nếu gặp trường hợp đó, gửi thêm dấu cách ở đầu:

```text
 /review
```

hoặc dùng shortcut prefix của `clisbot`:

```text
::status
```

## Giới hạn

Hành vi hiện tại cố ý đơn giản:

- `clisbot` không autocomplete native CLI command
- `clisbot` chưa quét skill folder của native CLI để dựng một menu lệnh hợp nhất
- `clisbot` không rewrite cú pháp native của vendor này sang cú pháp của vendor khác

Nó chỉ giữ nguyên nội dung lệnh gốc khi nội dung đó không nằm trong nhóm reserved command của `clisbot`.

## Cách nhớ nhanh

Có thể nhớ nhanh như sau:

- nếu bạn đang nhờ `clisbot` điều khiển ngữ cảnh chat hoặc runtime, hãy dùng command của `clisbot`
- nếu bạn đang nhờ Codex, Claude, hoặc Gemini làm việc bằng lệnh gốc hay hệ skill riêng của chúng, `clisbot` thường sẽ chỉ chuyển nguyên văn input đó

Chính vì vậy các thói quen sẵn có với Codex hoặc Claude vẫn tiếp tục dùng khá tự nhiên trên ngữ cảnh chat phía sau `clisbot`.
