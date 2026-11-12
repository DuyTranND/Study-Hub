// One-time, deterministic UI-only translation. Source question/lesson data is untouched.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

const htmlTranslations = String.raw`
AI20K All-in-One — Học và luyện tập trong một nơi|AI20K All-in-One — Study and Practice
AI20K All-in-One — 3.301 câu hỏi, 15 bài học, 29 bảng công thức từ AI20K, Vin20K và Hirin.|AI20K All-in-One — 3,301 questions, 15 lessons and 29 formula sheets from AI20K, Vin20K and Hirin.
Đi đến nội dung chính|Skip to main content
Điều hướng|Navigation
HỌC TẬP|STUDY
Tổng quan|Overview
Luyện tập|Practice
Kho câu hỏi|Question Bank
Bài học & công thức|Lessons & Formulas
Mục tiêu hôm nay|Today's goal
Dành ít phút mỗi ngày để tiến bộ.|Make progress a few minutes at a time.
Sẵn sàng học offline|Ready for offline study
Dữ liệu có sẵn offline|Available offline
Luyện ngay|Practice now
KHÔNG GIAN HỌC TẬP|STUDY WORKSPACE
TỔNG QUAN|OVERVIEW
Hôm nay, học gì?|What will you study today?
Ôn tập thông minh, theo dõi tiến độ và tìm lại kiến thức ngay khi cần.|Practice efficiently, track progress and find the knowledge you need.
GỢI Ý CHO BUỔI HỌC TIẾP THEO|YOUR NEXT STUDY SESSION
Bắt đầu với|Start with
20 câu hỏi.|20 questions.
Luyện tập theo chủ đề, xem giải thích sau mỗi câu và lưu lại những câu cần ôn. Tiến độ của bạn được ghi nhớ ngay trên thiết bị.|Practice by topic, review explanations and bookmark questions to revisit. Your progress stays on this device.
Bắt đầu luyện tập|Start practicing
Khám phá câu hỏi|Browse questions
nguồn học liệu|content sources
Chọn cách học|Choose how to study
Chọn một chế độ để bắt đầu ngay.|Pick a mode to get started.
Ôn theo kiến thức|Learn & review
Trả lời và xem giải thích ngay|Answer and see explanations instantly
Thi thử có thời gian|Timed mock exam
Làm đề và nhận kết quả cuối buổi|Complete a test and see your score
Học theo lộ trình|Guided study plan
15 bài học và 29 bảng công thức|15 lessons and 29 formula sheets
Tiến độ được lưu trên thiết bị|Progress saved on this device
Tiến độ ôn tập|Study progress
Tổng số câu hỏi|Total questions
Đã luyện tập|Practiced
Bắt đầu ngay hôm nay|Start today
Trả lời chính xác|Accuracy
Tính trên câu đã chấm|Based on graded answers
Cần ôn lại|Needs review
Những câu bạn đã làm sai|Questions answered incorrectly
THƯ VIỆN / 01|LIBRARY / 01
Chọn ngân hàng để luyện tập|Choose a question bank
Ba bộ câu hỏi, một không gian học tập thống nhất.|Three question banks in one workspace.
Xem toàn bộ|View all
Toán, Python, dữ liệu, Machine Learning, RAG, MLOps và logic.|Math, Python, data, machine learning, RAG, MLOps and logic.
6 đề tổng hợp · 12 chuyên đề|6 mock exams · 12 topics
LLM, AI Agents, RAG, triển khai, sản phẩm AI và tình huống thực tế.|LLMs, AI agents, RAG, deployment, AI products and real-world cases.
15 ngày học · 5 chuyên đề|15 study days · 5 special topics
Toán, thống kê, Python, SQL, AI/ML và đạo đức AI.|Math, statistics, Python, SQL, AI/ML and AI ethics.
45 chủ đề · 4 module|45 topics · 4 modules
LỘ TRÌNH / 02|STUDY PLAN / 02
Học theo từng ngày|Learn day by day
Xem lộ trình|View study plan
15 ngày từ nền tảng đến xây dựng và đánh giá các hệ thống AI. Chọn một bài để bắt đầu.|A 15-day path from fundamentals to building and evaluating AI systems. Select a lesson to begin.
TRA CỨU / 03|REFERENCE / 03
Kiến thức trong tầm tay.|Knowledge at your fingertips.
Tìm lại công thức, ghi chú hoặc câu hỏi bất cứ khi nào bạn cần.|Find formulas, notes and questions whenever you need them.
29 bảng công thức Hirin|29 Hirin formula sheets
Tìm trong 3.301 câu hỏi|Search 3,301 questions
AI20K / NGÂN HÀNG ĐỀ THI|AI20K / TEST LIBRARY
Thư viện đề thi|Test Library
Tìm một bộ đề, xem số câu và thời gian, sau đó bắt đầu luyện ngay.|Find a test, check the question count and duration, then start practicing.
Về thư viện đề|Back to test library
CHỌN HÌNH THỨC LUYỆN TẬP|CHOOSE A PRACTICE MODE
83 bộ đề từ ba nguồn học liệu.|83 question sets across three sources.
Thi thử|Mock exams
Làm đề có giới hạn thời gian|Take a timed exam
Theo lộ trình|Study plan
Học lần lượt từng ngày|Follow the daily lessons
Theo chủ đề|By topic
Tập trung một mảng kiến thức|Focus on one subject
Tất cả|All
Xem toàn bộ kho đề|Browse every question set
Tìm theo tên, mã đề hoặc chủ đề...|Search titles, test codes or topics...
Tìm bộ đề|Search question sets
Nguồn đề|Source
Cả ba nguồn|All three sources
AI20K · 18 bộ|AI20K · 18 sets
Vin20K · 20 bộ|Vin20K · 20 sets
Hirin · 45 bộ|Hirin · 45 sets
Lĩnh vực|Subject
Tất cả lĩnh vực|All subjects
Toán học &amp; thống kê|Math &amp; Statistics
Lập trình &amp; dữ liệu|Programming &amp; Data
Học máy &amp; học sâu|Machine Learning &amp; Deep Learning
Sản phẩm AI &amp; hệ thống|AI Products &amp; Systems
MLOps &amp; vận hành|MLOps &amp; Operations
Logic, đạo đức &amp; an toàn|Logic, Ethics &amp; Safety
Tổng hợp &amp; mở rộng|General &amp; Advanced
Lọc theo nguồn bộ đề|Filter by source
Lọc theo lĩnh vực|Filter by subject
Xóa lọc|Clear filters
Đề thi thử|Mock Exams
Đang tải bộ đề...|Loading question sets...
Trang thư viện bộ đề|Test library pages
Không tìm thấy bộ đề phù hợp.|No matching question sets.
Xóa bộ lọc và thử lại|Clear filters and try again
Tự tạo buổi luyện|Custom practice session
Chọn số câu, nguồn đề hoặc ôn lại những câu đã làm sai.|Choose question count, source or previously missed questions.
Tùy chỉnh|Customize
Thiết lập buổi học|Session settings
TÙY CHỈNH|CUSTOM
Nguồn câu hỏi|Question source
Cả ba ngân hàng|All question banks
Bộ đề / Chủ đề|Set / Topic
Tất cả chủ đề|All topics
Số lượng câu hỏi|Number of questions
10 câu · Nhanh|10 questions · Quick
20 câu · Tiêu chuẩn|20 questions · Standard
30 câu · Chuyên sâu|30 questions · Focused
60 câu · Đề tổng hợp|60 questions · Full test
100 câu · Đề dài|100 questions · Extended
Toàn bộ trong bộ lọc|All matching questions
Hình thức|Session mode
Luyện kiến thức · Xem đáp án ngay|Practice · Instant feedback
Thi thử · Chấm điểm cuối buổi|Mock exam · Score at the end
Chỉ ôn những câu đã trả lời sai|Review incorrect answers only
Chỉ ôn câu đã đánh dấu|Bookmarked questions only
Đang tải ngân hàng...|Loading question bank...
Bắt đầu học|Start session
ĐANG LUYỆN|IN PROGRESS
Buổi học của bạn|Your study session
Danh sách câu hỏi|Question navigator
Chuyển đến câu hỏi|Jump to question
● Đã trả lời &nbsp;&nbsp; ☆ Đã đánh dấu|● Answered &nbsp;&nbsp; ☆ Bookmarked
← Câu trước|← Previous question
Câu tiếp theo|Next question
Ghi nhớ|Study tips
Học chủ động bằng cách tự trả lời trước khi xem giải thích. Hãy đánh dấu những câu bạn muốn quay lại.|Try answering before viewing explanations. Bookmark questions you want to revisit.
Học theo chủ đề|Study by topic
Tập trung từng nhóm kiến thức|Focus on one topic at a time
Đánh giá tiến độ|Track your progress
Tự động lưu tại trình duyệt|Automatically saved in your browser
Ôn tập câu sai|Review mistakes
Củng cố điểm yếu của bản thân|Strengthen areas that need work
Điều hay nhất của việc học|The best part of learning
Không phải tốc độ, mà là mỗi ngày đều hiểu thêm một điều mới.|Progress means understanding a little more each day.
Tìm đúng kiến thức bạn cần giữa 3.301 câu hỏi.|Find what you need among 3,301 questions.
Luyện ngẫu nhiên|Random practice
Tìm câu hỏi, kiến thức, từ khóa...|Search questions, topics or keywords...
Nguồn|Source
Tất cả nguồn|All sources
Chuyên đề|Question set
Tất cả bộ đề|All question sets
Trạng thái|Status
Mọi trạng thái|All statuses
Chưa làm|Not attempted
Đã đúng|Correct
Đã đánh dấu|Bookmarked
3.301 câu hỏi|3,301 questions
Nhấn vào một câu để bắt đầu luyện|Select a question to start practicing
← Trước|← Previous
Sau →|Next →
HỌC LIỆU TỪ BA NGUỒN|LEARNING RESOURCES FROM THREE SOURCES
Học theo lộ trình Vin20K hoặc tra cứu cheatsheet Hirin; chuyển sang luyện tập bất cứ lúc nào.|Follow the Vin20K study plan or browse Hirin cheat sheets. Practice at any time.
Chọn tài liệu|Choose study material
15 bài học Vin20K|15 Vin20K lessons
29 cheatsheet Hirin|29 Hirin cheat sheets
Ngân hàng AI20K →|AI20K Question Bank →
Chọn một ngày để bắt đầu|Choose a day to begin
Nội dung bài học và bài luyện tương ứng sẽ xuất hiện ở đây.|The lesson and its practice questions will appear here.
Tìm bảng công thức...|Search formula sheets...
Tìm cheatsheet|Search cheat sheets
29 bộ công thức|29 formula sheets
Chọn bảng công thức|Choose a formula sheet
Công thức, ghi chú và ví dụ được hiển thị ngay trong website này.|Formulas, notes and examples appear directly on this site.
Ngân hàng câu hỏi|Question bank
câu hỏi|questions
`;

const jsTranslations = String.raw`
Không thể lưu tiến độ. Kiểm tra bộ nhớ trình duyệt.|Could not save your progress. Check your browser storage.
Bài học & công thức|Lessons & Formulas
Tổng quan|Overview
Luyện tập|Practice
Kho câu hỏi|Question Bank
Toán học & thống kê|Math & Statistics
Đại số, giải tích, xác suất, thống kê và định lượng.|Algebra, calculus, probability, statistics and quantitative reasoning.
Lập trình & dữ liệu|Programming & Data
Python, SQL, thuật toán, xử lý dữ liệu và pipeline.|Python, SQL, algorithms, data processing and pipelines.
Học máy & học sâu|Machine Learning & Deep Learning
Mô hình ML, Deep Learning, NLP, thị giác máy tính và đánh giá.|ML, deep learning, NLP, computer vision and evaluation.
Mô hình ngôn ngữ, truy xuất tri thức, prompt và agent.|Language models, retrieval, prompting and agents.
Sản phẩm AI & thiết kế hệ thống|AI Products & System Design
Yêu cầu sản phẩm, kiến trúc, thiết kế và tình huống ứng dụng.|Product requirements, architecture, design and use cases.
MLOps & vận hành|MLOps & Operations
Triển khai, giám sát, ghi log và khắc phục sự cố.|Deployment, monitoring, logging and troubleshooting.
Logic, đạo đức & an toàn AI|Logic, Ethics & AI Safety
Tư duy phản biện, bảo mật, quyền riêng tư, công bằng và quy định.|Critical thinking, security, privacy, fairness and regulation.
Tổng hợp & mở rộng|General & Advanced
Các bộ mở rộng kết hợp nhiều mảng kiến thức.|Advanced sets covering several knowledge areas.
Đề thi thử tổng hợp|Full-length Mock Exams
Đề đánh giá năng lực, 60 câu · 90 phút · chấm điểm cuối buổi.|Assessment tests, 60 questions · 90 minutes · graded at the end.
Lộ trình 15 ngày|15-Day Study Plan
Mỗi ngày một chủ đề từ nền tảng đến ứng dụng và vận hành AI.|One topic per day, from foundations to AI applications and operations.
Chọn đề thi thử|Choose a mock exam
Chọn ngày học|Choose a study day
Chọn chủ đề|Choose a topic
Tất cả bộ đề|All question sets
Bộ câu hỏi luyện tập theo nội dung đã chọn.|A practice set for your chosen topic.
Không giới hạn|Untimed
Chưa luyện tập|Not started
Chấm điểm sau khi nộp bài.|Results are graded after submission.
Có thể kiểm tra đáp án và xem giải thích khi luyện.|Check answers and explanations during practice.
Chi tiết đề|Set details
Tùy chỉnh số câu và chế độ →|Customize question count and mode →
Làm đề thi|Take exam
Luyện ngay|Practice now
Tất cả chủ đề|All topics
Buổi luyện của bạn|Your study session
Thư viện đề thi|Test Library
Trả lời lần lượt từng câu. Tiến độ sẽ được lưu tự động.|Answer each question in turn. Your progress saves automatically.
Tìm bộ đề theo nguồn và chủ đề, xem số câu, thời gian và bắt đầu luyện ngay.|Browse sets by source and topic, check question count and duration, then start.
Chưa có câu hỏi phù hợp bộ lọc.|No questions match these filters.
Không có câu hỏi phù hợp. Hãy đổi bộ lọc.|No matching questions. Try adjusting the filters.
Bạn hãy nhập câu trả lời trước.|Enter your answer first.
XEM LẠI BÀI|REVIEW ANSWERS
THI THỬ|MOCK EXAM
LUYỆN KIẾN THỨC|PRACTICE MODE
Xem kết quả →|View results →
Nộp bài →|Submit exam →
Hoàn thành →|Finish →
Câu tiếp theo|Next question
Nhập kết quả số...|Enter a numeric answer...
Nhập kết quả chương trình...|Enter the program output...
Nhập lời giải hoặc ý tưởng của bạn...|Enter your solution or ideas...
✓ Chính xác!|✓ Correct!
Đáp án và giải thích|Answer and explanation
Bài giải tham khảo|Example solution
Đáp án đúng:|Correct answer:
Kết quả mong đợi:|Expected result:
Xem giải thích chi tiết|Show detailed explanation
Cần ôn lại|Needs review
Đã hiểu câu này|I understand this question
Trắc nghiệm|Multiple choice
Tự luận|Written response
Viết code|Coding
Điền số|Numeric answer
Điền kết quả|Output answer
Đã lưu|Saved
Đánh dấu|Bookmark
Kiểm tra đáp án|Check answer
Xem bài giải|View solution
Xem gợi ý|Show hint
KẾT QUẢ BUỔI HỌC|SESSION RESULTS
Bạn đã hoàn thành!|Session complete!
Làm bài mới →|Start a new session →
Câu đúng / đã chấm|Correct / graded
Câu đã trả lời|Answered
Tỉ lệ chính xác|Accuracy
Chọn một câu để xem lại đáp án và lời giải. Câu tự luận / viết code cần tự đánh giá.|Select a question to review its answer and explanation. Written and coding responses require self-assessment.
✓ Đúng|✓ Correct
✗ Sai|✗ Incorrect
— Bỏ trống|— Skipped
Đã nộp|Submitted
Không tìm thấy câu hỏi|No questions found
Thử tìm từ khóa ngắn hơn hoặc đổi bộ lọc.|Try a shorter search or change the filters.
Đã xem|Viewed
Chưa làm|Not attempted
Đã đúng|Correct
Cần ôn|Review
bộ công thức|formula sheets
mục ghi nhớ|reference items
Không tìm thấy cheatsheet phù hợp.|No matching cheat sheets.
Đang tải bảng công thức...|Loading formula sheet...
Không đọc được bảng công thức:|Could not load formula sheet:
Luyện câu hỏi Hirin|Practice Hirin questions
MỤC|ITEMS
Đang mở bài học...|Opening lesson...
Ngày |Day 
Luyện 100 câu của ngày này|Practice today's 100 questions
Không đọc được nội dung bài học:|Could not load lesson:
Đã bỏ đánh dấu.|Bookmark removed.
Đã lưu vào danh sách ôn tập.|Question bookmarked for review.
Đã lưu tự đánh giá.|Self-assessment saved.
Dữ liệu ngân hàng không đầy đủ|Question bank data is incomplete
Không tải được danh mục công thức|Could not load formula sheet index
Lỗi dữ liệu|Data error
Không thể tải câu hỏi:|Could not load questions:
Không thể tải ngân hàng câu hỏi.|Could not load question bank.
câu hỏi|questions
câu phù hợp|matching questions
đã trả lời|answered
đã đánh dấu|bookmarked
đang dùng|active
bộ đề|sets
phút|minutes
Đã luyện|Practiced
Tùy chỉnh:|Customize:
Bắt đầu|Start
Hiển thị|Showing
Trang |Page 
Trước|Previous
Sau →|Next →
câu|questions
`;

function parseTranslations(table) {
  return table.trim().split('\n').filter(Boolean).map(line => {
    const at = line.indexOf('|');
    if (at < 0) throw new Error('Translation missing delimiter: ' + line);
    return [line.slice(0, at), line.slice(at + 1)];
  }).sort((a, b) => b[0].length - a[0].length);
}

for (const [filename, table] of [['index.html', htmlTranslations], ['app.js', jsTranslations]]) {
  const filepath = path.join(root, filename);
  let source = fs.readFileSync(filepath, 'utf8');
  let n = 0;
  for (const [from, to] of parseTranslations(table)) {
    if (!source.includes(from)) continue;
    source = source.replaceAll(from, to);
    n++;
  }
  if (filename === 'index.html') {
    source = source.replace('<html lang="vi">', '<html lang="en">').replaceAll('3.301', '3,301');
  }
  fs.writeFileSync(filepath, source);
  console.log(`${filename}: updated ${n} UI phrases`);
}
