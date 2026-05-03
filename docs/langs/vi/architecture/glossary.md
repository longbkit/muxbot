[English](../../../architecture/glossary.md) | [Tiếng Việt](./glossary.md)

# Thuật ngữ kiến trúc

## Trạng thái

Tài liệu tham chiếu kiến trúc đang áp dụng

## Mục đích

Giữ một bộ từ vựng dùng chung cho kiến trúc, code, doc, prompt, CLI help, và task spec của `clisbot`.

Hãy đọc file này trước khi đặt tên một khái niệm mới. Nếu một thuật ngữ đang có đã dùng được, hãy tái sử dụng nó. Nếu buộc phải thêm thuật ngữ mới, hãy thêm nó vào đây cùng ownership và boundary trước khi mang nó đi khắp code hoặc docs.

## Thuật ngữ cốt lõi

| Thuật ngữ | Nghĩa | Owner / Boundary |
| --- | --- | --- |
| `sender` | Danh tính người hoặc hệ thống đã submit, queue, steer, hoặc tạo ra message. Quyền được kiểm tra dựa trên sender. | Channels capture; auth tiêu thụ; agents có thể persist cho queue/loop continuity. |
| `surface` | Nơi message đi vào và reply được render, như Slack channel/thread, Telegram group/topic, DM, hoặc một API conversation về sau. | Channels sở hữu presentation và reply targeting của surface. |
| `message` | Một đầu vào do người dùng gửi hoặc do lịch chạy sinh ra. | Channels nhận message; agents queue hoặc chạy nó. |
| `session` | Một bucket continuity của hội thoại trong clisbot. Người dùng thường chỉ cần tiếp tục chat; chỉ khi chủ đích rotate hoặc resume thì mới phải quan tâm đến native tool id. | Agents sở hữu continuity của session. |
| `sessionKey` | Khóa hội thoại ổn định phía clisbot. Mặc định một routed surface map vào một `sessionKey`, nhưng routing policy có thể chủ đích cho nhiều surface tiếp tục cùng một conversation. | Agents / session continuity. |
| `sessionId` | Native tool conversation id hiện tại đang gắn với `sessionKey` ở thời điểm này. Tại một thời điểm, một `sessionKey` chỉ có một `sessionId` đang active, nhưng cùng `sessionKey` đó có thể đổi sang `sessionId` khác về sau sau `/new`, explicit resume/rebind, hoặc backend rotation. | `SessionService` sở hữu mapping. Native tool có thể tạo id, `SessionService` có thể chọn một id, còn runners chỉ pass, capture, hoặc resume nó. |
| `storedSessionId` | Bản persist của `sessionId` active hiện tại cho một `sessionKey`. Dùng cho continuity, resume, và operator inspection. | Agents persistence và operator/status surface. |
| `run` | Một lần thực thi active cho một session. | Agents / run lifecycle. |
| `runtime projection` | Bản ghi session-runtime đã persist như `idle`, `running`, hoặc `detached`. Nó giúp recovery, nhưng bản thân nó không phải live run truth. | Chỉ thuộc agents persistence. |
| `runner` | Boundary của backend executor, như tmux đang chạy Codex, Claude, hoặc Gemini. | Runners. |
| `queue` | Danh sách message chờ theo thứ tự cho một session. | Agents. |
| `queue item` | Một prompt entry trong queue của session. Queue item ở trạng thái pending/running là durable; item completed/failed sẽ bị bỏ sau khi settle thay vì giữ làm history. | Agents persistence và runtime queue reconciliation. |
| `loop` | Message lặp lại hoặc có lịch, gắn với một session / surface. | Agents sở hữu schedule state; channels cung cấp ngữ cảnh chat để giao message. |
| `steering` | Một user message mới được chèn vào khi run vẫn còn đang active. | Channels phát hiện; agents/runners submit vào active run. |

Ghi chú hiện tại:

- reverse invariant từ `sessionId` ngược về `sessionKey` vẫn chưa là public contract ổn định

## Thuật ngữ về update

| Thuật ngữ | Nghĩa | Owner / Boundary |
| --- | --- | --- |
| `update` | Thuật ngữ public ưu tiên cho việc cài package `clisbot` mới hơn và restart runtime. | Control CLI và release docs. |
| `manual migration` | Hành động operator bắt buộc khi update, vượt quá chuyện install, restart, status, và đọc release notes. | Chỉ thuộc migration docs. |

Hãy dùng `update` trong CLI help, tên folder, release docs, và wording hướng tới operator. Tránh dùng `upgrade` cho khái niệm sản phẩm này, trừ khi đang trích lịch sử cũ hoặc công cụ bên ngoài.

## Thuật ngữ định danh

| Thuật ngữ | Nghĩa | Ví dụ | Không dùng cho |
| --- | --- | --- | --- |
| `principal` | Chuỗi định danh auth chuẩn của clisbot cho người dùng hoặc identity có thể nhận role / permission. Đây là giá trị được auth commands nhận qua `--user`, và cũng là giá trị cho sender checks như `--sender` khi identity đó chính là người gửi message. | `telegram:1276408333`, `slack:U123` | Human display text, provider display name, CLI route target, từ tiếng Bạn `principle`. |
| `senderId` | Field trong message-context lưu `principal` của sender. Chỉ dùng khi identity đó chính là người gửi của message, queue item, steering input, hoặc loop. | `telegram:1276408333`, `slack:U123` | Docs auth tổng quát, khái niệm gán role không phải sender. |
| `providerId` | Raw provider-local id. | Slack user `U123`, Slack channel `C123`, Telegram chat `-100...`, Telegram topic `4335` | Auth principal, clisbot surface id. |
| `displayName` | Tên dễ đọc cho con người lấy từ provider/config. | `The Longbkit`, `workspace - clisbot`, `clisbot-streaming` | CLI target, auth principal, formatted prompt text. |
| `handle` | Username / handle của provider, không có mention formatting. | `longbkit` | Auth principal, display name, Slack mention syntax. |
| `sender display text` | Text hiển thị trong prompt, được ráp từ các field của sender. | `The Longbkit [telegram:1276408333, @longbkit]` | Field lưu trong directory, auth principal. |

## Principal format

`principal` là chuỗi auth identity ổn định dùng trong config và auth CLI commands.

Format:

```text
<platform>:<provider-user-id>
```

Prefix được hỗ trợ:

- `telegram`: Telegram user id. Ví dụ: `telegram:1276408333`.
- `slack`: Slack user id. Ví dụ: `slack:U123ABC456`.

Quy tắc:

- Principal của Telegram dùng numeric user id, không dùng handle. Dùng `telegram:1276408333`, không dùng `telegram:@longbkit`.
- Principal của Slack dùng Slack user id, thường là `U...` hoặc `W...`, không dùng display name hay cú pháp mention `<@U...>`.
- Principal có phạm vi theo platform. `telegram:1276408333` và `slack:U123ABC456` là hai identity khác nhau trừ khi về sau có tính năng link tường minh.
- Dùng `principal` cho các auth identity value trong public docs và CLI help.
- Chỉ dùng `senderId` khi principal đó chính là người gửi trong một message context.
- `principal` là thuật ngữ auth; còn `principle` là từ tiếng Bạn chỉ nguyên tắc hay niềm tin, không được dùng làm tên field / concept.

## Thuật ngữ về surface

| Thuật ngữ | Nghĩa | Ví dụ | Không dùng cho |
| --- | --- | --- | --- |
| `surfaceId` | Định danh surface chuẩn của clisbot. | `telegram:topic:-1003455688247:4335`, `slack:channel:C123` | Human display text, cú pháp target của CLI command. |
| `surfaceKind` | Hình dạng của surface. | `dm`, `channel`, `group`, `topic` | Tên type theo provider nếu chưa map. |
| `parentSurfaceId` | Canonical parent surface cho các surface lồng nhau như topic hoặc thread. | `telegram:group:-1003455688247` | Reply target tự thân khi thật ra phải target vào child surface. |
| `surface display text` | Text hiển thị trong prompt, ráp từ các field của surface. | `Telegram group "workspace - clisbot", topic "clisbot-streaming" [telegram:topic:-1003455688247:4335]` | Field lưu trong directory, CLI target. |
| `cliTarget` | Cú pháp target hướng tới command do CLI của clisbot dùng. | `group:-100...`, `topic:-100...:4335`, `channel:C123` | Directory display fields, provider ids, auth principal. |

## Hậu tố model

| Hậu tố | Nghĩa |
| --- | --- |
| `Record` | Durable serialized storage shape. |
| `State` | Owned lifecycle state. |
| `Input` | Payload do caller cung cấp. |
| `Context` | Prompt/rendering input được ráp cho một use case cụ thể. |
| `Binding` | Liên kết đã lưu tới external surface hoặc runner target để dùng về sau. |
| `Result` | Kết quả ổn định được trả về. |

## Quy tắc đặt tên

- Ưu tiên dùng các thuật ngữ trong glossary này thay vì dùng synonym.
- Dùng `principal` cho canonical auth identity values trong public docs, prompt contracts, và CLI help.
- Không dùng `label` cho identity hoặc surface field đã lưu. Dùng `displayName` cho các tên dễ đọc từ provider/config, hoặc render explicit prompt display text ở boundary.
- Không lưu formatted prompt text trong directory record.
- Không lưu CLI target syntax trong directory record.
- Không lưu mention syntax như Slack `<@U...>` trong prompt context hoặc directory record.
- Nếu field lưu canonical auth identity format theo nghĩa tổng quát, ưu tiên `principal`.
- Nếu field lưu identity của người gửi hiện tại, ưu tiên `senderId`.
- Nếu field là raw platform id, ưu tiên `providerId`.
- Nếu field là canonical route / surface id của clisbot, ưu tiên `surfaceId`.
- Nếu field chỉ để con người đọc, ưu tiên `displayName`.
