// Smoke-test the deployed TFG27 study guide and exam workflow in real Chrome.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { spawn } = require('node:child_process');
const url = process.env.AI20K_TEST_URL || 'http://127.0.0.1:8770/#tfg-guide';
const profile = path.join(__dirname, 'tfg27-chrome-' + process.pid);
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const browser = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--no-sandbox', '--remote-debugging-port=0', '--user-data-dir=' + profile, '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' });
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const get = address => new Promise((resolve, reject) => {
  http.get(address, response => { let body = ''; response.setEncoding('utf8'); response.on('data', chunk => body += chunk); response.on('end', () => resolve({ code: response.statusCode, body })); }).on('error', reject);
});
async function until(fn, ms = 20000) {
  const end = Date.now() + ms;
  let error;
  while (Date.now() < end) { try { const result = await fn(); if (result) return result; } catch (err) { error = err; } await pause(200); }
  throw new Error('Timed out: ' + (error?.message || 'condition not met'));
}
let socket, sequence = 0;
const pending = new Map(), errors = [], failed = [];
async function cdp(method, params = {}) {
  const id = ++sequence;
  return new Promise((resolve, reject) => { pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })); });
}
async function evaluate(expression) {
  const out = await cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (out.exceptionDetails) throw Error(out.exceptionDetails.exception?.description || out.exceptionDetails.text);
  return out.result.value;
}
async function screenshot(filename) {
  const out = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  fs.writeFileSync(path.join(__dirname, filename), Buffer.from(out.data, 'base64'));
}
async function main() {
  const host = new URL(url).origin;
  for (const asset of ['/', '/data/tfg27-guide.md', '/data/tfg27-questions.json', '/tfg27.css']) {
    const response = await until(async () => { const r = await get(host + asset); return r.code === 200 && r.body.length > 100 ? r : null; });
    if (asset.endsWith('.json') && JSON.parse(response.body).questions.length !== 183) throw Error('Wrong question count');
  }
  const port = await until(() => { const filename = path.join(profile, 'DevToolsActivePort'); return fs.existsSync(filename) ? Number(fs.readFileSync(filename, 'utf8').split('\n')[0]) : 0; });
  const tab = await until(async () => JSON.parse((await get('http://127.0.0.1:' + port + '/json/list')).body).find(x => x.type === 'page' && x.webSocketDebuggerUrl));
  socket = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  socket.onmessage = event => {
    const value = JSON.parse(event.data);
    if (value.id && pending.has(value.id)) { const request = pending.get(value.id); pending.delete(value.id); value.error ? request.reject(Error(JSON.stringify(value.error))) : request.resolve(value.result); }
    if (value.method === 'Runtime.exceptionThrown') errors.push(value.params.exceptionDetails.text);
    if (value.method === 'Log.entryAdded' && value.params.entry.level === 'error') errors.push(value.params.entry.text);
    if (value.method === 'Network.responseReceived' && value.params.response.status >= 400) failed.push({ code: value.params.response.status, url: value.params.response.url });
  };
  await cdp('Runtime.enable'); await cdp('Page.enable'); await cdp('Log.enable'); await cdp('Network.enable');
  await cdp('Page.navigate', { url });
  await until(() => evaluate('document.querySelector("#tfg-guide-body")?.innerText.includes("Assessment facts")'));
  const guide = await evaluate('(() => ({heading:document.querySelector("#view-tfg-guide h1")?.textContent,paragraphs:document.querySelectorAll("#tfg-guide-body p").length,tables:document.querySelectorAll("#tfg-guide-body table").length,codeExamples:document.querySelectorAll("#tfg-guide-body .code-editor").length,toc:[...document.querySelectorAll("#tfg-guide-toc a")].map(x=>!!document.getElementById(x.hash.slice(1))),overflow:document.documentElement.scrollWidth>innerWidth}))()');
  if (guide.heading !== 'TFG27 Study Guide' || guide.paragraphs < 12 || guide.tables < 2 || guide.codeExamples < 2 || guide.toc.includes(false) || guide.overflow) throw Error('Guide failed: ' + JSON.stringify(guide));
  await screenshot('tfg27-guide-desktop.png');
  await evaluate('document.querySelector("[data-nav=tfg-tests]").click()');
  await until(() => evaluate('document.querySelectorAll("#tfg-topic-grid .tfg-test-card").length === 8'));
  const tests = await evaluate('(() => ({heading:document.querySelector("#view-tfg-tests h1")?.textContent,questions:document.querySelector("#tfg-total-questions")?.textContent,sets:document.querySelector("#tfg-total-sets")?.textContent,mocks:document.querySelectorAll("#tfg-mock-grid .tfg-test-card").length,topics:document.querySelectorAll("#tfg-topic-grid .tfg-test-card").length,overflow:document.documentElement.scrollWidth>innerWidth}))()');
  if (tests.heading !== 'TFG27 Practice Tests' || tests.questions !== '183' || tests.sets !== '10' || tests.mocks !== 2 || tests.topics !== 8 || tests.overflow) throw Error('Test listing failed: ' + JSON.stringify(tests));
  await screenshot('tfg27-tests-desktop.png');
  await evaluate('document.querySelector("#tfg-mock-grid [data-launch-set]").click()');
  await until(() => evaluate('!!document.querySelector("#session-panel:not(.hidden) .question-title")'));
  const exam = await evaluate('(() => {const s=JSON.parse(localStorage.getItem("ai20k-study-hub-v1"));return {view:location.hash,questions:s.session?.ids.length,minutes:s.session?.minutes,mode:s.session?.mode,question:document.querySelector(".question-title")?.innerText.slice(0,110),answers:document.querySelectorAll(".option").length,overflow:document.documentElement.scrollWidth>innerWidth}})()');
  if (exam.view !== '#practice' || exam.questions !== 40 || exam.minutes !== 60 || exam.mode !== 'exam' || exam.answers !== 4 || exam.overflow) throw Error('Timed mock failed: ' + JSON.stringify(exam));
  await screenshot('tfg27-exam-desktop.png');
  await cdp('Emulation.setDeviceMetricsOverride', { width: 430, height: 932, deviceScaleFactor: 1, mobile: true });
  await evaluate('document.querySelector("[data-nav=tfg-tests]").click()');
  await until(() => evaluate('document.querySelectorAll("#tfg-mock-grid .tfg-test-card").length === 2'));
  const mobile = await evaluate('({viewport:innerWidth,documentWidth:document.documentElement.scrollWidth,mockCards:document.querySelectorAll("#tfg-mock-grid .tfg-test-card").length})');
  await screenshot('tfg27-tests-mobile.png');
  if (mobile.documentWidth > mobile.viewport + 2) throw Error('Mobile horizontal overflow: ' + JSON.stringify(mobile));
  if (errors.length || failed.length) throw Error('Browser errors: ' + JSON.stringify({ errors, failed }));
  console.log(JSON.stringify({success:true,guide,tests,exam,mobile,errors,failed},null,2));
}
main().catch(error=>{console.error(error.stack || error); process.exitCode=1;}).finally(async()=>{try{socket?.close();}catch{} browser.kill(); await pause(350);try{fs.rmSync(profile,{recursive:true,force:true});}catch{}});
