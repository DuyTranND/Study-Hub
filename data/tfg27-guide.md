## Assessment facts — what is confirmed?

Thông tin được chia theo mức độ tin cậy để bạn không mất thời gian ôn nhầm dạng đề.

| Mức độ | Nội dung | Cơ sở |
| --- | --- | --- |
| **Xác nhận từ thư mời của bạn** | Functional Test và Aptitude Test làm **trong cùng một lần**; tổng thời lượng được thông báo **131 phút**. | Email Techcombank gửi 02/11/2026. |
| **Xác nhận từ thư mời SHL** | Bài **Automata** yêu cầu chọn **Python 3.12**. | Hướng dẫn SHL trong thư mời cá nhân. |
| **Cần xác nhận với đơn vị tuyển dụng** | Techcombank ghi hạn **04/11/2026, 11:59 AM (GMT+7)**; email SHL ghi **11:59 PM (GMT+7)**. | Hai email ghi giờ khác nhau; ưu tiên hoàn thành trước **11:59 sáng** để an toàn. |
| **Xác nhận từ trang Techcombank** | TFG27 có Aptitude Test, Functional Test; Data & AI đề cao Python, SQL, Power BI, thống kê và phân tích dữ liệu. | [Techcombank Future Gen 2027 — official careers](https://tuyendung.techcombankjobs.com/techcombank-future-gen). |
| **Các dạng SHL công khai, chưa xác nhận cho bài thi này** | Numerical, Deductive, Inductive, Verbal, General Ability, Coding Simulation. | [SHL official free practice tests](https://www.shlglobal.cn/en/shldirect/en/practice-tests/). |

**Đặc biệt:** SHL công bố nhiều sản phẩm đánh giá khác nhau. Thời lượng **45 phút, tối đa hai câu** trong tài liệu Automata công khai năm 2020 là thông số của **một phiên bản**, không phải lịch phân bổ thời gian đã được xác nhận cho TFG27 của bạn. Xem [SHL Automata assessment fact sheet](https://service.shl.com/docs/Automata%20%28New%29.pdf).

**Nguồn cộng đồng:** Đã khảo sát kết quả công khai từ Facebook/LinkedIn, VOZ và các trang kinh nghiệm tuyển dụng. Chưa có bằng chứng đáng tin cậy để xác nhận cấu trúc câu hỏi thực tế TFG27 Data & AI năm 2026; các bài thực hành ở website này do chúng tôi biên soạn độc lập. [Bài thảo luận VOZ về chương trình](https://voz.vn/t/cho-lao-dong-2023.675857/page-48) chủ yếu nói về tuyển dụng, không công bố bộ đề SHL đã kiểm chứng.

## Study notes — priority revision

### 1. Time management / Tonight's revision plan

Đây là **lịch ôn tập đề xuất**, không phải thời lượng từng phần của bài thi thật.

| Thứ tự | Việc cần làm | Thời gian gợi ý |
| --- | --- | --- |
| 1 | Python 3.12: hàm, cấu trúc dữ liệu, thuật toán, edge cases | 55 phút |
| 2 | Numerical reasoning: phần trăm, bảng số liệu, tỷ lệ, trung bình có trọng số | 25 phút |
| 3 | Deductive + Inductive: quy tắc logic, dãy số, suy luận có điều kiện | 25 phút |
| 4 | SQL + xác suất/thống kê + ML cơ bản | 30 phút |
| 5 | Một bài mock hỗn hợp; xem lại tất cả câu sai | 40–60 phút |

**Khi thi:** đọc kỹ hướng dẫn và giới hạn của từng assessment trên SHL trước khi bắt đầu. Bài thật được yêu cầu làm liên tục; chuẩn bị laptop/desktop, mạng, camera/micro và Secure Browser nếu thư mời yêu cầu. Đừng mở bài thi thật chỉ để thử xem nội dung khi chưa sẵn sàng.

### 2. Automata / Python 3.12 essentials

SHL mô tả Automata là bài coding simulation có IDE và kiểm thử tính đúng của chương trình. SHL Support xác nhận có **visible tests và hidden edge tests**; hướng dẫn hỗ trợ một số phiên bản Automata nói rằng dữ liệu **đã truyền vào hàm**, vì vậy **không tự ý dùng `input()`** trừ khi đề bài thật yêu cầu. Luôn tuân theo function signature trong đề. [SHL Automata support](https://support.shl.com/category.html?c=10_91_12_37_43_).

- **Đầu vào và đầu ra:** xem kỹ tên hàm, kiểu dữ liệu, có cần `return` hay `print`, có được sửa danh sách đầu vào không.
- **Cấu trúc dữ liệu:** `list` giữ thứ tự, `set` kiểm tra thành viên trung bình O(1), `dict` đếm tần suất, `deque` lấy ở hai đầu O(1).
- **Kỹ thuật thường dùng:** hash map, two pointers, sliding window, prefix sum, sort, binary search; chọn theo constraints.
- **Chú ý Python:** `//` là floor division; `-7 // 3 == -3`; `list.sort()` sửa tại chỗ và trả về `None`; `sorted()` trả về list mới; slice `a[l:r]` không gồm `r`.
- **Độ phức tạp:** một vòng lặp O(n), hai vòng lặp lồng nhau O(n²), sorting thường O(n log n). Cân đối theo kích thước đầu vào.
- **Edge cases:** rỗng, một phần tử, số âm/0, nhiều phần tử trùng, dữ liệu đã sắp xếp, giá trị rất lớn, chuỗi Unicode, và trường hợp không có nghiệm.

**Ví dụ: Two Sum bằng dictionary — O(n) trung bình.**

```python
def two_sum(nums: list[int], target: int) -> list[int]:
    seen = {}
    for i, value in enumerate(nums):
        need = target - value
        if need in seen:
            return [seen[need], i]
        seen[value] = i
    return []
```

Với `nums = [3, 2, 4]`, `target = 6`, kết quả là `[1, 2]`. Đưa phần tử vào `seen` **sau khi** kiểm tra để không sử dụng cùng chỉ số hai lần. Nếu đề yêu cầu trả về số lượng hoặc giá trị thay vì chỉ số, phải đổi logic cho đúng.

**Ví dụ: Sliding window — độ dài lớn nhất của đoạn không có ký tự lặp.**

```python
def longest_unique(s: str) -> int:
    last = {}
    left = 0
    best = 0
    for right, char in enumerate(s):
        if char in last and last[char] >= left:
            left = last[char] + 1
        last[char] = right
        best = max(best, right - left + 1)
    return best
```

Với `s = "abba"`, kết quả là `2`. Điều kiện `last[char] >= left` rất quan trọng để con trỏ trái không lùi về phía sau.

### 3. Numerical reasoning — số liệu và tốc độ

Đây là nội dung SHL công bố dưới nhóm Numerical; dạng và tỷ trọng thực tế của TFG27 chưa xác nhận. Luyện đọc đúng **đơn vị, khoảng thời gian, mẫu số**, nhất là bảng doanh thu, tỷ lệ khách hàng và tăng trưởng.

| Công thức | Ý nghĩa |
| --- | --- |
| $\text{Growth}=\frac{\text{New}-\text{Old}}{\text{Old}}\times100\%$ | Tăng trưởng so với mốc **cũ**. |
| $\text{Share}=\frac{\text{Part}}{\text{Total}}\times100\%$ | Tỷ trọng trong tổng. |
| $\bar x_w=\frac{\sum w_i x_i}{\sum w_i}$ | Trung bình có trọng số. |
| $\text{Average speed}=\frac{\text{Total distance}}{\text{Total time}}$ | Tốc độ trung bình; không lấy trung bình cộng hai tốc độ khi thời gian khác nhau. |
| $\text{Profit margin}=\frac{\text{Revenue}-\text{Cost}}{\text{Revenue}}\times100\%$ | Biên lợi nhuận tính trên **doanh thu**. |

**Ví dụ:** 1.200 giao dịch tháng trước và 1.500 giao dịch tháng này → tăng `(1500−1200)/1200 = 25%`, không phải 20%. Nếu A có 80 giao dịch thành công/100 và B có 90/120, tỷ lệ gộp = `170/220 ≈ 77,27%`, không lấy trung bình không trọng số 80% và 75%.

### 4. Deductive / Verbal / Inductive reasoning

- **Deductive:** chỉ kết luận điều gì **bắt buộc đúng** với dữ kiện. `A → B` không có nghĩa `B → A`. Phản đảo đúng là `¬B → ¬A`.
- **Verbal:** phân biệt `True`, `False`, `Cannot Say`. Nếu bài đọc không đủ dữ kiện thì chọn **Cannot Say**, không dùng kiến thức ngoài đoạn văn.
- **Inductive:** kiểm tra dãy sai phân, sai phân bậc hai, tỷ lệ nhân, quy tắc xen kẽ hai dãy, quy luật theo vị trí.
- **Logic thời gian:** với bài lịch/điều kiện, lập bảng loại trừ. Đọc rõ “chỉ khi”, “ít nhất”, “tất cả”, “một số”, “không ai”.

**Ví dụ:** “Tất cả nhân viên A đều biết SQL; Bình thuộc nhóm A.” → suy ra Bình biết SQL. Nhưng “Bình biết SQL” không cho phép kết luận Bình thuộc A.

### 5. SQL / Data / Statistics / ML

- **SQL:** `WHERE` lọc dòng trước gom nhóm; `HAVING` lọc nhóm sau `GROUP BY`; `COUNT(*)` đếm mọi dòng, `COUNT(col)` không đếm `NULL`; `LEFT JOIN` giữ mọi dòng bên trái; `ROW_NUMBER()` để xếp hạng, `LAG()` để so với dòng trước.
- **Data quality:** completeness, accuracy, consistency, timeliness, validity, uniqueness. Với dữ liệu ngân hàng nên để ý duplicate keys, missing values, timezone, sai kiểu ngày, cập nhật muộn.
- **Xác suất:** $P(A\mid B)=\frac{P(A\cap B)}{P(B)}$; một kết quả có khả năng cao khi đã được báo động **không đồng nghĩa** báo động luôn chính xác (base-rate fallacy).
- **Confusion matrix nhị phân:** precision = TP/(TP+FP), recall = TP/(TP+FN), $F_1=2PR/(P+R)$. Tập dữ liệu mất cân bằng cần quan tâm precision/recall/PR-AUC thay vì chỉ accuracy.
- **ML leakage:** fit scaler/encoder trên **train** rồi transform validation/test. Không dùng biến chỉ có sau thời điểm cần dự đoán (ví dụ trạng thái thanh toán trong tương lai).
- **Chọn metric:** fraud detection nhạy với false negatives; marketing response cần kiểm tra precision, recall và business cost; AUC không thay thế đánh giá theo ngưỡng quyết định.

**SQL mẫu — top khách hàng theo tổng tiền giao dịch thành công:**

```sql
SELECT customer_id, SUM(amount) AS total_amount
FROM transactions
WHERE status = 'SUCCESS'
GROUP BY customer_id
ORDER BY total_amount DESC
LIMIT 5;
```

### 6. Checklist trước khi nộp Automata

1. Kiểm tra đúng **tên hàm**, tham số, kiểu trả về và format yêu cầu.
2. Thử ví dụ cơ bản và tự lập ít nhất ba edge cases (rỗng, trùng, cực trị).
3. Không thay đổi dữ liệu đầu vào nếu đề không cho phép; loại bỏ `print` debug ngoài yêu cầu.
4. Ước lượng time/space complexity với constraints lớn nhất.
5. Với hidden tests: xem lại trường hợp không có nghiệm, số âm, index 0, một phần tử, duplicate, và giá trị `None`.

## Practice resources — verified links

| Tài nguyên | Học gì? | Mức độ |
| --- | --- | --- |
| [Techcombank Future Gen official](https://tuyendung.techcombankjobs.com/techcombank-future-gen) | Yêu cầu Data & AI và các vòng tuyển dụng. | Nguồn **chính thức** |
| [SHL official practice portal](https://www.shlglobal.cn/en/shldirect/en/practice-tests/) | Numerical, Deductive, Inductive, Verbal, General Ability, Coding Simulation demo. | Nguồn **chính thức**; không xác nhận cấu trúc TFG27 |
| [SHL Automata candidate support](https://support.shl.com/category.html?c=10_91_12_37_43_) | Hidden tests, lỗi runtime/timeout, hỗ trợ bài lập trình. | Nguồn **chính thức** |
| [SHL Automata fact sheet (PDF)](https://service.shl.com/docs/Automata%20%28New%29.pdf) | Sản phẩm Automata, tiêu chí đánh giá coding. | Thông số của **một phiên bản năm 2020** |
| [Python 3.12 docs](https://docs.python.org/3.12/tutorial/) | Cú pháp, list, dict, functions, exceptions, sorting. | Tài liệu **chính thức** |
| [Python built-in functions](https://docs.python.org/3.12/library/functions.html) | `sorted`, `sum`, `enumerate`, `zip`, `all`, `any`. | Tài liệu **chính thức** |
| [Techcombank Data Scientist discussion (third-party)](https://ub.edu.vn/tuyen-dung-ngan-hang/data-scientist-40000032-techcombank-58945944) | Ý tưởng luyện SQL/Python, thống kê, phân tích nghiệp vụ. | **Tham khảo khác vị trí**, không phải đề thi TFG27 |

**Cách luyện ngay trên website:** chọn **TFG27 Practice Tests** ở menu, làm trước **Python 3.12 + Algorithms**, sau đó Numerical, Deductive/Inductive, SQL/Statistics. Cuối cùng làm **TFG27 Mixed Mock 01** theo giờ và xem lại mọi câu sai. Đáp án và lời giải trong các bộ đề mới là nội dung mô phỏng do chúng tôi biên soạn.
