'use strict';

const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');
const { weekKey } = require('../group-api.cjs');

const root = path.resolve(__dirname, '..');
const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'study-hub-groups-'));
const storePath = path.join(testDir, 'groups.json');
const questions = JSON.parse(fs.readFileSync(path.join(root, 'data', 'bank.json'), 'utf8')).questions;
const sample = questions.filter(q => q.type === 'mcq').slice(0, 12);

async function freePort() {
  const server = net.createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return port;
}

async function main() {
  assert.equal(weekKey(Date.parse('2026-11-15T16:59:59Z')), '2026-11-09', 'Sunday night in Vietnam');
  assert.equal(weekKey(Date.parse('2026-11-15T17:00:00Z')), '2026-11-16', 'Monday morning in Vietnam');
  const port = await freePort();
  const base = 'http://127.0.0.1:' + port;
  const launch = () => spawn(process.execPath, ['server.cjs'], {
    cwd: root,
    env: { ...process.env, PORT: String(port), HOST: '127.0.0.1', STUDY_GROUP_STORE: storePath },
    stdio: 'pipe'
  });
  let proc = launch();
  try {
    let available = false;
    for (let attempt = 0; attempt < 90; attempt++) {
      if (proc.exitCode !== null) throw Error('Server exited early: ' + proc.exitCode);
      try {
        const response = await fetch(base + '/api/groups/status');
        if (response.ok) { available = true; break; }
      } catch { /* Server is starting. */ }
      await new Promise(resolve => setTimeout(resolve, 80));
    }
    assert.ok(available, 'Server should be ready');
    async function call(endpoint, data) {
      const response = await fetch(base + '/api/groups/' + endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return { status: response.status, data: await response.json() };
    }
    const create = await call('create', { name: 'AI20K Pals', nickname: 'Alice' });
    assert.equal(create.status, 200, JSON.stringify(create.data));
    const alice = create.data.identity;
    assert.match(alice.code, /^[A-Z2-9]{8}$/);
    assert.equal(create.data.group.totalMembers, 1);
    const reused = await call('join', { code: alice.code, nickname: 'Alice' });
    assert.equal(reused.status, 409, 'Duplicate nicknames rejected');
    const join = await call('join', { code: alice.code, nickname: 'Bob' });
    assert.equal(join.status, 200, JSON.stringify(join.data));
    const bob = join.data.identity;
    const answers = Object.fromEntries(sample.map(q => [q.id, q.answer]));
    const exam = { ids: sample.map(q => q.id), answers, startedAt: Date.now() - 120000, minutes: 30 };
    const first = await call('submit', { ...alice, ...exam, sessionId: crypto.randomUUID() });
    assert.equal(first.status, 200, JSON.stringify(first.data));
    assert.equal(first.data.result.correct, 12);
    assert.equal(first.data.result.points, 12);
    const attemptId = crypto.randomUUID();
    const again = await call('submit', { ...alice, ...exam, sessionId: attemptId });
    assert.equal(again.data.result.points, 0, 'Correct answers already earned must not score twice');
    const duplicate = await call('submit', { ...alice, ...exam, sessionId: attemptId });
    assert.equal(duplicate.data.result.duplicate, true, 'Exam IDs are idempotent');
    const second = await call('submit', { ...bob, ...exam, sessionId: crypto.randomUUID() });
    assert.equal(second.data.result.points, 12);
    const view = await call('view', { ...bob, period: 'week' });
    assert.equal(view.status, 200);
    assert.equal(view.data.group.totalPoints, 24);
    assert.equal(view.data.group.totalMembers, 2);
    assert.equal(view.data.group.activity.length, 3);
    const all = await call('view', { ...bob, period: 'all' });
    assert.equal(all.data.group.totalPoints, 24);
    const invalid = await call('view', { ...bob, token: '0'.repeat(64) });
    assert.equal(invalid.status, 401);
    assert.ok(fs.existsSync(storePath));
    assert.ok(!fs.readFileSync(storePath, 'utf8').includes(alice.token), 'Never persist raw membership tokens');
    for (const hidden of ['/storage/groups.json', '/group-api.cjs', '/.git/config']) {
      const response = await fetch(base + hidden);
      assert.equal(response.status, 403, 'Private route must be hidden: ' + hidden);
    }
    const left = await call('leave', bob);
    assert.equal(left.status, 200);
    assert.equal((await call('view', bob)).status, 401);
    assert.equal((await call('view', alice)).data.group.totalMembers, 1);

    // Persist first week's results, restart the server, and replay the
    // same questions in the current week. Weekly points reset; all-time sums.
    proc.kill();
    await new Promise(resolve => proc.once('exit', resolve));
    const history = JSON.parse(fs.readFileSync(storePath, 'utf8'));
    for (const attempt of history.groups[alice.code].members[alice.memberId].attempts) {
      attempt.week = '2020-01-06';
      attempt.at = '2020-01-06T10:00:00Z';
    }
    fs.writeFileSync(storePath, JSON.stringify(history));
    proc = launch();
    let reloaded = false;
    for (let attempt = 0; attempt < 90; attempt++) {
      if (proc.exitCode !== null) throw Error('Reloaded server exited: ' + proc.exitCode);
      try {
        const response = await fetch(base + '/api/groups/status');
        if (response.ok) { reloaded = true; break; }
      } catch { /* Waiting for the restarted server. */ }
      await new Promise(resolve => setTimeout(resolve, 80));
    }
    assert.ok(reloaded, 'Server should reload persisted attempts');
    const newWeek = await call('submit', { ...alice, ...exam, sessionId: crypto.randomUUID() });
    assert.equal(newWeek.status, 200);
    assert.equal(newWeek.data.result.points, 12, 'Previously seen questions earn points in a new week');
    assert.equal((await call('view', { ...alice, period: 'week' })).data.group.totalPoints, 12);
    assert.equal((await call('view', { ...alice, period: 'all' })).data.group.totalPoints, 24,
      'All-time scoreboard must add both weeks');
    const earlyProfile = await call('create', { name: 'Early submission check', nickname: 'Early learner' });
    const earlyIdentity = earlyProfile.data.identity;
    const early = await call('submit', { ...earlyIdentity, ...exam, sessionId: crypto.randomUUID(), answers: Object.fromEntries(sample.slice(0, 10).map(q => [q.id, q.answer])) });
    assert.equal(early.status, 200);
    assert.equal(early.data.result.graded, 12, 'All exam questions count in the score denominator');
    assert.equal(early.data.result.correct, 10);
    const earlyBoard = await call('view', earlyIdentity);
    assert.equal(earlyBoard.data.group.board[0].accuracy, 83, 'Skipped questions lower leaderboard accuracy');
    console.log('Study Groups API: PASS (membership, scoring, deduplication, ranking, cross-week totals, privacy, leave, Vietnam week boundary).');
  } finally {
    proc.kill();
    fs.rmSync(testDir, { recursive: true, force: true });
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
