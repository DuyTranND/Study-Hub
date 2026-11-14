(() => {
  'use strict';

  const STORAGE_KEY = 'study-hub-group-membership-v1';
  const $ = id => document.getElementById(id);
  const format = value => Number(value || 0).toLocaleString('en-US');
  let identity = null;
  let period = 'week';
  let refreshing = null;
  const submitting = new Set();

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (saved && /^[A-Z2-9]{8}$/.test(saved.code) && /^[a-f0-9]{64}$/.test(saved.token) && typeof saved.memberId === 'string') identity = saved;
  } catch { /* Private browsing may disable storage. */ }

  function storeIdentity(value) {
    identity = value;
    try {
      if (value) localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      else localStorage.removeItem(STORAGE_KEY);
    } catch { showStatus('Browser storage is disabled. Your membership may be lost when you reload.', 'warning'); }
  }

  function showStatus(message = '', kind = '') {
    const element = $('community-status');
    if (!element) return;
    element.textContent = message;
    element.dataset.kind = kind;
    element.classList.toggle('hidden', !message);
  }

  function showSetup() {
    $('community-board').classList.add('hidden');
    $('community-setup').classList.remove('hidden');
    $('community-refresh').classList.add('hidden');
  }

  async function request(action, payload = {}, authenticated = true) {
    const body = authenticated ? { ...identity, ...payload } : payload;
    const response = await fetch('/api/groups/' + action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
      signal: AbortSignal.timeout(15000)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.error || 'The group service could not complete this request.');
      error.status = response.status;
      throw error;
    }
    return data;
  }

  function addCell(row, value, header = false) {
    const cell = document.createElement(header ? 'th' : 'td');
    if (header) cell.scope = 'row';
    cell.textContent = String(value);
    row.append(cell);
  }

  function render(snapshot) {
    showStatus();
    $('community-setup').classList.add('hidden');
    $('community-board').classList.remove('hidden');
    $('community-refresh').classList.remove('hidden');
    $('community-group-name').textContent = snapshot.name;
    $('community-code').textContent = snapshot.code;
    $('community-members').textContent = format(snapshot.totalMembers);

    const yours = snapshot.board.find(member => member.id === snapshot.you);
    $('community-you-points').textContent = format(yours?.points);
    $('community-score-label').textContent = period === 'week' ? 'YOUR WEEKLY SCORE' : 'YOUR TOTAL SCORE';
    $('community-goal-label').textContent = period === 'week' ? 'WEEKLY GROUP CHALLENGE' : 'GROUP TOTAL';
    $('community-total').textContent = period === 'week'
      ? format(snapshot.totalPoints) + ' / ' + format(snapshot.goal)
      : format(snapshot.totalPoints) + ' points';
    $('community-goal-progress').style.width = Math.min(100, snapshot.totalPoints / snapshot.goal * 100) + '%';
    $('community-goal-progress').parentElement.classList.toggle('hidden', period === 'all');

    document.querySelectorAll('[data-community-period]').forEach(button => {
      const selected = button.dataset.communityPeriod === period;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });

    const rows = snapshot.board.map((member, index) => {
      const row = document.createElement('tr');
      if (member.id === snapshot.you) row.className = 'community-is-you';
      addCell(row, String(index + 1).padStart(2, '0'), true);
      addCell(row, member.name + (member.id === snapshot.you ? ' (you)' : ''));
      addCell(row, format(member.points));
      addCell(row, format(member.exams));
      addCell(row, member.accuracy + '%');
      addCell(row, format(member.activeDays));
      return row;
    });
    $('community-ranking-rows').replaceChildren(...rows);

    const feed = $('community-feed');
    if (!snapshot.activity.length) {
      const empty = document.createElement('p');
      empty.className = 'community-empty';
      empty.textContent = 'No exams shared yet. Complete a timed exam to get started.';
      feed.replaceChildren(empty);
      return;
    }
    const items = snapshot.activity.map(item => {
      const entry = document.createElement('div');
      entry.className = 'community-feed-item';
      const name = document.createElement('strong');
      name.textContent = item.name;
      const detail = document.createElement('span');
      detail.textContent = item.correct + '/' + item.graded + ' correct · +' + item.points + ' new points';
      const time = document.createElement('time');
      time.dateTime = item.at;
      time.textContent = new Date(item.at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      entry.append(name, detail, time);
      return entry;
    });
    feed.replaceChildren(...items);
  }

  async function refresh() {
    if (refreshing) return refreshing;
    refreshing = (async () => {
      try {
        const response = await fetch('/api/groups/status', { cache: 'no-store', signal: AbortSignal.timeout(12000) });
        if (!response.ok) throw Error('Unable to reach Study Groups. Please try again.');
        const status = await response.json();
        if (!status.enabled) throw Error(status.reason === 'storage_unavailable'
          ? 'Study Groups storage is temporarily unavailable. Please try again shortly.'
          : 'Study Groups requires a shared server or Upstash Redis connection to synchronize scores.');
        if (!identity) {
          showSetup();
          showStatus();
          return;
        }
        // If the learner switches ranking periods mid-request, fetch the latest
        // selection before showing the scoreboard.
        let requestedPeriod;
        do {
          requestedPeriod = period;
          const data = await request('view', { period: requestedPeriod });
          if (requestedPeriod === period) {
            render(data.group);
            break;
          }
        } while (true);
      } catch (error) {
        if (error.status === 401 || error.status === 404) {
          storeIdentity(null);
          showSetup();
          showStatus(error.message, 'warning');
        } else {
          $('community-setup').classList.add('hidden');
          $('community-board').classList.add('hidden');
          $('community-refresh').classList.remove('hidden');
          showStatus(error.message || 'Unable to reach the study group server.', 'error');
        }
      }
    })();
    try { await refreshing; } finally { refreshing = null; }
  }

  async function handleMembership(event, action) {
    event.preventDefault();
    const form = event.currentTarget;
    const button = form.querySelector('button[type=submit]');
    const payload = Object.fromEntries(new FormData(form));
    if (action === 'join') payload.code = payload.code.trim().toUpperCase();
    button.disabled = true;
    showStatus('Saving your membership…');
    try {
      const data = await request(action, payload, false);
      storeIdentity(data.identity);
      period = 'week';
      render(data.group);
    } catch (error) { showStatus(error.message, 'error'); }
    finally { button.disabled = false; }
  }

  function syncHint(message, isError = false) {
    const element = $('community-sync-hint');
    if (!element) return;
    element.textContent = message;
    element.dataset.kind = isError ? 'error' : 'ok';
  }

  async function submitSession(session, { manual = false } = {}) {
    if (!session || session.mode !== 'exam' || !session.submitted) return;
    if (!identity) {
      if (manual) syncHint('Join a Study Group first, then share this result.', true);
      return;
    }
    if (!session.id) session.id = crypto.randomUUID();
    if (submitting.has(session.id)) return;
    submitting.add(session.id);
    const button = document.querySelector('[data-community-share]');
    if (button) button.disabled = true;
    syncHint('Sharing exam result…');
    try {
      const { result } = await request('submit', {
        sessionId: session.id,
        ids: session.ids,
        answers: session.answers,
        startedAt: session.startedAt,
        minutes: session.minutes
      });
      syncHint(result.duplicate ? 'This exam is already on the leaderboard.' : 'Score shared · +' + result.points + ' new points.');
      if (!$('view-community').classList.contains('hidden')) void refresh();
    } catch (error) {
      syncHint(error.message || 'Could not share this result. Try again.', true);
      if (manual) showStatus(error.message || 'Could not share exam.', 'error');
    } finally {
      submitting.delete(session.id);
      if (button) button.disabled = false;
    }
  }

  async function copyInvite() {
    const code = identity?.code;
    if (!code) return;
    const url = new URL(location.href);
    url.searchParams.set('group', code);
    url.hash = 'community';
    const local = ['localhost', '127.0.0.1', '::1', '[::1]'].includes(url.hostname);
    const value = local ? code : url.href;
    try {
      await navigator.clipboard.writeText(value);
      showStatus(local ? 'Invite code copied. Your friends also need the address of your shared server.' : 'Invite link copied.', 'success');
    } catch {
      showStatus('Invite code: ' + code + '. Copy this code and share it with your friends.', 'warning');
    }
  }

  async function leave() {
    if (!identity || !confirm('Leave this study group? Your leaderboard scores in this group will be removed.')) return;
    const button = $('community-leave');
    button.disabled = true;
    try {
      await request('leave');
      storeIdentity(null);
      showSetup();
      showStatus('You have left the study group.', 'success');
    } catch (error) { showStatus(error.message, 'error'); }
    finally { button.disabled = false; }
  }

  function init() {
    const group = new URLSearchParams(location.search).get('group');
    if (/^[A-Z2-9]{8}$/i.test(group || '')) $('community-join').elements.code.value = group.toUpperCase();
    $('community-create').addEventListener('submit', event => void handleMembership(event, 'create'));
    $('community-join').addEventListener('submit', event => void handleMembership(event, 'join'));
    $('community-refresh').addEventListener('click', () => void refresh());
    $('community-copy').addEventListener('click', () => void copyInvite());
    $('community-leave').addEventListener('click', () => void leave());
    document.querySelectorAll('[data-community-period]').forEach(button =>
      button.addEventListener('click', () => {
        period = button.dataset.communityPeriod;
        void refresh();
      })
    );
    // Keep the group board up to date while learners are viewing it.
    setInterval(() => {
      if (identity && !document.hidden && !$('view-community').classList.contains('hidden')) void refresh();
    }, 30000);
  }

  window.StudyCommunity = { activate: refresh, submitSession };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
