# Day 14 — Evaluation và benchmarking cho AI

> **Ý chính:** Eval là một vòng lặp khoa học: định nghĩa tiêu chí, thu mẫu đại diện, đo lỗi, kiểm tra độ tin cậy của grader rồi dùng kết quả để cải thiện hệ thống.

## 1. Môi trường đánh giá và cách chấm

- **Offline:** chạy bộ test cố định trước khi release; nhanh và có thể lặp lại.
- **Online:** đo trên traffic thật/nhóm thử nghiệm; phản ánh điều kiện thực nhưng cần kiểm soát rủi ro.

**Human evaluation (đánh giá bởi con người)** mô tả cách chấm, không phải môi trường triển khai thứ ba: người đánh giá có thể chấm dữ liệu offline hoặc mẫu từ production. Có thể kết hợp chấm bằng quy tắc, mô hình đánh giá và con người.

Đánh giá cả **chất lượng đầu ra**, **task completion** và **trajectory** (các bước/tool/decision dẫn đến kết quả), không chỉ chấm câu trả lời cuối.

## 2. Golden Dataset

Tạo bộ dữ liệu câu hỏi/đầu vào, expected behavior, nguồn hoặc rubric. Phân tầng theo loại tác vụ, người dùng, nguồn dữ liệu, độ khó và mức rủi ro; thêm ca adversarial và failure thật từ production. Gắn version cho dataset và evaluator để so sánh theo thời gian.

Tài liệu gợi ý 50–100 mẫu làm điểm bắt đầu, có hơn 10% ca adversarial và kiểm tra mức đồng thuận người chấm (ví dụ Cohen’s kappa). Đây là mốc thực hành, không phải số lượng phù hợp cho mọi sản phẩm.

## 3. Metric cho RAG

Trong Ragas, các nhóm metric thường gặp gồm:

- **Context Precision:** đo mức tập trung và thứ hạng của phần ngữ cảnh liên quan theo cách chấm được chọn.
- **Context Recall:** đo mức bằng chứng cần thiết được ngữ cảnh truy xuất bao phủ; nhiều biến thể cần câu trả lời hoặc dữ liệu tham chiếu.
- **Faithfulness:** các nhận định có được ngữ cảnh hỗ trợ không, không tự bảo đảm đúng sự thật ngoài ngữ cảnh.
- **Response Relevancy (còn gặp tên Answer Relevancy):** câu trả lời có liên quan tới yêu cầu đầu vào không; liên quan không đồng nghĩa đầy đủ hoặc đúng.

Các metric khác nhau chẩn đoán các lỗi khác nhau. Ví dụ: context recall thấp gợi ý retrieval; context đúng nhưng faithfulness thấp gợi ý generation/grounding.

## 4. LLM-as-a-Judge

Viết rubric cụ thể; với tiêu chí rõ, **binary pass/fail** thường ổn định và dễ phân tích hơn thang Likert mơ hồ. Hiệu chuẩn evaluator với mẫu do người chấm; đo đúng các tỷ lệ từ ma trận nhầm lẫn thay vì gọi TPR/TNR là tỷ lệ báo sai. Quy ước lớp dương là “đạt”: TP là ca thực sự đạt được chấm đạt; FN là ca thực sự đạt bị chấm không đạt; TN và FP tương tự cho ca thực sự không đạt.

\[
\begin{aligned}
\operatorname{TPR}&=\frac{\mathrm{TP}}{\mathrm{TP}+\mathrm{FN}}, &\operatorname{FNR}&=\frac{\mathrm{FN}}{\mathrm{TP}+\mathrm{FN}}\\
\operatorname{TNR}&=\frac{\mathrm{TN}}{\mathrm{TN}+\mathrm{FP}}, &\operatorname{FPR}&=\frac{\mathrm{FP}}{\mathrm{TN}+\mathrm{FP}}
\end{aligned}
\]

TPR là độ nhạy (sensitivity/recall); TNR là độ đặc hiệu (specificity). FPR mới là tỷ lệ dương tính giả và FNR là tỷ lệ âm tính giả. Nếu một mẫu số bằng 0, tỷ lệ tương ứng không xác định; cần nêu quy ước xử lý. Kiểm tra thêm thiên lệch do độ dài, vị trí câu trả lời hoặc tự ưu ái mô hình cùng dòng.

Judge tự động là một thước đo cần kiểm định—không phải ground truth. Dùng human review cho rủi ro cao và mẫu bất đồng.

## 5. Thống kê và độ tin cậy

So sánh các phiên bản trên cùng item bằng paired design; tính biến thiên và khoảng tin cậy, tránh kết luận chỉ từ vài ví dụ. Khi nhiều câu hỏi đến từ cùng một nguồn/item, cần tính đến cụm phụ thuộc thay vì giả định mọi mẫu độc lập. Chạy A/B test có giả thuyết, metric chính và điều kiện dừng rõ.

Với agent:

- \(\operatorname{pass@k}\): xác suất có ít nhất một lần thành công trong \(k\) lần thử cho cùng tác vụ.
- \(\operatorname{pass}^{k}\): xác suất tất cả \(k\) lần thử đều thành công, dùng để xem độ tin cậy qua nhiều lần chạy.

Chỉ trong mô hình đơn giản hóa mà các lần thử độc lập và có cùng xác suất thành công \(p\):

\[
\operatorname{pass@k}=1-(1-p)^k,\qquad \operatorname{pass}^{k}=p^k
\]

Đây là quan hệ xác suất theo giả định trên, không phải cách suy ra điểm benchmark từ một lần chạy. Đánh giá thực tế cần chạy lặp trên từng tác vụ, nêu cách ước lượng và tổng hợp trên tập tác vụ. Điểm pass@k cao nhưng pass có số mũ k thấp cho thấy hệ thống có thể làm được mà chưa ổn định.

## 6. Phân tích lỗi trước khi tối ưu metric

Đọc trace và ghi failure mở; sau đó gom nhóm (axial coding) thành taxonomy như sai đáp án, retrieval miss, tool sai, dừng sai, vi phạm policy hoặc format sai. Tìm nguyên nhân gốc bằng 5 Whys, rồi viết evaluator/regression test cho lỗi có thể tái hiện.

**Từ khóa:** offline/online evaluation, human evaluation, bộ dữ liệu chuẩn đánh giá, Ragas, LLM-as-a-Judge, TPR/TNR, FPR/FNR, pass@k, pass với số mũ k, A/B test, failure taxonomy, regression gate.

**Nguồn tổng hợp:** transcript `day_14.md` và `MASTER_SUMMARY.md`.

**Đối chiếu thuật ngữ:** [scikit-learn — Confusion Matrix](https://scikit-learn.org/stable/modules/generated/sklearn.metrics.confusion_matrix.html), [Ragas — Response Relevancy](https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/answer_relevance/), [τ-bench — pass với số mũ k](https://arxiv.org/abs/2406.12045).
