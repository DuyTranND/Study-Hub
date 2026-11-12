// Original SHL-style exercises. No proprietary SHL items are copied into this bank.
const fs = require('node:fs');
const path = require('node:path');
const questions = [];
const definitions = {
  num: ['Numerical Reasoning', 'Aptitude · Numerical'],
  ver: ['Verbal Reasoning', 'Aptitude · Verbal'],
  ded: ['Deductive Reasoning', 'Aptitude · Deductive'],
  ind: ['Inductive / Abstract Patterns', 'Aptitude · Inductive'],
  chk: ['Checking Information', 'Aptitude · Checking'],
};
const counters = Object.fromEntries(Object.keys(definitions).map(k => [k, 0]));
function add(cat, prompt, choices, right, explanation) {
  if (!definitions[cat] || !Array.isArray(choices) || ![3, 4].includes(choices.length) || !Number.isInteger(right) || right < 0 || right >= choices.length) throw Error('Invalid question input');
  const id = `shl:${cat}:${String(++counters[cat]).padStart(3, '0')}`;
  questions.push({ id, bank: 'shl', setId: `shl-${cat}`, setTitle: definitions[cat][0], group: definitions[cat][1], topic: definitions[cat][0], type: 'mcq', prompt, options: choices.map((text, i) => ({ key: 'ABCD'[i], text })), answer: 'ABCD'[right], explanation, detail: '', hint: '', ref: 'Original SHL-style practice; see SHL Official Samples', points: 1 });
}

const branches = `**Doanh thu theo chi nhánh (tỷ VND)**\n\n| Chi nhánh | Kỳ trước | Kỳ này |\n|---|---:|---:|\n| Bắc | 120 | 138 |\n| Trung | 95 | 104,5 |\n| Nam | 160 | 184 |\n| Tây | 75 | 84 |`;
add('num', `${branches}\n\nDoanh thu chi nhánh **Bắc** tăng bao nhiêu phần trăm?`, ['10%', '12%', '15%', '18%'], 2, '(138 − 120) / 120 = 15%.');
add('num', `${branches}\n\nDoanh thu chi nhánh **Trung** tăng bao nhiêu tỷ VND?`, ['8,5', '9,5', '10,5', '11,5'], 1, '104,5 − 95 = **9,5 tỷ VND**.');
add('num', `${branches}\n\nChi nhánh **Nam** chiếm khoảng bao nhiêu phần trăm **tổng doanh thu kỳ này**?`, ['32,2%', '34,6%', '36,0%', '39,1%'], 2, 'Tổng kỳ này = 138 + 104,5 + 184 + 84 = 510,5. Tỷ trọng Nam = 184 / 510,5 ≈ **36,0%**.');
add('num', `${branches}\n\n**Tổng doanh thu kỳ này** của bốn chi nhánh là bao nhiêu tỷ VND?`, ['500,5', '510,5', '520,5', '530,5'], 1, 'Cộng bốn số ở cột kỳ này: 138 + 104,5 + 184 + 84 = **510,5**.');
add('num', `${branches}\n\nTổng doanh thu của bốn chi nhánh **tăng khoảng bao nhiêu phần trăm**?`, ['11,4%', '12,4%', '13,4%', '14,4%'], 2, 'Tổng kỳ trước = 450; kỳ này = 510,5. Tăng trưởng = 60,5/450 ≈ **13,4%**.');

const products = `**Bảng bán sản phẩm (đơn vị tiền: nghìn VND)**\n\n| Sản phẩm | Số lượng | Giá bán/đơn vị | Chi phí/đơn vị |\n|---|---:|---:|---:|\n| A | 1.200 | 500 | 340 |\n| B | 900 | 800 | 620 |\n| C | 1.500 | 400 | 280 |\n| D | 600 | 1.000 | 700 |`;
add('num', `${products}\n\nSản phẩm nào tạo ra **lợi nhuận gộp lớn nhất**?`, ['Sản phẩm A', 'Sản phẩm B', 'Sản phẩm C', 'Sản phẩm D'], 0, 'Lợi nhuận A = 1.200 × (500 − 340) = **192 triệu**; B = 162, C = 180, D = 180 triệu.');
add('num', `${products}\n\n**Biên lợi nhuận gộp** của B (lợi nhuận/doanh thu) là bao nhiêu?`, ['20,0%', '22,5%', '25,0%', '27,5%'], 1, '(800 − 620) / 800 = **22,5%**.');
add('num', `${products}\n\n**Doanh thu** từ sản phẩm C bằng bao nhiêu triệu VND?`, ['540', '580', '600', '640'], 2, '1.500 × 400 nghìn = **600 triệu VND**.');
add('num', `${products}\n\n**Tổng lợi nhuận gộp** của cả bốn sản phẩm là bao nhiêu triệu VND?`, ['694', '704', '714', '724'], 2, 'A = 192, B = 162, C = 180, D = 180. Tổng = **714 triệu VND**.');
add('num', `${products}\n\nNếu giá bán D **giảm 10%**, chi phí không đổi thì **biên lợi nhuận gộp mới** xấp xỉ bao nhiêu?`, ['20,0%', '22,2%', '25,0%', '28,6%'], 1, 'Giá mới = 1.000 × 0,9 = 900 nghìn. Biên lợi nhuận = (900 − 700) / 900 ≈ **22,2%**.');

const channels = `**Hiệu quả các kênh đăng ký (trong một tuần)**\n\n| Kênh | Lượt truy cập | Đăng ký thành công |\n|---|---:|---:|\n| App | 50.000 | 2.000 |\n| Web | 30.000 | 900 |\n| Chi nhánh | 10.000 | 600 |\n| Hotline | 5.000 | 250 |`;
add('num', `${channels}\n\nKênh nào có **tỷ lệ chuyển đổi** cao nhất?`, ['App', 'Web', 'Chi nhánh', 'Hotline'], 2, 'App 4%, Web 3%, Chi nhánh 6%, Hotline 5%. Cao nhất là **Chi nhánh**.');
add('num', `${channels}\n\nCó bao nhiêu **đăng ký thành công** ở cả bốn kênh?`, ['3.550', '3.650', '3.750', '3.850'], 2, '2.000 + 900 + 600 + 250 = **3.750**.');
add('num', `${channels}\n\n**Tỷ lệ chuyển đổi** của Web bằng bao nhiêu?`, ['2%', '3%', '4%', '5%'], 1, '900 / 30.000 = **3%**.');
add('num', `${channels}\n\n**Tổng lượt truy cập** của tất cả kênh là bao nhiêu?`, ['90.000', '92.500', '95.000', '97.500'], 2, '50.000 + 30.000 + 10.000 + 5.000 = **95.000**.');
add('num', `${channels}\n\nNếu số đăng ký thành công của App **tăng 20%**, các kênh khác giữ nguyên, tổng đăng ký mới là bao nhiêu?`, ['4.050', '4.150', '4.250', '4.350'], 1, 'App mới = 2.000 × 1,2 = 2.400. Tổng mới = 2.400 + 900 + 600 + 250 = **4.150**.');

const truth = ['Đúng', 'Sai', 'Không đủ dữ kiện'];
const passages = [
  `Trong tháng 8, ngân hàng thử nghiệm eKYC tại **20 chi nhánh** và chỉ cho **khách hàng đăng ký mới** sử dụng. Sau bốn tuần, nhóm dự án sẽ xem xét mở rộng nếu tỷ lệ lỗi thấp hơn 2%.`,
  `Khóa Python là **tự chọn** cho thực tập sinh Data, trong khi khóa SQL là **bắt buộc**. Các thực tập sinh phải hoàn thành khóa bắt buộc trước ngày **15/11**. Thông báo không nói gì về học phí.`,
  `Báo cáo chất lượng nêu tỷ lệ lỗi thanh toán **trực tuyến** của hệ thống A giảm từ **5% xuống 4%**; hệ thống B giữ ở **3%**. Báo cáo không thu thập dữ liệu về giao dịch tại quầy.`,
  `Một dự án thí điểm có **120 nhân viên**. **Một nửa** tham gia làm việc từ xa hai ngày mỗi tuần; số còn lại làm việc hoàn toàn tại văn phòng. Nhóm nghiên cứu sẽ đánh giá mức độ hài lòng vào cuối quý; chưa có số liệu năng suất.`
];
function verbal(pass, statement, right, reason) { add('ver', `**Đọc đoạn thông tin rồi đánh giá mệnh đề.**\n\n${passages[pass]}\n\n**Mệnh đề:** ${statement}`, truth, right, reason); }
verbal(0, 'Chương trình thử nghiệm ban đầu áp dụng tại 20 chi nhánh.', 0, 'Đoạn thông tin nêu rõ **20 chi nhánh**.');
verbal(0, 'Khách hàng hiện hữu cũng được sử dụng eKYC trong đợt thử nghiệm.', 1, 'Đoạn thông tin quy định **chỉ khách hàng đăng ký mới**.');
verbal(0, 'Chương trình chắc chắn mở rộng sang toàn bộ chi nhánh vào tháng 9.', 2, 'Mở rộng chỉ được xem xét khi đủ điều kiện, không xác nhận thời gian hay quy mô.');
verbal(1, 'Thực tập sinh Data bắt buộc học SQL.', 0, 'Khóa SQL được ghi rõ là **bắt buộc**.');
verbal(1, 'Khóa Python là bắt buộc với mọi thực tập sinh Data.', 1, 'Python được ghi là **tự chọn**.');
verbal(1, 'Học phí khóa SQL được công ty hỗ trợ toàn bộ.', 2, 'Không có thông tin về học phí hoặc mức hỗ trợ.');
verbal(2, 'Tỷ lệ lỗi trực tuyến của hệ thống A giảm một điểm phần trăm.', 0, 'Giảm từ 5% xuống 4% = **1 điểm phần trăm**.');
verbal(2, 'Ở cuối kỳ, hệ thống B có tỷ lệ lỗi trực tuyến cao hơn A.', 1, 'B = 3%, trong khi A = 4%.');
verbal(2, 'Hệ thống A cũng đã cải thiện tỷ lệ lỗi giao dịch tại quầy.', 2, 'Báo cáo **không thu thập** dữ liệu giao dịch tại quầy.');
verbal(3, 'Có 60 nhân viên được tham gia làm việc từ xa.', 0, 'Một nửa của 120 là **60**.');
verbal(3, 'Tất cả 120 nhân viên đều được làm việc từ xa.', 1, 'Nửa còn lại làm việc hoàn toàn tại văn phòng.');
verbal(3, 'Nhóm từ xa có năng suất cao hơn nhóm tại văn phòng.', 2, 'Đoạn thông tin chưa có dữ liệu về năng suất.');

add('ded', 'Mọi nhân viên nhóm A đều biết SQL. Một số nhân viên nhóm A biết Python. Điều gì **chắc chắn đúng**?', ['Mọi người biết SQL đều thuộc nhóm A', 'Một số người biết cả SQL và Python', 'Mọi người thuộc nhóm A đều biết Python', 'Không ai ngoài nhóm A biết Python'], 1, 'Người thuộc nhóm A biết Python cũng phải biết SQL do điều kiện “mọi A biết SQL”.');
add('ded', 'Không thực tập sinh nào của nhóm X được duyệt triển khai lên production. Minh được duyệt triển khai. Kết luận nào bắt buộc đúng?', ['Minh không phải thực tập sinh nhóm X', 'Minh chắc chắn là trưởng nhóm X', 'Minh chưa từng viết mã production', 'Mọi người được duyệt đều là nhân viên chính thức'], 0, 'Nếu Minh là thực tập sinh nhóm X thì không thể được duyệt; do đó Minh không thuộc tập này.');
add('ded', 'Nếu giao dịch bị gắn cờ **critical** thì hệ thống gửi cảnh báo. Một giao dịch có cảnh báo. Điều nào chính xác?', ['Giao dịch chắc chắn critical', 'Giao dịch chắc chắn hợp lệ', 'Chưa đủ dữ kiện để kết luận critical', 'Không giao dịch critical nào được cảnh báo'], 2, '“Critical ⇒ cảnh báo” không có nghĩa “cảnh báo ⇒ critical”. Đây là lỗi khẳng định hậu quả.');
add('ded', 'Có ba cuộc họp A, B, C. A diễn ra **trước B**; C diễn ra **sau B**. Thứ tự nào phù hợp?', ['B → A → C', 'C → A → B', 'A → B → C', 'A → C → B'], 2, 'Từ A < B < C nên thứ tự là **A → B → C**.');
add('ded', 'Mọi báo cáo được phê duyệt đều đã qua kiểm thử. Một báo cáo **chưa qua kiểm thử**. Điều gì chắc chắn đúng?', ['Báo cáo không được phê duyệt', 'Báo cáo chắc chắn có lỗi nghiêm trọng', 'Báo cáo sẽ được phê duyệt ngày mai', 'Báo cáo được phê duyệt từ trước'], 0, 'Phản đảo hợp lệ: “đã duyệt ⇒ đã kiểm thử” nên “chưa kiểm thử ⇒ chưa duyệt”.');
add('ded', 'Bốn ứng viên An, Bình, Chi, Dũng xếp hàng. An đứng **trước Bình**; Chi đứng **sau Bình**; Dũng đứng **đầu tiên**. Ai **chắc chắn đứng cuối**?', ['An', 'Bình', 'Chi', 'Dũng'], 2, 'Ba người còn lại phải theo thứ tự An, Bình, Chi; Dũng đứng đầu nên Chi đứng cuối.');
add('ded', 'Có ít nhất một kỹ sư trong nhóm biết cả SQL và Python. Phát biểu nào chắc chắn đúng?', ['Mọi kỹ sư đều biết SQL', 'Có người trong nhóm biết SQL', 'Không ai trong nhóm chỉ biết Python', 'Đa số kỹ sư biết Python'], 1, 'Có ít nhất một người biết **cả hai**, nên tồn tại ít nhất một người biết SQL.');
add('ded', 'Bộ phận chỉ duyệt khoản vay nếu hồ sơ **đủ giấy tờ**. Hồ sơ P **thiếu giấy tờ**. Suy ra điều gì?', ['P vẫn chắc chắn được duyệt', 'P chắc chắn bị từ chối vì rủi ro', 'P chưa thể được duyệt theo quy tắc', 'P được duyệt nếu khách hàng đồng ý'], 2, '“Được duyệt ⇒ đủ giấy tờ”. P thiếu giấy tờ nên không thỏa điều kiện cần để duyệt.');
add('ded', 'A, B, C có nhiệm vụ riêng: phân tích, kiểm thử, triển khai. A không làm triển khai; B làm kiểm thử; C không làm phân tích. Ai làm triển khai?', ['A', 'B', 'C', 'Không xác định'], 2, 'B làm kiểm thử. C không phân tích nên C triển khai; A phân tích.');
add('ded', 'Chỉ quản trị viên mới có thể xóa nhật ký. Linh **không phải quản trị viên**. Suy ra điều gì?', ['Linh không có quyền xóa nhật ký', 'Linh chắc chắn có quyền xem nhật ký', 'Mọi quản trị viên đều phải xóa nhật ký', 'Linh đã từng là quản trị viên'], 0, '“Có quyền xóa ⇒ là quản trị viên”. Không phải quản trị viên ⇒ không có quyền xóa.');
add('ded', 'Trong nhóm chỉ có ba người P, Q, R. P cao hơn Q; R thấp hơn Q. Ai cao nhất?', ['P', 'Q', 'R', 'Không thể xác định'], 0, 'P > Q > R, do đó P cao nhất.');
add('ded', 'Mọi API nội bộ yêu cầu token. API Z **không yêu cầu token**. Điều gì nhất định đúng?', ['Z là API công khai', 'Z không thuộc tập API nội bộ', 'Z luôn miễn phí cho mọi người', 'Z dùng xác thực bằng mật khẩu'], 1, 'API nội bộ ⇒ cần token, nên không cần token ⇒ không phải API nội bộ. Không suy ra Z công khai.');

add('ind', '**Hoàn thành dãy hình:** ● ○ ● ○ ● ?', ['●', '○', '▲', '□'], 1, 'Hai hình **●, ○** luân phiên, tiếp theo là ○.');
add('ind', '**Hoàn thành dãy hình:** ▲ ▲ ■ ▲ ▲ ■ ▲ ?', ['■', '▲', '○', '□'], 1, 'Quy luật lặp lại **▲ ▲ ■**; sau ▲ đầu tiên của chu kỳ là ▲.');
add('ind', '**Hoàn thành dãy hướng:** ↑ → ↓ ← ↑ ?', ['←', '↓', '→', '↑'], 2, 'Mũi tên quay thuận chiều kim đồng hồ mỗi lần 90°; sau ↑ là →.');
add('ind', '**Hoàn thành dãy số hình:** ■ | □□ | ■■■ | □□□□ | ?', ['□□□□□', '■■■■', '■■■■■', '□□□□'], 2, 'Số lượng tăng 1, 2, 3, 4, 5; màu tô luân phiên đặc/rỗng, nên 5 hình ■.');
add('ind', '**Tìm ô tiếp theo:** ◼◻◻ → ◻◼◻ → ◻◻◼ → ?', ['◻◻◼', '◼◻◻', '◻◼◻', '◼◼◼'], 1, 'Ô được tô dịch từ vị trí 1 → 2 → 3 → 1.');
add('ind', '**Quy luật chữ và số:** A1 → C2 → E3 → G4 → ?', ['H5', 'I4', 'I5', 'J6'], 2, 'Chữ cái tăng 2 vị trí A,C,E,G,I và số tăng 1.');
add('ind', '**Hoàn thành dãy:** ●● | ○○○ | ●●●● | ○○○○○ | ?', ['●●●●●', '●●●●●●', '○○○○○○', '○○○○○○○'], 1, 'Số hình tăng từ 2 lên 6; hình đen và trắng xen kẽ.');
add('ind', '**Hoàn thành chu kỳ ba hình:** △ □ ○ △ □ ?', ['□', '△', '○', '◇'], 2, 'Chu kỳ là **△, □, ○** nên tiếp theo là ○.');
add('ind', '**Hoàn thành dãy mũi tên:** ↗ ↘ ↙ ↖ ↗ ?', ['↗', '↖', '↙', '↘'], 3, 'Mũi tên quay lần lượt 90° theo chiều kim đồng hồ.');
add('ind', '**Quy luật ghép số và chữ:** 2A → 4C → 8E → 16G → ?', ['24H', '32H', '32I', '36I'], 2, 'Số nhân đôi: 2,4,8,16,32; chữ cái tăng 2: A,C,E,G,I.');
add('ind', '**Quy luật hình và màu:** ▲● → ▶○ → ▼● → ◀○ → ?', ['▶●', '▲●', '▲○', '▼○'], 1, 'Tam giác quay 90°; chấm tròn luân phiên đen/trắng. Sau ◀○ là ▲●.');
add('ind', '**Dãy vị trí khối tô:** □□■ | □■□ | ■□□ | ?', ['■■□', '□■□', '□□■', '■■■'], 2, 'Ô tô di chuyển từ phải qua giữa qua trái, rồi quay về phải.');

const refs = [
  'VN-48B7-20QD', 'TX-8041-7OQ2', 'KPI-24S1-Z09A',
  'CR-6602-I5OD', 'AB-93G8-1Q0Z', 'TP-50B1-8M2N',
  'RD-14S0-9OLP', 'XQ-7B09-4J3E', 'WK-20Q5-8G6P'
];
const mismatch = [
  ['VN-48B7-2OQD', 'VN-4BB7-20QD', 'VN-48B7-20OD'],
  ['TX-8O41-7OQ2', 'TX-8041-7QQ2', 'TX-8041-7OQZ'],
  ['KPI-24S1-ZO9A', 'KPI-24SI-Z09A', 'KPI-24S1-ZO0A'],
  ['CR-6602-I50D', 'CR-66O2-I5OD', 'CR-6602-I5QÐ'],
  ['AB-93G8-1QOZ', 'AB-93G8-IQ0Z', 'AB-93G8-1QO2'],
  ['TP-50BI-8M2N', 'TP-50B1-8MN2', 'TP-50B1-8MZN'],
  ['RD-14SO-9OLP', 'RD-14S0-9O1P', 'RD-14S0-90LP'],
  ['XQ-7BO9-4J3E', 'XQ-7B09-4J8E', 'XQ-7B09-4J3F'],
  ['WK-20Q5-8GGP', 'WK-2OQ5-8G6P', 'WK-20Q5-8G6R'],
];
refs.forEach((ref, i) => {
  const position = (i * 3 + 1) % 4;
  const options = mismatch[i].slice(); options.splice(position, 0, ref);
  add('chk', `**Kiểm tra độ chính xác.** Chọn mã **trùng hoàn toàn** với mã gốc, bao gồm chữ hoa, số và dấu nối.\n\nMã gốc: \`${ref}\``, options.map(x => `\`${x}\``), position, `Mã gốc là **\`${ref}\`**. Các lựa chọn còn lại khác ít nhất một ký tự hoặc vị trí.`);
});

for (const [id, count] of Object.entries({ num: 15, ver: 12, ded: 12, ind: 12, chk: 9 })) {
  if (counters[id] !== count) throw Error(`Unexpected ${id} count: ${counters[id]}`);
}
// Distribute answer letters evenly so the correct choice cannot be guessed from its position.
let seed = 0x53484c27;
const random = () => ((seed ^= seed << 13, seed ^= seed >>> 17, seed ^= seed << 5), (seed >>> 0) / 0x100000000);
for (const optionCount of [3, 4]) {
  const group = questions.filter(q => q.options.length === optionCount);
  const targets = group.map((_, i) => i % optionCount);
  for (let i = targets.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [targets[i], targets[j]] = [targets[j], targets[i]];
  }
  group.forEach((q, i) => {
    const correctText = q.options.find(o => o.key === q.answer).text;
    const offset = (targets[i] - 'ABCD'.indexOf(q.answer) + optionCount) % optionCount;
    const before = q.options.map(o => o.text);
    const after = before.map((_, index) => before[(index - offset + optionCount) % optionCount]);
    q.options = after.map((text, index) => ({ key: 'ABCD'[index], text }));
    q.answer = q.options.find(o => o.text === correctText).key;
  });
}
const sets = Object.entries(definitions).map(([cat, [title, group]]) => ({
  id: `shl-${cat}`, bank: 'shl', code: `SHL-${cat.toUpperCase()}`, title, group,
  domain: cat === 'num' ? 'math' : cat === 'chk' ? 'code' : 'safety', kind: 'topic', count: counters[cat],
  description: ({ num: '15 bài đọc bảng, phần trăm, doanh thu và lợi nhuận.', ver: '12 câu đọc hiểu Đúng / Sai / Không đủ dữ kiện.', ded: '12 câu suy luận logic từ các điều kiện bắt buộc.', ind: '12 câu quy luật hình, vị trí, hướng và chuỗi.', chk: '9 câu so khớp mã dễ nhầm O/0, I/1 và vị trí.' })[cat]
}));
const categories = ['num', 'ver', 'ded', 'ind', 'chk'];
const split = { num: 7, ver: 6, ded: 6, ind: 6, chk: 5 };
function interleave(groups) {
  const result = [];
  while (groups.some(group => group.length)) for (const group of groups) if (group.length) result.push(group.shift().id);
  return result;
}
for (const mockIndex of [0, 1]) {
  const questionsForMock = categories.map(cat => {
    const all = questions.filter(q => q.setId === `shl-${cat}`);
    return (mockIndex === 0 ? all.slice(0, split[cat]) : all.slice(split[cat])).slice();
  });
  const questionIds = interleave(questionsForMock);
  sets.splice(mockIndex, 0, { id: `shl-mock-${mockIndex + 1}`, bank: 'shl', code: `SHL-M${mockIndex + 1}`, title: `SHL Aptitude Simulation ${mockIndex + 1}`,
    group: 'SHL Aptitude', domain: 'general', kind: 'full', count: questionIds.length,
    minutes: mockIndex === 0 ? 35 : 35, questionIds,
    description: '30 câu trộn Numerical, Verbal, Deductive, Inductive, Checking; chấm điểm và giải thích sau khi nộp.' });
}
if (new Set(sets.flatMap(s => s.questionIds || [])).size !== questions.length) throw Error('Mock exams must cover every question exactly once');
const payload = { version: 1, sources: [
  { title: 'SHL official practice tests', url: 'https://www.shlglobal.cn/en/shldirect/en/practice-tests/' },
  { title: 'SHL official example questions', url: 'https://www.shlglobal.cn/en/shldirect/en/example-questions/' },
  { title: 'Verify Interactive Numerical factsheet', url: 'https://www.shl.com/assets/documents/rebranded-assets/product-factsheet-verify-interactive-numerical-reasoning.pdf' },
  { title: 'SHL Automata candidate support', url: 'https://support.shl.com/category.html?c=10_91_12_37_43_' }
], questions, sets };
const output = path.resolve(__dirname, '../data/shl-practice.json');
fs.writeFileSync(output, JSON.stringify(payload, null, 2) + '\n');
console.log(`Created ${output}: ${questions.length} original questions, ${sets.length} sets`);
