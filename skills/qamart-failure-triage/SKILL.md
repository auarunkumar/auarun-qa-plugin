---
name: qamart-failure-triage
description: Triage failing QA Mart Playwright tests as application bug vs test bug vs environment issue and draft a bug report. Use when a QA Mart test fails, a report shows failures, or the user asks "is this a bug?".
---

# QA Mart failure triage

## Evidence first
Use only evidence you can see: the error, the spec, `docs/stories/*`, the `qamart_last_run_failures` MCP tool, traces and screenshots. If evidence is missing, ask for it rather than guessing.

## Decide
1. Read the failing assertion and the story criterion it maps to.
2. Check the expectation against the story arithmetic, not against what the app returned.
3. Re-check with the MCP tools (`qamart_validate_coupon`, `qamart_inventory`, `qamart_login_check`) to confirm the API response independently of the browser.
4. Classify: **application bug** (test matches story, app differs), **test bug** (expectation or locator wrong), **environment issue** (app down, port, data state, v1/v2 header), or **unconfirmed**.
5. Give severity and confidence (High / Medium / Low).

## Rules
- Do not weaken an assertion, add arbitrary waits or retries to hide a failure.
- Do not edit `app/`.
- For an application bug, fill `docs/templates/bug-report.md` completely: title, story/AC, classification, steps, expected vs actual (status codes, messages, amounts), evidence.
- For a test bug, show the corrected locator or expectation.

## Output
Classification, evidence, root cause, recommended action, confidence, and (if an application bug) the filled bug report.
