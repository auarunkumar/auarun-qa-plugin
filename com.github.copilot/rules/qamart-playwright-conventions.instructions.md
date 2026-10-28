---
name: 'QA Mart Playwright conventions'
description: 'Use when writing or changing Playwright specs or Page Objects for QA Mart.'
applyTo: '{tests,pages}/**/*.ts'
---
# QA Mart Playwright conventions

- Locators in this order: `getByRole` with a name, `getByLabel`, `getByText` (static copy), `getByTestId`. CSS only as a last resort. Never XPath, `.nth()`, `nth-child` or generated class names (v2 reorders products).
- No `waitForTimeout`. Use auto-waiting and web-first assertions (`toBeVisible`, `toHaveText`, `toHaveURL`, `toHaveCount`).
- Do not read a value and then assert on it (`textContent()` + `toBe`). Assert on the locator.
- Assertions live in specs, never in Page Objects.
- One behavior per test. Title it after the behavior and include the story and criterion, e.g. `US-101 AC3: FLAT100 gives ₹100 off at exactly ₹500`.
- Wrap multi-step flows in `test.step`.
- Import `test`/`expect` from `tests/fixtures.ts` when you need the `api` or `signedInPage` fixtures, otherwise from `@playwright/test`.
- Emails, passwords, prices and coupon codes come from `tests/test-data.ts`. Use `baseURL` with relative paths, never `http://localhost:3000`.
- Tests must pass on v1 and v2 (`npm run test:v2`).
- Before handing work over run: `npm run typecheck`, `npm run lint:specs`, then the new spec.
