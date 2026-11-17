import { test, expect } from '@core/fixtures/test.fixture'
import dataInput from '@data/ui/data-input'
import Urls from '@config/urls'

const { users, login_messages } = dataInput.user

test.describe('Visitor - Login', { tag: ['@regression', '@auth'] }, () => {
    test.beforeEach(async ({ appPage }) => {
        await appPage.LoginPage.open()
        await appPage.LoginPage.isLoginFormDisplayed()
    })

    test('Login - Valid credentials - Opens the product list', { tag: ['@AUTH-LOGIN-001', '@smoke'] }, async ({ appPage }) => {
        await appPage.LoginPage.inputUsername(users.standard.username)
        await appPage.LoginPage.inputPassword(users.standard.password)
        await appPage.LoginPage.clickLogin()
        await appPage.CommonFlowPage.isUrlDisplayed(Urls.INVENTORY_URL)
        expect(await appPage.HeaderComponent.getPageTitle(), 'Product list title').toBe('Products')
    })

    test('Login - Locked-out user - Shows the locked-out error and stays on login', { tag: '@AUTH-LOGIN-002' }, async ({ appPage }) => {
        await appPage.LoginPage.inputUsername(users.locked_out.username)
        await appPage.LoginPage.inputPassword(users.locked_out.password)
        await appPage.LoginPage.clickLogin()
        expect(await appPage.LoginPage.getErrorMessage(), 'Locked-out error').toBe(login_messages.locked_out)
        await appPage.CommonFlowPage.isUrlDisplayed(Urls.LOGIN_URL)
    })

    test('Login - Wrong password - Shows the credentials error', { tag: '@AUTH-LOGIN-003' }, async ({ appPage }) => {
        await appPage.LoginPage.inputUsername(users.wrong_password.username)
        await appPage.LoginPage.inputPassword(users.wrong_password.password)
        await appPage.LoginPage.clickLogin()
        expect(await appPage.LoginPage.getErrorMessage(), 'Credentials error').toBe(login_messages.wrong_credentials)
        await appPage.CommonFlowPage.isUrlDisplayed(Urls.LOGIN_URL)
    })

    // data-driven: one test per missing field
    const requiredFields = [
        { id: '@AUTH-LOGIN-004', field: 'username', username: '', password: users.standard.password, message: login_messages.username_required },
        { id: '@AUTH-LOGIN-005', field: 'password', username: users.standard.username, password: '', message: login_messages.password_required },
    ]
    for (const c of requiredFields) {
        test(`Login - Empty ${c.field} - Shows '${c.field} is required'`, { tag: c.id }, async ({ appPage }) => {
            await appPage.LoginPage.inputUsername(c.username)
            await appPage.LoginPage.inputPassword(c.password)
            await appPage.LoginPage.clickLogin()
            expect(await appPage.LoginPage.getErrorMessage(), `${c.field} required error`).toBe(c.message)
        })
    }

    test('Login - Close the error message - Error disappears', { tag: '@AUTH-LOGIN-006' }, async ({ appPage }) => {
        await appPage.LoginPage.clickLogin()
        expect(await appPage.LoginPage.getErrorMessage(), 'Error shown first').toBe(login_messages.username_required)
        await appPage.LoginPage.clickCloseError()
        await appPage.LoginPage.isErrorNotDisplayed()
    })

    test('Logout - Log out from the menu - Session ends and pages need login again', { tag: ['@AUTH-LOGIN-007', '@smoke'] }, async ({ appPage }) => {
        await appPage.CommonFlowPage.loginAs(users.standard)
        await appPage.HeaderComponent.clickMenuItem('Logout')
        await appPage.LoginPage.isLoginFormDisplayed()

        // [Negative] the product list is no longer reachable without a session
        await appPage.CommonFlowPage.navigateToPageByUrl(Urls.INVENTORY_URL)
        expect(await appPage.LoginPage.getErrorMessage(), 'Protected page asks to log in').toBe(login_messages.not_logged_in.replace('%s', '/inventory.html'))
    })
})
