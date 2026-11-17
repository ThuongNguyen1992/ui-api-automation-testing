# Test Case Inventory

Every automated test case, traced by its **Script ID** — the same ID is the spec tag (`@AUTH-LOGIN-001`), the row in this
list and the key in the report history. Run one case with `npx playwright test --grep @AUTH-LOGIN-001`.

**Oracle** = what the assertion really checks: **UI** (what the user sees) · **Data** (state re-read after reload / from the API) ·
**Side effect** (something else changed: cart emptied, session ended) · **Negative** (what must not happen).

## UI — Swag Labs (24)

| Module | Feature | Test Case | Script ID | Level | Oracle |
| --- | --- | --- | --- | --- | --- |
| Auth | Login | Login - Valid credentials - Opens the product list | AUTH-LOGIN-001 | smoke | UI |
| Auth | Login | Login - Locked-out user - Shows the locked-out error and stays on login | AUTH-LOGIN-002 | regression | UI · Negative |
| Auth | Login | Login - Wrong password - Shows the credentials error | AUTH-LOGIN-003 | regression | UI · Negative |
| Auth | Login | Login - Empty username - Shows 'username is required' | AUTH-LOGIN-004 | regression | UI · Negative |
| Auth | Login | Login - Empty password - Shows 'password is required' | AUTH-LOGIN-005 | regression | UI · Negative |
| Auth | Login | Login - Close the error message - Error disappears | AUTH-LOGIN-006 | regression | UI |
| Auth | Logout | Logout - Log out from the menu - Session ends and pages need login again | AUTH-LOGIN-007 | smoke | Side effect · Negative |
| Inventory | Product list | Product list - Open the list - Shows the full catalog with name and price | INV-LIST-001 | smoke | UI |
| Inventory | Sorting | Product list - Sort by 'Name (A to Z)' - Products are in that order | INV-SORT-001 | regression | UI |
| Inventory | Sorting | Product list - Sort by 'Name (Z to A)' - Products are in that order | INV-SORT-002 | regression | UI |
| Inventory | Sorting | Product list - Sort by 'Price (low to high)' - Products are in that order | INV-SORT-003 | regression | UI |
| Inventory | Sorting | Product list - Sort by 'Price (high to low)' - Products are in that order | INV-SORT-004 | regression | UI |
| Inventory | Product detail | Product detail - Click a product name - Detail shows the same name and price | INV-PDP-001 | regression | UI · Data |
| Inventory | Product detail | Product detail - Add to cart, then go back - Cart badge and list button are updated | INV-PDP-002 | regression | UI · Side effect |
| Cart | Add to cart | Cart - Add one product - Badge shows 1 and the button turns into Remove | CART-001 | smoke | UI |
| Cart | Add to cart | Cart - Add several products - Cart lists exactly those products, quantity 1 each | CART-002 | regression | UI · Data |
| Cart | Remove | Cart - Remove a product in the cart - Item disappears and badge decreases | CART-003 | regression | UI · Negative |
| Cart | Persistence | Cart - Reload the page - Cart content is kept | CART-004 | regression | Data |
| Cart | Reset | Cart - Use 'Reset App State' - Cart is emptied | CART-005 | regression | Side effect |
| Checkout | Order | Checkout - Buy 2 products - Totals are correct and the order is completed | CHK-001 | smoke · e2e | UI · Data · Side effect |
| Checkout | Validation | Checkout - Empty First Name - Shows 'First Name is required' and does not continue | CHK-002 | regression | UI · Negative |
| Checkout | Validation | Checkout - Empty Last Name - Shows 'Last Name is required' and does not continue | CHK-003 | regression | UI · Negative |
| Checkout | Validation | Checkout - Empty Postal Code - Shows 'Postal Code is required' and does not continue | CHK-004 | regression | UI · Negative |
| Checkout | Cancel | Checkout - Cancel on the overview - Back to the product list with the cart kept | CHK-005 | regression | UI · Data |

## API — DummyJSON (13)

| Module | Endpoint | Test Case | Script ID | Level | Checks |
| --- | --- | --- | --- | --- | --- |
| Auth | `POST /auth/login` | Valid credentials - 200 with tokens and the user profile | API-AUTH-001 | smoke | status · schema · data (JWT) |
| Auth | `POST /auth/login` | Wrong password - 400 with an error and no token | API-AUTH-002 | regression | status · exact error body |
| Auth | `GET /auth/me` | With the access token - 200 returns the same user | API-AUTH-003 | regression | status · data |
| Auth | `GET /auth/me` | Without a token - 401 | API-AUTH-004 | regression | status · error message |
| Products | `GET /products` | limit + skip - Returns that page of the catalog | API-PRD-001 | smoke | status · schema of every item · paging |
| Products | `GET /products/{id}` | Existing id - 200 with the product | API-PRD-002 | regression | status · schema · data |
| Products | `GET /products/{id}` | Unknown id - 404 with a not-found message | API-PRD-003 | regression | status · error message |
| Products | `GET /products/search` | Keyword - Every result matches the keyword | API-PRD-004 | regression | status · schema · every result relevant |
| Products | `POST /products/add` | New product - 201 echoes the fields with a new id | API-PRD-005 | regression | status · data |
| Products | `PUT /products/{id}` | Change the title - 200 returns the updated product | API-PRD-006 | regression | status · data |
| Products | `DELETE /products/{id}` | Existing id - 200 flags the product as deleted | API-PRD-007 | regression | status · flags |
| Carts | `POST /carts/add` | Products with quantities - 201 with lines and totals computed right | API-CART-001 | smoke | status · schema · business rules (totals) |
| Carts | `GET /carts/{id}` | Existing cart - 200 with consistent totals | API-CART-002 | regression | status · schema · business rules |

> DummyJSON simulates writes (add / update / delete are not persisted), so write tests assert the response contract, not a later read.
