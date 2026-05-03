[English](../../../../features/configuration/README.md) | [Tiếng Việt](./README.md)

# Configuration

## Tóm tắt

Configuration là local control plane của `clisbot`.

Mental model quan trọng hiện nay:

- `app`: behavior áp dụng cho toàn runtime
- `bots`: channel identity cộng mặc định ngữ cảnh chat
- `agents`: execution identity, workspace, và runner behavior

Với quyền truy cập theo ngữ cảnh chat, cách tách quan trọng là:

- `directMessages`
- `groups`

trong config của từng bot.

Với timezone, mental model chính là:

- `app.timezone`: timezone mặc định của install này
- `agents.list[].timezone`: override khi một assistant persona hay workspace có vùng thời gian riêng
- route `timezone`: override khi một group, channel, DM, hoặc topic có bối cảnh vùng thời gian riêng
- persisted loop `timezone`: execution snapshot của wall-clock loop đã tồn tại, không phải config người dùng sẽ thường sửa

Người dùng mới không nên bị buộc phải biết IANA timezone ngay trước lần start đầu tiên. Bootstrap mới có thể suy ra timezone của máy chủ và ghi `app.timezone`, nhưng start/status output phải nói rõ đã suy ra gì và đổi ở đâu.

Với queue bound, key quan trọng là:

- `app.control.queue.maxPendingItemsPerSession`

Runtime default là `20` nếu config bỏ trống. Default config được generate cố ý không pin `app.control.queue` để release sau còn có thể thay đổi mặc định.

## Trạng thái

Active

## Contract hiện tại

Trong một bot config:

- DM route nằm dưới `directMessages`
- ngữ cảnh chat nhiều người nằm dưới `groups`
- child key được lưu bằng raw provider-local id cộng `*`

Ví dụ:

- Slack DM wildcard:
  - `bots.slack.<botId>.directMessages["*"]`
- Slack shared wildcard:
  - `bots.slack.<botId>.groups["*"]`
- Slack shared chat context:
  - `bots.slack.<botId>.groups["C1234567890"]`
  - `bots.slack.<botId>.groups["G1234567890"]`
- Telegram DM wildcard:
  - `bots.telegram.<botId>.directMessages["*"]`
- Telegram group:
  - `bots.telegram.<botId>.groups["-1001234567890"]`
- Telegram topic:
  - `bots.telegram.<botId>.groups["-1001234567890"].topics["42"]`

Operator CLI id vẫn giữ prefix:

- `dm:<id>`
- `dm:*`
- `group:<id>`
- `group:*`
- `topic:<chatId>:<topicId>`

Input cũ như `channel:<id>` vẫn chạy được nhưng không còn là contract ưu tiên.

## Mô hình policy cho ngữ cảnh chat

### Defaults layer

Provider default hiện expose cả:

- quick policy alias:
  - `dmPolicy`
  - Slack `channelPolicy`
  - Slack `groupPolicy`
  - Telegram `groupPolicy`
- wildcard route node explicit:
  - `directMessages["*"]`
  - `groups["*"]`

Quy tắc đồng bộ:

- `dmPolicy: "disabled"` nghĩa là `directMessages["*"]` cũng bị disable
- shared `groupPolicy` và Slack `channelPolicy` điều khiển admission vào group
- `groups["*"].policy` điều khiển sender policy mặc định trong các group đã được admit
- admission mặc định cho ngữ cảnh chat dùng chung là `allowlist`
- sender policy mặc định bên trong group đã admit là `open`

### Ý nghĩa runtime

- `disabled` nghĩa là tắt hẳn và im lặng khi dùng cho admission policy hoặc concrete route
- nếu ngữ cảnh chat đang enabled và effective policy là `allowlist`, chỉ người được cho phép mới nói chuyện ở đó
- `owner` và `admin` của app không bypass `groupPolicy` hay `channelPolicy` admission; sau khi group đã được admit và enabled, họ có thể bypass sender allowlist
- `blockUsers` vẫn thắng
- `disabled` vẫn thắng mọi thứ

### Shared deny behavior

Shared allowlist failure bị chặn trước runner ingress bằng câu:

`You are not allowed to use this bot in this group. Ask a bot owner or admin to add you to allowUsers for this surface.`

## Bất biến triển khai

- canonical operator id là `group:<id>`, `group:*`, `dm:<id|*>`, `topic:<chatId>:<topicId>`
- Slack `channel:<id>` chỉ là compatibility input
- canonical stored key dưới mỗi bot là raw id cộng `*`
- `group:*` là default multi-user sender policy node
- exact DM route có thể vừa mang admission config vừa mang behavior override
- deny message cố tình dùng từ `group`, vì mental model được chọn là một-người so với nhiều-người, không phải tên gọi riêng của từng provider

## Mô hình timezone

Config canonical hướng tới `app.timezone` là default toàn app.

`app.control.loop.defaultTimezone` chỉ còn là legacy config. Migration phải đưa nó về `app.timezone`, bỏ khỏi config document được rewrite, nhưng runtime vẫn cần đọc được file cũ chưa migrate.

`bots.defaults.timezone`, `bots.slack.defaults.timezone`, và `bots.telegram.defaults.timezone` cũng là default-level timezone cũ. Migration nên gom intent đó về `app.timezone` khi cần, rồi loại bỏ chúng khỏi config rewrite để tránh shadow về sau.

Effective timezone cho prompt timestamp và wall-clock loop mới được resolve theo thứ tự:

1. explicit one-off loop timezone
2. route hoặc topic timezone
3. agent timezone
4. bot timezone
5. `app.timezone`
6. legacy `app.control.loop.defaultTimezone`
7. legacy `bots.defaults.timezone`
8. legacy `bots.<provider>.defaults.timezone`
9. host timezone

Nhưng guide và help nên dạy theo product order:

1. app default
2. agent persona hoặc workspace override
3. current chat-context override
4. one-off loop override
5. bot advanced override

Persisted loop record giữ `timezone` riêng của nó để config đổi về sau không làm dịch các wall-clock loop đang tồn tại.

## Tương thích 0.1.43

Phiên bản `0.1.43` từng lưu route key cũ như:

- `dm:*`
- `groups:*`
- Slack `channel:<id>`
- Slack `group:<id>`

Loader hiện sẽ backup config gốc rồi normalize sang shape canonical:

- `directMessages["*"]`
- `groups["*"]`
- Slack raw id như `groups["C123"]` và `groups["G123"]`

Backup được viết cạnh config, trong `backups/`, trước khi file hiện tại bị rewrite thành schema `0.1.45`.

Upgrade log phải hiện từng bước:

- backup original config path
- chuẩn bị version upgrade
- dry-run validate new config shape
- apply new config
- báo áp dụng thành công kèm backup path

Nếu config đã ở schema version hiện tại thì đường upgrade này bị bỏ qua.

## Official template

- [config/clisbot.json.template](../../../../../config/clisbot.json.template)

Snapshot `0.1.43` để review migration:

- [config/clisbot.v0.1.43.json.template](../../../../../config/clisbot.v0.1.43.json.template)

## Phạm vi

- load config và migration
- env substitution
- bot identity và bot default
- route storage
- audience policy cho DM và ngữ cảnh chat dùng chung
- agent default và override theo agent
- session storage và session key policy
- runner default và session-id capture/resume policy
- runtime monitor, cleanup, và loop default
- app timezone default, agent/bot/route timezone override, và migration timezone cũ về `app.timezone`
- persisted auth policy shape

## Không nằm trong phạm vi

- channel rendering implementation
- chính runner mechanics
- auth semantics ngoài persisted config contract

## Tài liệu liên quan

- [Bots And Credentials](../../user-guide/bots-and-credentials.md)
- [Channels](../../user-guide/channels.md)
- [CLI Commands](../../user-guide/cli-commands.md)
- [Authorization](../auth/README.md)
- [Start Bootstrap And Credential Persistence](./start-bootstrap-and-credential-persistence.md)

## Task liên quan

- [Target Config And CLI Mental Model Migration](../../../../tasks/features/configuration/2026-04-18-target-config-and-cli-mental-model-migration.md)
- [Surface Policy Shape Standardization And 0.1.43 Compatibility](../../../../tasks/features/configuration/2026-04-24-surface-policy-shape-standardization-and-0.1.43-compatibility.md)
- [Timezone Config CLI And Loop Resolution](../../../../tasks/features/configuration/2026-04-26-timezone-config-cli-and-loop-resolution.md)
