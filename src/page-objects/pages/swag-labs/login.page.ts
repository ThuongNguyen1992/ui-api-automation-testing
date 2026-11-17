import { Page } from '@playwright/test'
import type { AppPages } from '@page-objects/app-pages'
import Control from '@core/ui/control'
import Urls from '@config/urls'

// LOGIN FORM
const FIELD_USERNAME = '//input[@data-test="username"]'
const FIELD_PASSWORD = '//input[@data-test="password"]'
const BUTTON_LOGIN = '//input[@data-test="login-button"]'
const TEXT_ERROR = '//h3[@data-test="error"]'
const BUTTON_CLOSE_ERROR = '//button[@data-test="error-button"]'

export default class LoginPage extends Control {
    constructor(page: Page, private readonly appPages: AppPages) {
        super(page)
    }

    // CHECKS DISPLAY
    async isLoginFormDisplayed() {
        await this._verify_element_visible(FIELD_USERNAME)
        await this._verify_element_visible(FIELD_PASSWORD)
        return await this._verify_element_visible(BUTTON_LOGIN)
    }
    async isErrorNotDisplayed() {
        return await this._verify_element_not_visible(TEXT_ERROR)
    }

    // INPUTS
    async inputUsername(username: string) {
        await this._set_value(FIELD_USERNAME, username)
    }
    async inputPassword(password: string) {
        await this._set_value(FIELD_PASSWORD, password)
    }

    // ACTIONS
    async open() {
        await this._goto(Urls.LOGIN_URL)
    }
    async clickLogin() {
        await this._click_element(BUTTON_LOGIN)
    }
    async clickCloseError() {
        await this._click_element(BUTTON_CLOSE_ERROR)
    }

    // GETTERS
    async getErrorMessage() {
        return (await this._get_text(TEXT_ERROR))?.trim()
    }
}
