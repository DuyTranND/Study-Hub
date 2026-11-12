const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const testUrl = process.env.AI20K_TEST_URL || 'http://127.0.0.1:8790/';
const profile = path.resolve(__dirname, 'chrome-profile-cdp-test-' + process.pid);
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
// The test server is started in a separate Codex execution session.
const browser = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--no-sandbox', '--remote-debugging-port=0', '--user-data-dir=' + profile, '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' });
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(fn, tries = 75) { let last; for (let n = 0; n < tries; n++) { try { const v = await fn(); if (v) return v; } catch (e) { last = e; } await delay(120); } throw Error('Timed out: ' + (last?.message || 'no positive result')); }
let socket;
const pending = new Map();
let next = 0;
const issues = [];
const missingResources = [];
async function cdp(method, params = {}) {
  const id = ++next;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  const result = await cdp('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw Error(result.exceptionDetails.text + ' ' + (result.exceptionDetails.exception?.description || ''));
  return result.result.value;
}
async function run() {
  await until(async () => (await fetch(testUrl)).ok);
  const port = await until(() => { const fp = path.join(profile, 'DevToolsActivePort'); if (!fs.existsSync(fp)) return null; const value = Number(fs.readFileSync(fp, 'utf8').split('\n')[0]); return value || null; });
  const tabs = await until(async () => { const items = await (await fetch('http://127.0.0.1:' + port + '/json/list')).json(); return items.find(x => x.type === 'page' && x.webSocketDebuggerUrl); });
  socket = new WebSocket(tabs.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  socket.onmessage = event => {
    const m = JSON.parse(event.data);
    if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.reject(Error(JSON.stringify(m.error))) : p.resolve(m.result); }
    if (m.method === 'Runtime.exceptionThrown') issues.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
    if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') issues.push(m.params.entry.text);
    if (m.method === 'Network.responseReceived' && m.params.response.status >= 400) missingResources.push({status:m.params.response.status,url:m.params.response.url});
  };
  await cdp('Page.enable'); await cdp('Runtime.enable'); await cdp('Log.enable'); await cdp('Network.enable');
  await cdp('Page.navigate', { url: testUrl });
  await until(() => evaluate("document.querySelector('#practice-set')?.options.length > 1 && location.hash === '#overview'"));
  const out = {};
  out.home = await evaluate("({total:document.querySelector('#stat-total').textContent, title:document.title, view:location.hash})");
  out.desktopOverflow = await evaluate('({width:innerWidth, scrollWidth:document.documentElement.scrollWidth})');
  await evaluate("document.querySelector('[data-nav=practice]').click()");
  out.setExplorer = {};
  out.setExplorer.initial = await evaluate("({count:document.querySelectorAll('.set-row').length,groups:document.querySelectorAll('.set-group').length,total:document.querySelector('#set-explorer-total').textContent,unique:new Set([...document.querySelectorAll('[data-pick-set]')].map(x=>x.dataset.pickSet)).size})");
  if (out.setExplorer.initial.count !== 6 || out.setExplorer.initial.unique !== 6) issues.push('Initial set count or deduplication failed: ' + JSON.stringify(out.setExplorer.initial));
  out.setExplorer.initialUI = await evaluate("({mode:document.querySelector('.set-mode-tab.active')?.dataset.setMode,customClosed:!document.querySelector('#custom-study').open,visibleLaunches:[...document.querySelectorAll('[data-launch-set]')].filter(b=>b.getBoundingClientRect().width>0).length,firstTitle:document.querySelector('.set-card-title')?.textContent,columns:getComputedStyle(document.querySelector('.set-rows')).gridTemplateColumns})");
  const initialShot = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  fs.writeFileSync(path.join(__dirname, 'set-browser-initial.png'), Buffer.from(initialShot.data, 'base64'));
  if (out.setExplorer.initialUI.mode !== 'exam' || !out.setExplorer.initialUI.customClosed || out.setExplorer.initialUI.visibleLaunches !== 6 || out.setExplorer.initialUI.firstTitle !== 'Đánh giá đầu vào') issues.push('Initial chooser not clear: ' + JSON.stringify(out.setExplorer.initialUI));
  await evaluate("document.querySelector('.set-card-details summary').click()");
  out.setExplorer.cardDetails = await evaluate("({open:document.querySelector('.set-card-details').open,custom:document.querySelector('.set-card-details [data-pick-set]')?.dataset.pickSet,launches:document.querySelectorAll('[data-launch-set]').length})");
  if (!out.setExplorer.cardDetails.open || out.setExplorer.cardDetails.custom !== 'ai-E01' || out.setExplorer.cardDetails.launches !== 6) issues.push('Card details failed: ' + JSON.stringify(out.setExplorer.cardDetails));
  for (const [mode, expected] of [['exam', 6], ['roadmap', 15], ['topic', 62], ['all', 83]]) {
    await evaluate(`document.querySelector('[data-set-mode=${mode}]').click()`);
    const value = await evaluate("({count:document.querySelectorAll('.set-row').length,active:document.querySelector('.set-mode-tab.active')?.dataset.setMode,total:document.querySelector('#set-explorer-total').textContent})");
    out.setExplorer[mode] = value;
    if (value.count !== Math.min(expected,12) || value.active !== mode || !value.total.startsWith(expected + ' bộ')) issues.push(`Set mode ${mode}: ${JSON.stringify(value)}`);
  }
  out.setExplorer.paging = await evaluate("({before:document.querySelector('#set-pagination strong')?.textContent,next:!!document.querySelector('[data-set-page=next]'),previousDisabled:document.querySelector('[data-set-page=prev]')?.disabled})");
  await evaluate("document.querySelector('[data-set-page=next]').click()");
  out.setExplorer.pageTwo = await evaluate("({count:document.querySelectorAll('.set-row').length,page:document.querySelector('#set-pagination strong')?.textContent})");
  await evaluate("document.querySelector('[data-set-page=prev]').click()");
  if (!out.setExplorer.paging.next || !out.setExplorer.paging.previousDisabled || out.setExplorer.pageTwo.count !== 12 || out.setExplorer.pageTwo.page !== 'Trang 2 / 7') issues.push('Set pagination failed: ' + JSON.stringify(out.setExplorer.pageTwo));
  await evaluate("document.querySelector('#set-domain').value='math';document.querySelector('#set-domain').dispatchEvent(new Event('change',{bubbles:true}))");
  out.setExplorer.math = await evaluate("({count:document.querySelectorAll('.set-row').length,groups:[...document.querySelectorAll('.set-group-heading h3')].map(x=>x.textContent)})");
  if (out.setExplorer.math.count !== 12 || out.setExplorer.math.groups.length !== 1 || !(await evaluate("document.querySelector('#set-explorer-total').textContent.startsWith('15 bộ')"))) issues.push('Set domain math: ' + JSON.stringify(out.setExplorer.math));
  await evaluate("document.querySelector('#set-domain').value='all';document.querySelector('#set-domain').dispatchEvent(new Event('change',{bubbles:true}))");
  for (const [bank, expected] of [['ai20k', 18], ['vin20k', 20], ['hirin', 45]]) {
    await evaluate(`document.querySelector('#set-source').value='${bank}';document.querySelector('#set-source').dispatchEvent(new Event('change',{bubbles:true}))`);
    const value = await evaluate("({count:document.querySelectorAll('.set-row').length, groups:document.querySelectorAll('.set-group').length, active:document.querySelector('#set-source').value,total:document.querySelector('#set-explorer-total').textContent})");
    out.setExplorer[bank] = value;
    if (value.count !== Math.min(expected,12) || value.active !== bank || !value.total.startsWith(expected + ' bộ') || !value.groups) issues.push(`Set browser ${bank}: ${JSON.stringify(value)}`);
  }
  await evaluate("document.querySelector('#set-source').value='ai20k';document.querySelector('#set-source').dispatchEvent(new Event('change',{bubbles:true})); document.querySelector('#set-search').value='ĐGNL-01'; document.querySelector('#set-search').dispatchEvent(new Event('input',{bubbles:true}))");
  out.setSearch = await evaluate("({count:document.querySelectorAll('.set-row').length, title:document.querySelector('.set-card-title')?.textContent})");
  await evaluate("document.querySelector('#set-search').value='';document.querySelector('#set-search').dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('[data-pick-set=\"ai-E01\"]').click()");
  out.setPick = await evaluate("({bank:document.querySelector('#practice-bank').value,set:document.querySelector('#practice-set').value,count:document.querySelector('#practice-count').value,mode:document.querySelector('#practice-mode').value})");
  await evaluate("document.querySelector('[data-launch-set=\"ai-E01\"]').click()");
  out.setLaunch = await evaluate("(() => {const s=JSON.parse(localStorage.getItem('ai20k-study-hub-v1')).session;return {length:s.ids.length,mode:s.mode,minutes:s.minutes,hidden:document.querySelector('#set-explorer').classList.contains('hidden')}})()");
  out.setQuestionMap = await evaluate("({count:document.querySelectorAll('[data-jump-q]').length,summary:document.querySelector('#session-map-summary')?.textContent})");
  await evaluate("document.querySelector('[data-jump-q=\"5\"]').click()");
  out.setQuestionJump = await evaluate("({step:document.querySelector('#session-step').textContent,current:document.querySelector('[data-jump-q=\"5\"]').getAttribute('aria-current')})");
  if (out.setQuestionMap.count !== 60 || out.setQuestionJump.step !== '6/60' || out.setQuestionJump.current !== 'step') issues.push('Question navigation failed: ' + JSON.stringify({map:out.setQuestionMap,jump:out.setQuestionJump}));
  await evaluate("document.querySelector('[data-action=restart-setup]').click()");
  out.setReturn = await evaluate("({count:document.querySelectorAll('.set-row').length,visible:!document.querySelector('#set-explorer').classList.contains('hidden')})");
  const setsShot = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  fs.writeFileSync(path.join(__dirname, 'set-browser-desktop.png'), Buffer.from(setsShot.data, 'base64'));
  await evaluate("document.querySelector('[data-nav=overview]').click()");
  const desktopShot = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  fs.writeFileSync(path.join(__dirname, 'redesign-desktop.png'), Buffer.from(desktopShot.data, 'base64'));
  await evaluate("document.querySelector('[data-nav=roadmap]').click()");
  await evaluate("document.querySelector('[data-study-tab=cheats]').click()");
  console.log('roadmap-diag', JSON.stringify(await evaluate("({hash:location.hash, tab:document.querySelector('#study-cheats').className, count:document.querySelector('#cheat-count').innerText, buttons:document.querySelectorAll('#cheat-list button').length, text:document.querySelector('#cheat-panel').innerText.slice(0,180)})")));
  await until(() => evaluate("document.querySelectorAll('.formula-card').length > 0"));
  await delay(1700);
  out.cheats = await evaluate("({cards:document.querySelectorAll('.formula-card').length, mathSvg:document.querySelectorAll('.formula-equation mjx-container[jax=SVG]').length, raw: [...document.querySelectorAll('.formula-equation')].filter(x=>x.textContent.includes('\\\\[')).length, mathErrors:document.querySelectorAll('.formula-equation mjx-merror').length, panelText:document.querySelector('#cheat-panel').innerText.slice(0,90), count:document.querySelector('#cheat-count').textContent})");
  const sheets = await evaluate("[...document.querySelectorAll('#cheat-list [data-cheat]')].map(b=>({file:b.dataset.cheat,title:b.querySelector('strong').textContent,count:Number(b.querySelector('small').textContent.match(/\\d+/)[0])}))");
  out.sheetAudit = { checked: 0, errors: [] };
  for (const sheet of sheets) {
    await evaluate(`document.querySelector('[data-cheat=${JSON.stringify(sheet.file)}]').click()`);
    try {
      await until(() => evaluate(`(() => { const p=document.querySelector('#cheat-panel'); return p.querySelector('h2')?.textContent===${JSON.stringify(sheet.title)} && p.querySelectorAll('.formula-card').length===${sheet.count} && p.querySelectorAll('.formula-equation mjx-container[jax=SVG]').length===p.querySelectorAll('.formula-equation').length; })()`), 35);
    } catch { /* Record unsuccessful rendering with the matching sheet name below. */ }
    const result = await evaluate("(() => {const p=document.querySelector('#cheat-panel');return {title:p.querySelector('h2')?.textContent,cards:p.querySelectorAll('.formula-card').length,formulas:p.querySelectorAll('.formula-equation').length,rendered:p.querySelectorAll('.formula-equation mjx-container[jax=SVG]').length,errors:p.querySelectorAll('.formula-equation mjx-merror').length,raw:[...p.querySelectorAll('.formula-equation')].filter(x=>x.textContent.includes('\\\\[')).length}})()");
    out.sheetAudit.checked++;
    if (result.title !== sheet.title || result.cards !== sheet.count || result.formulas !== result.rendered || result.errors || result.raw) out.sheetAudit.errors.push({file:sheet.file, ...result});
  }
  await evaluate("document.querySelector('#cheat-search').value='A1'; document.querySelector('#cheat-search').dispatchEvent(new Event('input',{bubbles:true}))");
  out.cheatSearch = await evaluate("({results:document.querySelectorAll('#cheat-list .cheat-btn').length, count:document.querySelector('#cheat-count').textContent})");
  await evaluate("document.querySelector('[data-study-tab=lessons]').click(); document.querySelector('[data-day=\"1\"]').click()");
  await until(() => evaluate("document.querySelector('.lesson-body')?.innerText.length > 100"));
  out.lesson = await evaluate("({length:document.querySelector('.lesson-body').innerText.length, label:document.querySelector('#lesson-panel h2').textContent})");
  await evaluate("document.querySelector('[data-nav=practice]').click(); document.querySelector('#practice-count').value='10'; document.querySelector('#practice-mode').value='learn'; document.querySelector('#start-session').click()");
  await until(() => evaluate("!document.querySelector('#session-panel').classList.contains('hidden')"));
  out.quizBefore = await evaluate("({question:document.querySelector('.question-title')?.innerText.slice(0,70), buttons:document.querySelectorAll('[data-answer]').length})");
  const didAnswer = await evaluate("(() => {const b = document.querySelector('[data-answer]'); if(b){b.click();return 'mcq';} const field=document.querySelector('#free-answer');if(field){field.value='1';field.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('[data-action=check]').click();return 'written';}return null})()");
  await until(() => evaluate("document.querySelectorAll('.feedback').length > 0"));
  out.quizAfter = await evaluate("({feedback:document.querySelectorAll('.feedback').length, step:document.querySelector('#session-step')?.innerText, answered:localStorage.getItem('ai20k-study-hub-v1')?.includes('results')})");
  out.quizClicked = didAnswer;
  const practiceShot = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  fs.writeFileSync(path.join(__dirname, 'workspace-practice.png'), Buffer.from(practiceShot.data, 'base64'));
  // Known Python prompt: verify that fenced Markdown becomes semantic, scrollable code.
  const codeSession = "(() => { const x=JSON.parse(localStorage.getItem('ai20k-study-hub-v1')); x.session={ids:['a:E01-B01'],index:0,answers:{},revealed:{},mode:'learn',startedAt:Date.now(),minutes:0,submitted:false,review:false}; localStorage.setItem('ai20k-study-hub-v1',JSON.stringify(x)); return true })()";
  await evaluate(codeSession);
  await cdp('Page.reload', { ignoreCache: true });
  await until(() => evaluate("document.querySelector('.question-title pre code')?.textContent.includes('a = [10, 20')"));
  out.codeDesktop = await evaluate("({fences:document.querySelector('.question-title').innerText.includes('```'),code:document.querySelector('.question-title pre code')?.innerText,preFont:getComputedStyle(document.querySelector('.question-title pre')).fontSize,uiFont:getComputedStyle(document.body).fontFamily,overflow:document.documentElement.scrollWidth>innerWidth})");
  const codeDesktopShot = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  fs.writeFileSync(path.join(__dirname, 'code-desktop.png'), Buffer.from(codeDesktopShot.data, 'base64'));
  if (out.codeDesktop.fences || !out.codeDesktop.code.includes('print(') || out.codeDesktop.overflow) issues.push('Code prompt desktop: '+JSON.stringify(out.codeDesktop));
  const tableSession = "(() => { const x=JSON.parse(localStorage.getItem('ai20k-study-hub-v1')); x.session={ids:['a:E01-A09'],index:0,answers:{},revealed:{},mode:'learn',startedAt:Date.now(),minutes:0,submitted:false,review:false}; localStorage.setItem('ai20k-study-hub-v1',JSON.stringify(x)); return true })()";
  await evaluate(tableSession);
  await cdp('Page.reload', { ignoreCache: true });
  await until(() => evaluate("document.querySelector('.question-title .study-table-wrap table')?.rows.length===4"));
  out.tableDesktop = await evaluate("(() => {const q=document.querySelector('.question-title');const t=q.querySelector('table');return {rows:t.rows.length,questionFont:getComputedStyle(q).fontSize,tableFont:getComputedStyle(t).fontSize,overflow:document.documentElement.scrollWidth>innerWidth}})()");
  const tableDesktopShot = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  fs.writeFileSync(path.join(__dirname, 'table-desktop.png'), Buffer.from(tableDesktopShot.data, 'base64'));
  if (parseFloat(out.tableDesktop.tableFont)>15 || out.tableDesktop.overflow) issues.push('Table prompt desktop: '+JSON.stringify(out.tableDesktop));
  await evaluate("(() => {const x=JSON.parse(localStorage.getItem('ai20k-study-hub-v1'));x.session=null;localStorage.setItem('ai20k-study-hub-v1',JSON.stringify(x));return true})()");
  await cdp('Page.navigate', { url: new URL('#library', testUrl).href });
  await until(() => evaluate("document.querySelectorAll('.question-row').length > 0"));
  await evaluate("document.querySelector('[data-nav=library]').click(); document.querySelector('#library-bank').value='hirin'; document.querySelector('#library-bank').dispatchEvent(new Event('change',{bubbles:true}))");
  out.library = await evaluate("({count:document.querySelector('#library-count').textContent, visible:document.querySelectorAll('.question-row').length})");
  const libraryShot = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  fs.writeFileSync(path.join(__dirname, 'workspace-library.png'), Buffer.from(libraryShot.data, 'base64'));
  await cdp('Emulation.setDeviceMetricsOverride', { width: 430, height: 920, deviceScaleFactor: 1, mobile: true });
  await cdp('Page.navigate', { url: new URL('#roadmap', testUrl).href });
  await until(() => evaluate("document.querySelector('#practice-set')?.options.length > 1"));
  await delay(500);
  out.mobileHome = await evaluate("({width:innerWidth, scrollWidth:document.documentElement.scrollWidth, view:location.hash})");
  await evaluate("document.querySelector('[data-nav=overview]').click()");
  await delay(300);
  out.mobileOverview = await evaluate("({width:innerWidth, scrollWidth:document.documentElement.scrollWidth, heroWidth:Math.round(document.querySelector('.focus-feature').getBoundingClientRect().width), navLabels:[...document.querySelectorAll('.nav-item span')].map(x=>({text:x.textContent,display:getComputedStyle(x).display}))})");
  const mobileShot = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  fs.writeFileSync(path.join(__dirname, 'redesign-mobile.png'), Buffer.from(mobileShot.data, 'base64'));
  await evaluate("document.querySelector('[data-nav=practice]').click(); document.querySelector('[data-set-mode=exam]').click()");
  await delay(200);
  out.mobilePractice = await evaluate("({width:innerWidth, scrollWidth:document.documentElement.scrollWidth, modeGrid:getComputedStyle(document.querySelector('.set-mode-tabs')).gridTemplateColumns,sets:document.querySelectorAll('.set-row').length})");
  const mobilePracticeShot = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  fs.writeFileSync(path.join(__dirname, 'set-browser-mobile.png'), Buffer.from(mobilePracticeShot.data, 'base64'));
  await evaluate(codeSession);
  await cdp('Page.reload', { ignoreCache: true });
  await until(() => evaluate("document.querySelector('.question-title pre code')?.textContent.includes('a = [10, 20')"));
  out.codeMobile = await evaluate("({fences:document.querySelector('.question-title').innerText.includes('```'),font:getComputedStyle(document.querySelector('.question-title pre')).fontSize,scroll:document.documentElement.scrollWidth,viewport:innerWidth,codeScroll:document.querySelector('.question-title pre').scrollWidth,codeView:document.querySelector('.question-title pre').clientWidth})");
  const codeMobileShot = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  fs.writeFileSync(path.join(__dirname, 'code-mobile.png'), Buffer.from(codeMobileShot.data, 'base64'));
  if (out.codeMobile.fences || out.codeMobile.scroll > out.codeMobile.viewport) issues.push('Code prompt mobile: '+JSON.stringify(out.codeMobile));
  await evaluate(tableSession);
  await cdp('Page.reload', { ignoreCache: true });
  await until(() => evaluate("document.querySelector('.question-title .study-table-wrap table')?.rows.length===4"));
  out.tableMobile = await evaluate("(() => {const q=document.querySelector('.question-title');const t=q.querySelector('table');const w=q.querySelector('.study-table-wrap');return {rows:t.rows.length,questionFont:getComputedStyle(q).fontSize,tableFont:getComputedStyle(t).fontSize,scroll:document.documentElement.scrollWidth,viewport:innerWidth,tableScroll:w.scrollWidth,tableView:w.clientWidth}})()");
  const tableMobileShot = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  fs.writeFileSync(path.join(__dirname, 'table-mobile.png'), Buffer.from(tableMobileShot.data, 'base64'));
  if (parseFloat(out.tableMobile.tableFont)>14 || out.tableMobile.scroll>out.tableMobile.viewport) issues.push('Table prompt mobile: '+JSON.stringify(out.tableMobile));
  await evaluate("document.querySelector('[data-nav=roadmap]').click()");
  await evaluate("document.querySelector('[data-study-tab=cheats]').click()");
  await until(() => evaluate("document.querySelectorAll('.formula-card').length > 0"));
  await delay(1200);
  out.mobileCheats = await evaluate("({width:innerWidth, scrollWidth:document.documentElement.scrollWidth, cards:document.querySelectorAll('.formula-card').length, mathSvg:document.querySelectorAll('.formula-equation mjx-container[jax=SVG]').length, mathErrors:document.querySelectorAll('.formula-equation mjx-merror').length})");
  const shot = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  fs.writeFileSync(path.join(__dirname, 'mobile-cheats.png'), Buffer.from(shot.data, 'base64'));
  out.compactMobile = {};
  for (const width of [375, 360]) {
    await cdp('Emulation.setDeviceMetricsOverride', { width, height: 800, deviceScaleFactor: 1, mobile: true });
    for (const page of ['overview', 'practice', 'library', 'roadmap']) {
      await evaluate(`document.querySelector('[data-nav=${page}]').click()`);
      await delay(70);
      out.compactMobile[`${width}-${page}`] = await evaluate('({viewport:innerWidth,content:document.documentElement.scrollWidth})');
    }
  }
  out.issues = issues;
  out.missingResources = missingResources;
  console.log(JSON.stringify(out, null, 2));
  if (out.desktopOverflow.scrollWidth > out.desktopOverflow.width || out.mobileHome.scrollWidth > out.mobileHome.width || out.mobileOverview.scrollWidth > out.mobileOverview.width || out.mobilePractice.scrollWidth > out.mobilePractice.width || out.mobileCheats.scrollWidth > out.mobileCheats.width || Object.values(out.compactMobile).some(x => x.content > x.viewport) || out.cheats.mathSvg !== out.cheats.cards || out.cheats.raw || out.cheats.mathErrors || out.sheetAudit.checked !== sheets.length || out.sheetAudit.errors.length || out.mobileCheats.mathSvg !== out.mobileCheats.cards || out.mobileCheats.mathErrors || out.setSearch.count !== 1 || out.setPick.set !== 'ai-E01' || out.setPick.count !== 'all' || out.setPick.mode !== 'exam' || out.setLaunch.length !== 60 || out.setLaunch.minutes !== 90 || !out.setLaunch.hidden || !out.setReturn.visible || !out.quizClicked || !out.quizAfter.feedback || issues.length || missingResources.length) process.exitCode = 2;
}
run().catch(e => { console.error(e.stack); process.exitCode = 1; }).finally(() => { try { socket?.close(); } catch {} browser.kill(); });
