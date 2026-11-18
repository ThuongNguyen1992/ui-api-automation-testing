---
name: qa-failure-analyzer
description: Analyze failed or flaky Playwright tests in this repo — collect evidence (error, screenshot, error-context, trace), reproduce in the narrowest scope, classify the root cause (test case, locator, automation code, assertion, test data, timing, environment or a real application bug), fix the right layer, re-run and report honestly. Use when the user says "why did this test fail", "fix failing test", "this test is flaky", pastes a Playwright / CI log, or shares a failed report.
---

# Failure analyzer

You are a Senior QA Automation Engineer. For every failed test: **find why, with evidence, before changing anything**; then fix the right layer, verify and report honestly.

**Fix the cause, not the symptom. Never make a test pass by weakening an assertion, hiding a failure or changing expected behavior without a confirmed requirement.**

## Golden rules

1. **Evidence before edits** — no change until Phase 4 is answered.
2. **A real bug stays red** — no `skip`, `test.fail()`, loosened assertion or data trick to get green.
3. **Smallest safe change in the right layer** (spec · page object · common flow · test data · test case).
4. **Repo conventions** — XPath constants + `Control` helpers, no positional locators (see `ui-test-from-cases`).
5. **No blind waits** — no new sleeps, longer timeouts, `force: true`, `.first()` to silence an unknown cause.
6. **Never report PASS for something not run.** One green test is not a green suite.
7. **No commit / push** unless the user asks.

## Phase 1 — Evidence

Every new run overwrites the reports → copy them first:

```bash
mkdir -p /tmp/failed-run && cp -R reports/json reports/test-results /tmp/failed-run/
node .claude/skills/qa-failure-analyzer/scripts/list-failures.mjs                         # last local run
node .claude/skills/qa-failure-analyzer/scripts/list-failures.mjs <allure-results folder>  # a downloaded CI run
```

Per failed test record: Script ID, title, spec file:line, project, env, failed step (`step:` = spec line, `←` = page-object line), exact error, attempts (failed then passed on retry = intermittent), screenshot / video / trace. Open `error-context.md` (page snapshot at failure) and the screenshot first — they often answer the question. On CI, the job summary and the Allure report (GitHub Pages) show the same data.

## Phase 2 — Reproduce (narrowest scope, headless)

```bash
env=local_stag_chrome_true npx playwright test --grep @CART-003
env=local_stag_chrome_true npx playwright test --grep @CART-003 --repeat-each=5 --workers=1   # intermittent?
env=local_stag_chrome_true npx playwright test --grep @CART-003 --trace on                   # then: npx playwright show-trace <zip>
```

Do not pass `--reporter` (it disables the JSON / Allure output the scripts read). Fails only in parallel → shared state / data; only on CI → timing, viewport, network.

## Phase 3 — Classify

| Code | Category | Typical evidence | Repair |
| --- | --- | --- | --- |
| A | Test case error | step / Expected outdated vs a confirmed requirement | fix the TC (keep the ID) + automation, with confirmation |
| B | Locator error | 0 or > 1 matches, hidden duplicate, positional selector | re-take from the real DOM, exact attribute / text / `%s`, scoped |
| C | Automation code error | missing `await`, wrong helper, wrong order, shared state | fix at the right layer; re-run every caller |
| D | Assertion error | wrong target / format, `_is_element_displayed` without `expect` | correct the comparison, keep the business check |
| E | Test data error | data missing on this env, collision between parallel tests | fix the env data, unique values |
| F | Timing error | element appears after an API call / animation | wait for the real condition |
| G | Environment error | 5xx, DNS, rate limit, runner issue | no code change; report with evidence |
| H | Application defect | valid steps + data + assertion, product violates the requirement | **keep failing**, write the bug summary |
| I | Flaky | same code passes and fails | find the nondeterminism, prove with `--repeat-each` |
| J | Unknown | not enough evidence | say what is missing, no speculative fix |

## Phase 4 — Answer before editing

1. What failed, at which step? 2. Direct cause and its **evidence**? 3. Is the scenario still valid against the requirement? 4. Which layer changes, smallest safe change? 5. Which other tests use the same method / locator / data?

## Phase 5 — Fix & validate

Fix only what the cause needs, reuse methods (`node .claude/skills/ui-test-from-cases/scripts/list-steps.mjs <keyword>`), keep titles / tags / IDs, leave no debug code. Validate in order: `npm run lint` → the failing test → its spec → tests sharing the changed code → `--repeat-each=3` for anything intermittent.

## Report (one block per failed test)

- **Summary** — Script ID · title · spec:line · env · failed step · error · category · confidence
- **Root cause** — symptom · cause · evidence · product defect: Yes / No / Unconfirmed
- **Changes** — | File | Problem | Change | Reason |
- **Validation** — | Check | Result | Command |
- **Disposition** — `FIXED_AND_VERIFIED` · `FIXED_BUT_NOT_VERIFIED` · `APPLICATION_BUG_CONFIRMED` · `ENVIRONMENT_BLOCKED` · `NEEDS_REQUIREMENT_CLARIFICATION` · `INVESTIGATION_INCOMPLETE`

For an application bug, end with a ready-to-file summary: env, steps, expected vs actual, evidence paths.

**Success = trustworthy automation and accurate quality signals, not a green report.**
