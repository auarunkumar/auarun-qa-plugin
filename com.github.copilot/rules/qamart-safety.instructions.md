---
name: 'QA Mart safety rules'
description: 'Always apply when testing QA Mart: what an agent must never do.'
applyTo: '**'
---
# QA Mart safety rules

- `app/` is read-only. Never edit it to make a test pass.
- If a correct test fails because the app disagrees with the story, keep the test, do not weaken the assertion, and report it with `docs/templates/bug-report.md`. Classify it: application bug, test bug, environment issue or unconfirmed.
- Never write real credentials, tokens or API keys into files. Lab credentials come from `tests/test-data.ts` (`QA_USER`, `QA_PASS`).
- `POST /api/test/reset` wipes orders for everyone. Use it only in serial tests, never in parallel ones.
- Only run destructive shell commands (`rm -rf`, `git push --force`, `git reset --hard`) when the user explicitly asks.
- AI drafts, testers decide: summarise what you changed and what still needs human review.
