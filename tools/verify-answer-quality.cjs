// Read-only validation of the bank and published exam membership.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { applyCorrections } = require('./answer-corrections.cjs');
const root = path.resolve(__dirname, '..');
const bank = JSON.parse(fs.readFileSync(path.join(root, 'data/bank.json'), 'utf8'));
const mocks = JSON.parse(fs.readFileSync(path.join(root, 'data/mocks.json'), 'utf8'));
const byId = new Map(bank.questions.map(q => [q.id, q]));

function normalized(s) { return String(s).replace(/\s+/g, ' ').trim().toLowerCase(); }
function identity(s) {
  return normalized(s.replace(/\s*\((?:Tình huống[^()]*|Bài toán[^()]*|Xử lý sự cố production)\s+\d+\)\s*$/iu, ''));
}

assert.equal(bank.questions.length, 3301);
assert.equal(bank.sets.length, 83);
assert.equal(new Set(byId.keys()).size, 3301);
assert.deepEqual(Object.fromEntries(['ai20k','vin20k','hirin'].map(k =>
  [k, bank.questions.filter(q => q.bank === k).length])), { ai20k: 720, vin20k: 2000, hirin: 581 });

let mcqCount = 0;
const lengthOutliers = [];
const optionIssues = [];
for (const q of bank.questions) {
  if (q.type !== 'mcq') continue;
  mcqCount++;
  const optionKeys = q.options.map(o => o.key);
  if (optionKeys.join('') !== 'ABCD' || !optionKeys.includes(q.answer)) {
    optionIssues.push(`${q.id}: invalid keys or correct key`);
    continue;
  }
  const values = q.options.map(o => normalized(o.text));
  if (values.some(value => !value) || new Set(values).size !== 4) optionIssues.push(`${q.id}: empty or duplicated text`);
  const lens = q.options.map(o => [...o.text.trim()].length);
  const ratio = Math.max(...lens) / Math.max(1, Math.min(...lens));
  if (ratio > 4 && Math.max(...lens) - Math.min(...lens) > 48) {
    lengthOutliers.push({ id: q.id, ratio: Number(ratio.toFixed(1)), lengths: lens });
  }
}
assert.equal(optionIssues.length, 0, optionIssues.slice(0, 20).join('\n'));

const copy = JSON.parse(JSON.stringify(bank.questions));
const reviewCount = applyCorrections(copy);
assert.equal(reviewCount, 229);
const metadataChanged = [];
const answerChanged = [];
const correctedOptionIssues = [];
const correctedOutliers = [];
let applied = 0;
for (let i = 0; i < copy.length; i++) {
  const original = bank.questions[i], fixed = copy[i];
  for (const key of ['id','bank','setId','type','answer','value','tol','points']) {
    if (original[key] !== fixed[key]) metadataChanged.push(`${original.id}: ${key}`);
  }
  if (original.type !== 'mcq') continue;
  const originalCorrect = original.options.find(o => o.key === original.answer);
  const revisedCorrect = fixed.options.find(o => o.key === fixed.answer);
  if (originalCorrect.text !== revisedCorrect.text) answerChanged.push(original.id);
  if (fixed.options.length !== 4 || new Set(fixed.options.map(o => normalized(o.text))).size !== 4 ||
      fixed.options.some(o => !o.text.trim())) correctedOptionIssues.push(fixed.id);
  const lengths = fixed.options.map(o => [...o.text.trim()].length);
  const ratio = Math.max(...lengths) / Math.max(1, Math.min(...lengths));
  if (ratio > 4 && Math.max(...lengths) - Math.min(...lengths) > 48) {
    correctedOutliers.push({ id: fixed.id, ratio: Number(ratio.toFixed(1)), lengths });
  }
  if (JSON.stringify(original) !== JSON.stringify(fixed)) applied++;
}
assert.equal(metadataChanged.length, 0, metadataChanged.join('\n'));
assert.equal(correctedOptionIssues.length, 0, correctedOptionIssues.join('\n'));

assert.equal(mocks.sets.length, 6);
const usedIds = new Set(), usedPrompts = new Set(), duplicates = [];
for (const set of mocks.sets) {
  assert.equal(set.questionIds.length, 60, `${set.id}: size`);
  const srcCounts = { ai20k: 0, vin20k: 0, hirin: 0 };
  for (const id of set.questionIds) {
    const q = byId.get(id);
    assert(q && q.type === 'mcq', `${set.id}: missing or non-mcq ${id}`);
    if (usedIds.has(id)) duplicates.push(`${id}: duplicate ID`);
    usedIds.add(id);
    const samePrompt = identity(q.prompt);
    if (usedPrompts.has(samePrompt)) duplicates.push(`${id}: repeated scenario`);
    usedPrompts.add(samePrompt);
    srcCounts[q.bank]++;
  }
  assert.deepEqual(srcCounts, { ai20k: 20, vin20k: 20, hirin: 20 }, `${set.id}: source balance`);
}
assert.equal(usedIds.size, 360);
console.log(`Bank: ${bank.questions.length} questions, ${bank.sets.length} original sets, ${mcqCount} MCQs, zero invalid options.`);
console.log(`Correction overlay: ${reviewCount} reviewed IDs, ${applied} data-changing corrections, ${answerChanged.length} corrected answer texts; unchanged answer letters, IDs and set IDs.`);
console.log(`Existing mocks: ${mocks.sets.length} x 60, ${duplicates.length} repeated ID/prompt findings.`);
if (duplicates.length) console.log('Repeats: ' + duplicates.join('; '));
console.log(`Existing bank option-length outliers (>4x and >48 characters): ${lengthOutliers.length}.`);
if (lengthOutliers.length) console.log('Examples: ' + JSON.stringify(lengthOutliers.slice(0, 18)));
console.log(`After revisions, option-length outliers (>4x and >48 characters): ${correctedOutliers.length}.`);
if (correctedOutliers.length) console.log('After examples: ' + JSON.stringify(correctedOutliers.slice(0, 22)));
if (process.argv.includes('--suspicious')) {
  const strange = /lò vi sóng|tivi thông minh|nước giải khát|vàng thỏi|giày thể thao|bay lơ lửng|mắng mỏ|người ngoài hành tinh|nồi cơm|gà rán|trò chơi điện tử|thời trang|truyền hình|cà phê|tủ lạnh|sóng biển|chiếc xe đạp|màn hình nền|tiền ảo bitcoin|mỳ ăn liền|tiểu thuyết|máy giặt|trái đất|chú mèo|bóng đá|facebook|tiktok|món ăn|bữa sáng|máy sấy|quần áo|bàn chải/i;
  const found = copy.filter(q => q.type === 'mcq' && q.options.some(o => strange.test(o.text)));
  console.log(`Suspicious-theme options after correction: ${found.length}`);
  for (const q of found.slice(0, 90)) {
    console.log(`${q.id}: ${q.prompt.slice(0, 85)} :: ${q.options.filter(o => strange.test(o.text)).map(o => `${o.key}=${o.text.slice(0, 145)}`).join(' ; ')}`);
  }
}
const inspect = process.argv.find(arg => arg.startsWith('--inspect='));
if (inspect) {
  for (const id of inspect.slice('--inspect='.length).split(',')) {
    const question = byId.get(id);
    const fixed = copy.find(q => q.id === id);
    if (!question) throw new Error('Unknown question ' + id);
    if (process.argv.includes('--compact')) {
      console.log(JSON.stringify({ id, prompt: fixed.prompt, answer: fixed.answer,
        options: fixed.options.map(o => `${o.key}: ${o.text.slice(0, 330)}`), explanation: fixed.explanation.slice(0, 350) }, null, 2));
      continue;
    }
    console.log(JSON.stringify({ id, prompt: fixed.prompt, answer: fixed.answer,
      before: question.options, after: fixed.options, explanation: fixed.explanation,
      detail: fixed.detail }, null, 2));
  }
}
if (process.argv.includes('--strict')) assert.equal(duplicates.length, 0, duplicates.join('\n'));
