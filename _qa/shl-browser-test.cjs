// Chrome CDP smoke test: separate SHL catalog, topic answers, timed mock, mobile UI.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { spawn } = require('node:child_process');
const siteRoot = process.env.AI20K_SITE_ROOT || path.resolve(__dirname, '..');
const base = 'http://127.0.0.1:8782/';
const profile = path.join(__dirname, 'shl-chrome-' + process.pid);
const server = spawn(process.execPath, [path.join(siteRoot, 'server.cjs')], { cwd: siteRoot, env: { ...process.env, PORT: '8782' }, stdio: 'ignore' });
const browser = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', ['--headless=new', '--no-sandbox', '--disable-gpu', '--remote-debugging-port=0', '--user-data-dir=' + profile, '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' });
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const get = url => new Promise((resolve, reject) => http.get(url, response => { let body = ''; response.setEncoding('utf8'); response.on('data', c => body += c); response.on('end', () => resolve({ status: response.statusCode, body })); }).on('error', reject));
async function until(fn, ms = 20000) { const end = Date.now() + ms; while (Date.now() < end) { try { const found = await fn(); if (found) return found; } catch {} await wait(200); } throw Error('Timed out waiting for browser condition'); }
let socket, sequence = 0;
const pending = new Map(), errors = [], failed = [];
async function cdp(method, params = {}) { const id = ++sequence; return new Promise((resolve, reject) => { pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })); }); }
async function evaluate(expression) { const r = await cdp('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result.value; }
async function snapshot(filename) { const r = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }); fs.writeFileSync(path.join(__dirname, filename), Buffer.from(r.data, 'base64')); }
async function main() {
  const host = new URL(base).origin;
  await until(async () => { const r = await get(host + '/'); return r.status === 200; });
  for (const asset of ['/', '/app.js', '/shl-practice.css', '/data/shl-practice.json']) { const r = await get(host + asset); if (r.status !== 200 || r.body.length < 100) throw Error('Missing asset: ' + asset + ' ' + r.status); }
  const data = JSON.parse((await get(host + '/data/shl-practice.json')).body);
  if (data.questions.length !== 60 || data.sets.length !== 7) throw Error('Unexpected SHL payload');
  const port = await until(() => { const file = path.join(profile, 'DevToolsActivePort'); return fs.existsSync(file) ? Number(fs.readFileSync(file, 'utf8').split('\n')[0]) : 0; });
  const tab = await until(async () => JSON.parse((await get('http://127.0.0.1:' + port + '/json/list')).body).find(t => t.type === 'page' && t.webSocketDebuggerUrl));
  socket = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((ok, fail) => { socket.onopen = ok; socket.onerror = fail; });
  socket.onmessage = event => { const v = JSON.parse(event.data); if (v.id && pending.has(v.id)) { const p = pending.get(v.id); pending.delete(v.id); v.error ? p.reject(Error(JSON.stringify(v.error))) : p.resolve(v.result); } if (v.method === 'Runtime.exceptionThrown') errors.push(v.params.exceptionDetails.text); if (v.method === 'Network.responseReceived' && v.params.response.status >= 400) failed.push(v.params.response.url); };
  await cdp('Runtime.enable'); await cdp('Page.enable'); await cdp('Network.enable');
  await cdp('Page.navigate', { url: host + '/#shl-practice' });
  await until(() => evaluate('document.querySelector("#shl-total-questions")?.textContent === "60"'));
  const catalog = await evaluate('(() => ({title:document.querySelector("#view-shl-practice h1")?.innerText,mocks:document.querySelectorAll("#shl-mock-grid .shl-test-card").length,topics:document.querySelectorAll("#shl-topic-grid .shl-test-card").length,links:document.querySelectorAll(".shl-official-links a").length,overflow:document.documentElement.scrollWidth>innerWidth}))()');
  if (catalog.title !== 'SHL Sample Practice' || catalog.mocks !== 2 || catalog.topics !== 5 || catalog.links !== 3 || catalog.overflow) throw Error('Catalog failed: ' + JSON.stringify(catalog));
  await snapshot('shl-desktop.png');
  await evaluate('document.querySelector("#shl-topic-grid [data-launch-set=shl-num]").click()');
  await until(() => evaluate('document.querySelector(".question-title table") && JSON.parse(localStorage.getItem("ai20k-study-hub-v1"))?.session?.ids?.length === 15'));
  const topic = await evaluate('(() => { const s=JSON.parse(localStorage.getItem("ai20k-study-hub-v1")); return {mode:s.session?.mode,questions:s.session?.ids.length,options:document.querySelectorAll("#question-stage .option").length,tables:document.querySelectorAll(".question-title table").length,overflow:document.documentElement.scrollWidth>innerWidth,first:s.session?.ids[0]}; })()');
  if (topic.mode !== 'learn' || topic.questions !== 15 || topic.options !== 4 || !topic.tables || topic.overflow) throw Error('Numerical topic failed: ' + JSON.stringify(topic));
  const correct = data.questions.find(q => q.id === topic.first).answer;
  await evaluate(`document.querySelector('[data-answer="${correct}"]').click()`);
  await until(() => evaluate('document.querySelector(".feedback")?.textContent.includes("Correct")'));
  const saved = await evaluate(`JSON.parse(localStorage.getItem("ai20k-study-hub-v1")).results[${JSON.stringify(topic.first)}]?.ok`);
  if (!saved) throw Error('Right answer was not recorded correctly');
  await snapshot('shl-numerical.png');
  await evaluate('document.querySelector("[data-nav=shl-practice]").click()');
  await evaluate('document.querySelector("[data-launch-set=shl-mock-1]").click()');
  await until(() => evaluate('document.querySelector("#session-clock")?.textContent?.includes(":")'));
  const exam = await evaluate('(() => { const s=JSON.parse(localStorage.getItem("ai20k-study-hub-v1")).session; return {mode:s.mode,minutes:s.minutes,questions:s.ids.length,answerOptions:document.querySelectorAll("#question-stage .option").length,overflow:document.documentElement.scrollWidth>innerWidth}; })()');
  if (exam.mode !== 'exam' || exam.minutes !== 35 || exam.questions !== 30 || ![3,4].includes(exam.answerOptions) || exam.overflow) throw Error('Mock exam failed: ' + JSON.stringify(exam));
  await evaluate('document.querySelector("[data-answer]").click()');
  await evaluate('document.querySelectorAll("[data-jump-q]")[29].click()');
  await evaluate('document.querySelector("#next-q").click()');
  await until(() => evaluate('document.querySelector("#session-heading")?.textContent === "Session complete!"'));
  const results = await evaluate('({rows:document.querySelectorAll(".result-line").length,stats:document.querySelectorAll(".result-stat").length})');
  if (results.rows !== 30 || results.stats !== 3) throw Error('Result grading failed: ' + JSON.stringify(results));
  await evaluate('document.querySelector("[data-nav=shl-practice]").click()');
  await cdp('Emulation.setDeviceMetricsOverride', { width: 430, height: 932, deviceScaleFactor: 1, mobile: true });
  const mobile = await evaluate('({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,cards:document.querySelectorAll("#shl-mock-grid .shl-test-card").length})');
  await snapshot('shl-mobile.png');
  if (mobile.scrollWidth > mobile.width + 2 || mobile.cards !== 2) throw Error('Mobile view failed: ' + JSON.stringify(mobile));
  if (errors.length || failed.length) throw Error('Browser errors: ' + JSON.stringify({ errors, failed }));
  console.log(JSON.stringify({ success:true, catalog, topic, exam, results, mobile, errors, failed }, null, 2));
}
main().catch(e => { console.error(e.stack || e); process.exitCode = 1; }).finally(async () => { try { socket?.close(); } catch {} server.kill(); browser.kill(); await wait(350); try { fs.rmSync(profile, { recursive: true, force: true }); } catch {} });
