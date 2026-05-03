[English](../../../../features/agents/sessions.md) | [Tiếng Việt](./sessions.md)

# Session Identity

## Mục đích

Tài liệu này định nghĩa session model hiện tại mà `clisbot` dùng.

Nó giữ rất gần mental model kiểu OpenClaw với `agentId` cộng `sessionKey`, nhưng điều chỉnh lại cho các subscription-backed AI CLI như Codex, Claude Code, và Gemini CLI, nơi bản thân tool đã có native conversation id riêng.

## Mental model đơn giản

- mặc định một routed ngữ cảnh chat map vào một `sessionKey`
- `sessionKey` đó là conversation phía clisbot mà người dùng đang nói chuyện
- routing policy có thể chủ đích cho nhiều surface cùng tiếp tục một `sessionKey`
  - ví dụ:
    - một personal assistant conversation dùng chung giữa Slack DM và Telegram DM
    - một Slack channel và Slack thread được cố ý gộp vào cùng conversation
- tại một thời điểm, một `sessionKey` map vào một `sessionId` active
- theo thời gian, cùng `sessionKey` đó có thể rotate sang `sessionId` khác
  - ví dụ:
    - chat `/new`
    - explicit session resume hoặc rebind về sau
    - backend reset hoặc expiry
- người dùng thường không cần quan tâm trực tiếp tới mapping này
  - chat bình thường cứ tự dùng tiếp conversation hiện tại

Các câu hỏi phổ biến:

- Ai sở hữu active mapping `sessionKey -> sessionId`?
  - `SessionService`
- `sessionId` đến từ đâu?
  - hoặc native tool tự tạo, hoặc `SessionService` chọn trước khi launch
- Ai chỉ dùng `sessionId` đó?
  - `RunnerService` và code cấp thấp hơn dưới `src/runners/tmux/*`
- Nhiều ngữ cảnh chat có thể chia sẻ một conversation không?
  - có, nếu routing chủ đích map chúng về cùng một `sessionKey`

## Contract hiện tại

`clisbot` hiện sở hữu ba identity khác nhau:

- `agentId`
  - durable agent owner
  - chọn workspace, defaults, tools, skills, và policy
- `sessionKey`
  - durable logical conversation key
  - cô lập queueing, routing, và continuity cho một cuộc hội thoại của clisbot
- `sessionId`
  - current active AI CLI conversation id gắn với `sessionKey` ở thời điểm này
  - có thể đổi về sau trong khi cùng `sessionKey` vẫn tiếp tục
  - được persist trong `~/.clisbot/state/sessions.json`

Runner sở hữu live execution handle:

- tmux session name
  - host tmux hiện tại cho conversation đó
  - có thể thay thế nếu tmux chết

Quy tắc quan trọng:

- tmux session name không phải canonical conversation identity

## Quy tắc đặt tên tmux hiện tại

- tmux session name bắt đầu bằng một prefix dễ đọc và an toàn cho tmux, được suy ra từ rendered template value
- clisbot nối thêm một stable short hash từ logical `sessionKey`
- raw `sessionKey` không dùng trực tiếp vì tmux rewrite nhiều ký tự như `:` trong target parsing

Điều này giúp tên vẫn dễ đọc cho operator nhưng vẫn giữ được boundary một unique tmux runner name cho mỗi logical session.

## Store hiện tại

Tầng agents persist một session entry theo mỗi `sessionKey` trong `session.storePath`.

Path mặc định hiện tại:

- `~/.clisbot/state/sessions.json`

Các field đang được lưu:

- `agentId`
- `sessionKey`
- `sessionId`
- `workspacePath`
- `runnerCommand`
- `lastAdmittedPromptAt`
- `followUp.overrideMode`
- `followUp.lastBotReplyAt`
- `runtime`
- `loops`
- `queues`
- `recentConversation`
- `updatedAt`

Ý nghĩa hiện tại:

- `lastAdmittedPromptAt`
  - timestamp của prompt mới nhất đã được admit vào active execution cho logical session đó
  - được dùng bởi các lệnh debug như `clisbot runner watch --latest` và `clisbot runner watch --next`
- `updatedAt`
  - timestamp continuity ở mức rộng cho các lần ghi session metadata
  - không đủ đặc hiệu cho việc chọn “latest new turn” của operator

Session model cũng cần chừa chỗ cho session-scoped runtime policy.

Ví dụ:

- follow-up continuation mode
- thread participation TTL hoặc expiry state
- temporary mention-only override
- temporary paused-follow-up override

Đây là continuity bridge hiện tại giữa routing và runner restart.

## Luồng hiện tại

Với một routed conversation:

1. channels resolve ra một `agentId` và một `sessionKey` từ surface hiện tại và routing policy
2. `SessionService` resolve workspace, runner config, và continuity record hiện tại cho `sessionKey` đó
3. nếu `sessionKey` đã có stored `sessionId` active, `SessionService` quyết định có nên tiếp tục qua nó hay không
4. runner bootstrap thực hiện mechanics launch / capture / resume riêng của backend cần cho tool đó
5. `SessionService` persist active mapping tương ứng cho `sessionKey`
6. tmux host live runner process cho session đó

## Runner input contract

Runner-facing identity mặc định là:

- bắt buộc: `sessionKey`
- tùy chọn: `sessionId`

Ý nghĩa hiện tại:

- routed work bình thường chỉ nên cần `sessionKey`
- `SessionService` dùng `sessionKey` để tìm active `sessionId` hiện tại và quyết định continuation / resume còn khả thi không
- `sessionId` chỉ là external mapping hoặc initialization hint tùy chọn, không phải input identity mặc định cho routed turn bình thường
- khi caller cung cấp `sessionId`, `SessionService` chỉ nên dùng nó nếu backend hoặc CLI hỗ trợ path đó
- nếu backend hỗ trợ caller-supplied id, `SessionService` có thể chọn và truyền `sessionId` xuống runner
- nếu native tool tự tạo id, `SessionService` có thể yêu cầu runner capture `sessionId` đó mà không làm gián đoạn live run
- nếu backend không hỗ trợ caller-supplied `sessionId`, runner phải:
  - capture `sessionId` do tool tạo và trả về cho `SessionService` để persist
  - hoặc fail một cách truthful thay vì giả vờ rằng external `sessionId` injection đã được tôn trọng
- một khi `sessionKey -> sessionId` đã được lưu thành công, các request về sau lại chỉ nên cần `sessionKey` trừ khi một authorized control flow chủ đích remap session

## Quy tắc recovery hiện tại

- nếu tmux còn sống, tiếp tục dùng live process đó
- tmux existence check và follow-up pane command phải target đúng exact tmux session name, không được dùng prefix match, để một `sessionKey` không bao giờ attach nhầm vào runner lạ chỉ vì cùng prefix
- nếu tmux runner đã bị sunset như stale, hãy giữ stored session entry và logical conversation identity
- nếu tmux mất nhưng stored `sessionId` vẫn còn, start runner mới và reuse `sessionId` đó khi runner hỗ trợ
- nếu stored `sessionId` đó không còn attach được với `sessionKey` này, giữ nguyên mapping và fail một cách truthful thay vì âm thầm mở tool conversation mới
- nếu không có `sessionId`, start fresh runner session
- `/new` là path explicit cho operator để trigger runner conversation mới và lưu `sessionId` active mới

## Quy tắc hướng tới người dùng hiện tại

- `/whoami`, `/status`, và `clisbot runner list` giờ hiển thị `sessionId` cùng trạng thái persistence khi clisbot biết giá trị đó
- `persisted` nghĩa là cùng giá trị đó đã được lưu trong continuity
- `not persisted yet` nghĩa là clisbot đã biết giá trị hiện tại nhưng durable state chưa bắt kịp
- nếu không thấy `sessionId`, có nghĩa là clisbot chưa lưu hoặc chưa xác nhận được nó
- điều đó không tự chứng minh rằng live runner pane cũng không có native session id

## Quy tắc về queue và recovery ordering

- queued prompt không được start chỉ vì một observer trước đó đã detached
- queued prompt phải chờ tới khi logical run trước đó của `sessionKey` thật sự idle
- mid-run recovery callback phải buộc vào current logical run instance, không chỉ buộc vào shared `sessionKey`
- như vậy stale recovery work sẽ không replay prompt cũ hoặc mutate nhầm vào run mới hơn đã start sau đó trên cùng surface
- durable queued prompt sống dưới `StoredSessionEntry.queues`
- stored queue item là durable queue inventory; runtime hydrate nó vào cùng ordered drain dùng cho queue item tạo từ chat
- `/queue list` và `clisbot queues list` chỉ hiện pending item
- queue clear chỉ xóa pending item và không interrupt prompt đang chạy
- queue create bị chặn bởi `control.queue.maxPendingItemsPerSession`, mặc định là `20`

## Quy tắc dọn stale runner hiện tại

Runner residency giờ tách riêng khỏi logical conversation continuity.

Contract hiện tại:

- tầng agents giữ một stored session entry theo mỗi `sessionKey`
- background cleanup loop kiểm tra stored session với stale threshold đã cấu hình
- nếu tmux session bên dưới đã idle quá ngưỡng đó, clisbot chỉ kill tmux session
- stored `sessionId` vẫn được giữ trong `sessions.json`
- logical conversation identity, queue, loops, và policy override vẫn còn nguyên
- routed prompt về sau có thể resume lại cùng logical conversation khi backend còn hỗ trợ

## Vì sao mô hình này quan trọng

Nó cho phép `clisbot`:

- giữ conversation continuity truthful
- tách logical identity khỏi live tmux process
- support queue, loop, follow-up, và recovery mà không buộc người dùng phải học tmux internals
- đổi runner implementation về sau mà không phải viết lại product mental model
