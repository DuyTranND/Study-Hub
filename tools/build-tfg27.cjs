/** Original TFG27 revision questions. Run: node tools/build-tfg27.cjs
 * SHL-style topics are independently authored; no actual exam items are reproduced. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const questions = [];
const groups = {
  num: { title: 'Numerical Reasoning', code: 'TFG-NUM', group: 'Aptitude · Numerical', domain: 'math', description: 'Đọc bảng số liệu, tăng trưởng, lợi nhuận, tỷ lệ và trung bình có trọng số.' },
  ded: { title: 'Deductive & Verbal Reasoning', code: 'TFG-DED', group: 'Aptitude · Deductive', domain: 'safety', description: 'Suy luận chắc chắn đúng, điều kiện cần/đủ và dữ kiện còn thiếu.' },
  ind: { title: 'Inductive Reasoning', code: 'TFG-IND', group: 'Aptitude · Inductive', domain: 'math', description: 'Dãy số, sai phân, quy luật xen kẽ và suy luận quy nạp.' },
  py: { title: 'Python 3.12 Fundamentals', code: 'TFG-PY', group: 'Functional · Python', domain: 'code', description: 'Cú pháp, built-ins, slicing, list/dict/set và bẫy output.' },
  alg: { title: 'Algorithms & Complexity', code: 'TFG-ALG', group: 'Functional · Algorithms', domain: 'code', description: 'Hash map, sort, binary search, sliding window, edge cases và Big-O.' },
  coding: { title: 'Automata Coding Challenges', code: 'TFG-CODE', group: 'Functional · Python coding', domain: 'code', description: '6 bài viết hàm Python 3.12, có ví dụ, constraints và lời giải tham khảo.' },
  sql: { title: 'SQL & Data Engineering', code: 'TFG-SQL', group: 'Functional · SQL & Data', domain: 'code', description: 'JOIN, GROUP BY, window functions, NULL và data quality.' },
  ml: { title: 'Statistics & Machine Learning', code: 'TFG-ML', group: 'Functional · Data & AI', domain: 'ml', description: 'Xác suất, metric, validation, dữ liệu lệch lớp, leakage và A/B testing.' }
};
const digits = ['A', 'B', 'C', 'D'];
function add(t, prompt, correct, wrong, explanation, extras = {}) {
  assert(groups[t], 'unknown topic');
  assert(Array.isArray(wrong) && wrong.length === 3, 'require three distractors');
  const count = questions.filter(q => q.setId === 'tfg-' + t).length + 1;
  const alternatives = [String(correct), ...wrong.map(String)];
  assert.equal(new Set(alternatives.map(s => s.trim().toLocaleLowerCase('vi-VN'))).size, 4, `${t}/${count}: repeated choice`);
  const offset = (questions.length * 3 + 1) % 4;
  const rotated = alternatives.slice(offset).concat(alternatives.slice(0, offset));
  const key = digits[rotated.indexOf(String(correct))];
  questions.push({ id: `tfg:${t}:${String(count).padStart(3, '0')}`, bank: 'tfg27', setId: `tfg-${t}`, setTitle: groups[t].title,
    group: groups[t].group, topic: groups[t].title, type: 'mcq', prompt,
    options: rotated.map((text, i) => ({ key: digits[i], text })), answer: key,
    explanation, detail: extras.detail || '', hint: extras.hint || '', ref: extras.ref || 'Original TFG27 revision exercise; see TFG27 Study Guide', points: 1 });
}
function addCode(prompt, solution, hint, explanation) {
  const t = 'coding', count = questions.filter(q => q.setId === 'tfg-' + t).length + 1;
  questions.push({ id: `tfg:${t}:${String(count).padStart(3, '0')}`, bank: 'tfg27', setId: 'tfg-coding', setTitle: groups.coding.title,
    group: groups.coding.group, topic: 'Python 3.12 coding', type: 'code', prompt, options: [], answer: '',
    explanation: `${explanation}\n\n**Tham khảo lời giải:**\n\n\`\`\`python\n${solution}\n\`\`\``, detail: '', hint, ref: 'Original Automata-style coding practice', points: 1 });
}
const pct = x => Number(x.toFixed(2)).toLocaleString('en-US') + '%';
const amount = x => Number(x.toFixed(2)).toLocaleString('en-US');

// Numerical reasoning: calculation-based generators with independently checked formulas.
for (let i = 0; i < 9; i++) {
  const base = 80 + i * 35, growth = 8 + i * 3, current = base * (100 + growth) / 100;
  add('num', `Một nhóm khách hàng có ${amount(base)} nghìn giao dịch tháng trước và ${amount(current)} nghìn giao dịch tháng này. Tỷ lệ **tăng trưởng** là bao nhiêu?`,
    pct(growth), [pct(growth + 5), pct(growth - 3), pct(growth + 10)],
    `Tăng trưởng = (mới − cũ) / cũ × 100% = (${amount(current)} − ${amount(base)}) / ${amount(base)} × 100% = **${pct(growth)}**. Mẫu số là giá trị tháng trước.`);
}
for (let i = 0; i < 7; i++) {
  const a = 60 + 5 * i, b = 70 + 4 * i, w1 = 100 + 20 * i, w2 = 200 + 10 * i;
  const average = (a * w1 + b * w2) / (w1 + w2), equal = (a + b) / 2;
  const cand = [equal, average + 5, average - 5].map(v => `${v.toFixed(2)}%`);
  if (new Set([`${average.toFixed(2)}%`, ...cand]).size !== 4) cand[0] = `${(average + 2).toFixed(2)}%`;
  add('num', `Nhóm A có **${w1}** đơn, tỷ lệ thành công **${a}%**; nhóm B có **${w2}** đơn, tỷ lệ thành công **${b}%**. Tỷ lệ thành công **gộp** là bao nhiêu (làm tròn 2 chữ số)?`,
    `${average.toFixed(2)}%`, cand,
    `Lấy tổng số đơn thành công chia tổng số đơn: (${w1}×${a}% + ${w2}×${b}%) / (${w1}+${w2}) = **${average.toFixed(2)}%**. Không lấy trung bình hai tỷ lệ khi số đơn khác nhau.`);
}
for (let i = 0; i < 5; i++) {
  const revenue = 400 + 90 * i, margin = 12 + 4 * i, cost = revenue * (100 - margin) / 100;
  add('num', `Doanh thu quý là **${amount(revenue)} tỷ**, chi phí là **${amount(cost)} tỷ**. Biên lợi nhuận tính trên doanh thu bằng bao nhiêu?`,
    pct(margin), [pct(margin + 5), pct(margin - 4), pct(100 - margin)],
    `(Doanh thu − Chi phí) / Doanh thu × 100% = (${amount(revenue)} − ${amount(cost)})/${amount(revenue)} × 100% = **${margin}%**.`);
}
for (let i = 0; i < 5; i++) {
  const total = 480 + i * 120, share = 15 + i * 5, part = total * share / 100;
  add('num', `Có **${amount(total)}** hồ sơ, trong đó **${amount(part)}** hồ sơ được duyệt qua kênh số. Kênh số chiếm bao nhiêu phần trăm?`,
    pct(share), [pct(share + 10), pct(share - 5), pct(100 - share)],
    `Tỷ trọng = số hồ sơ kênh số / tổng hồ sơ = ${amount(part)}/${amount(total)} = **${share}%**.`);
}
for (let i = 0; i < 4; i++) {
  const total = 120 + i * 50, hours = 3 + i, speed = total / hours;
  add('num', `Một hệ thống xử lý **${total}** hồ sơ trong **${hours} giờ**, tốc độ ổn định. Trong 1 giờ xử lý trung bình bao nhiêu hồ sơ?`,
    amount(speed), [amount(speed + 10), amount(speed - 5), amount(total - hours)],
    `Năng suất mỗi giờ = tổng hồ sơ / tổng thời gian = ${total}/${hours} = **${amount(speed)}** hồ sơ/giờ.`);
}

// Deductive reasoning: conclusions must follow from the supplied statements alone.
const entities = [
  ['giao dịch được xác thực', 'có mã kiểm soát', 'giao dịch T1'],
  ['khách hàng VIP', 'được phân quản lý riêng', 'khách hàng H'],
  ['báo cáo chuẩn', 'được ký số', 'báo cáo R'],
  ['mô hình được triển khai', 'đã kiểm định', 'mô hình M'],
  ['giao dịch quốc tế', 'được gắn mã quốc gia', 'giao dịch X'],
  ['hồ sơ được phê duyệt', 'đã qua kiểm tra', 'hồ sơ P'],
  ['tài khoản doanh nghiệp', 'có mã khách hàng tổ chức', 'tài khoản K'],
  ['yêu cầu ưu tiên', 'được xử lý trước hạn', 'yêu cầu Q']
];
entities.forEach(([category, predicate, sample]) => add('ded', `Cho hai dữ kiện: **Tất cả ${category} đều ${predicate}**. **${sample} là một ${category}**. Kết luận nào bắt buộc đúng?`,
  `${sample} ${predicate}.`, [`Mọi đối tượng ${predicate} đều thuộc nhóm ${category}.`, `${sample} không ${predicate}.`, `Không tồn tại đối tượng ngoài nhóm ${category} mà ${predicate}.`],
  `Theo suy luận tập hợp: nếu mọi A đều thuộc B và x thuộc A, chắc chắn x thuộc B. Chiều đảo B→A và các kết luận về bên ngoài nhóm A không được đảm bảo.`));
for (const [i, a, b, c] of [
  [1,'An','Bình','Chi'],[2,'Minh','Lan','Hà'],[3,'Khoa','Dũng','Thảo'],[4,'Vy','Huy','Mai'],[5,'Nam','Hoa','Linh']]) {
  add('ded', `${a} xử lý nhiều hồ sơ hơn ${b}; ${b} xử lý nhiều hơn ${c}. Ai xử lý **ít hồ sơ nhất** trong ba người?`,
    c, [a, b, 'Không thể xác định'],
    `Quan hệ thứ tự bắc cầu: ${a} > ${b} > ${c}. Do đó ${c} đứng cuối.`);
}
const implications = [
  ['dữ liệu hợp lệ','pipeline được chạy','pipeline không được chạy'],
  ['máy chủ hoạt động','API phản hồi','API không phản hồi'],
  ['hồ sơ đạt chuẩn','hồ sơ được duyệt','hồ sơ không được duyệt'],
  ['có quyền truy cập','người dùng vào được dashboard','người dùng không vào được dashboard'],
  ['mô hình qua kiểm thử','mô hình được phát hành','mô hình không được phát hành']
];
implications.forEach(([p, q, notQ]) => add('ded', `Nếu **${p}** thì **${q}**. Thực tế **${notQ}**. Điều nào suy ra chắc chắn?`,
  `Điều kiện “${p}” không xảy ra.`, [`Điều kiện “${p}” đã xảy ra.`, `Mệnh đề “nếu ${p} thì ${q}” luôn sai.`, `Không đủ dữ kiện để nói gì về điều kiện ban đầu.`],
  `Đây là modus tollens: P→Q, ¬Q ⇒ ¬P. Nếu P xảy ra thì Q phải đúng, trái với dữ kiện ¬Q.`));
const uncertain = [
  ['Trong 80 khách hàng khảo sát, 60 người thích ứng dụng mới.','Tất cả khách hàng của ngân hàng đều thích ứng dụng mới.'],
  ['Các nhân viên thuộc tổ A hoàn thành khóa SQL.','Nhân viên tổ B cũng hoàn thành khóa SQL.'],
  ['Doanh thu tháng 3 cao hơn tháng 2.','Doanh thu tháng 3 cao nhất trong cả năm.'],
  ['Một số giao dịch bất thường bị đánh dấu cảnh báo.','Mọi giao dịch bất thường đều bị đánh dấu.'],
  ['Cơ sở dữ liệu lưu giao dịch từ năm 2024.','Tất cả bản ghi trước 2024 đã bị xóa.']
];
uncertain.forEach(([passage, statement]) => add('ded', `Đọc thông tin: **${passage}**\n\nNhận định: **${statement}**\n\nChọn đánh giá dựa **chỉ trên thông tin được cung cấp**.`,
  'Không đủ thông tin để kết luận.', ['Nhận định chắc chắn đúng.', 'Nhận định chắc chắn sai.', 'Nhận định chắc chắn đúng với phần lớn trường hợp.'],
  `Dữ kiện chỉ nói về một phần/phạm vi cụ thể và không xác nhận cũng không phủ định trực tiếp nhận định rộng hơn. Không được tự bổ sung dữ liệu bên ngoài.`));

// Inductive reasoning: each sequence has one clearly defined construction rule.
function sequence(nums, next, explanation, type) {
  const correct = String(next);
  const wrong = [String(next + (Math.abs(next) > 40 ? 4 : 2)), String(next - (Math.abs(next) > 40 ? 5 : 3)), String(next + (Math.abs(next) > 40 ? 9 : 5))];
  add('ind', `Tìm số tiếp theo trong dãy **${nums.join(', ')}, ?**`, correct, wrong, `Quy luật: ${explanation}. Số tiếp theo là **${next}**.`, { hint: type });
}
for (let i = 0; i < 6; i++) {
  const start = 2 + i * 3, step = 3 + i * 2, seq = Array.from({length: 5}, (_,j) => start + j * step);
  sequence(seq, start + 5 * step, `mỗi số cộng ${step}`, 'Xét hiệu của hai số liên tiếp.');
}
for (let i = 0; i < 4; i++) {
  const x = 1 + i, ratio = i % 2 ? 3 : 2, seq = Array.from({length: 5}, (_,j) => x * ratio ** j);
  sequence(seq, x * ratio ** 5, `mỗi số nhân ${ratio}`, 'Xét tỷ số của hai số liên tiếp.');
}
for (let i = 0; i < 5; i++) {
  const begin = 1 + i, seq = Array.from({length: 5}, (_,j) => (begin + j) ** 2);
  sequence(seq, (begin + 5) ** 2, `bình phương các số nguyên từ ${begin} trở đi`, 'Xét các số chính phương.');
}
for (let i = 0; i < 5; i++) {
  const n = 1 + i, seq = [n, n + 2, n + 5, n + 9, n + 14];
  sequence(seq, n + 20, 'hiệu lần lượt tăng 1: +2, +3, +4, +5, +6', 'Xét hiệu bậc hai.');
}
for (let i = 0; i < 4; i++) {
  const a = 2 + i, b = 11 + i, seq = [a, b, a+2, b+3, a+4, b+6];
  sequence(seq, a+6, 'hai dãy xen kẽ: vị trí lẻ +2; vị trí chẵn +3', 'Chia dãy thành hai chuỗi vị trí lẻ/chẵn.');
}

// Python 3.12: output choices deliberately resemble plausible runtime results.
// Each snippet is executable on its own, and expected output is checked during QA.
const pyCases = [
  ['a = [2, 4, 6, 8]\nprint(a[1:3])', '[4, 6]', ['[2, 4, 6]', '[4, 6, 8]', '[2, 4]'], 'Slice lấy chỉ số 1 và 2, không gồm chỉ số kết thúc 3.'],
  ['print(-7 // 3)', '-3', ['-2', '2', '3'], 'Toán tử // làm tròn xuống về phía âm vô cực, không cắt về 0.'],
  ['print(-7 % 3)', '2', ['-1', '1', '-2'], 'Với số chia dương, số dư Python không âm: -7 = (-3)×3 + 2.'],
  ['a = [3, 1, 2]\nprint(a.sort())', 'None', ['[1, 2, 3]', '[3, 1, 2]', 'True'], 'list.sort() thay đổi danh sách tại chỗ và trả về None.'],
  ['a = [3, 1, 2]\nb = sorted(a)\nprint(a, b)', '[3, 1, 2] [1, 2, 3]', ['[1, 2, 3] [1, 2, 3]', '[3, 1, 2] [3, 1, 2]', 'None [1, 2, 3]'], 'sorted(a) tạo danh sách mới, không làm thay đổi a.'],
  ['a = [1, 2]\nb = a\nb.append(3)\nprint(a)', '[1, 2, 3]', ['[1, 2]', '[3]', 'None'], 'b và a tham chiếu cùng một list.'],
  ['a = [1, 2]\nb = a.copy()\nb.append(3)\nprint(a)', '[1, 2]', ['[1, 2, 3]', '[3]', 'None'], 'copy() tạo danh sách mới nên append vào b không đổi a.'],
  ['print(list(range(2, 9, 3)))', '[2, 5, 8]', ['[2, 5]', '[2, 5, 8, 11]', '[3, 6, 9]'], 'range(start, stop, step) không bao gồm stop.'],
  ['print(bool([]), bool("0"))', 'False True', ['False False', 'True True', 'True False'], 'List rỗng là falsy; chuỗi không rỗng, kể cả "0", là truthy.'],
  ['x = {"a": 1}\nprint(x.get("b", 5))', '5', ['None', 'KeyError', '0'], 'dict.get(key, default) trả về default khi không có key.'],
  ['print(len(set([1, 2, 2, 3, 3])))', '3', ['5', '2', '4'], 'set loại bỏ phần tử trùng: {1, 2, 3}.'],
  ['print([x*x for x in range(4) if x % 2 == 0])', '[0, 4]', ['[0, 1, 4, 9]', '[4, 16]', '[0, 2]'], 'Các giá trị chẵn trong range(4) là 0 và 2.'],
  ['a = [10, 20, 30]\nprint(a[-1], a[-2])', '30 20', ['10 20', '20 30', '30 10'], 'Chỉ số âm đếm từ cuối: -1 là phần tử cuối.'],
  ['print("data"[::-1])', 'atad', ['data', 'adat', 'dtaa'], 'Slice bước -1 đảo ngược chuỗi.'],
  ['print("a,b,c".split(","))', "['a', 'b', 'c']", ["['a,b,c']", "['a', 'b']", "['a', 'b', 'c', '']"], 'str.split(",") tách thành ba phần tử.'],
  ['print(sum([1, 2, 3], 10))', '16', ['6', '10', '17'], 'Đối số thứ hai là giá trị bắt đầu của sum: 10 + 1 + 2 + 3.'],
  ['print(2 ** 3 ** 2)', '512', ['64', '256', '36'], 'Toán tử ** kết hợp từ phải sang trái: 2 ** (3 ** 2).'],
  ['print(0 == False, 1 == True)', 'True True', ['False False', 'True False', 'False True'], 'bool là lớp con của int; False bằng 0 và True bằng 1 khi so sánh ==.'],
  ['x = [1, 2, 3]\nprint(x.pop(1), x)', '2 [1, 3]', ['1 [2, 3]', '2 [1, 2, 3]', '3 [1, 2]'], 'pop(1) trả về và xóa phần tử ở vị trí 1.'],
  ['print(list(zip([1, 2], ["a", "b", "c"])))', "[(1, 'a'), (2, 'b')]", ["[(1, 'a'), (2, 'b'), (None, 'c')]", "[(1, 'a'), (2, 'b'), (2, 'c')]", "[(1, 'a'), (1, 'b')]"], 'zip mặc định dừng khi iterable ngắn nhất hết phần tử.'],
  ['print({x: x*x for x in [1, 2, 3]}[2])', '4', ['2', '9', '3'], 'Dictionary comprehension ánh xạ 2 tới 4.'],
  ['print("banana".count("an"))', '2', ['1', '3', '0'], 'Hai lần xuất hiện không chồng lấn của "an" ở banana.'],
  ['print(all([True, 1, 0]), any([False, 0, "x"]))', 'False True', ['True True', 'False False', 'True False'], 'all yêu cầu mọi phần tử truthy; any chỉ cần một phần tử truthy.'],
  ['print(list(enumerate(["a", "b"], start=1)))', "[(1, 'a'), (2, 'b')]", ["[(0, 'a'), (1, 'b')]", "[(1, 'b'), (2, 'a')]", "[(1, 'a'), (1, 'b')]"], 'enumerate(start=1) đánh chỉ số bắt đầu từ 1.'],
  ['print(round(2.5), round(3.5))', '2 4', ['3 4', '2 3', '3 3'], 'Python dùng quy tắc làm tròn tới số chẵn gần nhất với .5.'],
  ['a = [1, 2]\nprint(a * 2)', '[1, 2, 1, 2]', ['[2, 4]', '[1, 2, 2]', '[2, 4, 2, 4]'], 'Nhân list với số nguyên lặp lại các phần tử, không nhân từng giá trị.'],
  ['print("a" in {"a": 1}, 1 in {"a": 1})', 'True False', ['True True', 'False True', 'False False'], 'Toán tử in trên dict kiểm tra key, không kiểm tra value.'],
  ['print([i for i in range(5) if i % 2])', '[1, 3]', ['[0, 2, 4]', '[1, 2, 3]', '[2, 4]'], 'i % 2 truthy đối với các số lẻ.']
];
for (const [code, result, wrong, explanation] of pyCases) {
  add('py', `Cho đoạn mã Python 3.12 sau:\n\n\`\`\`python\n${code}\n\`\`\`\n\n**Kết quả in ra là gì?**`, result, wrong, explanation, {hint: 'Phân biệt giá trị trả về, tác dụng phụ và thứ tự thực thi.'});
}

const algorithmCases = [
  ['Độ phức tạp thời gian trung bình của tìm kiếm key trong Python dict là gì?', 'O(1)', ['O(n)', 'O(log n)', 'O(n log n)'], 'Bảng băm cho trung bình O(1); trường hợp xấu có thể lớn hơn.'],
  ['Thuật toán tìm nhị phân (binary search) cần điều kiện đầu vào nào?', 'Dữ liệu được sắp xếp theo thứ tự tương ứng.', ['Các giá trị đều dương.', 'Mảng không có phần tử trùng.', 'Mảng chỉ chứa số nguyên.'], 'Binary search dựa vào thứ tự để loại bỏ một nửa miền tìm kiếm.'],
  ['Độ phức tạp của hai vòng for lồng nhau, mỗi vòng chạy n lần, là gì?', 'O(n²)', ['O(n)', 'O(log n)', 'O(n log n)'], 'Hai vòng lặp thực hiện n×n bước.'],
  ['Tìm hai số có tổng bằng target trong mảng chưa sắp xếp, phương pháp kỳ vọng O(n) là gì?', 'Lưu phần bù target − x trong hash map.', ['Sắp xếp rồi thử mọi cặp.', 'Duyệt mọi cặp chỉ số.', 'Tạo mọi tập con của mảng.'], 'Một lần duyệt và tra cứu dictionary trung bình O(1) mỗi bước.'],
  ['Với sliding window tìm đoạn dài nhất không trùng ký tự, khi gặp ký tự lặp, ta cần làm gì?', 'Dời biên trái tới sau lần xuất hiện trước trong cửa sổ.', ['Dời biên trái về đầu chuỗi rồi duyệt lại từ đầu.', 'Dời biên trái đến cuối cửa sổ trước khi duyệt tiếp.', 'Dời biên phải về vị trí đầu chuỗi rồi duyệt lại.'], 'Biên trái không được lùi; phải vượt qua lần lặp nằm trong cửa sổ hiện tại.'],
  ['Tính tổng nhanh của đoạn a[l:r] sau tiền xử lý prefix sum, mỗi truy vấn tốn bao lâu?', 'O(1)', ['O(n)', 'O(log n)', 'O(r − l + 1)'], 'prefix[r] − prefix[l] là hai phép tra cứu O(1), sau O(n) tiền xử lý.'],
  ['Để kiểm tra dấu ngoặc mở/đóng hợp lệ, cấu trúc dữ liệu phù hợp nhất là gì?', 'Stack (ngăn xếp LIFO).', ['Queue (hàng đợi FIFO).', 'Set không có thứ tự.', 'Binary search tree.'], 'Dấu ngoặc đóng phải khớp dấu mở gần nhất nên sử dụng LIFO.'],
  ['Thuật toán BFS trên đồ thị không trọng số tìm được điều gì?', 'Đường đi ít cạnh nhất từ đỉnh xuất phát.', ['Đường đi có tổng trọng số nhỏ nhất bất kỳ.', 'Cây khung nhỏ nhất.', 'Chu trình Hamilton nếu tồn tại.'], 'BFS duyệt theo lớp khoảng cách tính bằng số cạnh.'],
  ['Điều kiện cơ sở (base case) trong đệ quy có vai trò gì?', 'Dừng chuỗi gọi đệ quy khi đạt trường hợp đơn giản.', ['Làm bộ nhớ luôn O(1).', 'Bảo đảm mọi thuật toán đều O(n).', 'Tự động loại trừ stack overflow.'], 'Thiếu điểm dừng hợp lệ có thể gây RecursionError.'],
  ['Với danh sách đã sort gồm n phần tử, binary search có độ phức tạp thời gian bao nhiêu?', 'O(log n)', ['O(n)', 'O(n²)', 'O(1) ở mọi trường hợp'], 'Mỗi bước chia đôi không gian tìm kiếm.'],
  ['Nếu sort n phần tử bằng thuật toán so sánh tổng quát, cận dưới trong worst case là bao nhiêu?', 'Ω(n log n)', ['Ω(1)', 'Ω(log n)', 'Ω(n²)'], 'Mô hình decision tree cần phân biệt n! hoán vị.'],
  ['Khi duyệt graph có chu trình bằng DFS, cần lưu gì để tránh xử lý mãi?', 'Tập các đỉnh đã thăm.', ['Tổng giá trị cạnh.', 'Số đỉnh bậc chẵn.', 'Danh sách cạnh có trọng số lớn nhất.'], 'visited giúp không quay lại cùng đỉnh vô hạn lần.'],
  ['Đếm tần suất các phần tử trong danh sách một lần duyệt, nên dùng gì?', 'Dictionary hoặc Counter.', ['Danh sách toàn các số 0 không đổi.', 'Hai vòng for để so từng cặp.', 'Chỉ một biến đếm chung.'], 'Key là phần tử và value là số lần xuất hiện.'],
  ['Với n rất lớn, thuật toán O(n log n) thường có lợi hơn O(n²) vì sao?', 'Số thao tác tăng chậm hơn khi n lớn.', ['Luôn dùng ít bộ nhớ hơn.', 'Luôn nhanh hơn với mọi n nhỏ.', 'Không cần xét hệ số hằng số.'], 'Big-O mô tả tốc độ tăng theo kích thước đầu vào, không bảo đảm thời gian cho mọi n.'],
  ['Trong Two Sum, vì sao kiểm tra complement trước khi thêm phần tử hiện tại vào dict?', 'Tránh dùng cùng một vị trí hai lần khi target = 2×x.', ['Để sort dict theo key.', 'Để giảm độ phức tạp xuống O(log n).', 'Để bảo đảm chỉ có số dương.'], 'Kiểm tra trước giúp hai chỉ số phải khác nhau.'],
  ['Muốn truy cập và xóa phần tử đầu deque nhiều lần, thao tác nào tối ưu?', 'popleft() với O(1).', ['list.pop(0) với O(1).', 'sorted(deque) mỗi lần.', 'Đảo ngược deque rồi tìm kiếm nhị phân.'], 'collections.deque.popleft() thực hiện O(1), list.pop(0) cần dịch phần tử O(n).'],
  ['Một thuật toán phải lấy giá trị nhỏ nhất của dòng dữ liệu sau mỗi lần thêm phần tử. Cấu trúc hữu ích là gì?', 'Min-heap.', ['Hash set.', 'Danh sách không sắp xếp và không quét.', 'Union-find.'], 'Heap cho phép truy cập min O(1), thêm phần tử O(log n).'],
  ['Trong mảng đã sắp xếp, hai con trỏ từ hai đầu thường giúp giải bài toán nào?', 'Tìm cặp có tổng bằng target trong O(n).', ['Liệt kê mọi hoán vị trong O(n).', 'Tìm mọi tập con trong O(n).', 'Sắp xếp bằng một lần so sánh.'], 'So sánh tổng với target để tăng trái hoặc giảm phải.'],
  ['Nếu dùng list làm queue và liên tục gọi pop(0), chi phí mỗi lần có thể là gì?', 'O(n) do dịch phần tử còn lại.', ['O(1) luôn luôn.', 'O(log n) vì có cây tìm kiếm.', 'O(n²) cho chính một lần pop.'], 'pop(0) trên list làm dịch các phần tử còn lại.'],
  ['Trong bài toán top-k trên dữ liệu lớn, dùng min-heap k phần tử cần bao nhiêu bộ nhớ?', 'O(k)', ['O(1) với mọi k', 'O(n²)', 'O(log log n)'], 'Lưu tối đa k phần tử trong heap thay vì toàn bộ n giá trị.']
];
for (const [prompt, correct, wrong, why] of algorithmCases) add('alg', prompt, correct, wrong, why);

// Writing practice: explicit function signatures; reference solutions are meant for self-grading.
addCode('**Two Sum:** Viết hàm `two_sum(nums: list[int], target: int) -> list[int]` trả về hai chỉ số khác nhau có tổng bằng target, theo thứ tự tăng dần; không có thì `[]`. Ví dụ `two_sum([2,7,11,15],9) -> [0,1]`. Ràng buộc: tối đa 100000 phần tử, có số âm và trùng.',
`def two_sum(nums: list[int], target: int) -> list[int]:
    seen = {}
    for i, value in enumerate(nums):
        j = seen.get(target - value)
        if j is not None:
            return [j, i]
        seen[value] = i
    return []`, 'Hash map lưu chỉ số theo giá trị; O(n) thời gian trung bình.', 'Kiểm tra phần bù trước khi lưu chỉ số hiện tại để không dùng trùng vị trí.');
addCode('**Longest unique substring:** Viết `longest_unique(s: str) -> int` trả độ dài đoạn con liên tiếp dài nhất không trùng ký tự. Ví dụ `longest_unique("abba") -> 2`; chuỗi rỗng trả 0. Ràng buộc: độ dài đến 100000.',
`def longest_unique(s: str) -> int:
    last = {}
    left = best = 0
    for right, char in enumerate(s):
        if char in last and last[char] >= left:
            left = last[char] + 1
        last[char] = right
        best = max(best, right - left + 1)
    return best`, 'Dùng sliding window và vị trí xuất hiện cuối của mỗi ký tự.', 'Biên trái chỉ tiến, không lùi khi ký tự lặp đã ở ngoài cửa sổ.');
addCode('**First non-repeating character:** Viết `first_unique(s: str) -> int` trả chỉ số ký tự đầu tiên xuất hiện đúng một lần; không có thì -1. Ví dụ `first_unique("aabbcdd") -> 4`. Có thể có Unicode.',
`from collections import Counter

def first_unique(s: str) -> int:
    counts = Counter(s)
    for i, char in enumerate(s):
        if counts[char] == 1:
            return i
    return -1`, 'Đếm tần suất trước rồi quét theo thứ tự gốc.', 'Counter xử lý được Unicode; ưu tiên chỉ số nhỏ nhất.');
addCode('**Merge intervals:** Viết `merge_intervals(intervals: list[list[int]]) -> list[list[int]]` gộp các khoảng đóng giao nhau, kể cả khi hai đầu mút bằng nhau. Ví dụ `[[1,3],[2,6],[8,10]] -> [[1,6],[8,10]]`. Input có thể rỗng.',
`def merge_intervals(intervals: list[list[int]]) -> list[list[int]]:
    merged = []
    for start, end in sorted(intervals):
        if not merged or start > merged[-1][1]:
            merged.append([start, end])
        else:
            merged[-1][1] = max(merged[-1][1], end)
    return merged`, 'Sort theo điểm bắt đầu, sau đó gộp greedily.', 'Hai khoảng chạm nhau tại một đầu mút cũng phải gộp: dùng > để tách.');
addCode('**Maximum subarray sum:** Viết `max_subarray(nums: list[int]) -> int` trả tổng lớn nhất của một đoạn con *không rỗng*. Ví dụ `[-2,1,-3,4,-1,2,1,-5,4] -> 6`. Đầu vào luôn có ít nhất một số; có thể toàn số âm.',
`def max_subarray(nums: list[int]) -> int:
    current = best = nums[0]
    for x in nums[1:]:
        current = max(x, current + x)
        best = max(best, current)
    return best`, 'Kadane: giữ tổng đoạn kết thúc tại vị trí hiện tại.', 'Khởi tạo bằng nums[0] để xử lý đúng trường hợp mọi giá trị đều âm.');
addCode('**Valid brackets:** Viết `valid_brackets(s: str) -> bool` kiểm tra chuỗi chỉ chứa `()[]{}` có ngoặc đúng cặp, đúng thứ tự. Ví dụ `"{[()]}" -> True`, `"([)]" -> False`, `"" -> True`.',
`def valid_brackets(s: str) -> bool:
    pairs = {')': '(', ']': '[', '}': '{'}
    stack = []
    for ch in s:
        if ch in '([{':
            stack.append(ch)
        elif not stack or stack.pop() != pairs[ch]:
            return False
    return not stack`, 'Ngăn xếp lưu các dấu mở và so với dấu đóng tương ứng.', 'Với mỗi dấu đóng, phải khớp dấu mở gần nhất; cuối cùng stack phải rỗng.');

const sqlCases = [
  ['Bảng `orders(id, customer_id, amount)`; truy vấn SQL nào tính **tổng amount theo customer_id**?', '`SELECT customer_id, SUM(amount) FROM orders GROUP BY customer_id`', ['`SELECT customer_id, SUM(amount) FROM orders`', '`SELECT customer_id, COUNT(amount) FROM orders ORDER BY customer_id`', '`SELECT SUM(customer_id), amount FROM orders GROUP BY amount`'], 'Cột không gộp trong SELECT phải có mặt trong GROUP BY (theo chuẩn SQL).'],
  ['`COUNT(*)` và `COUNT(column)` khác nhau thế nào?', '`COUNT(*)` đếm mọi dòng; `COUNT(column)` bỏ NULL của cột.', ['`COUNT(*)` chỉ đếm dòng không NULL; `COUNT(column)` đếm mọi dòng.', '`COUNT(*)` đếm giá trị DISTINCT; `COUNT(column)` đếm dòng trùng.', '`COUNT(column)` chỉ trả về 0 nếu trong cột có bất kỳ NULL nào.'], 'COUNT(expr) chỉ đếm biểu thức không NULL.'],
  ['Bảng `users` có 5 dòng, `events` có thể có nhiều dòng/user. `LEFT JOIN` từ users sang events bảo đảm điều gì?', 'Mọi user xuất hiện ít nhất một dòng trong kết quả.', ['Mỗi user luôn chỉ có đúng một dòng.', 'User không có event sẽ bị loại bỏ.', 'Số dòng kết quả luôn đúng bằng 5.'], 'LEFT JOIN giữ toàn bộ phía trái; nhiều match bên phải có thể nhân dòng.'],
  ['Muốn lọc nhóm `customer_id` có `SUM(amount) > 1000` sau `GROUP BY`, dùng mệnh đề nào?', '`HAVING SUM(amount) > 1000`', ['`WHERE SUM(amount) > 1000`', '`ORDER BY SUM(amount) > 1000`', '`JOIN SUM(amount) > 1000`'], 'HAVING lọc kết quả sau khi gom nhóm.'],
  ['Phép so sánh `WHERE city = NULL` trong SQL chuẩn có tác dụng gì?', 'Không khớp NULL; phải dùng `IS NULL`.', ['Trả tất cả dòng có city NULL.', 'Tự chuyển thành IS NOT NULL.', 'Ném lỗi cú pháp trong mọi hệ quản trị.'], 'NULL mang giá trị UNKNOWN; phép bằng không trả TRUE.'],
  ['`INNER JOIN` khác `LEFT JOIN` ở điểm nào?', 'INNER giữ các cặp khớp; LEFT giữ cả dòng trái không khớp.', ['INNER luôn có nhiều dòng hơn LEFT.', 'LEFT chỉ lấy dòng khớp.', 'INNER chỉ có thể JOIN bằng số nguyên.'], 'Dòng trái không match bị loại bởi INNER, còn LEFT điền NULL phía phải.'],
  ['Muốn lấy mỗi customer_id duy nhất, dùng cú pháp nào?', '`SELECT DISTINCT customer_id FROM orders`', ['`SELECT UNIQUE(*) customer_id FROM orders`', '`SELECT customer_id ONE FROM orders`', '`SELECT customer_id FROM orders ALL UNIQUE`'], 'DISTINCT loại các bản ghi trùng ở các cột được chọn.'],
  ['Để chọn 3 giao dịch có amount lớn nhất trong PostgreSQL, truy vấn nào đúng?', '`SELECT * FROM orders ORDER BY amount DESC LIMIT 3`', ['`SELECT * FROM orders ORDER BY amount ASC LIMIT 3`', '`SELECT * FROM orders LIMIT 3 ORDER BY amount DESC`', '`SELECT * FROM orders ORDER BY amount DESC LIMIT -3`'], 'Sắp giảm dần rồi lấy 3 dòng.'],
  ['`ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY created_at DESC)` thực hiện gì?', 'Đánh số 1, 2, ... trong từng khách hàng từ bản ghi mới nhất.', ['Đếm tổng khách hàng trong toàn bảng.', 'Xóa các bản ghi trùng customer_id.', 'Đánh số một lần cho toàn bộ bảng không theo nhóm.'], 'PARTITION BY khởi động lại số đếm ở mỗi nhóm.'],
  ['Dữ liệu `(amount) = (10, NULL, 20)`; `AVG(amount)` cho kết quả nào?', '15', ['10', '20', '30'], 'AVG bỏ giá trị NULL: (10 + 20) / 2 = 15.'],
  ['Trong xử lý ETL, bước Transform thường làm gì?', 'Làm sạch, chuẩn hóa và biến đổi dữ liệu trước khi nạp.', ['Thu thập dữ liệu thô từ nguồn trước khi xử lý.', 'Đẩy dữ liệu thô vào kho lưu trữ sau khi thu thập.', 'Sao lưu dữ liệu ra hệ thống dự phòng theo lịch.'], 'ETL là Extract, Transform, Load.'],
  ['Đặt unique constraint cho `transaction_id` nhằm bảo vệ chiều dữ liệu nào?', 'Uniqueness: không có mã giao dịch trùng.', ['Timeliness: dữ liệu luôn mới.', 'Accuracy: mọi giá trị đều đúng thực tế.', 'Completeness: mọi cột đều đủ dữ liệu.'], 'Unique constraint chống trùng giá trị khóa, nhưng không tự xác minh mọi thuộc tính.'],
  ['Một cột ngày giao dịch chứa `2026-20-60`; kiểm soát phù hợp nhất là gì?', 'Validity: ngày phải đúng định dạng và miền giá trị.', ['Uniqueness: chỉ có một ngày duy nhất.', 'Completeness: cột không được NULL.', 'Freshness: dữ liệu phải từ hôm qua.'], 'Ngày không hợp lệ về mặt cấu trúc/giới hạn.'],
  ['Nếu 1 khách hàng có 3 order và 2 ticket, JOIN cả hai bảng theo customer_id có thể tạo bao nhiêu dòng?', '6', ['2', '3', '5'], 'Quan hệ nhiều-nhiều qua customer tạo 3×2=6 dòng; cần gom nhóm trước khi JOIN nếu muốn tránh nhân số liệu.'],
  ['Truy vấn nào đếm số giao dịch theo ngày trong bảng `payments(pay_date, id)`?', '`SELECT pay_date, COUNT(*) FROM payments GROUP BY pay_date`', ['`SELECT pay_date, COUNT(*) FROM payments`', '`SELECT pay_date, SUM(pay_date) FROM payments`', '`SELECT COUNT(pay_date) FROM payments ORDER BY pay_date`'], 'GROUP BY là cần thiết để đếm riêng cho từng ngày.'],
  ['Trong SQL chuẩn, `NULL = NULL` cho kết quả logic nào?', 'UNKNOWN', ['TRUE', 'FALSE', 'ZERO'], 'Hai NULL không thể so sánh bằng thông thường trong logic ba giá trị.'],
  ['Điểm mạnh chính của index B-tree trên cột được lọc là gì?', 'Tăng tốc tìm kiếm/lọc có thể dùng chỉ mục.', ['Loại bỏ mọi giá trị NULL.', 'Luôn giảm dung lượng lưu trữ.', 'Tự động chuẩn hóa dữ liệu đầu vào.'], 'Index hỗ trợ truy vấn, nhưng có chi phí ghi/duy trì và không bảo đảm tối ưu mọi trường hợp.'],
  ['Khi cập nhật giao dịch chuyển tiền gồm ghi nợ và ghi có, ACID Atomicity nghĩa là gì?', 'Cả hai thao tác cùng thành công hoặc cùng rollback.', ['Hai thao tác luôn chạy song song.', 'Mọi truy vấn sẽ đọc dữ liệu cũ.', 'Không cần khóa hoặc isolation.'], 'Atomicity bảo đảm giao dịch là một đơn vị không thể chia nhỏ.'],
  ['Làm thế nào tìm customer không có đơn hàng trong SQL?', '`LEFT JOIN orders ... WHERE orders.id IS NULL`', ['`INNER JOIN orders ... WHERE orders.id IS NULL`', '`CROSS JOIN orders` và không lọc', '`JOIN orders` rồi `WHERE orders.id > 0`'], 'Anti-join qua LEFT JOIN kết hợp điều kiện cột phải IS NULL.'],
  ['Muốn giữ một dòng mới nhất cho mỗi customer, kỹ thuật SQL rõ ràng là gì?', '`ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY created_at DESC)` rồi lọc rn=1.', ['`ROW_NUMBER() OVER (ORDER BY created_at DESC)` rồi lọc rn=1 cho toàn bảng.', '`RANK() OVER (PARTITION BY customer_id ORDER BY created_at ASC)` rồi lọc rn=1.', '`COUNT(*) OVER (PARTITION BY customer_id)` rồi lọc các dòng có kết quả bằng 1.'], 'Window function xác định dòng mới nhất theo thứ tự trong từng nhóm; thêm tie-breaker nếu đồng thời điểm.'],
  ['Trong pipeline xử lý sự kiện, idempotent nghĩa là gì?', 'Xử lý lặp cùng đầu vào vẫn cho cùng trạng thái mong đợi.', ['Mỗi lần chạy tạo bản ghi mới bắt buộc.', 'Mọi bước đều chạy trong một luồng.', 'Dữ liệu không bao giờ bị cập nhật.'], 'Idempotency giúp retry không tạo tác dụng phụ trùng lặp.'],
  ['Một hệ thống nhận events trễ vài phút. Để thống kê theo thời điểm xảy ra sự kiện, nên xét khái niệm nào?', 'Event time và watermark.', ['Chỉ thời điểm máy chủ bắt đầu chạy.', 'Chỉ tên topic Kafka.', 'Chỉ số lượng partitions của cluster.'], 'Watermark hỗ trợ tính toán theo event time khi dữ liệu đến không đúng thứ tự.'],
  ['Muốn biết tỷ lệ khách hàng có giá trị NULL tại cột age, phép tính phù hợp là gì?', '`SUM(CASE WHEN age IS NULL THEN 1 ELSE 0 END) / COUNT(*)` (ép kiểu thực).', ['`SUM(CASE WHEN age IS NOT NULL THEN 1 ELSE 0 END) / COUNT(*)` (ép kiểu thực).', '`SUM(CASE WHEN age IS NULL THEN 0 ELSE 1 END) / COUNT(age)` (ép kiểu thực).', '`SUM(CASE WHEN age = NULL THEN 1 ELSE 0 END) / COUNT(*)` (ép kiểu thực).'], 'Đếm dòng bị thiếu chia tổng số dòng; ép kiểu để tránh chia nguyên.'],
  ['Đối với bảng transactions 100 triệu dòng, chọn `SELECT *` khi chỉ cần hai cột có nhược điểm chính gì?', 'Đọc/chuyển nhiều dữ liệu hơn mức cần thiết.', ['Luôn khiến SQL sai cú pháp.', 'Tự động xóa index.', 'Buộc dữ liệu trả về không có NULL.'], 'Chỉ chọn cột cần dùng để giảm I/O và truyền dữ liệu.']
];
for (const [prompt, correct, wrong, why] of sqlCases) add('sql', prompt, correct, wrong, why);

const mlCases = [
  ['Mô hình dự đoán 40 giao dịch gian lận, trong đó 30 đúng; thực tế có 50 gian lận. Precision là bao nhiêu?', '75%', ['60%', '80%', '40%'], 'Precision = TP/(TP+FP) = 30/40 = 75%.'],
  ['Mô hình dự đoán 40 giao dịch gian lận, trong đó 30 đúng; thực tế có 50 gian lận. Recall là bao nhiêu?', '60%', ['75%', '80%', '50%'], 'Recall = TP/(TP+FN) = 30/50 = 60%.'],
  ['Với Precision = 0.75 và Recall = 0.60, F1-score xấp xỉ bằng bao nhiêu?', '0.667', ['0.675', '0.750', '0.600'], 'F1 = 2PR/(P+R) = 2×0.75×0.60/1.35 ≈ 0.667.'],
  ['Bộ dữ liệu có 99% giao dịch bình thường. Mô hình luôn dự đoán bình thường đạt accuracy 99%. Vấn đề là gì?', 'Accuracy che khuất khả năng phát hiện lớp gian lận.', ['Recall lớp gian lận chắc chắn 99%.', 'Mô hình đã phát hiện đủ gian lận.', 'AUC luôn bằng 0.99.'], 'Accuracy cao vẫn có thể đi kèm recall gian lận bằng 0.'],
  ['Dùng thông tin xảy ra **sau** thời điểm dự đoán làm feature huấn luyện là lỗi gì?', 'Data leakage.', ['Regularization.', 'Early stopping.', 'Feature hashing.'], 'Dữ liệu tương lai không có lúc suy luận tạo kết quả kiểm thử quá lạc quan.'],
  ['Với chuỗi giao dịch theo thời gian, nên chia train/test thế nào để mô phỏng triển khai?', 'Train trên giai đoạn trước, test trên giai đoạn sau.', ['Shuffle mọi thời điểm bắt buộc.', 'Train và test cùng bản ghi.', 'Chỉ dùng data của ngày mới nhất để train và test.'], 'Temporal split giảm rủi ro nhìn trước tương lai.'],
  ['Chuẩn hóa feature bằng mean/std từ toàn bộ data trước khi split train/test gây nguy cơ gì?', 'Leakage: thống kê tập test đi vào train.', ['Luôn tăng kích thước tập train.', 'Bảo đảm overfitting biến mất.', 'Không ảnh hưởng tới đánh giá trong mọi trường hợp.'], 'Fit scaler trên train, áp dụng transform cho validation/test.'],
  ['Chỉ số ROC-AUC đo điều gì?', 'Khả năng xếp hạng dương cao hơn âm khi thay đổi ngưỡng.', ['Tỷ lệ đúng tại một ngưỡng cố định duy nhất.', 'Số giao dịch gian lận tuyệt đối.', 'Chi phí vận hành mô hình theo ngày.'], 'ROC-AUC tổng hợp TPR và FPR trên các ngưỡng.'],
  ['Khi lớp dương rất hiếm, metric thường hữu ích để xem trade-off precision/recall là gì?', 'PR-AUC.', ['Chỉ accuracy.', 'Chỉ MAE.', 'Chỉ R².'], 'PR-AUC tập trung hiệu năng trên lớp dương.'],
  ['Phân biệt classification và regression?', 'Classification dự đoán nhãn; regression dự đoán giá trị liên tục.', ['Classification dự đoán số thực; regression dự đoán nhãn rời rạc.', 'Classification chỉ học có giám sát; regression chỉ học không giám sát.', 'Classification luôn dùng CNN; regression luôn dùng cây quyết định.'], 'Chọn theo kiểu biến mục tiêu cần dự đoán.'],
  ['Confusion matrix của bài phân loại có 5 lớp (single-label, multi-class) kích thước bao nhiêu?', '5 × 5.', ['2 × 2.', '5 × 2.', '10 × 10.'], 'Mỗi hàng nhãn thật và mỗi cột nhãn dự đoán, tổng 5×5 ô.'],
  ['Một mô hình học rất tốt trên train nhưng kém trên test. Hiện tượng phù hợp nhất là gì?', 'Overfitting.', ['Underflow.', 'Normalization.', 'Data sharding.'], 'Khả năng khái quát kém dù lỗi train thấp.'],
  ['Regularization L2 thường tác động thế nào?', 'Phạt bình phương trọng số lớn trong hàm mục tiêu.', ['Loại bỏ toàn bộ feature.', 'Đảm bảo accuracy test bằng 100%.', 'Tự động tạo dữ liệu mới.'], 'L2 thêm λ||w||², khuyến khích trọng số nhỏ hơn.'],
  ['Đối với missing values, bước nào tránh leakage đúng cách?', 'Fit imputer trên train, dùng để transform validation/test.', ['Fit imputer trên toàn bộ tập trước khi chia.', 'Xóa test để không còn missing values.', 'Điền bằng target từ tương lai.'], 'Thống kê điền khuyết phải học trên train.'],
  ['K-fold cross-validation thường làm gì?', 'Lần lượt dùng một fold làm validation, phần còn lại làm train.', ['Dùng cùng mọi hàng cho train và test mỗi lần.', 'Chỉ lặp huấn luyện trên tập test.', 'Luôn tạo k mô hình dự đoán đồng thời khi deploy.'], 'Điểm trung bình qua fold giúp ước lượng độ ổn định.'],
  ['Một lớp có 200 mẫu, lớp còn lại 800 mẫu. Tỷ lệ lớp thiểu số bằng bao nhiêu?', '20%', ['25%', '40%', '80%'], '200/(200+800) = 20%.'],
  ['Phân phối train có tuổi trung bình 28 nhưng production là 47, thuật ngữ nào liên quan?', 'Covariate shift.', ['Label encoding.', 'Dropout.', 'Cross entropy.'], 'Phân phối feature thay đổi; cần kiểm tra thêm quan hệ với target.'],
  ['Trong A/B test, ngẫu nhiên phân nhóm giúp làm gì?', 'Giảm sai lệch do yếu tố gây nhiễu giữa hai nhóm.', ['Bảo đảm p-value luôn nhỏ hơn 0.05.', 'Làm mọi biến của hai nhóm bằng nhau tuyệt đối.', 'Loại hoàn toàn lỗi đo lường.'], 'Randomization giúp cân bằng kỳ vọng của các yếu tố chưa quan sát.'],
  ['p-value = 0.03 dưới giả thuyết H0 được hiểu đúng là gì?', 'Nếu H0 đúng, xác suất thấy dữ liệu cực đoan ít nhất như quan sát khoảng 3%.', ['Xác suất H0 là đúng sau khi quan sát tất cả dữ liệu hiện có bằng khoảng 3%.', 'Nếu H0 sai, xác suất có hiệu quả thực sự trong quần thể là khoảng 97%.', 'Nếu thực hiện lại kiểm định, kết quả chắc chắn tương tự với xác suất 97%.'], 'p-value được tính dưới H0, không phải xác suất H0 đúng.'],
  ['Có 100 khách hàng, 30 người chuyển đổi. Conversion rate là bao nhiêu?', '30%', ['70%', '3%', '300%'], '30/100 × 100 = 30%.'],
  ['Khi huấn luyện mô hình với target có dữ liệu nhãn sai, vấn đề chính là gì?', 'Label noise làm sai tín hiệu học và đánh giá.', ['Chắc chắn làm data sạch hơn.', 'Chỉ đổi kích thước batch.', 'Không thể ảnh hưởng mô hình.'], 'Nhãn sai tạo nhiễu cho mục tiêu học.'],
  ['Metric MAE trong regression là gì?', 'Trung bình trị tuyệt đối của sai số dự đoán.', ['Trung bình bình phương sai số.', 'Tỷ lệ dự đoán đúng nhãn.', 'Số mẫu vượt ngưỡng xác suất.'], 'MAE = mean(|y − ŷ|).'],
  ['RMSE so với MAE thường nhạy hơn với điều gì?', 'Sai số rất lớn (outliers).', ['Số lượng lớp nhãn.', 'Mức cân bằng precision và recall.', 'Số lượt truy vấn database.'], 'Bình phương sai số khiến lỗi lớn bị phạt mạnh hơn.'],
  ['Trong phân loại nhị phân, sigmoid chuyển logit thành gì?', 'Giá trị trong (0,1) có thể diễn giải là xác suất sau huấn luyện phù hợp.', ['Giá trị trong (−1,1) dùng làm trọng số hồi quy được chuẩn hóa.', 'Nhãn nguyên 0 hoặc 1 không cần bước xác định ngưỡng quyết định.', 'Vector điểm số cho mọi lớp được chuẩn hóa tổng luôn bằng 1.'], 'Sigmoid(z) = 1/(1+exp(-z)).'],
  ['Cross-entropy loss đối với lớp thật có xác suất dự đoán càng cao sẽ thế nào?', 'Giảm xuống.', ['Luôn tăng lên.', 'Giữ nguyên bằng 1.', 'Bằng âm vô cực.'], 'Với y đúng, loss = −log(p_y); p_y tăng thì loss giảm.'],
  ['Trên test set, đổi ngưỡng từ 0.5 xuống 0.2 trong phân loại gian lận thường gây xu hướng gì?', 'Recall tăng hoặc giữ nguyên; false positive có thể tăng.', ['Recall giảm hoặc giữ nguyên; false positive có thể giảm.', 'Recall tăng và precision luôn tăng trong mọi dataset.', 'Recall giữ nguyên; số giao dịch được dự đoán dương luôn giảm.'], 'Ngưỡng thấp đánh dấu thêm mẫu dương; hiệu ứng precision phụ thuộc phân bố dữ liệu.'],
  ['Mô hình có true positive = 18 và false negative = 2. Tính recall.', '90%', ['80%', '20%', '10%'], 'Recall = 18/(18+2) = 90%.'],
  ['Phát hiện drift sau triển khai cần ưu tiên quan sát gì?', 'Phân phối feature, quality dữ liệu và metric gắn nhãn khi sẵn có.', ['Chỉ theo dõi thời gian khởi động và số lượng container.', 'Chỉ theo dõi số version trong repository và số commit.', 'Chỉ theo dõi dung lượng model artifact và RAM của server.'], 'Giám sát đầu vào và hiệu năng thực tế để phát hiện thay đổi.']
];
for (const [prompt, correct, wrong, why] of mlCases) add('ml', prompt, correct, wrong, why);

// Stable and balanced mock exams: 40 fresh MCQs each, no duplicates between mocks.
const mcqs = type => questions.filter(q => q.setId === `tfg-${type}` && q.type === 'mcq');
const mixes = [{ num: 5, ded: 5, ind: 5, py: 7, alg: 5, sql: 6, ml: 7 }, { num: 5, ded: 5, ind: 5, py: 7, alg: 5, sql: 6, ml: 7 }];
const mocks = mixes.map((counts, mockIndex) => {
  const selected = [];
  for (const [type, count] of Object.entries(counts)) {
    const pool = mcqs(type);
    const start = mockIndex * count;
    assert(start + count <= pool.length, `not enough questions for ${type} mock ${mockIndex + 1}`);
    selected.push(...pool.slice(start, start + count));
  }
  assert.equal(selected.length, 40);
  // Interleave categories, keeping reproducible ordering without clustering questions.
  const sorted = selected.sort((a, b) => {
    const ha = [...a.id].reduce((v, x) => (v * 33 + x.charCodeAt(0)) >>> 0, 0);
    const hb = [...b.id].reduce((v, x) => (v * 33 + x.charCodeAt(0)) >>> 0, 0);
    return ha - hb;
  });
  return { id: `tfg-mock-${String(mockIndex + 1).padStart(2,'0')}`, bank: 'tfg27', code: `TFG-MOCK-0${mockIndex+1}`,
    title: `TFG27 Simulation ${mockIndex + 1}`, group: 'TFG27 Mixed', domain: 'general', kind: 'full', count: 40, minutes: 60,
    questionIds: sorted.map(q => q.id), description: 'Original timed aptitude + Data & AI simulation; not an official Techcombank or SHL paper.' };
});
const sets = Object.entries(groups).map(([type, g]) => ({ id: `tfg-${type}`, bank: 'tfg27', code: g.code,
  title: g.title, group: g.group, domain: g.domain, kind: 'topic', count: questions.filter(q => q.setId === `tfg-${type}`).length,
  description: g.description }));
assert(sets.every(s => s.count > 0));
assert.equal(new Set(questions.map(q => q.id)).size, questions.length);
assert.equal(new Set(mocks.flatMap(s => s.questionIds)).size, 80);
for (const q of questions.filter(q => q.type === 'mcq')) {
  assert.equal(q.options.length, 4);
  assert(q.options.some(o => o.key === q.answer));
}
const output = path.resolve(__dirname, '../data/tfg27-questions.json');
fs.writeFileSync(output, JSON.stringify({ version: 1, questions, sets: [...mocks, ...sets] }, null, 2) + '\n', 'utf8');
console.log(`Wrote ${questions.length} new TFG27 questions, ${sets.length} topical sets, ${mocks.length} timed mocks to ${output}`);
console.log(Object.fromEntries(sets.map(s => [s.id, s.count])));
