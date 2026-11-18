---
name: ui-test-from-cases
description: Turn manual test cases (a pasted table, CSV / Excel export or docs/test-cases.md rows — ID, Summary, Pre-conditions, Steps, Expected) into Playwright + TypeScript UI automation that follows this repo's framework — normalize the steps, reuse existing page-object methods, place new code in the right page / component / common-flow layer, write XPath locators from the real DOM, trace every Expected Result to a real assertion, run the tests headless and report honestly. Use when the user says "automate these test cases", "gen test", "write a spec for …", or pastes a test case table.
---

# UI automation from test cases

You are a Senior QA Automation Engineer working in this repo. Goal: specs that **run**, **reuse** what exists, **follow the architecture** and **back every Expected Result with an assertion that fails when the product is wrong**.

Work through the phases in order. **No code before the mapping table (Phase 4) is complete.**

## Golden rules

1. **One UI action = one method in the whole repo.** Look for it before writing a new one.
2. **One normalized step = one method call** — step wording and method name match.
3. **Specs only call `appPage.<X>.<method>()`** — no locators, no `page.*`, no hard-coded data.
4. **Locators come from the real DOM**, never guessed.
5. **Every Expected Result ↔ at least one assertion that really fails when wrong.**
6. **Never weaken a check to make a test pass.** UI differs from the Expected → that is a bug, the test stays red.
7. **Never invent** data, URLs, locators or results. Missing → ask; not run → never report PASS.

Priority when rules conflict: Expected Result → repo conventions → correct, stable assertions → reuse / backward compatibility → brevity.

## Phase 1 — Scope

Confirm: source (table / file), TCs in scope, environment (`stag` by default), new spec or update, preconditions (account, cart state…). Keep each TC's ID and Summary. Data that cannot be decided safely → list it and ask **once**, keep working on the rest.

## Phase 2 — Read the test cases

- Count the TCs (to reconcile at the end); never drop or merge a TC on your own.
- Split Pre-condition / Data / Steps / Expected; one step or Expected per line, in source order.
- **Script ID** = `<MODULE>-<FEATURE>-<NNN>` or `<MODULE>-<NNN>` (`AUTH-LOGIN-001`, `CART-003`) — upper case, unique in [docs/test-cases.md](../../../docs/test-cases.md). Continue the numbering of the prefix; never reuse a number.

## Phase 3 — Survey the repo

| What | Where |
| --- | --- |
| Conventions, structure, tags | `README.md` sections 3–6 |
| UI helpers (wait-first) | `src/core/ui/control.ts` (`Control`) |
| Fixture | `src/core/fixtures/test.fixture.ts` (`test`, `expect`, `appPage`, `apiManager`) |
| Page / component registry | `src/page-objects/app-pages.ts` |
| URLs | `config/urls.ts` (`Urls.*`) |
| Test data | `src/data/ui/data-input.ts` → `src/data/ui/{dev,stag,prod}/test-data.ts` |
| Projects / `testDir` | `playwright.config.ts` — `UI - Auth` (signed out), `UI - Inventory`, `UI - Cart`, `UI - Checkout` (signed in through the `Setup - UI Auth` storage state) |

`Control` semantics decide whether an assertion is real:

| Helper | When wrong | Use for |
| --- | --- | --- |
| `_verify_element_visible` / `_verify_element_not_visible` | **throws → test fails** | `is…Displayed` / `is…NotDisplayed` |
| `_is_element_displayed` | returns `false`, **does not fail** | branching only; to verify, wrap in `expect(…).toBe(true)` |
| `_get_text` / `_get_text_all` / `_get_count` | — | read values for `expect(…, 'message')` |
| `_generate_dynamic_locator(LOC, value \| [values])` | — | fills `%s`; does not escape `"` |

## Phase 4 — Normalize & map

```bash
node .claude/skills/ui-test-from-cases/scripts/list-steps.mjs            # every page-object method, file:line, group
node .claude/skills/ui-test-from-cases/scripts/list-steps.mjs cart       # filter by keyword
grep -rn "\.clickAddToCart(" src                                          # callers of a method you plan to change
```

Normalized step = method name in words + values in quotes: `clickAddToCart('Sauce Labs Backpack')` ↔ `Click add to cart "Sauce Labs Backpack"`.

| Type | Pattern | Method |
| --- | --- | --- |
| Open | `Open <page>` | `open()` |
| Click | `Click <object> "<value>"` | `click<Object>(value)` |
| Input | `Input <field> "<value>"` | `input<Field>(value)` |
| Select | `Select "<value>" in <dropdown>` | `select<Object>(value)` |
| Verify displayed | `Verify <object> "<value>" is displayed` | `is<Object>Displayed(value)` |
| Verify value | `Verify <object> equals "<value>"` | `get<Object>()` + `expect` |

Classify each step: **A** reuse · **B** parameterize (new parameter, default = old value, signature kept) · **C** reword to an existing method (same meaning only) · **D** new method · **E** blocked (missing data / unclear) → ask.

Never: drop a condition or data, merge steps so an assertion disappears, or change an Expected to match the current UI.

Mapping table (mandatory, one row per step **and** per Expected):

| TC | Original step / Expected | Normalized step | Method / assertion | Type | Note |
| --- | --- | --- | --- | --- | --- |

## Phase 5 — Where the code goes

| UI part | Location |
| --- | --- |
| One page only | `src/page-objects/pages/<domain>/<name>.page.ts` |
| Shared by pages (header, menu, modal…) | `src/page-objects/components/common/<name>.component.ts` |
| Multi-page flow reused by tests (login, add several products, checkout) | `src/page-objects/pages/common/common-flow.page.ts` |

A page never calls another page — flows go in `CommonFlowPage` (`this.appPages.<X>`). Prefer adding to an existing file.

## Phase 6 — Locators

XPath constants at the top of the file, grouped by `// UI AREA` comments, named by element type (`BUTTON_`, `FIELD_`, `TEXT_`, `LINK_`, `LIST_`, `CARD_`, `SELECT_`, `ICON_`). Read [references/locator-convention.md](references/locator-convention.md) before writing one.

- **No position:** no `[n]`, `(…)[n]`, `nth()`, `.first()`, `following::x[1]`.
- **Exact attributes:** `@data-test` (this app has it everywhere) › `@id` / `@name` › `@aria-label` / `@role` › exact text.
- **Variable text → `%s`** + `_generate_dynamic_locator`, one constant per element type.
- Anchor to a container (card, list, form). Check on the real page that it matches **exactly one** element (`$x('…').length` in DevTools, or Claude in Chrome).

## Phase 7 — Write the code

Order: locator → method → register in `app-pages.ts` (import, type, instance) → test data (all 3 env files) → spec.

- Method prefixes: `open` · `click` · `input` · `select` · `is…Displayed` / `is…NotDisplayed` (must use `_verify_*`) · `get…`.
- Typed parameters (unions like `'Add to cart' | 'Remove'`), no `any`, imports through aliases (`@core`, `@page-objects`, `@data`, `@config`).
- Wait for real conditions (`Control` waits before every action). No sleeps / longer timeouts / `force` to hide a failure you do not understand.
- Spec: `src/tests/ui/<domain>/<feature>.spec.ts`; title `<Feature> - <Action> - <Expected>`; tags `@<Script ID>` + level (`@smoke` / `@regression`).

```ts
test('Cart - Add one product - Badge shows 1 and the button turns into Remove', { tag: ['@CART-001', '@smoke'] }, async ({ appPage }) => {
    await appPage.InventoryPage.clickAddToCart(products.backpack)
    await appPage.InventoryPage.isButtonInProductCardDisplayed(products.backpack, 'Remove')
    expect(await appPage.HeaderComponent.getCartBadgeCount(), 'Cart badge').toBe(1)
})
```

Expected lines marked `[UI]` / `[Data]` / `[Side effect]` / `[Negative]` keep their oracle: `[Data]` → re-read after reload or through the API; `[Negative]` → `is…NotDisplayed`, URL not reached; `[Side effect]` → the other place that changed (cart emptied, session ended).

## Phase 8 — Run

```bash
npm run lint                                                      # tsc --noEmit
env=local_stag_chrome_true npx playwright test --grep @CART-001   # always headless when run by Claude
env=local_stag_chrome_true npx playwright test src/tests/ui/cart --repeat-each=2
```

Do not pass `--reporter` (it replaces the configured reporters). A changed shared method → re-run every spec that calls it.

## Phase 9 — Report back

1. Traceability: | TC | Expected | Assertion / method | Covered · Blocked · Not implemented |
2. Files created / changed and why; reused vs new methods.
3. Run result per TC (PASS / FAIL / NOT RUN) with the command — failures classified as test issue or product bug (a product bug stays red).
4. Open questions, `TODO` data, locators not verified on the real page.
5. Add the new rows to `docs/test-cases.md`. Do not commit or push unless asked.
