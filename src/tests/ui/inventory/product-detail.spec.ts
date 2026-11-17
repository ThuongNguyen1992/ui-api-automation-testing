import { test, expect } from '@core/fixtures/test.fixture'
import dataInput from '@data/ui/data-input'
import Urls from '@config/urls'

const { products } = dataInput.user

test.describe('Shopper - Product detail', { tag: ['@regression', '@inventory'] }, () => {
    test.beforeEach(async ({ appPage }) => {
        await appPage.InventoryPage.open()
    })

    test('Product detail - Click a product name - Detail shows the same name and price', { tag: '@INV-PDP-001' }, async ({ appPage }) => {
        const listPrice = await appPage.InventoryPage.getProductPrice(products.bike_light)
        await appPage.InventoryPage.clickProductName(products.bike_light)
        await appPage.CommonFlowPage.isUrlDisplayed(/inventory-item\.html\?id=\d+/)
        expect(await appPage.ProductDetailPage.getName(), 'Product name').toBe(products.bike_light)
        expect(await appPage.ProductDetailPage.getPrice(), 'Same price as in the list').toBe(listPrice)
        expect(await appPage.ProductDetailPage.getDescription(), 'Has a description').not.toBe('')
    })

    test('Product detail - Add to cart, then go back - Cart badge and list button are updated', { tag: '@INV-PDP-002' }, async ({ appPage }) => {
        await appPage.InventoryPage.clickProductName(products.bike_light)
        await appPage.ProductDetailPage.clickAddToCart()
        await appPage.ProductDetailPage.isButtonInDetailDisplayed('Remove')
        expect(await appPage.HeaderComponent.getCartBadgeCount(), 'Cart badge').toBe(1)

        await appPage.ProductDetailPage.clickBackToProducts()
        await appPage.CommonFlowPage.isUrlDisplayed(Urls.INVENTORY_URL)
        await appPage.InventoryPage.isButtonInProductCardDisplayed(products.bike_light, 'Remove')
    })
})
