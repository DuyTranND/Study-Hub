'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

async function main() {
  const root = path.resolve(__dirname, '..');
  const { default: handler } = await import('../api/groups.mjs');
  execFileSync(process.execPath, ['build-vercel.cjs'], { cwd: root, stdio: 'pipe' });
  for (const file of ['index.html', 'app.js', 'community.js', 'question-dedup.js', 'data/bank.json', 'typography.css',
    'sources/studyhub-fonts/InterVariable.woff2', 'sources/studyhub-fonts/InterVariable-Italic.woff2', 'sources/studyhub-fonts/LICENSE.txt',
    'sources/ai-quiz/index.html', 'sources/ai20k-exam-prep/offline.html']) {
    assert(fs.existsSync(path.join(root, 'dist', file)), `Missing public asset: ${file}`);
  }
  for (const file of ['group-api.cjs', 'api/groups.mjs', 'storage/groups.json', 'server.cjs']) {
    assert(!fs.existsSync(path.join(root, 'dist', file)), `Private file copied: ${file}`);
  }
  const originalFetch = global.fetch;
  const originalUrl = process.env.UPSTASH_REDIS_REST_URL;
  const originalToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  let state = null;
  let conflicts = 0;
  process.env.UPSTASH_REDIS_REST_URL = 'https://mock-redis.example';
  process.env.UPSTASH_REDIS_REST_TOKEN = 'private-test-only-token';
  global.fetch = async (url, options) => {
    assert.equal(url, process.env.UPSTASH_REDIS_REST_URL);
    assert.equal(options.headers.Authorization, `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`);
    const command = JSON.parse(options.body);
    if (command[0] === 'PING') return Response.json({ result: 'PONG' });
    if (command[0] === 'GET') return Response.json({ result: state });
    if (command[0] === 'EVAL') {
      const before = command[4];
      if (before !== (state ?? '__no_existing_study_group_data__')) {
        conflicts++;
        return Response.json({ result: 0 });
      }
      state = command[5];
      return Response.json({ result: 1 });
    }
    throw Error(`Unexpected Redis command ${command[0]}`);
  };

  async function call(action, body = {}, method = 'POST') {
    let status, payload;
    const req = {
      // Vercel rewrites /api/groups/:action to the single serverless function.
      url: '/api/groups?action=' + action,
      query: { action },
      method,
      headers: { host: 'study-hub.vercel.app', origin: 'https://study-hub.vercel.app' },
      body
    };
    const res = {
      writeHead(code) { status = code; return this; },
      end(text) { payload = JSON.parse(text); return this; }
    };
    await handler(req, res);
    return { status, payload };
  }

  try {
    let response = await call('status', undefined, 'GET');
    assert.equal(response.payload.enabled, true);
    const workingFetch = global.fetch;
    global.fetch = async () => Response.json({ error: 'Invalid Redis token' }, { status: 401 });
    response = await call('status', undefined, 'GET');
    assert.equal(response.status, 200);
    assert.deepEqual(response.payload, { enabled: false, reason: 'storage_unavailable' },
      'Configured but inaccessible Redis must not be reported as healthy');
    global.fetch = workingFetch;
    response = await call('status', undefined, 'GET');
    assert.equal(response.payload.enabled, true, 'Health check should recover after Redis returns');
    const creator = await call('create', { name: 'Study Friends', nickname: 'Anna' });
    assert.equal(creator.status, 200, JSON.stringify(creator));
    const code = creator.payload.identity.code;
    const [bob, carol] = await Promise.all([
      call('join', { code, nickname: 'Bob' }),
      call('join', { code, nickname: 'Carol' })
    ]);
    assert.equal(bob.status, 200, JSON.stringify(bob));
    assert.equal(carol.status, 200, JSON.stringify(carol));
    assert.equal(JSON.parse(state).groups[code].members &&
      Object.keys(JSON.parse(state).groups[code].members).length, 3);
    const questions = JSON.parse(fs.readFileSync(path.join(root, 'data', 'bank.json'), 'utf8')).questions
      .filter(q => q.type === 'mcq').slice(0, 10);
    assert.equal(questions.length, 10);
    const session = {
      ...bob.payload.identity,
      sessionId: 'fixed-test-session-123456',
      ids: questions.map(q => q.id),
      answers: Object.fromEntries(questions.map(q => [q.id, q.answer])),
      startedAt: Date.now() - 300000,
      minutes: 20
    };
    response = await call('submit', session);
    assert.equal(response.status, 200, JSON.stringify(response));
    assert.equal(response.payload.result.points, 10);
    response = await call('submit', session);
    assert.equal(response.payload.result.duplicate, true);
    const board = await call('view', { ...creator.payload.identity, period: 'all' });
    assert.equal(board.status, 200);
    assert.equal(board.payload.group.board.find(m => m.name === 'Bob').points, 10);
    assert.equal(board.payload.group.totalMembers, 3);
    assert(conflicts >= 1, 'Concurrent joins must retry on Redis CAS conflicts');
    delete process.env.UPSTASH_REDIS_REST_URL;
    response = await call('status', undefined, 'GET');
    assert.deepEqual(response.payload, { enabled: false, reason: 'not_configured' });
    response = await call('create', { name: 'Other', nickname: 'Dave' });
    assert.equal(response.status, 503);
    console.log('Vercel deploy: PASS (static assets, privacy, Redis health, concurrent joins, leaderboard, persistence, missing-storage error).');
  } finally {
    global.fetch = originalFetch;
    if (originalUrl === undefined) delete process.env.UPSTASH_REDIS_REST_URL;
    else process.env.UPSTASH_REDIS_REST_URL = originalUrl;
    if (originalToken === undefined) delete process.env.UPSTASH_REDIS_REST_TOKEN;
    else process.env.UPSTASH_REDIS_REST_TOKEN = originalToken;
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
