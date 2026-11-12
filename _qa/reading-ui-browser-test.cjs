// Headless visual smoke test for question typography, editor and MathJax.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { spawn } = require('node:child_process');
const url = process.env.AI20K_TEST_URL || 'http://127.0.0.1:8770/#practice';
const root = __dirname;
const profile = path.join(root, 'chrome-reading-' + process.pid);
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const browser = spawn(chrome, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--no-sandbox', '--remote-debugging-port=0', '--user-data-dir=' + profile,
  '--window-size=1440,900', 'about:blank'
], { stdio: 'ignore' });
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const getHttp = address => new Promise((resolve, reject) => {
  http.get(address, response => {
    let body = '';
    response.setEncoding('utf8');
    response.on('data', chunk => { body += chunk; });
    response.on('end', () => resolve({ ok: response.statusCode >= 200 && response.statusCode < 300, body }));
    response.on('error', reject);
  }).on('error', reject);
});
async function until(fn, timeout = 13000) {
  const end = Date.now() + timeout;
  let error;
  while (Date.now() < end) {
    try { const result = await fn(); if (result) return result; }
    catch (err) { error = err; }
    await sleep(150);
  }
  throw new Error('Browser check timeout: ' + (error?.message || 'condition not met'));
}
let socket, counter = 0;
const pending = new Map(), errors = [], failedResponses = [];
async function cdp(method, params = {}) {
  const id = ++counter;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  const result = await cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
}
async function image(name) {
  const result = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  fs.writeFileSync(path.join(root, name), Buffer.from(result.data, 'base64'));
}
async function session(id) {
  const script = '(() => { const state=JSON.parse(localStorage.getItem("ai20k-study-hub-v1") || "{}");' +
    'state.session={ids:[' + JSON.stringify(id) + '],index:0,answers:{},revealed:{},mode:"learn",startedAt:Date.now(),minutes:0,submitted:false,review:false};' +
    'localStorage.setItem("ai20k-study-hub-v1",JSON.stringify(state));return true;})()';
  await evaluate(script);
  await cdp('Page.reload', { ignoreCache: true });
  await until(() => evaluate('document.querySelector("#session-panel:not(.hidden) .question-title")?.textContent.length > 20'));
}
async function main() {
  await until(async () => (await getHttp(url)).ok);
  const port = await until(() => {
    const file = path.join(profile, 'DevToolsActivePort');
    return fs.existsSync(file) ? Number(fs.readFileSync(file, 'utf8').split('\n')[0]) : 0;
  });
  const tab = await until(async () => JSON.parse((await getHttp('http://127.0.0.1:' + port + '/json/list')).body)
    .find(x => x.type === 'page' && x.webSocketDebuggerUrl));
  socket = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  socket.onmessage = event => {
    const response = JSON.parse(event.data);
    if (response.id && pending.has(response.id)) {
      const request = pending.get(response.id);
      pending.delete(response.id);
      response.error ? request.reject(new Error(JSON.stringify(response.error))) : request.resolve(response.result);
    }
    if (response.method === 'Runtime.exceptionThrown') errors.push(response.params.exceptionDetails.text);
    if (response.method === 'Log.entryAdded' && response.params.entry.level === 'error') errors.push(response.params.entry.text);
    if (response.method === 'Network.responseReceived' && response.params.response.status >= 400) {
      failedResponses.push({ status: response.params.response.status, url: response.params.response.url, type: response.params.type });
    }
  };
  await cdp('Runtime.enable');
  await cdp('Page.enable');
  await cdp('Log.enable');
  await cdp('Network.enable');
  await cdp('Page.navigate', { url });
  await until(() => evaluate('document.querySelector("#practice-set")?.options.length > 1'));
  await session('a:E01-B05');
  await until(() => evaluate('document.querySelectorAll(".question-title .code-editor .tok-builtin, .question-title .code-editor .tok-string").length > 0'));
  const code = await evaluate('(() => { const box=document.querySelector(".code-editor");return {title:document.querySelector(".question-title p")?.innerText,language:box.querySelector(".code-editor-bar").innerText,lines:box.querySelectorAll(".code-line").length,tokens:box.querySelectorAll("[class*=tok-]").length,firstOption:document.querySelector(".option-copy")?.innerText,optionFont:getComputedStyle(document.querySelector(".option-copy")).fontSize,codeFont:getComputedStyle(box.querySelector("pre")).fontSize,pageOverflow:document.documentElement.scrollWidth>innerWidth};})()');
  await image('reading-code-desktop.png');
  if (!code.firstOption.startsWith('Tổng:') || !code.tokens || code.lines < 2 || code.pageOverflow) throw Error('Code/options issue: ' + JSON.stringify(code));
  const separation = await evaluate('(() => {const question=document.querySelector(".question-prompt"),answer=document.querySelector(".answer-prompt"),header=answer?.querySelector(".answer-section-header h4"),option=answer?.querySelector(".option"),a=question?.getBoundingClientRect(),b=answer?.getBoundingClientRect();return {label:question?.querySelector(".question-section-label")?.innerText,answerHeading:header?.innerText,questionBackground:getComputedStyle(question).backgroundColor,answerBackground:getComputedStyle(option).backgroundColor,sectionGap:b?.top-a?.bottom,optionBorderLeft:getComputedStyle(option).borderLeftWidth,optionCount:answer?.querySelectorAll(".option").length,pageOverflow:document.documentElement.scrollWidth>innerWidth};})()');
  if (!separation.label?.startsWith('QUESTION 1') || separation.answerHeading?.toLowerCase() !== 'answer choices' || separation.questionBackground === separation.answerBackground || separation.sectionGap < 15 || separation.optionBorderLeft !== '3px' || separation.optionCount !== 4 || separation.pageOverflow) throw Error('Question / answer separation issue: ' + JSON.stringify(separation));
  await evaluate('document.querySelector(".answer-section-header").scrollIntoView({block:"start",behavior:"instant"})');
  await image('reading-answer-desktop.png');
  await evaluate('document.querySelector(".option")?.click()');
  await until(() => evaluate('!!document.querySelector(".feedback") && !!document.querySelector(".option.selected")'));
  await session('v:D10_Q53');
  const numbered = await evaluate('(() => {const choices=[...document.querySelectorAll(".option")];const lists=choices.map(c=>c.querySelector("ol.option-item-list"));return {choices:choices.length,counts:lists.map(l=>l?.querySelectorAll("li").length),first:lists[0]?.querySelector("li")?.innerText,last:lists[0]?.lastElementChild?.innerText,style:lists[0]&&getComputedStyle(lists[0]).listStyleType,gap:lists[0]&&Math.round(lists[0].children[1].getBoundingClientRect().top-lists[0].children[0].getBoundingClientRect().bottom),pageOverflow:document.documentElement.scrollWidth>innerWidth};})()');
  if (numbered.choices !== 4 || numbered.counts.some(n => n !== 6) || !numbered.first.startsWith('Completeness') || !numbered.last.startsWith('Uniqueness') || numbered.style !== 'decimal' || numbered.gap < 5 || numbered.pageOverflow) throw Error('Numbered choice layout: ' + JSON.stringify(numbered));
  await image('reading-numbered-desktop.png');
  await evaluate('document.querySelector(".option[data-answer=A]")?.click()');
  await until(() => evaluate('!!document.querySelector(".option.selected.correct") && !!document.querySelector(".feedback")'));
  await session('a:E01-A01');
  await until(() => evaluate('document.querySelector(".question-title mjx-container[jax=SVG] > svg")?.getBoundingClientRect().width > 25'));
  const math = await evaluate('(() => {const svg=document.querySelector(".question-title mjx-container[jax=SVG] > svg");return {rendered:!!svg,width:svg.getBoundingClientRect().width,height:svg.getBoundingClientRect().height,formulaErrors:document.querySelectorAll(".question-title mjx-merror").length,rawDollar:document.querySelector(".question-title").innerText.includes("$A ="),pageOverflow:document.documentElement.scrollWidth>innerWidth};})()');
  await image('reading-math-desktop.png');
  if (math.formulaErrors || math.rawDollar || math.pageOverflow) throw Error('Math issue: ' + JSON.stringify(math));
  await session('a:E03-C07');
  const technicalOption = await evaluate('document.querySelector(".option-copy")?.innerText');
  if (!technicalOption.startsWith('temperature')) throw Error('Technical identifier was capitalized: ' + technicalOption);
  const diagramResults = [];
  for (const [id, kind] of [['a:E01-A06', 'flowchart'], ['a:E01-B09', 'pie'], ['a:E03-C06', 'sequence']]) {
    await session(id);
    await evaluate('document.querySelector(".option")?.click()');
    await until(() => evaluate('!!document.querySelector(".feedback details")'));
    await evaluate('document.querySelector(".feedback details").open = true');
    try {
      await until(() => evaluate('document.querySelector(".study-diagram svg")?.getBoundingClientRect().width > 25'));
    } catch (error) {
      console.log('DIAGRAM_DEBUG', id, await evaluate('(() => { const e=document.querySelector(".study-diagram"),n=e?.querySelector(".mermaid"),s=e?.querySelector("svg"),d=document.querySelector(".feedback details");const rect=el=>el?{rect:Array.from(el.getClientRects(),r=>({width:r.width,height:r.height,top:r.top})),display:getComputedStyle(el).display,visibility:getComputedStyle(el).visibility,offsetWidth:el.offsetWidth,clientWidth:el.clientWidth,scrollWidth:el.scrollWidth}:null;return {ready:!!window.mermaid,run:typeof window.mermaid?.run,detailsOpen:d?.open,figure:rect(e),pre:rect(n),svg:rect(s),feedback:rect(document.querySelector(".feedback")),details:rect(d),main:rect(document.querySelector("#question-stage")),svgOuter:s?.outerHTML.slice(0,450),errors:document.querySelectorAll(".study-diagram .error-icon").length};})()'));
      console.log('BROWSER_ERRORS', JSON.stringify({errors, failedResponses}));
      await image('reading-diagram-failure.png');
      throw error;
    }
    const current = await evaluate('(() => { const container=document.querySelector(".study-diagram"),svg=container.querySelector("svg");return {nodes:svg.querySelectorAll("g.node, g.slice, g.actor, .node").length,paths:svg.querySelectorAll("path").length,labels:svg.querySelectorAll("text, foreignObject, .label").length,svgWidth:svg.getBoundingClientRect().width,svgHeight:svg.getBoundingClientRect().height,rawCode:container.innerText.includes("flowchart LR"),overflow:document.documentElement.scrollWidth>innerWidth};})()');
    if (current.rawCode || current.overflow || current.paths < 2 || current.svgHeight < 40) throw Error('Unrendered diagram or overflow: ' + id + JSON.stringify(current));
    diagramResults.push({ id, kind, ...current });
    if (kind === 'flowchart') {
      await evaluate('document.querySelector(".study-diagram").scrollIntoView({block:"center",behavior:"instant"})');
      await image('reading-diagram-desktop.png');
    }
  }
  await cdp('Emulation.setDeviceMetricsOverride', { width: 430, height: 920, deviceScaleFactor: 1, mobile: true });
  await session('v:D10_Q53');
  const numberedMobile = await evaluate('(() => {const lists=[...document.querySelectorAll(".option-copy ol.option-item-list")];const li=lists[0]?.querySelectorAll("li");return {viewport:innerWidth,pageWidth:document.documentElement.scrollWidth,lists:lists.length,counts:lists.map(l=>l.children.length),lineHeights:li&&[...li].map(x=>Math.round(x.getBoundingClientRect().height))};})()');
  await evaluate('document.querySelector(".answer-section-header").scrollIntoView({block:"start",behavior:"instant"})');
  await image('reading-numbered-mobile.png');
  if (numberedMobile.pageWidth > numberedMobile.viewport + 2 || numberedMobile.lists !== 4 || numberedMobile.counts.some(n => n !== 6)) throw Error('Mobile numbered choice layout: ' + JSON.stringify(numberedMobile));
  await session('a:E01-B05');
  const mobile = await evaluate('(() => {const pre=document.querySelector(".code-editor-pre");return {viewport:innerWidth,pageScroll:document.documentElement.scrollWidth,codeWidth:pre.clientWidth,codeScrollWidth:pre.scrollWidth,options:document.querySelectorAll(".option").length};})()');
  await image('reading-code-mobile.png');
  await evaluate('document.querySelector(".answer-section-header").scrollIntoView({block:"start",behavior:"instant"})');
  await image('reading-answer-mobile.png');
  if (mobile.pageScroll > mobile.viewport + 2 || mobile.options !== 4) throw Error('Mobile issue: ' + JSON.stringify(mobile));
  if (errors.length || failedResponses.length) throw Error('Browser errors: ' + JSON.stringify({ errors, failedResponses }));
  console.log(JSON.stringify({ success: true, code, separation, numbered, numberedMobile, math, technicalOption, diagramResults, mobile, errors, failedResponses }, null, 2));
}
main().catch(error => { console.error(error.stack || error); process.exitCode = 1; })
  .finally(async () => {
    try { socket?.close(); } catch {}
    browser.kill();
    await sleep(350);
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
  });
