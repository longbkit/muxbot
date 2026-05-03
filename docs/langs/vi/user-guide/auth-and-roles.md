[English](../../../user-guide/auth-and-roles.md) | [Tiếng Việt](./auth-and-roles.md)

# Quyền truy cập và vai trò

## Cách hiểu nhanh

Có hai câu hỏi tách biệt:

1. người này có được chạm tới bot trên ngữ cảnh chat này hay không?
2. nếu đã chạm tới được, họ được chạy những lệnh nào?

Trong `clisbot`:

- việc được vào ngữ cảnh chat hay không do policy của DM hoặc shared route quyết định
- mức đặc quyền của lệnh do app auth và agent auth quyết định

## Quyền vào ngữ cảnh chat

### Ngữ cảnh chat dùng chung

- `disabled` nghĩa là tắt hẳn và im lặng hoàn toàn
- ngữ cảnh chat dùng chung đã bật có thể dùng `open` hoặc `allowlist`
- `allowUsers` và `blockUsers` được kiểm tra trước khi message đi vào runner
- nếu allowlist từ chối một sender, bot sẽ trả lời:

`You are not allowed to use this bot in this group. Ask a bot owner or admin to add you to \`allowUsers\` for this surface.`

### Hành vi của owner/admin

- app `owner` và app `admin` vẫn có thể dùng ngữ cảnh chat dùng chung đã bật ngay cả khi allowlist sẽ chặn người dùng thường
- `blockUsers` vẫn là lớp chặn cuối cùng
- `disabled` vẫn thắng

### Ngữ cảnh chat DM

- wildcard mặc định của DM nằm ở `directMessages["*"]`
- thao tác duyệt pairing sẽ ghi vào wildcard DM route của đúng bot đã nhận yêu cầu đó
- exact DM route có thể mang override riêng theo từng người khi cần

## Bất biến

- policy cho ngữ cảnh chat trả lời câu hỏi "principal này có được vào ngữ cảnh chat này hay không"
- auth role trả lời câu hỏi "sau khi đã vào được, họ được làm gì"
- owner/admin không bypass admission của `groupPolicy`/`channelPolicy`; chỉ sau khi group đã được admit và bật thì họ mới bypass sender allowlist
- owner/admin không bypass `disabled`
- owner/admin không bypass `blockUsers`
- deny text cố ý dùng từ `group` làm từ chung cho ngữ cảnh chat nhiều người

## Vai trò

Vai trò ở cấp app hiện có:

- `owner`
- `admin`
- `member`

Vai trò ở cấp agent hiện có:

- `admin`
- `member`

Hành vi quan trọng hiện tại:

- app `owner` và app `admin` tự bypass DM pairing
- app `owner` và app `admin` tự thỏa điều kiện kiểm tra agent-admin
- `principal` là định dạng identity của auth theo kiểu `<platform>:<provider-user-id>`
- principal luôn gắn theo nền tảng, ví dụ `telegram:1276408333` hoặc `slack:U123ABC456`
- dùng `--user <principal>` khi gán role hoặc permission cho một người
- dùng `--sender <principal>` khi cần kiểm tra effective permission của người đang gửi message

## Các lệnh thường dùng

```bash
clisbot auth show app
clisbot auth show agent-defaults
clisbot auth get-permissions --sender telegram:1276408333 --agent default --json
clisbot auth add-user app --role owner --user telegram:1276408333
clisbot auth add-user app --role admin --user slack:U123ABC456
clisbot auth add-user agent --agent support --role admin --user slack:UOPS1
clisbot auth add-permission agent-defaults --role member --permission transcriptView
clisbot auth remove-permission agent-defaults --role member --permission shellExecute
```

## Claim owner đầu tiên

Runtime rule:

- nếu lúc runtime khởi động chưa có owner nào, cửa claim owner sẽ mở trong `ownerClaimWindowMinutes`
- tin nhắn DM đầu tiên thành công trong cửa sổ đó sẽ trở thành app `owner`
- ngay khi đã có owner, cửa claim sẽ đóng lại

## Mặc định an toàn trong thực tế

- giữ các lệnh nguy hiểm ở lớp auth, đừng nhét chúng vào surface allowlist
- dùng policy cho ngữ cảnh chat để trả lời "ai được nói chuyện ở đây"
- dùng auth role để trả lời "sau khi vào được rồi, họ được làm gì"
- với hành động nhạy cảm, dùng `clisbot auth get-permissions --sender <principal> --agent <id> --json` để kiểm tra quyền hiệu lực theo kiểu chỉ-đọc
- dùng `disabled` khi bạn cần chắc chắn không ai nhận được phản hồi ở đó

## Tài liệu liên quan

- [Phân quyền](../features/auth/README.md)
- [Routes và ngữ cảnh chat](./channels.md)
- [Chuẩn hóa cấu trúc policy cho ngữ cảnh chat và tương thích 0.1.43](../../../tasks/features/configuration/2026-04-24-surface-policy-shape-standardization-and-0.1.43-compatibility.md)
