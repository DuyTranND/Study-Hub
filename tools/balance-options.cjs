/*
 * Audit and stage contextual rewrites of misleadingly short/long distractors.
 * Correct answers, question text, and scoring keys are NEVER edited.
 * Usage: node tools/balance-options.cjs audit | run [max_batches] | apply
 */
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const dataFile = path.join(root, 'data', 'bank.json');
const work = path.join(root, '_qa', 'option-balance');
const outputDir = path.join(work, 'batches');
const overrides = path.join(root, 'data', 'option-edits.json');
const bank = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
const measure = text => String(text).replace(/\s+/g, ' ').trim().length;
const targetRange = right => right >= 28 ? [0.78, 1.28] : right >= 16 ? [0.67, 1.45] : [0.60, 1.65];
const isAtomic = text => /^(?:[-+]?\d+(?:[.,]\d+)?|true|false|none|null|nan|\[[-\d\s,.]+\]|\d+(?:\.\d+)?%|[A-Z]|Đúng|Sai|Có|Không)$/i.test(String(text).trim());

function candidates() {
  const out = [];
  for (const q of bank.questions) {
    if (q.type !== 'mcq' || !Array.isArray(q.options) || q.options.length < 3 || !q.answer) continue;
    const correct = q.options.find(o => o.key === q.answer);
    if (!correct) continue;
    // Exact code output and literal values cannot be padded with prose without
    // changing what the option actually claims. Preserve them for manual QA.
    if (/```/.test(q.prompt) && /(?:print\s*\(|stdout|đầu ra|in ra gì|xuất ra gì|kết quả in)/i.test(q.prompt)) continue;
    const right = measure(correct.text);
    if (right < 16 || (right < 30 && q.options.every(o => isAtomic(o.text)))) continue;
    const [lo, hi] = targetRange(right);
    const bad = q.options.filter(o => o.key !== q.answer && !isAtomic(o.text) && (measure(o.text) < right * lo || measure(o.text) > right * hi));
    if (!bad.length) continue;
    out.push({
      id: q.id, bank: q.bank, question: q.prompt, answer: q.answer, right,
      min: Math.ceil(right * lo), max: Math.floor(right * hi),
      options: Object.fromEntries(q.options.map(o => [o.key, o.text])),
      rewrite: bad.map(o => o.key),
      explanation: (q.explanation || '').slice(0, 350),
    });
  }
  return out;
}
const flagged = candidates();

function audit() {
  const counts = {};
  for (const q of flagged) { counts[q.bank] ??= 0; counts[q.bank]++; }
  const edits = fs.existsSync(overrides) ? JSON.parse(fs.readFileSync(overrides, 'utf8')).items || {} : {};
  fs.mkdirSync(work, { recursive: true });
  const report = { totalQuestions: bank.questions.length, multipleChoice: bank.questions.filter(q => q.type === 'mcq').length, actionable: flagged.length, byBank: counts, alreadyEdited: Object.keys(edits).length, generated: new Date().toISOString() };
  fs.writeFileSync(path.join(work, 'audit.json'), JSON.stringify(report, null, 2));
  const csv = ['id,bank,answer,correct_length,min_length,max_length,distractors_to_edit'];
  for (const q of flagged) csv.push([q.id, q.bank, q.answer, q.right, q.min, q.max, q.rewrite.join('|')].join(','));
  fs.writeFileSync(path.join(work, 'flagged-questions.csv'), csv.join('\n') + '\n', 'utf8');
  console.log(JSON.stringify({ ...report, reportFolder: work, examples: flagged.slice(0, 3).map(x => ({ id: x.id, rewrite: x.rewrite, right: x.right })) }, null, 2));
}

function parseResponse(stdout) {
  let outer = JSON.parse(stdout.trim());
  let response = typeof outer === 'string' ? outer : (outer.response || '');
  if (typeof response !== 'string') response = JSON.stringify(response);
  response = response.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
  return JSON.parse(response);
}

function createPrompt(items) {
  const brief = items.map(({ id, question, options, rewrite, min, max, answer }) => ({ id, question, options, rewrite, min, max, answer }));
  return `CHỈ BIÊN TẬP VĂN BẢN, KHÔNG GỌI TOOL, KHÔNG CHẠY LỆNH. Viết lại CHỈ các phương án SAI ở rewrite để có độ dài min..max ký tự, tương đương đáp án đúng. Giữ nguyên ý sai và độ khó; không thêm từ đệm hoặc lộ dấu hiệu sai; không làm phương án sai thành đúng. QUAN TRỌNG: Giữ nguyên chính xác toàn bộ số, phần trăm, ký hiệu, biểu thức toán, đoạn mã trong từng phương án; không thêm số mới, không lược bỏ từ phủ định như không, chỉ, luôn, tất cả, bắt buộc. Phải giữ nguyên mệnh đề sai ban đầu. Nếu đáp án là đầu ra mã hoặc giá trị chính xác không thể diễn đạt dài hơn, giữ nguyên. Trả DUY NHẤT JSON: {"items":[{"id":"...","options":{"B":"..."}}]}. Mỗi id đúng một lần, options chỉ gồm keys trong rewrite. Dữ liệu: ${JSON.stringify(brief)}`;
}

function runGemini(items, batchId) {
  return new Promise((resolve, reject) => {
    const args = ['--model','gemini-3.8-flash-high','--effort','high','--output-format','json','--print-timeout','230s','--print',createPrompt(items)];
    const child = spawn('agy', args, { cwd: root, windowsHide: true, env: process.env });
    let stdout = '', stderr = '';
    child.stdout.setEncoding('utf8'); child.stderr.setEncoding('utf8');
    child.stdout.on('data', chunk => { stdout += chunk; });
    child.stderr.on('data', chunk => { stderr += chunk.slice(0, 2500); });
    child.on('error', reject);
    child.on('close', code => {
      if (code !== 0) return reject(new Error(`AGY exit=${code}: ${stderr.slice(-600)}`));
      try { resolve(parseResponse(stdout)); } catch (error) { reject(new Error(`Invalid AGY JSON: ${error.message}; response=${stdout.slice(0, 300)}`)); }
    });
  });
}

function validate(items, modelOut) {
  const proposed = Array.isArray(modelOut?.items) ? modelOut.items : [];
  const byId = new Map(proposed.map(x => [x.id, x]));
  const accepted = {}, rejected = [];
  for (const q of items) {
    const item = byId.get(q.id);
    if (!item || !item.options || typeof item.options !== 'object') { rejected.push({ id: q.id, reason: 'Missing item' }); continue; }
    const actual = Object.keys(item.options).sort().join(',');
    if (actual !== [...q.rewrite].sort().join(',')) { rejected.push({ id: q.id, reason: 'Option keys mismatch: ' + actual }); continue; }
    const originalTexts = Object.values(q.options);
    const texts = { ...q.options, ...item.options };
    const seen = new Set();
    let why = '';
    for (const [key, text] of Object.entries(texts)) {
      if (typeof text !== 'string' || !text.trim() || text.length > 1500 || /<script|<iframe/i.test(text)) { why = `Invalid text ${key}`; break; }
      const lower = text.trim().toLowerCase();
      if (seen.has(lower)) { why = `Duplicate option ${key}`; break; }
      seen.add(lower);
      if (key !== q.answer && item.options[key] !== undefined) {
        const length = measure(text);
        if (length < q.min * 0.85 || length > q.max * 1.14) { why = `Length ${key}=${length}, goal ${q.min}..${q.max}`; break; }
        if (isAtomic(q.options[key]) && q.options[key] !== text) { why = `Atomic change ${key}`; break; }
      }
    }
    if (q.options[q.answer] !== texts[q.answer]) why = 'Correct answer changed';
    if (why) { rejected.push({ id: q.id, reason: why }); continue; }
    accepted[q.id] = item.options;
  }
  return { accepted, rejected };
}

function semanticGuard(before, after) {
  // Conservative checks for high-impact literals: editing their values changes
  // the scientific/technical claim even when the new sentence looks fluent.
  const numbers = s => (String(s).match(/\d+(?:[.,]\d+)*/g) || []).sort().join('|');
  if (numbers(before) !== numbers(after)) return 'Numeric literals changed';
  const inline = s => [...String(s).matchAll(/`([^`]+)`/g)].map(m => m[1]);
  if (inline(before).some(t => !after.includes('`' + t + '`'))) return 'Inline code changed';
  const math = s => [...String(s).matchAll(/\$([^$]+)\$/g)].map(m => m[1]);
  if (math(before).some(t => !after.includes('$' + t + '$'))) return 'Math notation changed';
  for (const word of ['không', 'luôn', 'chỉ', 'bắt buộc', 'tất cả']) {
    const has = s => new RegExp(`(?:^|[^\\p{L}])${word}(?=$|[^\\p{L}])`, 'iu').test(String(s));
    if (has(before) && !has(after)) return `Qualification changed: ${word}`;
  }
  return '';
}

async function run() {
  const batchSize = Number(process.env.BALANCE_BATCH_SIZE || 16);
  const maxBatches = Number(process.argv[3] || 999999);
  const concurrency = Number(process.env.BALANCE_CONCURRENCY || 3);
  const all = Array.from({ length: Math.ceil(flagged.length / batchSize) }, (_, i) => flagged.slice(i * batchSize, (i + 1) * batchSize));
  fs.mkdirSync(outputDir, { recursive: true });
  let cursor = 0, scheduled = 0, done = 0, skipped = 0, failed = 0, accepted = 0, rejected = 0;
  async function worker() {
    while (cursor < all.length) {
      const i = cursor++;
      const items = all[i];
      const file = path.join(outputDir, String(i).padStart(4, '0') + '.json');
      if (fs.existsSync(file)) { skipped++; continue; }
      if (scheduled >= maxBatches) break;
      scheduled++;
      try {
        const response = await runGemini(items, i);
        const val = validate(items, response);
        fs.writeFileSync(file, JSON.stringify({ index: i, ids: items.map(q => q.id), accepted: val.accepted, rejected: val.rejected }, null, 2));
        done++; accepted += Object.keys(val.accepted).length; rejected += val.rejected.length;
        console.log(`BATCH ${i + 1}/${all.length}: accepted=${Object.keys(val.accepted).length}/${items.length}, rejected=${val.rejected.length}`);
      } catch (e) {
        failed++;
        console.log(`FAILED ${i + 1}/${all.length}: ${String(e.message).slice(0, 200)}`);
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  console.log(JSON.stringify({ totalBatches: all.length, done, skipped, failed, accepted, rejected }));
  if (failed) process.exitCode = 1;
}

async function repair() {
  // Retry rejected AI output and edits that violate the semantic safeguards.
  // Persist only full, validated replacements for each question's requested keys.
  const byId = new Map(flagged.map(q => [q.id, q]));
  const files = fs.readdirSync(outputDir).filter(x => /^\d{4}\.json$/.test(x)).sort();
  const jobs = files.map(file => {
    const batch = JSON.parse(fs.readFileSync(path.join(outputDir, file), 'utf8'));
    const requests = new Map();
    for (const item of batch.rejected) {
      const q = byId.get(item.id);
      if (q) requests.set(q.id, q);
    }
    for (const [id, edits] of Object.entries(batch.accepted)) {
      const q = byId.get(id);
      if (!q) continue;
      const keys = Object.entries(edits).filter(([key, after]) => {
        const before = q.options[key];
        return before === undefined || Boolean(semanticGuard(before, after));
      }).map(([key]) => key);
      if (keys.length) requests.set(id, { ...q, rewrite: keys });
    }
    return { file, batch, requests: [...requests.values()] };
  }).filter(j => j.requests.length);
  const concurrency = Math.min(12, Math.max(1, Number(process.env.BALANCE_REPAIR_CONCURRENCY || 8)));
  let cursor = 0, completed = 0, failed = 0, reviewed = 0, accepted = 0;
  async function worker() {
    while (cursor < jobs.length) {
      const job = jobs[cursor++];
      let changed = false;
      for (let k = 0; k < job.requests.length; k += 3) {
        const items = job.requests.slice(k, k + 3);
        reviewed += items.length;
        try {
          const response = await runGemini(items, job.file);
          const val = validate(items, response);
          for (const [id, proposals] of Object.entries(val.accepted)) {
            const q = byId.get(id);
            const hasIssue = Object.entries(proposals).some(([key, after]) =>
              semanticGuard(q.options[key], after));
            if (hasIssue) continue;
            job.batch.accepted[id] = { ...(job.batch.accepted[id] || {}), ...proposals };
            job.batch.rejected = job.batch.rejected.filter(item => item.id !== id);
            accepted++;
            changed = true;
          }
        } catch (e) {
          failed++;
          console.log(`REPAIR FAILED ${job.file}: ${String(e.message).slice(0, 120)}`);
        }
      }
      if (changed) fs.writeFileSync(path.join(outputDir, job.file), JSON.stringify(job.batch, null, 2), 'utf8');
      completed++;
      console.log(`REPAIR ${completed}/${jobs.length}: ${job.file}`);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  console.log(JSON.stringify({ jobs: jobs.length, reviewed, repaired: accepted, failures: failed }));
  if (failed) process.exitCode = 1;
}

async function runIndex() {
  const index = Number(process.argv[3]);
  const batchSize = Number(process.env.BALANCE_BATCH_SIZE || 8);
  const total = Math.ceil(flagged.length / batchSize);
  if (!Number.isInteger(index) || index < 0 || index >= total) throw Error('Invalid batch index');
  fs.mkdirSync(outputDir, { recursive: true });
  const file = path.join(outputDir, String(index).padStart(4, '0') + '.json');
  if (fs.existsSync(file)) { console.log('Batch already complete: ' + index); return; }
  const items = flagged.slice(index * batchSize, (index + 1) * batchSize);
  const accepted = {}, rejected = [];
  async function attempt(chunk) {
    try {
      const result = validate(chunk, await runGemini(chunk, index));
      Object.assign(accepted, result.accepted);
      rejected.push(...result.rejected);
    } catch (e) {
      if (chunk.length > 1) {
        const mid = Math.ceil(chunk.length / 2);
        await attempt(chunk.slice(0, mid));
        await attempt(chunk.slice(mid));
      } else {
        rejected.push({ id: chunk[0].id, reason: 'AGY response unavailable' });
      }
    }
  }
  for (let j = 0; j < items.length; j += 2) await attempt(items.slice(j, j + 2));
  fs.writeFileSync(file, JSON.stringify({ index, ids: items.map(q => q.id), accepted, rejected }, null, 2), 'utf8');
  console.log(JSON.stringify({ index, accepted: Object.keys(accepted).length, rejected }, null, 2));
}

function apply() {
  const edits = {};
  const rejected = [];
  if (!fs.existsSync(outputDir)) throw new Error('No generated batches');
  const completedFiles = fs.readdirSync(outputDir).filter(x => /^\d{4}\.json$/.test(x));
  const expectedCount = Math.ceil(flagged.length / Number(process.env.BALANCE_BATCH_SIZE || 16));
  if (completedFiles.length !== expectedCount) throw new Error(`Incomplete generated batches: ${completedFiles.length}/${expectedCount}. Keep the original bank unchanged.`);
  for (const file of completedFiles.sort()) {
    const batch = JSON.parse(fs.readFileSync(path.join(outputDir, file), 'utf8'));
    for (const [id, proposals] of Object.entries(batch.accepted)) {
      const original = bank.questions.find(q => q.id === id);
      if (!original || !proposals || typeof proposals !== 'object') throw new Error(`Invalid model edit ${id}`);
      const issues = Object.entries(proposals).map(([key, after]) => {
        const before = original.options.find(o => o.key === key)?.text;
        return before === undefined ? 'Unknown answer key' : semanticGuard(before, after);
      }).filter(Boolean);
      if (issues.length) rejected.push({ id, reason: issues.join('; ') });
      else edits[id] = proposals;
    }
    rejected.push(...batch.rejected);
  }
  const byId = new Map(bank.questions.map(q => [q.id,q]));
  for (const [id, options] of Object.entries(edits)) {
    const q = byId.get(id);
    if (!q) throw new Error('Unknown question ' + id);
    if (options[q.answer]) throw new Error('Correct answer cannot change: ' + id);
    for (const [key,text] of Object.entries(options)) {
      const o = q.options.find(x => x.key === key);
      if (!o) throw new Error('Invalid option ' + id + '/' + key);
      o.text = text;
    }
  }
  fs.writeFileSync(overrides, JSON.stringify({ version: 1, items: edits }, null, 2), 'utf8');
  fs.writeFileSync(dataFile, JSON.stringify(bank), 'utf8');
  fs.writeFileSync(path.join(work, 'review-rejected.json'), JSON.stringify(rejected, null, 2), 'utf8');
  console.log(JSON.stringify({ edited: Object.keys(edits).length, rejected: rejected.length, bank: dataFile, overrides }, null, 2));
}

switch (process.argv[2]) {
  case 'audit': audit(); break;
  case 'run': run().catch(err => { console.error(err); process.exitCode = 1; }); break;
  case 'run-index': runIndex().catch(err => { console.error(err); process.exitCode = 1; }); break;
  case 'repair': repair().catch(err => { console.error(err); process.exitCode = 1; }); break;
  case 'apply': apply(); break;
  default: throw new Error('Usage: audit | run [max_batches] | apply');
}
