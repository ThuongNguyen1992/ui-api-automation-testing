import { test, expect } from '@core/fixtures/test.fixture'
import dataInput from '@data/ui/data-input'

const { products } = dataInput.user

test.describe('Shopper - Cart', { tag: ['@regression', '@cart'] }, () => {
    test.beforeEach(async ({ appPage }) => {
        await appPage.InventoryPage.open()
    })

    test('Cart - Add one product - Badge shows 1 and the button turns into Remove', { tag: ['@CART-001', '@smoke'] }, async ({ appPage }) => {
        await appPage.InventoryPage.clickAddToCart(products.backpack)
        await appPage.InventoryPage.isButtonInProductCardDisplayed(products.backpack, 'Remove')
        expect(await appPage.HeaderComponent.getCartBadgeCount(), 'Cart badge').toBe(1)
    })

    test('Cart - Add several products - Cart lists exactly those products, quantity 1 each', { tag: '@CART-002' }, async ({ appPage }) => {
        const picked = [products.backpack, products.bike_light, products.fleece_jacket]
        await appPage.CommonFlowPage.addProductsToCart(picked)
        expect(await appPage.HeaderComponent.getCartBadgeCount(), 'Cart badge').toBe(picked.length)

        await appPage.HeaderComponent.clickCart()
        expect((await appPage.CartPage.getCartItemNames()).sort(), 'Cart content').toEqual([...picked].sort())
        for (const name of picked) expect(await appPage.CartPage.getItemQuantity(name), `Quantity of ${name}`).toBe(1)
    })

    test('Cart - Remove a product in the cart - Item disappears and badge decreases', { tag: '@CART-003' }, async ({ appPage }) => {
        await appPage.CommonFlowPage.addProductsToCart([products.backpack, products.bike_light])
        await appPage.HeaderComponent.clickCart()
        await appPage.CartPage.clickRemove(products.backpack)
        await appPage.CartPage.isCartItemNotDisplayed(products.backpack)
        await appPage.CartPage.isCartItemDisplayed(products.bike_light)
        expect(await appPage.HeaderComponent.getCartBadgeCount(), 'Cart badge').toBe(1)
    })

    test('Cart - Reload the page - Cart content is kept', { tag: '@CART-004' }, async ({ appPage }) => {
        await appPage.CommonFlowPage.addProductsToCart([products.bolt_tshirt])
        await appPage.CommonFlowPage.reloadPage()
        // [Data] re-read after reload, not the optimistic UI
        expect(await appPage.HeaderComponent.getCartBadgeCount(), 'Cart badge after reload').toBe(1)
        await appPage.CartPage.open()
        expect(await appPage.CartPage.getCartItemNames(), 'Cart content after reload').toEqual([products.bolt_tshirt])
    })

    test("Cart - Use 'Reset App State' - Cart is emptied", { tag: '@CART-005' }, async ({ appPage }) => {
        await appPage.CommonFlowPage.addProductsToCart([products.backpack, products.bike_light])
        await appPage.HeaderComponent.clickMenuItem('Reset App State')
        await appPage.HeaderComponent.isCartBadgeNotDisplayed()
        await appPage.CartPage.open()
        expect(await appPage.CartPage.getCartItemNames(), 'Cart is empty').toEqual([])
    })
})
