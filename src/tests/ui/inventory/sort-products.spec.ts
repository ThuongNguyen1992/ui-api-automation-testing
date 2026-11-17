import { test, expect } from '@core/fixtures/test.fixture'
import dataInput from '@data/ui/data-input'

const { products, sort_options } = dataInput.user

test.describe('Shopper - Product list', { tag: ['@regression', '@inventory'] }, () => {
    test.beforeEach(async ({ appPage }) => {
        await appPage.InventoryPage.open()
    })

    test('Product list - Open the list - Shows the full catalog with name and price', { tag: ['@INV-LIST-001', '@smoke'] }, async ({ appPage }) => {
        const names = await appPage.InventoryPage.getProductNames()
        const prices = await appPage.InventoryPage.getProductPrices()
        expect(names, 'Catalog size').toHaveLength(products.catalog_size)
        expect(prices, 'Every product has a price').toHaveLength(products.catalog_size)
        expect(prices.every((price) => price > 0), `All prices are positive (${prices.join(', ')})`).toBe(true)
    })

    // data-driven: one test per sort option — the oracle is the same list sorted in the test
    const byName = (a: string, b: string) => a.localeCompare(b)
    const sortCases = [
        { id: '@INV-SORT-001', option: sort_options.name_asc, read: 'names', compare: byName },
        { id: '@INV-SORT-002', option: sort_options.name_desc, read: 'names', compare: (a: string, b: string) => byName(b, a) },
        { id: '@INV-SORT-003', option: sort_options.price_asc, read: 'prices', compare: (a: number, b: number) => a - b },
        { id: '@INV-SORT-004', option: sort_options.price_desc, read: 'prices', compare: (a: number, b: number) => b - a },
    ] as const
    for (const c of sortCases) {
        test(`Product list - Sort by '${c.option}' - Products are in that order`, { tag: c.id }, async ({ appPage }) => {
            await appPage.InventoryPage.selectSortOption(c.option)
            expect(await appPage.InventoryPage.getActiveSortOption(), 'Selected sort option').toBe(c.option)

            const actual: (string | number)[] = c.read === 'names' ? await appPage.InventoryPage.getProductNames() : await appPage.InventoryPage.getProductPrices()
            const expected = [...actual].sort(c.compare as (a: string | number, b: string | number) => number)
            expect(actual, `Order after '${c.option}'`).toEqual(expected)
            expect(actual, 'Sorting keeps the whole catalog').toHaveLength(products.catalog_size)
        })
    }
})
