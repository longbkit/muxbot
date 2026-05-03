[English](../../../../features/runners/tmux-runner.md) | [Tiếng Việt](./tmux-runner.md)

# tmux Runner

## Tóm tắt

tmux runner là concrete runner implementation hiện tại của `clisbot`.

Nó dùng một tmux server riêng cùng một hoặc nhiều session để host long-lived coding agent như Codex CLI.

## Vì sao tài liệu này tồn tại

tmux là backend hiện tại, nhưng nó không phải toàn bộ model của hệ thống.

Tài liệu này giữ mọi tmux-specific mechanic bên trong `runners` để:

- `agents` vẫn backend-agnostic
- `channels` không phụ thuộc vào tmux internals
- ACP hoặc SDK runner về sau có thể theo cùng top-level contract

## Ownership

tmux runner sở hữu:

- tmux socket strategy
- tmux server bootstrap
- strategy để truy cập session, window, và pane
- cách gửi input vào backend process
- cách capture pane output
- cách normalize output lấy từ tmux về runner contract
- tmux-specific failure handling
- backend-specific launch / capture / resume behavior

tmux runner không sở hữu:

- canonical agent identity
- workspace policy
- channel-visible rendering
- operator control workflow

## Hình dạng backend hiện tại

Implementation model hiện tại là:

- một dedicated tmux server cho `clisbot`
- một tmux session cho mỗi live runner instance của một conversation session key đã resolve
- một workspace path do layer cao hơn cung cấp cho session đó
- một CLI agent process chạy trong session đó
- các secondary window tùy chọn cho runner-owned execution surface như reusable shell access

Runner phải xem workspace path, agent identity, và session key là input, không phải khái niệm do tmux sở hữu.

Với AI CLI-backed runner, tmux chỉ là host process boundary, không phải canonical conversation boundary.

Ranh giới continuity hiện tại:

- tầng agents sở hữu `sessionKey`
- `SessionService` persist current `sessionId`
- `SessionService` quyết định active mapping có giữ nguyên, rotate, hay về sau rebind hay không
- tmux runner sở hữu cách explicit `sessionId` được pass-through, cách tool-created `sessionId` được capture, và cách stored `sessionId` được tái dùng cho backend cụ thể

## tmux mechanics

### Socket strategy

tmux runner nên dùng một dedicated socket path cho project này, không dùng tmux server mặc định của người dùng.

Path mong đợi hiện tại:

- `~/.clisbot/state/clisbot.sock`

Việc cô lập này quan trọng để:

- session của project không bị trộn với tmux session cá nhân của người dùng
- operator biết chính xác server nào cần inspect
- control workflow có thể target một backend dự đoán được

### Session naming

Session naming phải ổn định và được suy ra từ resolved session key.

Sự ổn định đó cần cho:

- operator attach flow
- restart flow
- routing đáng tin từ các layer cao hơn

Nhưng tmux session naming vẫn phải được xem là runner identity, không phải canonical persisted conversation id.

Quy tắc đặt tên mặc định hiện tại:

- `agents.defaults.session.name: "{sessionKey}"`
- tên sau khi render được normalize thành một readable prefix an toàn cho tmux
- clisbot nối thêm stable short hash từ logical `sessionKey`
- tmux operation vẫn phải target đúng exact session name, vì raw tmux target lookup chấp nhận unique prefix và có thể attach nhầm runner

Sự phân biệt quan trọng:

- `sessionKey`
  - logical conversation bucket
- AI CLI `sessionId`
  - active tool-native conversation id
- tmux session name
  - live process host hiện tại đang chạy tool conversation đó

## Bootstrap flow

tmux runner nên:

1. bảo đảm dedicated tmux server đã tồn tại
2. tạo session cần thiết nếu chưa có
3. start CLI agent process trong workspace được cung cấp
4. phát hiện trust hoặc setup prompt ban đầu khi cần
5. đạt ready state trước khi bắt đầu prompt submission bình thường

Khi AI CLI bên dưới hỗ trợ session resume, bootstrap nên có hai mode:

1. fresh start
2. resume AI CLI `sessionId` đã có

Runner không được giả định rằng “tmux session mới” đồng nghĩa với “conversation mới”.

Path bootstrap hiện tại:

- tool-created session id
  - start tool bình thường
  - gọi status command như `/status`
  - parse session id được trả về
  - persist nó để resume về sau
- explicit session id
  - `SessionService` sinh hoặc chọn id trước khi launch
  - inject nó vào runner args như `--session-id {sessionId}`
  - reuse lại chính id đó ở restart về sau

## Input submission

tmux runner nên nhận normalized input từ higher layer rồi dịch nó thành tmux action một cách an toàn.

Ví dụ về tmux-specific mechanic:

- target đúng pane
- gửi keystroke hoặc pasted text
- gửi `Enter` cuối cùng

Những mechanic đó phải ở lại trong runner boundary.

Quy tắc submit hiện tại của tmux trong `clisbot` được giữ hẹp và truthful:

- sau status-command handshake nội bộ như `/status`, runner cho pane một khoảng settle ngắn trước khi quay lại first user-prompt path
- runner phải confirm prompt paste truth trước khi gửi `Enter`
- nếu prompt vẫn chưa hiện, runner có thể retry paste một số lần có giới hạn trong cùng pane
- nếu paste không bao giờ hạ cánh và `Enter` chưa được gửi, runner có thể reset tmux session đó và retry đúng một lần trong khi vẫn giữ continuity của stored session id
- nếu `Enter` đã được gửi, runner không được full-reset một cách mù quáng vì có thể vô tình cắt một run thật vừa start muộn

## Snapshot và streaming capture

tmux runner phải capture visible state hiện tại của session và lộ nó ra dưới dạng:

- current snapshot
- ordered output updates
- full current session view khi higher layer explicit yêu cầu transcript inspection

Runner không nên lộ raw tmux capture như contract duy nhất.

Nó phải normalize output từ pane thành một runner format backend-neutral cho `channels` và `agents`.

## Các quirks riêng của tmux

Các quirks tmux-backed CLI đã biết hoặc dự kiến:

- trust prompt ở lần chạy đầu
- partial redraw
- repeated terminal banner
- output bị reflow theo lúc pane thay đổi
- prompt vẫn còn hiện trên màn hình sau khi câu trả lời đã xong

Những quirks này thuộc về runner normalization logic, không thuộc channel code.

## Trust prompt handling

Với CLI agent như Codex, trust prompt ở first-run có thể chặn request thật đầu tiên của user.

tmux runner phải sở hữu phần xử lý backend-specific để:

- phát hiện prompt
- submit trust action đã cấu hình khi được phép
- tiếp tục sang prompt flow thật một cách sạch sẽ

Quy tắc hiện tại đã ship:

- trust handling không chỉ là startup concern
- nếu trust prompt xuất hiện muộn sau khi runner nhìn như đã ready, tmux runner sẽ re-check và accept lại trước khi first routed prompt hoặc steering input tiếp theo được gửi

## Failure modes

tmux runner phải surface các backend failure rõ ràng như:

- socket creation failure
- session creation failure
- thiếu binary `tmux`
- pane capture failure
- backend CLI crash hoặc exit
- trust hoặc bootstrap state bị kẹt

Các lỗi này phải hiện ra như runner failure, không phải silent channel timeout.

Một failure mode rất quan trọng là mất hẳn tmux session trong khi conversation bên dưới vẫn lẽ ra resume được.

Với runner dựa trên AI CLI có resumable session id, recovery path được ưu tiên là:

1. phát hiện tmux runner bị mất
2. tạo tmux runner instance mới
3. resume lại AI CLI `sessionId` trước đó
4. tiếp tục conversation trên cùng `sessionKey`

Nếu resume path đó fail, hệ thống phải surface sự thật đó, không được âm thầm giả vờ continuity vẫn còn.

## Runner sunsetting

Vòng đời của tmux session phải được quản lý tách khỏi vòng đời của conversation.

Hướng hành xử khuyến nghị:

- giữ tmux session sống trong khi conversation còn active
- khi runner bị dọn như stale, không được hiểu điều đó là logical conversation reset
- continuity của conversation vẫn phải được giữ nếu backend còn có khả năng resume
