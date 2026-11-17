import { Page } from '@playwright/test'
import type { AppPages } from '@page-objects/app-pages'
import Control from '@core/ui/control'

export type Credentials = { username: string; password: string }

// Multi-step flows reused by many tests — the only place that chains several pages (via this.appPages)
export default class CommonFlowPage extends Control {
    constructor(page: Page, private readonly appPages: AppPages) {
        super(page)
    }

    // CHECKS DISPLAY
    async isUrlDisplayed(expected: string | RegExp) {
        return await this._verify_url(expected)
    }

    // ACTIONS
    async loginAs(user: Credentials) {
        await this.appPages.LoginPage.open()
        await this.appPages.LoginPage.inputUsername(user.username)
        await this.appPages.LoginPage.inputPassword(user.password)
        await this.appPages.LoginPage.clickLogin()
    }
    async addProductsToCart(productNames: string[]) {
        for (const name of productNames) await this.appPages.InventoryPage.clickAddToCart(name)
    }
    // cart → checkout step one → customer info → overview
    async checkoutWithCustomer(customer: { first_name: string; last_name: string; postal_code: string }) {
        await this.appPages.HeaderComponent.clickCart()
        await this.appPages.CartPage.clickCheckout()
        await this.appPages.CheckoutPage.inputCustomerInfo(customer)
        await this.appPages.CheckoutPage.clickContinue()
    }
    async navigateToPageByUrl(url: string) {
        await this._goto(url)
    }
    async reloadPage() {
        await this._refresh()
    }

    // GETTERS
    async getCurrentUrl() {
        return await this._get_current_url()
    }
}
