[English](../../../../features/configuration/start-bootstrap-and-credential-persistence.md) | [Tiếng Việt](./start-bootstrap-and-credential-persistence.md)

# Start Bootstrap And Credential Persistence

## Ghi chú lịch sử

Feature doc này ghi lại direction thiết kế và rollout slice đã dẫn tới bootstrap behavior hiện tại.

Contract sản phẩm đang chạy bây giờ dùng `bots`, `routes`, và `bots-and-credentials.md`.

Nếu command syntax cụ thể trong tài liệu này khác với CLI help hiện tại, hãy tin CLI và user guide hiện tại.

## Tóm tắt

Direction này làm cho setup channel ở lần chạy đầu rất nhanh mà không bình thường hóa raw secret vào config file.

Target operator experience:

```bash
clisbot start \
  --telegram-bot-token 123456:telegram-bot-token \
  --bot-type personal
```

```bash
clisbot start \
  --slack-app-token SLACK_APP_TOKEN \
  --slack-bot-token SLACK_BOT_TOKEN \
  --bot-type personal
```

```bash
clisbot start \
  --slack-app-token SLACK_APP_TOKEN_WORK \
  --slack-bot-token SLACK_BOT_TOKEN_WORK \
  --telegram-bot-token TELEGRAM_BOT_TOKEN \
  --bot-type personal
```

```bash
clisbot start \
  --telegram-account default \
  --telegram-bot-token TELEGRAM_BOT_TOKEN \
  --telegram-account alerts \
  --telegram-bot-token TELEGRAM_ALERTS_BOT_TOKEN \
  --slack-account default \
  --slack-app-token SLACK_APP_TOKEN \
  --slack-bot-token SLACK_BOT_TOKEN \
  --bot-type personal
```

Các command này nên đủ để thử ngay các channel mà người dùng thật sự yêu cầu.

Inline token được xem là bootstrap secret chỉ sống trong memory cho lần launch đó.

Sau khi người vận hành xác nhận mọi thứ chạy ổn, `clisbot` nên hướng họ sang một nguồn secret có persist.

Thứ tự persistence ưu tiên:

1. credential file canonical dưới `~/.clisbot/credentials/...`
2. env variable
3. external secret provider như Vault hoặc 1Password ở giai đoạn sau

## Phạm vi

- first-run bootstrap explicit dựa trên flag truyền vào, không auto-detect từ ambient env
- one-line `clisbot start` cho bootstrap Slack và Telegram
- literal token support trên `--telegram-bot-token`, `--slack-app-token`, `--slack-bot-token`
- in-memory bootstrap credential không bị ghi ngược vào config
- canonical credential file discovery cho bot đã cấu hình
- `tokenFile` override khi operator cần path không chuẩn
- config state explicit để operator biết credential source nào đang active
- status surface giải thích credential source đang active là gì
- `.gitignore` mặc định cho thư mục credentials
- `clisbot bots add ... --persist`, `clisbot bots set-credentials ... --persist`, và `clisbot start --persist`
- repeated account block trong cùng một command `start`
- `clisbot bots add` dùng cùng token-input rule như `start`
- config example cho một bot mặc định và nhiều bot

## Vì sao

Setup hiện tại vẫn bắt người dùng phải nghĩ về secret persistence quá sớm.

Điều đó đi ngược onboarding.

Hình dạng tốt hơn là:

1. cho người dùng chứng minh hệ thống chạy được bằng một command
2. mặc định không biến secret đó thành config sống lâu
3. có đường nâng cấp rõ ràng sang credential storage bền
4. không bootstrap channel chỉ vì môi trường shell tình cờ có sẵn token

## Quy tắc bootstrap intent

Bootstrap mới phải chỉ dựa trên explicit intent.

Nghĩa là:

- chỉ truyền Telegram flag thì chỉ bootstrap Telegram
- chỉ truyền Slack flag thì chỉ bootstrap Slack
- truyền cả hai thì bootstrap cả hai
- nếu lặp account block cho một channel thì bootstrap từng account hợp lệ được yêu cầu
- nếu shell env có thêm token khác nhưng user không truyền, `clisbot` không được tự bật thêm channel

Điều này cố ý đổi direction từ “auto dùng token tìm thấy trong env” sang “chỉ bootstrap thứ người vận hành đã yêu cầu”.

## Cú pháp account block

`start` cần hỗ trợ cả shorthand cho account mặc định lẫn multi-account block explicit.

### Shorthand account mặc định

Nếu token flag xuất hiện trước khi channel đó có account selector, nó áp cho account `default`.

### Explicit account block

Quy tắc parser:

- mỗi token flag áp vào open account block gần nhất của cùng channel
- nếu channel đó chưa có block nào, mở implicit account `default`
- Telegram block cần đúng một bot token
- Slack block cần cả app token lẫn bot token
- trùng account id trong cùng một command là lỗi
- block không đầy đủ là lỗi

### Đường first-run nhanh nhất

`clisbot start --telegram-bot-token <literal-token>` có nghĩa:

- chấp nhận literal token làm bootstrap secret một lần
- chỉ dùng cho launch hiện tại
- không in token trở lại
- không persist token vào `~/.clisbot/clisbot.json`
- không echo token ra status, log, hay remediation output

Khi mode này active, config vẫn phải hiện state:

```json
{
  "channels": {
    "telegram": {
      "defaultAccount": "default",
      "accounts": {
        "default": {
          "enabled": true,
          "credentialType": "mem",
          "dmPolicy": "pairing"
        }
      }
    }
  }
}
```

Ý nghĩa:

- account đang được bootstrapped bằng credential chỉ sống trong memory
- restart sẽ cần token mới hoặc nguồn persist khác
- config vẫn nói thật tình trạng mà không lưu token thô

### Đường persist ưu tiên

Telegram bot token nên được persist vào credential store canonical:

```text
~/.clisbot/credentials/telegram/<accountId>/bot-token
```

Quy tắc:

- nội dung file là raw token text
- một token cho một file
- file thuộc về service user
- quyền file nên chặt, ví dụ `600`
- config nên ghi `credentialType: "tokenFile"` kể cả khi path là canonical implicit default

### Đường env

Env variable vẫn được hỗ trợ vì hợp với shell, systemd, container, và thói quen operator đang có.

Naming direction nên là:

- account mặc định: `TELEGRAM_BOT_TOKEN`
- account đặt tên: `TELEGRAM_BOT_TOKEN_<ACCOUNT_ID_UPPER_SNAKE>`

## Semantics của CLI input

`clisbot` chỉ nhận những gì shell đã truyền vào `argv`.

Vì vậy các dạng dưới đây không tương đương nhau:

- `--telegram-bot-token "$TELEGRAM_BOT_TOKEN"`
  - shell expand trước
  - `clisbot` nhận giá trị token thật
  - cần xem nó là literal token, tức credential source `mem`
- `--telegram-bot-token TELEGRAM_BOT_TOKEN`
  - `clisbot` nhận đúng chuỗi tên env
  - cần xem đó là env reference
- `--telegram-bot-token '${TELEGRAM_BOT_TOKEN}'`
  - shell không expand
  - `clisbot` nhận placeholder string
  - cần normalize thành env-backed input

Behavior hiện tại của `clisbot`:

- hỗ trợ env-name input và `${ENV_NAME}`
- normalize chúng thành config placeholder
- chưa hỗ trợ đầy đủ literal token mode trên các flag này
- chưa hỗ trợ repeated multi-account block trong cùng `start`

Target behavior sau feature này:

- plain env name và `${ENV_NAME}` vẫn là env-backed
- expanded value như `"$TELEGRAM_BOT_TOKEN"` trở thành `mem`
- raw literal token gõ trực tiếp cũng trở thành `mem`

## Quy tắc resolve

Thứ tự precedence cho một account:

1. in-memory bootstrap token từ lần gọi CLI hiện tại
2. account-level explicit `tokenFile`
3. canonical credential file theo account id
4. account-level explicit env reference

Điểm triển khai quan trọng:

- `credentialType: "mem"` giữ secret ở ngoài `clisbot.json`
- cold `clisbot start` inject mem credential vào runtime process environment thay vì ghi xuống đĩa
- mem credential chỉ sống theo process, không qua được `stop`, `restart`, hay fresh runtime launch
- `clisbot stop` và cold `start` kế tiếp phải sanitize mem account đã hết hạn bằng cách disable chúng trong config
- startup phải nói rõ token tới từ `cli`, `tokenFile`, canonical credential store, hay `env`
- thiếu credential file đã cấu hình phải fail closed
- raw channel token literal trong `clisbot.json` là không được hỗ trợ

## Config shape

Config nên tiếp tục mô tả account, routing, và credential-source state, chứ không lưu raw secret.

Ví dụ:

- Telegram only: Telegram enabled, `credentialType: "mem"` hoặc `tokenFile`, Slack disabled
- Slack only: Slack enabled, Telegram disabled
- Slack + Telegram: mỗi kênh giữ credential-source state riêng
- repeated account blocks: mỗi account hiện rõ đang `mem`, `env`, hay `tokenFile`
- canonical credential file: config chỉ cần nói bot là file-backed, không nhất thiết phải nhét path explicit trong trường hợp chuẩn
- custom path: vẫn cho phép `tokenFile` explicit khi operator thật sự cần

### Credentials directory safety file

Thư mục credentials canonical nên có `.gitignore` mặc định:

```text
~/.clisbot/credentials/.gitignore
```

Nội dung gợi ý:

```gitignore
*
!*/
!.gitignore
```

Mục tiêu là làm việc commit nhầm secret khó xảy ra hơn.

## Operator reference

Command cookbook và guardrail ở phía operator được giữ trong tài liệu đồng hành:

- [Start Bootstrap And Credential Persistence Operator Reference](./start-bootstrap-and-credential-persistence-operator-reference.md)
