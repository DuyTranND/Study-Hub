'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'study-hub-browser-'));
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const get = address => new Promise((resolve, reject) =>
  http.get(address, res => {
    let body = '';
    res.setEncoding('utf8');
    res.on('data', chunk => body += chunk);
    res.on('end', () => resolve({ status: res.statusCode, body }));
  }).on('error', reject)
);
async function until(fn, timeout = 20000) {
  const deadline = Date.now() + timeout;
  let last;
  while (Date.now() < deadline) {
    try { const result = await fn(); if (result) return result; }
    catch (error) { last = error; }
    await pause(150);
  }
  throw Error('Timed out: ' + (last?.message || 'condition not met'));
}
async function freePort() {
  const listener = net.createServer();
  await new Promise(resolve => listener.listen(0, '127.0.0.1', resolve));
  const port = listener.address().port;
  await new Promise(resolve => listener.close(resolve));
  return port;
}

let browser, server, socket, serial = 0;
const pending = new Map();
const errors = [];
async function cdp(method, params = {}) {
  const id = ++serial;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  const out = await cdp('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (out.exceptionDetails) throw Error(out.exceptionDetails.exception?.description || out.exceptionDetails.text);
  return out.result.value;
}
const visible = id => '!document.querySelector(' + JSON.stringify(id) + ').classList.contains("hidden")';
async function main() {
  const port = await freePort();
  const origin = 'http://127.0.0.1:' + port;
  server = spawn(process.execPath, ['server.cjs'], {
    cwd: root, env: { ...process.env, HOST: '127.0.0.1', PORT: String(port),
      STUDY_GROUP_STORE: path.join(temp, 'groups.json') }, stdio: 'ignore'
  });
  await until(async () => {
    if (server.exitCode !== null) throw Error('Node server exited: ' + server.exitCode);
    return (await get(origin + '/api/groups/status')).status === 200;
  });
  const profile = path.join(temp, 'chrome');
  browser = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--no-sandbox', '--remote-debugging-port=0', '--user-data-dir=' + profile,
    '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' });
  const debuggerPort = await until(() => {
    const file = path.join(profile, 'DevToolsActivePort');
    return fs.existsSync(file) ? Number(fs.readFileSync(file, 'utf8').split('\n')[0]) : 0;
  });
  const tab = await until(async () => JSON.parse((await get('http://127.0.0.1:' + debuggerPort + '/json/list')).body)
    .find(page => page.type === 'page' && page.webSocketDebuggerUrl));
  socket = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  socket.onmessage = event => {
    const item = JSON.parse(event.data);
    if (item.id && pending.has(item.id)) {
      const p = pending.get(item.id); pending.delete(item.id);
      item.error ? p.reject(Error(JSON.stringify(item.error))) : p.resolve(item.result);
    }
    if (item.method === 'Runtime.exceptionThrown') errors.push(item.params.exceptionDetails.text);
    if (item.method === 'Log.entryAdded' && item.params.entry.level === 'error') errors.push(item.params.entry.text);
  };
  await cdp('Runtime.enable');
  await cdp('Page.enable');
  await cdp('Log.enable');
  await cdp('Page.navigate', { url: origin + '/#community' });
  await until(() => evaluate(visible('#community-board')));
  assert.equal(await evaluate('document.documentElement.scrollWidth > innerWidth + 2'), false, 'Desktop overflow');
  await evaluate('document.querySelector("#account-open").click(); document.querySelector("#account-name").value="Browser Alice"; document.querySelector("#account-form").requestSubmit()');
  await until(() => evaluate('!!window.StudyAccount?.identity() && !document.querySelector("#account-dialog").open'));
  const alice = await evaluate('window.StudyAccount.identity()');
  const joined = await fetch(origin + '/api/groups/login', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({nickname:'Browser Bob'}) });
  assert.equal(joined.status, 200);
  await evaluate('document.querySelector("#community-refresh").click()');
  await until(() => evaluate('document.querySelectorAll("#community-ranking-rows tr").length===2'));
  await evaluate('document.querySelector("[data-nav=practice]").click()');
  await until(() => evaluate('!!document.querySelector("[data-launch-set=mixed-mock-01]")'));
  await evaluate('document.querySelector("[data-launch-set=mixed-mock-01]").click()');
  await until(() => evaluate('document.querySelectorAll("#session-question-list [data-jump-q]").length===60'));
  const exam = await evaluate('(' + async function() {
    const identity = window.StudyAccount.identity();
    const state = JSON.parse(localStorage.getItem('ai20k-study-hub-v1:'+identity.memberId));
    const bank = await (await fetch('/data/bank.json')).json();
    const answers = Object.fromEntries(bank.questions.map(q => [q.id,q.answer]));
    for(let i=0;i<10;i++){
      document.querySelector('[data-jump-q="'+i+'"]').click();
      document.querySelector('[data-answer="'+answers[state.session.ids[i]]+'"]').click();
    }
    document.querySelector('#flag-current-question').click();
    await window.StudyAccount.flush();
    return {count:state.session.ids.length,mode:state.session.mode};
  }.toString()+')()');
  assert.deepEqual(exam,{count:60,mode:'exam'});
  await cdp('Page.reload');
  await until(() => evaluate('document.querySelector("#nav-answered-count")?.textContent==="10" && document.querySelector("#nav-flagged-count")?.textContent==="1"'));
  await evaluate('window.confirm=()=>true; document.querySelector("#submit-session").click()');
  await until(() => evaluate('document.querySelector("#session-label").textContent==="SESSION RESULTS"'));
  assert.equal(await evaluate('document.querySelector(".result-stat b").textContent'),'10/60');
  await until(() => evaluate('document.querySelector("#community-sync-hint")?.textContent.includes("Score saved")'));
  await evaluate('document.querySelector(".session-exit").click(); document.querySelector("[data-nav=community]").click()');
  await until(() => evaluate('document.querySelector("#community-you-points").textContent==="10"'));
  const ranking = await evaluate('('+function(){ return {members:document.querySelectorAll('#community-ranking-rows tr').length,points:document.querySelector('#community-you-points').textContent,activity:document.querySelectorAll('#community-feed .community-feed-item').length,width:document.documentElement.scrollWidth,viewport:innerWidth};}.toString()+')()');
  assert.equal(ranking.members,2);assert.equal(ranking.points,'10');assert.equal(ranking.activity,1);
  const snapshot = await (await fetch(origin+'/api/groups/public',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})).json();
  assert.equal(snapshot.group.board.find(row=>row.id===alice.memberId).accuracy,17);
  await evaluate('window.__viewCalls=[];window.__originalFetch=window.fetch;window.fetch=async function(...args){if(String(args[0]).includes("/api/groups/view")){const p=JSON.parse(args[1].body).period;__viewCalls.push(p);if(p==="week")await new Promise(r=>setTimeout(r,400));}return __originalFetch.apply(this,args);}');
  await evaluate('document.querySelector("[data-community-period=week]").click()');
  await until(()=>evaluate('window.__viewCalls.includes("week")'));
  await evaluate('document.querySelector("[data-community-period=all]").click()');
  await until(()=>evaluate('window.__viewCalls.includes("all") && document.querySelector("[data-community-period=all]").getAttribute("aria-pressed")==="true"'));
  await evaluate('window.fetch=window.__originalFetch');
  await cdp('Emulation.setDeviceMetricsOverride',{width:430,height:932,deviceScaleFactor:1,mobile:true});
  assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth+2'),false,'Mobile overflow');
  assert.deepEqual(errors,[],'Chrome JavaScript errors');
  console.log('StudyHub profiles and Leaderboard browser: PASS '+JSON.stringify({ranking,profileReload:true,reviewFlags:true,earlyScore:'10/60',leaderboardAccuracy:17,mobile:true,errors}));
}
main().catch(error => { console.error(error.stack || error); process.exitCode = 1; }).finally(async () => {
  try { socket?.close(); } catch {}
  browser?.kill();
  server?.kill();
  await pause(400);
  if (path.dirname(path.resolve(temp)) !== path.resolve(os.tmpdir()) || !path.basename(temp).startsWith('study-hub-browser-')) throw Error('Unexpected browser test cleanup path');
  try { fs.rmSync(temp, { recursive: true, force: true }); } catch {}
});
