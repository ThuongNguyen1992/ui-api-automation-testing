import { test as setup, expect } from '@core/fixtures/test.fixture'
import dataInput from '@data/ui/data-input'
import Urls from '@config/urls'
import Consts from '@config/consts'

// Logs in once and saves the session; every UI project with signedIn = true starts from this state (no login per test)
setup('Login as standard user and save the session', async ({ appPage, page }) => {
    await appPage.CommonFlowPage.loginAs(dataInput.user.users.standard)
    await appPage.CommonFlowPage.isUrlDisplayed(Urls.INVENTORY_URL)
    expect(await appPage.HeaderComponent.getPageTitle(), 'Logged in on the product list').toBe('Products')
    await page.context().storageState({ path: Consts.STORAGE_STATE })
})
