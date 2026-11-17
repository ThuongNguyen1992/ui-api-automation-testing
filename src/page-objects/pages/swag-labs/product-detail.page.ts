import { Page } from '@playwright/test'
import type { AppPages } from '@page-objects/app-pages'
import Control from '@core/ui/control'

// PRODUCT DETAIL
const CONTAINER_DETAIL = '//div[@data-test="inventory-container" and @id="inventory_item_container"]'
const TEXT_NAME = `${CONTAINER_DETAIL}//div[@data-test="inventory-item-name"]`
const TEXT_PRICE = `${CONTAINER_DETAIL}//div[@data-test="inventory-item-price"]`
const TEXT_DESCRIPTION = `${CONTAINER_DETAIL}//div[@data-test="inventory-item-desc"]`
const BUTTON_IN_DETAIL = `${CONTAINER_DETAIL}//button[normalize-space()="%s"]`
const BUTTON_BACK_TO_PRODUCTS = '//button[@data-test="back-to-products"]'

export default class ProductDetailPage extends Control {
    constructor(page: Page, private readonly appPages: AppPages) {
        super(page)
    }

    // CHECKS DISPLAY
    async isButtonInDetailDisplayed(button: 'Add to cart' | 'Remove') {
        return await this._verify_element_visible(await this._generate_dynamic_locator(BUTTON_IN_DETAIL, button))
    }

    // ACTIONS
    async clickAddToCart() {
        await this._click_element(await this._generate_dynamic_locator(BUTTON_IN_DETAIL, 'Add to cart'))
    }
    async clickBackToProducts() {
        await this._click_element(BUTTON_BACK_TO_PRODUCTS)
    }

    // GETTERS
    async getName() {
        return (await this._get_text(TEXT_NAME))?.trim()
    }
    async getPrice() {
        return Number((await this._get_text(TEXT_PRICE))?.replace('$', ''))
    }
    async getDescription() {
        return (await this._get_text(TEXT_DESCRIPTION))?.trim()
    }
}
