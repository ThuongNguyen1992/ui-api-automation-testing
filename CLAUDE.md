# CLAUDE.md

Guidance for Claude Code in this repo. Full conventions: [README.md](README.md).

## Commands

```bash
npm run lint                                         # tsc --noEmit
env=local_stag_chrome_true npx playwright test       # all tests, headless
npx playwright test --grep @CART-001                 # one test by Script ID
npm run test:api                                     # API projects only
npm run k6:smoke                                     # k6 smoke (needs k6 installed)
npm run report:summary                               # last run as a Markdown table
```

## Rules

- Specs call only `appPage.<Page>.<method>()` / `apiManager.<service>.<method>()` — no locators, URLs, headers or data in specs.
- Locators: XPath constants at the top of page objects, exact `@data-test` / text / `%s`, never by position.
- Every Expected Result has an assertion that fails when the product is wrong. A product bug keeps the test red.
- Every test has a unique Script ID tag listed in `docs/test-cases.md`.
- Run tests headless; never report a result that was not run. Do not commit or push unless asked.

## Skills

| Skill | Use for |
| --- | --- |
| `/ui-test-from-cases` | test case table → UI automation |
| `/api-testing` | endpoint / cURL → API tests |
| `/qa-failure-analyzer` | failed or flaky test → root cause and fix |
