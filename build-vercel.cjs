'use strict';

// Publish only browser assets, never the server code or private storage.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = __dirname;
const output = path.join(root, 'dist');
const allowed = file =>
  (/^[^/]+\.(?:html|css|js|svg|ico)$/i.test(file) && !file.startsWith('build-')) ||
  /^data\/[^/]+\.(?:json|md)$/i.test(file) ||
  /^sources\//.test(file);

function listFiles(directory, prefix = '') {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    if (entry.name.startsWith('.') || entry.name === '_backups' || entry.name === 'node_modules' || entry.name === 'work') return [];
    const relative = path.posix.join(prefix, entry.name);
    if (entry.isDirectory()) return listFiles(path.join(directory, entry.name), relative);
    return entry.isFile() ? [relative] : [];
  });
}

let candidates;
try {
  candidates = execFileSync('git', ['ls-files', '-z'], { cwd: root })
    .toString('utf8').split('\0').filter(Boolean);
} catch {
  // A hosted source archive might not include Git metadata.
  candidates = [...fs.readdirSync(root, { withFileTypes: true })
    .filter(item => item.isFile()).map(item => item.name),
    ...listFiles(path.join(root, 'data'), 'data'),
    ...listFiles(path.join(root, 'sources'), 'sources')];
}

// Include the browser helper before the first commit as well as in source archives.
candidates = [...new Set([...candidates, 'question-dedup.js'])];

fs.rmSync(output, { force: true, recursive: true });
let count = 0;
for (const relative of candidates) {
  if (!allowed(relative)) continue;
  const from = path.join(root, relative);
  if (!fs.existsSync(from) || !fs.statSync(from).isFile()) continue;
  const to = path.join(output, relative);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
  count++;
}
if (!fs.existsSync(path.join(output, 'index.html')) ||
    !fs.existsSync(path.join(output, 'data', 'bank.json')))
  throw Error('Missing required browser assets in the Vercel build.');
console.log(`Prepared ${count} public Study Hub assets in dist/`);
