(() => {
  'use strict';
  const STORAGE_KEY = 'ai20k-study-hub-v1';
  const $ = id => document.getElementById(id);
  const icon = name => `<svg aria-hidden="true"><use href="#i-${name}"/></svg>`;
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const fmt = n => Number(n).toLocaleString('en-US');
  const bankLabel = bank => ({ ai20k: 'AI20K', vin20k: 'Vin20K', hirin: 'Hirin', mixed: '3 sources', tfg27: 'TFG27 Prep', shl: 'SHL Practice' }[bank] || bank);
  // Translate catalog metadata only when it is displayed. Original bank data,
  // question text, answers, hints, explanations and saved IDs stay untouched.
  const SET_TITLE_ALIASES = {
    'Đánh giá đầu vào': 'Entry Assessment',
    'Chuẩn cấu trúc AI-TEST': 'AI-TEST Format',
    'Tổng hợp mốc 1 tháng': 'One-Month Comprehensive Assessment',
    'Năng lực theo 5 lĩnh vực AI': 'Skills Across Five AI Domains',
    'Tình huống nghề nghiệp (SFIA L3–L4)': 'Professional Scenarios (SFIA L3–L4)',
    'Tổng hợp nâng cao mốc 3 tháng': 'Advanced Three-Month Assessment',
    'Đại số tuyến tính': 'Linear Algebra',
    'Giải tích và tối ưu': 'Calculus and Optimization',
    'Xác suất': 'Probability',
    'Thống kê và kiểm định A/B': 'Statistics and A/B Testing',
    'Lập trình Python': 'Python Programming',
    'Xử lý dữ liệu với pandas': 'Data Processing with pandas',
    'NumPy và độ phức tạp thuật toán': 'NumPy and Algorithm Complexity',
    'SQL cho phân tích dữ liệu': 'SQL for Data Analysis',
    'Học máy và đánh giá mô hình': 'Machine Learning and Model Evaluation',
    'LLM, RAG và Agent': 'LLMs, RAG and Agents',
    'MLOps và vận hành mô hình': 'MLOps and Model Operations',
    'Logic, đạo đức và pháp lý AI': 'Logic, Ethics and AI Law',
    'Bài tập Tính toán & Định lượng': 'Quantitative Practice',
    'A10: Số học máy tính & Ổn định số': 'A10: Computer Arithmetic & Numerical Stability',
    'A1: Đại số tuyến tính cơ bản': 'A1: Linear Algebra Basics',
    'A3: Xác suất cơ bản': 'A3: Probability Basics',
    'A4: Phân phối xác suất': 'A4: Probability Distributions',
    'A5: Thống kê mô tả & suy luận': 'A5: Descriptive & Inferential Statistics',
    'A6: Giải tích & Tối ưu hóa': 'A6: Calculus & Optimization',
    'A7: Tư duy định lượng & ước lượng': 'A7: Quantitative Reasoning & Estimation',
    'A8: Lý thuyết thông tin': 'A8: Information Theory',
    'B1: Python cơ bản': 'B1: Python Basics',
    'B2: Python nâng cao': 'B2: Advanced Python',
    'B3: Cấu trúc dữ liệu & Thuật toán': 'B3: Data Structures & Algorithms',
    'B5: Cơ sở dữ liệu & SQL': 'B5: Databases & SQL',
    'B8: API & Hệ thống': 'B8: APIs & Systems',
    'C1: Học CÓ giám sát & KHÔNG giám sát': 'C1: Supervised & Unsupervised Learning',
    'C2: Đánh giá mô hình (Model Evaluation)': 'C2: Model Evaluation',
    'C3: Học Sâu (Deep Learning)': 'C3: Deep Learning',
    'C4: Xử lý ngôn ngữ tự nhiên (NLP)': 'C4: Natural Language Processing (NLP)',
    'C5: Thị giác máy tính (Computer Vision)': 'C5: Computer Vision',
    'C8: Phân tích Chuỗi thời gian (Time Series)': 'C8: Time Series Analysis',
    'D10: Giao tiếp & Documentation': 'D10: Communication & Documentation',
    'D1: Logic & Tư duy phản biện': 'D1: Logic & Critical Thinking',
    'D9: IP, Môi trường & Xã hội': 'D9: Intellectual Property, Environment & Society',
    'D2: Đạo đức AI (AI Ethics)': 'D2: AI Ethics',
    'D3: Định kiến & Công bằng (Bias & Fairness)': 'D3: Bias & Fairness',
    'D4: Quyền riêng tư (Privacy)': 'D4: Privacy',
    'D5: An toàn AI (AI Safety & Security)': 'D5: AI Safety & Security',
    'D6: Tình huống nghề nghiệp': 'D6: Professional Scenarios',
    'D8: Quy định AI (AI Regulation)': 'D8: AI Regulation'
  };
  const GROUP_ALIASES = {
    'Đề tổng hợp': 'Comprehensive Exams', 'Toán học': 'Mathematics',
    'Lập trình & Dữ liệu': 'Programming & Data', 'Logic & Đạo đức': 'Logic & Ethics',
    '15 ngày nền tảng': '15-Day Foundation', 'Chuyên sâu': 'Advanced Topics',
    'Toán học & Thống kê': 'Math & Statistics', 'Lập trình & Công cụ': 'Programming & Tools'
  };
  const CHEAT_TITLE_ALIASES = {
    'A1.json': '📐 Linear Algebra', 'A3.json': '🎲 Probability',
    'A4.json': '📊 Probability Distributions', 'A5.json': '📈 Statistics',
    'A6.json': '∫ Calculus & Optimization'
  };
  const displaySetTitle = title => SET_TITLE_ALIASES[title] || title || '';
  const displayGroup = group => GROUP_ALIASES[group] || group || '';
  const displayCheatTitle = (file, title) => CHEAT_TITLE_ALIASES[file] || title || '';
  const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const titleOf = { overview: 'Overview', practice: 'Practice', community: 'Study Groups', library: 'Question Bank', roadmap: 'Lessons & Formulas', 'tfg-guide': 'TFG27 Study Guide', 'tfg-tests': 'TFG27 Practice Tests', 'shl-practice': 'SHL Sample Practice' };
  const tryStore = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; } };
  const persisted = tryStore();
  const state = {
    results: persisted.results && typeof persisted.results === 'object' ? persisted.results : {},
    bookmarks: Array.isArray(persisted.bookmarks) ? persisted.bookmarks : [],
    session: persisted.session || null
  };
  let data = null, byId = new Map(), mockSets = new Map(), mixedIds = new Set(), activeView = 'overview', libraryPage = 0, libraryMatches = [],
    selectedDay = 0, studyTab = 'lessons', cheatIndex = [], activeCheat = '', setBrowserBank = 'all', setBrowserMode = 'exam', setBrowserDomain = 'all', setBrowserPage = 0,
    toastTimer = null, mathTimer = null, ticking = null, mermaidReady = false, tfgGuideLoaded = false;
  const save = () => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { toast('Could not save your progress. Check your browser storage.'); } };
  function toast(message) { const el = $('toast'); el.textContent = message; el.classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('visible'), 2400); }
  function typeset() {
    clearTimeout(mathTimer);
    mathTimer = setTimeout(() => {
      if (window.MathJax?.typesetPromise) window.MathJax.typesetPromise().catch(() => {});
      const nodes = [...document.querySelectorAll('.study-diagram .mermaid:not([data-processed])')]
        .filter(node => !node.closest('details:not([open])') && node.getClientRects().length);
      if (!nodes.length || !window.mermaid?.run) return;
      if (!mermaidReady) {
        window.mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: 'neutral', flowchart: { useMaxWidth: true, htmlLabels: false } });
        mermaidReady = true;
      }
      window.mermaid.run({ nodes }).catch(() => {
        // Keep the original Mermaid source visible when a diagram cannot be parsed.
        nodes.forEach(node => { if (!node.hasAttribute('data-processed')) node.classList.add('diagram-source'); });
      });
    }, 90);
  }
  document.addEventListener('toggle', event => {
    if (event.target.matches?.('.feedback details') && event.target.open) typeset();
  }, true);
  function inlineMd(value) {
    // Keep TeX and inline code intact while applying Markdown emphasis.
    const protectedTokens = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|(?<!\\)\$(?!\$)[^\n$]+(?<!\\)\$|`[^`\n]+`)/g;
    return String(value ?? '').split(protectedTokens).map((part, index) => {
      if (index % 2) return part.startsWith('`')
        ? '<code>' + escapeHtml(part.slice(1, -1)) + '</code>'
        : escapeHtml(part);
      return escapeHtml(part)
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
        .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_, label, url) => '<a href="' + url + '" target="_blank" rel="noopener noreferrer">' + label + '</a>');
    }).join('');
  }
  const CODE_LANGUAGES = new Set(['python', 'py', 'javascript', 'js', 'typescript', 'ts', 'sql', 'json', 'bash', 'shell', 'sh', 'r', 'html', 'css', 'text']);
  const PYTHON_KEYWORDS = new Set('and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield True False None match case'.split(' '));
  const SQL_KEYWORDS = new Set('select from where join left right inner outer on as group by having order limit offset insert into values update set delete distinct count sum avg min max case when then else end is null not and or like between union all asc desc create table'.split(' '));
  const JS_KEYWORDS = new Set('const let var function return if else for of in while do switch case break continue class extends import from export default new null undefined true false async await try catch finally throw typeof instanceof this'.split(' '));
  function highlightCodeLine(line, lang) {
    const keywords = lang === 'sql' ? SQL_KEYWORDS : ['js', 'javascript', 'ts', 'typescript', 'json'].includes(lang) ? JS_KEYWORDS : PYTHON_KEYWORDS;
    const token = /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|#.*$|\/\/.*$|--.*$|\b[A-Za-z_][A-Za-z_0-9]*\b|\b\d+(?:\.\d+)?\b)/gm;
    let html = '', start = 0, match;
    while ((match = token.exec(line))) {
      html += escapeHtml(line.slice(start, match.index));
      const word = match[0], lower = word.toLowerCase();
      const kind = /^(#|\/\/|--)/.test(word) ? 'comment'
        : /^['"]/.test(word) ? 'string'
        : /^\d/.test(word) ? 'number'
        : keywords.has(lang === 'sql' ? lower : word) ? 'keyword'
        : /^(print|len|range|list|dict|set|str|int|float|np|pd|self|super)$/.test(word) ? 'builtin'
        : '';
      html += kind ? '<span class="tok-' + kind + '">' + escapeHtml(word) + '</span>' : escapeHtml(word);
      start = token.lastIndex;
    }
    return html + escapeHtml(line.slice(start));
  }
  function codeEditor(source, rawLanguage) {
    const lang = String(rawLanguage || 'text').trim().split(/\s+/)[0].toLowerCase();
    const resolved = CODE_LANGUAGES.has(lang) ? lang : 'text';
    const display = ({ py: 'Python', js: 'JavaScript', ts: 'TypeScript', sh: 'Shell' })[resolved] || resolved.toUpperCase();
    const lines = String(source).replace(/\n$/, '').split('\n');
    const content = lines.map((line, index) => '<span class="code-line" data-line="' + (index + 1) + '">' + (highlightCodeLine(line, resolved) || ' ') + '</span>').join('');
    return '<div class="code-editor" role="region" aria-label="' + escapeHtml(display) + ' code example"><div class="code-editor-bar"><span class="code-editor-mark" aria-hidden="true"></span><span>' + escapeHtml(display) + '</span><small>CODE</small></div><pre class="code-editor-pre"><code class="language-' + resolved + '">' + content + '</code></pre></div>';
  }
  function displayOptionText(text) {
    const original = String(text ?? '');
    // Only capitalize prose. Case-sensitive snippets, math, identifiers and literals are preserved.
    if (/^[\s`\\$'"({\[]/.test(original) || original.includes('\n')) return original;
    const match = original.match(/^(\s*)([\p{L}]+)(?=$|[\s,;:.!?])/u);
    if (!match || match[2].length < 2) return original;
    const word = match[2];
    if (/^(?:df|np|pd|nan|none|null|true|false|print|len|range|return|import|from|select|where|valueerror|typeerror|temperature|top_p|max_tokens|efsearch)$/i.test(word)) return original;
    if (/[A-Z_\d]/.test(word)) return original; // Preserve camelCase and case-sensitive identifiers.
    if (/^[a-z]+[.(\[=]/.test(original.trim()) || /^[A-Z]/.test(word)) return original;
    return match[1] + word.charAt(0).toLocaleUpperCase('vi-VN') + word.slice(1) + original.slice(match[0].length);
  }
  function safeSvg(source) {
    const fallback = `<pre><code>${escapeHtml(source)}</code></pre>`;
    try {
      const svg = new DOMParser().parseFromString(source, 'image/svg+xml').documentElement;
      if (svg.localName !== 'svg') return fallback;
      const tags = new Set(['svg', 'g', 'defs', 'marker', 'line', 'path', 'rect', 'circle', 'ellipse', 'polyline', 'polygon', 'text', 'tspan']);
      const attrs = new Set(['xmlns', 'viewBox', 'width', 'height', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'rx', 'ry', 'd', 'points', 'transform', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'stroke-dasharray', 'stroke-opacity', 'fill-opacity', 'opacity', 'font-size', 'font-weight', 'font-family', 'text-anchor', 'dominant-baseline', 'marker-end', 'marker-start', 'id', 'refX', 'refY', 'markerWidth', 'markerHeight', 'markerUnits', 'orient', 'preserveAspectRatio', 'role', 'aria-label', 'dx', 'dy']);
      function scrub(el) {
        if (!tags.has(el.localName)) { el.remove(); return; }
        for (const attr of [...el.attributes]) {
          if (!attrs.has(attr.name) || /[<>]|javascript:|data:|expression\s*\(/i.test(attr.value) || (/url\s*\(/i.test(attr.value) && !/^url\(#[A-Za-z0-9_-]+\)$/.test(attr.value.trim()))) el.removeAttribute(attr.name);
        }
        for (const child of [...el.children]) scrub(child);
      }
      scrub(svg);
      svg.classList.add('study-svg');
      return svg.outerHTML;
    } catch { return fallback; }
  }
  function markdown(value) {
    const lines = String(value || '').replace(/\r/g, '').split('\n');
    let html = '', list = '', code = false, codeLanguage = '', codeLines = [];
    const close = () => { if (list) { html += `</${list}>`; list = ''; } };
    const closeCode = () => {
      const source = codeLines.join('\n');
      html += codeLanguage.trim().toLowerCase() === 'mermaid'
        ? `<figure class="study-diagram" aria-label="Illustrated explanation"><pre class="mermaid">${escapeHtml(source)}</pre></figure>`
        : codeEditor(source, codeLanguage);
      codeLines = []; codeLanguage = '';
    };
    const cells = line => line.trim().replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/).map(x => x.trim());
    const tableLine = line => /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      if (l.trim().startsWith('```')) {
        close();
        if (code) closeCode();
        else codeLanguage = l.trim().slice(3).trim();
        code = !code; continue;
      }
      if (code) { codeLines.push(l); continue; }
      if (!l.trim()) { close(); continue; }
      if (/^\s*<svg\b/i.test(l)) {
        close(); const svgLines = [l];
        while (!svgLines.at(-1).includes('</svg>') && i + 1 < lines.length) svgLines.push(lines[++i]);
        html += safeSvg(svgLines.join('\n')); continue;
      }
      if (l.includes('|') && i + 1 < lines.length && tableLine(lines[i + 1])) {
        close(); const headers = cells(l); i++;
        html += '<div class="study-table-wrap"><table><thead><tr>' + headers.map(c => `<th>${inlineMd(c)}</th>`).join('') + '</tr></thead><tbody>';
        while (i + 1 < lines.length && lines[i + 1].trim() && lines[i + 1].includes('|')) {
          const row = cells(lines[++i]); html += '<tr>' + headers.map((_, n) => `<td>${inlineMd(row[n] || '')}</td>`).join('') + '</tr>';
        }
        html += '</tbody></table></div>'; continue;
      }
      const h = l.match(/^(#{1,5})\s+(.+)$/);
      if (h) { close(); const n = Math.min(h[1].length + 1, 6); html += `<h${n}>${inlineMd(h[2])}</h${n}>`; continue; }
      if (/^\s*---+\s*$/.test(l)) { close(); html += '<hr>'; continue; }
      if (/^\s*>\s?/.test(l)) { close(); html += `<blockquote>${inlineMd(l.replace(/^\s*>\s?/, ''))}</blockquote>`; continue; }
      const m = l.match(/^\s*([-*]|\d+\.)\s+(.+)$/);
      if (m) { const next = /\d/.test(m[1][0]) ? 'ol' : 'ul'; if (list !== next) { close(); html += `<${next}>`; list = next; } html += `<li>${inlineMd(m[2])}</li>`; continue; }
      close();
      html += `<p>${inlineMd(l)}</p>`;
    }
    close(); if (code) closeCode(); return html;
  }

  function showView(view) {
    if (!titleOf[view]) view = 'overview';
    activeView = view;
    Object.keys(titleOf).forEach(k => { $('view-' + k).classList.toggle('hidden', k !== view); document.querySelectorAll(`[data-nav="${k}"]`).forEach(x => x.classList.toggle('active', k === view)); });
    $('current-nav').textContent = titleOf[view];
    if (view === 'overview') refreshDashboard();
    if (view === 'practice') renderPractice();
    if (view === 'community') window.StudyCommunity?.activate();
    if (view === 'library') renderLibrary();
    if (view === 'roadmap') { renderRoadmap(); renderCheatIndex(); }
    if (view === 'tfg-guide') loadTfgGuide();
    if (view === 'tfg-tests') renderTfgTests();
    if (view === 'shl-practice') renderShlPractice();
    window.location.hash = view;
    window.scrollTo({ top: 0, behavior: 'instant' });
    typeset();
  }
  function answeredToday() { const d = todayKey(); return Object.values(state.results).filter(r => r.date === d).length; }
  function refreshDashboard() {
    if (!data) return;
    const results = Object.values(state.results), scored = results.filter(x => typeof x.ok === 'boolean');
    const correct = scored.filter(x => x.ok).length;
    const wrong = scored.length - correct;
    $('stat-total').textContent = fmt(data.questions.length);
    $('stat-done').textContent = fmt(results.length);
    $('stat-done-sub').textContent = `${((results.length / data.questions.length) * 100).toFixed(1)}% of question bank`;
    $('stat-accuracy').textContent = scored.length ? `${Math.round(correct / scored.length * 100)}%` : '—';
    $('stat-wrong').textContent = fmt(wrong);
    const t = answeredToday(); $('goal-text').textContent = `${t}/15`; $('goal-fill').style.width = `${Math.min(100, t / 15 * 100)}%`;
    $('today-label').textContent = new Intl.DateTimeFormat('en-US', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
    $('mini-lessons').innerHTML = data.sets.filter(s => s.bank === 'vin20k' && /^Day/.test(s.code)).slice(0, 3).map((s, i) => `<button class="mini-lesson" data-day="${i + 1}"><span>${String(i + 1).padStart(2, '0')}</span><b>${escapeHtml(displaySetTitle(s.title))}</b>${icon('chevron')}</button>`).join('');
  }
  function chooseSetOptions(bankId, selectId, emptyLabel) {
    const select = $(selectId), current = select.value;
    const sets = data.sets.filter(s => bankId === 'all' || s.bank === bankId);
    select.innerHTML = `<option value="all">${escapeHtml(emptyLabel)}</option>` + sets.map(s => `<option value="${s.id}">${escapeHtml(s.code + ' · ' + displaySetTitle(s.title))} (${s.count})</option>`).join('');
    if (sets.some(s => s.id === current)) select.value = current;
  }
  // One primary domain per source set. These are editorial learning categories,
  // distinct from the original source labels and preserved set/question IDs.
  const SET_DOMAINS = [
    { id: 'math', title: 'Math & Statistics', description: 'Algebra, calculus, probability, statistics and quantitative reasoning.' },
    { id: 'code', title: 'Programming & Data', description: 'Python, SQL, algorithms, data processing and pipelines.' },
    { id: 'ml', title: 'Machine Learning & Deep Learning', description: 'ML, deep learning, NLP, computer vision and evaluation.' },
    { id: 'genai', title: 'LLM, RAG & Agent', description: 'Language models, retrieval, prompting and agents.' },
    { id: 'product', title: 'AI Products & System Design', description: 'Product requirements, architecture, design and use cases.' },
    { id: 'ops', title: 'MLOps & Operations', description: 'Deployment, monitoring, logging and troubleshooting.' },
    { id: 'safety', title: 'Logic, Ethics & AI Safety', description: 'Critical thinking, security, privacy, fairness and regulation.' },
    { id: 'general', title: 'General & Advanced', description: 'Advanced sets covering several knowledge areas.' }
  ];
  const SET_GROUPS = {
    exam: { title: 'Full-length Mock Exams', description: 'Assessment tests, 60 questions · 90 minutes · graded at the end.' },
    roadmap: { title: '15-Day Study Plan', description: 'One topic per day, from foundations to AI applications and operations.' }
  };
  const VIN_DOMAINS = {
    'vin-day-01': 'genai', 'vin-day-02': 'product', 'vin-day-03': 'genai',
    'vin-day-04': 'genai', 'vin-day-05': 'product', 'vin-day-06': 'product',
    'vin-day-07': 'code', 'vin-day-08': 'genai', 'vin-day-09': 'genai',
    'vin-day-10': 'code', 'vin-day-11': 'safety', 'vin-day-12': 'ops',
    'vin-day-13': 'ops', 'vin-day-14': 'ml', 'vin-day-15': 'general',
    'vin-quantitative': 'math', 'vin-specialized-01': 'product',
    'vin-specialized-02': 'safety', 'vin-specialized-03': 'ops',
    'vin-specialized-04': 'genai'
  };
  const setCategory = s => s.kind === 'full' ? 'exam' : /^vin-day-\d{2}$/.test(s.id) ? 'roadmap' : 'topic';
  function setDomain(s) {
    if (s.bank === 'tfg27' || s.bank === 'shl') return s.domain || 'general';
    if (s.bank === 'vin20k') return VIN_DOMAINS[s.id] || 'general';
    if (s.bank === 'ai20k') {
      if (s.kind === 'full') return 'general';
      const n = Number(s.id.match(/^ai-T(\d+)$/)?.[1]);
      if (n <= 4) return 'math';
      if (n <= 8) return 'code';
      return ({ 9: 'ml', 10: 'genai', 11: 'ops', 12: 'safety' })[n] || 'general';
    }
    if (s.bank === 'hirin') {
      if (s.code.startsWith('A')) return 'math';
      if (s.code.startsWith('B')) return 'code';
      if (s.code === 'C6') return 'ops';
      if (s.code === 'C7') return 'product';
      if (s.code === 'C9') return 'genai';
      if (s.code.startsWith('C')) return 'ml';
      if (s.code === 'D10') return 'product';
      if (s.code.startsWith('D')) return 'safety';
    }
    return 'general';
  }
  function renderSetExplorer() {
    if (!data) return;
    $('set-explorer-summary').textContent = `${data.sets.length} question sets · ${data.sets.filter(s => s.kind === 'full').length} timed mock exams · ${fmt(data.questions.length)} unique questions`;
    $('set-source').value = setBrowserBank;
    $('set-domain').value = setBrowserDomain;
    $('set-explorer').dataset.mode = setBrowserMode;
    $('set-result-heading').textContent = ({ exam: 'Choose a mock exam', roadmap: 'Choose a study day', topic: 'Choose a topic', all: 'All question sets' })[setBrowserMode];
    const filterCount = Number(setBrowserBank !== 'all') + Number(setBrowserDomain !== 'all');
    $('set-filter-indicator').textContent = filterCount ? `· ${filterCount} active` : '';
    $('set-filter-drawer').classList.toggle('has-active-filter', Boolean(filterCount));
    document.querySelectorAll('[data-set-mode]').forEach(button => {
      const active = button.dataset.setMode === setBrowserMode;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
      const count = data.sets.filter(s => button.dataset.setMode === 'all' || setCategory(s) === button.dataset.setMode).length;
      button.querySelector('span').textContent = count;
    });
    const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').toLowerCase();
    const query = normalize($('set-search').value.trim());
    const matches = data.sets.filter(s =>
      (setBrowserBank === 'all' || s.bank === setBrowserBank) &&
      (setBrowserMode === 'all' || setCategory(s) === setBrowserMode) &&
      (setBrowserDomain === 'all' || setDomain(s) === setBrowserDomain) &&
      normalize(`${s.code} ${s.title} ${displaySetTitle(s.title)} ${s.group} ${displayGroup(s.group)} ${bankLabel(s.bank)} ${SET_DOMAINS.find(d => d.id === setDomain(s))?.title || ''}`).includes(query)
    );
    const completedCounts = new Map();
    data.questions.forEach(q => { if (state.results[q.id]) completedCounts.set(q.setId, (completedCounts.get(q.setId) || 0) + 1); });
    mockSets.forEach(s => completedCounts.set(s.id, s.questionIds.filter(id => state.results[id]).length));
    const pageSize = 12;
    const pageCount = Math.max(1, Math.ceil(matches.length / pageSize));
    setBrowserPage = Math.max(0, Math.min(setBrowserPage, pageCount - 1));
    const start = setBrowserPage * pageSize;
    const visibleSets = matches.slice(start, start + pageSize);
    const groups = new Map();
    visibleSets.forEach(s => {
      const group = setCategory(s) === 'topic' ? setDomain(s) : setCategory(s);
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group).push(s);
    });
    const order = ['exam', 'roadmap', ...SET_DOMAINS.map(d => d.id)];
    $('set-groups').innerHTML = order.filter(id => groups.has(id)).map((id, index) => {
      const info = SET_GROUPS[id] || SET_DOMAINS.find(d => d.id === id);
      const sets = groups.get(id);
      return `<section class="set-group" aria-label="${escapeHtml(info.title)}"><div class="set-group-heading"><div><h3>${escapeHtml(info.title)}</h3><p>${escapeHtml(info.description)}</p></div></div><div class="set-rows">${sets.map(s => {
        const completed = completedCounts.get(s.id) || 0;
        const isExam = s.kind === 'full';
        const description = s.description || SET_GROUPS[setCategory(s)]?.description || SET_DOMAINS.find(d => d.id === setDomain(s))?.description || 'A practice set for your chosen topic.';
        const progress = Math.min(100, Math.round(completed / Math.max(1, s.count) * 100));
        return `<article class="set-row"><div class="set-card-head"><span class="set-row-code">${escapeHtml(s.code)}</span><span class="set-card-source">${escapeHtml(bankLabel(s.bank))}</span></div>
          <h3 class="set-card-title">${escapeHtml(displaySetTitle(s.title))}</h3>
          <div class="set-card-meta"><span>${icon('book')} ${fmt(s.count)} questions</span><span>${icon('clock')} ${isExam ? `${s.minutes || 90} minutes` : 'Untimed'}</span></div>
          <div class="set-card-progress"><span>${completed ? `Practiced ${fmt(completed)}/${fmt(s.count)} questions` : 'Not started'}</span><span>${completed ? progress + '%' : ''}</span></div>
          <div class="set-card-progress-track"><span style="width:${progress}%"></span></div>
          <div class="set-row-actions"><details class="set-card-details"><summary>Set details <span aria-hidden="true">⌄</span></summary><p>${escapeHtml(description)}</p><p>${isExam ? 'Results are graded after submission.' : 'Check answers and explanations during practice.'}</p><button type="button" class="set-row-custom" data-pick-set="${escapeHtml(s.id)}">Customize question count and mode →</button></details><button type="button" class="set-row-launch" data-launch-set="${escapeHtml(s.id)}" aria-label="Start ${escapeHtml(s.code + ' ' + displaySetTitle(s.title))}">${isExam ? 'Take exam' : 'Practice now'} <span aria-hidden="true">→</span></button></div></article>`;
      }).join('')}</div></section>`;
    }).join('');
    $('set-empty').classList.toggle('hidden', matches.length > 0);
    $('set-explorer-total').textContent = `${matches.length} sets · ${fmt(matches.reduce((sum, s) => sum + s.count, 0))} questions`;
    $('set-pagination').innerHTML = matches.length > pageSize ? `<span>Showing ${start + 1}–${Math.min(start + pageSize, matches.length)} of ${matches.length} sets</span><div><button type="button" data-set-page="prev" ${setBrowserPage === 0 ? 'disabled' : ''} aria-label="Previous page">← Previous</button><strong>Page ${setBrowserPage + 1} / ${pageCount}</strong><button type="button" data-set-page="next" ${setBrowserPage === pageCount - 1 ? 'disabled' : ''} aria-label="Next page">Next →</button></div>` : '';
  }
  function pickSet(id) {
    const set = data.sets.find(s => s.id === id);
    if (!set) return;
    $('practice-bank').value = set.bank;
    chooseSetOptions(set.bank, 'practice-set', 'All topics');
    $('practice-set').value = set.id;
    $('practice-count').value = 'all';
    $('practice-mode').value = set.kind === 'full' ? 'exam' : 'learn';
    $('practice-wrong').checked = false;
    $('practice-star').checked = false;
    $('custom-study-title').textContent = `Customize: ${displaySetTitle(set.title)}`;
    $('custom-study').open = true;
    refreshSetupCount();
    renderSetExplorer();
    $('custom-study').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function launchSet(id) {
    const set = data.sets.find(s => s.id === id);
    if (!set) return;
    const questions = shuffled(mockSets.has(id) ? mockSets.get(id).questionIds.map(qid => byId.get(qid)) : data.questions.filter(q => q.setId === set.id));
    startSession(questions, set.kind === 'full' ? 'exam' : 'learn', set.minutes || 0);
  }
  async function loadTfgGuide() {
    if (tfgGuideLoaded) return;
    try {
      const response = await fetch('/data/tfg27-guide.md');
      if (!response.ok) throw new Error('HTTP ' + response.status);
      $('tfg-guide-body').innerHTML = markdown(await response.text());
      const headings = $('tfg-guide-body').querySelectorAll('h2, h3');
      for (const h of headings) {
        if (h.textContent.includes('Assessment facts')) h.id = 'tfg-guide-top';
        if (h.textContent.includes('Study notes')) h.id = 'tfg-guide-study';
        if (h.textContent.includes('Practice resources')) h.id = 'tfg-guide-resources';
      }
      tfgGuideLoaded = true;
      typeset();
    } catch (err) { $('tfg-guide-body').textContent = 'Could not load revision notes: ' + err.message; }
  }
  function renderTfgTests() {
    if (!data) return;
    const sets = data.sets.filter(s => s.bank === 'tfg27');
    $('tfg-total-questions').textContent = fmt(data.questions.filter(q => q.bank === 'tfg27').length);
    $('tfg-total-sets').textContent = fmt(sets.length);
    const cards = items => items.map(s => `<article class="tfg-test-card"><div class="tfg-test-card-top"><span>${escapeHtml(s.code)}</span><span>${s.kind === 'full' ? 'TIMED MOCK' : 'TOPIC PRACTICE'}</span></div><h3>${escapeHtml(s.title)}</h3><p>${escapeHtml(s.description || 'Review with explanations after each question.')}</p><div class="tfg-test-card-bottom"><span>${fmt(s.count)} questions · ${s.kind === 'full' ? `${s.minutes} min` : 'Untimed'}</span><button type="button" data-launch-set="${escapeHtml(s.id)}">${s.kind === 'full' ? 'Take mock' : 'Start practice'} →</button></div></article>`).join('');
    $('tfg-mock-grid').innerHTML = cards(sets.filter(s => s.kind === 'full'));
    $('tfg-topic-grid').innerHTML = cards(sets.filter(s => s.kind !== 'full'));
  }
  function renderShlPractice() {
    if (!data) return;
    const sets = data.sets.filter(s => s.bank === 'shl');
    $('shl-total-questions').textContent = fmt(data.questions.filter(q => q.bank === 'shl').length);
    $('shl-total-sets').textContent = fmt(sets.length);
    const cards = items => items.map(s => `<article class="tfg-test-card shl-test-card"><div class="tfg-test-card-top"><span>${escapeHtml(s.code)}</span><span>${s.kind === 'full' ? 'TIMED EXAM' : 'TOPIC DRILL'}</span></div><h3>${escapeHtml(s.title)}</h3><p>${escapeHtml(s.description)}</p><div class="tfg-test-card-bottom"><span>${fmt(s.count)} questions · ${s.kind === 'full' ? `${s.minutes} min` : 'Instant feedback'}</span><button type="button" data-launch-set="${escapeHtml(s.id)}">${s.kind === 'full' ? 'Take exam' : 'Practice now'} →</button></div></article>`).join('');
    $('shl-mock-grid').innerHTML = cards(sets.filter(s => s.kind === 'full'));
    $('shl-topic-grid').innerHTML = cards(sets.filter(s => s.kind !== 'full'));
  }
  function eligibleQuestions(bank, setId, wrongOnly = false, starOnly = false) {
    const starred = new Set(state.bookmarks);
    const mock = mockSets.get(setId);
    const selectedIds = mock ? new Set(mock.questionIds) : null;
    return data.questions.filter(q =>
      (bank === 'all' || (bank === 'mixed' ? mixedIds.has(q.id) : q.bank === bank)) &&
      (setId === 'all' || (selectedIds ? selectedIds.has(q.id) : q.setId === setId)) &&
      (!wrongOnly || state.results[q.id]?.ok === false) && (!starOnly || starred.has(q.id)));
  }
  function refreshSetupCount() {
    if (!data) return;
    const matches = eligibleQuestions($('practice-bank').value, $('practice-set').value, $('practice-wrong').checked, $('practice-star').checked);
    $('available-count').textContent = `${fmt(matches.length)} matching questions`;
    $('start-session').disabled = !matches.length;
  }
  function renderPractice() {
    if (!data) return;
    $('set-explorer').classList.toggle('hidden', Boolean(state.session));
    $('custom-study').classList.toggle('hidden', Boolean(state.session));
    $('practice-new').classList.toggle('hidden', !state.session);
    document.querySelector('.practice-heading h1').textContent = state.session ? 'Your study session' : 'Test Library';
    document.querySelector('.practice-heading p').textContent = state.session ? 'Answer each question in turn. Your progress saves automatically.' : 'Browse sets by source and topic, check question count and duration, then start.';
    if (state.session) {
      $('setup-panel').classList.add('hidden'); $('session-panel').classList.remove('hidden');
      renderSession();
    } else {
      $('setup-panel').classList.remove('hidden'); $('session-panel').classList.add('hidden'); refreshSetupCount(); renderSetExplorer();
    }
  }
  const shuffled = arr => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  function startSession(questions, mode = 'learn', minutes = 0) {
    const qs = [...questions];
    if (!qs.length) { toast('No questions match these filters.'); return; }
    state.session = { id: crypto.randomUUID(), ids: qs.map(q => q.id), index: 0, answers: {}, revealed: {}, mode, startedAt: Date.now(), minutes: mode === 'exam' ? (minutes || Math.max(10, qs.length * 1.5)) : 0, submitted: false, review: false };
    save(); showView('practice');
  }
  function startFromSetup() {
    $('setup-error').textContent = '';
    let qs = eligibleQuestions($('practice-bank').value, $('practice-set').value, $('practice-wrong').checked, $('practice-star').checked);
    if (!qs.length) { $('setup-error').textContent = 'No matching questions. Try adjusting the filters.'; return; }
    const max = $('practice-count').value === 'all' ? qs.length : Number($('practice-count').value);
    qs = shuffled(qs).slice(0, max);
    startSession(qs, $('practice-mode').value);
  }
  function answerOk(q, answer) {
    if (!String(answer ?? '').trim()) return null;
    if (q.type === 'mcq') return String(answer).toUpperCase() === String(q.answer).toUpperCase();
    if (q.type === 'numeric') {
      let s = String(answer).trim().replaceAll(' ', '').replace(',', '.');
      let v = Number(s); if (s.includes('/')) { const [a, b] = s.split('/').map(Number); v = a / b; }
      return Number.isFinite(v) && Number.isFinite(Number(q.value)) && Math.abs(v - Number(q.value)) <= Math.max(Number(q.tol) || 0, 1e-9);
    }
    if (q.type === 'output') return [q.value, ...(q.accept || [])].some(x => String(x ?? '').trim().replace(/\s+/g, ' ').toLowerCase() === String(answer).trim().replace(/\s+/g, ' ').toLowerCase());
    return null;
  }
  function recordResult(q, choice, selfAssess = null) {
    const ok = selfAssess === null ? answerOk(q, choice) : selfAssess;
    state.results[q.id] = { ok, date: todayKey(), choice: String(choice ?? '').slice(0, 1500), ts: Date.now() };
    save(); refreshDashboard();
  }
  function checkAndReveal() {
    const s = state.session, q = byId.get(s?.ids[s?.index]); if (!q || s.submitted) return;
    if (q.type !== 'essay' && q.type !== 'code' && !String(s.answers[q.id] ?? '').trim()) { toast('Enter your answer first.'); return; }
    s.revealed[q.id] = true;
    if (q.type !== 'essay' && q.type !== 'code') recordResult(q, s.answers[q.id]);
    save(); renderSession();
  }
  function optionContentHtml(content) {
    if (content.includes('\n')) return markdown(content);
    // Some choices contain an entire numbered sequence on one source line.
    // Only split consecutive 1., 2., ... items to avoid changing prose or math.
    const items = content.split(/[,;]\s*(?=\d{1,2}[.)]\s+)/);
    if (items.length > 1 && items.every((item, index) => new RegExp('^\\s*' + (index + 1) + '[.)]\\s+').test(item))) {
      return '<ol class="option-item-list">' + items.map(item =>
        '<li>' + inlineMd(item.replace(/^\s*\d{1,2}[.)]\s+/, '')) + '</li>'
      ).join('') + '</ol>';
    }
    return inlineMd(content);
  }
  function optionMarkup(q, s, val, key, text) {
    const revealed = s.revealed[q.id] || s.submitted;
    const selected = val === key, good = revealed && q.answer === key, bad = revealed && selected && q.answer !== key;
    const content = displayOptionText(text);
    return `<button type="button" class="option ${selected ? 'selected' : ''} ${good ? 'correct' : ''} ${bad ? 'wrong' : ''}" data-answer="${escapeHtml(key)}" ${revealed ? 'disabled' : ''}><span class="option-letter">${escapeHtml(key)}</span><div class="option-copy">${optionContentHtml(content)}</div></button>`;
  }
  function renderSession() {
    const s = state.session; if (!s) return;
    if (s.submitted && !s.review) { renderResults(); return; }
    $('session-question-map').classList.remove('hidden');
    if (s.mode === 'exam' && !s.submitted && s.minutes && Date.now() >= s.startedAt + s.minutes * 60000) { submitSession(); return; }
    const q = byId.get(s.ids[s.index]); if (!q) { state.session = null; save(); renderPractice(); return; }
    const val = s.answers[q.id] ?? '', revealed = s.revealed[q.id] || s.submitted;
    $('session-label').textContent = s.submitted ? 'REVIEW ANSWERS' : (s.mode === 'exam' ? 'MOCK EXAM' : 'PRACTICE MODE');
    $('session-heading').textContent = displaySetTitle(q.setTitle);
    $('session-progress').style.width = `${(s.index + 1) / s.ids.length * 100}%`;
    const answered = s.ids.filter(id => String(s.answers[id] ?? '').trim()).length;
    $('session-map-summary').textContent = `${answered}/${s.ids.length} answered`;
    $('session-question-list').innerHTML = s.ids.map((id, i) => `<button type="button" data-jump-q="${i}" class="${i === s.index ? 'is-current' : ''} ${String(s.answers[id] ?? '').trim() ? 'is-answered' : ''}" ${i === s.index ? 'aria-current="step"' : ''} aria-label="Question ${i + 1}${state.bookmarks.includes(id) ? ', bookmarked' : ''}">${i + 1}${state.bookmarks.includes(id) ? '<span aria-hidden="true">☆</span>' : ''}</button>`).join('');
    $('session-step').textContent = `${s.index + 1}/${s.ids.length}`;
    $('prev-q').disabled = s.index === 0;
    $('next-q').innerHTML = s.index === s.ids.length - 1 ? (s.submitted ? 'View results →' : s.mode === 'exam' ? 'Submit exam →' : 'Finish →') : `Next question ${icon('arrow')}`;
    const saved = state.bookmarks.includes(q.id), objective = ['mcq', 'numeric', 'output'].includes(q.type);
    const input = q.type === 'mcq'
      ? `<div class="options">${q.options.map(o => optionMarkup(q, s, val, o.key, o.text)).join('')}</div>`
      : `<textarea class="free-answer" id="free-answer" placeholder="${q.type === 'numeric' ? 'Enter a numeric answer...' : q.type === 'output' ? 'Enter the program output...' : 'Enter your solution or ideas...'}" ${revealed ? 'disabled' : ''}>${escapeHtml(val)}</textarea>`;
    const feedback = revealed ? `<div class="feedback ${answerOk(q, val) === false && objective ? 'error' : ''}"><h4>${objective ? (answerOk(q, val) === true ? '✓ Correct!' : 'Answer and explanation') : 'Example solution'}</h4>${objective && q.type === 'mcq' ? `<p><strong>Correct answer: ${escapeHtml(q.answer || '—')}</strong></p>` : ''}${objective && q.type !== 'mcq' ? `<p><strong>Expected result: ${escapeHtml(q.value ?? '—')}</strong></p>` : ''}<div class="rich-text">${markdown(q.explanation)}</div>${q.detail ? `<details><summary>Show detailed explanation</summary><div class="rich-text">${markdown(q.detail)}</div></details>` : ''}${!objective && !s.submitted ? `<div class="session-actions"><button class="btn outline" data-action="self-wrong">Needs review</button><button class="btn primary" data-action="self-right">I understand this question</button></div>` : ''}</div>` : '';
    $('question-stage').innerHTML = `<section class="question-prompt" aria-label="Question ${s.index + 1}"><div class="question-section-label">QUESTION ${s.index + 1} <span>/ ${s.ids.length}</span></div><div class="question-meta"><span class="qchip">${escapeHtml(bankLabel(q.bank))}</span><span class="qchip qtype">${escapeHtml(q.type === 'mcq' ? 'Multiple choice' : q.type === 'essay' ? 'Written response' : q.type === 'code' ? 'Coding' : q.type === 'numeric' ? 'Numeric answer' : 'Output answer')}</span><span class="qchip">${escapeHtml(displayGroup(q.group))}</span><button class="bookmark-btn ${saved ? 'saved' : ''}" data-action="bookmark">${icon('star')} ${saved ? 'Saved' : 'Bookmark'}</button></div><div class="question-title">${markdown(q.prompt)}</div></section><section class="answer-prompt" aria-label="${q.type === 'mcq' ? 'Answer choices' : 'Your answer'}"><div class="answer-section-header"><h4>${q.type === 'mcq' ? 'Answer choices' : 'Your answer'}</h4><span>${q.type === 'mcq' ? 'Select one option' : 'Enter your response below'}</span></div>${input}</section><div class="session-actions">${!revealed && (s.mode === 'learn' || s.submitted) ? `<button class="btn primary" data-action="check">${objective ? 'Check answer' : 'View solution'}</button>` : ''}${q.hint && !revealed ? '<button class="link-button" data-action="hint">Show hint</button>' : ''}</div><div id="question-hint" class="hint-box hidden rich-text">${markdown(q.hint)}</div>${feedback}`;
    if (s.submitted) $('next-q').textContent = s.index === s.ids.length - 1 ? 'View results →' : 'Next question →';
    updateClock(); typeset();
  }
  function answerQuestion(answer) {
    const s = state.session, q = byId.get(s.ids[s.index]); if (!q || s.submitted || s.revealed[q.id]) return;
    s.answers[q.id] = answer;
    if (s.mode === 'learn' && q.type === 'mcq') { s.revealed[q.id] = true; recordResult(q, answer); }
    save(); renderSession();
  }
  function storeTextAnswer() {
    const s = state.session, input = $('free-answer'); if (!s || !input) return;
    const id = s.ids[s.index]; if (s.submitted || s.revealed[id]) return;
    s.answers[id] = input.value; save();
  }
  function submitSession() {
    const s = state.session; if (!s || s.submitted) return;
    storeTextAnswer();
    s.submitted = true; s.review = false;
    for (const id of s.ids) {
      const q = byId.get(id), value = s.answers[id];
      if (value == null || value === '') continue;
      if (q && !state.results[id] && ['mcq', 'numeric', 'output'].includes(q.type)) recordResult(q, value);
      if (q && state.results[id] && ['mcq', 'numeric', 'output'].includes(q.type)) recordResult(q, value);
    }
    save(); renderSession();
    if (s.mode === 'exam') void window.StudyCommunity?.submitSession(s);
  }
  function renderResults() {
    const s = state.session; $('session-label').textContent = 'SESSION RESULTS'; $('session-heading').textContent = 'Session complete!';
    $('session-question-map').open = false;
    $('session-question-map').classList.add('hidden');
    $('session-progress').style.width = '100%'; $('session-step').textContent = `${s.ids.length} questions`; $('prev-q').disabled = true;
    $('next-q').textContent = 'Start a new session →';
    const scored = s.ids.map(id => ({ id, q: byId.get(id), val: s.answers[id] })).filter(x => x.q);
    const objective = scored.filter(x => ['mcq', 'numeric', 'output'].includes(x.q.type) && String(x.val ?? '').trim());
    const correct = objective.filter(x => answerOk(x.q, x.val)).length;
    $('question-stage').innerHTML = `<div class="result-grid"><div class="result-stat"><b>${correct}/${objective.length}</b><small>Correct / graded</small></div><div class="result-stat"><b>${scored.filter(x => String(x.val ?? '').trim()).length}</b><small>Answered</small></div><div class="result-stat"><b>${objective.length ? Math.round(correct / objective.length * 100) : 0}%</b><small>Accuracy</small></div></div><p>Select a question to review its answer and explanation. Written and coding responses require self-assessment.</p>${s.mode === 'exam' && s.ids.length >= 10 ? '<div class="community-result-link"><button type="button" class="btn outline" data-community-share>Share exam score with study group →</button><span id="community-sync-hint" aria-live="polite"></span></div>' : ''}<div class="result-list">${scored.map((x, i) => `<div class="result-line"><button data-review="${i}">Question ${i + 1}: ${escapeHtml(x.q.prompt.slice(0, 65))}${x.q.prompt.length > 65 ? '…' : ''}</button><span>${String(x.val ?? '').trim() ? answerOk(x.q, x.val) === true ? '✓ Correct' : answerOk(x.q, x.val) === false ? '✗ Incorrect' : 'Written response' : '— Skipped'}</span></div>`).join('')}</div>`;
  }
  function updateClock() {
    const s = state.session;
    if (!s || !s.minutes || s.submitted) { $('session-clock').textContent = s && s.submitted ? 'Submitted' : 'Untimed'; return; }
    const sec = Math.max(0, Math.ceil((s.startedAt + s.minutes * 60000 - Date.now()) / 1000));
    $('session-clock').textContent = `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
    if (sec === 0) submitSession();
  }
  function moveNext() {
    const s = state.session; if (!s) return;
    storeTextAnswer();
    if (s.submitted && s.index === s.ids.length - 1) { s.review = false; save(); renderSession(); return; }
    if (s.index < s.ids.length - 1) { s.index++; save(); renderSession(); return; }
    if (s.submitted) { s.review = false; save(); renderSession(); return; }
    submitSession();
  }

  function renderLibrary() {
    if (!data) return;
    const term = $('search-input').value.trim().toLocaleLowerCase('vi-VN');
    const bank = $('library-bank').value, setId = $('library-set').value, status = $('library-status').value;
    const stars = new Set(state.bookmarks);
    const selectedIds = mockSets.has(setId) ? new Set(mockSets.get(setId).questionIds) : null;
    libraryMatches = data.questions.filter(q => {
      if (bank !== 'all' && (bank === 'mixed' ? !mixedIds.has(q.id) : q.bank !== bank)) return false;
      if (setId !== 'all' && (selectedIds ? !selectedIds.has(q.id) : q.setId !== setId)) return false;
      const result = state.results[q.id];
      if (status === 'todo' && result) return false;
      if (status === 'correct' && result?.ok !== true) return false;
      if (status === 'wrong' && result?.ok !== false) return false;
      if (status === 'star' && !stars.has(q.id)) return false;
      return !term || `${q.prompt} ${q.topic} ${q.setTitle} ${displaySetTitle(q.setTitle)} ${q.group} ${displayGroup(q.group)}`.toLocaleLowerCase('vi-VN').includes(term);
    });
    const pageSize = 16, pages = Math.max(1, Math.ceil(libraryMatches.length / pageSize));
    libraryPage = Math.min(libraryPage, pages - 1);
    $('library-count').textContent = `${fmt(libraryMatches.length)} questions`;
    $('lib-page').textContent = `${libraryPage + 1} / ${pages}`;
    $('lib-prev').disabled = libraryPage === 0; $('lib-next').disabled = libraryPage >= pages - 1;
    $('question-list').innerHTML = libraryMatches.length ? libraryMatches.slice(libraryPage * pageSize, (libraryPage + 1) * pageSize).map((q, i) => {
      const result = state.results[q.id];
      return `<button class="question-row" data-question="${escapeHtml(q.id)}"><span class="question-row-index">${String(libraryPage * pageSize + i + 1).padStart(2, '0')}</span><div class="question-row-main"><strong>${escapeHtml(q.prompt.replace(/\s+/g, ' ').slice(0, 180))}</strong><div class="question-row-meta"><span>${escapeHtml(bankLabel(q.bank))}</span><span>${escapeHtml(displaySetTitle(q.setTitle))}</span><span>${result?.ok === true ? '✓ Correct' : result?.ok === false ? '↻ Review' : result ? 'Viewed' : 'Not attempted'}</span>${stars.has(q.id) ? '<span>★</span>' : ''}</div></div>${icon('chevron')}</button>`;
    }).join('') : `<div class="panel"><h3>No questions found</h3><p>Try a shorter search or change the filters.</p></div>`;
  }
  function renderRoadmap() {
    if (!data) return;
    const days = data.sets.filter(s => s.bank === 'vin20k' && /^Day/.test(s.code));
    $('day-grid').innerHTML = days.map((s, i) => `<button class="day-btn ${selectedDay === i + 1 ? 'active' : ''}" data-day="${i + 1}"><span class="day-number">${String(i + 1).padStart(2, '0')}</span><span><strong>${escapeHtml(displaySetTitle(s.title))}</strong><small>${s.count} questions</small></span>${icon('chevron')}</button>`).join('');
  }
  function setStudyTab(tab) {
    studyTab = tab === 'cheats' ? 'cheats' : 'lessons';
    $('study-lessons').classList.toggle('hidden', studyTab !== 'lessons');
    $('study-cheats').classList.toggle('hidden', studyTab !== 'cheats');
    document.querySelectorAll('[data-study-tab]').forEach(button => {
      const selected = button.dataset.studyTab === studyTab;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    if (studyTab === 'cheats') {
      renderCheatIndex();
      if (!activeCheat && cheatIndex.length) openCheat(cheatIndex[0].file);
    }
  }
  function renderCheatIndex() {
    const term = $('cheat-search').value.trim().toLocaleLowerCase('vi-VN');
    const sheets = cheatIndex.filter(s => !term || `${s.title} ${displayCheatTitle(s.file, s.title)} ${s.file}`.toLocaleLowerCase('vi-VN').includes(term));
    $('cheat-count').textContent = `${sheets.length}/${cheatIndex.length} formula sheets`;
    $('cheat-list').innerHTML = sheets.length ? sheets.map(sheet => `<button type="button" class="day-btn cheat-btn ${sheet.file === activeCheat ? 'active' : ''}" data-cheat="${escapeHtml(sheet.file)}"><span class="day-number">${escapeHtml(sheet.file.replace('.json', ''))}</span><span><strong>${escapeHtml(displayCheatTitle(sheet.file, sheet.title))}</strong><small>${sheet.count} reference items</small></span>${icon('chevron')}</button>`).join('') : '<p class="cheat-empty">No matching cheat sheets.</p>';
  }
  async function openCheat(file) {
    const entry = cheatIndex.find(s => s.file === file);
    if (!entry) return;
    activeCheat = file;
    renderCheatIndex();
    const panel = $('cheat-panel');
    panel.innerHTML = '<p class="muted">Loading formula sheet...</p>';
    try {
      const response = await fetch('/sources/ai-quiz/data/cheatsheets/' + encodeURIComponent(file));
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const sheet = await response.json();
      if (activeCheat !== file) return;
      panel.innerHTML = `<div class="lesson-header"><span class="mini-tag">HIRIN AI QUIZ · ${sheet.items.length} ITEMS</span><h2>${escapeHtml(displayCheatTitle(file, sheet.title))}</h2><button type="button" class="btn primary" data-action="practice-hirin">Practice Hirin questions ${icon('arrow')}</button></div><div class="formula-list">${sheet.items.map((item, index) => `<article class="formula-card"><div class="formula-index">${String(index + 1).padStart(2, '0')}</div><div class="formula-main"><h3>${escapeHtml(item.name)}</h3>${item.latex ? `<div class="formula-equation">\\[${escapeHtml(item.latex)}\\]</div>` : ''}${item.note ? `<p>${escapeHtml(item.note)}</p>` : ''}</div></article>`).join('')}</div>`;
      typeset();
    } catch (err) { panel.innerHTML = `<p>Could not load formula sheet: ${escapeHtml(err.message)}</p>`; }
  }
  async function openLesson(day) {
    selectedDay = day; setStudyTab('lessons'); showView('roadmap');
    const s = data.sets.find(x => x.id === 'vin-day-' + String(day).padStart(2, '0'));
    const panel = $('lesson-panel');
    panel.innerHTML = `<div class="muted">Opening lesson...</div>`;
    try {
      const response = await fetch(`/sources/vin20k-ai-phase1-quiz/course/day${String(day).padStart(2, '0')}_course.md`);
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const lesson = await response.text();
      panel.innerHTML = `<div class="lesson-header"><span class="mini-tag">DAY ${String(day).padStart(2, '0')}</span><h2>${escapeHtml(displaySetTitle(s?.title || `Day ${day}`))}</h2><button class="btn primary" data-action="day-practice" data-day="${day}">Practice today's 100 questions ${icon('arrow')}</button></div><article class="lesson-body rich-text">${markdown(lesson)}</article>`;
      renderRoadmap(); typeset();
    } catch (err) { panel.innerHTML = `<p>Could not load lesson: ${escapeHtml(err.message)}</p>`; }
  }
  function bind() {
    document.addEventListener('click', event => {
      const modeTab = event.target.closest('[data-set-mode]'); if (modeTab) { setBrowserMode = modeTab.dataset.setMode; setBrowserDomain = 'all'; setBrowserBank = 'all'; setBrowserPage = 0; $('set-search').value = ''; renderSetExplorer(); return; }
      const pageButton = event.target.closest('[data-set-page]'); if (pageButton) { setBrowserPage += pageButton.dataset.setPage === 'next' ? 1 : -1; renderSetExplorer(); $('set-result-heading').scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
      const jumpButton = event.target.closest('[data-jump-q]'); if (jumpButton && state.session) { storeTextAnswer(); state.session.index = Number(jumpButton.dataset.jumpQ); save(); renderSession(); return; }
      const pick = event.target.closest('[data-pick-set]'); if (pick) { pickSet(pick.dataset.pickSet); return; }
      const launch = event.target.closest('[data-launch-set]'); if (launch) { launchSet(launch.dataset.launchSet); return; }
      const study = event.target.closest('[data-study-tab]'); if (study) { setStudyTab(study.dataset.studyTab); return; }
      const cheat = event.target.closest('[data-cheat]'); if (cheat) { openCheat(cheat.dataset.cheat); return; }
      const nav = event.target.closest('[data-nav]'); if (nav) { event.preventDefault(); showView(nav.dataset.nav); return; }
      const share = event.target.closest('[data-community-share]');
      if (share) { void window.StudyCommunity?.submitSession(state.session, { manual: true }); return; }
      const guideAnchor = event.target.closest('#tfg-guide-toc a'); if (guideAnchor) { event.preventDefault(); $(guideAnchor.getAttribute('href').slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
      const day = event.target.closest('[data-day]'); if (day) { openLesson(Number(day.dataset.day)); return; }
      const qbtn = event.target.closest('[data-question]'); if (qbtn) { startSession([byId.get(qbtn.dataset.question)]); return; }
      const review = event.target.closest('[data-review]'); if (review && state.session) { state.session.index = Number(review.dataset.review); state.session.review = true; save(); renderSession(); return; }
      const answer = event.target.closest('[data-answer]'); if (answer) { answerQuestion(answer.dataset.answer); return; }
      const act = event.target.closest('[data-action]'); if (!act) return;
      switch (act.dataset.action) {
        case 'quick-start': startSession(shuffled(data.questions).slice(0, 20)); break;
        case 'mode-start': $('practice-mode').value = act.dataset.mode; setBrowserMode = act.dataset.mode === 'exam' ? 'exam' : 'topic'; setBrowserBank = 'all'; setBrowserDomain = 'all'; state.session = null; save(); showView('practice'); break;
        case 'open-bank': setBrowserBank = act.dataset.bank; setBrowserMode = 'all'; setBrowserDomain = 'all'; $('set-search').value = ''; $('practice-bank').value = act.dataset.bank; chooseSetOptions(act.dataset.bank, 'practice-set', 'All topics'); $('practice-set').value = 'all'; state.session = null; save(); showView('practice'); break;
        case 'restart-setup': state.session = null; $('custom-study').open = false; save(); showView('practice'); break;
        case 'clear-set-filters': setBrowserBank = 'all'; setBrowserDomain = 'all'; setBrowserPage = 0; $('set-search').value = ''; renderSetExplorer(); break;
        case 'bookmark': { const id = state.session.ids[state.session.index], i = state.bookmarks.indexOf(id); if (i >= 0) state.bookmarks.splice(i, 1); else state.bookmarks.push(id); save(); renderSession(); toast(i >= 0 ? 'Bookmark removed.' : 'Question bookmarked for review.'); break; }
        case 'hint': $('question-hint').classList.remove('hidden'); break;
        case 'check': storeTextAnswer(); checkAndReveal(); break;
        case 'self-right': case 'self-wrong': { const q = byId.get(state.session.ids[state.session.index]); recordResult(q, state.session.answers[q.id], act.dataset.action === 'self-right'); renderSession(); toast('Self-assessment saved.'); break; }
        case 'day-practice': { const id = 'vin-day-' + String(act.dataset.day).padStart(2, '0'); startSession(shuffled(data.questions.filter(q => q.setId === id)).slice(0, 100)); break; }
        case 'practice-hirin': { setBrowserBank = 'hirin'; setBrowserMode = 'topic'; setBrowserDomain = 'all'; $('set-search').value = ''; $('practice-bank').value = 'hirin'; chooseSetOptions('hirin', 'practice-set', 'All topics'); $('practice-set').value = 'all'; state.session = null; save(); showView('practice'); break; }
      }
    });
    $('set-search').addEventListener('input', () => { setBrowserPage = 0; renderSetExplorer(); });
    $('set-source').addEventListener('change', () => { setBrowserBank = $('set-source').value; setBrowserPage = 0; renderSetExplorer(); });
    $('set-domain').addEventListener('change', () => { setBrowserDomain = $('set-domain').value; setBrowserPage = 0; renderSetExplorer(); });
    $('practice-bank').addEventListener('change', () => { const bank = $('practice-bank').value; chooseSetOptions(bank, 'practice-set', 'All topics'); refreshSetupCount(); renderSetExplorer(); });
    ['practice-set', 'practice-count', 'practice-mode', 'practice-wrong', 'practice-star'].forEach(id => $(id).addEventListener('change', () => { refreshSetupCount(); if (id === 'practice-set') renderSetExplorer(); }));
    $('start-session').addEventListener('click', startFromSetup);
    $('prev-q').addEventListener('click', () => { if (state.session?.index > 0) { storeTextAnswer(); state.session.index--; save(); renderSession(); } });
    $('next-q').addEventListener('click', () => { if (state.session?.submitted && !state.session.review) { state.session = null; save(); renderPractice(); } else moveNext(); });
    document.addEventListener('input', e => { if (e.target.id === 'free-answer') storeTextAnswer(); });
    ['search-input', 'library-bank', 'library-set', 'library-status'].forEach(id => $(id).addEventListener(id === 'search-input' ? 'input' : 'change', () => { libraryPage = 0; if (id === 'library-bank') chooseSetOptions($('library-bank').value, 'library-set', 'All question sets'); renderLibrary(); }));
    $('cheat-search').addEventListener('input', renderCheatIndex);
    $('lib-prev').addEventListener('click', () => { libraryPage--; renderLibrary(); });
    $('lib-next').addEventListener('click', () => { libraryPage++; renderLibrary(); });
    window.addEventListener('hashchange', () => { const hash = window.location.hash.slice(1); if (hash !== activeView && titleOf[hash]) showView(hash); });
    ticking = setInterval(updateClock, 1000);
    window.addEventListener('load', typeset);
  }
  async function init() {
    try {
      const resp = await fetch('/data/bank.json'); if (!resp.ok) throw new Error('HTTP ' + resp.status);
      data = await resp.json();
      if (!Array.isArray(data.questions) || data.questions.length !== 3301) throw new Error('Question bank data is incomplete');
      byId = new Map(data.questions.map(q => [q.id, q]));
      try {
        const mockResponse = await fetch('/data/mocks.json');
        if (!mockResponse.ok) throw new Error('HTTP ' + mockResponse.status);
        const payload = await mockResponse.json();
        if (payload.version !== 1 || !Array.isArray(payload.sets) || payload.sets.length !== 6) throw new Error('Unexpected mock exam format');
        const existingIds = new Set(data.sets.map(s => s.id));
        const newSets = new Map();
        const usedIds = new Set();
        for (const set of payload.sets) {
          if (!set.id || existingIds.has(set.id) || newSets.has(set.id) || set.bank !== 'mixed' || set.kind !== 'full' ||
              set.count !== 60 || set.minutes !== 90 || !Array.isArray(set.questionIds) || set.questionIds.length !== 60) throw new Error('Invalid mixed exam metadata');
          for (const id of set.questionIds) {
            if (usedIds.has(id) || byId.get(id)?.type !== 'mcq') throw new Error('Invalid or repeated mixed exam question');
            usedIds.add(id);
          }
          newSets.set(set.id, set);
        }
        mockSets = newSets;
        mixedIds = usedIds;
        data.sets = [...mockSets.values(), ...data.sets];
      } catch (error) { console.warn('Could not load additional mixed mock exams', error); }
      try {
        const tfgResp = await fetch('/data/tfg27-questions.json');
        if (!tfgResp.ok) throw new Error('HTTP ' + tfgResp.status);
        const tfg = await tfgResp.json();
        if (tfg.version !== 1 || !Array.isArray(tfg.questions) || !Array.isArray(tfg.sets) || tfg.questions.length < 60) throw new Error('Invalid TFG27 question payload');
        const seen = new Set(byId.keys());
        for (const q of tfg.questions) {
          if (!q.id || seen.has(q.id) || q.bank !== 'tfg27' || !q.prompt || !q.explanation) throw new Error('Invalid TFG27 question');
          if (q.type === 'mcq' && (!Array.isArray(q.options) || q.options.length !== 4 || !q.options.some(o => o.key === q.answer))) throw new Error('Invalid TFG27 answer options');
          seen.add(q.id);
        }
        const setIds = new Set(data.sets.map(s => s.id));
        for (const s of tfg.sets) {
          if (!s.id || setIds.has(s.id) || s.bank !== 'tfg27' || !Number.isInteger(s.count)) throw new Error('Invalid TFG27 set');
          if (s.kind === 'full') {
            if (!Array.isArray(s.questionIds) || s.questionIds.length !== s.count || new Set(s.questionIds).size !== s.count || s.questionIds.some(id => !seen.has(id))) throw new Error('Invalid TFG27 mock');
            mockSets.set(s.id, s);
          } else if (tfg.questions.filter(q => q.setId === s.id).length !== s.count) throw new Error('Invalid TFG27 topic set size');
          setIds.add(s.id);
        }
        data.questions.push(...tfg.questions);
        data.sets.push(...tfg.sets);
        tfg.questions.forEach(q => byId.set(q.id, q));
      } catch (error) { console.error('TFG27 prep content could not load:', error); }
      try {
        const shlResponse = await fetch('/data/shl-practice.json');
        if (!shlResponse.ok) throw new Error('HTTP ' + shlResponse.status);
        const shl = await shlResponse.json();
        if (shl.version !== 1 || !Array.isArray(shl.questions) || shl.questions.length !== 60 || !Array.isArray(shl.sets) || shl.sets.length !== 7) throw Error('SHL practice dataset is incomplete');
        const seen = new Set(byId.keys());
        for (const q of shl.questions) {
          if (!q.id || seen.has(q.id) || q.bank !== 'shl' || !q.prompt || !q.explanation || q.type !== 'mcq' ||
              !Array.isArray(q.options) || ![3, 4].includes(q.options.length) ||
              new Set(q.options.map(o => o.key)).size !== q.options.length || !q.options.some(o => o.key === q.answer)) throw Error(`Invalid SHL question: ${q.id}`);
          seen.add(q.id);
        }
        const existingSetIds = new Set(data.sets.map(s => s.id));
        const referenced = new Set();
        for (const s of shl.sets) {
          if (!s.id || existingSetIds.has(s.id) || s.bank !== 'shl' || !Number.isInteger(s.count) || s.count < 1) throw Error('Invalid SHL practice set');
          if (s.kind === 'full') {
            if (!Array.isArray(s.questionIds) || s.count !== s.questionIds.length ||
                new Set(s.questionIds).size !== s.count || s.questionIds.some(id => !seen.has(id))) throw Error('Invalid SHL mock exam');
            s.questionIds.forEach(id => { if (referenced.has(id)) throw Error('Repeated SHL question in mock exams'); referenced.add(id); });
            mockSets.set(s.id, s);
          } else if (shl.questions.filter(q => q.setId === s.id).length !== s.count) throw Error('Invalid SHL topic set size');
          existingSetIds.add(s.id);
        }
        if (referenced.size !== shl.questions.length) throw Error('SHL mock exams do not cover the bank');
        data.questions.push(...shl.questions);
        data.sets.push(...shl.sets);
        shl.questions.forEach(q => byId.set(q.id, q));
      } catch (error) { console.error('SHL practice could not load:', error); $('shl-mock-grid').textContent = `Could not load SHL practice tests: ${error.message}`; }
      try {
        const sheetResponse = await fetch('/data/cheatsheets-index.json');
        if (sheetResponse.ok) cheatIndex = await sheetResponse.json();
      } catch (error) { console.warn('Could not load formula sheet index', error); }
      // Keep original IDs in byId so saved sessions and published mocks still open.
      const publishedIds = new Set([...mockSets.values()].flatMap(set => set.questionIds));
      data.questions = window.StudyQuestions.unique(data.questions, publishedIds);
      for (const set of data.sets) {
        if (!mockSets.has(set.id)) set.count = data.questions.filter(q => q.setId === set.id).length;
      }
      chooseSetOptions('all', 'practice-set', 'All topics');
      chooseSetOptions('all', 'library-set', 'All question sets');
      bind(); refreshDashboard(); refreshSetupCount();
      const hash = window.location.hash.slice(1); showView(titleOf[hash] ? hash : 'overview');
    } catch (err) { console.error(err); $('stat-total').textContent = 'Data error'; $('setup-error').textContent = `Could not load questions: ${err.message}`; toast('Could not load question bank.'); }
  }
  init();
})();
