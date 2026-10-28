# auarun-qa-plugin

A GitHub Copilot CLI plugin for testing **QA Mart**. It protects three flows: **sign-in (US-104)**, **coupons (US-101)** and **stock-limited ordering (US-103)**.

## Install

```bash
copilot plugin install auarunkumar/auarun-qa-plugin
copilot plugin list
```

Then open the `qa-mart-lab` repo, run `npm start` (or let Playwright start it) and launch `copilot`.

Uninstall: `copilot plugin uninstall auarun-qa-plugin`.

## What's inside

| Component | Files | Purpose |
|---|---|---|
| Custom instructions (2) | `com.github.copilot/rules/qamart-playwright-conventions.instructions.md`, `qamart-safety.instructions.md` | Locator order, web-first assertions, story ids in titles; app/ read-only, no secrets |
| Prompt files / slash commands (2) | `com.github.copilot/commands/qamart-test-from-story.md`, `qamart-protect-flows.md` | `/qamart-test-from-story US-104`, `/qamart-protect-flows` |
| Skills (2) | `skills/qamart-coupon-boundary-testing`, `skills/qamart-failure-triage` | Boundary matrix for coupons; app bug vs test bug triage |
| Custom agents (2) | `com.github.copilot/agents/qamart-test-writer.agent.md`, `qamart-bug-triager.agent.md` | Writer edits only `tests/` and `pages/`; triager is read-only |
| MCP server (1) | `mcp.json`, `mcp/qamart-server.cjs` | Read-only tools: `qamart_health`, `qamart_inventory`, `qamart_validate_coupon`, `qamart_login_check`, `qamart_last_run_failures` |
| Hooks (2) | `com.github.copilot/hooks/hooks.json`, `scripts/guard.cjs`, `scripts/post-edit-lint.cjs` | preToolUse guard; postToolUse lint + typecheck feedback |

## Safety

- **Guard hook** denies edits to `app/`, shell writes into `app/`, `rm -rf` / `git push --force` / `git reset --hard`, and writing anything that looks like a secret.
- **Scoped agents**: `tools:` lists limit what each agent can do. The triager cannot edit files.
- **MCP server is read-only**: no order placement, no reset, never returns login tokens. Needs only `QAMART_URL` (default `http://127.0.0.1:3000`).
- No secrets in this repo. Lab credentials come from `QA_USER` / `QA_PASS` env vars (`qamart_login_check` needs `QA_PASS`).
- Plugin MCP servers and hooks run code on your machine: read them before installing.

## Demo

1. `cd qa-mart-lab && npm ci && export QA_PASS=<lab password from tests/test-data.ts> && copilot`
2. `/qamart-protect-flows` or "Use the writer agent to write tests for US-104".
3. Example spec: `examples/protected-flows.spec.ts` (copy to `tests/protected/`). Result against QA Mart: **8 passed, 1 failed**. The failure is a real application bug: `FLAT100` at exactly ₹500 is rejected with 422 but US-101 AC3 says ₹100 off.

```bash
npx playwright test tests/protected --project=chromium
```

AI drafts. Testers decide.

## License
MIT
