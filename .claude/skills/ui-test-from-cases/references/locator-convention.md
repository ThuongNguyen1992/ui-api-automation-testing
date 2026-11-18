# Locator convention — no positions

Part of Phase 6 of `SKILL.md`. Read before writing or fixing a locator.

**Instead of a position → use this:**

| ❌ Positional | ✅ Replacement | Example in this repo |
| --- | --- | --- |
| `(//div[@data-test="inventory-item"])[3]` — N-th card | card found by its displayed name (from test data) | `CARD_PRODUCT = '//div[@data-test="inventory-item"][.//div[@data-test="inventory-item-name" and normalize-space()="%s"]]'` |
| `(//button)[2]` inside a card | button by exact text, scoped to the card | `BUTTON_IN_CARD = \`${CARD_PRODUCT}//button[normalize-space()="%s"]\`` |
| `following::div[1]` — price next to a name | same container, exact attribute | `TEXT_PRODUCT_PRICE = \`${CARD_PRODUCT}//div[@data-test="inventory-item-price"]\`` |
| `//input[2]` — 2nd form field | exact `@data-test` / `@id` / `@name` | `FIELD_LAST_NAME = '//input[@data-test="lastName"]'` |
| `ancestor::div[4]` | container by what it contains | `ROW_CART_ITEM = '//div[@data-test="cart-list"]//div[@data-test="inventory-item"][.//div[@data-test="inventory-item-name" and normalize-space()="%s"]]'` |

**Lists:** a `LIST_` constant reads every item (`_get_text_all`) to compare order or content — never to pick the N-th one.

**Responsive duplicates** (desktop + hidden mobile copy): `this._get_visible_locator(LOC)` from `Control` is the only place where "first visible" is allowed.

**`%s` values come from test data** (`dataInput.user.products.backpack`) and must exist on that environment. A value containing `"` breaks the XPath (the helper does not escape it) → choose data without `"`.

**Check before keeping it:** `$x('<xpath>').length` in DevTools must be `1` (or the expected list size).
