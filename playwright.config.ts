import { defineConfig, devices, type Project } from '@playwright/test'
import Consts from './config/consts'
import { CONFIG } from './config/config'
import DynamicEnvUtil from './src/core/utils/dynamic-env.util'

// Initialize dynamic environment variables (RUNNER, ENV, BROWSER, HEADLESS)
await DynamicEnvUtil.initConfig()

// ================= ENV CONFIG =================

// Browser selection from ENV variable
const browser = (process.env.BROWSER || 'chrome').toLowerCase()

// Run browser in headless mode when HEADLESS=true
const headless = process.env.HEADLESS === 'true'

// Map browser name to Playwright device configuration
const deviceByBrowser: Record<string, (typeof devices)[keyof typeof devices]> = {
  chrome: devices['Desktop Chrome'],
  chromium: devices['Desktop Chrome'],
  firefox: devices['Desktop Firefox'],
  safari: devices['Desktop Safari'],
}

// Selected device configuration
const selectedDevice = deviceByBrowser[browser] ?? devices['Desktop Chrome']

// ================= HELPER FUNCTION =================

// Create UI project configuration — signedIn: start every test already logged in (storage state from the setup project)
function createUIProject(name: string, testDir: string, signedIn = true): Project {
  return {
    name,
    testDir,
    dependencies: signedIn ? ['Setup - UI Auth'] : [],
    use: {
      ...selectedDevice,
      headless,
      viewport: { width: 1440, height: 900 },
      storageState: signedIn ? Consts.STORAGE_STATE : undefined,
      launchOptions: {
        args: headless ? ['--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage'] : [],
      },
      screenshot: 'only-on-failure',
      video: 'retain-on-failure',
      trace: 'retain-on-failure',
    },
  }
}

// Create API project configuration
function createAPIProject(name: string, testDir: string): Project {
  return {
    name,
    testDir,
    use: {
      extraHTTPHeaders: {
        'Content-Type': 'application/json',
      },
    },
  }
}

// ================= PLAYWRIGHT CONFIG =================

export default defineConfig({
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // Global test timeout
  timeout: 60_000,
  // Default expect timeout
  expect: { timeout: 5000 },
  // Retry failed tests
  retries: process.env.CI ? 1 : CONFIG.retryFails,
  // Maximum parallel workers
  workers: process.env.CI ? 2 : CONFIG.maxInstances,

  // ================= REPORTERS =================
  reporter: [
    ['list'],
    [
      'allure-playwright',
      {
        resultsDir: Consts.ALLURE_RESULTS_ROOT,
        detail: true,
        suiteTitle: false,
        environmentInfo: {
          BROWSER: process.env.BROWSER,
          ENV: process.env.ENV,
        },
        // annotation: { type: 'issue', description: 'BUG-123' } → link to the bug tracker in Allure
        links: {
          issue: { urlTemplate: 'https://github.com/ThuongNguyen1992/ui-api-automation-testing/issues/%s', nameTemplate: '#%s' },
        },
      },
    ],
    ['json', { outputFile: 'reports/json/results.json' }],
    ['junit', { outputFile: 'reports/xml/results.xml' }],
    // HTML report — never: do not auto-open
    ['html', { open: 'never', outputFolder: 'reports/html-report' }],
    // Custom reporter: run banner + Allure report generation
    ['./src/core/setup/end-reporter.ts'],
  ],
  // Folder for test artifacts
  outputDir: 'reports/test-results',
  // Global setup before running tests
  globalSetup: './src/core/setup/global-setup',

  // ================= PROJECTS =================

  projects: [
    // ---------- SETUP: log in once, save the session ----------
    { name: 'Setup - UI Auth', testDir: './src/core/setup', testMatch: /.*\.setup\.ts/, use: { ...selectedDevice, headless } },

    // ---------- UI PROJECTS: 1 project per domain ----------
    createUIProject('UI - Auth', './src/tests/ui/auth', false),
    createUIProject('UI - Inventory', './src/tests/ui/inventory'),
    createUIProject('UI - Cart', './src/tests/ui/cart'),
    createUIProject('UI - Checkout', './src/tests/ui/checkout'),

    // ---------- API PROJECTS ----------
    createAPIProject('API - Auth', './src/tests/api/auth'),
    createAPIProject('API - Products', './src/tests/api/products'),
    createAPIProject('API - Carts', './src/tests/api/carts'),
  ],
})
