import { test, expect } from '@core/fixtures/test.fixture'
import apiDataInput from '@data/api/api-data-input'
import { ApiStatusAssert } from '@core/api/assertions/api-status.assert'
import { expectShape, expectEachShape, type Shape } from '@core/api/assertions/api-shape.assert'

const { carts } = apiDataInput.user
const roundCents = (value: number) => Math.round(value * 100) / 100

const CART: Shape = { id: 'number', userId: 'number', products: 'array', total: 'number', totalProducts: 'number', totalQuantity: 'number' }
const CART_LINE: Shape = { id: 'number', title: 'string', price: 'number', quantity: 'number', total: 'number' }

test.describe('API - Carts', { tag: ['@api', '@regression'] }, () => {
    test('POST /carts/add - Products with quantities - 201 with lines and totals computed right', { tag: ['@API-CART-001', '@smoke'] }, async ({ apiManager }) => {
        const res = await apiManager.carts.addCart(carts.user_id, carts.items)
        ApiStatusAssert.created(res)
        expectShape(res.data, CART, 'cart')
        expectEachShape(res.data.products, CART_LINE, 'cart line')

        expect(res.data.userId, 'Owner').toBe(carts.user_id)
        expect(res.data.products.map((line) => ({ id: line.id, quantity: line.quantity })), 'Lines = requested items').toEqual(carts.items)
        // every line total = price × quantity, cart totals = sums of the lines
        for (const line of res.data.products) expect(line.total, `Line total of #${line.id}`).toBeCloseTo(line.price * line.quantity, 2)
        expect(res.data.total, 'Cart total').toBeCloseTo(roundCents(res.data.products.reduce((sum, line) => sum + line.total, 0)), 2)
        expect(res.data.totalProducts, 'Distinct products').toBe(carts.items.length)
        expect(res.data.totalQuantity, 'Total quantity').toBe(carts.items.reduce((sum, item) => sum + item.quantity, 0))
    })

    test('GET /carts/{id} - Existing cart - 200 with consistent totals', { tag: '@API-CART-002' }, async ({ apiManager }) => {
        const res = await apiManager.carts.getCart(carts.existing_cart_id)
        ApiStatusAssert.ok(res)
        expectShape(res.data, CART, 'cart')
        expectEachShape(res.data.products, CART_LINE, 'cart line')
        expect(res.data.totalProducts, 'totalProducts = number of lines').toBe(res.data.products.length)
        expect(res.data.totalQuantity, 'totalQuantity = sum of quantities').toBe(res.data.products.reduce((sum, line) => sum + line.quantity, 0))
    })
})
