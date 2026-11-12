const fs = require('node:fs');
const path = require('node:path');
const target = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(target, 'utf8');
const begin = '      <section class="view" id="view-overview">';
const end = '      <section class="view hidden" id="view-practice">';
if (!html.includes(begin) || !html.includes(end)) throw Error('Expected overview markers missing');
if (!html.includes('href="/design.css"')) html = html.replace('<link rel="stylesheet" href="/workspace.css">', '<link rel="stylesheet" href="/workspace.css">\n  <link rel="stylesheet" href="/design.css">');
const overview = `      <section class="view" id="view-overview">
        <div class="section-intro">
          <div><div class="muted small">KHÔNG GIAN HỌC TẬP <span class="intro-separator">/</span> TỔNG QUAN</div><h1>Hôm nay, học gì?</h1><p>Ôn tập thông minh, theo dõi tiến độ và tìm lại kiến thức ngay khi cần.</p></div>
          <span class="today-label" id="today-label"></span>
        </div>

        <div class="workspace-lead">
          <div class="focus-feature">
            <div class="focus-overline"><span class="focus-dot"></span> BUỔI HỌC CỦA BẠN <span class="focus-index">01 / FOCUS</span></div>
            <h2>Hiểu thêm một chút.<br><span>Tiến xa mỗi ngày.</span></h2>
            <p>3.301 câu hỏi từ ba ngân hàng kiến thức. Bắt đầu với một buổi luyện ngắn, xem lời giải và tiếp tục ở nhịp độ của riêng bạn.</p>
            <div class="focus-actions"><button class="btn primary" data-action="quick-start">Bắt đầu luyện tập <svg><use href="#i-arrow"/></svg></button><button class="focus-link" data-nav="library">Khám phá câu hỏi <svg><use href="#i-chevron"/></svg></button></div>
            <div class="focus-foot"><span><b>03</b> ngân hàng câu hỏi</span><span class="focus-foot-rule"></span><span><b>44</b> bài học & bảng công thức</span></div>
          </div>
          <div class="study-actions">
            <div class="study-actions-head"><div class="muted small">BẮT ĐẦU NHANH</div><h3>Chọn cách học</h3><p>Mỗi lần luyện tập đều được ghi lại để bạn dễ dàng tiếp tục.</p></div>
            <button class="study-action" data-action="mode-start" data-mode="learn"><span class="study-action-symbol">01</span><span class="study-action-body"><strong>Ôn theo kiến thức</strong><small>Trả lời và xem giải thích ngay</small></span><svg><use href="#i-arrow"/></svg></button>
            <button class="study-action" data-action="mode-start" data-mode="exam"><span class="study-action-symbol">02</span><span class="study-action-body"><strong>Thi thử có thời gian</strong><small>Làm đề và nhận kết quả cuối buổi</small></span><svg><use href="#i-arrow"/></svg></button>
            <button class="study-action" data-nav="roadmap"><span class="study-action-symbol">03</span><span class="study-action-body"><strong>Học theo lộ trình</strong><small>15 bài học và 29 bảng công thức</small></span><svg><use href="#i-arrow"/></svg></button>
            <div class="study-actions-foot"><span class="status-dot"></span> Tiến độ được lưu trên thiết bị</div>
          </div>
        </div>

        <div class="stat-grid" aria-label="Tiến độ ôn tập">
          <article class="stat-card"><div class="stat-label">Tổng số câu hỏi</div><div class="stat-value" id="stat-total">3.301</div><div class="stat-foot">AI20K · Vin20K · Hirin</div></article>
          <article class="stat-card"><div class="stat-label">Đã luyện tập</div><div class="stat-value" id="stat-done">0</div><div class="stat-foot" id="stat-done-sub">Bắt đầu ngay hôm nay</div></article>
          <article class="stat-card"><div class="stat-label">Trả lời chính xác</div><div class="stat-value" id="stat-accuracy">—</div><div class="stat-foot">Tính trên câu đã chấm</div></article>
          <article class="stat-card"><div class="stat-label">Cần ôn lại</div><div class="stat-value" id="stat-wrong">0</div><div class="stat-foot">Những câu bạn đã làm sai</div></article>
        </div>

        <div class="section-header"><div><div class="section-kicker">THƯ VIỆN / 01</div><h3>Chọn ngân hàng để luyện tập</h3><p>Ba bộ câu hỏi, một không gian học tập thống nhất.</p></div><button class="text-link" data-nav="library">Xem toàn bộ <svg><use href="#i-arrow"/></svg></button></div>
        <div class="collection-grid" aria-label="Ngân hàng câu hỏi">
          <button class="collection-card" data-action="open-bank" data-bank="ai20k"><span class="collection-mark a-mark">A</span><span class="collection-info"><h4>AI20K Exam Prep</h4><p>Toán, Python, dữ liệu, Machine Learning, RAG, MLOps và logic.</p><small>6 đề tổng hợp · 12 chuyên đề</small></span><span class="collection-end"><strong>720</strong><small>câu hỏi</small></span><svg class="collection-arrow"><use href="#i-arrow"/></svg></button>
          <button class="collection-card" data-action="open-bank" data-bank="vin20k"><span class="collection-mark v-mark">V</span><span class="collection-info"><h4>Vin20K Master Quiz</h4><p>LLM, AI Agents, RAG, triển khai, sản phẩm AI và tình huống thực tế.</p><small>15 ngày học · 5 chuyên đề</small></span><span class="collection-end"><strong>2.000</strong><small>câu hỏi</small></span><svg class="collection-arrow"><use href="#i-arrow"/></svg></button>
          <button class="collection-card" data-action="open-bank" data-bank="hirin"><span class="collection-mark h-mark">H</span><span class="collection-info"><h4>Hirin AI Quiz</h4><p>Toán, thống kê, Python, SQL, AI/ML và đạo đức AI.</p><small>45 chủ đề · 4 module</small></span><span class="collection-end"><strong>581</strong><small>câu hỏi</small></span><svg class="collection-arrow"><use href="#i-arrow"/></svg></button>
        </div>

        <div class="overview-bottom"><div class="panel lesson-shortcut"><div class="panel-title"><div><div class="section-kicker">LỘ TRÌNH / 02</div><h3>Học theo từng ngày</h3></div><button class="text-link" data-nav="roadmap">Xem lộ trình <svg><use href="#i-arrow"/></svg></button></div><p>15 ngày từ nền tảng đến xây dựng và đánh giá các hệ thống AI. Chọn một bài để bắt đầu.</p><div class="mini-lessons" id="mini-lessons"></div></div><div class="panel reference-shortcut"><div class="section-kicker">TRA CỨU / 03</div><h3>Kiến thức trong tầm tay.</h3><p>Tìm lại công thức, ghi chú hoặc câu hỏi bất cứ khi nào bạn cần.</p><button class="reference-link" data-nav="roadmap"><span>29 bảng công thức Hirin</span><svg><use href="#i-arrow"/></svg></button><button class="reference-link" data-nav="library"><span>Tìm trong 3.301 câu hỏi</span><svg><use href="#i-arrow"/></svg></button></div></div>
      </section>

`;
html = html.slice(0, html.indexOf(begin)) + overview + html.slice(html.indexOf(end));
fs.writeFileSync(target, html, 'utf8');
console.log('Updated overview and design stylesheet link:', target);
