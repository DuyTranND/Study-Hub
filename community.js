(() => {
  'use strict';
  const STORAGE_KEY = 'study-hub-leaderboard-identity-v1';
  const $ = id => document.getElementById(id);
  const format = value => Number(value || 0).toLocaleString('en-US');
  let identity = null, period = 'week', refreshing = null;
  const submitting = new Set();
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (saved?.code === 'PUBLIC01' && /^[a-f0-9]{64}$/.test(saved.token) && typeof saved.memberId === 'string') identity = saved;
  } catch {}
  function showStatus(message = '', kind = '') {
    $('community-status').textContent = message;
    $('community-status').dataset.kind = kind;
    $('community-status').classList.toggle('hidden', !message);
  }
  function storeIdentity(value) {
    identity = value;
    try {
      if (value) localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      else localStorage.removeItem(STORAGE_KEY);
    } catch { showStatus('Browser storage is disabled. Your nickname cannot be restored after reloading.', 'warning'); }
  }
  async function request(action, payload = {}, authenticated = true) {
    const response = await fetch('/api/groups/' + action, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(authenticated ? { ...identity, ...payload } : payload),
      cache: 'no-store', signal: AbortSignal.timeout(15000)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw Object.assign(new Error(data.error || 'Unable to reach the leaderboard.'), { status: response.status });
    return data;
  }
  function render(snapshot) {
    $('community-board').classList.remove('hidden');
    $('community-setup').classList.toggle('hidden', !!identity);
    $('leaderboard-profile').classList.toggle('hidden', !identity);
    $('leaderboard-nickname').textContent = identity?.nickname || '';
    const yours = snapshot.board.find(member => member.id === identity?.memberId);
    $('community-you-points').textContent = yours ? format(yours.points) : '—';
    $('community-score-label').textContent = period === 'week' ? 'YOUR WEEKLY SCORE' : 'YOUR TOTAL SCORE';
    $('community-members').textContent = format(snapshot.totalMembers);
    $('community-goal-label').textContent = period === 'week' ? 'TOTAL WEEKLY POINTS' : 'TOTAL POINTS';
    $('community-total').textContent = format(snapshot.totalPoints);
    document.querySelectorAll('[data-community-period]').forEach(button => {
      const selected = button.dataset.communityPeriod === period;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    const rows = snapshot.board.map((member, index) => {
      const row = document.createElement('tr');
      if (member.id === identity?.memberId) row.className = 'community-is-you';
      [String(index + 1).padStart(2, '0'), member.name + (member.id === identity?.memberId ? ' (you)' : ''), format(member.points), format(member.exams), member.accuracy + '%', format(member.activeDays)].forEach((value, i) => {
        const cell = document.createElement(i ? 'td' : 'th');
        if (!i) cell.scope = 'row';
        cell.textContent = value;
        row.append(cell);
      });
      return row;
    });
    if (!rows.length) {
      const row = document.createElement('tr'), cell = document.createElement('td');
      cell.colSpan = 6; cell.textContent = 'No scores yet. Be the first to join and complete a timed exam.';
      row.append(cell); rows.push(row);
    }
    $('community-ranking-rows').replaceChildren(...rows);
    const items = snapshot.activity.map(item => {
      const entry = document.createElement('div'); entry.className = 'community-feed-item';
      const name = document.createElement('strong'); name.textContent = item.name;
      const detail = document.createElement('span'); detail.textContent = item.correct + '/' + item.graded + ' correct · +' + item.points + ' points';
      const time = document.createElement('time'); time.dateTime = item.at;
      time.textContent = new Date(item.at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      entry.append(name, detail, time); return entry;
    });
    if (!items.length) { const empty = document.createElement('p'); empty.className = 'community-empty'; empty.textContent = 'No exams submitted yet.'; items.push(empty); }
    $('community-feed').replaceChildren(...items);
  }
  async function refresh() {
    if (refreshing) return refreshing;
    refreshing = (async () => {
      try {
        const response = await fetch('/api/groups/status', { cache: 'no-store', signal: AbortSignal.timeout(12000) });
        if (!response.ok) throw Error('Unable to reach the leaderboard.');
        const status = await response.json();
        if (!status.enabled) throw Error(status.reason === 'storage_unavailable' ? 'Leaderboard storage is temporarily unavailable.' : 'The online leaderboard needs a shared Redis connection before scores can be saved for everyone.');
        let requestedPeriod;
        do {
          requestedPeriod = period;
          let data;
          try { data = await request(identity ? 'view' : 'public', { period: requestedPeriod }, !!identity); }
          catch (error) {
            if (!identity || ![401,404].includes(error.status)) throw error;
            storeIdentity(null);
            data = await request('public', { period: requestedPeriod }, false);
          }
          if (requestedPeriod === period) { render(data.group); showStatus(); break; }
        } while (true);
      } catch (error) { showStatus(error.message, 'error'); }
    })();
    try { await refreshing; } finally { refreshing = null; }
  }
  async function enroll(event) {
    event.preventDefault();
    const button = event.currentTarget.querySelector('button'); button.disabled = true;
    try {
      await openProfile(new FormData(event.currentTarget).get('nickname')); await refresh();
    } catch (error) { showStatus(error.message, 'error'); }
    finally { button.disabled = false; }
  }
  function syncHint(message, isError = false) {
    const element = $('community-sync-hint');
    if (element) { element.textContent = message; element.dataset.kind = isError ? 'error' : 'ok'; }
  }
  async function submitSession(session, { manual = false } = {}) {
    if (!session || session.mode !== 'exam' || !session.submitted) return;
    if (!identity) { if (manual) { syncHint('Enter your name to save this result.', true); $('account-dialog').showModal(); } return; }
    if (!session.id) session.id = crypto.randomUUID();
    if (submitting.has(session.id)) return;
    submitting.add(session.id);
    const button = document.querySelector('[data-community-share]'); if (button) button.disabled = true;
    syncHint('Saving score to leaderboard…');
    try {
      const { result } = await request('submit', { sessionId: session.id, ids: session.ids, answers: session.answers, startedAt: session.startedAt, minutes: session.minutes });
      syncHint(result.duplicate ? 'This exam is already on the leaderboard.' : 'Score saved · +' + result.points + ' points.');
      if (!$('view-community').classList.contains('hidden')) void refresh();
    } catch (error) { syncHint(error.message || 'Could not save this score.', true); }
    finally { submitting.delete(session.id); if (button) button.disabled = false; }
  }
  const clone = value => JSON.parse(JSON.stringify(value));
  const blank = () => ({ results: {}, bookmarks: [], session: null, lessonDay: 0 });
  let bridge = null, baseline = null, saveTimer = null, saving = null, switching = false;
  const pendingKey = () => 'study-hub-pending-v1:' + identity.memberId;
  const baselineKey = () => 'study-hub-baseline-v1:' + identity.memberId;
  function rememberBaseline() { try { localStorage.setItem(baselineKey(), JSON.stringify(baseline)); } catch {} }
  function progressStatus(message, kind = '') {
    const status = $('account-sync-status');
    status.textContent = message; status.dataset.kind = kind;
    $('account-open').textContent = identity ? identity.nickname : 'Enter your name';
  }
  function difference(base, next) {
    const patch = {}, results = {};
    for (const [id, value] of Object.entries(next.results || {})) if (JSON.stringify(value) !== JSON.stringify(base.results?.[id])) results[id] = value;
    if (Object.keys(results).length) patch.results = results;
    const before = new Set(base.bookmarks || []), after = new Set(next.bookmarks || []);
    const add = [...after].filter(id => !before.has(id)), remove = [...before].filter(id => !after.has(id));
    if (add.length) patch.bookmarkAdd = add;
    if (remove.length) patch.bookmarkRemove = remove;
    if (JSON.stringify(base.session) !== JSON.stringify(next.session)) patch.session = next.session || null;
    if ((base.lessonDay || 0) !== (next.lessonDay || 0)) patch.lessonDay = next.lessonDay || 0;
    return patch;
  }
  function merge(progress, patch) {
    const next = clone(progress);
    for (const [id, value] of Object.entries(patch.results || {})) if (!next.results[id] || value.ts >= next.results[id].ts) next.results[id] = value;
    const marked = new Set(next.bookmarks);
    for (const id of patch.bookmarkAdd || []) marked.add(id);
    for (const id of patch.bookmarkRemove || []) marked.delete(id);
    next.bookmarks = [...marked];
    if (Object.hasOwn(patch, 'session')) next.session = patch.session;
    if (Object.hasOwn(patch, 'lessonDay')) next.lessonDay = patch.lessonDay;
    return next;
  }
  function journal() {
    if (!identity || !bridge || !baseline) return;
    try { localStorage.setItem(pendingKey(), JSON.stringify(difference(baseline, bridge.getState()))); } catch {}
  }
  async function flush() {
    clearTimeout(saveTimer);
    if (saving) { await saving; return flush(); }
    if (!identity || !bridge || !baseline) return;
    const snapshot = bridge.getState(), patch = difference(baseline, snapshot);
    if (!Object.keys(patch).length) { progressStatus('Saved to your profile', 'ok'); return; }
    const profileId = identity.memberId;
    journal(); progressStatus('Saving…');
    saving = (async () => {
      try {
        const data = await request('progress-save', { patch });
        if (identity?.memberId !== profileId) return;
        const later = difference(snapshot, bridge.getState());
        baseline = clone(data.progress); rememberBaseline();
        // Re-render only if another browser added progress or there are new local edits.
        const next = merge(data.progress, later);
        if (JSON.stringify(next) !== JSON.stringify(bridge.getState())) bridge.load(next);
        journal(); progressStatus('Saved to your profile', 'ok');
      } catch (error) { progressStatus('Not synced · retry', 'error'); throw error; }
    })();
    try { await saving; } finally { saving = null; }
    if (Object.keys(difference(baseline, bridge.getState())).length) return flush();
  }
  function queueSave() {
    if (!identity || !baseline || switching) return;
    journal(); progressStatus('Saving…'); clearTimeout(saveTimer);
    saveTimer = setTimeout(() => void flush().catch(() => {}), 450);
  }
  async function connect(value) {
    bridge = value;
    if (!identity) { progressStatus('Saved on this device'); return; }
    if (!baseline) { try { baseline = JSON.parse(localStorage.getItem(baselineKey()) || 'null'); } catch {} }
    baseline ||= blank();
    progressStatus('Loading profile…');
    try {
      const data = await request('progress');
      baseline = clone(data.progress); rememberBaseline();
      let pending = {};
      try { pending = JSON.parse(localStorage.getItem(pendingKey()) || '{}'); } catch {}
      // Import an existing browser cache only for an empty, matching profile.
      if (!Object.keys(data.progress.results).length && !data.progress.bookmarks.length && !data.progress.session && !data.progress.lessonDay) pending = { ...difference(blank(), bridge.getState()), ...pending };
      bridge.load(merge(data.progress, pending));
      await flush(); progressStatus('Saved to your profile', 'ok');
    } catch (error) {
      if ([401,404].includes(error.status)) { storeIdentity(null); baseline = null; bridge.load(blank()); progressStatus('Enter your name to reopen your profile'); }
      else progressStatus('Offline · saved on this device', 'error');
    }
  }
  async function openProfile(name) {
    if (!bridge) throw Error('The question bank is still loading. Please try again.');
    await flush();
    const previous = identity;
    const guest = !previous ? bridge.getState() : null;
    switching = true;
    try {
      const data = await request('login', { nickname: name }, false);
      storeIdentity(data.identity); baseline = clone(data.progress); rememberBaseline();
      let next = data.progress;
      if (data.created && guest) next = merge(next, difference(blank(), guest));
      let pending = {};
      try { pending = JSON.parse(localStorage.getItem(pendingKey()) || '{}'); } catch {}
      next = merge(next, pending);
      bridge.load(next); progressStatus('Saved to your profile', 'ok');
      $('account-dialog').close();
    } finally { switching = false; }
    await flush();
  }
  window.StudyAccount = { identity: () => identity, connect, save: queueSave, flush };
  function init() {
    $('account-open').addEventListener('click', () => { $('account-name').value = identity?.nickname || ''; $('account-error').textContent = ''; $('account-dialog').showModal(); });
    $('account-cancel').addEventListener('click', () => $('account-dialog').close());
    $('account-form').addEventListener('submit', async event => {
      event.preventDefault(); const button = $('account-submit'); button.disabled = true; $('account-error').textContent = '';
      try { await openProfile($('account-name').value); if (!$('view-community').classList.contains('hidden')) await refresh(); }
      catch (error) { $('account-error').textContent = error.message; }
      finally { button.disabled = false; }
    });
    $('account-sync-status').addEventListener('click', () => { if (bridge) void flush().then(() => connect(bridge)).catch(() => {}); });
    window.addEventListener('online', () => { if (bridge) void flush().then(() => connect(bridge)).catch(() => {}); });
    window.addEventListener('pagehide', journal);
    $('leaderboard-enroll').addEventListener('submit', event => void enroll(event));
    $('community-refresh').addEventListener('click', () => void refresh());
    document.querySelectorAll('[data-community-period]').forEach(button => button.addEventListener('click', () => { period = button.dataset.communityPeriod; void refresh(); }));
    setInterval(() => { if (!document.hidden && !$('view-community').classList.contains('hidden')) void refresh(); }, 30000);
  }
  window.StudyCommunity = { activate: refresh, submitSession };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
})();
