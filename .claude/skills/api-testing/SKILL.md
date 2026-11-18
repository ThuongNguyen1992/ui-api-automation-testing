---
name: api-testing
description: Write or fix API tests (Playwright + TypeScript) with this repo's API framework — a service extending RequestApi, registered in api-manager, called through the apiManager fixture, data per environment in src/data/api, and every test checking status + response shape + business data or a negative condition. Use when the user says "write an API test", "test this endpoint", pastes a cURL / Swagger / endpoint, or asks to cover an API.
---

# API tests

You are a Senior QA Automation Engineer. Goal: API tests that **run**, go through the **right layers** (service → manager → spec), **check for real** (not just `200`) and **never swallow errors**.

## Rules

1. **Specs only call `apiManager.<service>.<method>()`** — no URL, header or token in a spec.
2. **One endpoint = one service method.** Look first: `grep -rn "async " src/api/services`.
3. **Never only the status.** Each test: status + shape + at least one data check or negative check.
4. **No swallowed errors:** no `try/catch` in specs / services, no `any` to dodge types.
5. **Never invent endpoints or fields.** Source: docs / Swagger / a cURL from the user / a real response. Unsure → ask.
6. **Data you create is unique** (timestamp) and cleaned up; tests do not depend on each other's order.
7. **Production is read-only** — no POST / PUT / PATCH / DELETE on prod.
8. A real API bug (response violates the requirement) → **the test stays red**, report it.

## Repo map

| What | Where |
| --- | --- |
| HTTP client | `src/core/api/client/request-api.ts` — `sendRequest<T>(method, url, headers, body?)` → `{ status, data, pass }`, one Allure step per call (`METHOD url`) |
| Headers / token | `src/core/api/headers/headers-api.ts` (`HeadersApi.authHeaders(token?)`) · `src/core/api/auth/get-token.ts` (`getToken(this.request)`) |
| Status asserts | `src/core/api/assertions/api-status.assert.ts` — `ApiStatusAssert.ok / created / badRequest / unauthorized / notFound (res)` (prints the body when wrong) |
| Shape asserts | `src/core/api/assertions/api-shape.assert.ts` — `expectShape(obj, SHAPE)` · `expectEachShape(list, SHAPE)` |
| Services | `src/api/services/<feature>/<name>.service.ts` — `extends Request`, typed return |
| Registry | `src/api/api-manager.ts` (type + `createApiManager`) |
| Data / base URL | `src/data/api/api-data-input.ts` → `src/data/api/{dev,stag,prod}/api-data.ts` |
| Projects | `API - Auth`, `API - Products`, `API - Carts` in `playwright.config.ts` → `src/tests/api/<feature>` |

## Steps

1. **Endpoint facts** — method, path, auth (public / Bearer), query / body, a real response (status + body).
2. **Script ID** — `API-<FEATURE>-<NNN>` (`API-PRD-008`), unique in `docs/test-cases.md`.
3. **Service** — add a typed method; new service → register it in `api-manager.ts`.

```ts
async getProduct(id: number) {
    const header = await HeadersApi.authHeaders()
    return await this.sendRequest<Product & { message?: string }>('GET', `${this.baseUrl}/products/${id}`, header)
}
```

4. **Oracles — at least 2 per test:**

| Oracle | Checks | Example |
| --- | --- | --- |
| Status + contract | status and every field's type | `ApiStatusAssert.ok(res)` + `expectShape(res.data, PRODUCT)` |
| Data | business values | search "phone" → every result contains "phone"; cart totals = Σ price × quantity |
| Side effect | another place changed | create → read it back (when the API persists) |
| Negative | what must not happen | no token → `401` and no data; unknown id → `404` with the exact message |

5. **Spec** — `src/tests/api/<feature>/<feature>.spec.ts`, describe tags `@api` + level, test title `METHOD /path - Condition - Expected`, tag `@<Script ID>`.

```ts
test('GET /products/{id} - Unknown id - 404 with a not-found message', { tag: '@API-PRD-003' }, async ({ apiManager }) => {
    const res = await apiManager.products.getProduct(products.missing_id)
    ApiStatusAssert.notFound(res)
    expect(res.data.message, 'Not-found message').toBe(messages.product_not_found.replace('%s', String(products.missing_id)))
})
```

Minimum set for a read endpoint: happy path (shape + data) · filter / search meaning · paging · missing / bad token → 401. For a write endpoint: valid body → echoed fields · missing required field → 4xx and nothing created.

6. **Run**

```bash
npm run lint
npx playwright test --project="API - Products"
npx playwright test --grep @API-PRD-003 --repeat-each=2
```

7. **Report** — endpoints covered, files changed, TC → oracle table, real run results (never PASS for a test not run), suspected API bugs, open questions. Add the rows to `docs/test-cases.md`. Do not commit or push unless asked.

## Checklist

- [ ] Endpoint / fields from a real source
- [ ] Typed service, registered; no URL / header / token in specs
- [ ] ≥ 2 oracle kinds per test, at least one negative test per endpoint
- [ ] No `any`, no swallowed errors, prod read-only
- [ ] `npm run lint` passes, specs actually run
