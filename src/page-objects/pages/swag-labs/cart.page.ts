import { Page } from '@playwright/test'
import type { AppPages } from '@page-objects/app-pages'
import Control from '@core/ui/control'
import Urls from '@config/urls'

// CART
const LIST_CART_ITEM_NAME = '//div[@data-test="cart-list"]//div[@data-test="inventory-item-name"]'
const ROW_CART_ITEM = '//div[@data-test="cart-list"]//div[@data-test="inventory-item"][.//div[@data-test="inventory-item-name" and normalize-space()="%s"]]'
const TEXT_ITEM_QUANTITY = `${ROW_CART_ITEM}//div[@data-test="item-quantity"]`
const BUTTON_REMOVE_ITEM = `${ROW_CART_ITEM}//button[normalize-space()="Remove"]`
const BUTTON_CHECKOUT = '//button[@data-test="checkout"]'
const BUTTON_CONTINUE_SHOPPING = '//button[@data-test="continue-shopping"]'

export default class CartPage extends Control {
    constructor(page: Page, private readonly appPages: AppPages) {
        super(page)
    }

    // CHECKS DISPLAY
    async isCartItemDisplayed(productName: string) {
        return await this._verify_element_visible(await this._generate_dynamic_locator(ROW_CART_ITEM, productName))
    }
    async isCartItemNotDisplayed(productName: string) {
        return await this._verify_element_not_visible(await this._generate_dynamic_locator(ROW_CART_ITEM, productName))
    }

    // ACTIONS
    async open() {
        await this._goto(Urls.CART_URL)
    }
    async clickRemove(productName: string) {
        await this._click_element(await this._generate_dynamic_locator(BUTTON_REMOVE_ITEM, productName))
    }
    async clickCheckout() {
        await this._click_element(BUTTON_CHECKOUT)
    }
    async clickContinueShopping() {
        await this._click_element(BUTTON_CONTINUE_SHOPPING)
    }

    // GETTERS
    // empty cart → [] (no item row to wait for)
    async getCartItemNames() {
        await this._wait_for_element_displayed(BUTTON_CHECKOUT)
        return (await this._get_locator(LIST_CART_ITEM_NAME).allTextContents()).map((name) => name.trim())
    }
    async getItemQuantity(productName: string) {
        return Number(await this._get_text(await this._generate_dynamic_locator(TEXT_ITEM_QUANTITY, productName)))
    }
}
