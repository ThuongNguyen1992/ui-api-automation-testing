import { test, expect } from '@core/fixtures/test.fixture'
import dataInput from '@data/ui/data-input'
import Urls from '@config/urls'

const { products, checkout } = dataInput.user
const roundCents = (value: number) => Math.round(value * 100) / 100

test.describe('Shopper - Checkout', { tag: ['@regression', '@checkout'] }, () => {
    test.beforeEach(async ({ appPage }) => {
        await appPage.InventoryPage.open()
    })

    test('Checkout - Buy 2 products - Totals are correct and the order is completed', { tag: ['@CHK-001', '@smoke', '@e2e'] }, async ({ appPage }) => {
        const picked = [products.backpack, products.bike_light]
        const prices = [await appPage.InventoryPage.getProductPrice(picked[0]), await appPage.InventoryPage.getProductPrice(picked[1])]
        await appPage.CommonFlowPage.addProductsToCart(picked)
        await appPage.CommonFlowPage.checkoutWithCustomer(checkout.customer)

        // overview: same items, item total = sum of prices, tax = 8 %, total = item total + tax
        await appPage.CheckoutPage.isOverviewDisplayed()
        expect((await appPage.CheckoutPage.getOverviewItemNames()).sort(), 'Overview items').toEqual([...picked].sort())
        const itemTotal = roundCents(prices[0] + prices[1])
        const tax = roundCents(itemTotal * checkout.tax_rate)
        expect(await appPage.CheckoutPage.getItemTotal(), 'Item total').toBe(itemTotal)
        expect(await appPage.CheckoutPage.getTax(), 'Tax').toBe(tax)
        expect(await appPage.CheckoutPage.getTotal(), 'Total').toBe(roundCents(itemTotal + tax))

        await appPage.CheckoutPage.clickFinish()
        await appPage.CommonFlowPage.isUrlDisplayed(Urls.CHECKOUT_COMPLETE_URL)
        expect(await appPage.CheckoutPage.getCompleteHeader(), 'Confirmation').toBe(checkout.complete_header)
        // [Side effect] the cart is emptied after the order
        await appPage.HeaderComponent.isCartBadgeNotDisplayed()
    })

    // data-driven: each required field left empty once
    const { first_name, last_name, postal_code } = checkout.customer
    const requiredFields = [
        { id: '@CHK-002', field: 'First Name', info: { first_name: '', last_name, postal_code }, message: checkout.messages.first_name_required },
        { id: '@CHK-003', field: 'Last Name', info: { first_name, last_name: '', postal_code }, message: checkout.messages.last_name_required },
        { id: '@CHK-004', field: 'Postal Code', info: { first_name, last_name, postal_code: '' }, message: checkout.messages.postal_code_required },
    ]
    for (const c of requiredFields) {
        test(`Checkout - Empty ${c.field} - Shows '${c.field} is required' and does not continue`, { tag: c.id }, async ({ appPage }) => {
            await appPage.CommonFlowPage.addProductsToCart([products.backpack])
            await appPage.CommonFlowPage.checkoutWithCustomer(c.info)
            expect(await appPage.CheckoutPage.getErrorMessage(), `${c.field} error`).toBe(c.message)
            await appPage.CommonFlowPage.isUrlDisplayed(/checkout-step-one\.html/)
        })
    }

    test('Checkout - Cancel on the overview - Back to the product list with the cart kept', { tag: '@CHK-005' }, async ({ appPage }) => {
        await appPage.CommonFlowPage.addProductsToCart([products.backpack])
        await appPage.CommonFlowPage.checkoutWithCustomer(checkout.customer)
        await appPage.CheckoutPage.isOverviewDisplayed()
        await appPage.CheckoutPage.clickCancel()
        await appPage.CommonFlowPage.isUrlDisplayed(Urls.INVENTORY_URL)
        expect(await appPage.HeaderComponent.getCartBadgeCount(), 'Cart kept after cancel').toBe(1)
    })
})
