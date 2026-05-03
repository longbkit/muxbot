[English](../../../architecture/surface-architecture.md) | [Tiếng Việt](./surface-architecture.md)

# Kiến trúc ngữ cảnh chat

## Trạng thái

Tài liệu tham chiếu kiến trúc đang áp dụng

## Mục đích

Tài liệu này định nghĩa ranh giới giữa:

- user-facing channels
- operator-facing control surfaces
- route / thread / topic behavior
- transcript visibility
- rendering và reply policy

## Quy tắc cốt lõi

`channels` sở hữu những gì người dùng thực sự nhìn thấy và cách message đi vào hay reply đi ra trên từng surface.

`control` sở hữu những gì operator dùng để inspect hoặc can thiệp vào runtime.

Hai ngữ cảnh chat đó có thể đọc cùng canonical data, nhưng không được gộp thành một contract.

## Channels

Channels là các ngữ cảnh chat với người dùng như:

- Slack
- Telegram
- các API / Discord surface về sau

Channels sở hữu:

- nhận inbound message
- route message vào đúng conversation
- render output theo kiểu chat-first
- các quy tắc thread / topic / reply
- message-level affordance như command, attachment, reaction, hoặc edit transport

Channels không sở hữu:

- session continuity truth
- run lifecycle truth
- backend protocol quirks

## Route rule

Channel route là route truth, không phải session truth.

Điều đó nghĩa là:

- Slack thread hay Telegram topic là route-specific surface
- route đó có thể map vào một `sessionKey`
- nhưng route identity và session identity không được coi là một

## Failure boundary của channel

- lỗi transport ở channel phải được giữ cục bộ trong surface đó
- một lần edit, post, reaction, typing cue, hay status decoration bị lỗi không được tự mình làm chết active run bên dưới
- channel có thể retry, degrade một observer, hoặc rơi về final-only delivery, nhưng không được tự định nghĩa lại run truth

## Quy tắc rendering của channel

Tương tác thông thường nên theo kiểu chat-first.

Điều này có nghĩa:

- chỉ stream phần meaningful new content trong tương tác bình thường
- mặc định ẩn repeated runner chrome
- settle mỗi interaction thành một câu trả lời sạch để người dùng đọc

Full session visibility vẫn nên có, nhưng chỉ qua explicit transcript request command.

Hành vi của command đó là concern của channel, kể cả khi dữ liệu gốc đến từ tmux.

Khi live rendering tạm thời lỗi:

- run vẫn tiếp tục dưới sự giám sát của runner
- channel có thể lỡ intermediate update
- channel nên phục hồi ở lần delivery thành công sau khi hợp lý
- kiến trúc này ưu tiên degraded user-visible delivery hơn là giết process hoặc báo sai rằng run đã fail

## Control

`control` là giao diện hướng tới operator.

Control sở hữu:

- inspect state
- attach vào session
- restart hoặc stop session
- phơi bày thông tin health và debug
- tiêu thụ quyết định auth cho các lần check phía operator

Control không được hành xử như một user-facing conversation channel.

## Chuẩn test

Surface tests nên xác minh:

- exact visible output mà user hoặc operator sẽ thấy
- hành vi thread và reply
- rendering mặc định theo kiểu chat-first
- explicit transcript request behavior khi có hỗ trợ
- sự tách biệt giữa user channel và control action
