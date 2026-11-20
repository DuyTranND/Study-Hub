(() => {
  'use strict';
  const STORAGE_KEY = 'ai20k-study-hub-v1';
  const $ = id => document.getElementById(id);
  const icon = name => `<svg aria-hidden="true"><use href="#i-${name}"/></svg>`;
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const fmt = n => Number(n).toLocaleString('en-US');
  const bankLabel = bank => ({ ai20k: 'AI20K', vin20k: 'Vin20K', hirin: 'Hirin', mixed: '3 sources' }[bank] || bank);
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
  const titleOf = { overview: 'Overview', practice: 'Practice', community: 'Leaderboard', roadmap: 'Lessons' };
  const localKey = () => STORAGE_KEY + (window.StudyAccount?.identity()?.memberId ? ':' + window.StudyAccount.identity().memberId : '');
  const tryStore = () => { try { return JSON.parse(localStorage.getItem(localKey()) || '{}'); } catch { return {}; } };
  const persisted = tryStore();
  const state = {
    results: persisted.results && typeof persisted.results === 'object' ? persisted.results : {},
    bookmarks: Array.isArray(persisted.bookmarks) ? persisted.bookmarks : [],
    session: persisted.session || null,
    lessonDay: Number(persisted.lessonDay) || 0
  };
  let data = null, byId = new Map(), mockSets = new Map(), mixedIds = new Set(), activeView = 'overview',
    selectedDay = state.lessonDay, setBrowserBank = 'all', setBrowserMode = 'exam', setBrowserDomain = 'all', setBrowserAssessment = 'all', setBrowserPage = 0,
    toastTimer = null, mathTimer = null, ticking = null, mermaidReady = false, loadingLesson = false;
  const save = () => { try { localStorage.setItem(localKey(), JSON.stringify(state)); } catch { toast('Could not save your progress. Check your browser storage.'); } window.StudyAccount?.save(state); };
  function toast(message) { const el = $('toast'); el.textContent = message; el.classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('visible'), 2400); }
  function typeset(afterMath = null) {
    clearTimeout(mathTimer);
    mathTimer = setTimeout(() => {
      const math = window.MathJax?.typesetPromise ? window.MathJax.typesetPromise().catch(() => {}) : Promise.resolve();
      if (typeof afterMath === 'function') void math.then(afterMath).catch(() => {});
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
    // Only recognized formulas become explicit TeX; currency stays plain text.
    // A closing dollar cannot be the start of another price, such as $900.
    const protectedTokens = /(`[^`\n]+`|\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|(?<![\\$])\$(?![\s$])(?:[^\n$]*?[^\s\\$]|[A-Za-z'\s]*=\s*)\$(?![\d$]))/g;
    return String(value ?? '').split(protectedTokens).map((part, index) => {
      if (index % 2) {
        if (part.startsWith('`')) return '<code>' + escapeHtml(part.slice(1, -1)) + '</code>';
        if (part.startsWith('$') && !part.startsWith('$$'))
          return escapeHtml('\\(' + part.slice(1, -1).trim() + '\\)');
        return escapeHtml(part);
      }
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
      const mathStart = l.trim().match(/^(\\\[|\$\$)(.*)$/);
      if (mathStart) {
        const opener = mathStart[1], closer = opener === '\\[' ? '\\]' : '$$';
        let end = i, body = mathStart[2];
        while (!body.trimEnd().endsWith(closer) && end + 1 < lines.length) body += '\n' + lines[++end];
        if (body.trimEnd().endsWith(closer)) {
          close(); body = body.trimEnd().slice(0, -closer.length);
          html += '<div class="math-block">' + escapeHtml(opener + body + closer) + '</div>';
          i = end; continue;
        }
      }
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
    if (view === 'roadmap') { renderRoadmap(); if (!loadingLesson && !$('lesson-panel').querySelector('.lesson-body')) void openLesson(selectedDay || 1); }
    window.location.hash = view;
    window.scrollTo({ top: 0, behavior: 'instant' });
    typeset();
  }
  function refreshDashboard() {
    if (!data) return;
    const results = Object.values(state.results), scored = results.filter(x => typeof x.ok === 'boolean');
    const correct = scored.filter(x => x.ok).length;
    const wrong = scored.length - correct;
    $('stat-done').textContent = fmt(results.length);
    $('stat-done-sub').textContent = `${((results.length / data.questions.length) * 100).toFixed(1)}% of question bank`;
    $('stat-accuracy').textContent = scored.length ? `${Math.round(correct / scored.length * 100)}%` : '—';
    $('stat-wrong').textContent = fmt(wrong);
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
    exam: { title: 'Timed Assessments', description: 'Timed assessments grouped by purpose. Check each set for its grading format.' },
    roadmap: { title: '15-Day Study Plan', description: 'One topic per day, from foundations to AI applications and operations.' }
  };
  const ASSESSMENT_TYPES = {
    dgnl: { title: 'ĐGNL — Đánh giá năng lực', short: 'ĐGNL', description: 'Mixed mock exams and foundation assessments covering mathematics, reasoning, programming, data and core AI.' },
    'ai-test': { title: 'AI Test — Chuyên môn AI', short: 'AI Test', description: 'Technical practice for the stage after ĐGNL: AI, programming, data, RAG and applied professional scenarios.' }
  };
  const ASSESSMENT_KIND = {
    'mixed-mock-01': 'dgnl', 'mixed-mock-02': 'dgnl', 'mixed-mock-03': 'dgnl',
    'mixed-mock-04': 'dgnl', 'mixed-mock-05': 'dgnl', 'mixed-mock-06': 'dgnl',
    'ai-E01': 'dgnl', 'ai-E03': 'dgnl',
    'ai-E02': 'ai-test', 'ai-E04': 'ai-test', 'ai-E05': 'ai-test', 'ai-E06': 'ai-test'
  };
  const EXAM_DISPLAY_CODES = { 'ai-E01': 'ĐGNL-01', 'ai-E03': 'ĐGNL-02', 'ai-E02': 'AI-TEST-01', 'ai-E04': 'AI-TEST-02', 'ai-E05': 'AI-TEST-03', 'ai-E06': 'AI-TEST-04' };
  const EXAM_ORDER = ['mixed-mock-01', 'mixed-mock-02', 'mixed-mock-03', 'mixed-mock-04', 'mixed-mock-05', 'mixed-mock-06', 'ai-E01', 'ai-E03', 'ai-E02', 'ai-E04', 'ai-E05', 'ai-E06'];
  const examDisplayCode = set => EXAM_DISPLAY_CODES[set.id] || set.code;
  const ASSESSMENT_NOTES = {
    'ai-E01': 'Broad entry assessment covering math, Python and data, core AI, and critical thinking. Assumes some mathematics and programming background.',
    'ai-E02': 'AI Test practice following ĐGNL, using the AI-TEST format with a stronger programming and data emphasis. Includes coding and written responses.',
    'ai-E03': 'Additional ĐGNL practice combining mathematics, programming, data, core AI and critical thinking.',
    'ai-E04': 'Specialized assessment across five AI domains, including Agentic AI, RAG, MLOps, Product and Fundamentals.',
    'ai-E05': 'Professional decision-making scenarios intended for learners with prior technical or workplace experience.',
    'ai-E06': 'Advanced comprehensive assessment following a longer period of study.'
  };
  const assessmentType = set => ASSESSMENT_KIND[set.id] || 'ai-test';
  const setSection = set => set.kind === 'full' ? assessmentType(set) : /^vin-day-\d{2}$/.test(set.id) ? 'roadmap' : setDomain(set);
  function gradingFormat(set) {
    const questions = mockSets.has(set.id) ? mockSets.get(set.id).questionIds.map(id => byId.get(id)) : data.questions.filter(q => q.setId === set.id);
    const written = questions.filter(q => !['mcq', 'numeric', 'output'].includes(q.type)).length;
    return written ? (questions.length - written) + ' objective · ' + written + ' written/coding' : questions.length + ' multiple-choice · automatic marking';
  }
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
  function codeQuestions() { return data.questions.filter(q => q.type === 'code'); }
  function renderCodeLibrary() {
    const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').toLowerCase();
    const query = normalize($('set-search').value.trim());
    const qs = codeQuestions().filter(q => normalize(q.id + ' ' + q.topic + ' ' + q.prompt).includes(query));
    $('set-result-heading').textContent = 'Code tay';
    $('set-explorer-summary').textContent = 'Tự viết lời giải từ yêu cầu đề · Python, pandas, thuật toán và SQL';
    $('set-explorer-total').textContent = qs.length + ' bài code';
    $('set-pagination').innerHTML = '';
    $('set-empty').classList.toggle('hidden', qs.length > 0);
    $('set-groups').innerHTML = '<div class="code-library-intro"><div><h3>Đọc đề, tự viết, rồi đối chiếu</h3><p>Mỗi bài có yêu cầu và dữ liệu hoặc quy tắc đầu vào/đầu ra. Bài nháp tự lưu. Xem lời giải tham khảo và tự đánh giá khi bạn sẵn sàng.</p><small>Chế độ viết tay: không thực thi code hoặc chấm bằng test tự động.</small></div><button class="btn primary" data-action="code-all">Luyện cả bộ (' + codeQuestions().length + ' bài)</button></div><div class="code-task-list">' + qs.map(q => '<article class="code-task-card"><div><span class="mini-tag">' + escapeHtml(q.id.replace('a:', '')) + ' · ' + (q.id.startsWith('a:T08') ? 'SQL' : 'Python') + '</span><h3>' + escapeHtml(q.topic) + '</h3><p>' + escapeHtml(q.prompt.replace(/\*\*/g, '').split('\n')[0]) + '</p><small>' + (state.results[q.id] ? 'Đã tự đánh giá' : 'Chưa tự đánh giá') + '</small></div><button class="btn outline" data-code-question="' + escapeHtml(q.id) + '">Viết code →</button></article>').join('') + '</div>';
  }
  function codeAnswerInput(q, val, submitted, index) {
    const language = q.id.startsWith('a:T08') ? 'SQL' : 'Python';
    const inputId = 'answer-' + index, helpId = 'hand-code-help-' + index;
    return '<div class="hand-code-editor"><div class="hand-code-toolbar"><label for="' + inputId + '">Bài làm của bạn · ' + language + '</label><span>Code tay</span></div><textarea class="free-answer hand-code-input" id="' + inputId + '" data-free-answer="' + escapeHtml(q.id) + '" aria-label="Viết code ' + language + ' cho câu ' + (index + 1) + '" aria-describedby="' + helpId + '" maxlength="10000" spellcheck="false" autocapitalize="off" autocorrect="off" placeholder="Viết lời giải của bạn ở đây…" ' + (submitted ? 'disabled' : '') + '>' + escapeHtml(val) + '</textarea><p class="hand-code-help" id="' + helpId + '">Bản nháp tự lưu · Tab: thụt 4 dấu cách · Esc rồi Tab: rời ô code. Tối đa 10.000 ký tự. Không chạy code tự động.</p></div>';
  }
  function renderSetExplorer() {
    if (!data) return;
    $('set-explorer-summary').textContent = `${data.sets.length} question sets · ${data.sets.filter(s => s.kind === 'full').length} timed assessments · ${fmt(data.questions.length)} unique questions`;
    $('set-source').value = setBrowserBank;
    $('set-domain').value = setBrowserDomain;
    const assessmentCounts = new Map();
    data.sets.filter(set => set.kind === 'full').forEach(set => assessmentCounts.set(assessmentType(set), (assessmentCounts.get(assessmentType(set)) || 0) + 1));
    $('set-assessment-type').innerHTML = '<option value="all">All stages</option>' + Object.entries(ASSESSMENT_TYPES).filter(([id]) => assessmentCounts.has(id)).map(([id, info]) => '<option value="' + id + '">' + escapeHtml(info.title) + ' (' + assessmentCounts.get(id) + ')</option>').join('');
    $('set-assessment-type').value = setBrowserAssessment;
    $('set-assessment-filter').classList.toggle('hidden', !['exam', 'all'].includes(setBrowserMode));
    $('set-explorer').dataset.mode = setBrowserMode;
    $('set-filter-drawer').classList.toggle('hidden', setBrowserMode === 'code');
    $('set-result-heading').textContent = ({ exam: 'ĐGNL & AI Test', roadmap: 'Choose a study day', topic: 'Choose a topic', all: 'All question sets' })[setBrowserMode];
    const filterCount = Number(setBrowserBank !== 'all') + Number(setBrowserDomain !== 'all') + Number(setBrowserAssessment !== 'all');
    $('set-filter-indicator').textContent = filterCount ? `· ${filterCount} active` : '';
    $('set-filter-drawer').classList.toggle('has-active-filter', Boolean(filterCount));
    document.querySelectorAll('[data-set-mode]').forEach(button => {
      const active = button.dataset.setMode === setBrowserMode;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
      const count = button.dataset.setMode === 'code' ? codeQuestions().length : data.sets.filter(s => button.dataset.setMode === 'all' || setCategory(s) === button.dataset.setMode).length;
      button.querySelector('span').textContent = count;
    });
    const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').toLowerCase();
    const query = normalize($('set-search').value.trim());
    if (setBrowserMode === 'code') { renderCodeLibrary(); return; }
    const order = [...Object.keys(ASSESSMENT_TYPES), 'roadmap', ...SET_DOMAINS.map(d => d.id)];
    const matches = data.sets.filter(s =>
      (setBrowserBank === 'all' || s.bank === setBrowserBank) &&
      (setBrowserMode === 'all' || setCategory(s) === setBrowserMode) &&
      (setBrowserAssessment === 'all' || (s.kind === 'full' && assessmentType(s) === setBrowserAssessment)) &&
      (setBrowserDomain === 'all' || setDomain(s) === setBrowserDomain) &&
      normalize(`${examDisplayCode(s)} ${s.title} ${displaySetTitle(s.title)} ${s.group} ${displayGroup(s.group)} ${bankLabel(s.bank)} ${SET_DOMAINS.find(d => d.id === setDomain(s))?.title || ''} ${s.kind === 'full' ? ASSESSMENT_TYPES[assessmentType(s)].title + ' ' + (ASSESSMENT_NOTES[s.id] || '') : ''}`).includes(query)
    ).sort((a, b) => {
      const section = order.indexOf(setSection(a)) - order.indexOf(setSection(b));
      if (section || a.kind !== 'full' || b.kind !== 'full') return section;
      const rank = set => EXAM_ORDER.includes(set.id) ? EXAM_ORDER.indexOf(set.id) : EXAM_ORDER.length;
      return rank(a) - rank(b);
    });
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
      const group = setSection(s);
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group).push(s);
    });
    $('set-groups').innerHTML = order.filter(id => groups.has(id)).map((id, index) => {
      const info = ASSESSMENT_TYPES[id] || SET_GROUPS[id] || SET_DOMAINS.find(d => d.id === id);
      const sets = groups.get(id);
      return `<section class="set-group" data-set-group="${escapeHtml(id)}" aria-label="${escapeHtml(info.title)}"><div class="set-group-heading"><div><h3>${escapeHtml(info.title)}</h3><p>${escapeHtml(info.description)}</p></div></div><div class="set-rows">${sets.map(s => {
        const completed = completedCounts.get(s.id) || 0;
        const isExam = s.kind === 'full';
        const description = ASSESSMENT_NOTES[s.id] || s.description || SET_GROUPS[setCategory(s)]?.description || SET_DOMAINS.find(d => d.id === setDomain(s))?.description || 'A practice set for your chosen topic.';
        const progress = Math.min(100, Math.round(completed / Math.max(1, s.count) * 100));
        return `<article class="set-row"><div class="set-card-head"><span class="set-row-code">${escapeHtml(examDisplayCode(s))}</span><span class="set-card-source">${escapeHtml(bankLabel(s.bank))}</span></div>
          <h3 class="set-card-title">${escapeHtml(displaySetTitle(s.title))}</h3>
          ${isExam ? `<span class="set-assessment-kind">${escapeHtml(ASSESSMENT_TYPES[assessmentType(s)].short + (s.bank === 'mixed' ? ' · Mock exam' : ''))}</span>` : ''}
          <div class="set-card-meta"><span>${icon('book')} ${fmt(s.count)} questions</span><span>${icon('clock')} ${isExam ? `${s.minutes || 90} minutes` : 'Untimed'}</span></div>
          ${isExam ? `<p class="set-grading-format">${escapeHtml(gradingFormat(s))}</p>` : ''}
          <div class="set-card-progress"><span>${completed ? `Practiced ${fmt(completed)}/${fmt(s.count)} questions` : 'Not started'}</span><span>${completed ? progress + '%' : ''}</span></div>
          <div class="set-card-progress-track"><span style="width:${progress}%"></span></div>
          <div class="set-row-actions"><details class="set-card-details"><summary>Set details <span aria-hidden="true">⌄</span></summary><p>${escapeHtml(description)}</p><p>${isExam ? 'Objective answers are marked after submission. Written and coding responses need separate review.' : 'Check answers and explanations during practice.'}</p><button type="button" class="set-row-custom" data-pick-set="${escapeHtml(s.id)}">Customize question count and mode →</button></details><button type="button" class="set-row-launch" data-launch-set="${escapeHtml(s.id)}" aria-label="Start ${escapeHtml(examDisplayCode(s) + ' ' + displaySetTitle(s.title))}">${isExam ? 'Take exam' : 'Practice now'} <span aria-hidden="true">→</span></button></div></article>`;
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
    if (state.session?.ids.length && state.session.ids.every(id => byId.get(id)?.type === 'code')) setBrowserMode = 'code';
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
    state.session = { id: crypto.randomUUID(), ids: qs.map(q => q.id), index: 0, answers: {}, revealed: {}, flagged: [], mode, startedAt: Date.now(), minutes: mode === 'exam' ? (minutes || Math.max(10, qs.length * 1.5)) : 0, submitted: false, review: false };
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
    return `<label class="option ${selected ? 'selected' : ''} ${good ? 'correct' : ''} ${bad ? 'wrong' : ''}"><input type="radio" name="question-${escapeHtml(q.id)}" data-answer="${escapeHtml(key)}" ${selected ? 'checked' : ''} ${revealed ? 'disabled' : ''}><span class="option-letter">${escapeHtml(key)}.</span><div class="option-copy">${optionContentHtml(displayOptionText(text))}</div></label>`;
  }
  function renderQuestionNavigator(s) {
    const flagged = new Set(s.flagged || []);
    $('session-question-map').classList.remove('hidden');
    $('session-question-list').innerHTML = s.ids.map((id, i) => {
      const done = Boolean(String(s.answers[id] ?? '').trim()), marked = flagged.has(id), current = i === s.index;
      const label = 'Câu ' + (i + 1) + ', ' + (done ? 'đã trả lời' : 'chưa trả lời') + (marked ? ', cần xem lại' : '');
      return '<button type="button" data-jump-q="' + i + '" class="' + (current ? 'is-current ' : '') + (done ? 'is-answered ' : '') + (marked ? 'is-flagged' : '') + '" ' + (current ? 'aria-current="step" ' : '') + 'aria-label="' + escapeHtml(label) + '">' + (i + 1) + (marked ? '<span aria-hidden="true">⚑</span>' : '') + '</button>';
    }).join('');
    document.querySelectorAll('[data-action="submit-early"]').forEach(button => button.classList.toggle('hidden', !!s.submitted));
  }
  function confirmEarlySubmission() {
    const s = state.session; if (!s || s.submitted) return;
    storeTextAnswer();
    const answered = s.ids.filter(id => String(s.answers[id] ?? '').trim()).length;
    const unanswered = s.ids.length - answered;
    const message = 'Bạn đã trả lời ' + answered + '/' + s.ids.length + ' câu.' + (unanswered ? '\nCòn ' + unanswered + ' câu chưa trả lời.' : '') + '\nNộp bài ngay? Sau khi nộp, bạn chỉ có thể xem lại đáp án.';
    if (window.confirm(message)) submitSession();
  }
  function questionSignature(q, s) {
    return JSON.stringify([s.answers[q.id] ?? '', !!s.revealed[q.id], !!s.submitted,
      state.bookmarks.includes(q.id), (s.flagged || []).includes(q.id), state.results[q.id]?.ok]);
  }
  function sessionQuestionMarkup(q, s, index) {
    const val = s.answers[q.id] ?? '', revealed = s.revealed[q.id] || s.submitted;
    const objective = ['mcq', 'numeric', 'output'].includes(q.type), saved = state.bookmarks.includes(q.id);
    const flagged = (s.flagged || []).includes(q.id), inputId = 'answer-' + index;
    const input = q.type === 'mcq'
      ? `<div class="options" role="radiogroup" aria-label="Đáp án câu ${index + 1}">${q.options.map(o => optionMarkup(q, s, val, o.key, o.text)).join('')}</div>`
      : q.type === 'code' ? codeAnswerInput(q, val, s.submitted, index)
      : ['numeric', 'output'].includes(q.type)
        ? `<input type="text" class="free-answer short-answer" id="${inputId}" data-free-answer="${escapeHtml(q.id)}" aria-label="Câu trả lời câu ${index + 1}" maxlength="10000" autocomplete="off" value="${escapeHtml(val)}" ${revealed ? 'disabled' : ''}>`
        : `<textarea class="free-answer" id="${inputId}" data-free-answer="${escapeHtml(q.id)}" aria-label="Bài làm câu ${index + 1}" maxlength="10000" placeholder="Viết bài làm của bạn…" ${revealed ? 'disabled' : ''}>${escapeHtml(val)}</textarea>`;
    const feedback = revealed ? `<div class="feedback ${answerOk(q, val) === false && objective ? 'error' : ''}"><h4>${objective ? (answerOk(q, val) === true ? '✓ Correct!' : 'Answer and explanation') : 'Example solution'}</h4>${objective && q.type === 'mcq' ? `<p><strong>Correct answer: ${escapeHtml(q.answer || '—')}</strong></p>` : ''}${objective && q.type !== 'mcq' ? `<p><strong>Expected result: ${escapeHtml(q.value ?? '—')}</strong></p>` : ''}<div class="rich-text">${markdown(q.explanation)}</div>${q.detail ? `<details><summary>Show detailed explanation</summary><div class="rich-text">${markdown(q.detail)}</div></details>` : ''}${!objective && !s.submitted ? `<div class="session-actions"><button class="btn outline" data-action="self-wrong">Needs review</button><button class="btn primary" data-action="self-right">I understand this question</button></div>` : ''}</div>` : '';
    return `<article class="session-question" id="session-question-${index}" data-session-question="${index}" data-question-id="${escapeHtml(q.id)}" aria-label="Câu ${index + 1}"><header class="session-question-header"><span class="session-question-number" aria-hidden="true">${index + 1}</span><div class="question-title">${markdown(q.prompt)}</div><div class="question-tools"><button type="button" class="bookmark-btn ${saved ? 'saved' : ''}" data-action="bookmark" aria-label="${saved ? 'Bỏ lưu' : 'Lưu'} câu ${index + 1}" aria-pressed="${saved}" title="${saved ? 'Bỏ lưu câu' : 'Lưu câu'}">${icon('star')}</button><button type="button" class="question-review-flag ${flagged ? 'flagged' : ''}" data-action="flag-question" aria-label="${flagged ? 'Bỏ dấu' : 'Đánh dấu'} xem lại câu ${index + 1}" aria-pressed="${flagged}" title="Đánh dấu xem lại"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 21V4m0 0c5-4 9 4 14 0v10c-5 4-9-4-14 0"/></svg></button></div></header><section class="answer-prompt" aria-label="${q.type === 'mcq' ? 'Đáp án' : 'Bài làm'} câu ${index + 1}">${input}</section><div class="question-actions session-actions">${!revealed && s.mode === 'learn' ? `<button class="btn primary" data-action="check">${objective ? 'Check answer' : q.type === 'code' ? 'Xem lời giải tham khảo' : 'View solution'}</button>` : ''}${q.hint && !revealed ? '<button class="link-button" data-action="hint">Show hint</button>' : ''}</div><div class="question-hint hint-box hidden rich-text">${markdown(q.hint)}</div>${feedback}</article>`;
  }
  function updateSessionPosition(s) {
    $('session-progress').style.width = `${(s.index + 1) / s.ids.length * 100}%`;
    $('session-step').textContent = `${s.index + 1}/${s.ids.length}`;
    $('prev-q').disabled = s.index === 0;
    $('next-q').innerHTML = s.index === s.ids.length - 1
      ? (s.submitted ? 'View results →' : s.mode === 'exam' ? 'Submit exam →' : 'Finish →')
      : `Next question ${icon('arrow')}`;
    renderQuestionNavigator(s);
  }
  function activateSessionQuestion(index, persist = true) {
    const s = state.session;
    if (!s || !Number.isInteger(index) || index < 0 || index >= s.ids.length || s.index === index) return;
    s.index = index;
    if (persist) save();
    updateSessionPosition(s);
  }
  function scrollToSessionQuestion(index) {
    const card = $('session-question-' + index), stage = $('question-stage');
    if (!card) return;
    if (getComputedStyle(stage).overflowY === 'auto') stage.scrollTo({ top: stage.scrollTop + card.getBoundingClientRect().top - stage.getBoundingClientRect().top - 8, behavior: 'instant' });
    else card.scrollIntoView({ block: 'start', behavior: 'instant' });
  }
  function renderSession() {
    const s = state.session; if (!s) return;
    if (s.submitted && !s.review) { renderResults(); return; }
    if (s.mode === 'exam' && !s.submitted && s.minutes && Date.now() >= s.startedAt + s.minutes * 60000) { submitSession(); return; }
    if (s.ids.some(id => !byId.has(id))) { state.session = null; save(); renderPractice(); return; }
    const q = byId.get(s.ids[s.index]), stage = $('question-stage');
    const matchingMock = [...mockSets.values()].find(set => set.questionIds.length === s.ids.length && s.ids.every(id => set.questionIds.includes(id)));
    const codeOnly = s.ids.every(id => byId.get(id)?.type === 'code');
    const multipleTopics = new Set(s.ids.map(id => byId.get(id)?.setId)).size > 1;
    $('session-label').textContent = s.submitted ? 'REVIEW ANSWERS' : s.mode === 'exam' ? 'MOCK EXAM' : codeOnly ? 'CODE TAY' : 'PRACTICE MODE';
    $('session-heading').textContent = codeOnly ? (s.ids.length > 1 ? 'Code tay · ' + s.ids.length + ' bài' : 'Code tay · ' + (q.id.startsWith('a:T08') ? 'SQL' : 'Python & pandas')) : matchingMock ? displaySetTitle(matchingMock.title) : multipleTopics ? 'Phiên luyện tập tổng hợp' : displaySetTitle(q.setTitle);
    const newList = stage.dataset.sessionId !== s.id || stage.classList.contains('showing-results') || stage.querySelectorAll('[data-session-question]').length !== s.ids.length;
    stage.classList.remove('showing-results');
    if (newList) {
      window.MathJax?.typesetClear?.([stage]);
      stage.innerHTML = s.ids.map((id, index) => sessionQuestionMarkup(byId.get(id), s, index)).join('');
      stage.dataset.sessionId = s.id;
      stage.scrollTop = 0;
      stage.querySelectorAll('[data-session-question]').forEach(card => { card._questionSignature = questionSignature(byId.get(card.dataset.questionId), s); });
    } else {
      const scroll = stage.scrollTop;
      stage.querySelectorAll('[data-session-question]').forEach(card => {
        const item = byId.get(card.dataset.questionId), signature = questionSignature(item, s);
        if (card._questionSignature === signature) return;
        const index = Number(card.dataset.sessionQuestion), focus = document.activeElement;
        const focused = card.contains(focus), answerKey = focus?.dataset?.answer;
        const selection = focused && focus.matches('[data-free-answer]') ? [focus.selectionStart, focus.selectionEnd] : null;
        const details = [...card.querySelectorAll('details')].map(node => node.open);
        const hintOpen = !card.querySelector('.question-hint').classList.contains('hidden');
        window.MathJax?.typesetClear?.([card]);
        card.outerHTML = sessionQuestionMarkup(item, s, index);
        const next = $('session-question-' + index); next._questionSignature = signature;
        next.querySelectorAll('details').forEach((node, i) => { node.open = details[i] || false; });
        if (hintOpen) next.querySelector('.question-hint').classList.remove('hidden');
        const nextFocus = selection ? next.querySelector('[data-free-answer]') : answerKey ? next.querySelector('[data-answer="' + answerKey + '"]') : null;
        if (focused && nextFocus && !nextFocus.disabled) {
          nextFocus.focus({ preventScroll: true });
          if (selection) nextFocus.setSelectionRange(...selection);
        }
      });
      stage.scrollTop = scroll;
    }
    updateSessionPosition(s); updateClock();
    const restoreIndex = s.index, initialStageScroll = stage.scrollTop, initialPageScroll = window.scrollY;
    typeset(newList && restoreIndex > 0 ? () => {
      if (state.session?.id === s.id && state.session.index === restoreIndex && activeView === 'practice' && !stage.classList.contains('showing-results') && stage.scrollTop === initialStageScroll && window.scrollY === initialPageScroll) scrollToSessionQuestion(restoreIndex);
    } : null);
  }
  function jumpToSessionQuestion(index) {
    const s = state.session; if (!s || index < 0 || index >= s.ids.length) return;
    storeTextAnswer(); s.index = index; if (s.submitted) s.review = true;
    save(); renderSession();
    scrollToSessionQuestion(index);
    const stage = $('question-stage'), initialStageScroll = stage.scrollTop, initialPageScroll = window.scrollY;
    typeset(() => {
      if (state.session?.id === s.id && state.session.index === index && activeView === 'practice' && !stage.classList.contains('showing-results') && stage.scrollTop === initialStageScroll && window.scrollY === initialPageScroll) scrollToSessionQuestion(index);
    });
  }
  function answerQuestion(answer) {
    const s = state.session, q = byId.get(s?.ids[s?.index]); if (!q || s.submitted || s.revealed[q.id]) return;
    s.answers[q.id] = answer;
    if (s.mode === 'learn' && q.type === 'mcq') { s.revealed[q.id] = true; recordResult(q, answer); }
    save(); renderSession();
  }
  function storeTextAnswer(input = null) {
    const s = state.session; if (!s || s.submitted) return;
    let changed = false;
    const inputs = input ? [input] : [...$('question-stage').querySelectorAll('[data-free-answer]')];
    for (const node of inputs) {
      const id = node.dataset.freeAnswer;
      if (!s.ids.includes(id) || (s.revealed[id] && byId.get(id)?.type !== 'code')) continue;
      if (s.answers[id] !== node.value) { s.answers[id] = node.value; changed = true; }
      const card = node.closest('[data-session-question]');
      if (card) card._questionSignature = questionSignature(byId.get(id), s);
    }
    if (changed) save();
    renderQuestionNavigator(s);
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
    const canShare = s.mode === 'exam' && s.ids.every(id => ['mcq', 'numeric', 'output'].includes(byId.get(id)?.type)) && s.ids.filter(id => String(s.answers[id] ?? '').trim()).length >= 10;
    if (canShare) void window.StudyCommunity?.submitSession(s);
  }
  function renderResults() {
    $('question-stage').classList.add('showing-results');
    delete $('question-stage').dataset.questionId;
    const s = state.session; $('session-label').textContent = 'SESSION RESULTS'; $('session-heading').textContent = 'Session complete!';
    renderQuestionNavigator(s); updateClock();
    $('session-progress').style.width = '100%'; $('session-step').textContent = `${s.ids.length} questions`; $('prev-q').disabled = true;
    $('next-q').textContent = 'Start a new session →';
    const scored = s.ids.map(id => ({ id, q: byId.get(id), val: s.answers[id] })).filter(x => x.q);
    const objective = scored.filter(x => ['mcq', 'numeric', 'output'].includes(x.q.type) && (s.mode === 'exam' || String(x.val ?? '').trim()));
    const correct = objective.filter(x => answerOk(x.q, x.val)).length;
    if (scored.length && scored.every(x => x.q.type === 'code')) {
      const written = scored.filter(x => String(x.val ?? '').trim()).length;
      $('session-heading').textContent = 'Đã nộp bài code tay';
      $('question-stage').innerHTML = '<div class="result-grid"><div class="result-stat"><b>' + written + '/' + scored.length + '</b><small>Bài đã viết</small></div><div class="result-stat"><b>' + (s.flagged || []).length + '</b><small>Đánh dấu xem lại</small></div></div><p>Bài code tay được lưu để bạn đối chiếu với lời giải tham khảo. Chưa có chấm điểm tự động. Bấm số bài để xem lại code đã nộp và lời giải.</p><div class="result-list">' + scored.map((x, i) => '<div class="result-line"><button data-review="' + i + '">Bài ' + (i + 1) + ': ' + escapeHtml(x.q.topic) + '</button><span>' + (String(x.val ?? '').trim() ? 'Đã viết code' : 'Chưa làm') + '</span></div>').join('') + '</div>';
      return;
    }

    $('question-stage').innerHTML = `<div class="result-grid"><div class="result-stat"><b>${correct}/${objective.length}</b><small>Correct / objective</small></div><div class="result-stat"><b>${scored.filter(x => String(x.val ?? '').trim()).length}</b><small>Answered</small></div><div class="result-stat"><b>${objective.length ? Math.round(correct / objective.length * 100) : 0}%</b><small>Objective accuracy</small></div></div><p>Select a number in the question navigator to review your answers. Unanswered objective questions count as incorrect in exams. Written and coding responses need separate review.</p>${s.mode === 'exam' && s.ids.every(id => ['mcq', 'numeric', 'output'].includes(byId.get(id)?.type)) && s.ids.filter(id => String(s.answers[id] ?? '').trim()).length >= 10 ? '<div class="community-result-link"><button type="button" class="btn outline" data-community-share>Publish score to leaderboard →</button><span id="community-sync-hint" aria-live="polite"></span></div>' : ''}<div class="result-list">${scored.map((x, i) => `<div class="result-line"><button data-review="${i}">Question ${i + 1}: ${escapeHtml(x.q.prompt.slice(0, 65))}${x.q.prompt.length > 65 ? '…' : ''}</button><span>${String(x.val ?? '').trim() ? answerOk(x.q, x.val) === true ? '✓ Correct' : answerOk(x.q, x.val) === false ? '✗ Incorrect' : 'Written response' : '— Skipped'}</span></div>`).join('')}</div>`;
  }
  function setSessionClock(value) { document.querySelectorAll('[data-session-clock]').forEach(element => { element.textContent = value; }); }
  function updateClock() {
    const s = state.session;
    if (!s || !s.minutes || s.submitted) { setSessionClock(s && s.submitted ? 'Đã nộp bài' : 'Không giới hạn'); return; }
    const sec = Math.max(0, Math.ceil((s.startedAt + s.minutes * 60000 - Date.now()) / 1000));
    setSessionClock(`${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`);
    if (sec === 0) submitSession();
  }
  function moveNext() {
    const s = state.session; if (!s) return;
    storeTextAnswer();
    if (s.submitted && s.index === s.ids.length - 1) { s.review = false; save(); renderSession(); return; }
    if (s.index < s.ids.length - 1) { jumpToSessionQuestion(s.index + 1); return; }
    if (s.submitted) { s.review = false; save(); renderSession(); return; }
    submitSession();
  }

  const LESSON_TITLES = [
    'Nền tảng AI & LLM', 'Bài toán kinh doanh', 'ReAct & tool calling', 'Context & harness',
    'Yêu cầu sản phẩm AI', 'Quản lý dự án AI', 'Dữ liệu & embedding', 'RAG',
    'Multi-agent & MCP', 'Data pipeline', 'Guardrails & HITL', 'Triển khai production',
    'Observability', 'Evaluation', 'Chi phí & tối ưu'
  ];
  let lessonSectionObserver = null;
  function renderRoadmap() {
    if (!data) return;
    const days = data.sets.filter(s => s.bank === 'vin20k' && /^Day/.test(s.code));
    $('day-grid').innerHTML = days.map((s, i) => `<button type="button" class="day-btn ${selectedDay === i + 1 ? 'active' : ''}" data-day="${i + 1}" ${selectedDay === i + 1 ? 'aria-current="page"' : ''}><span class="day-number">${String(i + 1).padStart(2, '0')}.</span><strong>${escapeHtml(LESSON_TITLES[i] || displaySetTitle(s.title))}</strong></button>`).join('');
    $('lesson-day-select').innerHTML = days.map((s, i) => `<option value="${i + 1}">${String(i + 1).padStart(2, '0')}. ${escapeHtml(LESSON_TITLES[i] || displaySetTitle(s.title))}</option>`).join('');
    $('lesson-day-select').value = String(selectedDay || 1);
  }
  function renderLessonOutline(day) {
    lessonSectionObserver?.disconnect();
    const headings = [...$('lesson-panel').querySelectorAll('.lesson-body > h3')];
    headings.forEach((heading, index) => { heading.id = 'lesson-' + day + '-section-' + index; heading.tabIndex = -1; });
    const items = headings.map((heading, index) => `<button type="button" class="lesson-outline-link ${index === 0 ? 'active' : ''}" data-lesson-anchor="${heading.id}" ${index === 0 ? 'aria-current="location"' : ''}>${escapeHtml(heading.textContent)}</button>`).join('');
    document.querySelectorAll('.lesson-outline-list').forEach(nav => { nav.innerHTML = items; });
    const active = target => {
      document.querySelectorAll('[data-lesson-anchor]').forEach(button => {
        const current = button.dataset.lessonAnchor === target;
        button.classList.toggle('active', current);
        if (current) button.setAttribute('aria-current', 'location'); else button.removeAttribute('aria-current');
      });
    };
    if (headings.length) {
      lessonSectionObserver = new IntersectionObserver(entries => {
        const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length) active(visible[0].target.id);
      }, { rootMargin: '-10% 0px -65% 0px' });
      headings.forEach(heading => lessonSectionObserver.observe(heading));
    }
  }
  async function openLesson(day) {
    if (!Number.isInteger(day) || day < 1 || day > 15) return;
    selectedDay = day; loadingLesson = true; state.lessonDay = day; save(); showView('roadmap');
    const s = data.sets.find(x => x.id === 'vin-day-' + String(day).padStart(2, '0'));
    const panel = $('lesson-panel');
    lessonSectionObserver?.disconnect();
    window.MathJax?.typesetClear?.([panel]);
    panel.setAttribute('aria-busy', 'true');
    panel.innerHTML = '<div class="lesson-loading" role="status">Đang mở bài học…</div>';
    try {
      const response = await fetch(`/sources/vin20k-ai-phase1-quiz/course/day${String(day).padStart(2, '0')}_course.md`);
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const lesson = await response.text();
      if (selectedDay !== day) return;
      const heading = lesson.match(/^#\s+(.+)\r?$/m);
      const lessonTitle = heading ? heading[1].replace(/^Day\s+\d+\s*[—–-]\s*/i, '') : displaySetTitle(s?.title || `Day ${day}`);
      const lessonBody = heading ? lesson.replace(/^#\s+.+\r?\n/, '') : lesson;
      panel.innerHTML = `<div class="lesson-reader"><header class="lesson-header"><div class="lesson-title-row"><span class="mini-tag">BÀI ${String(day).padStart(2, '0')} / 15</span><button class="btn primary" data-action="day-practice" data-day="${day}">Luyện tập bài này ${icon('arrow')}</button></div><h2>${escapeHtml(lessonTitle)}</h2></header><details class="lesson-outline-mobile"><summary>Trong bài này</summary><nav class="lesson-outline-list" aria-label="Mục lục bài học"></nav></details><article class="lesson-body rich-text" lang="vi">${markdown(lessonBody)}</article><footer class="lesson-pagination"><button type="button" class="lesson-page-button" ${day > 1 ? `data-day="${day - 1}"` : 'disabled'}><span>← Bài trước</span><strong>${day > 1 ? escapeHtml(LESSON_TITLES[day - 2]) : 'Bài đầu tiên'}</strong></button><button type="button" class="lesson-page-button lesson-page-next" ${day < 15 ? `data-day="${day + 1}"` : 'disabled'}><span>Bài tiếp theo →</span><strong>${day < 15 ? escapeHtml(LESSON_TITLES[day]) : 'Bài cuối cùng'}</strong></button></footer></div><aside class="lesson-outline" aria-label="Mục lục"><h3>Trong bài này</h3><nav class="lesson-outline-list" aria-label="Mục lục bài học"></nav></aside>`;
      renderLessonOutline(day); renderRoadmap(); typeset();
    } catch (err) {
      if (selectedDay !== day) return;
      panel.innerHTML = `<p role="alert">Không mở được bài học: ${escapeHtml(err.message)}</p>`;
    } finally {
      if (selectedDay === day) { loadingLesson = false; panel.removeAttribute('aria-busy'); }
    }
  }

  function bind() {
    document.addEventListener('click', event => {
      const outlineButton = event.target.closest('[data-lesson-anchor]');
      if (outlineButton) {
        const target = $(outlineButton.dataset.lessonAnchor);
        if (target) {
          document.querySelectorAll('.lesson-outline-mobile').forEach(details => { details.open = false; });
          document.querySelectorAll('[data-lesson-anchor]').forEach(button => { const active = button.dataset.lessonAnchor === target.id; button.classList.toggle('active', active); if (active) button.setAttribute('aria-current', 'location'); else button.removeAttribute('aria-current'); });
          target.focus({ preventScroll: true });
          target.scrollIntoView({ behavior: 'instant', block: 'start' });
        }
        return;
      }
      const modeTab = event.target.closest('[data-set-mode]'); if (modeTab) { setBrowserAssessment = 'all'; setBrowserMode = modeTab.dataset.setMode; setBrowserDomain = 'all'; setBrowserBank = 'all'; setBrowserPage = 0; $('set-search').value = ''; renderSetExplorer(); return; }
      const pageButton = event.target.closest('[data-set-page]'); if (pageButton) { setBrowserPage += pageButton.dataset.setPage === 'next' ? 1 : -1; renderSetExplorer(); $('set-result-heading').scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
      const jumpButton = event.target.closest('[data-jump-q]'); if (jumpButton && state.session) { jumpToSessionQuestion(Number(jumpButton.dataset.jumpQ)); return; }
      const questionCard = event.target.closest('[data-session-question]'); if (questionCard) activateSessionQuestion(Number(questionCard.dataset.sessionQuestion));
      const pick = event.target.closest('[data-pick-set]'); if (pick) { pickSet(pick.dataset.pickSet); return; }
      const codeTask = event.target.closest('[data-code-question]'); if (codeTask) { const q = byId.get(codeTask.dataset.codeQuestion); if (q?.type === 'code') startSession([q]); return; }
      const launch = event.target.closest('[data-launch-set]'); if (launch) { launchSet(launch.dataset.launchSet); return; }
      const nav = event.target.closest('[data-nav]'); if (nav) { event.preventDefault(); showView(nav.dataset.nav); return; }
      const share = event.target.closest('[data-community-share]');
      if (share) { void window.StudyCommunity?.submitSession(state.session, { manual: true }); return; }
      const day = event.target.closest('[data-day]:not([data-action])'); if (day) { openLesson(Number(day.dataset.day)); return; }
      const qbtn = event.target.closest('[data-question]'); if (qbtn) { startSession([byId.get(qbtn.dataset.question)]); return; }
      const review = event.target.closest('[data-review]'); if (review && state.session) { jumpToSessionQuestion(Number(review.dataset.review)); return; }
      const answer = event.target.closest('[data-answer]'); if (answer) return; // Native radio change handles this question's answer.
      const act = event.target.closest('[data-action]'); if (!act) return;
      switch (act.dataset.action) {
        case 'show-question-map': storeTextAnswer(); $('session-question-map').scrollIntoView({ behavior: 'smooth', block: 'start' }); break;
        case 'submit-early': confirmEarlySubmission(); break;
        case 'flag-question': {
          const s = state.session; if (!s || (s.submitted && !s.review)) break;
          storeTextAnswer();
          const id = s.ids[s.index], marked = new Set(s.flagged || []);
          if (marked.has(id)) marked.delete(id); else marked.add(id);
          s.flagged = [...marked]; save(); renderSession(); break;
        }
        case 'code-all': startSession(codeQuestions()); break;
        case 'quick-start': startSession(shuffled(data.questions).slice(0, 20)); break;
        case 'mode-start': setBrowserAssessment = 'all'; $('practice-mode').value = act.dataset.mode; setBrowserMode = act.dataset.mode === 'exam' ? 'exam' : 'topic'; setBrowserBank = 'all'; setBrowserDomain = 'all'; state.session = null; save(); showView('practice'); break;
        case 'open-bank': setBrowserAssessment = 'all'; setBrowserBank = act.dataset.bank; setBrowserMode = 'all'; setBrowserDomain = 'all'; $('set-search').value = ''; $('practice-bank').value = act.dataset.bank; chooseSetOptions(act.dataset.bank, 'practice-set', 'All topics'); $('practice-set').value = 'all'; state.session = null; save(); showView('practice'); break;
        case 'restart-setup': state.session = null; $('custom-study').open = false; save(); showView('practice'); break;
        case 'clear-set-filters': setBrowserAssessment = 'all'; setBrowserBank = 'all'; setBrowserDomain = 'all'; setBrowserPage = 0; $('set-search').value = ''; renderSetExplorer(); break;
        case 'bookmark': { const id = state.session.ids[state.session.index], i = state.bookmarks.indexOf(id); if (i >= 0) state.bookmarks.splice(i, 1); else state.bookmarks.push(id); save(); renderSession(); toast(i >= 0 ? 'Bookmark removed.' : 'Question bookmarked for review.'); break; }
        case 'hint': $('session-question-' + state.session.index)?.querySelector('.question-hint').classList.remove('hidden'); break;
        case 'check': storeTextAnswer(); checkAndReveal(); break;
        case 'self-right': case 'self-wrong': { const q = byId.get(state.session.ids[state.session.index]); recordResult(q, state.session.answers[q.id], act.dataset.action === 'self-right'); renderSession(); toast('Self-assessment saved.'); break; }
        case 'day-practice': { const id = 'vin-day-' + String(act.dataset.day).padStart(2, '0'); startSession(shuffled(data.questions.filter(q => q.setId === id)).slice(0, 100)); break; }
      }
    });
    $('set-search').addEventListener('input', () => { setBrowserPage = 0; renderSetExplorer(); });
    $('set-assessment-type').addEventListener('change', () => { setBrowserAssessment = $('set-assessment-type').value; setBrowserPage = 0; renderSetExplorer(); });
    $('set-source').addEventListener('change', () => { setBrowserBank = $('set-source').value; setBrowserPage = 0; renderSetExplorer(); });
    $('set-domain').addEventListener('change', () => { setBrowserDomain = $('set-domain').value; setBrowserPage = 0; renderSetExplorer(); });
    $('practice-bank').addEventListener('change', () => { const bank = $('practice-bank').value; chooseSetOptions(bank, 'practice-set', 'All topics'); refreshSetupCount(); renderSetExplorer(); });
    ['practice-set', 'practice-count', 'practice-mode', 'practice-wrong', 'practice-star'].forEach(id => $(id).addEventListener('change', () => { refreshSetupCount(); if (id === 'practice-set') renderSetExplorer(); }));
    $('start-session').addEventListener('click', startFromSetup);
    $('lesson-day-select').addEventListener('change', event => { void openLesson(Number(event.target.value)); });
    $('prev-q').addEventListener('click', () => { if (state.session?.index > 0) jumpToSessionQuestion(state.session.index - 1); });
    $('next-q').addEventListener('click', () => { if (state.session?.submitted && !state.session.review) { state.session = null; save(); renderPractice(); } else moveNext(); });
    document.addEventListener('input', e => {
      if (e.target.matches('[data-free-answer]')) {
        activateSessionQuestion(Number(e.target.closest('[data-session-question]').dataset.sessionQuestion));
        storeTextAnswer(e.target);
      }
    });
    document.addEventListener('change', e => {
      if (e.target.matches('input[type="radio"][data-answer]')) {
        activateSessionQuestion(Number(e.target.closest('[data-session-question]').dataset.sessionQuestion));
        answerQuestion(e.target.dataset.answer);
      }
    });
    document.addEventListener('focusin', e => {
      const card = e.target.closest('[data-session-question]');
      if (card && state.session) activateSessionQuestion(Number(card.dataset.sessionQuestion));
    });
    let questionScrollFrame = null;
    const trackQuestionScroll = () => {
      if (questionScrollFrame) return;
      questionScrollFrame = requestAnimationFrame(() => {
        questionScrollFrame = null;
        const stage = $('question-stage');
        if (!state.session || stage.classList.contains('showing-results') || $('view-practice').classList.contains('hidden')) return;
        const top = getComputedStyle(stage).overflowY === 'auto' ? stage.getBoundingClientRect().top + 45 : 140;
        const card = [...stage.querySelectorAll('[data-session-question]')].find(node => node.getBoundingClientRect().bottom > top);
        if (card) activateSessionQuestion(Number(card.dataset.sessionQuestion));
      });
    };
    $('question-stage').addEventListener('scroll', trackQuestionScroll, { passive: true });
    window.addEventListener('scroll', trackQuestionScroll, { passive: true });
    window.addEventListener('hashchange', () => { const hash = window.location.hash.slice(1); if (hash !== activeView && titleOf[hash]) showView(hash); });
    document.addEventListener('keydown', e => {
      const input = e.target;
      if (!input.matches?.('.hand-code-input') || input.disabled) return;
      if (e.key === 'Escape') { input.dataset.exitTab = 'true'; return; }
      if (e.key !== 'Tab') { delete input.dataset.exitTab; return; }
      if (input.dataset.exitTab) { delete input.dataset.exitTab; return; }
      e.preventDefault();
      const start = input.selectionStart, end = input.selectionEnd;
      if (e.shiftKey) {
        const lineStart = input.value.lastIndexOf('\n', start - 1) + 1;
        const spaces = (input.value.slice(lineStart, start).match(/^ {1,4}/) || [''])[0].length;
        input.setRangeText('', lineStart, lineStart + spaces, 'preserve');
      } else if (input.value.length - (end - start) <= 9996) input.setRangeText('    ', start, end, 'end');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    ticking = setInterval(updateClock, 1000);
    window.addEventListener('load', typeset);
  }
  async function init() {
    try {
      const resp = await fetch('/data/bank.json?v=20261120-content-review'); if (!resp.ok) throw new Error('HTTP ' + resp.status);
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
      if (state.session?.ids.some(id => !byId.has(id))) {
        state.session = null;
        save();
      }
      // Keep original IDs in byId so saved sessions and published mocks still open.
      const publishedIds = new Set([...mockSets.values()].flatMap(set => set.questionIds));
      data.questions = window.StudyQuestions.unique(data.questions, publishedIds);
      for (const set of data.sets) {
        if (!mockSets.has(set.id)) set.count = data.questions.filter(q => q.setId === set.id).length;
      }
      chooseSetOptions('all', 'practice-set', 'All topics');
      bind(); refreshDashboard(); refreshSetupCount();
      await window.StudyAccount?.connect({
        getState: () => JSON.parse(JSON.stringify(state)),
        load: next => {
          state.results = next.results || {}; state.bookmarks = next.bookmarks || []; state.session = next.session || null; state.lessonDay = next.lessonDay || 0;
          if (state.session?.ids.some(id => !byId.has(id))) state.session = null;
          selectedDay = state.lessonDay;
          try { localStorage.setItem(localKey(), JSON.stringify(state)); } catch {}
          refreshDashboard();
          if (activeView === 'practice') renderPractice();
          if (activeView === 'roadmap') void openLesson(selectedDay || 1);
        }
      });
      const hash = window.location.hash.slice(1); showView(titleOf[hash] ? hash : 'overview');
    } catch (err) { console.error(err); $('setup-error').textContent = `Could not load questions: ${err.message}`; toast('Could not load question bank.'); }
  }
  init();
})();
