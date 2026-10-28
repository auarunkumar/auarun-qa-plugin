---
description: Turn a QA Mart story into a test-case table and a first Playwright spec.
argument-hint: story id, for example US-104
---
Story id: $ARGUMENTS (default `US-104` if empty)

1. Read the matching file in `docs/stories/`. If none matches, say so and stop.
2. Write a test-case table (one row per acceptance criterion plus negative and boundary cases). Name the technique per row and say whether it is UI or API.
3. Write `tests/lab/<story id lowercase>.spec.ts` for the highest-priority rows. Follow the QA Mart conventions rules, use `tests/fixtures.ts` and `tests/test-data.ts`, and put the story id and AC number in every test title.
4. Run `npm run typecheck`, `npm run lint:specs` and the new spec.
5. If a test fails because the app disagrees with the story, keep the test and report it with `docs/templates/bug-report.md`. Do not weaken the assertion and do not edit `app/`.

Finish with: the table, the spec path, and each failing test with the story criterion it breaks.
