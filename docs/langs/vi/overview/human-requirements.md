[English](../../../overview/human-requirements.md) | [Tiếng Việt](./human-requirements.md) | [简体中文](../../../overview/human-requirements.md) | [한국어](../../../overview/human-requirements.md)

# Yêu cầu gốc từ con người

## Trạng thái

Bản ghi thô do con người cung cấp.

Bản tiếng Bạn gốc vẫn là nguồn gốc chuẩn của ghi chú này. Bản tiếng Việt ở đây nhằm giúp người đọc Việt nắm nội dung nhanh hơn khi đi theo cây tài liệu đã bản địa hóa.

## Quy tắc

Không chỉnh sửa tùy tiện file nguồn ý tưởng gốc nếu con người chưa yêu cầu.

Không tự ý chuẩn hóa, tóm tắt lại, sắp xếp lại, hay làm sạch phần ghi chú gốc.

## Ghi chú

Thêm các yêu cầu gốc, tin nhắn được dán vào, ràng buộc nháp, và các ghi chú nguồn trực tiếp ở bên dưới.

---

Brief của con người ngày `2026-04-04`:

Các AI CLI coding tool như Codex hay Claude đang là những agentic AI tool / AI agent hàng đầu trên thị trường. Ngoài ra, chúng còn có mô hình subscription với chi phí rẻ hơn API rất nhiều, có thể rẻ hơn tới 20 lần nếu dùng GPT Pro hoặc Claude Max subscription (giới hạn theo tuần vào khoảng 5 lần giá gói, tức là `$200/tháng`, và giới hạn này được reset mỗi tuần, nên về cơ bản người dùng có 4 lần mỗi tháng, vậy `4 * 5 = 20x`). Nếu có thể đưa các công cụ này ra những kênh giao tiếp dễ dàng giống cách OpenClaw đã làm, như Telegram, Slack, Discord, ... và cả qua API nữa theo kiểu tương thích Completion API thì sao? Codex và Claude đều có agent SDK, nhưng với Claude thì chưa rõ agent SDK có được phép dùng với subscription hay không, còn Codex hiện tại vẫn ổn. Vì vậy các SDK đó là lựa chọn tốt, nhưng không nên phụ thuộc vào chúng. Ý tưởng project này dựa trên tính ổn định và khả năng scale của tmux: mỗi tmux session có thể chạy một AI coding CLI như một agent. Các agent này có thể trả lời ngược lại chỉ bằng cách được cấp cho một CLI tool để nói chuyện qua các kênh khác nhau, hoặc nếu người dùng muốn thì cũng có thể stream toàn bộ nội dung tmux về.

Điểm thú vị là đây cũng nên là một project thử nghiệm về hiệu năng. Ta muốn so sánh hiệu năng giữa TypeScript với Bun, Go, và Rust, để xem hiệu năng và độ ổn định có thể khác nhau như thế nào. Vì vậy project này có thể nên được tổ chức thành monorepo với nhiều implementation khác nhau. Với MVP, tôi muốn tập trung vào Slack WebSocket + tmux + TypeScript + Bun trước. Tương tự OpenClaw, mỗi Slack channel hoặc bot có thể map tới một agent, tức là một tmux session. Vì vậy khi người dùng tag Slack bot, hãy gửi tin nhắn trực tiếp đó vào tmux session tương ứng, có thể map theo tên tmux session. Mỗi tmux session nên sống trong một workspace folder, giống OpenClaw, ví dụ mặc định có thể là `~/.clisbot/workspace/`.

Với MVP, tôi muốn bạn hỗ trợ `~/.clisbot/clisbot.json` với một cấu trúc tương tự template config kiểu OpenClaw, để tôi có thể bắt đầu gửi tin nhắn từ Slack khi tag bot, và bot trong tmux CLI nhận được prompt, thực thi nó, rồi stream kết quả trở lại khi đang di chuyển.

Hãy huy động các team có tay nghề cao làm việc này một cách tự chủ để đầu ra có chất lượng cao, và bảo đảm nó được test kỹ với thông tin Slack bot trong `.env`.

Bạn có thể dùng `slack-cli` skill để tự kiểm thử xem tin nhắn có được gửi đúng và ổn định hay không.

Làm theo hướng tự chủ, session dài, ưu tiên chất lượng cao, đầy đủ, không dùng workaround mode.

`2026-04-10`
Project này đã được đổi tên từ tmux-talk, sang muxbot, rồi thành clisbot

## Kiến trúc

### Cập nhật kiến trúc tính đến ngày 16 tháng 4 năm 2026

#### Session / Conversation

- Session = một bối cảnh hội thoại. Nó có session key đã được chuẩn hóa trong hệ thống của ta, rồi được map sang session id trong các CLI tool.
- Mỗi session tại một thời điểm chỉ map tới một session id để làm việc, nhưng có thể liên kết tới nhiều session id. Ví dụ trong một thread chat, người dùng có thể dùng `/new` để bắt đầu hội thoại mới, và lúc đó nó map tới một session id mới. Hoặc khi việc load session id cũ thất bại, hệ thống có thể tạo hội thoại mới, tức là một session id mới.
- Compaction vẫn giữ nguyên session id.

#### Chat surface / Chat route

- Chat surface hoặc chat route: nơi cuộc hội thoại diễn ra và tiếp tục. Một Slack channel có hai ngữ cảnh chat khác nhau tùy theo thiết lập của người dùng. Nếu họ muốn bot trả lời thẳng trong channel, không qua thread, thì channel là ngữ cảnh chat. Nhưng nếu họ muốn bot trả lời trong thread, thì thread mới là ngữ cảnh chat.
- Với Telegram, ta có khái niệm group và topic. Khi không có topic thì group là ngữ cảnh chat. Khi có topic thì topic là ngữ cảnh chat.

#### Runner

- Runner = bộ thực thi, nơi nó gọi một tmux session và chạy CLI tool trong tmux window. Runner là giao diện thô để tương tác với một AI agent. Trong các trường hợp AI agent phơi giao diện qua API, nó cũng có thể thực thi qua API thay thế. Nhìn từ góc độ API, ta có thể có tính tương thích kiểu OpenAI Completion API, với conversation id, hỗ trợ streaming, hoặc long polling / webhook để nhận phản hồi.
- Runner cũng có thể nhận session id làm input, nếu đã biết trước, hoặc nếu server hỗ trợ client-generated ids, cùng với prompt, rồi trả về response hoặc response dạng streaming.
- Nhưng runner cũng có thể là thứ khác phức tạp hơn, ví dụ Claude Agent SDK hoặc Codex SDK.
- ACP - Agent Client Protocol cũng khá gần với khái niệm runner.
- Ta có thể muốn tách Runner thành nhiều lớp. Hãy nghĩ như luồng request REST API tiêu chuẩn: `<client> - <executor - HTTP Request> - <network - TCP connection> - <rest API> - <server>`

Tóm lại, chat completion, Claude Agent SDK, và Agent Client Protocol đều liên quan tới nhau. Chúng vừa là cùng một khái niệm, vừa là một khái niệm mới, và cùng nhau tạo nên runner.

#### Manager

- Khi có nhiều object cùng loại, ta có thể cần manager. Đó là lúc có thể phải đưa vào `SessionManager` và `RunnerManager`.
- Để giới hạn số runner tối đa tại một thời điểm, ta cần `RunnerPool`. Quá nhiều runner có thể gây overhead bộ nhớ, quá tải CPU, hoặc làm chi phí / quota LLM vượt khỏi tầm kiểm soát.

#### State machine

- Runner cần một state machine để cập nhật cho phía gọi nó.

#### Các object khác

- Mỗi session có thể có một queue, nhưng ở dạng nâng cao hơn so với queue prompt của CLI.
- Với queue prompt kiểu CLI, tất cả các item đang chờ trong queue sẽ được submit để xử lý khi tới bước tiếp theo trong tiến trình agent sâu.
- Với session prompt queue của ta, ta muốn nó xử lý tuần tự từng item mà không ảnh hưởng lẫn nhau. Điều này hữu ích trong nhiều trường hợp khi mỗi bước phải diễn ra sau bước trước, như code review sau coding, hoặc chạy test sau coding. Có thể hình dung như một sequential workflow.
- Với khái niệm queue truyền thống, ta map nó sang khái niệm steering, nơi prompt được đẩy trực tiếp vào session / turn đang chạy để tác động tới run / turn / execution hiện tại.
- Nghĩ rộng hơn, ta cũng có thể có các queue độc lập với session, như một Kanban task. Khi đó mỗi item trong queue có thể được thực thi trong session mới. Nó giống như một backlog item, có thể chạy song song hoặc tuần tự. Với loại này, khái niệm backlog nghe hợp hơn.
- Ta có loops, là một dạng prompt đặc biệt: prompt lặp lại. Prompt lặp này có thể được tiêm vào một session cụ thể, chẳng hạn để chống việc AI lười dừng sớm, khi nó cứ tiếp tục tiêm câu kiểu "continue doing your work" mỗi lần AI dừng lại. Hoặc nó cũng có thể gọi một session mới / sạch để chạy prompt đó.
- Vì ta có nhiều queue item và loop item, ta có thể cần manager. Nhưng cũng có thể chỉ cần khái niệm list, hoặc thậm chí không cần. Ý tôi là, ví dụ queue ở dạng đơn giản nhất chỉ là một queue object gồm các prompt thuộc về một session, khác với một backlog đầy đủ. Với loops, ta sẽ có một list gồm các loop item, nhưng mỗi loop item lại có thể sinh ra nhiều prompt ở những thời điểm khác nhau.
- Khi loop thuộc về một session, thì session đó có thể có một danh sách loops. Danh sách loops này đến lượt mình có thể sinh prompt injection vào session ở bất kỳ thời điểm nào. Nó có thể tiêm theo steering mode hoặc queue mode. Mặc định queue mode là tốt nhất, vì nó bảo đảm không tác động giữa chừng lên run đang chạy.
- Khi loop không gắn với session, thì ta có một danh sách generic / global loops khác. Danh sách này lại có thể sinh ra nhiều prompt. Các prompt đó có thể chạy song song theo runner pool mode để giới hạn số item chạy cùng lúc cho mục tiêu quản lý. Tới điểm này trong mạch suy nghĩ, ta lại quay về và thêm vào một khái niệm nữa, đó là runner pool.
