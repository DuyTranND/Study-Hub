// Reviewed corrections to imported questions. IDs, option keys and test membership
// remain stable so existing user progress continues to point at the same questions.
// Imported source websites are deliberately left untouched.
const fs = require('node:fs');
const path = require('node:path');

const keys = ['A', 'B', 'C', 'D'];
const corrected = new Set();

function revise(q, { prompt, correct, wrong, explanation, detail }) {
  if (!q || q.type !== 'mcq' || !q.options.some(o => o.key === q.answer)) {
    throw new Error('Invalid correction target: ' + (q?.id ?? '(missing)'));
  }
  if (prompt) q.prompt = prompt;
  if (correct) q.options.find(o => o.key === q.answer).text = correct;
  if (wrong) {
    if (wrong.length !== 3) throw new Error('Need three distractors: ' + q.id);
    keys.filter(k => k !== q.answer).forEach((key, i) => {
      q.options.find(o => o.key === key).text = wrong[i];
    });
  }
  if (explanation) q.explanation = explanation;
  if (detail !== undefined) q.detail = detail;
  else if (explanation) q.detail = explanation;
  else if ((correct || wrong) && q.bank !== 'ai20k') q.detail = q.explanation;
  corrected.add(q.id);
}

function applyCorrections(questions) {
  corrected.clear();
  const byId = new Map(questions.map(q => [q.id, q]));
  const apply = (id, changes) => {
    if (!byId.has(id)) throw new Error('Missing editorial question ' + id);
    revise(byId.get(id), changes);
  };
  const reviseFive = (day, first, changes) => {
    for (let q = first; q <= Math.min(first + 40, 100); q += 10) apply(`v:${day}_Q${q}`, changes);
  };

  reviseFive('D03', 57, {
    prompt: 'Cấu trúc System Prompt nào dưới đây bao quát nhất các hướng dẫn thường cần cho AI Agent khi triển khai thực tế?',
    wrong: [
      '1. Vai trò trợ lý, 2. Màu sắc giao diện, 3. Tên sản phẩm, 4. Phông chữ hiển thị, 5. Thông điệp tiếp thị; không quy định quyền sử dụng tool hay giới hạn an toàn.',
      '1. Vai trò trợ lý, 2. Mô hình nền, 3. Dung lượng bộ nhớ, 4. Số lõi CPU, 5. Đơn giá API; không mô tả cách trả lời và xử lý tình huống rủi ro.',
      '1. Phong cách diễn đạt, 2. Độ dài phản hồi, 3. Ngôn ngữ trả lời, 4. Ví dụ mẫu, 5. Giọng điệu thương hiệu; không giới hạn công cụ hoặc hành vi.'
    ]
  });
  reviseFive('D05', 54, {
    wrong: [
      'Khi sử dụng ứng dụng, bạn thích cấu hình GPU hoặc công nghệ lưu trữ vector nào nhất, dù điều đó không ảnh hưởng tới cách xử lý sai sót?',
      'Bạn có muốn hệ thống luôn trả lời chắc chắn và tự tin ngay cả khi dữ liệu thiếu, thay vì báo không chắc chắn hoặc chuyển tiếp hỗ trợ?',
      'Bạn thích chatbot dùng câu trả lời dài hay ngắn và màu giao diện nào, nhưng không cần thảo luận về lỗi hoặc ngưỡng tin cậy?'
    ]
  });
  reviseFive('D06', 60, {
    correct: 'Giải thích AI có thể mắc lỗi, thống nhất mức chất lượng chấp nhận được, cách kiểm soát rủi ro, vai trò giám sát của con người và chỉ số đo hiệu quả.',
    wrong: [
      'Cam kết hệ thống AI đạt độ chính xác 100% trên mọi trường hợp thực tế, không cần kiểm thử hoặc quy trình xử lý khi dự đoán sai.',
      'Khẳng định khi đưa AI vào production thì không cần vận hành, giám sát, bảo trì hay nhân sự can thiệp dù môi trường thay đổi.',
      'Chỉ trình bày số tham số của mô hình và điểm benchmark, không làm rõ mức rủi ro có thể chấp nhận hoặc thước đo kinh doanh.'
    ]
  });
  reviseFive('D08', 72, {
    prompt: 'Vì sao Hybrid Search kết hợp Dense Vector và BM25 thường hữu ích trong hệ thống RAG doanh nghiệp?',
    wrong: [
      'Vì BM25 luôn hiểu tốt mọi từ đồng nghĩa và câu diễn đạt lại, còn Dense Vector chỉ tìm được các từ khóa trùng khớp chính xác.',
      'Vì kết hợp hai phương pháp khiến kết quả luôn chính xác tuyệt đối và không cần reranking hay đánh giá truy xuất trên dữ liệu thật.',
      'Vì Dense Vector chỉ hoạt động khi không có văn bản, còn BM25 chỉ hoạt động trên dữ liệu ảnh nên hai bên phải dùng cùng lúc.'
    ]
  });
  reviseFive('D09', 58, {
    correct: 'Biểu diễn workflow của agent bằng đồ thị các node và edge có điều kiện; các bước chia sẻ, cập nhật state và có thể tạo vòng lặp xử lý.',
    wrong: [
      'Chỉ cung cấp thư viện vẽ biểu đồ quan sát trong dashboard, không thể định nghĩa các bước xử lý hoặc luồng điều khiển của agent.',
      'Chỉ cho phép ghép các lời gọi LLM thành chuỗi tuyến tính một chiều, không có trạng thái chung hay nhánh xử lý có điều kiện.',
      'Chỉ dùng để lưu danh sách model và API key ở cấu hình tĩnh, không hỗ trợ node, edge hoặc cơ chế chuyển trạng thái.'
    ]
  });
  reviseFive('D12', 58, {
    prompt: 'Trong Kubernetes, liveness probe (`/healthz`) và readiness probe (`/ready`) khác nhau như thế nào?',
    correct: 'Liveness kiểm tra tiến trình có còn hoạt động và cần restart hay không; readiness kiểm tra ứng dụng đã sẵn sàng nhận request để đưa vào luồng traffic.',
    wrong: [
      '`/healthz` chỉ kiểm tra ứng dụng có tải xong model và nhận traffic chưa; `/ready` chỉ kiểm tra container có còn chạy hay đã bị treo.',
      'Hai probe luôn đồng nghĩa trong Kubernetes; cả hai đều buộc restart container ngay khi kết nối tới cơ sở dữ liệu tạm mất.',
      '`/healthz` kiểm tra CPU và dung lượng đĩa còn `/ready` chỉ đo số request/s; không probe nào quyết định có nên nhận traffic.'
    ]
  });
  reviseFive('D12', 59, {
    correct: 'Không hardcode API key trong mã nguồn hay Dockerfile, không commit secret vào Git; cấp bí mật lúc chạy bằng secret manager hoặc biến môi trường được bảo vệ.',
    wrong: [
      'Đưa API key trực tiếp vào Dockerfile hoặc mã nguồn để tiện build image, sau đó đẩy repository lên Git để mọi máy dùng chung.',
      'Lưu API key trong một file .env rồi commit vào repository công khai; chỉ cần đổi tên file là đủ để tránh rò rỉ bí mật.',
      'In API key và token vào log debug khi production gặp lỗi, rồi giữ log lâu dài mà không áp dụng che giấu dữ liệu nhạy cảm.'
    ]
  });
  reviseFive('D12', 60, {
    wrong: [
      'Khi nhóm có đội ngũ SRE giàu kinh nghiệm, muốn tự kiểm soát toàn bộ hạ tầng và tùy biến sâu hơn các dịch vụ quản lý sẵn có.',
      'Khi quy định bắt buộc chạy air-gapped không kết nối Internet và nền tảng managed được chọn chỉ cung cấp hạ tầng cloud công khai.',
      'Khi phải kiểm soát chặt từng lớp serving và tối ưu chi phí theo tải đặc thù mà nền tảng managed không hỗ trợ.'
    ]
  });
  reviseFive('D13', 71, {
    wrong: [
      'Chỉ theo dõi dung lượng ổ cứng và lượng RAM còn trống; không ghi lại token, chi phí mỗi request hay chất lượng phản hồi.',
      'Chỉ theo dõi số lần triển khai và số lượng container; bỏ qua lượng token tiêu thụ và tính đúng đắn của câu trả lời.',
      'Chỉ đo băng thông mạng và cache hit rate của server; không phát hiện trả lời bịa đặt hay API cost tăng đột biến.'
    ]
  });
  reviseFive('D14', 52, {
    correct: 'Bao phủ tình huống thực tế và ca biên, có đáp án chuẩn được chuyên gia xác minh, đồng thời được cập nhật và quản lý phiên bản theo thay đổi sản phẩm.',
    wrong: [
      'Chỉ lấy một số câu hỏi dễ và phổ biến để điểm benchmark cao, không cần tình huống khó, ca biên hoặc dữ liệu người dùng thật.',
      'Dùng hoàn toàn dữ liệu tổng hợp chưa được kiểm tra, không cần ground truth hay chuyên gia xác nhận câu trả lời.',
      'Chỉ tái sử dụng tập câu hỏi cố định từ bản demo ban đầu, không cập nhật khi sản phẩm và nhu cầu người dùng thay đổi.'
    ]
  });
  reviseFive('D15', 56, {
    correct: '1. Product & System Thinking (bài toán, giá trị), 2. Core Technical Architecture (Prompt, RAG, Agent, MCP), 3. Production Engineering (bảo mật, triển khai, quan sát, đánh giá).',
    wrong: [
      '1. Chỉ học viết prompt mẫu, 2. Chỉ gọi API model, 3. Chỉ tạo giao diện chatbot; bỏ qua hệ thống retrieval, đánh giá và vận hành.',
      '1. Chỉ học kiến trúc mạng nơ-ron, 2. Chỉ tối ưu pre-training, 3. Chỉ xây benchmark offline; bỏ qua thiết kế sản phẩm và triển khai thực tế.',
      '1. Chỉ học công cụ dashboard, 2. Chỉ thiết kế landing page, 3. Chỉ tối ưu tốc độ gõ nhập liệu; bỏ qua bảo mật và chất lượng AI.'
    ]
  });

  // Keep the literal Python/regex outputs concise and avoid length cues.
  apply('a:E02-B13', {
    wrong: [
      '`ValueError` do hai shape không broadcast được',
      '`(3, 4) 18.0`',
      '`(4, 3) 30.0`'
    ]
  });
  apply('a:E03-B11', {
    wrong: [
      "`['GET /mods/42 HTTP/1.1', '-', 'Mozilla/5.0']`",
      "`['GET /mods/42 HTTP/1.1']`",
      '`[]` (không tìm thấy kết quả khớp với regex)'
    ]
  });

  // Arithmetic: 2 (K and V) * 2 bytes * 16 layers * 16 heads *
  // 64 values/head * 4,096 tokens = 268,435,456 bytes = 256 MiB.
  for (const suffix of [55, 65, 75, 85, 95]) {
    apply(`v:QUANT_Q${suffix}`, {
      correct: 'Khoảng 268,4 MB (256 MiB): 2 × 2 bytes × 16 layers × 16 heads × 64 chiều/head × 4.096 tokens.',
      wrong: [
        'Khoảng 67,1 MB: nhầm kết quả vì bỏ sót một hệ số 4 khi nhân các chiều của KV Cache.',
        'Khoảng 134,2 MB: tính bộ nhớ chỉ cho Key hoặc chỉ cho Value, chưa tính cả hai.',
        'Khoảng 536,9 MB: nhân đôi kết quả lần nữa sau khi đã tính cả Key và Value.'
      ],
      explanation: 'KV Cache lưu cả Key và Value cho mỗi layer, mỗi head và mỗi token. Dung lượng = 2 × 2 × 16 × 16 × 64 × 4096 = 268.435.456 bytes ≈ 268,4 MB (256 MiB). Nếu có 100 request tương đương thì cần khoảng 25 GiB chỉ cho KV Cache; đây là ước lượng chưa tính overhead khác.'
    });
  }

  for (const suffix of [56, 66, 76, 86, 96]) {
    apply(`v:D13_Q${suffix}`, {
      correct: 'Langfuse có phần lõi mã nguồn mở theo MIT và hỗ trợ self-host; LangSmith là nền tảng thương mại có cả bản cloud lẫn phương án self-host cho khách hàng doanh nghiệp.',
      wrong: [
        'Langfuse chỉ hỗ trợ dịch vụ cloud và không cho triển khai nội bộ; LangSmith được phát hành hoàn toàn miễn phí theo MIT cho mọi thành phần và tính năng.',
        'Langfuse chỉ dùng để đánh giá mô hình trước huấn luyện; LangSmith chỉ đo hạ tầng CPU/RAM và không có tính năng tracing cho ứng dụng LLM.',
        'Cả Langfuse và LangSmith đều bắt buộc triển khai hoàn toàn tại chỗ, không hỗ trợ các dịch vụ cloud do nhà cung cấp vận hành và bảo trì.'
      ],
      explanation: 'Phần lõi của Langfuse có giấy phép MIT, trong khi một số tính năng doanh nghiệp dùng giấy phép thương mại; có thể triển khai Langfuse trên hạ tầng riêng. LangSmith là sản phẩm thương mại của LangChain với các lựa chọn cloud, BYOC và self-host theo gói doanh nghiệp. Self-host không đồng nghĩa với bảo mật tuyệt đối: vẫn cần cấu hình quyền truy cập, mạng và chính sách log phù hợp.'
    });
  }

  const jitterCorrect = 'Khi retry, tăng giới hạn thời gian chờ theo cấp số nhân rồi chọn ngẫu nhiên một khoảng từ 0 đến giới hạn đó (Full Jitter), giúp các client tránh đồng loạt gửi lại lúc máy chủ quá tải.';
  const jitterWrong = [
    'Thử lại theo khoảng thời gian cố định cho mọi request thất bại, không thay đổi theo số lần retry nên các client vẫn có thể đồng loạt gửi lại.',
    'Chỉ thêm một độ trễ ngẫu nhiên rất nhỏ quanh một khoảng chờ cố định và giữ nguyên giới hạn qua mọi lần thử, kể cả khi máy chủ liên tục trả 429.',
    'Tăng thời gian chờ theo cấp số nhân nhưng không thêm biến thiên ngẫu nhiên; các tiến trình bắt đầu cùng lúc vẫn có nguy cơ retry đồng bộ.'
  ];
  for (const suffix of [54, 59, 64, 69, 74, 79, 84, 89, 94, 99]) {
    apply(`v:SPEC03_Q${suffix}`, {
      correct: jitterCorrect,
      wrong: jitterWrong,
      explanation: 'Với lần thử lại k, giới hạn chờ có thể là min(cap, base × 2^k). Full Jitter chọn thời gian chờ ngẫu nhiên phân bố đều trong [0, giới hạn]. Cách này phân tán các lần retry, giảm hiện tượng thundering herd. Việc chỉ cộng một lượng nhiễu nhỏ vào lịch 1s, 2s, 4s... không phải Full Jitter.'
    });
  }

  for (const suffix of [53, 63, 73, 83, 93]) {
    apply(`v:D12_Q${suffix}`, {
      correct: 'Multi-stage build tách bước cài đặt/biên dịch khỏi runtime, chỉ sao chép artifact cần thiết sang image cuối; uv có thể rút ngắn cài dependencies tùy môi trường và cache.',
      wrong: [
        'Giữ mọi compiler, cache và dependency phát triển trong image runtime để tránh cần stage builder; cách này mặc nhiên giúp image nhỏ hơn và an toàn hơn.',
        'Chỉ dùng uv để nén toàn bộ mã nguồn thành một file duy nhất rồi chạy trực tiếp mà không cần Python runtime hay thư viện phụ thuộc.',
        'Bắt buộc build lại toàn bộ dependencies mỗi lần khởi chạy container, không tái sử dụng artifact đã tạo ở giai đoạn builder.'
      ],
      explanation: 'Multi-stage Docker build dùng một stage tạo/cài dependency và một stage runtime chỉ giữ những gì ứng dụng cần, qua đó thường giảm kích thước image và bề mặt tấn công. uv có thể giúp bước cài đặt nhanh hơn, nhưng không có bảo đảm chung là mọi lần Docker build nhanh gấp 10 lần. Tốc độ phụ thuộc cache, package, hệ thống và cách thiết kế Dockerfile.'
    });
  }

  apply('h:A5_002', {
    correct: 'Giả sử H0 đúng, xác suất thu được thống kê kiểm định ít nhất cực đoan như giá trị đã quan sát.',
    wrong: [
      'Xác suất H0 đúng sau khi đã quan sát dữ liệu, không cần thêm giả định nào về mô hình kiểm định.',
      'Xác suất giả thuyết đối H1 sai, được suy ra trực tiếp từ số lượng mẫu trong nghiên cứu.',
      'Xác suất mẫu dữ liệu được thu thập chính xác, hoàn toàn không chịu ảnh hưởng của sai số đo.'
    ],
    explanation: 'P-value = P(thống kê kiểm định ít nhất cực đoan như quan sát | H0 đúng), với quy tắc xác định mức cực đoan phụ thuộc giả thuyết đối và phép kiểm định. Đây không phải P(H0 đúng | dữ liệu), cũng không phải xác suất kết quả chỉ do ngẫu nhiên.'
  });

  apply('v:D08_Q60', {
    wrong: [
      'Faithfulness, Answer Relevance, BLEU và ROUGE: hai chỉ số cho câu trả lời kèm hai phép so khớp văn bản truyền thống, không đánh giá đầy đủ retrieval.',
      'Context Precision, Context Recall, MRR và nDCG: bốn chỉ số chỉ tập trung vào hiệu quả truy xuất và xếp hạng, thiếu chỉ số phản ánh chất lượng câu trả lời.',
      'Accuracy, Precision, Recall và F1: bộ chỉ số quen thuộc của phân loại, không trực tiếp thể hiện tính có căn cứ của câu trả lời hay mức liên quan của context.'
    ],
    explanation: 'Bốn thước đo kinh điển được dùng để mô tả đánh giá RAG gồm Faithfulness và Answer Relevance cho câu trả lời, cùng Context Precision và Context Recall cho phần truy xuất. Đây là nhóm chỉ số thường gặp; RAGAS còn hỗ trợ nhiều thước đo khác tùy phiên bản.'
  });

  apply('v:D13_Q78', {
    correct: 'Khi cảnh báo nhiễu hoặc lặp lại quá nhiều khiến người trực bỏ qua cả sự cố thật; giảm bằng ngưỡng gắn với SLO, thời gian duy trì, mức độ nghiêm trọng và gom nhóm cảnh báo.',
    wrong: [
      'Khi nhân viên trực nhận quá nhiều cảnh báo; giải pháp là tắt hoàn toàn mọi cảnh báo, kể cả sự cố nghiêm trọng, để tránh gián đoạn trong ca trực.',
      'Khi chỉ số độ trễ vượt ngưỡng ngắn hạn; giải pháp là tăng mọi thông báo lên mức critical và gửi đồng loạt đến toàn bộ nhân viên ở mọi bộ phận.',
      'Khi có cảnh báo không chính xác; giải pháp là chỉ theo dõi trung bình CPU/RAM mỗi ngày, bỏ hoàn toàn tỷ lệ lỗi và độ trễ theo phân vị của dịch vụ.'
    ],
    explanation: 'Alert fatigue xảy ra khi có quá nhiều cảnh báo không hữu ích, lặp lại hoặc thiếu ưu tiên, khiến đội vận hành bỏ sót sự cố quan trọng. Nên đặt ngưỡng gắn với SLO, phân cấp mức độ, chỉ phát cảnh báo khi tình trạng kéo dài hợp lý và nhóm các cảnh báo liên quan. P95/P99 hữu ích với latency nhưng không phải quy tắc bắt buộc cho mọi loại cảnh báo.'
  });

  apply('v:D03_Q87', {
    prompt: 'Trong các cấu hình sau, System Prompt nào mô tả đầy đủ nhất vai trò, quyền hạn và hành vi của một AI Agent dùng trong production?',
    wrong: [
      'Chỉ định role, temperature và max_tokens; để mô hình tự quyết phạm vi công cụ, xử lý lỗi và định dạng đầu ra mà không đặt giới hạn cụ thể.',
      'Mô tả toàn bộ tool và ví dụ output, nhưng yêu cầu agent tự cấp thêm quyền nếu thiếu thông tin, bỏ qua kiểm tra tham số trước khi thực thi.',
      'Chỉ đưa vài ví dụ hội thoại và định dạng JSON; không xác định những hành động agent được phép thực hiện hay cách phản hồi khi tool thất bại.'
    ],
    explanation: 'Một System Prompt rõ ràng thường mô tả vai trò, mục tiêu, công cụ có thể dùng, ràng buộc an toàn, quy tắc đầu ra và ví dụ cần thiết. Các kiểm soát quyền hạn quan trọng còn phải được thực thi ở ứng dụng, không chỉ dựa vào prompt.'
  });

  apply('v:D15_Q72', {
    prompt: 'Trong phân tích chi phí vận hành AI Agent ở quy mô lớn, nhóm biến phí kỹ thuật nào cần đưa vào khi lưu lượng request và số token tăng?',
    wrong: [
      'Chỉ gồm chi phí thiết kế giao diện, xây dựng thương hiệu và viết tài liệu sử dụng; những hạng mục này tăng tuyến tính theo mỗi token xử lý.',
      'Chỉ gồm chi phí mua thiết bị cho nhân viên phát triển; sau khi triển khai thì suy luận, cơ sở dữ liệu và băng thông không phát sinh thêm chi phí.',
      'Chỉ gồm phí đăng ký tên miền cố định theo năm; dữ liệu và mô hình có thể phục vụ vô hạn request mà không dùng thêm tài nguyên hạ tầng.'
    ],
    explanation: 'Chi phí suy luận theo token/API hoặc GPU, cùng chi phí truyền tải, lưu trữ và truy vấn dữ liệu, thường biến động theo tải. Cần đo riêng input/output tokens, caching, vector DB, network và các bước tool/evaluation để lập mô hình chi phí.'
  });

  apply('v:D08_Q61', {
    wrong: [
      'Chỉ nhúng toàn bộ dữ liệu một lần rồi cho mô hình sinh câu trả lời từ các embedding; không có bước truy xuất các tài liệu liên quan theo câu hỏi.',
      'Truy xuất câu trả lời sẵn có, bỏ qua bước chuẩn hóa và lập chỉ mục tài liệu; luôn gửi toàn bộ kho dữ liệu thô vào context của LLM.',
      'Huấn luyện lại mọi trọng số của LLM cho từng câu hỏi mới, sau đó tải mô hình đã train để trả lời mà không cần tìm tài liệu bên ngoài.'
    ],
    explanation: 'Pipeline RAG thường gồm chuẩn bị và lập chỉ mục (indexing), truy xuất (retrieval), tùy chọn lọc/xếp hạng lại (reranking/filtering), rồi đưa bằng chứng vào bước sinh câu trả lời (generation). Các triển khai có thể gộp hoặc mở rộng các bước.'
  });

  apply('v:D09_Q88', {
    wrong: [
      'LangGraph lưu toàn bộ tri thức vào embedding và tự động trả lời trực tiếp từ vector store, không cần định nghĩa state hoặc các bước chuyển xử lý.',
      'LangGraph chỉ là bộ điều chỉnh temperature và sampling cho LLM, không có node, cạnh hay cơ chế điều phối các bước gọi công cụ.',
      'LangGraph buộc mọi tác tử chạy đồng thời trong một vòng lặp vô hạn và không thể dừng, rẽ nhánh hoặc lưu trạng thái giữa các lần chạy.'
    ],
    explanation: 'LangGraph biểu diễn luồng xử lý bằng các node (bước tính toán) và edge (đường chuyển), chia sẻ state và cho phép định nghĩa rẽ nhánh, vòng lặp có kiểm soát, lưu và phục hồi trạng thái qua checkpointer.'
  });

  apply('v:D02_Q98', {
    wrong: [
      'Mọi developer tham gia triển khai đều mặc nhiên cùng là Accountable, không cần xác định người chịu trách nhiệm cuối cùng cho kết quả.',
      'Bộ phận QA chịu trách nhiệm cuối cùng cho mục tiêu kinh doanh dù chỉ thực hiện kiểm thử kỹ thuật và không sở hữu sản phẩm.',
      'Bản thân AI Agent được gán vai trò Accountable vì có thể tạo phản hồi và quyết định hành động mà không cần giám sát con người.'
    ],
    explanation: 'Trong RACI, Accountable là một cá nhân có trách nhiệm cuối cùng cho việc ra quyết định và kết quả, thường là PM hoặc chủ sở hữu nghiệp vụ của tính năng. Responsible là người trực tiếp triển khai; các vai trò này cần được xác định cụ thể theo tổ chức.'
  });

  apply('v:SPEC02_Q53', {
    wrong: [
      'Phát hiện PII và thay bằng placeholder nhưng không lưu ánh xạ an toàn, nên không thể khôi phục trường dữ liệu cần thiết trong câu trả lời cho đúng người.',
      'Gửi dữ liệu PII nguyên bản cho bên cung cấp mô hình rồi chỉ che trên giao diện hiển thị, trong khi nội dung nhạy cảm đã đi qua API và các hệ thống log.',
      'Thay mọi chữ số và tên riêng bằng cùng một chuỗi công khai, không kiểm tra quyền phục hồi dữ liệu, khiến kết quả bị trộn giữa các người dùng.'
    ],
    explanation: 'Khử định danh hai chiều dùng bộ phát hiện PII, thay bằng token tạm không tiết lộ giá trị thực, giữ ánh xạ trong vùng tin cậy và chỉ phục hồi dữ liệu cần thiết sau khi kiểm tra quyền. Không nên gửi bảng ánh xạ hoặc PII gốc đến dịch vụ bên ngoài.'
  });

  // Source questions often repeat every ten IDs with a different answer letter.
  // Replace distractors that used unrelated jokes or obviously impossible claims
  // with plausible technical mistakes. This also fixes the original source data,
  // which already contained many of those distractors before length balancing.
  function family(day, ending, changes) {
    for (const suffix of [ending, ending + 10, ending + 20, ending + 30, ending + 40]) {
      const id = `v:D${day}_Q${suffix}`;
      if (!byId.has(id) || corrected.has(id)) continue;
      apply(id, changes);
    }
  }
  family('04', 51, {
    wrong: [
      '1. Harness Engineering → 2. Context Packet → 3. Execution Loop → 4. Model Prompt, đặt prompt làm tầng điều phối ngoài cùng.',
      '1. Model Prompt → 2. Execution Loop → 3. Harness Engineering → 4. Context Packet, chuyển vòng lặp lên trước dữ liệu đầu vào.',
      '1. Context Packet → 2. Model Prompt → 3. Harness Engineering → 4. Execution Loop, coi cơ chế thực thi là vỏ bọc ngoài cùng.'
    ]
  });
  family('04', 54, {
    wrong: [
      'Phê duyệt dựa duy nhất trên tên công cụ; mọi lời gọi cùng một tool đều có mức rủi ro như nhau dù số tiền và đích nhận khác nhau.',
      'Phê duyệt theo tên người dùng đăng nhập mà bỏ qua đối số và tác động thật của lệnh sẽ thực thi trên hệ thống.',
      'Chỉ xét mức độ tự tin của mô hình khi gọi tool; nếu mô hình tự đánh giá đủ chắc chắn thì không cần kiểm tra tham số.'
    ]
  });
  family('04', 58, {
    wrong: [
      'Prompt Eval và Agent Eval đều chỉ so khớp câu trả lời cuối cùng với một đáp án mẫu, hoàn toàn bỏ qua công cụ và trạng thái.',
      'Prompt Eval kiểm tra toàn bộ chuỗi công cụ và lần thử lại; Agent Eval chỉ đo token mỗi lượt gọi mô hình đơn lẻ.',
      'Agent Eval chỉ đo thời gian gọi API và mức dùng CPU, không cần kiểm tra thứ tự hành động hoặc chất lượng kết quả.'
    ]
  });
  family('04', 59, {
    wrong: [
      'Một bộ benchmark duy nhất chạy khi phát hành chính thức, không cần chạy lại sau những lần chỉnh sửa nhỏ trong prompt.',
      'Một tập ví dụ chỉ gồm các ca thành công dễ nhất, được chọn để tạo điểm số cao mà không kiểm tra lỗi đã từng xảy ra.',
      'Một tập dữ liệu rất lớn được tạo ngẫu nhiên và thay đổi hoàn toàn mỗi lần chạy, không theo dõi hồi quy trên ca cố định.'
    ]
  });
  family('06', 56, {
    correct: 'Gồm nhân sự xây dựng và vận hành, API token, máy chủ và cơ sở dữ liệu, chuẩn bị dữ liệu, đánh giá bởi con người cùng các chi phí phát sinh khi mở rộng lưu lượng.',
    wrong: [
      'Chỉ tính chi phí gọi API theo số token mà bỏ chi phí nhân sự, hạ tầng lưu trữ, đánh giá và hỗ trợ vận hành của sản phẩm.',
      'Chỉ tính tiền mua máy chủ ban đầu, giả định dữ liệu, suy luận, giám sát và bảo trì đều miễn phí trong suốt vòng đời dự án.',
      'Chỉ tính tiền lương của đội phát triển trước khi ra mắt, không cần dự toán chi phí theo lưu lượng sử dụng hoặc xử lý sự cố.'
    ],
    explanation: 'Đánh giá ROI cần TCO thực tế: chi phí ban đầu, chi phí cố định và biến đổi theo tải, công sức làm sạch dữ liệu, kiểm thử, vận hành, con người và dự phòng rủi ro.'
  });
  family('06', 58, {
    wrong: [
      'Tính năng được coi là hoàn thành ngay khi code đã merge và unit test pass, chưa cần đo chất lượng trên tập dữ liệu đại diện.',
      'Tính năng được coi là hoàn thành khi giao diện được duyệt; không cần kiểm tra độ tin cậy API hoặc phương án dự phòng.',
      'Tính năng được coi là hoàn thành khi demo chạy một ví dụ đúng, dù chưa có logging, bộ kiểm thử hồi quy hay xử lý lỗi.'
    ]
  });
  family('07', 52, {
    wrong: [
      'Một bảng tần suất từ khóa đơn thuần luôn đủ biểu diễn ngữ nghĩa, không phụ thuộc mô hình đã học hay ngữ cảnh văn bản.',
      'Một hàm mã hóa chuyển mọi câu thành một nhãn phân loại rời rạc duy nhất, không tạo tọa độ vector liên tục.',
      'Một thuật toán nén chuỗi thành checksum để tìm trùng lặp byte, không nhằm biểu diễn độ tương tự về mặt ngữ nghĩa.'
    ]
  });
  family('08', 51, {
    wrong: [
      '1. Generation → 2. Indexing → 3. Retrieval → 4. Re-ranking, để mô hình trả lời trước khi tìm tài liệu làm căn cứ.',
      '1. Retrieval → 2. Generation → 3. Fine-tuning → 4. Indexing, chỉ lập chỉ mục sau khi đã tạo ra câu trả lời.',
      '1. Indexing → 2. Generation → 3. Feedback → 4. Caching, bỏ bước truy xuất tài liệu phù hợp với truy vấn mới.'
    ]
  });
  family('08', 60, {
    wrong: [
      'Faithfulness, Answer Relevance, BLEU và ROUGE: có chỉ số so khớp văn bản nhưng thiếu phép đo chất lượng truy xuất context.',
      'Context Precision, Context Recall, MRR và nDCG: chỉ tập trung vào truy xuất và xếp hạng, bỏ qua chất lượng câu trả lời.',
      'Accuracy, Precision, Recall và F1 cho phân loại: không trực tiếp đo căn cứ của câu trả lời trên tài liệu truy xuất.'
    ]
  });
  family('09', 52, {
    wrong: [
      'Mỗi worker tự định nghĩa mục tiêu tổng thể và gửi thẳng kết quả đến người dùng, không có thành phần lập kế hoạch hay điều phối.',
      'Supervisor trực tiếp làm toàn bộ công việc và không phân phối nhiệm vụ, còn worker chỉ lưu lịch sử hội thoại của người dùng.',
      'Các worker chỉ được phép gọi nhau theo vòng cố định không có phân nhánh; supervisor không thể lựa chọn worker theo nhiệm vụ.'
    ]
  });
  family('09', 54, {
    wrong: [
      'MCP chủ yếu là chuẩn định dạng file huấn luyện giúp mọi mô hình học tham số mới từ dữ liệu mà không cần fine-tuning.',
      'MCP là giao thức bắt buộc để thay thế toàn bộ API của từng dịch vụ ngoài bằng một máy chủ mô hình duy nhất.',
      'MCP chỉ quy định giao diện đồ họa cho chatbot, không định nghĩa cách khám phá và gọi công cụ hay đọc tài nguyên.'
    ]
  });
  family('09', 55, {
    wrong: [
      'MCP Server tự chứa và chạy toàn bộ ứng dụng Host; MCP Client chỉ ghi log và không tham gia kết nối hay gọi công cụ.',
      'MCP Host gọi trực tiếp mọi tool bằng một phiên chung; MCP Client không quản lý kết nối riêng đến từng server.',
      'MCP Client cung cấp mô hình nền tảng để Server tự ra quyết định; Host chỉ là nơi hiển thị câu trả lời của Server.'
    ]
  });
  family('09', 69, {
    wrong: [
      'Ứng dụng tự đóng luồng khi đến bước cần phê duyệt và xóa state; người dùng phải chạy lại toàn bộ workflow từ đầu.',
      'Ứng dụng tiếp tục chạy tool ngay khi gửi thông báo phê duyệt, không đợi quyết định từ người có thẩm quyền.',
      'LangGraph chỉ dừng render trên trình duyệt, còn các node backend tiếp tục chạy và không thể phục hồi từ checkpoint.'
    ]
  });
  family('10', 52, {
    wrong: [
      'Silent Failure luôn phát exception rõ ràng và dừng pipeline; Loud Failure lại có thể âm thầm làm sai dữ liệu đầu ra.',
      'Silent Failure chỉ xảy ra khi server không thể khởi động; các lỗi về schema và phân phối dữ liệu luôn tự phát cảnh báo.',
      'Loud Failure nguy hiểm hơn vì không để lại log; Silent Failure luôn được hệ thống phát hiện bằng mã HTTP lỗi.'
    ]
  });
  family('10', 54, {
    wrong: [
      'Chỉ gồm CPU, RAM, disk, latency và throughput của máy chủ; không đo độ tươi hay thay đổi schema của dữ liệu.',
      'Gồm số lượng prompt, số lượng GPU, TTFT, TPS và tốc độ mạng; thiếu kiểm tra phân phối, nguồn gốc và khối lượng dữ liệu.',
      'Gồm Accuracy, F1, BLEU, ROUGE và perplexity của mô hình; không giám sát độ trễ cập nhật hoặc chất lượng đầu vào.'
    ]
  });
  family('10', 58, {
    wrong: [
      'Đưa cả bảng quan hệ và tài liệu PDF vào vector DB, bỏ mọi truy vấn SQL có điều kiện và tính toàn vẹn dữ liệu.',
      'Chuyển toàn bộ PDF và Word vào bảng SQL thuần rồi chỉ dùng so khớp từ khóa, bỏ truy xuất ngữ nghĩa và metadata.',
      'Lưu mọi nguồn dưới dạng văn bản trong một prompt cố định, không có indexing, truy vấn theo yêu cầu hay kiểm soát quyền.'
    ]
  });
  family('11', 59, {
    correct: 'Không đưa khóa bí mật hay thông tin nhạy cảm vào System Prompt; hạn chế quyền công cụ, giám sát đầu ra và kiểm thử prompt injection, coi nội dung prompt là có thể lộ.',
    wrong: [
      'Chỉ viết thêm câu “không tiết lộ System Prompt” trong prompt rồi xem đó là biện pháp bảo mật tuyệt đối cho mọi trường hợp.',
      'Mã hóa hoặc làm rối văn bản System Prompt trước khi gửi rồi tin rằng mô hình không thể lặp lại thông tin đã đọc được.',
      'Đưa toàn bộ API key và mật khẩu vào System Prompt để mô hình tự bảo vệ chúng, không cần kiểm soát quyền ở ứng dụng.'
    ],
    explanation: 'System Prompt có thể bị lộ qua prompt injection hoặc phản hồi mô hình. Cần tránh đặt bí mật trong prompt, hạn chế quyền thực thi ở ứng dụng, giám sát đầu ra và kiểm thử tấn công. Chỉ thị trong prompt hoặc bộ lọc chuỗi không bảo đảm ngăn rò rỉ.'
  });
  family('13', 53, {
    wrong: [
      'TPS đo thời gian đến token đầu tiên bằng mili giây, còn TTFT đo số token mô hình sinh ra trong mỗi giây.',
      'TPS tính số request đã hoàn thành mỗi phút, còn TTFT là tổng thời gian chờ đến khi câu trả lời cuối cùng hoàn tất.',
      'TPS là số token đầu vào của prompt mỗi request, còn TTFT là lượng VRAM cần lưu Key và Value trên một GPU.'
    ]
  });
  family('13', 58, {
    correct: 'Cảnh báo quá nhiều, thiếu ưu tiên hoặc lặp lại khiến người trực bỏ sót sự cố thật; nên nhóm cảnh báo và đặt ngưỡng gắn với SLO, mức độ nghiêm trọng.',
    wrong: [
      'Khi cảnh báo tăng quá nhiều thì tắt hoàn toàn kênh thông báo, kể cả cảnh báo sự cố nghiêm trọng cần hành động ngay.',
      'Khi có một cảnh báo sai thì chuyển mọi cảnh báo lên mức critical và gửi đến toàn bộ nhân viên trong mọi ca trực.',
      'Khi người trực nhận cảnh báo lặp lại thì chỉ giám sát trung bình CPU/RAM mỗi ngày và bỏ tỷ lệ lỗi hay độ trễ.'
    ],
    explanation: 'Alert fatigue xuất hiện khi cảnh báo lặp, nhiễu hoặc không có ưu tiên khiến kỹ sư bỏ qua tín hiệu quan trọng. Nên dùng ngưỡng có ý nghĩa, deduplication, phân cấp và liên kết SLO.'
  });
  family('14', 55, {
    correct: 'Cho Judge chấm một tập chuẩn do chuyên gia gán nhãn, đối chiếu mức đồng thuận và các nhóm lỗi, sau đó điều chỉnh rubric hoặc ngưỡng chấm trước khi sử dụng.',
    wrong: [
      'Đo hiệu năng GPU và lượng VRAM của Judge rồi suy ra trực tiếp độ chính xác của mọi đánh giá mà không cần nhãn chuẩn.',
      'Chỉ yêu cầu Judge tự chấm lại câu trả lời do chính nó sinh ra, coi mức tự đồng thuận là bằng chứng khách quan đủ tin cậy.',
      'Chỉ so sánh độ dài câu trả lời với số token được sinh và tăng đều mọi điểm số, không kiểm tra mức khớp đánh giá của người.'
    ],
    explanation: 'Cần tập đối soát có nhãn chuyên gia, rubric rõ và phân tích sai lệch giữa Judge với con người. Với nhãn phân loại có thể dùng confusion matrix, TPR/TNR hoặc Kappa; với thang điểm liên tục/ thứ bậc dùng tương quan và phép đo phù hợp.'
  });
  family('14', 56, {
    wrong: [
      'Chỉ lấy tỷ lệ phần trăm hai người chấm cùng nhãn mà bỏ qua khả năng đồng thuận ngẫu nhiên của các nhãn phổ biến.',
      'Đếm tổng số đánh giá được tạo ra và dùng số lượng mẫu làm mức độ đồng thuận, không so sánh nhãn giữa chuyên gia.',
      'Đo tốc độ chấm của mỗi chuyên gia theo giây và giả định những người chấm nhanh hơn luôn có ý kiến chính xác hơn.'
    ]
  });
  family('15', 51, {
    wrong: [
      'Chỉ tối ưu điểm benchmark mô hình trong phòng thí nghiệm, giả định vấn đề dữ liệu, quyền truy cập và tuân thủ tự giải quyết.',
      'Chỉ mở rộng số lượng GPU rồi triển khai trực tiếp, không cần tích hợp hệ thống nghiệp vụ hay cơ chế giám sát vận hành.',
      'Chỉ thay System Prompt của PoC bằng mô tả dài hơn, không kiểm thử quyền, dữ liệu thật hoặc khả năng phục hồi lỗi.'
    ]
  });
  family('15', 52, {
    prompt: 'Khi lưu lượng AI Agent tăng lên hàng triệu request, nhóm chi phí vận hành nào phải được dự báo sát theo mức sử dụng để lập TCO?',
    correct: 'Chi phí suy luận theo token hoặc GPU, lưu trữ/truy vấn dữ liệu, băng thông và các dịch vụ công cụ phát sinh theo lưu lượng thực tế.',
    wrong: [
      'Chỉ chi phí huấn luyện mô hình một lần trước khi ra mắt, không cần tính tài nguyên dùng cho mỗi request suy luận.',
      'Chỉ chi phí mua tên miền cố định hằng năm, các hoạt động lưu trữ dữ liệu và gọi API không phát sinh thêm chi phí.',
      'Chỉ tiền thiết kế logo và giao diện lúc phát triển, không cần tính tài nguyên phục vụ người dùng khi hệ thống vận hành.'
    ],
    explanation: 'TCO cần dự toán cả chi phí cố định lẫn biến đổi. Ở quy mô lớn, suy luận theo token/GPU, lưu trữ, truy xuất, mạng và tool call có thể tăng đáng kể theo tải; không thể khẳng định một hạng mục luôn chiếm tỷ trọng lớn nhất cho mọi kiến trúc.'
  });

  apply('v:D11_Q95', {
    prompt: 'Vì sao cần nhận diện và xử lý dữ liệu cá nhân (PII) phù hợp với chính sách trước khi gửi prompt tới dịch vụ LLM bên ngoài?',
    correct: 'Để tránh truyền dữ liệu nhạy cảm không cần thiết ra bên ngoài và đáp ứng các yêu cầu về quyền riêng tư, hợp đồng xử lý dữ liệu và quy định liên quan.',
    wrong: [
      'Để làm cho mô hình luôn trả lời đúng 100% câu hỏi bằng cách xóa mọi con số, ngày tháng và tên riêng trong tất cả prompt.',
      'Để thay hoàn toàn cơ chế phân quyền, mã hóa và kiểm soát dữ liệu bởi một bước dùng regex đơn giản trên văn bản đầu vào.',
      'Để giảm thời gian suy luận xuống gần bằng không, bất kể độ dài prompt hay lượng token đầu vào gửi cho mô hình.'
    ],
    explanation: 'Nhận diện PII để quyết định loại bỏ, che, giả danh hoặc xử lý theo cơ sở pháp lý và chính sách phù hợp; không phải trường hợp nào cũng bắt buộc xóa toàn bộ PII. Nếu cần khôi phục, phải bảo vệ bảng ánh xạ và kiểm tra quyền.'
  });
  apply('v:D15_Q77', {
    prompt: 'Nhóm vai trò nào thể hiện ba hướng chuyên môn thường gặp khi phát triển sản phẩm và nền tảng AI?',
    wrong: [
      'Chỉ có AI Researcher, AI Researcher cấp cao và trưởng nhóm AI Researcher; mọi vai trò quản lý sản phẩm, tích hợp và hạ tầng đều không cần thiết.',
      'Chỉ có nhân viên nhập liệu, nhân viên kiểm thử giao diện và nhân viên hỗ trợ hành chính; không cần kỹ năng mô hình, dữ liệu hoặc triển khai.',
      'Chỉ có chuyên gia thiết kế đồ họa, nhân viên tiếp thị và quản lý văn phòng; việc xây dựng workflow AI và vận hành hạ tầng do mô hình tự làm.'
    ],
    explanation: 'AI Product/Solution, AI Application/Agent Engineering và AI Platform/MLOps là ba hướng chuyên môn phổ biến trong hệ sinh thái triển khai AI; đây là ví dụ phân nhóm vai trò, không phải dự báo chắc chắn về mức tăng tuyển dụng cho mọi ngành.'
  });
  apply('v:D15_Q88', {
    prompt: 'Trước khi phát hành AI Agent cho người dùng thực tế, nhóm kiểm tra nào phù hợp nhất với yêu cầu vận hành an toàn?',
    wrong: [
      'Chỉ có demo thành công và giao diện được duyệt; không cần xác thực, giới hạn lưu lượng, trace hoặc quy trình xử lý lỗi.',
      'Chỉ kiểm thử một prompt mẫu có kết quả tốt, rồi bỏ qua dữ liệu thực tế, hạn mức chi phí, giám sát và xử lý sự cố.',
      'Chỉ tăng số lượng GPU và giới hạn thời gian phản hồi, không cần kiểm tra quyền truy cập hay chất lượng đầu ra.'
    ],
    explanation: 'Checklist thường gồm xác thực, phân quyền, rate limiting, giới hạn chi phí, tracing, guardrails, khả năng phục hồi và đánh giá trên tập đại diện. Tùy rủi ro sản phẩm còn phải kiểm tra các yêu cầu bổ sung.'
  });
  for (const id of ['v:D14_Q53', 'v:D14_Q93']) {
    apply(id, {
      wrong: [
        'Chỉ tính BLEU hoặc ROUGE trên câu trả lời rồi coi đó là đánh giá đầy đủ các tiêu chí về độ đúng, tính hữu ích và an toàn.',
        'Chỉ dựa vào độ dài phản hồi và lượng token sử dụng để chấm chất lượng; không cần rubric hay đối chiếu nội dung.',
        'Luôn lấy điểm tự đánh giá của chính mô hình đang được kiểm thử làm chuẩn vàng, không cần hướng dẫn tiêu chí hay hiệu chuẩn.'
      ]
    });
  }
  apply('v:D14_Q97', {
    wrong: [
      'Faithfulness đo độ liên quan của câu trả lời với câu hỏi, còn Answer Relevance đo tỷ lệ mệnh đề có căn cứ từ context.',
      'Faithfulness chỉ đo tốc độ truy xuất tài liệu, còn Answer Relevance chỉ đo số token cần để sinh phản hồi.',
      'Hai chỉ số luôn bằng nhau vì mọi câu trả lời bám sát context đều tự động trả lời đúng trọng tâm câu hỏi.'
    ]
  });
  apply('v:D08_Q88', {
    wrong: [
      'Self-RAG bắt buộc truy xuất cố định đúng một lần cho mọi câu hỏi, không có bước tự đánh giá kết quả tìm kiếm.',
      'Self-RAG loại bỏ hoàn toàn việc đọc bằng chứng và yêu cầu mô hình chỉ trả lời từ bộ nhớ tham số đã huấn luyện.',
      'Self-RAG chỉ thay embedding bằng tìm kiếm từ khóa, không có cơ chế kiểm tra mức liên quan hay chất lượng câu trả lời.'
    ]
  });
  apply('v:D09_Q96', {
    wrong: [
      'Chỉ có Models, Embeddings và Fine-tuning Jobs, là ba loại tài nguyên bắt buộc do mọi MCP Server phải cung cấp.',
      'Chỉ có Threads, Runs và Assistants; mọi MCP Server đều phải dùng chung ba API đặc thù của một nhà cung cấp LLM.',
      'Chỉ có GPU, CPU và RAM; MCP Server chỉ công bố tình trạng thiết bị chứ không hỗ trợ tools, resources hay prompts.'
    ]
  });
  apply('v:D09_Q98', {
    wrong: [
      'LangGraph chỉ là vector store lưu embedding của tài liệu, không cung cấp state, node, edge hay vòng lặp điều phối.',
      'LangGraph chỉ là bộ điều chỉnh nhiệt độ lấy mẫu và max_tokens cho mô hình, không thể mô tả workflow nhiều bước.',
      'LangGraph bắt mọi tác tử chạy song song không có điểm dừng hoặc checkpoint; không hỗ trợ phân nhánh có điều kiện.'
    ]
  });
  for (const id of ['v:SPEC04_Q86', 'v:SPEC04_Q91']) {
    apply(id, {
      prompt: 'Khi cần chọn giữa Fine-Tuning và RAG, trường hợp nào có thể ưu tiên Fine-Tuning hơn nếu đã có dữ liệu huấn luyện chất lượng?',
      wrong: [
        'Khi dữ liệu giá bán và chính sách thay đổi hằng giờ, chỉ cần fine-tune lại mỗi khi có dữ liệu mới và bỏ hoàn toàn retrieval.',
        'Khi doanh nghiệp không có ví dụ huấn luyện, chỉ muốn tra cứu thông tin mới từ tài liệu được cập nhật liên tục.',
        'Khi yêu cầu chủ yếu là dẫn nguồn trực tiếp từ cơ sở tri thức mới nhất, nhưng lại không cần truy xuất tài liệu lúc trả lời.'
      ],
      explanation: 'Fine-tuning có thể hữu ích cho hành vi, phong cách, định dạng hoặc kỹ năng chuyên biệt khi có dữ liệu huấn luyện phù hợp; RAG thường phù hợp hơn cho tri thức cần cập nhật và dẫn nguồn. Không có điều kiện nào trong ví dụ khiến fine-tuning là bắt buộc tuyệt đối.'
    });
  }
  apply('v:SPEC04_Q98', {
    prompt: 'Khi xây dựng ứng dụng tóm tắt nhanh trên di động, lựa chọn nào thể hiện đánh đổi hợp lý giữa độ trễ và chất lượng?',
    wrong: [
      'Luôn chọn mô hình nhiều tham số nhất dù thời gian chờ vượt giới hạn UX, không đo chất lượng tóm tắt trên dữ liệu thật.',
      'Chỉ tối ưu tốc độ bằng cách cắt bỏ mọi nội dung gốc và trả một mẫu văn bản cố định cho tất cả yêu cầu.',
      'Bắt buộc chạy lại quá trình fine-tuning cho từng văn bản người dùng nhập trước khi có thể tạo một câu tóm tắt.'
    ]
  });
  for (const id of ['v:D15_Q89', 'v:D15_Q99']) {
    apply(id, {
      wrong: [
        'Chỉ tăng timeout request của một tiến trình duy nhất, không cần hàng đợi hoặc nhân rộng worker khi lưu lượng tăng.',
        'Chạy toàn bộ bước gọi tool và LLM đồng bộ trên một luồng xử lý HTTP, không kiểm soát mức đồng thời hoặc tải cao điểm.',
        'Vô hiệu hóa rate limiting và tự động gửi lại mọi request ngay khi lỗi, không dùng backoff hoặc biện pháp chống quá tải.'
      ]
    });
  }

  apply('v:D01_Q15', {
    prompt: 'Trong nhiều bảng giá API của LLM thương mại, chi phí mỗi triệu output token thường so với input token như thế nào?',
    wrong: [
      'Input token luôn bị tính giá cao hơn output token vì mô hình phải xử lý toàn bộ ngữ cảnh đầu vào trước khi sinh.',
      'Hai loại token luôn có cùng đơn giá cố định tại mọi nhà cung cấp, không phụ thuộc mô hình hay gói dịch vụ.',
      'Nhà cung cấp chỉ tính phí số lượt request và không tính riêng lượng input token và output token được xử lý.'
    ],
    explanation: 'Nhiều dịch vụ đặt đơn giá output token cao hơn input token, nhưng tỷ lệ cụ thể tùy mô hình, nhà cung cấp, cache và bảng giá tại thời điểm sử dụng; không có hằng số chung cho mọi API.'
  });
  apply('v:D01_Q19', {
    wrong: [
      'Lỗi chủ yếu do model có quá ít tham số, nên chỉ cần chuyển lên model lớn hơn mà không thay đổi điều kiện retry.',
      'Lỗi do tokenizer chưa đếm hết dấu câu, nên thay tokenizer sẽ tự ngăn agent gọi mãi một tool trả về lỗi.',
      'Lỗi do giao diện render quá chậm, nên tăng kích thước font và tốc độ làm mới sẽ tự dừng các lần gọi tool.'
    ]
  });
  apply('v:D01_Q28', {
    wrong: [
      'Chỉ cân bằng kích thước file model, số GPU huấn luyện và thời gian tải model, bỏ qua chi phí và trải nghiệm đáp ứng.',
      'Chỉ cân bằng mức độ sáng tạo của câu trả lời, độ dài prompt hệ thống và số lượng ngôn ngữ giao diện hỗ trợ.',
      'Chỉ cân bằng số lượng ví dụ trong dataset, phiên bản thư viện Python và số lượng nhánh trong kho mã nguồn.'
    ]
  });
  apply('v:D01_Q34', {
    wrong: [
      'Chuyển từ quản trị hiệu quả công việc sang việc chỉ tăng số tham số mô hình, không cần kết nối quy trình hay đo tác động.',
      'Chuyển từ đo giá trị kinh doanh sang đánh giá văn phong của chatbot, không theo dõi tác vụ đã hoàn thành.',
      'Chuyển từ tích hợp API và công cụ sang chỉ chạy demo cố định, không cần dữ liệu nghiệp vụ hoặc chi phí vận hành.'
    ]
  });
  apply('v:D02_Q75', {
    wrong: [
      'Chỉ mô tả model định dùng, số GPU, framework và dịch vụ cloud, chưa xác định người dùng hay chỉ số đau hiện tại.',
      'Chỉ mô tả tính năng dự kiến, giao diện mẫu và deadline, không làm rõ baseline để đo giá trị tác động sau triển khai.',
      'Chỉ liệt kê dữ liệu cần thu thập và những kỹ thuật AI hiện có, không chỉ rõ ai gặp vấn đề hay mục tiêu cần đạt.'
    ]
  });
  apply('v:D02_Q82', {
    wrong: [
      'Vì mọi mô hình đạt điểm benchmark cao luôn xử lý tốt dữ liệu thật, nên chỉ cần thay phần mềm giao diện là đủ.',
      'Vì khách hàng chỉ đánh giá số tham số mô hình mà không quan tâm hiệu quả quy trình, chi phí hoặc rủi ro.',
      'Vì trong sản phẩm AI chỉ điểm benchmark quyết định thành công, nên không cần nghiên cứu người dùng hay quy trình.'
    ]
  });
  apply('v:D03_Q72', {
    wrong: [
      'Bài toán là FAQ cố định, có câu trả lời chuẩn và không cần dùng công cụ hay thực hiện các bước phụ thuộc trạng thái.',
      'Bài toán chỉ là chuyển đổi một chuỗi theo quy tắc tất định, không có nhánh rẽ hay lựa chọn hành động.',
      'Bài toán cần một API duy nhất chạy theo lịch cố định và không có quyết định phụ thuộc kết quả trả về.'
    ]
  });
  for (const id of ['v:D05_Q60', 'v:D05_Q70']) {
    apply(id, {
      wrong: [
        'Bao phủ mọi lĩnh vực và tích hợp nhiều công cụ từ phiên bản đầu, chấp nhận mỗi quy trình chỉ chạy ở mức demo.',
        'Chỉ chọn mô hình tham số nhỏ nhất, rồi để tác tử tự thực hiện bất kỳ công việc nào ngoài phạm vi nghiệp vụ.',
        'Chỉ giảm độ dài câu trả lời và số token, không cần đặt mục tiêu chất lượng hay quy trình hoàn thành cho tác vụ.'
      ]
    });
  }
  apply('v:D05_Q84', {
    wrong: [
      'Chỉ hỏi người dùng họ thích màu sắc, icon và font nào, không cần khảo sát cách hệ thống xử lý câu trả lời sai.',
      'Chỉ hỏi người dùng thích mô hình bao nhiêu tỷ tham số, không hỏi mức tin cậy hoặc cơ chế chuyển tiếp khi lỗi.',
      'Chỉ hỏi người dùng có muốn chatbot trả lời dài hơn không, bỏ qua các trường hợp rủi ro và thiếu chắc chắn.'
    ]
  });
  apply('v:D06_Q93', {
    wrong: [
      'Triển khai hệ thống AI hoàn toàn tự động cho mọi người dùng trước khi đánh giá nhu cầu, không cho người vận hành can thiệp.',
      'Chỉ dùng hình mẫu giao diện và bài khảo sát tĩnh; không mô phỏng một cuộc tương tác hay quy trình xử lý thực tế.',
      'Chỉ huấn luyện mô hình với dữ liệu tổng hợp rồi đánh giá offline, không kiểm thử trải nghiệm có người tham gia.'
    ]
  });
  apply('v:D06_Q95', {
    wrong: [
      'Khi sản phẩm đã chịu trách nhiệm xử lý giao dịch nhạy cảm quy mô lớn mà chưa có kiểm soát quyền và đánh giá bảo mật.',
      'Khi cần chứng minh năng lực chịu tải sản xuất cho hàng triệu request mỗi phút, chỉ cần giao diện kéo thả mà không cần test.',
      'Khi bài toán chưa được xác định và không có giả thuyết cần kiểm chứng, nên đầu tư ngay vào một workflow phức tạp.'
    ]
  });
  apply('v:D11_Q68', {
    wrong: [
      'Chỉ quét lỗi chính tả của System Prompt rồi coi mọi rủi ro prompt injection và rò rỉ thông tin đã được loại bỏ.',
      'Chỉ yêu cầu mô hình tự xác nhận không có lỗ hổng, không mô phỏng người tấn công hoặc kiểm thử quyền công cụ.',
      'Chỉ kiểm tra một bộ prompt thông thường cho kết quả đúng, không thử dữ liệu đối kháng, trích xuất bí mật hoặc lạm dụng tool.'
    ]
  });
  apply('v:SPEC01_Q83', {
    wrong: [
      'Đưa API key của nhà cung cấp vào JavaScript phía trình duyệt để giảm một lượt mạng và cho người dùng gọi API trực tiếp.',
      'Bỏ bước xác thực tại backend, cho phép giao diện gửi mọi yêu cầu đến LLM API với quyền quản trị hệ thống.',
      'Dùng BFF chỉ để đổi màu giao diện; khóa truy cập và rate limiting vẫn do từng thiết bị khách tự bảo vệ.'
    ]
  });
  apply('v:SPEC03_Q85', {
    prompt: 'Khi container AI Agent trên cloud serverless có cold start dài, biện pháp nào có thể giảm đáng kể độ trễ cho request đầu tiên?',
    wrong: [
      'Hạ thời gian timeout xuống thấp hơn thời gian nạp mô hình nhưng vẫn để toàn bộ container scale-to-zero và khởi động mới.',
      'Tắt hoàn toàn caching và luôn cài lại dependency khi có request, khiến cold start phải thực hiện thêm nhiều thao tác.',
      'Chỉ giảm kích thước CSS của trang web, không thay đổi thời gian tải mô hình hoặc cấu hình warm instance của backend.'
    ]
  });
  for (const id of ['v:SPEC04_Q87', 'v:SPEC04_Q92']) {
    apply(id, {
      wrong: [
        'Chỉ tính giá thuê GPU theo giờ rồi giả định đội vận hành tự động duy trì serving, quan sát và cập nhật miễn phí.',
        'Chỉ so sánh kích thước model trên đĩa mà bỏ qua thời gian trực sự cố, tối ưu throughput và chi phí con người.',
        'Chỉ so sánh chi phí token đầu vào của API với dung lượng RAM khi tự host, không xét bảo trì và hỗ trợ production.'
      ]
    });
  }

  // Second editorial pass: remove unsupported guarantees and overly long
  // correct options. Reapply full families because the imported questions
  // repeat the same scenario under different answer letters.
  reviseFive('D04', 54, {
    correct: 'Xét cả tên tool và đối số của lần gọi (số tiền, người nhận, mức rủi ro) để quyết định khi nào cần người phê duyệt.',
    wrong: [
      'Xét chữ ký định danh của tool đã đăng ký; mọi lời gọi cùng tool có chung mức phê duyệt, không phụ thuộc số tiền.',
      'Xét danh tính người đã đăng nhập; bỏ qua đích nhận và dữ liệu thay đổi khi cấp quyền thực hiện hành động.',
      'Xét điểm tin cậy của mô hình trên mỗi lượt gọi; nếu điểm cao thì tự cho phép hành động có tác động lớn.'
    ],
    explanation: 'Approval Gate cần áp chính sách trên từng lần gọi và đối số cụ thể. Cùng một tool chuyển tiền có thể yêu cầu duyệt khác nhau tùy số tiền, đích nhận và quyền người dùng.'
  });
  reviseFive('D04', 58, {
    correct: 'Prompt Eval thường đo chất lượng phản hồi và tuân thủ chỉ dẫn; Agent Eval còn xét chuỗi hành động, tool call, trạng thái cuối và chi phí.',
    wrong: [
      'Prompt Eval và Agent Eval đều chỉ tính mức giống đáp án mẫu; cả hai bỏ qua công cụ và kết quả trong môi trường.',
      'Prompt Eval luôn kiểm tra cả trạng thái hệ thống cuối; Agent Eval chỉ tính điểm một đoạn văn được sinh độc lập.',
      'Agent Eval đo tốc độ API và tài nguyên máy chủ; không cần xem agent đã chọn công cụ hoặc hoàn thành việc gì.'
    ],
    explanation: 'Prompt Eval thường tập trung vào chất lượng đầu ra hoặc tuân thủ chỉ dẫn trên các ca thử. Agent Eval mở rộng sang quỹ đạo hành động, lựa chọn tool, kết quả trong môi trường, lỗi và chi phí. Phạm vi từng bộ eval do người thiết kế quyết định.'
  });
  reviseFive('D04', 59, {
    correct: 'Tập kiểm thử nhỏ, chạy nhanh sau mỗi thay đổi, gồm ca cốt lõi và lỗi cũ để phát hiện hồi quy trước khi đánh giá rộng.',
    wrong: [
      'Tập kiểm thử chỉ chạy sau lần phát hành cuối, tập trung kiểm tra môi trường deploy mà không so sánh phiên bản prompt.',
      'Tập ví dụ được chọn ngẫu nhiên mỗi lần, ưu tiên ca dễ và không giữ các lỗi đã từng xảy ra để kiểm tra lại.',
      'Tập benchmark rất lớn chỉ đánh giá một lần, không đặt ngưỡng hồi quy hay phản hồi nhanh cho người sửa prompt.'
    ],
    explanation: 'Tiny Eval là bộ smoke/regression test nhỏ có chủ đích, không có số câu cố định bắt buộc. Kết quả của nó hỗ trợ vòng lặp phát triển nhanh, không thay cho đánh giá đại diện quy mô lớn.'
  });
  reviseFive('D08', 51, {
    correct: 'Indexing dữ liệu → Retrieval tài liệu → Re-ranking/Filtering kết quả → Generation có căn cứ từ ngữ cảnh.',
    wrong: [
      'Generation câu trả lời → Indexing dữ liệu → Retrieval tài liệu → Re-ranking sau khi đã trả lời người dùng.',
      'Retrieval dữ liệu thô → Generation câu trả lời → Fine-tuning mô hình → Indexing sau khi hoàn tất truy vấn.',
      'Indexing dữ liệu → Generation từ tham số mô hình → Feedback người dùng → Caching, không truy xuất tài liệu.'
    ],
    explanation: 'Pipeline RAG thường chuẩn bị chỉ mục trước, truy xuất tài liệu theo câu hỏi, có thể lọc/xếp hạng lại rồi sinh câu trả lời dựa trên ngữ cảnh. Re-ranking là bước tùy chọn, không bắt buộc với mọi RAG.'
  });
  reviseFive('D08', 60, {
    correct: 'Faithfulness, Answer Relevance, Context Precision và Context Recall; hai chỉ số đầu đánh giá phản hồi, hai chỉ số sau đánh giá ngữ cảnh truy xuất.',
    wrong: [
      'Faithfulness, Answer Relevance, BLEU và ROUGE; kết hợp hai chỉ số phản hồi với hai thước đo so khớp chuỗi.',
      'Context Precision, Context Recall, MRR và nDCG; bốn chỉ số tập trung vào tài liệu được lấy về và thứ hạng.',
      'Accuracy, Precision, Recall và F1; bốn chỉ số phân loại nhãn mà không trực tiếp đo độ trung thực theo context.'
    ],
    explanation: 'Bộ bốn thường được giới thiệu trong đánh giá RAG gồm Faithfulness, Answer Relevance, Context Precision và Context Recall. Tên gọi và danh sách metrics cụ thể có thể thay đổi giữa các phiên bản RAGAS.'
  });
  reviseFive('D10', 52, {
    correct: 'Silent Failure làm dữ liệu sai, thiếu hoặc cũ mà pipeline vẫn chạy và ít báo lỗi; agent có thể âm thầm trả lời sai.',
    wrong: [
      'Silent Failure luôn dừng ngay pipeline và phát exception; Loud Failure lại có thể trả dữ liệu hỏng mà không ghi log.',
      'Silent Failure chỉ xảy ra khi máy chủ tắt hẳn; thay đổi phân phối và schema dữ liệu luôn phát cảnh báo tức thời.',
      'Loud Failure không để lại tín hiệu chẩn đoán; Silent Failure luôn trả mã lỗi HTTP để dịch vụ phụ thuộc nhận biết.'
    ],
    explanation: 'Silent Failure vẫn cho hệ thống hoạt động bề ngoài nhưng chất lượng dữ liệu hoặc kết quả suy giảm. Cần giám sát tính mới, schema, khối lượng và phân phối để phát hiện sai lệch không làm pipeline dừng.'
  });
  reviseFive('D10', 54, {
    correct: 'Freshness, Distribution, Volume, Schema và Lineage: độ mới, phân phối, khối lượng, cấu trúc và dòng chảy dữ liệu.',
    wrong: [
      'CPU, RAM, Disk, Latency và Throughput: theo dõi tài nguyên dịch vụ, không bao quát biến động của dữ liệu.',
      'Token, GPU, TTFT, TPS và Network: theo dõi hiệu năng mô hình nhưng bỏ qua độ mới và nguồn gốc dữ liệu.',
      'Accuracy, F1, BLEU, ROUGE và Perplexity: đánh giá mô hình nhưng thiếu giám sát schema và dòng dữ liệu.'
    ],
    explanation: 'Năm trụ cột thường được nêu của Data Observability là Freshness, Distribution, Volume, Schema và Lineage. Giám sát các mặt này hỗ trợ phát hiện bất thường; không bảo đảm tự phát hiện mọi silent failure.'
  });
  reviseFive('D10', 58, {
    correct: 'Lập chỉ mục ngữ nghĩa cho tài liệu phi cấu trúc; giữ bảng số liệu trong SQL/warehouse và dùng truy vấn có kiểm soát khi cần.',
    wrong: [
      'Đưa mọi bảng và tài liệu vào vector store rồi dùng phép tương tự vector thay cho lọc chính xác và tổng hợp SQL.',
      'Chuyển toàn bộ PDF thành bảng quan hệ, truy vấn bằng SQL thuần và bỏ tìm kiếm ngữ nghĩa theo câu hỏi người dùng.',
      'Gộp dữ liệu và báo cáo vào một prompt cố định, không lập chỉ mục hay truy vấn theo quyền và dữ liệu hiện tại.'
    ],
    explanation: 'Kiến trúc kết hợp thường dùng retrieval cho tài liệu và SQL/warehouse cho dữ liệu có cấu trúc; agent chọn công cụ phù hợp và thực thi theo quyền hạn. Vector search không thay thế phép tổng hợp số học chính xác.'
  });
  reviseFive('D09', 69, {
    correct: 'Tạm dừng workflow tại điểm cần duyệt, lưu state qua checkpointer đã cấu hình và tiếp tục sau khi nhận quyết định.',
    wrong: [
      'Dừng toàn bộ workflow rồi xóa state tại bước phê duyệt, khiến người dùng bắt buộc chạy lại từ bước đầu.',
      'Gửi thông báo yêu cầu duyệt nhưng vẫn tự thực thi tool nhạy cảm trước khi người có thẩm quyền phản hồi.',
      'Chỉ tạm dừng giao diện trình duyệt; các node backend tiếp tục chạy và không dựa trên checkpoint để khôi phục.'
    ],
    explanation: 'LangGraph có thể ngắt luồng bằng interrupt để lấy ý kiến con người, duy trì state bằng checkpointer và resume với quyết định được cung cấp. Việc lưu trạng thái bền vững phụ thuộc cấu hình checkpoint/storage.'
  });
  reviseFive('D15', 51, {
    correct: 'Tích hợp hệ thống cũ, quản trị danh tính và quyền, tuân thủ bảo mật/pháp lý, kiểm soát rủi ro và vận hành thực tế.',
    wrong: [
      'Ưu tiên tăng điểm benchmark trên bộ dữ liệu lab trước, giả định dữ liệu thật và quyền truy cập tự tương thích.',
      'Ưu tiên bổ sung GPU và nhân bản bản demo, không tích hợp vào hệ thống nghiệp vụ hay thiết lập giám sát.',
      'Ưu tiên viết System Prompt dài hơn, thay thế kiểm thử quyền, kiểm soát dữ liệu và khả năng khôi phục lỗi.'
    ],
    explanation: 'Chuyển PoC sang production đòi hỏi tích hợp, quản trị dữ liệu, bảo mật, phân quyền, quy trình và vận hành. Không có tỷ lệ 20% viết code và 80% tích hợp áp dụng cho mọi dự án.'
  });
  for (const id of ['v:D14_Q53', 'v:D14_Q93']) {
    apply(id, {
      correct: 'Dùng LLM để chấm phản hồi theo rubric rõ ràng và ví dụ chuẩn, rồi đối soát kết quả chấm với đánh giá đáng tin cậy.',
      wrong: [
        'Dùng BLEU/ROUGE so khớp câu trả lời với mẫu, coi điểm trùng n-gram là đủ cho mọi tiêu chí định tính.',
        'Dùng độ dài phản hồi và lượng token sinh ra làm điểm chất lượng, không cần rubric hoặc xem nội dung thực tế.',
        'Dùng điểm tự chấm không hiệu chuẩn của mô hình được kiểm tra làm chuẩn duy nhất, không đối chiếu con người.'
      ],
      explanation: 'LLM-as-a-Judge sử dụng mô hình ngôn ngữ với tiêu chí chấm cụ thể. Cần hiệu chuẩn bằng tập mẫu và đánh giá người; judge không bắt buộc luôn là mô hình nhiều tham số hoặc mạnh hơn mô hình được đánh giá.'
    });
  }
  apply('v:SPEC04_Q98', {
    correct: 'Chọn mô hình nhỏ hoặc tối ưu/lượng tử hóa khi đáp ứng đủ chất lượng tóm tắt; đo TTFT, thông lượng và độ trễ trên thiết bị thật.',
    wrong: [
      'Chọn model lớn nhất dựa trên benchmark tổng quát, dù thời gian phản hồi vượt yêu cầu mà chưa đo trên thiết bị.',
      'Chỉ giảm thời gian sinh bằng một văn bản tóm tắt cố định, bất kể nội dung đầu vào và đánh giá người dùng.',
      'Fine-tune lại mô hình cho mỗi đoạn văn riêng rồi chạy suy luận, dù thao tác huấn luyện làm tăng độ trễ đầu cuối.'
    ],
    explanation: 'Tối ưu ứng dụng di động là đánh đổi chất lượng và hiệu năng trên phần cứng, dữ liệu, độ dài context và runtime cụ thể. Không thể mặc định mô hình 8B INT4 đạt TTFT dưới 300 ms.'
  });
  apply('v:SPEC02_Q53', {
    correct: 'Phát hiện PII, thay bằng token giả danh, giữ ánh xạ an toàn trong vùng tin cậy và chỉ khôi phục khi đã kiểm tra quyền.',
    wrong: [
      'Phát hiện PII và thay bằng token nhưng không giữ ánh xạ bảo mật, rồi cố khôi phục dữ liệu đã bị xóa từ phản hồi.',
      'Gửi PII gốc tới dịch vụ ngoài trước, sau đó mới che dữ liệu hiển thị trên giao diện và trong lịch sử người dùng.',
      'Thay mọi người bằng cùng token, dùng chung ánh xạ giữa tài khoản và khôi phục không cần kiểm tra quyền truy cập.'
    ],
    explanation: 'Khử định danh hai chiều là giả danh hóa có thể hoàn nguyên dưới kiểm soát: bảo vệ ánh xạ, giới hạn truy cập và chỉ khôi phục PII cần thiết theo quyền. Việc phát hiện PII có thể bỏ sót nên phải đánh giá riêng.'
  });
  apply('v:D09_Q96', {
    correct: 'Tools để thực hiện tác vụ, Resources để cung cấp dữ liệu/ngữ cảnh và Prompts để cung cấp mẫu tương tác.',
    wrong: [
      'Models để chạy suy luận, Embeddings để lập chỉ mục và Fine-tuning Jobs để cập nhật mô hình trên server.',
      'Threads để lưu hội thoại, Runs để tạo lượt xử lý và Assistants để quản lý tác tử theo API độc quyền.',
      'CPU để xử lý lệnh, GPU để suy luận và RAM để chứa ngữ cảnh; đây là thông tin phần cứng của server.'
    ],
    explanation: 'MCP định nghĩa Tools, Resources và Prompts là các primitive phía server có thể cung cấp. Không phải server nào cũng bắt buộc công bố cả ba; Resources không chỉ giới hạn ở file tĩnh.'
  });
  apply('v:D08_Q88', {
    correct: 'Mô hình tự đánh giá nhu cầu truy xuất, độ liên quan của bằng chứng và tính hỗ trợ của câu trả lời qua các bước phản tư.',
    wrong: [
      'Bắt buộc tìm đúng một lần cho mọi truy vấn và sinh câu trả lời mà không đánh giá chất lượng tài liệu tìm thấy.',
      'Không truy xuất tài liệu, chỉ dựa vào kiến thức trong trọng số mô hình dù câu hỏi cần dẫn nguồn cập nhật.',
      'Chỉ đổi tìm kiếm embedding thành BM25, không có cơ chế tự kiểm tra bằng chứng hay chất lượng câu trả lời.'
    ],
    explanation: 'Self-RAG dùng cơ chế reflection để quyết định truy xuất khi cần và đánh giá tài liệu/câu trả lời. Các tín hiệu này có thể cải thiện grounding nhưng không bảo đảm tự phát hiện hay sửa mọi lỗi.'
  });
  for (const id of ['v:SPEC04_Q86', 'v:SPEC04_Q91']) {
    apply(id, {
      correct: 'Khi cần học phong cách, định dạng đầu ra hoặc hành vi chuyên biệt và có bộ dữ liệu huấn luyện, kiểm thử phù hợp.',
      wrong: [
        'Khi giá bán và chính sách đổi liên tục, dùng fine-tuning định kỳ làm nguồn cập nhật duy nhất, không cần truy xuất.',
        'Khi không có dữ liệu mẫu để huấn luyện và mục tiêu là tra cứu tri thức từ tài liệu thường xuyên thay đổi.',
        'Khi cần dẫn nguồn chính xác cho thông tin hiện thời nhưng quyết định loại bỏ mọi truy xuất tài liệu lúc trả lời.'
      ],
      explanation: 'Fine-tuning thường hữu ích để điều chỉnh hành vi, định dạng và phong cách khi có dữ liệu thích hợp. Khả năng cải thiện lập luận cần được chứng minh qua đánh giá; kiến thức cập nhật thường phù hợp với RAG.'
    });
  }
  for (const id of ['v:D15_Q89', 'v:D15_Q99']) {
    apply(id, {
      correct: 'Dùng hàng đợi bất đồng bộ, worker có thể mở rộng, giới hạn lưu lượng và caching phù hợp; đo tải để chọn cấu hình.',
      wrong: [
        'Tăng timeout trên một worker HTTP duy nhất, để toàn bộ tác vụ chờ nối tiếp khi gặp lượng request đột biến.',
        'Chạy mọi lời gọi tool và LLM đồng bộ trong cùng request, không áp giới hạn đồng thời hoặc khả năng mở rộng.',
        'Tắt rate limit và retry ngay mọi lỗi, để các request tiếp tục đổ vào dịch vụ đang chịu tải vượt ngưỡng.'
      ],
      explanation: 'Hàng đợi và worker độc lập có thể hấp thụ đột biến; autoscaling, caching, rate limiting và backpressure giúp kiểm soát tải. Cần đo các điểm nghẽn cụ thể, không có một thiết kế bảo đảm xử lý mọi mức tải.'
    });
  }
  apply('v:D11_Q68', {
    correct: 'Mô phỏng các cách tấn công hệ thống AI để tìm lỗ hổng như prompt injection, lộ dữ liệu và lạm dụng quyền công cụ.',
    wrong: [
      'Kiểm tra tính nhất quán văn phong trong System Prompt, sau đó mặc định guardrail đã chống được các tấn công.',
      'Cho mô hình tự xác nhận an toàn mà không thử kịch bản đối kháng hoặc các quyền thực thi trong hệ thống.',
      'Chạy các prompt hợp lệ để đo độ chính xác, bỏ qua trích xuất thông tin và thao túng công cụ qua dữ liệu ngoài.'
    ],
    explanation: 'Red Teaming kiểm tra có chủ đích các đường tấn công và tình huống lạm dụng để phát hiện rủi ro; kết quả phụ thuộc phạm vi thử nghiệm và không tạo bảo đảm an toàn tuyệt đối.'
  });
  apply('v:D03_Q72', {
    correct: 'Khi cần lập kế hoạch đa bước, chọn hành động theo trạng thái và tương tác công cụ; lợi ích đủ bù chi phí, độ trễ và rủi ro.',
    wrong: [
      'Khi câu hỏi FAQ có đáp án cố định, không cần công cụ và chủ yếu tra cứu trực tiếp tài liệu đã lập chỉ mục.',
      'Khi bài toán chuyển đổi chuỗi theo quy tắc cố định, không cần điều chỉnh hành động dựa trên kết quả trung gian.',
      'Khi tác vụ chạy một API vào lịch cố định, không có quyết định tiếp theo dựa trên trạng thái hay dữ liệu mới.'
    ],
    explanation: 'Agent phù hợp khi cần phối hợp hành động hoặc quyết định phụ thuộc môi trường trong nhiều bước. Với luồng xác định đơn giản, workflow thông thường thường ít phức tạp hơn.'
  });
  apply('v:D06_Q93', {
    correct: 'Cho con người thực hiện một phần chức năng phía sau giao diện giả lập tự động để quan sát nhu cầu trước khi xây AI.',
    wrong: [
      'Đưa AI hoàn toàn tự động cho mọi người dùng thử ngay, không có nhân sự hỗ trợ hoặc theo dõi tương tác thực tế.',
      'Chỉ dùng mockup tĩnh và bảng hỏi, không mô phỏng đầu ra của dịch vụ hay tương tác có thể hoàn thành tác vụ.',
      'Chỉ huấn luyện mô hình bằng dữ liệu tổng hợp rồi chấm offline, không mời người dùng trải nghiệm quy trình.'
    ],
    explanation: 'Wizard of Oz là phương pháp kiểm thử trải nghiệm trong đó con người đảm nhiệm phần chức năng mà người tham gia tưởng hệ thống đang tự động xử lý. Khi áp dụng cần có quy trình nghiên cứu và lưu ý minh bạch phù hợp.'
  });
  apply('v:SPEC03_Q85', {
    correct: 'Giữ ít nhất một instance sẵn sàng nếu nền tảng hỗ trợ; giảm công việc khởi tạo và đo cold start thực tế.',
    wrong: [
      'Giảm timeout nhưng vẫn scale-to-zero và tải toàn bộ mô hình từ đầu, khiến lượt đầu có thể timeout sớm hơn.',
      'Tắt cache và cài dependency lại mỗi khi có request, làm tăng lượng việc lúc container vừa khởi động.',
      'Chỉ nén HTML/CSS ở frontend mà không thay đổi thời gian tạo container, tải thư viện hoặc nạp mô hình.'
    ],
    explanation: 'Warm/min instances có thể tránh cold start cho một phần lưu lượng nhưng tốn chi phí duy trì; tối ưu dependency và tải mô hình cũng giúp giảm độ trễ. Không thể bảo đảm mọi request đầu tiên đều không bị trễ.'
  });
  apply('v:D14_Q97', {
    correct: 'Faithfulness đo mức được context hỗ trợ; Answer Relevance đo mức câu trả lời đúng trọng tâm câu hỏi.',
    wrong: [
      'Faithfulness đo đúng trọng tâm câu hỏi, còn Answer Relevance đo tỷ lệ mệnh đề được tài liệu hỗ trợ.',
      'Faithfulness đo thời gian retrieval, còn Answer Relevance đo tốc độ sinh token trong bước generation.',
      'Hai chỉ số có giá trị giống nhau vì bám sát tài liệu luôn đồng nghĩa trả lời đúng câu hỏi người dùng.'
    ],
    explanation: 'Faithfulness đo tính nhất quán của nội dung sinh với ngữ cảnh được truy xuất; Answer Relevance đo mức phản hồi giải đáp câu hỏi. Một phản hồi có thể trung thực với context nhưng không liên quan truy vấn.'
  });
  apply('v:D15_Q88', {
    correct: 'Kiểm tra xác thực và quyền, giới hạn tải/chi phí, tracing, guardrails, xử lý lỗi và chất lượng trên tập đánh giá.',
    wrong: [
      'Kiểm tra demo chạy tốt và giao diện được duyệt, bỏ qua xác thực, giới hạn lưu lượng và phương án phục hồi.',
      'Kiểm tra một prompt thành công, không đo chất lượng trên tình huống thật hay đặt giới hạn chi phí theo tải.',
      'Kiểm tra số GPU và tốc độ phản hồi, không xác minh quyền truy cập hoặc giám sát đầu ra của agent.'
    ],
    explanation: 'Trước phát hành cần xác thực, phân quyền, kiểm soát chi phí, giám sát, đánh giá, cơ chế giảm thiểu rủi ro và phương án khi công cụ thất bại. Yêu cầu cụ thể phụ thuộc loại ứng dụng.'
  });
  reviseFive('D13', 53, {
    correct: 'TPS đo số token sinh mỗi giây ở giai đoạn decode; TTFT đo thời gian từ lúc gửi yêu cầu đến token đầu tiên.',
    wrong: [
      'TPS đo thời gian đến token đầu tiên, còn TTFT đo số token sinh mỗi giây sau khi bắt đầu giải mã.',
      'TPS là số request hoàn thành mỗi phút; TTFT là thời gian đến khi toàn bộ câu trả lời được sinh xong.',
      'TPS là số token có trong prompt đầu vào; TTFT là dung lượng KV Cache cần cấp cho mỗi lượt gọi.'
    ],
    explanation: 'Trong giám sát streaming, TTFT phản ánh thời gian chờ trước token đầu tiên, còn TPS phản ánh tốc độ phát token trong decode. Cần quy định rõ cách đo throughput vì đôi khi TPS được dùng cho token tổng hợp trên nhiều request.'
  });
  reviseFive('D12', 60, {
    correct: 'Khi cần ra mắt nhanh, thiếu nguồn lực SRE/DevOps và các chức năng quản lý, giám sát sẵn có đáp ứng yêu cầu.',
    wrong: [
      'Khi có đội SRE và cần kiểm soát sâu mọi lớp hạ tầng mà nền tảng managed không cho phép tùy chỉnh.',
      'Khi bắt buộc vận hành hoàn toàn offline nhưng dịch vụ managed được xem xét chỉ hỗ trợ public cloud.',
      'Khi tải đặc thù cần tối ưu serving theo cách nền tảng managed không hỗ trợ hoặc không cho tiếp cận.'
    ],
    explanation: 'Managed runtime thường giảm công sức vận hành và tăng tốc đưa sản phẩm ra thị trường, nhưng cần đối chiếu tính năng, kiểm soát dữ liệu, bảo mật, chi phí và giới hạn tùy biến. Không thể khẳng định luôn đắt hơn self-host.'
  });
  reviseFive('D11', 60, {
    correct: 'Phát hiện yêu cầu ngoài phạm vi nghiệp vụ để phản hồi hoặc chuyển hướng phù hợp, giảm lạm dụng và chi phí không cần thiết.',
    wrong: [
      'Chặn mọi yêu cầu chứa một số ký tự cố định, bất kể câu hỏi có thuộc đúng dịch vụ của sản phẩm hay không.',
      'Buộc mọi câu hỏi được dịch sang một ngôn ngữ trung gian trước khi kiểm tra quyền và xử lý nội dung đầu vào.',
      'Từ chối mọi câu hỏi có cảm xúc tiêu cực, kể cả phản ánh lỗi sản phẩm thuộc phạm vi cần hỗ trợ người dùng.'
    ],
    explanation: 'Topic Filter kiểm tra tính liên quan của yêu cầu với phạm vi dịch vụ. Cần chính sách cho phép trường hợp ngoại lệ và cơ chế xử lý nhầm lẫn; bộ lọc không bảo đảm ngăn mọi prompt injection.'
  });

  return corrected.size;
}

module.exports = { applyCorrections };

if (require.main === module) {
  const target = path.resolve(__dirname, '../data/bank.json');
  const b = JSON.parse(fs.readFileSync(target, 'utf8'));
  const changed = applyCorrections(b.questions);
  if (process.argv.includes('--apply')) {
    fs.writeFileSync(target, JSON.stringify(b));
    console.log(`Applied ${changed} reviewed question corrections to bank.json.`);
  } else console.log(`Preflight OK: ${changed} reviewed question corrections would apply. Pass --apply to write.`);
}
