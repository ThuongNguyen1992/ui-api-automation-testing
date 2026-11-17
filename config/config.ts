export const CONFIG = {
  // ⚙️ Base setup (local defaults — CI overrides them through .env.ci, see config/set-env-ci.js)
  env: 'stag', // dev | stag | prod
  browser: 'chrome', // chrome | firefox | safari
  headless: true, // safari not support headless
  maxInstances: 4,
  retryFails: 0, // retry failing test cases
  clearAllureResultFolder: true,

  // 📊 Reports
  allure_report: true, // true | false — generate the Allure HTML report at the end of a run
} as const
