# Day 13 — Monitoring, logging và observability

> **Ý chính:** Monitoring cho biết tín hiệu nào đang vượt ngưỡng; observability giúp lần theo nguyên nhân qua metrics, logs, traces và đánh giá chất lượng liên tục.

## 1. Các tín hiệu quan sát và đánh giá chất lượng

1. **Metrics:** xu hướng, tỷ lệ lỗi, latency, cost và chất lượng.
2. **Logs:** sự kiện có cấu trúc, đủ ngữ cảnh để tra cứu.
3. **Traces:** đường đi xuyên service/model/retrieval/tool.

Metrics, logs và traces là ba nhóm tín hiệu quan sát phổ biến. **Đánh giá trực tuyến liên tục (continuous online evaluation)** bổ sung phép đo chất lượng/an toàn của AI; đây là cách tổ chức nội dung bài học, không phải một “trụ cột thứ tư” được chuẩn hóa cho mọi hệ thống.

Thêm bốn Golden Signals—latency, traffic, errors, saturation—và hai tín hiệu đặc thù AI: **cost** và **quality**. Theo dõi P50/P95/P99 thay vì chỉ trung bình; với streaming, theo dõi TTFT (time to first token).

## 2. Structured logging an toàn

Mỗi log nên có timestamp, service/version, correlation ID, request/job ID, model, latency, token usage, tool calls, status và error category. Dùng context propagation để nối một yêu cầu qua nhiều thành phần.

- Redact/mask PII và secrets trước khi ghi log.
- Tách **application log** (debug vận hành) khỏi **audit log** (ai làm gì, quyết định nào, lúc nào).
- Tránh ghi raw prompt/context nhạy cảm nếu không có căn cứ và chính sách lưu giữ.
- Hạn chế high-cardinality labels (ví dụ user/request ID trong metric); để ID chi tiết ở log/trace.

## 3. Distributed tracing cho agent

Một **trace** liên kết các thao tác có quan hệ trong một giao dịch hoặc luồng xử lý; mỗi **span** biểu diễn một thao tác với thời điểm bắt đầu/kết thúc. Trace có thể chứa model call, retrieval, reranking, tool call và guardrail; một nghiệp vụ dài cũng có thể trải qua nhiều trace được liên kết. Gắn correlation ID, thời gian, outcome, token/cost và lỗi. Trace giúp xác định bottleneck và biết model đã nhận nguồn nào, tool nào trả dữ liệu gì.

## 4. Dashboard, SLI/SLO/SLA và alert

- **Service-level indicator (SLI):** chỉ báo mức dịch vụ đo được, chẳng hạn tỷ lệ yêu cầu thành công hoặc độ trễ.
- **Service-level objective (SLO):** mục tiêu cho một SLI, gắn với cửa sổ đo và phạm vi rõ ràng.
- **Service-level agreement (SLA):** thỏa thuận mức dịch vụ với khách hàng/đối tác, thường kèm hậu quả hoặc cơ chế xử lý khi không đạt.
- **Error budget:** ngân sách lỗi được suy ra từ SLO; cách biểu diễn phụ thuộc SLI dựa trên sự kiện hay thời gian.

Ví dụ với SLI dựa trên yêu cầu, gọi \(G\) là số yêu cầu đạt tiêu chí và \(N>0\) là tổng yêu cầu trong cửa sổ đo:

\[
\operatorname{SLI}=\frac{G}{N}
\]

Nếu mục tiêu là tỷ lệ thành công \(S\in[0,1]\), tỷ lệ lỗi cho phép là \(b\), còn số yêu cầu lỗi tối đa theo ngân sách là \(E_{\max}\):

\[
b=1-S,\qquad E_{\max}=\left\lfloor(1-S)N\right\rfloor
\]

Ví dụ, SLO 99,9% tương ứng ngân sách lỗi 0,1% trên cùng phạm vi và cửa sổ đo. Không áp công thức đếm yêu cầu cho một SLO tính theo thời gian mà chưa đổi đơn vị.

Dashboard nên có lớp tổng quan (traffic/uptime), lớp chất lượng/chi phí và lớp điều tra (trace/error breakdown). Alert theo mức độ tác động, có owner, ngưỡng, link dashboard và runbook; tránh alert fatigue.

## 5. Quy trình điều tra incident

`Metric báo lệch → tìm log theo correlation ID → mở trace → xác định model/retrieval/tool/data → tái hiện → giảm tác động → sửa và thêm regression test`

Đừng chỉ sửa câu prompt nếu gốc lỗi là dữ liệu cũ, tool timeout, quyền sai hoặc index lỗi. Sau incident, ghi timeline, phạm vi tác động, nguyên nhân, hành động khắc phục và biện pháp ngăn tái diễn.

**Từ khóa:** observability, metrics, logs, traces, online eval, RED/USE, P95/P99, TTFT, correlation ID, OpenTelemetry, SLI, SLO, SLA, error budget, runbook.

**Nguồn tổng hợp:** transcript `day_13.md` và `MASTER_SUMMARY.md`.

**Đối chiếu thuật ngữ:** [OpenTelemetry — Signals](https://opentelemetry.io/docs/concepts/signals/), [Google SRE — Implementing SLOs](https://sre.google/workbook/implementing-slos/).
