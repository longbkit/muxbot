[English](../../../../features/agents/commands.md) | [Tiếng Việt](./commands.md)

# Agent Commands

## Mục đích

Tài liệu này định nghĩa cách dispatch command có phạm vi theo agent bên trong một conversation.

Nó bao phủ:

- slash-prefixed commands
- các shorthand command có thể cấu hình
- logic diễn giải trước khi prompt được gửi xuống runner

## Quy tắc boundary

Dispatch command thuộc về `agents`.

Vì:

- nó quyết định inbound text là agent control hay input bình thường cho agent
- nó có phạm vi trong một conversation session key của agent
- nó phải vẫn có nghĩa kể cả khi runner cụ thể thay đổi

Nó không thuộc về `runners`, vì runners nên chỉ nhận input đã được quyết định xong.

Nó cũng không thuộc về `control`, vì đây là command dùng ngay trong user conversation chứ không phải operator-only surface.

## Quy tắc dispatch

Khi message bắt đầu bằng `/`:

1. kiểm tra có khớp reserved control slash command hay không
2. nếu có, thực thi control command ngay
3. nếu khớp một agent-reserved execution command, thực thi command đó
4. nếu không, forward nguyên slash command xuống agent như native runner input

Control slash command luôn có độ ưu tiên cao hơn native agent slash command.

Khi message bắt đầu bằng bash shortcut đã cấu hình như `!`:

1. coi phần còn lại là một bash command có phạm vi theo agent
2. thực thi nó trong workspace hiện tại của agent

## Các control slash command hiện có

- `/start`: hiện onboarding help cho surface hiện tại
- `/help`: hiện các control slash command đang có
- `/status`: hiện route status hiện tại và gợi ý setup cho operator
- `/whoami`: trả về platform sender, route identity, và session id view hiện tại của active conversation
- `/transcript`: trả về full conversation session transcript hiện tại
- `/stop`: gửi `Escape` để interrupt processing hiện tại, clear active-run state của clisbot, rồi để queued prompt tiếp tục
- `/new`: tạo session mới cho routed conversation hiện tại và lưu `sessionId` mới
- `/nudge`: gửi thêm một `Enter` vào tmux session hiện tại mà không resend prompt body
- `/queue <message>` hoặc `\\q <message>`: tạo một durable queued prompt cho session hiện tại
- `/queue list`: hiện pending queued prompt của session hiện tại
- `/queue clear`: xóa pending queued prompt của session hiện tại mà không interrupt prompt đang chạy
- `/followup status`
- `/followup auto`
- `/followup mention-only` hoặc `/mention`
- `/followup mention-only channel` hoặc `/mention channel`
- `/followup mention-only all` hoặc `/mention all`
- `/followup pause` hoặc `/pause`
- `/followup resume` hoặc `/resume`

Ý nghĩa hiện tại:

- `start`: hiện onboarding hoặc setup guidance cho route hiện tại
- `status`: hiện follow-up policy hiện tại của conversation cùng hướng dẫn operator cho route đó
- `auto`: tiếp tục tự nhiên sau khi bot đã reply trong thread, tùy theo policy TTL
- `mention-only`: yêu cầu mention explicit cho mọi turn về sau trong thread; shorthand là `/mention`
- `mention-only channel`: persist mention-only thành mặc định cho channel, group, hoặc DM container hiện tại; shorthand là `/mention channel`
- `mention-only all`: persist mention-only thành mặc định cho mọi routed conversation của bot hiện tại; shorthand là `/mention all`
- `pause`: dừng passive follow-up cho tới khi explicit resume hoặc re-activate; shorthand là `/pause`
- `resume`: khôi phục follow-up policy mặc định của conversation đó; shorthand là `/resume`

## Target continuity cho các surface chẩn đoán

- `/whoami` và `/status` nên ưu tiên truth của `sessionId` trong runtime memory khi live run đã biết nó
- đồng thời vẫn phải cho biết giá trị đó đang:
  - `persisted`
  - `not persisted yet`
- nếu runtime memory đã capture được `sessionId` mới mà persistence còn chậm, response không được giả vờ rằng stored value cũ là truth mới nhất

Các command này phải giữ phạm vi theo agent.

## Các agent execution command hiện có

- `/bash <command>`: chạy bash command trong workspace hiện tại của agent
- shorthand như `!<command>`: cách viết nhanh để chạy bash command trong workspace hiện tại của agent

## Cổng chặn cho command nhạy cảm

Transcript inspection và bash execution là capability nhạy cảm trên ngữ cảnh chat.

Quy tắc hiện tại:

- transcript inspection đi theo route `verbose`
- `verbose: "minimal"` cho phép:
  - `/transcript`
  - các transcript shortcut cấu hình theo kiểu slash như `::transcript` hoặc `\transcript`
- `verbose: "off"` chặn transcript inspection
- bash execution đi theo resolved agent auth
- `shellExecute` gate áp lên:
  - `/bash <command>`
  - shorthand bash như `!<command>`

Khi route không cho phép, clisbot phải deny command thay vì forward hoặc execute nó.

## Mô hình thực thi bash

Bash execution không nên chiếm luôn main agent CLI pane.

Quy tắc hiện tại:

- giữ một tmux window `bash` có thể tái dùng trong cùng conversation session
- dùng cùng workspace path với agent hiện tại
- serialize bash command qua đúng window đó
- capture command output

Vì sao:

- giữ command nằm đúng trong cùng conversation session và workspace
- không làm rối main Codex / CLI pane
- giữ shell context để debug hoặc tái dùng
- tránh sinh thêm một tmux window mới cho mỗi shell command

## Native slash commands

Nếu một slash command không bị clisbot reserve, nó nên được forward nguyên xuống agent.

Ví dụ:

- `/model`
- `/help` của native runner trong tương lai, nếu clisbot không reserve nó
- các slash command khác của agent CLI

## Ghi chú hiện tại

- tập reserved command hiện tại được giữ nhỏ có chủ đích
- control slash command có phạm vi theo agent, không phải workspace-global
- follow-up giờ có thể đổi ở scope conversation hoặc persist thành default của channel hoặc bot khi command explicit yêu cầu
- `/bash` và shorthand bash là execution command của agent, không phải operator control command
- `/queue` dùng durable session-scoped queue item dưới `StoredSessionEntry.queues`; pending item sống qua restart và cũng hiện được qua `clisbot queues`
- bash routing hiện tại dùng một reusable shell surface mặc định cho mỗi conversation session
- các kiểu địa chỉ như `!1:` hoặc `!bash:` thuộc expansion sau này của command surface, không phải default hiện tại
- về sau có thể thêm argument-aware command, nhưng thứ tự dispatch không được đổi
- các follow-up policy command hiện map vào cùng runtime control API mà future agent tools và skills cũng nên dùng
