[English](../../../user-guide/runtime-operations.md) | [Tiếng Việt](./runtime-operations.md)

# Vận hành runtime

## Timeout khi chạy một turn

Các setting này điều khiển một prompt turn, không điều khiển việc dọn tmux session về dài hạn.

Các điểm cấu hình hiện tại:

- `agents.defaults.stream.idleTimeoutMs`
- `agents.defaults.stream.noOutputTimeoutMs`
- `agents.defaults.stream.maxRuntimeMin`
- `agents.defaults.stream.maxRuntimeSec`
- `agents.list[].stream.*`

Ý nghĩa hiện tại:

- `idleTimeoutMs: 6000`
  - khi một turn đã tạo ra output nhìn thấy được, `clisbot` sẽ coi turn đó hoàn tất nếu 6 giây tiếp theo không còn hoạt động meaningful nào từ runner
- `noOutputTimeoutMs: 20000`
  - chỉ là ngưỡng chẩn đoán nội bộ
  - nó được ghi log cho mục tiêu metric hoặc debug, nhưng không tự settle turn và cũng không tự đẩy timeout ra chat
- `maxRuntimeMin: 30`
  - cửa sổ quan sát mặc định 30 phút cho một turn
  - nếu sau thời gian đó session vẫn còn active, `clisbot` sẽ dừng live follow, để session tiếp tục chạy, và vẫn post kết quả cuối ở đây sau
- `maxRuntimeSec`
  - cửa sổ quan sát tùy chọn theo giây khi bạn cần test chặt hơn hoặc đặt giới hạn ngắn hơn

Điểm cần phân biệt:

- các setting này ảnh hưởng tới streaming settlement và hoàn tất của turn
- chúng không quyết định tmux session có còn sống sau turn hay không
- stale tmux cleanup được điều khiển riêng bởi `session.staleAfterMinutes` và `control.sessionCleanup.*`
- một detached long-running session sẽ không bị stale cleanup cho tới khi có interactive turn sau đó hoặc thao tác stop xóa detached state

## Command cho session chạy dài

Khi một run vượt khỏi cửa sổ quan sát ban đầu, `clisbot` vẫn tiếp tục theo dõi và có thể giữ thread này gắn vào run theo nhiều cách.

Các command hiện tại:

- `/attach`
  - gắn thread này vào active run
  - nếu run vẫn đang xử lý, live update sẽ tiếp tục hiện ở đây
  - nếu run đã settle, bạn sẽ nhận một trạng thái settled mới nhất
- `/detach`
  - dừng live update cho thread này
  - run bên dưới vẫn tiếp tục
  - kết quả cuối vẫn sẽ được post về đây khi run hoàn tất
- `/watch every 30s`
  - cứ mỗi 30 giây post trạng thái mới nhất vào đây cho tới khi run hoàn tất
- `/watch every 30s for 10m`
  - giống trên nhưng dừng interval watch sau cửa sổ thời gian đã chỉ định

Quy tắc admission cho prompt hiện tại:

- nếu session đã có active run, prompt mới sẽ bị từ chối cho tới khi run đó settle hoặc bị interrupt
- lúc đó nên dùng `/attach`, `/watch`, hoặc `/stop` thay vì gửi thêm prompt thứ hai vào cùng session còn đang chạy

Quy tắc scope của observer hiện tại:

- observer mode hiện được tính theo thread trong một routed conversation
- nếu chạy `/attach` hoặc `/watch ...` lần nữa trong cùng thread, mode quan sát cũ của thread đó sẽ bị thay thế

Hiển thị trạng thái hiện tại:

- `/status` giờ cho biết routed session đang `idle`, `running`, hay `detached`
- khi có, `/status` cũng cho thấy `run.startedAt` và `run.detachedAt`
- `clisbot status` giờ cũng liệt kê active run, nên detached autonomous session vẫn nhìn thấy được mà không cần `/transcript` hay gắn lại thread

## tmux server của `clisbot`

`clisbot` không dùng tmux server mặc định của máy bạn.

Nó tự khởi chạy và tự quản lý tmux server riêng qua dedicated socket:

`~/.clisbot/state/clisbot.sock`

Vì vậy các command tmux bình thường như `tmux list-sessions` sẽ không cho thấy các session do `clisbot` tạo ra.

Hãy dùng các command có awareness về socket ở bên dưới.

## Các command thường dùng

Nên ưu tiên runner CLI ở lớp người vận hành trước:

```bash
clisbot runner list
```

`clisbot status` giờ mặc định cũng cho thấy năm runner session mới nhất, và nếu còn nhiều hơn sẽ có phần đuôi `(n) sessions more`.

```bash
clisbot runner inspect --latest
```

```bash
clisbot runner inspect --index 1
```

```bash
clisbot runner watch <session-name> --lines 20 --interval 1s
```

```bash
clisbot runner watch --index 1 --lines 20 --interval 1s
```

```bash
clisbot runner watch --latest --lines 20 --interval 1s
```

```bash
clisbot runner watch --next --timeout 120s --lines 20 --interval 1s
```

Ý nghĩa:

- `inspect --latest`: snapshot từ session mới admit prompt gần nhất
- `watch --latest`: session mới admit prompt gần nhất
- `watch --next`: prompt mới đầu tiên được admit sau khi command bắt đầu
- `--index`: thứ tự 1-based đúng như `clisbot runner list` hiển thị
- các command này chọn session theo flow prompt logic, không theo thời điểm tmux được tạo

Shorthand ở top-level cũng có sẵn:

```bash
clisbot inspect --latest
clisbot watch --latest
```

tmux thô vẫn còn là fallback ở tầng thấp hơn:

```bash
tmux -S ~/.clisbot/state/clisbot.sock list-sessions
```

```bash
tmux -S ~/.clisbot/state/clisbot.sock attach-session -t <session-name>
```

```bash
tmux -S ~/.clisbot/state/clisbot.sock kill-session -t <session-name>
```

```bash
tmux -S ~/.clisbot/state/clisbot.sock kill-server
```

## Trạng thái runtime

Các đường dẫn runtime quan trọng:

- config: `~/.clisbot/clisbot.json`
- tmux socket: `~/.clisbot/state/clisbot.sock`
- monitor pid: `~/.clisbot/state/clisbot.pid`
- monitor state: `~/.clisbot/state/clisbot-monitor.json`
- runtime log: `~/.clisbot/state/clisbot.log`
- session store: `~/.clisbot/state/sessions.json`
- activity store: `~/.clisbot/state/activity.json`
- pairing store: `~/.clisbot/state/pairing`

Cách kiểm tra hữu ích:

```bash
clisbot runner list
```

```bash
clisbot inspect --latest
```

```bash
clisbot watch --latest --lines 20 --interval 1s
```

```bash
clisbot runner watch --next --timeout 120s --lines 20 --interval 1s
```

```bash
cat ~/.clisbot/state/sessions.json
```

```bash
cat ~/.clisbot/state/activity.json
```

```bash
ls -la ~/.clisbot/state/pairing
```

```bash
tail -f ~/.clisbot/state/clisbot.log
```

## Runtime monitor

`clisbot start` khi chạy detached giờ nằm dưới một runtime monitor do app sở hữu.

Hành vi hiện tại:

- `clisbot.pid` là pid của monitor process
- `clisbot status` cho biết trạng thái monitor, pid runtime hiện tại nếu có, và `next restart` khi service đang trong backoff
- nếu runtime worker crash lặp lại, monitor sẽ tự retry với bounded backoff thay vì bắt người vận hành phải restart ngay
- nếu monitor thấy còn worker cũ nhưng monitor sống không còn, `stop` và lần `start` kế tiếp sẽ dọn worker đó trước khi tiếp tục
- nếu `clisbot restart` báo stop timeout trong lúc update, hãy chạy `clisbot status` trước
- nếu status đã cho thấy `running: no`, hãy recover dứt khoát bằng `clisbot start`
- các beta release hiện tại còn retry `status` trong một cửa sổ ngắn trước khi coi stop-timeout đó là lỗi hẳn

Các điểm cấu hình hiện tại:

- `control.runtimeMonitor.restartBackoff.fastRetry.delaySeconds`
- `control.runtimeMonitor.restartBackoff.fastRetry.maxRestarts`
- `control.runtimeMonitor.restartBackoff.stages[].delayMinutes`
- `control.runtimeMonitor.restartBackoff.stages[].maxRestarts`
- `control.runtimeMonitor.ownerAlerts.enabled`
- `control.runtimeMonitor.ownerAlerts.minIntervalMinutes`

Policy mặc định hiện tại:

- retry mỗi 10 giây cho 3 lần thoát bất ngờ đầu tiên
- sau đó back off theo một thang mượt hơn: 1 phút, 3 phút, 5 phút, 10 phút, 15 phút, và cuối cùng là 30 phút
- khi chạm stage cuối cùng, `clisbot` tiếp tục retry ở khoảng chờ của stage cuối thay vì dừng vĩnh viễn
- nếu config cũ vẫn còn dùng thang mặc định legacy kiểu `15m x4` rồi `30m x4`, runtime sẽ tự normalize về thang mới; bản update `0.1.45` cũng xóa block backoff mặc định khỏi config đã persist để các chỉnh mặc định trong tương lai còn áp dụng được

Quy tắc owner alert hiện tại:

- nếu `app.auth.roles.owner.users` có principal có thể liên hệ được, monitor sẽ gửi cảnh báo trực tiếp khi service lần đầu đi vào restart backoff
- nếu một config thật sự không có final retry stage dùng được, nó vẫn có thể gửi cảnh báo muộn hơn khi restart budget cấu hình đã cạn
- các alert cùng loại bị rate-limit bởi `control.runtimeMonitor.ownerAlerts.minIntervalMinutes`

Hành vi khi Telegram polling bị tranh token:

- nếu một process khác tạm thời đang dùng cùng bot token để gọi `getUpdates`, channel Telegram giờ vẫn ở trong runtime và tự retry với backoff thay vì dừng hẳn
- channel health sẽ chuyển sang `failed` trong lúc xung đột, rồi tự quay lại `active` sau khi polling hồi phục
- nếu xung đột đó là ngoài ý muốn, hãy dừng poller kia; còn nếu bạn cố tình để vậy, `clisbot` vẫn có thể ngồi chờ và tự phục hồi

## Xử lý trust prompt của Codex

- `clisbot` mặc định đã giữ `trustWorkspace: true` cho Codex
- lúc Codex runner startup mới, `clisbot` chờ tới marker prompt tương tác `›` rồi mới gửi routed prompt đầu tiên; nếu pane tmux cho thấy prompt của người dùng nằm phía trên phần header của Codex, runner rất có thể đã chấp nhận startup output quá sớm và cần được sửa
- các beta release hiện tại cũng kiểm tra lại và chấp nhận trust prompt đang active ngay trước khi gửi routed prompt đầu tiên hoặc steering input về sau, để màn hình trust xuất hiện muộn không nuốt mất `/status` hay prompt của người dùng
- mặc định của Codex ready pattern và Gemini startup handshake được sở hữu ở lớp code; config được sinh ra hoặc update sẽ không ghi chúng vào trừ khi người vận hành cố tình thêm override đúng schema hiện tại
- nếu Codex vẫn hiện `Do you trust the contents of this directory?`, hãy đánh dấu workspace của `clisbot` là trusted thêm ở `~/.codex/config.toml`

Ví dụ:

```toml
[projects."/home/node/.clisbot/workspaces/default"]
trust_level = "trusted"
```

- nếu trust screen vẫn còn hiện, hãy inspect hoặc attach vào tmux session rồi xử lý từ đó:

```bash
clisbot inspect --index 1
```

```bash
tmux -S ~/.clisbot/state/clisbot.sock attach -t <session-name>
```

- nếu Codex cảnh báo Linux thiếu `bubblewrap`, hãy cài `bubblewrap` vào runtime environment

Trong mỗi agent workspace, file đi vào từ channel được lưu tại:

- `{workspace}/.attachments/{sessionKey}/{messageId}/...`

Hành vi prompt hiện tại là tối giản:

- `clisbot` sẽ prepend các mention kiểu `@/absolute/path` cho file đã lưu
- sau đó mới nối thêm text người dùng gửi

## Dọn tmux cũ

`clisbot` có thể thu hồi tmux session rỗi mà không reset cuộc hội thoại logic.

Các điểm cấu hình hiện tại:

- `agents.defaults.session.staleAfterMinutes`
- `agents.list[].session.staleAfterMinutes`
- `control.sessionCleanup.enabled`
- `control.sessionCleanup.intervalMinutes`

Ý nghĩa hiện tại:

- `staleAfterMinutes: 60`
  - kill live tmux runner sau 60 phút không hoạt động
- `staleAfterMinutes: 0`
  - tắt stale cleanup cho agent đó
- `control.sessionCleanup.intervalMinutes: 5`
  - cứ mỗi 5 phút quét tìm stale tmux runner

Quy tắc quan trọng:

- stale cleanup chỉ kill live tmux session
- nó không xóa mapping `sessionKey -> sessionId` đã lưu trong `~/.clisbot/state/sessions.json`
- automatic startup retry, prompt-delivery retry, và same-context recovery cũng giữ nguyên mapping đó; nếu native session id không resume lại được, `clisbot` sẽ fail đúng sự thật thay vì âm thầm tạo cuộc hội thoại mới
- `clisbot runner list` cho thấy `sessionId` đã lưu; `sessionId: not stored` nghĩa là `clisbot` chưa lưu được giá trị đó
- dùng chat `/new` khi bạn chủ ý muốn tạo runner conversation mới cho cùng routed session; Codex và Claude nhận `/new`, Gemini nhận `/clear`, rồi `clisbot` lưu `sessionId` mới
- message kế tiếp trong cùng conversation có thể tạo lại tmux và resume AI CLI session trước đó khi runner hỗ trợ resume
- trạng thái idle được xác định từ hoạt động ở session của `clisbot`, không phải từ CPU hay chuyển động pane của tmux
- cleanup loop bỏ qua các session hiện đang bận trong queue của `clisbot`
- một user message cũ không làm cho active run vẫn còn bận bị hiểu lầm là stale

Ví dụ:

```json
{
  "agents": {
    "defaults": {
      "session": {
        "createIfMissing": true,
        "staleAfterMinutes": 60
      }
    }
  },
  "control": {
    "sessionCleanup": {
      "enabled": true,
      "intervalMinutes": 5
    }
  }
}
```

Cách kiểm tra:

1. gửi một prompt để cuộc hội thoại tạo tmux session
2. xác nhận tmux session tồn tại trên `~/.clisbot/state/clisbot.sock`
3. chờ vượt ngưỡng stale đã cấu hình
4. xác nhận session biến mất khỏi `tmux list-sessions` trên socket đó
5. gửi một prompt nữa trong cùng channel hoặc thread
6. xác nhận conversation được resume thay vì reset khi runner hỗ trợ `sessionId` resume

## Reload config

Config reload được điều khiển bởi:

- `control.configReload.watch`
- `control.configReload.watchDebounceMs`

Ý nghĩa:

- `watch: true` bật file watching cho `~/.clisbot/clisbot.json`
- `watchDebounceMs` trì hoãn nhẹ việc reload để một lần lưu file không kích nhiều lần reload

Quy tắc quan trọng:

- nếu hiện tại watch đang tắt, việc sửa file để bật watch vẫn cần một lần restart tay vì lúc đó chưa có watcher nào tồn tại
- một khi watch đã bật, các lần lưu config sau đó phải tự reload

Ví dụ:

```json
{
  "control": {
    "configReload": {
      "watch": true,
      "watchDebounceMs": 250
    }
  }
}
```

Hành vi vận hành:

- lưu `~/.clisbot/clisbot.json` sẽ kích hoạt reload ngay trong process
- service nên ghi log `clisbot reloaded config ...`
- các message Slack gửi sau đó nên dùng config mới mà không cần restart tay

Cách kiểm tra an toàn:

1. đổi một setting dễ nhìn thấy, ví dụ `bots.slack.defaults.ackReaction`
2. lưu file config
3. xác nhận log reload xuất hiện
4. gửi Slack test message
5. xác nhận reaction hoặc hành vi mới đã hiện ra

Runtime follow-up state được lưu theo từng `sessionKey` trong:

`~/.clisbot/state/sessions.json`

Các field hữu ích:

- `sessionId`
- `followUp.overrideMode`
- `followUp.lastBotReplyAt`
- `updatedAt`

Cửa sổ follow-up mặc định hiện tại là 5 phút:

- `bots.slack.defaults.followUp.participationTtlMin: 5`
- `bots.telegram.defaults.followUp.participationTtlMin: 5`

Ngoài ra còn hỗ trợ tinh chỉnh theo giây:

- `bots.slack.defaults.followUp.participationTtlSec`
- `bots.telegram.defaults.followUp.participationTtlSec`
