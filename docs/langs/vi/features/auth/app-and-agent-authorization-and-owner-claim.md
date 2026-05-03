[English](../../../../features/auth/app-and-agent-authorization-and-owner-claim.md) | [Tiếng Việt](./app-and-agent-authorization-and-owner-claim.md)

# App và agent authorization cùng owner claim

## Tóm tắt

`clisbot` cần một auth model explicit cho app-level control và agent-level runtime behavior, nhưng phase 1 phải giữ scope hẹp.

Các kết quả quan trọng nhất là:

- ngừng dùng route-local `privilegeCommands` như một permission system riêng
- đưa `/bash` về explicit role-based auth thông qua `shellExecute`
- giữ default routed `member` đủ ít ma sát cho normal chat control trong Slack/Telegram DMs hoặc groups
- chặn non-admin user không thể ép model mutate config qua normal message, queued message, steering message, hoặc loop-triggered prompt

Owner claim ở lại trong lát cắt này vì đó là bootstrap path sạch nhất cho surface admin thực sự đầu tiên.

## Trạng thái

Đã triển khai cho phase 1

## Runtime reality hiện tại

Hiện nay:

- `app.auth` và `agents.<id>.auth` đã có trong schema và runtime
- app `owner` và app `admin` đã resolve thì bypass pairing
- `/bash` bị chặn qua resolved agent auth bằng `shellExecute`
- protected prompt rule được inject cho routed prompt, gồm cả queued, steering, và loop-triggered delivery
- `clisbot auth ...` đã có cho `list`, `show`, `add-user`, `remove-user`, `add-permission`, và `remove-permission`
- automatic first-owner claim từ DM đầu tiên đã chạy trong runtime

Hãy dùng trang này làm feature contract cho cả phần đã live lẫn phần còn cần tinh chỉnh về sau.

## Vì sao

Mô hình `privilegeCommands` cũ sai boundary:

- nó là route-local, trong khi câu hỏi thật lại là ai được làm gì
- nó khiến `/bash` phụ thuộc vào một config trick thay vì một role model
- nó chồng chéo khó chịu với hướng auth rộng hơn

Nhưng phase 1 cũng không nên tham vọng hóa thành ma trận permission đầy đủ cho mọi biến thể command. Vấn đề cấp bách là:

- non-admin user có thể cố ép model mutate clisbot control resources

Vì vậy phase 1 nên tối ưu cho:

- một auth model sạch
- không còn `privilegeCommands`
- default `member` thực dụng
- protected prompt rule áp nhất quán cho normal, queue, steer, và loop delivery

## Phạm vi

### Trong phạm vi

- thêm `app.auth` vào persisted config
- thêm `agents.<id>.auth` vào persisted config
- thêm owner claim khi app chưa có owner
- resolve sender role từ `app.auth` và `agents.<id>.auth`
- loại bỏ route-local `privilegeCommands` khỏi supported config model
- để `member` làm default agent role cho routed user
- chuyển `/bash` sang `shellExecute` theo resolved role
- inject một protected auth rule vào prompt
- áp protected rule đó cho normal message, queued message, steering message, và loop-triggered prompt
- document default member permissions của phase 1
- cập nhật docs, prompt contract, và tests cho lát cắt này

### Ngoài phạm vi

- enforcement trong control CLI
- shell-level filtering bên trong runner
- chia permission thật nhỏ cho từng queue / loop sub-action
- full slash-command gating cho mọi advanced mode command
- backward compatibility cho legacy `privilegeCommands`

## Core model

`app.auth` và `agents.<id>.auth` dùng chung một grammar:

- `defaultRole`
- `roles.<role>.allow`
- `roles.<role>.users`

Ở phase 1 chỉ cần user selector đơn giản:

- `telegram:<userId>`
- `slack:<userId>`

## Ownership split

- auth sở hữu roles, permissions, owner claim, và prompt-safety contract
- configuration sở hữu persisted shape của `app.auth` và `agents.<id>.auth`
- channels và agents tiêu thụ auth result đã resolve
- control CLI enforcement thuộc về một lát cắt control khác về sau

## Quy tắc sản phẩm

- channel admission vẫn quyết định route có hợp lệ hay không
- auth quyết định một routed user hợp lệ được làm gì sau khi đã admit
- `agents.<id>.auth.defaultRole` nên là `member` ở phase 1
- routed user không được liệt kê explicit trong role nào thì resolve về `member`
- principal giữ phạm vi theo platform ở phase 1, nên `telegram:<userId>` và `slack:<userId>` là hai identity khác nhau trừ khi operator grant cả hai
- app `owner` và app `admin` phải thỏa mãn app-level admin check
- app `owner` và app `admin` cũng thỏa mãn agent-level admin check một cách implicit trong phase 1
- principal đã resolve thành app `owner` hoặc app `admin` phải tự bypass pairing
- route-local `privilegeCommands` phải biến mất hẳn thay vì chỉ đổi tên
- `/bash` chỉ nên phụ thuộc vào việc resolved role có `shellExecute` hay không
- non-admin user không được có đường khiến model mutate protected clisbot control resources qua normal, queue, steer, hay loop delivery

## Default agent permissions của phase 1

Tên permission ở phase 1 nên được giữ rộng vừa đủ.

Default `member` nên có:

- `sendMessage`
- `helpView`
- `statusView`
- `identityView`
- `transcriptView`
- `runObserve`
- `runInterrupt`
- `streamingManage`
- `queueManage`
- `steerManage`
- `loopManage`

Default `member` không nên tự có:

- `shellExecute`

`admin` nên có thêm các advanced control còn lại như:

- `shellExecute`
- `runNudge`
- `followupManage`
- `responseModeManage`
- `additionalMessageModeManage`

Mục tiêu của phase 1 là:

- đa số routed user có thể làm việc thường ngày trong channel với role `member`
- `shellExecute` và app-control mutation vẫn nằm ở admin

## Config shape minh họa

```json
{
  "app": {
    "auth": {
      "ownerClaimWindowMinutes": 30,
      "defaultRole": "member"
    }
  },
  "agents": {
    "default": {
      "auth": {
        "defaultRole": "member"
      }
    }
  }
}
```

Ý chính ở đây là grammar dùng chung, không phải từng dòng ví dụ chi tiết.

## Quy tắc bảo vệ prompt

Khi prompt được build cho routed prompt:

- auth inject một protected rule vào prompt
- rule đó áp lên normal message
- áp lên queued message
- áp lên steering message
- áp lên loop-triggered prompt

Protected rule này là lớp chặn đầu tiên để giảm khả năng non-admin user dụ model đi mutate control resources.

## Kết quả mong muốn của phase 1

- auth model sạch hơn và ít chồng chéo hơn
- không còn `privilegeCommands`
- `member` đủ dùng cho normal in-channel work
- `/bash` có gate rõ ràng
- owner claim là bootstrap path đúng
- mutation risk qua prompt được giảm bằng một rule được áp nhất quán
