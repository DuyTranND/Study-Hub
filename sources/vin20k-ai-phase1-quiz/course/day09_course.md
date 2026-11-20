# Day 09 — Multi-agent, MCP, A2A và LangGraph

> **Ý chính:** Nhiều agent chỉ đáng dùng khi chia vai trò giúp xử lý tốt hơn một agent đơn; cần một nơi có thẩm quyền điều phối, trạng thái và dừng hệ thống.

## 1. Khi nào cần multi-agent?

Cân nhắc multi-agent khi có nhiều chuyên môn/tác vụ độc lập, cần chạy song song hoặc cần cô lập context/quyền. Không dùng chỉ vì có thể tạo thêm agent: phối hợp làm tăng latency, token, số failure mode và khó debug.

Nguyên tắc thực dụng: **parallelize reads, serialize writes**. Có thể cho các worker nghiên cứu độc lập đồng thời; nếu nhiều worker cùng sửa một artifact, tuần tự hóa hoặc dùng cơ chế merge/approval.

## 2. Pattern điều phối

- **Supervisor–worker:** supervisor chia/routing việc, worker chuyên biệt xử lý, supervisor tổng hợp.
- **Pipeline:** output của bước trước đi vào bước sau; hợp với quy trình ổn định.
- **Debate/ensemble:** nhiều agent đưa quan điểm, sau đó tổng hợp/đối chiếu; tăng chi phí và vẫn cần verifier.
- **Hierarchical:** nhiều tầng supervisor/worker cho tổ chức lớn, nhưng quản trị phức tạp hơn.

Trước khi code, trả lời: ai giữ kế hoạch; mỗi worker cần thấy gì; ai quyết định hoàn thành; lỗi ở worker nào có thể ảnh hưởng hệ thống ra sao? Xác định state schema, reducer/merge rule, retry, timeout và stopping authority.

## 3. Bộ nhớ và cách lập kế hoạch

Một cách phân loại bộ nhớ thường dùng khi thiết kế agent, không phải chuẩn phân loại duy nhất:

- **Working:** trạng thái hiện tại trong context.
- **Episodic:** lịch sử các lần chạy/tương tác.
- **Semantic:** kiến thức về thế giới, thường qua retrieval/RAG.
- **Procedural:** kỹ năng, tool và quy trình dùng lại.

**Plan-then-execute** phù hợp khi có thể nhìn trước các bước; **ReAct** phù hợp khi bước tiếp theo phụ thuộc dữ liệu chỉ xuất hiện sau hành động. Tự phê bình chỉ đáng tin hơn khi có kiểm chứng bên ngoài như test, retrieval hoặc evaluator độc lập.

## 4. MCP, A2A và orchestration

- **Model Context Protocol (MCP)** chuẩn hóa giao tiếp giữa ứng dụng chủ/client và MCP server cung cấp **tools, resources, prompts**. Chọn transport và cơ chế xác thực phù hợp với phiên bản triển khai, đồng thời giới hạn quyền; model không tự mở kết nối MCP.
- **Agent2Agent Protocol (A2A)** hỗ trợ các ứng dụng agent trao đổi thông điệp, tác vụ và kết quả. **Agent Card** mô tả danh tính dịch vụ, khả năng và cách kết nối; A2A khác phạm vi với MCP.
- **LangGraph** biểu diễn luồng bằng **nodes, edges, state**. Checkpointer lưu checkpoint của trạng thái trong một thread; store phục vụ dữ liệu dài hạn dùng qua nhiều thread. Muốn tiếp tục sau khi tiến trình khởi động lại, cần backend lưu trữ bền vững, không chỉ checkpointer trong RAM. Conditional routing chọn nhánh; `interrupt()` hỗ trợ tạm dừng để lấy đầu vào hoặc chờ duyệt.

MCP là giao diện kết nối công cụ/dữ liệu; A2A là hợp đồng giao tiếp agent-agent; framework điều phối kiểm soát luồng và state.

## 5. Độ tin cậy, bảo mật và chi phí

Mỗi worker nên có phạm vi hẹp, tool được allowlist và output có schema. Coi kết quả worker/tool là dữ liệu cần kiểm tra. Ghi trace xuyên suốt từ supervisor đến worker để biết ai làm gì và vì sao.

Thiết kế timeout, retry có giới hạn, partial failure, fallback và checkpoint. Với tác vụ dài, lưu tiến độ và dùng hành động idempotent để có thể tiếp tục mà không lặp side effect. Đánh giá cả kết quả cuối lẫn routing, trao đổi giữa agent và quyền hạn. Bảo vệ chống tool poisoning/shadowing/rug-pull bằng cách review/pin phiên bản tool, sandbox và quyền theo worker.

**Từ khóa:** supervisor-worker, parallelize reads/serialize writes, memory, MCP, A2A, Agent Card, LangGraph, StateGraph, checkpointer, interrupt, idempotency.

**Nguồn tổng hợp:** transcript `day_09.md` và `MASTER_SUMMARY.md`.

**Đối chiếu thuật ngữ:** [MCP Architecture](https://modelcontextprotocol.io/docs/learn/architecture), [A2A Specification](https://a2a-protocol.org/latest/specification/), [LangGraph Persistence](https://docs.langchain.com/oss/python/langgraph/persistence).
