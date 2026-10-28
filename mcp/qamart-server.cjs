#!/usr/bin/env node
// Read-only QA Mart MCP server. stdio, newline-delimited JSON-RPC, zero dependencies.
// Env: QAMART_URL (default http://127.0.0.1:3000), QAMART_REPORT (default <cwd>/reports/results.json),
//      QA_PASS (lab password for qamart_login_check; required for that tool, never stored in the repo).
// Safety: no order placement, no reset. Only health, inventory, coupon validation, login check and report reading.
// stdout carries protocol messages only; logs go to stderr.
const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');

const BASE = (process.env.QAMART_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
const REPORT = process.env.QAMART_REPORT || path.join(process.cwd(), 'reports', 'results.json');
const LAB_PASSWORD = process.env.QA_PASS;
const ACCOUNTS = { standard: 'asha@qamart.test', returning: 'ravi@qamart.test', locked: 'locked@qamart.test' };

async function http(method, route, body) {
  let res;
  try {
    res = await fetch(BASE + route, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(10000),
    });
  } catch (err) {
    throw new Error(`QA Mart is not reachable at ${BASE}. Start it with "npm start". (${err.message})`);
  }
  return { httpStatus: res.status, ...(await res.json().catch(() => ({}))) };
}

const stripAnsi = (s) => String(s || '').replace(/\u001b\[[0-9;]*m/g, '');

function failures() {
  if (!fs.existsSync(REPORT)) throw new Error(`No report at ${REPORT}. Run "npm test" first.`);
  const out = [];
  const walk = (suite, file) => {
    const f = suite.file || file;
    for (const spec of suite.specs || []) {
      for (const t of spec.tests || []) {
        const last = (t.results || []).slice(-1)[0] || {};
        if (['failed', 'timedOut'].includes(last.status)) {
          const msg = stripAnsi(last.error?.message || last.errors?.[0]?.message).split('\n').map((l) => l.trim()).filter(Boolean);
          out.push({ title: spec.title, file: f, line: spec.line, project: t.projectName, error: msg.slice(0, 3).join(' | ') });
        }
      }
    }
    (suite.suites || []).forEach((s) => walk(s, f));
  };
  (JSON.parse(fs.readFileSync(REPORT, 'utf8')).suites || []).forEach((s) => walk(s, s.file));
  return out;
}

const TOOLS = [
  {
    name: 'qamart_health',
    description: 'Check whether QA Mart is running.',
    inputSchema: { type: 'object', properties: {} },
    run: () => http('GET', '/api/health'),
  },
  {
    name: 'qamart_inventory',
    description: 'Return the per-order stock limit for each product id (US-103).',
    inputSchema: { type: 'object', properties: {} },
    run: () => http('GET', '/api/inventory'),
  },
  {
    name: 'qamart_validate_coupon',
    description: 'Validate a coupon against a subtotal for a shopper email (US-101). Does not place an order.',
    inputSchema: {
      type: 'object',
      properties: {
        code: { type: 'string' },
        subtotal: { type: 'number' },
        email: { type: 'string', description: 'Default asha@qamart.test' },
      },
      required: ['code', 'subtotal'],
    },
    run: (a) => http('POST', '/api/coupons/validate', { code: a.code, subtotal: a.subtotal, email: a.email || ACCOUNTS.standard }),
  },
  {
    name: 'qamart_login_check',
    description: 'Check the HTTP status of a lab account login (US-104). Never returns the token.',
    inputSchema: {
      type: 'object',
      properties: { account: { type: 'string', enum: Object.keys(ACCOUNTS) }, wrongPassword: { type: 'boolean' } },
      required: ['account'],
    },
    run: async (a) => {
      if (!ACCOUNTS[a.account]) throw new Error(`Unknown account "${a.account}". Use: ${Object.keys(ACCOUNTS).join(', ')}`);
      if (!LAB_PASSWORD) throw new Error('Set the QA_PASS environment variable (lab password) before using qamart_login_check.');
      const r = await http('POST', '/api/login', { email: ACCOUNTS[a.account], password: a.wrongPassword ? 'wrong' : LAB_PASSWORD });
      return { account: a.account, httpStatus: r.httpStatus, error: r.error };
    },
  },
  {
    name: 'qamart_last_run_failures',
    description: 'List failing tests (title, file, line, first error lines) from the Playwright JSON report.',
    inputSchema: { type: 'object', properties: {} },
    run: async () => failures(),
  },
];

const send = (msg) => process.stdout.write(JSON.stringify({ jsonrpc: '2.0', ...msg }) + '\n');

readline.createInterface({ input: process.stdin }).on('line', async (line) => {
  if (!line.trim()) return;
  let msg;
  try { msg = JSON.parse(line); } catch { return send({ id: null, error: { code: -32700, message: 'Parse error' } }); }
  const { id, method, params } = msg;
  if (id === undefined) return; // notification
  if (method === 'initialize') {
    return send({ id, result: { protocolVersion: params?.protocolVersion || '2024-11-05', capabilities: { tools: {} }, serverInfo: { name: 'qamart', version: '1.0.0' } } });
  }
  if (method === 'ping') return send({ id, result: {} });
  if (method === 'tools/list') {
    return send({ id, result: { tools: TOOLS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })) } });
  }
  if (method === 'tools/call') {
    const tool = TOOLS.find((t) => t.name === params?.name);
    if (!tool) return send({ id, error: { code: -32602, message: `Unknown tool: ${params?.name}` } });
    try {
      const result = await tool.run(params.arguments || {});
      return send({ id, result: { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] } });
    } catch (err) {
      return send({ id, result: { isError: true, content: [{ type: 'text', text: String(err.message) }] } });
    }
  }
  send({ id, error: { code: -32601, message: `Method not found: ${method}` } });
});
