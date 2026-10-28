---
description: Run the three protected QA Mart flows (sign-in, coupons, stock-limited ordering) and report a pass/fail verdict.
---
Protected flows: sign-in (US-104), coupons (US-101), stock-limited ordering (US-103).

1. Use the `qamart_health` MCP tool. If QA Mart is down, tell the user to run `npm start` and stop.
2. Use `qamart_validate_coupon` for FLAT100 at 499, 500 and 501, and `qamart_inventory` for the stock limits. Use `qamart_login_check` for the standard, returning and locked accounts.
3. Run `npx playwright test tests/protected --project=chromium` if `tests/protected/` exists. Otherwise run `npm test`.
4. Report a table: flow | story AC | expected | actual | verdict (Pass / Fail / Blocked).
5. For each Fail say whether it is an application bug or a test bug and give the evidence. Do not edit `app/` and do not weaken assertions.
