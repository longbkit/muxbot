[English](../../../overview/specs-review-checklist-draft.md) | [Tiếng Việt](./specs-review-checklist-draft.md) | [简体中文](../../zh-CN/overview/specs-review-checklist-draft.md) | [한국어](../../ko/overview/specs-review-checklist-draft.md)

# Checklist nháp để review spec

## Trạng thái

Nháp

Công cụ review mang tính thử nghiệm.

Chưa phải tiêu chuẩn chính thức của repository.

## Mục đích

Dùng checklist này để review nhanh một feature spec trước khi phần triển khai bị khóa cứng.

Checklist này được thiết kế để luôn:

- ngắn
- đủ tách bạch để review thực tế
- dễ cập nhật khi team học thêm

## Nhãn trạng thái review

Dùng một nhãn ở đầu spec hoặc guide đang được review:

- `explore`
- `spec-ready`
- `alpha`
- `beta`
- `official`

Nếu trạng thái còn mơ hồ, spec đó chưa sẵn sàng để review.

## 7 cổng kiểm tra

### 1. Kết quả đầu ra

- Giá trị cho người dùng hoặc operator đã rõ chưa?
- Vấn đề này có đáng giải ngay bây giờ không?
- Nếu user guide vẫn đọc còn yếu, feature này có nên bị hủy hoặc đổi lại scope không?

### 2. Vai trò và ngữ cảnh chat

- Có những loại người dùng hoặc vai trò nào tham gia?
- Hành động nào thuộc về ngữ cảnh chat nào: user guide, prompt, slash command, routed runtime, operator CLI, hay config?
- Ai được làm gì, ở đâu?

### 3. Hành vi và cơ chế cưỡng chế

- Hành vi hiện tại là gì?
- Hành vi mục tiêu là gì?
- Phần nào chỉ mang tính hướng dẫn?
- Phần nào là cưỡng chế cứng?
- Thứ tự phân giải đã được nói rõ chưa?

### 4. Mặc định và an toàn

- Các mặc định và fallback có an toàn không?
- Một fallback trung tính có thể bị hiểu nhầm là trạng thái có quyền cao hơn không?
- Các ranh giới cần bảo vệ đã rõ chưa: template có thể sửa so với prompt block được bảo vệ, hay rule cục bộ theo route so với auth toàn cục?

### 5. Luồng của operator

- Một operator thật có hoàn thành được luồng chính mà không cần biết ngữ cảnh kiến trúc không?
- Luồng thêm, xóa, thay đổi, và debug đã được bao phủ chưa?
- Đường đi bị từ chối hoặc thất bại có rõ và hành động được không?

### 6. Chuyển tiếp và rủi ro

- Chính sách tương thích đã rõ chưa: compatibility mode, migration, hay thay thế fail-fast?
- Các rủi ro hồi quy chính đã được gọi tên chưa?
- Còn hành vi cũ-mới nào mơ hồ không?

### 7. Bằng chứng và độ trưởng thành

- Khi cần, đã có cả spec cho phía dev lẫn guide cho phía người dùng hoặc operator chưa?
- Câu chữ có bám đúng runtime reality hiện tại so với target truth dự kiến không?
- Nhãn độ trưởng thành có trung thực không?
- Kế hoạch kiểm chứng có đủ tốt với trạng thái đang được gắn không?

## Kết luận nhanh

Một spec thường ở trạng thái tốt khi:

- cả 7 cổng đều có câu trả lời rõ
- không có cổng nào dựa vào giả định ẩn
- user guide và dev spec kể cùng một câu chuyện
- nhãn trạng thái phản ánh đúng thực tế

Dấu hiệu nên dừng lại:

- giá trị vẫn chưa đủ thuyết phục
- luồng operator vẫn mờ
- phần hướng dẫn và phần cưỡng chế vẫn còn lẫn vào nhau
- ngữ nghĩa của fallback vẫn có cảm giác rủi ro
- guide yếu đến mức feature có thể không đáng để ship

## Ghi chú

- Hãy dùng checklist này để review, không phải để thay thế feature docs hoặc task docs.
- Nếu checklist liên tục phát hiện thiếu cùng một mục, hãy đưa quy tắc đó lên spec template sau.
