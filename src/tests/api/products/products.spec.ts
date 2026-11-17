import { test, expect } from '@core/fixtures/test.fixture'
import apiDataInput from '@data/api/api-data-input'
import { ApiStatusAssert } from '@core/api/assertions/api-status.assert'
import { expectShape, expectEachShape, type Shape } from '@core/api/assertions/api-shape.assert'

const { products, messages } = apiDataInput.user

const PRODUCT: Shape = {
    id: 'number', title: 'string', description: 'string', category: 'string',
    price: 'number', rating: 'number', stock: 'number', tags: 'array', images: 'array',
}
const PRODUCT_PAGE: Shape = { products: 'array', total: 'number', skip: 'number', limit: 'number' }

test.describe('API - Products', { tag: ['@api', '@regression'] }, () => {
    test('GET /products - limit + skip - Returns that page of the catalog', { tag: ['@API-PRD-001', '@smoke'] }, async ({ apiManager }) => {
        const { limit, skip } = products.page
        const res = await apiManager.products.getProducts(limit, skip)
        ApiStatusAssert.ok(res)
        expectShape(res.data, PRODUCT_PAGE, 'product page')
        expectEachShape(res.data.products, PRODUCT, 'product')
        expect(res.data.limit, 'limit echoed').toBe(limit)
        expect(res.data.skip, 'skip echoed').toBe(skip)
        expect(res.data.products.map((p) => p.id), 'Ids follow the skip').toEqual(Array.from({ length: limit }, (_, i) => skip + i + 1))
        expect(res.data.total, 'Total is larger than the page').toBeGreaterThan(limit)
    })

    test('GET /products/{id} - Existing id - 200 with the product', { tag: '@API-PRD-002' }, async ({ apiManager }) => {
        const res = await apiManager.products.getProduct(products.existing_id)
        ApiStatusAssert.ok(res)
        expectShape(res.data, PRODUCT, 'product')
        expect(res.data.id, 'Requested id').toBe(products.existing_id)
        expect(res.data.price, 'Price is positive').toBeGreaterThan(0)
    })

    test('GET /products/{id} - Unknown id - 404 with a not-found message', { tag: '@API-PRD-003' }, async ({ apiManager }) => {
        const res = await apiManager.products.getProduct(products.missing_id)
        ApiStatusAssert.notFound(res)
        expect(res.data.message, 'Not-found message').toBe(messages.product_not_found.replace('%s', String(products.missing_id)))
    })

    test('GET /products/search - Keyword - Every result matches the keyword', { tag: '@API-PRD-004' }, async ({ apiManager }) => {
        const res = await apiManager.products.searchProducts(products.search_keyword)
        ApiStatusAssert.ok(res)
        expectEachShape(res.data.products, PRODUCT, 'result')
        const keyword = products.search_keyword.toLowerCase()
        const unrelated = res.data.products.filter((p) => !`${p.title} ${p.description} ${p.category}`.toLowerCase().includes(keyword)).map((p) => p.title)
        expect(unrelated, `Results without '${keyword}'`).toEqual([])
    })

    test('POST /products/add - New product - 201 echoes the fields with a new id', { tag: '@API-PRD-005' }, async ({ apiManager }) => {
        const res = await apiManager.products.addProduct(products.new_product)
        ApiStatusAssert.created(res)
        expect(res.data, 'Created product').toMatchObject(products.new_product)
        expect(res.data.id, 'New id assigned').toEqual(expect.any(Number))
    })

    test('PUT /products/{id} - Change the title - 200 returns the updated product', { tag: '@API-PRD-006' }, async ({ apiManager }) => {
        const res = await apiManager.products.updateProduct(products.existing_id, { title: products.updated_title })
        ApiStatusAssert.ok(res)
        expect(res.data.id, 'Same product').toBe(products.existing_id)
        expect(res.data.title, 'Updated title').toBe(products.updated_title)
    })

    test('DELETE /products/{id} - Existing id - 200 flags the product as deleted', { tag: '@API-PRD-007' }, async ({ apiManager }) => {
        const res = await apiManager.products.deleteProduct(products.existing_id)
        ApiStatusAssert.ok(res)
        expect(res.data.id, 'Deleted product').toBe(products.existing_id)
        expect(res.data.isDeleted, 'isDeleted flag').toBe(true)
        expect(Number.isNaN(Date.parse(res.data.deletedOn)), `deletedOn is a date (${res.data.deletedOn})`).toBe(false)
    })
})
