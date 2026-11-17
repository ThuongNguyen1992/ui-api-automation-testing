import { Page } from '@playwright/test'
import type { AppPages } from '@page-objects/app-pages'
import Control from '@core/ui/control'
import Urls from '@config/urls'

// PRODUCT LIST
const LIST_PRODUCT_NAME = '//div[@data-test="inventory-list"]//div[@data-test="inventory-item-name"]'
const LIST_PRODUCT_PRICE = '//div[@data-test="inventory-list"]//div[@data-test="inventory-item-price"]'
const SELECT_SORT = '//select[@data-test="product-sort-container"]'
const TEXT_ACTIVE_SORT = '//span[@data-test="active-option"]'

// PRODUCT CARD — %s = product name
const CARD_PRODUCT = '//div[@data-test="inventory-item"][.//div[@data-test="inventory-item-name" and normalize-space()="%s"]]'
const LINK_PRODUCT_NAME = `${CARD_PRODUCT}//div[@data-test="inventory-item-name"]`
const TEXT_PRODUCT_PRICE = `${CARD_PRODUCT}//div[@data-test="inventory-item-price"]`
const BUTTON_IN_CARD = `${CARD_PRODUCT}//button[normalize-space()="%s"]`

export default class InventoryPage extends Control {
    constructor(page: Page, private readonly appPages: AppPages) {
        super(page)
    }

    // CHECKS DISPLAY
    async isButtonInProductCardDisplayed(productName: string, button: 'Add to cart' | 'Remove') {
        return await this._verify_element_visible(await this._generate_dynamic_locator(BUTTON_IN_CARD, [productName, button]))
    }

    // ACTIONS
    async open() {
        await this._goto(Urls.INVENTORY_URL)
    }
    async selectSortOption(option: string) {
        await this._select_by_text(SELECT_SORT, option)
    }
    async clickAddToCart(productName: string) {
        await this._click_element(await this._generate_dynamic_locator(BUTTON_IN_CARD, [productName, 'Add to cart']))
    }
    async clickRemove(productName: string) {
        await this._click_element(await this._generate_dynamic_locator(BUTTON_IN_CARD, [productName, 'Remove']))
    }
    async clickProductName(productName: string) {
        await this._click_element(await this._generate_dynamic_locator(LINK_PRODUCT_NAME, productName))
    }

    // GETTERS
    async getProductNames() {
        return (await this._get_text_all(LIST_PRODUCT_NAME))?.map((name) => name.trim()) ?? []
    }
    // "$29.99" → 29.99, in display order
    async getProductPrices() {
        return (await this._get_text_all(LIST_PRODUCT_PRICE))?.map((price) => Number(price.replace('$', ''))) ?? []
    }
    async getProductPrice(productName: string) {
        return Number((await this._get_text(await this._generate_dynamic_locator(TEXT_PRODUCT_PRICE, productName)))?.replace('$', ''))
    }
    async getActiveSortOption() {
        return (await this._get_text(TEXT_ACTIVE_SORT))?.trim()
    }
}
