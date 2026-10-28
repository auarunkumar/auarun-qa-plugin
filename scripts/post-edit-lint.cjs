// postToolUse hook: after a spec or Page Object is edited, run the project's convention lint and typecheck
// (when the workspace has them) and hand problems back to the agent as additionalContext.
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

let event = {};
try { event = JSON.parse(fs.readFileSync(0, 'utf8') || '{}'); } catch { /* ignore */ }
const toolName = String(event.toolName ?? event.tool_name ?? '');
let args = event.toolArgs ?? event.tool_input ?? {};
if (typeof args === 'string') { try { args = JSON.parse(args); } catch { args = {}; } }

const PATH_KEY = /^(path|filepath|file_path|file|uri)$/i;
function paths(value, out = []) {
  if (Array.isArray(value)) value.forEach((v) => paths(v, out));
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      if (PATH_KEY.test(k) && typeof v === 'string') out.push(v.replace(/^file:\/\//, ''));
      else paths(v, out);
    }
  } else if (typeof value === 'string') {
    for (const m of value.matchAll(/^\*\*\* (?:Add|Update) File:[ \t]*([^\r\n]+)/gm)) out.push(m[1].trim());
  }
  return out;
}

const root = path.resolve(event.cwd || process.cwd());
const edited = /edit|create|write|replace|patch|insert/i.test(toolName)
  ? [...new Set(paths(args).map((p) => path.relative(root, path.resolve(root, p)).split(path.sep).join('/')))]
      .filter((rel) => /\.spec\.ts$/.test(rel) || /^pages\/.+\.ts$/.test(rel))
  : [];
const linter = path.join(root, 'scripts', 'lint-specs.cjs');

if (!edited.length || !fs.existsSync(linter)) {
  process.stdout.write('{}');
  process.exit(0);
}

const run = (cmd, a) => spawnSync(cmd, a, { cwd: root, encoding: 'utf8', timeout: 60000 });
const lint = run('node', [linter, ...edited]);
const types = run('npm', ['run', '-s', 'typecheck']);
const problems = [];
if (lint.status !== 0) problems.push(`lint:specs failed:\n${lint.stdout.trim()}`);
if (types.status !== 0) problems.push(`typecheck failed:\n${(types.stdout + types.stderr).trim()}`);

if (problems.length) {
  const additionalContext = problems.join('\n\n').slice(0, 4000) + '\n\nFix these before continuing.';
  process.stdout.write(JSON.stringify({ additionalContext, hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext } }));
} else {
  process.stdout.write('{}');
}
