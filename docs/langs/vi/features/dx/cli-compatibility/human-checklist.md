[English](../../../../../features/dx/cli-compatibility/human-checklist.md) | [Tiếng Việt](./human-checklist.md)

# Checklist con người cho tương thích CLI thật

## Trạng thái

Source of truth input

## Mục đích

File này giữ nguyên những mối lo của người vận hành dưới dạng checklist để con người đọc.

Nó nên bám sát nghĩa gốc, không nên bị viết lại thành contract triển khai.

Hãy dùng nó như checklist nền để kiểm tra contract capability, giao diện `probe`, luồng `watch`, và các đợt kiểm chứng CLI thật.

## Ưu tiên hiện tại

- ưu tiên kiểm chứng CLI thật trước công việc với CLI giả lập
- output vẫn phải dễ đọc với con người, không chỉ có JSON
- tối ưu cho việc biết nhanh sự thật về tính tương thích, state capture, và khoảng trống ổn định

## Checklist

### Độ ổn định ở lần khởi động đầu

- lần launch đầu trong một workspace hoàn toàn mới có thể thiếu ổn định vì nhiều CLI sẽ hỏi workspace có được trust hay không
- hệ thống phải làm cho startup blocker này nhìn thấy được và đo được, thay vì gộp nó vào một lỗi chung chung

### Độ lệch phiên bản và luồng cập nhật

- nâng phiên bản CLI có thể mang instability tới mà không báo trước
- phiên bản mới có thể hiện update notice, chạy update path, hoặc thoát sau update
- hệ thống phải giúp chỉ ra khi vấn đề đến từ lệch phiên bản phía upstream, không phải từ luồng ứng dụng của ta

### Thu thập session id

- Claude Code dễ hơn vì có thể truyền session id từ đầu
- các CLI khác có thể không làm được như vậy, nên workaround hiện tại phải trigger `/status` rồi đọc session id từ output
- workaround này mặc định chưa đủ ổn định vì còn phụ thuộc:
  - `/status` có thật sự được kích hoạt đúng không
  - output format còn khớp parser hay không
  - cần retry bao nhiêu lần trước khi session id hiện ra

### Phát hiện trạng thái sẵn sàng

- state inference quan trọng ngay từ lúc CLI vừa start
- hệ thống phải biết khi nào CLI thật sự sẵn sàng nhận prompt được paste vào
- chất lượng detect nên được đánh giá bằng:
  - false positive rate
  - false negative rate
  - detection latency
- kể cả phát hiện đúng, phát hiện chậm vẫn làm trải nghiệm vận hành tệ đi

### Chuyển trạng thái khi chạy

- sau khi submit prompt, hệ thống phải phản ánh đúng chuyển trạng thái từ `idle` sang `processing` rồi tới `complete`
- trong một lần chạy trực tiếp, việc gửi steering message có thể làm hành vi giao diện thay đổi và lộ ra thêm instability
- hệ thống phải kiểm tra xem state inference có còn đúng trong lúc steering đang diễn ra không

### Độ ổn định khi dán và gửi prompt

- hành vi paste và submit prompt có thể khác nhau giữa các CLI
- cùng một flow cũng có thể khác khi đi qua tmux
- đây là điểm quan trọng vì lệch nhỏ cũng có thể làm gãy cả run flow

### An toàn với ký tự đặc biệt và trigger

- một số prompt có thể chứa slash command, skill trigger, hoặc syntax tham chiếu như `/`, `$`, `@`
- các ký tự đó có thể vô tình kích hoạt mode riêng của CLI
- prompt được paste vào vì vậy có thể xử lý khác với plain text bình thường, còn `Enter` cũng không chắc hành xử như mong đợi
- hệ thống cần rà xem còn trường hợp ký tự đặc biệt nào có mức rủi ro tương tự không

### Khả năng quan sát dành cho con người

- người vận hành cần một cách rất nhanh để thấy CLI thực sự đang hiển thị gì trong lúc hệ thống đang tự suy luận state
- artifact JSON một mình không đủ
- hệ thống phải giữ lại pane snapshot dễ đọc hoặc live watch output để người thật có thể tự đánh giá detector đang chật vật ở đâu
