# Day 07 — Nền tảng dữ liệu: embedding, chunking và vector store

> **Ý chính:** RAG chỉ tốt khi dữ liệu được trích xuất, chia đoạn, nhúng, lập chỉ mục và truy xuất đúng; lỗi dữ liệu thường không làm hệ thống crash mà âm thầm làm câu trả lời sai.

## 1. Chọn đúng loại dữ liệu

- **Knowledge data:** tài liệu/chính sách ít thay đổi—phù hợp parse, chunk và retrieval.
- **Operational data:** trạng thái đơn hàng, CRM, ticket, tồn kho—thường cần truy vấn có kiểm soát/API/SQL, không nên nhúng mọi thứ vào vector DB.
- **Contextual data:** thông tin phiên hoặc hồ sơ người dùng cần thiết cho lượt hiện tại—chỉ đưa vào khi cần.

Trước khi index, xác định owner, quyền truy cập, chu kỳ cập nhật, thời hạn lưu và PII. Mask/minimize dữ liệu nhạy cảm trước khi tạo embedding; vector không mặc nhiên là dữ liệu ẩn danh.

## 2. Pipeline dữ liệu cho retrieval

`Tài liệu → parse/extract → normalize → chunk → embed → store + metadata → query/retrieve → inject context`

Parser phải giữ cấu trúc quan trọng: tiêu đề, bảng, cột, trang, quan hệ giữa nội dung. Với tiếng Việt, chuẩn hóa Unicode (thường dùng NFC) và kiểm tra dấu/ký tự. Không giả định PDF, bảng tính hay HTML đều là văn bản phẳng.

### Chunking

- Chunk quá lớn: nhiều nhiễu, tốn context và khó lấy đúng đoạn.
- Chunk quá nhỏ: mất ngữ cảnh hoặc câu trả lời bị tách rời.
- Chia theo tiêu đề/đoạn/cấu trúc tài liệu khi phù hợp; overlap có thể giữ ý nối qua ranh giới nhưng làm tăng dung lượng.
- Kiểm tra giới hạn token của embedding model để tránh **silent truncation**.

Chunk nên kèm metadata như nguồn, loại tài liệu, ngày, phòng ban, quyền truy cập và ID để lọc/citation.

## 3. Embedding và tìm kiếm

Embedding (biểu diễn nhúng) ánh xạ đối tượng như văn bản sang vector trong một không gian đặc trưng. Cosine similarity là tín hiệu hình học, không phải thước đo hoàn hảo về liên quan. Chọn model theo ngôn ngữ, độ dài, license, kiểu truy vấn, nơi triển khai và benchmark trên corpus của chính mình—không chỉ nhìn leaderboard.

Với hai vector khác vector không, độ tương đồng cosine là:

\[
\operatorname{cos\_sim}(\mathbf{x},\mathbf{y})=\frac{\mathbf{x}^{\mathsf T}\mathbf{y}}{\lVert\mathbf{x}\rVert_2\lVert\mathbf{y}\rVert_2}
\]

Cosine similarity là **độ tương đồng**, không phải xác suất liên quan. Chỉ khi hai vector đã được chuẩn hóa về độ dài 1 thì nó bằng tích vô hướng. Cosine distance thường được quy ước là \(1-\operatorname{cos\_sim}(\mathbf{x},\mathbf{y})\); cần kiểm tra quy ước của thư viện.

- **Dense retrieval (truy xuất vector dày):** thường phù hợp với diễn đạt lại và câu hỏi tự nhiên; hiệu quả phụ thuộc mô hình và dữ liệu.
- **Sparse retrieval (truy xuất thưa):** biểu diễn theo các đặc trưng như từ vựng. BM25 là một hàm xếp hạng dựa trên từ khóa, thường hữu ích với mã lỗi, ID và tên riêng; không đồng nghĩa với mọi phương pháp sparse retrieval.
- **Hybrid:** kết hợp dense và sparse; có thể gộp thứ hạng bằng **RRF**.

**ANN (approximate nearest-neighbor search)** là tìm kiếm láng giềng gần đúng. Phân biệt **Flat** (quét toàn bộ để làm mốc tìm kiếm chính xác), **IVF** (chia vector vào các danh sách đảo theo cụm), **PQ — product quantization** (lượng tử hóa tích để nén vector) và **HNSW** (chỉ mục dạng đồ thị). Đây là các thành phần có thể kết hợp; Flat tự nó không phải ANN, còn PQ không phải phương pháp gom cụm thay thế IVF. Đánh giá đánh đổi giữa độ thu hồi, độ trễ và bộ nhớ. Faiss là thư viện tìm kiếm vector; vector database thường bổ sung lưu trữ bền vững, quản lý dữ liệu và vận hành.

## 4. Đo chất lượng và xử lý lỗi

Gọi \(R\) là tập tài liệu liên quan theo nhãn đánh giá và \(R_k\) là tập đúng \(k\) kết quả đầu tiên được trả về:

\[
\operatorname{Precision@k}=\frac{|R_k\cap R|}{k},\qquad \operatorname{Recall@k}=\frac{|R_k\cap R|}{|R|}
\]

**Precision@k** đo tỷ lệ kết quả liên quan trong top-k; **Recall@k** đo tỷ lệ tài liệu liên quan đã tìm lại được. Quy ước xử lý truy vấn không có tài liệu liên quan hoặc trả về ít hơn k kết quả phải được công bố, không tự chia cho 0.

**MRR (mean reciprocal rank)** lấy trung bình nghịch đảo thứ hạng kết quả liên quan đầu tiên trên tập truy vấn \(Q\):

\[
\operatorname{MRR}=\frac{1}{|Q|}\sum_{q\in Q}\frac{1}{\operatorname{rank}_q}
\]

Nếu không có kết quả liên quan trong phạm vi đánh giá, đóng góp của truy vấn đó là 0. **nDCG@k (normalized discounted cumulative gain)** xét cả vị trí lẫn mức độ liên quan. Với nhãn mức độ liên quan \(g_i\ge0\), một quy ước phổ biến là:

\[
\operatorname{DCG@k}=\sum_{i=1}^{k}\frac{2^{g_i}-1}{\log_2(i+1)},\qquad \operatorname{nDCG@k}=\frac{\operatorname{DCG@k}}{\operatorname{IDCG@k}}
\]

IDCG@k là DCG@k của thứ tự lý tưởng trên cùng bộ nhãn. Nếu IDCG@k bằng 0, cần nêu quy ước xử lý. Không nhầm Recall@k theo nhãn liên quan với recall của ANN, vốn thường so kết quả tìm gần đúng với top-k tìm chính xác.

Luôn có baseline BM25 và test theo query thật. Có thể tạo bộ kiểm tra tạm bằng câu hỏi sinh từ chunk, nhưng phải rà soát mẫu vì cách này dễ thiên lệch về trùng từ ngữ.

Các lỗi hay gặp: chunk sai ranh giới; model đổi nhưng không re-embed; sai prefix/instruction; silent truncation; filter sau ANN khiến thiếu kết quả; collection dùng nhầm embedding function; dữ liệu cũ hoặc cache không version hóa.

## 5. Quyền truy cập và bảo mật

Filter theo ACL của người dùng **trước hoặc ngay trong quá trình ANN search**, không chỉ lọc sau khi lấy top-k. Kiểm tra tài liệu có thể chứa prompt injection hoặc dữ liệu độc hại. Giới hạn quyền truy cập vào vector index và áp dụng chính sách dữ liệu tương đương dữ liệu nguồn.

**Từ khóa:** knowledge/operational/contextual data, embedding, cosine, chunking, NFC, BM25, hybrid search, RRF, ANN, HNSW, Recall@k, ACL, PII.

**Nguồn tổng hợp:** transcript `day_07.md` và `MASTER_SUMMARY.md`.

**Đối chiếu thuật ngữ:** [Faiss — các loại chỉ mục](https://github.com/facebookresearch/faiss/wiki/Faiss-indexes), [Stanford IR — đánh giá truy xuất](https://nlp.stanford.edu/IR-book/html/htmledition/evaluation-of-ranked-retrieval-results-1.html).
