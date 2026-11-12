// Build reproducible mixed-source exams from existing question IDs.
// The source question bank and original test sets are never modified.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = path.resolve(__dirname, '..');
const bank = JSON.parse(fs.readFileSync(path.join(root, 'data', 'bank.json'), 'utf8'));
const originalSets = new Map(bank.sets.map(set => [set.id, set]));
const categories = ['math', 'code', 'ai', 'safety'];
const quotas = {
  ai20k: { math: 5, code: 5, ai: 7, safety: 3 },
  vin20k: { math: 3, code: 3, ai: 12, safety: 2 },
  hirin: { math: 6, code: 6, ai: 5, safety: 3 }
};

function category(q) {
  if (q.bank === 'ai20k') {
    if (originalSets.get(q.setId)?.kind !== 'topic') return null;
    return ({ 'Toán học': 'math', 'Lập trình & Dữ liệu': 'code',
      'AI & MLOps': 'ai', 'Logic & Đạo đức': 'safety' })[q.group] || null;
  }
  if (q.bank === 'vin20k') {
    if (q.setId === 'vin-quantitative') return 'math';
    if (['vin-day-07', 'vin-day-10'].includes(q.setId)) return 'code';
    if (['vin-day-11', 'vin-specialized-02'].includes(q.setId)) return 'safety';
    return 'ai';
  }
  if (q.bank === 'hirin') {
    return ({ 'Toán học & Thống kê': 'math', 'Lập trình & Công cụ': 'code',
      'Machine Learning': 'ai', 'Logic & Đạo đức': 'safety' })[q.group] || null;
  }
  return null;
}

const pools = Object.fromEntries(Object.keys(quotas).map(source =>
  [source, Object.fromEntries(categories.map(cat => [cat, []]))]));
for (const q of bank.questions) {
  const cat = category(q);
  if (cat && q.type === 'mcq' && q.options.length === 4 &&
      q.options.some(option => option.key === q.answer) && q.prompt.trim()) {
    pools[q.bank][cat].push(q);
  }
}

// Fixed sorting keeps published exam membership stable across subsequent builds.
function rank(seed, id) {
  return crypto.createHash('sha256').update(`ai20k-integrated-v1:${seed}:${id}`).digest('hex');
}
// Several imported questions repeat an identical scenario with a numbered label.
function promptIdentity(prompt) {
  return prompt.replace(/\s*\((?:Tình huống[^()]*|Bài toán[^()]*|Xử lý sự cố production)\s+\d+\)\s*$/iu, '')
    .replace(/\s+/g, ' ').trim().toLowerCase();
}
const outPath = path.join(root, 'data', 'mocks.json');
const prior = fs.existsSync(outPath) ? JSON.parse(fs.readFileSync(outPath, 'utf8')) : { sets: [] };
const priorSets = new Map(prior.sets.map(set => [set.id, set]));
const questionById = new Map(bank.questions.map(q => [q.id, q]));
const used = new Set();
const usedPrompts = new Set();
const sets = [];
for (let index = 1; index <= 6; index++) {
  const questionIds = [];
  const setId = `mixed-mock-${String(index).padStart(2, '0')}`;
  for (const source of Object.keys(quotas)) {
    for (const cat of categories) {
      const take = quotas[source][cat];
      const preferred = (priorSets.get(setId)?.questionIds || [])
        .map(id => questionById.get(id))
        .filter(q => q?.bank === source && category(q) === cat);
      const matches = [];
      const newPrompts = new Set();
      for (const q of preferred.concat(pools[source][cat]
        .sort((a, b) => rank(index, a.id).localeCompare(rank(index, b.id))))) {
        const identity = promptIdentity(q.prompt);
        if (used.has(q.id) || usedPrompts.has(identity) || newPrompts.has(identity)) continue;
        matches.push(q);
        newPrompts.add(identity);
        if (matches.length === take) break;
      }
      if (matches.length !== take) throw new Error(`Not enough unique ${source}/${cat} questions for exam ${index}`);
      for (const q of matches) {
        used.add(q.id);
        usedPrompts.add(promptIdentity(q.prompt));
        questionIds.push(q.id);
      }
    }
  }
  if (questionIds.length !== 60) throw new Error(`Invalid exam size ${index}`);
  questionIds.sort((a, b) => rank(`order-${index}`, a).localeCompare(rank(`order-${index}`, b)));
  sets.push({
    id: `mixed-mock-${String(index).padStart(2, '0')}`,
    bank: 'mixed', kind: 'full', code: `MIX-${String(index).padStart(2, '0')}`,
    title: `Integrated Mock Exam ${String(index).padStart(2, '0')}`,
    group: 'Comprehensive Exams', count: 60, minutes: 90,
    description: '20 questions per source · 14 Math · 14 Programming & Data · 24 AI & Systems · 8 Ethics & Safety. All multiple-choice.',
    questionIds
  });
}
if (used.size !== 360 || sets.some(s => new Set(s.questionIds).size !== 60)) {
  throw new Error('Mock exams must contain 360 different questions');
}
const content = JSON.stringify({ version: 1, sets }, null, 2) + '\n';
const differences = sets.map(set => {
  const old = new Set(priorSets.get(set.id)?.questionIds || []);
  return { id: set.id, removed: [...old].filter(id => !set.questionIds.includes(id)),
    added: set.questionIds.filter(id => !old.has(id)) };
});
if (!process.argv.includes('--dry-run') && (!fs.existsSync(outPath) || fs.readFileSync(outPath, 'utf8') !== content)) {
  fs.writeFileSync(outPath, content);
}
console.log(`${process.argv.includes('--dry-run') ? 'Preflight' : 'Prepared'} ${sets.length} mixed exams, ${used.size} unique IDs and scenario prompts.`);
for (const item of differences) {
  if (item.added.length) console.log(`${item.id}: replace ${item.removed.join(', ')} with ${item.added.join(', ')}`);
}
