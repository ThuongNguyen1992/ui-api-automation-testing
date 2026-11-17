import { Page } from '@playwright/test'
import type { AppPages } from '@page-objects/app-pages'
import Control from '@core/ui/control'

// STEP ONE — YOUR INFORMATION
const FIELD_FIRST_NAME = '//input[@data-test="firstName"]'
const FIELD_LAST_NAME = '//input[@data-test="lastName"]'
const FIELD_POSTAL_CODE = '//input[@data-test="postalCode"]'
const BUTTON_CONTINUE = '//input[@data-test="continue"]'
const BUTTON_CANCEL = '//button[@data-test="cancel"]'
const TEXT_ERROR = '//h3[@data-test="error"]'

// STEP TWO — OVERVIEW
const LIST_OVERVIEW_ITEM_NAME = '//div[@data-test="cart-list"]//div[@data-test="inventory-item-name"]'
const TEXT_ITEM_TOTAL = '//div[@data-test="subtotal-label"]'
const TEXT_TAX = '//div[@data-test="tax-label"]'
const TEXT_TOTAL = '//div[@data-test="total-label"]'
const BUTTON_FINISH = '//button[@data-test="finish"]'

// COMPLETE
const TEXT_COMPLETE_HEADER = '//h2[@data-test="complete-header"]'

export type CustomerInfo = { first_name: string; last_name: string; postal_code: string }

export default class CheckoutPage extends Control {
    constructor(page: Page, private readonly appPages: AppPages) {
        super(page)
    }

    // CHECKS DISPLAY
    async isOverviewDisplayed() {
        return await this._verify_element_visible(BUTTON_FINISH)
    }

    // INPUTS
    async inputFirstName(firstName: string) {
        await this._set_value(FIELD_FIRST_NAME, firstName)
    }
    async inputLastName(lastName: string) {
        await this._set_value(FIELD_LAST_NAME, lastName)
    }
    async inputPostalCode(postalCode: string) {
        await this._set_value(FIELD_POSTAL_CODE, postalCode)
    }
    // one call per field, so a test can leave any field empty
    async inputCustomerInfo(customer: Partial<CustomerInfo>) {
        if (customer.first_name !== undefined) await this.inputFirstName(customer.first_name)
        if (customer.last_name !== undefined) await this.inputLastName(customer.last_name)
        if (customer.postal_code !== undefined) await this.inputPostalCode(customer.postal_code)
    }

    // ACTIONS
    async clickContinue() {
        await this._click_element(BUTTON_CONTINUE)
    }
    async clickCancel() {
        await this._click_element(BUTTON_CANCEL)
    }
    async clickFinish() {
        await this._click_element(BUTTON_FINISH)
    }

    // GETTERS
    async getErrorMessage() {
        return (await this._get_text(TEXT_ERROR))?.trim()
    }
    async getOverviewItemNames() {
        return (await this._get_text_all(LIST_OVERVIEW_ITEM_NAME))?.map((name) => name.trim()) ?? []
    }
    // "Item total: $39.98" → 39.98
    private async getAmount(locator: string) {
        return Number((await this._get_text(locator))?.replace(/[^\d.]/g, ''))
    }
    async getItemTotal() {
        return await this.getAmount(TEXT_ITEM_TOTAL)
    }
    async getTax() {
        return await this.getAmount(TEXT_TAX)
    }
    async getTotal() {
        return await this.getAmount(TEXT_TOTAL)
    }
    async getCompleteHeader() {
        return (await this._get_text(TEXT_COMPLETE_HEADER))?.trim()
    }
}
