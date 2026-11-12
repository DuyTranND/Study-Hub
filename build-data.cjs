const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = __dirname;
const source = path.join(root, 'sources');
const aiPath = path.join(source, 'ai20k-exam-prep', 'index.html');
const vinPath = path.join(source, 'vin20k-ai-phase1-quiz', 'assets', 'aistudio', 'Master_Quiz_2000_Questions_v6.json');
const hirinPath = path.join(source, 'ai-quiz', 'data', 'quiz');
if (!fs.existsSync(aiPath) || !fs.existsSync(vinPath) || !fs.existsSync(hirinPath)) {
  console.error('Missing source sites under sources/. Copy all three source websites first.');
  process.exit(1);
}

const html = fs.readFileSync(aiPath, 'utf8');
const start = html.indexOf('const EXAMS=');
const end = html.indexOf(';\nconst GROUPS=', start);
if (start < 0 || end < 0) throw new Error('Cannot locate the AI20K exam data');
const exams = JSON.parse(html.slice(start + 'const EXAMS='.length, end).trim());
const vin = JSON.parse(fs.readFileSync(vinPath, 'utf8'));
const aiGroups = { toan: 'Toán học', code: 'Lập trình & Dữ liệu', ai: 'AI & MLOps', logic: 'Logic & Đạo đức' };

const sets = [];
const questions = [];
for (const exam of exams) {
  const setId = 'ai-' + exam.id;
  sets.push({ id: setId, bank: 'ai20k', title: exam.title, code: exam.code, group: exam.kind === 'topic' ? aiGroups[exam.group] || 'Chuyên đề' : 'Đề tổng hợp', count: exam.questions.length, minutes: exam.duration_minutes || (exam.kind === 'topic' ? 45 : 90), kind: exam.kind });
  for (const q of exam.questions) {
    questions.push({ id: 'a:' + q.id, bank: 'ai20k', setId, setTitle: exam.title,
      group: exam.kind === 'topic' ? (aiGroups[exam.group] || 'Chuyên đề') : ({ A: 'Toán học', B: 'Lập trình & Dữ liệu', C: 'AI & MLOps', D: 'Logic & Đạo đức' }[q.module] || 'Tổng hợp'),
      topic: (q.tags || []).join(' · ') || (q.module ? 'Module ' + q.module : exam.title),
      type: q.type, prompt: q.prompt || '', options: (q.options || []).map(o => ({ key: o.key, text: o.text })),
      answer: q.answer || null, value: q.value ?? null, accept: q.accept || [], tol: q.tol ?? 0,
      explanation: q.explanation || '', detail: q.long || '', hint: '', ref: q.ref || '',
      points: q.points || 0 });
  }
}

const dayGroups = new Map();
for (const q of vin) {
  const setId = 'vin-' + q.day.replace(/[^\w]+/g, '-').toLowerCase();
  if (!dayGroups.has(setId)) dayGroups.set(setId, { id: setId, bank: 'vin20k', title: q.day_title || q.day, code: q.day, group: /^Day/.test(q.day) ? '15 ngày nền tảng' : 'Chuyên sâu', count: 0, minutes: 0, kind: 'day' });
  dayGroups.get(setId).count++;
  questions.push({ id: 'v:' + q.id, bank: 'vin20k', setId, setTitle: q.day_title || q.day,
    group: /^Day/.test(q.day) ? '15 ngày nền tảng' : 'Chuyên sâu', topic: q.topic || '',
    type: 'mcq', prompt: q.question || '', options: (q.options || []).map((value, i) => ({ key: 'ABCD'[i] || String(i + 1), text: value.replace(/^[A-Z][.)]\s*/, '') })),
    answer: q.answer, value: null, accept: [], tol: 0, explanation: q.explanation || '',
    detail: ['A', 'B', 'C', 'D'].map(letter => q[letter + ' explanation']).filter(Boolean).join('\n\n'),
    hint: q.hint || '', ref: '', points: 1 });
}
sets.push(...dayGroups.values());

const hirinFiles = fs.readdirSync(hirinPath).filter(name => name.endsWith('.json') && !name.endsWith('.metadata.json')).sort();
const hirinQuestions = hirinFiles.flatMap(name => JSON.parse(fs.readFileSync(path.join(hirinPath, name), 'utf8')));
const hirinModules = { A: 'Toán học & Thống kê', B: 'Lập trình & Công cụ', C: 'Machine Learning', D: 'Logic & Đạo đức' };
const hirinSets = new Map();
for (const q of hirinQuestions) {
  if (!q.id || !q.section || !q.question || !Array.isArray(q.options) || q.options[q.correct] === undefined) {
    throw new Error(`Invalid Hirin AI Quiz question: ${q.id || 'missing ID'}`);
  }
  const id = 'hirin-' + crypto.createHash('sha1').update(q.section).digest('hex').slice(0, 12);
  const code = q.section.split(':')[0].trim();
  const group = hirinModules[q.section[0]] || 'Chuyên đề';
  if (!hirinSets.has(id)) hirinSets.set(id, { id, bank: 'hirin', title: q.section, code, group, count: 0, minutes: 0, kind: 'topic' });
  hirinSets.get(id).count++;
  questions.push({ id: 'h:' + q.id, bank: 'hirin', setId: id, setTitle: q.section,
    group, topic: q.section, type: 'mcq', prompt: q.question,
    options: q.options.map((value, i) => ({ key: 'ABCD'[i] || String(i + 1), text: value })),
    answer: 'ABCD'[q.correct], value: null, accept: [], tol: 0,
    explanation: q.explanation || '', detail: '', hint: '', ref: '', points: 1 });
}
sets.push(...hirinSets.values());
if (hirinFiles.length !== 37 || hirinQuestions.length !== 581 || new Set(questions.map(q => q.id)).size !== questions.length) {
  throw new Error('Source question count or IDs changed; review before regenerating bank.json');
}

const counts = { ai20k: 720, vin20k: 2000, hirin: hirinQuestions.length };
// Approved editorial corrections are stored separately so a source rebuild does
// not erase them. Original source clones are kept unchanged.
const editsPath = path.join(root, 'data', 'option-edits.json');
if (fs.existsSync(editsPath)) {
  const editorial = JSON.parse(fs.readFileSync(editsPath, 'utf8'));
  if (editorial.version !== 1 || !editorial.items || typeof editorial.items !== 'object') {
    throw new Error('Invalid editorial option-edits.json format');
  }
  const byId = new Map(questions.map(q => [q.id, q]));
  for (const [id, replacements] of Object.entries(editorial.items)) {
    const q = byId.get(id);
    if (!q || q.type !== 'mcq') throw new Error(`Invalid editorial question ID: ${id}`);
    for (const [key, text] of Object.entries(replacements)) {
      if (key === q.answer) throw new Error(`Editorial data must never edit correct answer ${id}/${key}`);
      const option = q.options.find(o => o.key === key);
      if (!option || typeof text !== 'string' || !text.trim()) throw new Error(`Invalid editorial option ${id}/${key}`);
      option.text = text;
    }
  }
  console.log(`Applied editorial distractor revisions to ${Object.keys(editorial.items).length} questions.`);
}
const result = { generated: new Date().toISOString(), counts, sets, questions };
const { applyCorrections } = require('./tools/answer-corrections.cjs');
const reviewed = applyCorrections(result.questions);
console.log(`Applied ${reviewed} reviewed answer/option corrections.`);
fs.mkdirSync(path.join(root, 'data'), { recursive: true });
fs.writeFileSync(path.join(root, 'data', 'bank.json'), JSON.stringify(result));
console.log(`Generated ${questions.length} questions across ${sets.length} sets (${counts.ai20k} AI20K + ${counts.vin20k} Vin20K + ${counts.hirin} Hirin).`);
