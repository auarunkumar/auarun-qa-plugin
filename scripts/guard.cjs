// preToolUse guardrail. Denies:
//  1. edits to app/ (the app under test is read-only for agents)
//  2. destructive shell commands (rm -rf, git push --force, git reset --hard) and shell writes into app/
//  3. writing likely secrets (private keys, API tokens) into any file
// Prints {} to allow. A crash would block the call, so keep it simple and defensive.
const fs = require('node:fs');
const path = require('node:path');

let event = {};
try { event = JSON.parse(fs.readFileSync(0, 'utf8') || '{}'); } catch { /* allow on unparseable input */ }
const toolName = String(event.toolName ?? event.tool_name ?? '');
let args = event.toolArgs ?? event.tool_input ?? {};
if (typeof args === 'string') { try { args = JSON.parse(args); } catch { args = { command: args }; } }

const EDIT_TOOL = /edit|create|write|replace|patch|insert/i;
const SHELL_TOOL = /bash|shell|powershell|terminal|execute/i;
const PATH_KEY = /^(path|filepath|file_path|file|uri)$/i;
const PATCH_HEADER = /^\*\*\* (?:Add|Update|Delete) File:[ \t]*([^\r\n]+)/gm;

function paths(value, out = []) {
  if (Array.isArray(value)) value.forEach((v) => paths(v, out));
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      if (PATH_KEY.test(k) && typeof v === 'string') out.push(v.replace(/^file:\/\//, ''));
      else paths(v, out);
    }
  } else if (typeof value === 'string') {
    for (const m of value.matchAll(PATCH_HEADER)) out.push(m[1].trim());
  }
  return out;
}

function text(value) { return typeof value === 'string' ? value : JSON.stringify(value ?? ''); }

const root = path.resolve(event.cwd || process.cwd());
const appDir = path.join(root, 'app') + path.sep;
const norm = (p) => (process.platform === 'linux' ? p : p.toLowerCase());

const SECRET = /-----BEGIN [A-Z ]*PRIVATE KEY-----|gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|AKIA[0-9A-Z]{16}|sk-[A-Za-z0-9]{32,}|(?:api[_-]?key|secret|token)\s*[:=]\s*['"][A-Za-z0-9_\-]{20,}['"]/i;
const DESTRUCTIVE = /\brm\s+(-[a-z]*r[a-z]*f|-[a-z]*f[a-z]*r)\b|\bgit\s+push\b[^\n]*(--force\b|-f\b)|\bgit\s+reset\s+--hard\b|\bgit\s+clean\s+-[a-z]*f/i;

let reason = '';
if (EDIT_TOOL.test(toolName) && paths(args).some((p) => norm(path.resolve(root, p) + path.sep).startsWith(norm(appDir)))) {
  reason = 'app/ is read-only for agents. Keep the failing test and report the application bug instead.';
} else if (EDIT_TOOL.test(toolName) && SECRET.test(text(args))) {
  reason = 'Looks like a secret. Read credentials from env vars (QA_USER, QA_PASS) instead of writing them to files.';
} else if (SHELL_TOOL.test(toolName)) {
  const cmd = text(args.command ?? args.cmd ?? args);
  if (DESTRUCTIVE.test(cmd)) reason = 'Destructive command blocked by the QA plugin guardrail. Ask the user to run it themselves.';
  else if (/(\bsed\s+-i|>>?|\btee\b|\bmv\b|\bcp\b|\brm\b)[^\n|;&]*\bapp\//.test(cmd)) reason = 'app/ is read-only for agents; shell writes into app/ are blocked.';
}

if (reason) {
  process.stdout.write(JSON.stringify({
    permissionDecision: 'deny',
    permissionDecisionReason: reason,
    hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: reason },
  }));
} else {
  process.stdout.write('{}');
}
