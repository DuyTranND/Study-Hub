# Day 11 — Guardrails, HITL và Responsible AI

> **Ý chính:** Không có một bộ lọc nào bảo đảm an toàn; dùng phòng thủ nhiều lớp, giới hạn quyền và quyết định trước khi nào phải dừng/chuyển cho người.

## 1. Mối đe dọa cần tính đến

- **Direct prompt injection:** chỉ dẫn do người dùng đưa trực tiếp nhằm chuyển hướng hệ thống khỏi nhiệm vụ hoặc chính sách dự kiến.
- **Jailbreak:** nỗ lực vượt các giới hạn an toàn của mô hình. Hai khái niệm có thể giao nhau nhưng không đồng nghĩa.
- **Indirect injection:** chỉ dẫn độc nằm trong tài liệu, trang web hoặc tool output được truy xuất.
- **Rò rỉ dữ liệu/PII:** model tiết lộ thông tin không được phép.
- **Tool misuse:** gọi sai API, vượt quyền hoặc thực hiện side effect ngoài ý định.
- **Reward hacking:** khai thác cách tính phần thưởng để đạt điểm cao mà không đạt mục tiêu mong muốn. Đây là một dạng vấn đề sai lệch mục tiêu; **misalignment** có phạm vi rộng hơn.

Agent có nhiều nguồn input hơn chatbot—user, retrieval, tools, memory—nên mỗi nguồn cần được đánh dấu và xử lý theo mức tin cậy.

## 2. Defense in depth

1. **Input rails:** kiểm tra format, quyền, dữ liệu nhạy cảm và tín hiệu tấn công.
2. **Model/policy rails:** ưu tiên instruction có thẩm quyền cao hơn dữ liệu bên ngoài; chỉ nêu rõ phạm vi được phép.
3. **Tool rails:** allowlist, quyền tối thiểu, xác thực tham số, sandbox, timeout và giới hạn số lần gọi.
4. **Output rails:** kiểm tra format, PII, grounding, policy và nguy cơ gây hại.
5. **Operational controls:** logging, red-team test, escalation, rollback và quy trình incident.

Input/output guardrail không thay cho quyền runtime. Các biện pháp như spotlighting, instruction hierarchy hoặc dual-model defense có thể hỗ trợ nhưng không nên được xem là hàng rào tuyệt đối.

## 3. HITL (Human-in-the-Loop)

Đưa người vào các bước có hậu quả lớn, không thể hoàn tác, liên quan quyền riêng tư hoặc cần phán đoán chuyên môn. Dòng duyệt nên hiển thị hành động, tham số, dữ liệu căn cứ và cách từ chối/sửa.

Đừng dùng một ngưỡng confidence đơn lẻ làm toàn bộ chính sách. Kết hợp độ tin cậy với tác động, khả năng đảo ngược, độ nhạy dữ liệu và chất lượng bằng chứng. Với hành động nguy hiểm, mặc định fail-closed.

HITL cần **durable state**: lưu trạng thái chờ duyệt, người duyệt, quyết định, thời gian và dữ liệu được duyệt; sau khi khởi động lại vẫn tiếp tục an toàn, không thực hiện lặp side effect.

## 4. Red teaming và đánh giá an toàn

Tạo test suite theo nhóm: injection/jailbreak, rò rỉ PII, truy cập trái quyền, tool sai, dữ liệu mâu thuẫn, hành động không được duyệt và prompt vượt phạm vi. Ghi rõ mục tiêu, expected behavior, severity và kết quả.

Dùng benchmark/công cụ red-team như nguồn khởi đầu, sau đó bổ sung tình huống thật của sản phẩm. Theo dõi cả lần bị chặn nhầm, vì chặn nhầm làm giảm giá trị sử dụng, còn cảnh báo dồn dập gây **alert fatigue** (mệt mỏi vì cảnh báo). **Automation bias** là xu hướng quá tin vào gợi ý tự động; cần kiểm tra riêng khả năng người dùng bỏ qua bằng chứng trái ngược.

## 5. Quản trị và UX tin cậy

Nêu rõ với người dùng khi nào họ đang tương tác với AI, AI làm được gì và nên chuyển người ở đâu. Dùng model card/ghi nhận thay đổi, lưu incident và quy trình thông báo/ứng phó phù hợp. Transcript có đề cập các văn bản pháp lý Việt Nam và EU; hãy xác minh bản hiện hành, phạm vi áp dụng và tư vấn chuyên môn trước khi triển khai.

**Từ khóa:** prompt injection, jailbreak, defense in depth, input/output rails, HITL, fail-closed, red teaming, automation bias, model card, incident response.

**Nguồn tổng hợp:** transcript `day_11.md` và `MASTER_SUMMARY.md`.