'use strict';

// A small, dependency-free shared scoreboard for a single Study Hub server.
// All scoring happens here using the bundled question bank, never a posted score.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const randomCode = () => Array.from(crypto.randomBytes(8), x => chars[x % chars.length]).join('');
const digest = token => crypto.createHash('sha256').update(token).digest('hex');
const bad = (status, message) => Object.assign(new Error(message), { status });
const vietnamDay = time => new Date(time + 7 * 60 * 60 * 1000);
const dayKey = time => vietnamDay(time).toISOString().slice(0, 10);
const weekKey = time => {
  const d = vietnamDay(time);
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - (d.getUTCDay() + 6) % 7);
  return d.toISOString().slice(0, 10);
};

function createGroupApi({ root = __dirname, storePath = path.join(root, 'storage', 'groups.json') } = {}) {
  const bankPaths = ['bank.json', 'tfg27-questions.json', 'shl-practice.json'];
  const questions = new Map();
  for (const file of bankPaths) {
    const payload = JSON.parse(fs.readFileSync(path.join(root, 'data', file), 'utf8'));
    for (const q of payload.questions) questions.set(q.id, q);
  }
  let db = { version: 1, groups: {} };
  if (fs.existsSync(storePath)) {
    db = JSON.parse(fs.readFileSync(storePath, 'utf8'));
    if (db.version !== 1 || !db.groups || typeof db.groups !== 'object') throw Error('Invalid group storage version');
  }
  function persist() {
    fs.mkdirSync(path.dirname(storePath), { recursive: true });
    const tmp = `${storePath}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(db), { mode: 0o600 });
    fs.renameSync(tmp, storePath);
  }
  function asText(value, limit, label) {
    if (typeof value !== 'string' || value.trim().length < 2 || value.trim().length > limit || /[\u0000-\u001f<>]/.test(value))
      throw bad(400, `${label} must contain 2–${limit} plain-text characters.`);
    return value.trim().replace(/\s+/g, ' ');
  }
  function groupFor(code) {
    const group = db.groups[String(code || '').toUpperCase()];
    if (!group) throw bad(404, 'Study group not found. Check the invite code.');
    return group;
  }
  function authenticate(body) {
    const group = groupFor(body.code);
    const member = group.members[String(body.memberId || '')];
    if (typeof body.token !== 'string' || !/^[a-f0-9]{64}$/.test(body.token) || !member ||
        !crypto.timingSafeEqual(Buffer.from(digest(body.token)), Buffer.from(member.tokenHash))) {
      throw bad(401, 'Membership is no longer valid on this browser. Join the group again.');
    }
    return { group, member };
  }
  function addMember(group, nickname) {
    const name = asText(nickname, 28, 'Nickname');
    if (Object.values(group.members).some(m => m.name.toLocaleLowerCase() === name.toLocaleLowerCase()))
      throw bad(409, 'Nickname already used in this group. Choose another.');
    if (Object.keys(group.members).length >= 80) throw bad(409, 'This group is full (80 members).');
    const token = crypto.randomBytes(32).toString('hex');
    const id = crypto.randomUUID();
    group.members[id] = { id, name, tokenHash: digest(token), joinedAt: new Date().toISOString(), attempts: [] };
    persist();
    return { code: group.code, memberId: id, token, nickname: name };
  }
  function correct(q, value) {
    const answer = String(value ?? '').trim();
    if (!answer) return false;
    if (q.type === 'mcq') return answer.toUpperCase() === String(q.answer).toUpperCase();
    if (q.type === 'numeric') {
      const normalized = answer.replaceAll(' ', '').replace(',', '.');
      let number = Number(normalized);
      if (normalized.includes('/')) { const [a, b] = normalized.split('/').map(Number); number = a / b; }
      return Number.isFinite(number) && Number.isFinite(Number(q.value)) && Math.abs(number - Number(q.value)) <= Math.max(Number(q.tol) || 0, 1e-9);
    }
    if (q.type === 'output') return [q.value, ...(q.accept || [])].some(x => String(x ?? '').trim().replace(/\s+/g, ' ').toLowerCase() === answer.replace(/\s+/g, ' ').toLowerCase());
    return false;
  }
  function snapshot(group, memberId, period = 'week') {
    const week = weekKey(Date.now());
    const board = Object.values(group.members).map(m => {
      const attempts = m.attempts.filter(a => period !== 'week' || a.week === week);
      const activeDays = new Set();
      let points = 0, graded = 0, correctCount = 0;
      for (const a of attempts) {
        points += a.points;
        graded += a.graded;
        correctCount += a.correct;
        activeDays.add(dayKey(Date.parse(a.at)));
      }
      return { id: m.id, name: m.name, points, exams: attempts.length,
        accuracy: graded ? Math.round(correctCount / graded * 100) : 0, activeDays: activeDays.size };
    }).sort((a, b) => b.points - a.points || b.accuracy - a.accuracy || b.exams - a.exams || a.name.localeCompare(b.name));
    const activity = Object.values(group.members).flatMap(m => m.attempts.map(a => ({
      name: m.name, at: a.at, correct: a.correct, graded: a.graded, points: a.points
    }))).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8);
    return { code: group.code, name: group.name, you: memberId, week, period,
      goal: 200, totalPoints: board.reduce((sum, m) => sum + m.points, 0),
      totalMembers: board.length, board, activity };
  }
  function submit(group, member, body) {
    const { sessionId, ids, answers } = body;
    if (typeof sessionId !== 'string' || !/^[a-zA-Z0-9-]{12,90}$/.test(sessionId)) throw bad(400, 'Invalid session ID.');
    const previous = member.attempts.find(a => a.sessionId === sessionId);
    if (previous) return { duplicate: true, correct: previous.correct, graded: previous.graded, points: previous.points };
    if (!Array.isArray(ids) || ids.length < 10 || ids.length > 150 || new Set(ids).size !== ids.length ||
        !answers || typeof answers !== 'object' || Array.isArray(answers))
      throw bad(400, 'Only timed exams with 10–150 unique questions can enter the leaderboard.');
    if (!Number.isFinite(body.startedAt) || body.startedAt > Date.now() + 120000 ||
        body.startedAt < Date.now() - 24 * 60 * 60 * 1000 ||
        !Number.isFinite(body.minutes) || body.minutes <= 0 || body.minutes > 600)
      throw bad(400, 'Invalid timed exam details.');
    if (member.attempts.filter(a => dayKey(Date.parse(a.at)) === dayKey(Date.now())).length >= 25)
      throw bad(429, 'Daily limit reached. Continue practicing locally.');
    const pairs = ids.map(id => [id, questions.get(id)]);
    if (pairs.some(([id, q]) => typeof id !== 'string' || !q || !['mcq', 'numeric', 'output'].includes(q.type)))
      throw bad(400, 'This exam includes unsupported or unknown questions.');
    const graded = pairs.filter(([id]) => String(answers[id] ?? '').trim()).length;
    if (graded < 10 || Object.keys(answers).length > ids.length) throw bad(400, 'Answer at least 10 graded questions before submitting.');
    const correctIds = pairs.filter(([id, q]) => correct(q, answers[id])).map(([id]) => id);
    const week = weekKey(Date.now());
    const seen = new Set(member.attempts.filter(a => a.week === week).flatMap(a => a.correctIds));
    const points = correctIds.filter(id => !seen.has(id)).length;
    const entry = { sessionId, at: new Date().toISOString(), week, graded, correct: correctIds.length, correctIds, points };
    member.attempts.push(entry);
    persist();
    return { duplicate: false, correct: entry.correct, graded, points };
  }
  function action(url, body) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw bad(400, 'Invalid request.');
    if (url === '/api/groups/create') {
      const name = asText(body.name, 48, 'Group name');
      const nickname = asText(body.nickname, 28, 'Nickname');
      let code;
      do { code = randomCode(); } while (db.groups[code]);
      const group = { code, name, createdAt: new Date().toISOString(), members: {} };
      db.groups[code] = group;
      const identity = addMember(group, nickname);
      return { identity, group: snapshot(group, identity.memberId) };
    }
    if (url === '/api/groups/join') {
      const group = groupFor(body.code);
      const identity = addMember(group, body.nickname);
      return { identity, group: snapshot(group, identity.memberId) };
    }
    const { group, member } = authenticate(body);
    if (url === '/api/groups/view') return { group: snapshot(group, member.id, body.period === 'all' ? 'all' : 'week') };
    if (url === '/api/groups/submit') return { result: submit(group, member, body), group: snapshot(group, member.id) };
    if (url === '/api/groups/leave') {
      delete group.members[member.id];
      if (!Object.keys(group.members).length) delete db.groups[group.code];
      persist();
      return { ok: true };
    }
    throw bad(404, 'Unknown group action.');
  }
  async function handle(req, res, pathname) {
    const send = (status, data) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }); res.end(JSON.stringify(data)); };
    if (req.method === 'GET' && pathname === '/api/groups/status') return send(200, { enabled: true });
    if (req.method !== 'POST') return send(405, { error: 'POST required.' });
    if (req.headers.origin) {
      try { if (new URL(req.headers.origin).host !== req.headers.host) return send(403, { error: 'Cross-origin requests are not allowed.' }); }
      catch { return send(403, { error: 'Invalid origin.' }); }
    }
    let body = '';
    for await (const part of req) {
      body += part;
      if (body.length > 36000) return send(413, { error: 'Request too large.' });
    }
    try { send(200, action(pathname, JSON.parse(body))); }
    catch (error) { send(error.status || 500, { error: error.status ? error.message : 'Could not save group data.' }); }
  }
  return { handle, weekKey };
}

module.exports = { createGroupApi, weekKey };
