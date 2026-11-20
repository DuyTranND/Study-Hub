# Day 08 — RAG: từ truy xuất đến câu trả lời có căn cứ

> **Ý chính:** RAG là chuỗi indexing–retrieval–generation; cần tối ưu riêng từng chặng và buộc câu trả lời bám nguồn, có citation hoặc nói rõ khi thiếu dữ liệu.

## 1. RAG hay fine-tuning?

- **Retrieval-augmented generation (RAG, sinh có tăng cường truy xuất):** bổ sung dữ liệu truy xuất vào ngữ cảnh sinh câu trả lời; phù hợp khi cần dùng tri thức riêng hoặc thường xuyên cập nhật, kèm nguồn và kiểm soát truy cập.
- **Fine-tuning (tinh chỉnh):** cập nhật trọng số từ dữ liệu huấn luyện để thay đổi hành vi hoặc năng lực. Nó có thể học thêm kiến thức, nhưng không thay thế một kho dữ liệu cập nhật có thể truy xuất và kiểm chứng.
- **Prompting:** hướng dẫn cách xử lý; thường là lựa chọn đầu tiên cho thay đổi nhỏ về định dạng/hành vi.

Có thể phối hợp các phương pháp, nhưng trước hết phải xác định cần thay đổi **kiến thức**, **hành vi** hay **quy trình**.

## 2. Ba chặng trong một hệ thống RAG

### A. Indexing — chuẩn bị kho

Parse tài liệu (kể cả bảng/layout), làm sạch và chuẩn hóa; chia chunk; tạo embedding; lưu vector cùng metadata/ACL; cập nhật hoặc loại bỏ tài liệu khi nguồn thay đổi.

### B. Retrieval — tìm bằng chứng

1. Làm sạch hoặc viết lại query khi mơ hồ.
2. Xác định phạm vi tài liệu được phép truy cập và bộ lọc metadata.
3. Tìm bằng dense, sparse hoặc hybrid trong phạm vi đó; không đợi lấy xong top-k mới kiểm tra quyền.
4. Rerank một tập ứng viên nhỏ để đưa bằng chứng tốt lên đầu.

Kỹ thuật biến đổi query gồm expansion, decomposition cho câu hỏi nhiều phần, step-back cho câu hỏi quá chi tiết và HyDE trong trường hợp phù hợp. Mỗi bước tăng độ trễ/chi phí, nên chỉ bật khi eval cho thấy có lợi.

**Hybrid search** ghép dense và BM25; RRF gộp theo thứ hạng, tránh cộng trực tiếp điểm khác thang đo. **Cross-encoder reranker** chấm trực tiếp cặp truy vấn–tài liệu để xếp hạng lại tập ứng viên. Nó thường tốn tính toán hơn bước truy xuất ban đầu; chất lượng tốt hơn hay không phải được kiểm chứng trên dữ liệu sử dụng. **MMR** giúp giảm các chunk trùng lặp khi cần nhiều góc nhìn.

### C. Generation — tổng hợp câu trả lời

- Đưa bằng chứng vào cấu trúc có ranh giới rõ (ví dụ XML/JSON/Markdown), kèm ID nguồn và metadata.
- Không nhồi hết context window. Slide gợi ý tỷ lệ **20/60/20** cho system/rules, retrieved context và phần dự phòng cho query/output; xem đây là heuristic để tuning, không phải quy tắc cố định.
- Giảm “lost in the middle”: sắp thứ tự bằng chứng có ý thức, ưu tiên nguồn mạnh ở đầu/cuối.
- Chỉ trả lời dựa trên context được truy xuất; gắn citation vào từng nhận định quan trọng.
- Nếu nguồn không đủ hoặc mâu thuẫn, nói rõ giới hạn, hỏi thêm hoặc chuyển người—không suy đoán.

## 3. Đánh giá RAG

Dùng Golden Dataset đại diện cho người dùng, loại tài liệu, câu hỏi thường gặp và ca khó/adversarial. Đo riêng retrieval và generation để biết lỗi ở đâu.

Các nhóm metric thường dùng trong **Ragas** gồm **Context Precision**, **Context Recall**, **Faithfulness** (mức các nhận định được ngữ cảnh hỗ trợ) và **Response Relevancy** (còn gặp tên Answer Relevancy). Chúng không đồng nhất với Precision@k/Recall@k dựa trên nhãn tài liệu: cách chấm cụ thể phụ thuộc metric và dữ liệu tham chiếu. Faithfulness cao cho biết bám ngữ cảnh, không bảo đảm ngữ cảnh đúng hoặc câu trả lời đúng sự thật. Kết hợp đánh giá tự động với rà soát người thật; không coi điểm LLM-as-a-Judge là chân lý.

Tuning mỗi lần chỉ nên thay một yếu tố (chunk size, hybrid weight, reranker, prompt...) rồi so scorecard trước/sau. A/B test hoặc regression gate giúp tránh tối ưu một metric nhưng làm xấu trải nghiệm hoặc chi phí.

## 4. Quy trình debug ngắn

- Không tìm thấy tài liệu đúng → kiểm tra parsing, chunking, query và retrieval.
- Có tài liệu đúng nhưng câu trả lời sai → kiểm tra context injection, grounding, citation và xung đột nguồn.
- Trả lời không có nguồn → yêu cầu citation và fallback khi không đủ bằng chứng.
- Chất lượng giảm khi tăng k → kiểm tra nhiễu, thứ tự context, reranking và trùng lặp.

**Từ khóa:** RAG, indexing, retrieval, generation, query expansion, HyDE, BM25, RRF, reranking, MMR, grounding, citations, Ragas, Golden Dataset.

**Nguồn tổng hợp:** transcript `day_08.md` và `MASTER_SUMMARY.md`.

**Đối chiếu thuật ngữ:** [Ragas — Faithfulness](https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/faithfulness/), [Ragas — Response Relevancy](https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/answer_relevance/).
