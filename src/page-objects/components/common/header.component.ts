import { Page } from '@playwright/test'
import type { AppPages } from '@page-objects/app-pages'
import Control from '@core/ui/control'

// HEADER — shown on every page after login
const TEXT_PAGE_TITLE = '//span[@data-test="title"]'
const LINK_CART = '//a[@data-test="shopping-cart-link"]'
const TEXT_CART_BADGE = '//span[@data-test="shopping-cart-badge"]'

// SIDE MENU
const BUTTON_OPEN_MENU = '//button[@id="react-burger-menu-btn"]'
const LINK_IN_MENU = '//nav//a[normalize-space()="%s"]'

export type MenuItem = 'All Items' | 'About' | 'Logout' | 'Reset App State'

export default class HeaderComponent extends Control {
    constructor(page: Page, private readonly appPages: AppPages) {
        super(page)
    }

    // CHECKS DISPLAY
    async isCartBadgeNotDisplayed() {
        return await this._verify_element_not_visible(TEXT_CART_BADGE)
    }

    // ACTIONS
    async clickCart() {
        await this._click_element(LINK_CART)
    }
    async clickMenuItem(item: MenuItem) {
        await this._click_element(BUTTON_OPEN_MENU)
        await this._click_element(await this._generate_dynamic_locator(LINK_IN_MENU, item))
    }

    // GETTERS
    async getPageTitle() {
        return (await this._get_text(TEXT_PAGE_TITLE))?.trim()
    }
    // no badge = empty cart → 0
    async getCartBadgeCount() {
        await this._wait_for_element_displayed(LINK_CART)
        if (!(await this._is_element_displayed(TEXT_CART_BADGE, 1000))) return 0
        return Number(await this._get_text(TEXT_CART_BADGE))
    }
}
