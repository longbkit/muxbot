[English](../../../../features/channels/transcript-visibility-and-verbose-levels.md) | [Tiếng Việt](./transcript-visibility-and-verbose-levels.md)

# Transcript Visibility And Verbose Levels

## Tóm tắt

Transcript visibility hiện được điều khiển bằng route-level `verbose` policy thay cho `privilegeCommands`.

Các mức hiện tại:

- `off`
- `minimal`

## Trạng thái

Done

## Contract hiện tại

Quyền sở hữu config chính thức hiện đã chuyển về gốc `bots`.

Feature này vẫn mô tả cùng một behavior `verbose`, nhưng path config đang vận hành nằm dưới `bots`, không còn dưới `channels`.

## Vì sao

`/transcript` không cùng loại hành động với `/bash`.

Transcript inspection chủ yếu là monitoring surface. Bắt nó đi qua privilege approval sẽ tạo ma sát không cần thiết, nhất là ở các route operator-owned bình thường, nơi người dùng chỉ cần nhìn nhanh run đang làm gì.

Tách như sau sẽ sạch hơn:

- `verbose` quyết định `clisbot` lộ bao nhiêu cho monitoring
- agent auth tiếp tục chặn các hành động thật sự đặc quyền như `/bash`

## Quy tắc sản phẩm

- `verbose: "off"` tắt `/transcript`
- `verbose: "minimal"` bật `/transcript`
- mặc định Slack và Telegram ở top level là `verbose: "minimal"`
- route override có thể đặt `verbose: "off"` nơi monitoring cần bị ẩn
- `/bash` vẫn phụ thuộc vào `shellExecute` đã resolve

## Config shape

Hỗ trợ tại:

- `bots.slack.defaults.verbose`
- `bots.slack.<botId>.groups["<channelId>"].verbose`
- `bots.slack.<botId>.groups["<groupId>"].verbose`
- `bots.slack.<botId>.directMessages["*"].verbose`
- `bots.telegram.defaults.verbose`
- `bots.telegram.<botId>.groups."<chatId>".verbose`
- `bots.telegram.<botId>.groups."<chatId>".topics."<topicId>".verbose`
- `bots.telegram.<botId>.directMessages["*"].verbose`

Ví dụ:

```json
{
  "bots": {
    "slack": {
      "defaults": {
        "verbose": "minimal"
      },
      "default": {
        "groups": {
          "channel:C1234567890": {
            "verbose": "off"
          }
        }
      }
    }
  }
}
```

## Truthfulness cho operator

Status surface nên hiện giá trị `verbose` đang active để operator giải thích được vì sao `/transcript` đang có hay bị chặn.

Detached-run fallback text cũng không nên mặc định bảo người dùng chạy `/transcript`, vì có route cố tình tắt nó.

## Exit criteria

- `/transcript` theo `verbose`, không theo auth
- `/bash` vẫn theo `shellExecute` đã resolve
- Slack và Telegram route inheritance hỗ trợ `verbose` ở top level
- help, status, và whoami surface hiện policy đang active rõ ràng
- regression test phủ cả `verbose: "off"` và `verbose: "minimal"`
