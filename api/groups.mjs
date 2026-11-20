// Vercel runs one instance per request. Shared scores live in Upstash Redis;
// compare-and-swap avoids dropping submissions when multiple people post at once.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import groupApi from '../group-api.cjs';

const { createGroupApi } = groupApi;

const KEY = 'study-hub:groups:v1';
const MISSING = '__no_existing_study_group_data__';
const COMPARE_AND_SAVE = `
local old = redis.call('GET', KEYS[1])
if (old or '${MISSING}') ~= ARGV[1] then return 0 end
redis.call('SET', KEYS[1], ARGV[2])
return 1
`;

function credentials() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  if (!/^https:\/\//i.test(url)) throw Error('Redis URL must use HTTPS.');
  return { url, token };
}

async function redis(config, command) {
  const response = await fetch(config.url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
    signal: AbortSignal.timeout(12000)
  });
  if (!response.ok) throw Error(`Redis request failed (${response.status})`);
  const data = await response.json();
  if (data.error) throw Error('Redis rejected request');
  return data.result;
}

function reply(res, status, data, headers = {}) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...headers
  });
  res.end(typeof data === 'string' ? data : JSON.stringify(data));
}

async function bodyBuffer(req, limit) {
  if (Buffer.isBuffer(req.body)) return req.body;
  if (req.body !== undefined && req.body !== null) {
    return Buffer.from(typeof req.body === 'string' ? req.body : JSON.stringify(req.body));
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    const buf = Buffer.from(chunk);
    size += buf.length;
    if (size > limit) return null;
    chunks.push(buf);
  }
  return Buffer.concat(chunks);
}

async function gradeWithSnapshot(pathname, request, body, serialized) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'study-hub-'));
  const storePath = path.join(directory, 'groups.json');
  try {
    if (serialized !== null) fs.writeFileSync(storePath, serialized, { mode: 0o600 });
    const api = createGroupApi({ storePath });
    let status = 200;
    let content = '';
    let headers = {};
    const fakeRes = {
      writeHead(code, values) { status = code; headers = values || {}; return this; },
      end(value = '') { content = String(value); return this; }
    };
    const fakeReq = {
      method: request.method,
      headers: request.headers,
      async *[Symbol.asyncIterator]() { yield body; }
    };
    await api.handle(fakeReq, fakeRes, pathname);
    return {
      status, content, headers,
      changed: status === 200 && fs.existsSync(storePath),
      updated: status === 200 && fs.existsSync(storePath) ? fs.readFileSync(storePath, 'utf8') : null
    };
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

export default async function handler(req, res) {
  const url = new URL(req.url, 'https://study-hub.invalid');
  const action = req.query?.action || url.searchParams.get('action') ||
    (url.pathname.startsWith('/api/groups/') ? url.pathname.slice('/api/groups/'.length) : '');
  const pathname = '/api/groups/' + action;
  if (!/^\/api\/groups\/(?:status|public|login|progress|progress-save|enroll|create|join|view|submit|leave)$/.test(pathname))
    return reply(res, 404, { error: 'Unknown group action.' });
  if (req.method === 'GET' && pathname === '/api/groups/status') {
    try {
      const config = credentials();
      if (!config) return reply(res, 200, { enabled: false, reason: 'not_configured' });
      if (await redis(config, ['PING']) !== 'PONG') throw Error('Redis health check returned an unexpected result.');
      return reply(res, 200, { enabled: true });
    } catch (error) {
      console.error('Study Group health check error:', error.message);
      return reply(res, 200, { enabled: false, reason: 'storage_unavailable' });
    }
  }
  if (req.method !== 'POST') return reply(res, 405, { error: 'POST required.' });
  try {
    const config = credentials();
    if (!config) return reply(res, 503, { error: 'Leaderboard needs an Upstash Redis integration on this deployment.' });
    const limit = pathname === '/api/groups/progress-save' ? 1048576 : 36000;
    const body = await bodyBuffer(req, limit);
    if (!body || body.length > limit) return reply(res, 413, { error: 'Request too large.' });
    for (let attempt = 0; attempt < 6; attempt++) {
      const previous = await redis(config, ['GET', KEY]);
      const current = await gradeWithSnapshot(pathname, req, body, previous);
      if (current.status !== 200 || (pathname === '/api/groups/view' || pathname === '/api/groups/public' || pathname === '/api/groups/progress'))
        return reply(res, current.status, current.content, current.headers);
      if (!current.changed) throw Error('Group data did not persist.');
      const saved = await redis(config, ['EVAL', COMPARE_AND_SAVE, 1, KEY, previous ?? MISSING, current.updated]);
      if (saved === 1) return reply(res, current.status, current.content, current.headers);
    }
    return reply(res, 409, { error: 'The group changed during your request. Please try again.' });
  } catch (error) {
    console.error('Study Group persistence error:', error.message);
    return reply(res, 503, { error: 'Group storage is currently unavailable. Please try again shortly.' });
  }
}
