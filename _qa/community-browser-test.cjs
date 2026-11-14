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
  await until(() => evaluate(visible('#community-setup')));
  assert.equal(await evaluate('document.documentElement.scrollWidth > innerWidth + 2'), false, 'Desktop overflow');
  await evaluate('(' + function() {
    const form = document.querySelector('#community-create');
    form.elements.name.value = 'Browser Study Crew';
    form.elements.nickname.value = 'Alice';
    form.requestSubmit();
  }.toString() + ')()');
  await until(() => evaluate(visible('#community-board')));
  const groupCode = await evaluate('document.querySelector("#community-code").textContent');
  assert.match(groupCode, /^[A-Z2-9]{8}$/);
  assert.equal(await evaluate('document.querySelectorAll("#community-ranking-rows tr").length'), 1);
  const response = await fetch(origin + '/api/groups/join', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: groupCode, nickname: 'Bob' })
  });
  assert.equal(response.status, 200, 'Second learner should join group');
  await evaluate('document.querySelector("#community-refresh").click()');
  await until(() => evaluate('document.querySelectorAll("#community-ranking-rows tr").length === 2'));

  await evaluate('document.querySelector("#view-community [data-action=mode-start]").click()');
  await until(() => evaluate('location.hash === "#practice"'));
  await evaluate('(' + function() {
    const bank = document.querySelector('#practice-bank');
    bank.value = 'shl'; bank.dispatchEvent(new Event('change', { bubbles: true }));
    document.querySelector('#custom-study').open = true;
    document.querySelector('#practice-count').value = '10';
    document.querySelector('#practice-mode').value = 'exam';
    document.querySelector('#start-session').click();
  }.toString() + ')()');
  await until(() => evaluate('document.querySelectorAll("#session-question-list [data-jump-q]").length === 10'));
  const exam = await evaluate('(' + async function() {
    const state = JSON.parse(localStorage.getItem('ai20k-study-hub-v1'));
    const questions = (await (await fetch('/data/shl-practice.json')).json()).questions;
    const answers = Object.fromEntries(questions.map(q => [q.id, q.answer]));
    for (let i = 0; i < 10; i++) {
      document.querySelector('#session-question-list [data-jump-q="' + i + '"]').click();
      const id = state.session.ids[i];
      const option = document.querySelector('#question-stage [data-answer="' + answers[id] + '"]');
      if (!option) throw Error('Missing correct answer choice: ' + id);
      option.click();
    }
    document.querySelector('#next-q').click();
    return { mode: state.session.mode, count: state.session.ids.length, hasScoreAction: !!document.querySelector('[data-community-share]') };
  }.toString() + ')()');
  assert.deepEqual(exam, { mode: 'exam', count: 10, hasScoreAction: true });
  await until(() => evaluate('document.querySelector("#community-sync-hint")?.textContent.includes("Score shared")'), 20000);
  await evaluate('document.querySelector("[data-nav=community]").click()');
  await until(() => evaluate(visible('#community-board') + ' && document.querySelector("#community-you-points").textContent === "10"'));
  const ranking = await evaluate('(' + function() {
    return { members: document.querySelectorAll('#community-ranking-rows tr').length,
      points: document.querySelector('#community-you-points').textContent,
      activity: document.querySelectorAll('#community-feed .community-feed-item').length,
      width: document.documentElement.scrollWidth, viewport: innerWidth };
  }.toString() + ')()');
  assert.equal(ranking.members, 2);
  assert.equal(ranking.points, '10');
  assert.equal(ranking.activity, 1);
  assert.ok(ranking.width <= ranking.viewport + 2, 'Desktop board overflow');
  // Hold the first weekly request while switching to all-time, then verify
  // that the board also requests the new period instead of keeping stale data.
  await evaluate('(' + function() {
    window.__groupViewCalls = [];
    window.__originalGroupFetch = window.fetch;
    window.fetch = async function(...args) {
      if (String(args[0]).includes('/api/groups/view')) {
        const requestedPeriod = JSON.parse(args[1].body).period;
        window.__groupViewCalls.push(requestedPeriod);
        if (requestedPeriod === 'week') await new Promise(resolve => setTimeout(resolve, 400));
      }
      return window.__originalGroupFetch.apply(this, args);
    };
  }.toString() + ')()');
  await evaluate('document.querySelector("[data-community-period=week]").click()');
  await until(() => evaluate('window.__groupViewCalls.includes("week")'));
  await evaluate('document.querySelector("[data-community-period=all]").click()');
  await until(() => evaluate('window.__groupViewCalls.includes("all") && document.querySelector("[data-community-period=all]").getAttribute("aria-pressed") === "true"'));
  await evaluate('window.fetch = window.__originalGroupFetch');
  assert.equal(await evaluate('document.querySelector("#community-you-points").textContent'), '10');
  await cdp('Emulation.setDeviceMetricsOverride', { width: 430, height: 932, deviceScaleFactor: 1, mobile: true });
  const mobile = await evaluate('(' + function() {
    return { viewport: innerWidth, width: document.documentElement.scrollWidth,
      board: !document.querySelector('#community-board').classList.contains('hidden'),
      groupName: document.querySelector('#community-group-name').textContent };
  }.toString() + ')()');
  assert.ok(mobile.board && mobile.groupName.includes('Browser Study Crew'));
  assert.ok(mobile.width <= mobile.viewport + 2, 'Mobile horizontal overflow');
  assert.deepEqual(errors, [], 'Chrome JavaScript errors');
  console.log('Study Groups browser: PASS ' + JSON.stringify({ groupCode, ranking, mobile, errors }));
}
main().catch(error => { console.error(error.stack || error); process.exitCode = 1; }).finally(async () => {
  try { socket?.close(); } catch {}
  browser?.kill();
  server?.kill();
  await pause(400);
  try { fs.rmSync(temp, { recursive: true, force: true }); } catch {}
});
