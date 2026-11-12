const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const oldPath = process.argv[2];
if (!oldPath || !fs.existsSync(oldPath)) throw Error('Usage: node tools/verify-option-edits.cjs PATH_TO_ORIGINAL_BANK');
const oldBank = JSON.parse(fs.readFileSync(oldPath, 'utf8'));
const newBank = JSON.parse(fs.readFileSync(path.join(root, 'data/bank.json'), 'utf8'));
const edits = JSON.parse(fs.readFileSync(path.join(root, 'data/option-edits.json'), 'utf8')).items;
const issues = [], changed = [];
const measure = v => String(v).replace(/\s+/g, ' ').trim().length;
const byId = new Map(oldBank.questions.map(q => [q.id, q]));
if (oldBank.questions.length !== newBank.questions.length) issues.push('Question count changed');
if (JSON.stringify(oldBank.sets) !== JSON.stringify(newBank.sets)) issues.push('Exam sets changed');
for (const after of newBank.questions) {
  const before = byId.get(after.id);
  if (!before) { issues.push('New question ' + after.id); continue; }
  const oldCopy = structuredClone(before), newCopy = structuredClone(after);
  for (const option of newCopy.options || []) {
    const oldOpt = oldCopy.options.find(o => o.key === option.key);
    if (!oldOpt) { issues.push(`Option missing ${after.id}/${option.key}`); continue; }
    if (option.text !== oldOpt.text) {
      if (option.key === before.answer) issues.push(`Correct answer modified ${after.id}/${option.key}`);
      if (edits[after.id]?.[option.key] !== option.text) issues.push(`Edit missing from override ${after.id}/${option.key}`);
      changed.push({ id: after.id, key: option.key, before: measure(oldOpt.text), after: measure(option.text), correct: measure(oldCopy.options.find(o=>o.key===before.answer).text) });
      oldOpt.text = option.text;
    }
  }
  if (JSON.stringify(oldCopy) !== JSON.stringify(newCopy)) issues.push('Non-option data changed ' + after.id);
}
if (new Set(newBank.questions.map(q => q.id)).size !== newBank.questions.length) issues.push('Duplicate question IDs');
const changedIds = new Set(changed.map(q => q.id));
if (Object.keys(edits).length !== changedIds.size) issues.push('Override count mismatch');
const report = { verified: issues.length === 0, sourceQuestions: oldBank.questions.length, sets: newBank.sets.length, editedQuestions: changedIds.size, editedOptions: changed.length, lengths: { improved: changed.filter(q=>Math.abs(q.after-q.correct)<Math.abs(q.before-q.correct)).length, worsened: changed.filter(q=>Math.abs(q.after-q.correct)>Math.abs(q.before-q.correct)).length }, issues: issues.slice(0,100) };
console.log(JSON.stringify(report, null, 2));
if (issues.length) process.exitCode = 1;
