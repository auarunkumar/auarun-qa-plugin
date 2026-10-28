---
name: qamart-coupon-boundary-testing
description: Designs boundary and equivalence tests for QA Mart coupons (SAVE10, FLAT100, WELCOME50, SUMMER25) from US-101. Use when asked to test coupons, discounts, caps or thresholds.
---

# QA Mart coupon boundary testing

Source of truth: `docs/stories/US-101-coupon-story.md` and `docs/api/openapi.yaml`. Re-read them; do not trust memory.

## Procedure
1. List each rule in US-101 with its threshold or cap.
2. For every threshold derive boundary values: just below, exactly at, just above.
3. Add equivalence classes: case/space variants (`" save10 "`), unknown code, expired code, first-order vs returning shopper.
4. Prefer the API (`api` fixture, `validateCoupon`) for the numeric matrix and one UI test for the Subtotal / Discount / Total summary.
5. Expected values come from the story arithmetic, never from running the app.

## Boundary matrix to start from
| Code | Input subtotal | Expected |
|---|---|---|
| FLAT100 | 499 / 500 / 501 | rejected / ₹100 / ₹100 |
| SAVE10 | 799 | ₹79 (rounded down) |
| SAVE10 | 2000 / 2001 / 3498 | ₹200 cap reached from 2000 up |
| WELCOME50 | 1000, first order (asha) | ₹250 cap region applies at 500+ |
| WELCOME50 | returning shopper (ravi) | rejected |
| SUMMER25 | any | "This coupon has expired" |
| other | any | "Invalid coupon code" |

## Output
A table (id, story AC, technique, input, expected) and a spec at `tests/lab/us-101-coupons.spec.ts`, one behavior per test, story id and AC in each title. If a correct test fails, keep it and report an application bug; never edit `app/`.
