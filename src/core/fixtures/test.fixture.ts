import { test as base } from '@playwright/test'
import { createApiManager, type ApiManager } from '@api/api-manager'
import { createAppPages, type AppPages } from '@page-objects/app-pages'

type TestFixtures = {
  appPage: AppPages
  apiManager: ApiManager
}

// specs import { test, expect } from here: appPage = page objects of the current page, apiManager = API services
export const test = base.extend<TestFixtures>({
  appPage: async ({ page }, use) => {
    await use(createAppPages(page))
  },

  apiManager: async ({ request }, use) => {
    await use(createApiManager(request))
  },
})

export { expect } from '@playwright/test'
