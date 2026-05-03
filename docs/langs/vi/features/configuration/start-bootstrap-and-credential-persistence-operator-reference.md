[English](../../../../features/configuration/start-bootstrap-and-credential-persistence-operator-reference.md) | [Tiếng Việt](./start-bootstrap-and-credential-persistence-operator-reference.md)

# Start Bootstrap And Credential Persistence Operator Reference

Tài liệu đồng hành này giữ các command ví dụ cụ thể và operator guardrail bổ sung cho feature contract chính.

## Các tình huống start nhiều channel

### Trường hợp A: chỉ Telegram

```bash
clisbot start \
  --telegram-bot-token TELEGRAM_BOT_TOKEN \
  --bot-type personal
```

Kết quả:

- chỉ bootstrap Telegram
- Slack vẫn disabled

### Trường hợp B: chỉ Slack

```bash
clisbot start \
  --slack-app-token SLACK_APP_TOKEN \
  --slack-bot-token SLACK_BOT_TOKEN \
  --bot-type personal
```

Kết quả:

- chỉ bootstrap Slack
- Telegram vẫn disabled

### Trường hợp C: Slack và Telegram cùng lúc

```bash
clisbot start \
  --slack-app-token SLACK_APP_TOKEN \
  --slack-bot-token SLACK_BOT_TOKEN \
  --telegram-bot-token TELEGRAM_BOT_TOKEN \
  --bot-type personal
```

Kết quả:

- bootstrap cả hai channel
- mỗi default account tự lưu trạng thái credential source của nó

### Trường hợp D: thêm channel thứ hai về sau

Điểm xuất phát:

- `clisbot` đã được cấu hình và đang chạy với Telegram

Sau đó operator có Slack token và chạy:

```bash
clisbot start \
  --slack-app-token SLACK_APP_TOKEN \
  --slack-bot-token SLACK_BOT_TOKEN
```

Kết quả mục tiêu:

- giữ nguyên Telegram setup hiện tại
- bật và cấu hình Slack
- không disable Telegram
- không âm thầm rebind các route không liên quan

### Trường hợp E: thêm named account cho channel đang có

Điểm xuất phát:

- `clisbot` đã có Telegram `default` và đang chạy

```bash
clisbot start \
  --telegram-account alerts \
  --telegram-bot-token TELEGRAM_ALERTS_BOT_TOKEN
```

Kết quả mục tiêu:

- giữ nguyên `telegram/default`
- thêm `telegram/alerts`
- nếu runtime đang chạy, reconcile state của Telegram provider và bật account mới ngay khi hợp lệ

## Lệnh persistence

### `clisbot bots add --persist` và `clisbot bots set-credentials --persist`

Hãy dùng chính các lệnh credential để nâng một credential đang chạy tốt trong memory lên thành durable storage.

Ví dụ:

```bash
clisbot bots add --channel telegram --bot default --bot-token TELEGRAM_BOT_TOKEN --persist
clisbot bots add --channel slack --bot default --app-token SLACK_APP_TOKEN --bot-token SLACK_BOT_TOKEN --persist
clisbot bots set-credentials --channel telegram --bot default --bot-token "$TELEGRAM_BOT_TOKEN" --persist
```

Target behavior:

- ghi secret vào canonical credential file
- update config để bot chuyển sang file-backed
- in summary ngắn, không lộ secret

Ví dụ summary:

- `Added telegram/default, persisted=tokenFile, runtime=not-running`

### `clisbot start --persist`

Vì tiện dụng, `start --persist` nên tự làm cùng việc nâng cấp đó cho các account được bootstrapped bằng literal CLI input trong chính lần gọi này.

Ví dụ:

```bash
clisbot start \
  --telegram-bot-token "$TELEGRAM_BOT_TOKEN" \
  --bot-type personal \
  --persist
```

Target behavior:

- dùng token ngay cho startup
- persist vào canonical credential file trước khi bootstrap kết thúc
- update config từ `credentialType: "mem"` sang `credentialType: "tokenFile"`
- chỉ in storage summary ngắn

Nếu persist lỗi:

- startup phải báo lỗi persist rõ ràng
- nhưng runtime vẫn có thể dùng in-memory credential cho process hiện tại nếu startup đã thành công và user không yêu cầu fail-hard

### `clisbot bots add`

Surface riêng cho proactive bot management:

```bash
clisbot bots add --channel telegram --bot alerts --bot-token TELEGRAM_ALERTS_BOT_TOKEN
clisbot bots add --channel slack --bot ops --app-token SLACK_OPS_APP_TOKEN --bot-token SLACK_OPS_BOT_TOKEN
```

Quy tắc:

- token parsing giống `start`
- raw token input thành `mem` trừ khi có `--persist`
- env name hoặc `${ENV_NAME}` vẫn là env-backed
- nếu có `--persist` với raw input, ghi canonical credential file và đổi config sang `credentialType: "tokenFile"`
- nếu có `--persist` với env-backed input, vẫn giữ env-backed, không copy secret vào file
- nếu runtime chưa chạy, raw input hiện tại bắt buộc có `--persist`; nếu không thì `bots add` phải từ chối

Nếu runtime đang chạy:

- thêm bot vào config
- reload hoặc reconcile provider liên quan
- start bot mới ngay nếu validate thành công
- in status summary ngắn

Ví dụ:

- `Added telegram/alerts, persisted=tokenFile, runtime=started`
- `Added slack/ops, persisted=env, runtime=started`
- `Added telegram/alerts, persisted=mem, runtime=failed (missing route binding)`

## UX guardrail

- không bao giờ ghi inline literal token vào generated config
- không hỗ trợ raw channel token literal trong `clisbot.json`
- không phản chiếu token value ra terminal
- startup output phải nói credential source nào được dùng
- first-run success output nên gợi ý luôn đường persist ưu tiên
- nếu operator chạy bằng literal token, `status` phải nói credential đó là tạm thời và sẽ mất sau restart
- nếu mem account hết hạn, `stop` và cold `start` kế tiếp phải tự disable nó
- nếu canonical credential-file discovery được dùng, `status` nên hiện path đã resolve
- config cũng phải nói thật điều này qua `credentialType: "tokenFile"`
- không auto-bootstrap channel từ ambient env nếu user không explicit yêu cầu
- account-add và account-persist flow nên in kết quả ngắn, dễ hiểu, không lộ secret

## Không nằm trong phạm vi

- general secret-provider support ở phase 1
- mặc định mã hóa Telegram token file
- interactive secret prompt
- shortcut ghi secret vào config để tiện tay

## Tài liệu liên quan

- [Start Bootstrap And Credential Persistence](./start-bootstrap-and-credential-persistence.md)
- [Configuration](./README.md)
- [Bots And Credentials](../../user-guide/bots-and-credentials.md)
- [Start First-Run Bootstrap And Token Gating](../../../../tasks/features/configuration/2026-04-07-start-first-run-bootstrap-and-token-gating.md)
- [Telegram credential security research](../../../../research/security/2026-04-12-openclaw-telegram-credential-security-and-setup.md)
