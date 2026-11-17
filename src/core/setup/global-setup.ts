import { CONFIG } from '@config/config'
import FileUtil from '@core/utils/file.util'
import consts from '@config/consts'

export default async function globalSetup() {
  if (CONFIG.clearAllureResultFolder) {
    await FileUtil.deleteFolder(consts.ALLURE_RESULTS_ROOT)
  }

  console.log('■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■')
  console.log('                     START TESTING')
  console.log('. TEST INFORMATION:')
  console.log(`. Test Runner   : ${process.env.RUNNER} | Test Env : ${process.env.ENV}`)
  console.log(`. Test Browser  : ${process.env.BROWSER} | Headless : ${process.env.HEADLESS}`)

  return {
    runner: process.env.RUNNER,
    env: process.env.ENV,
    browser: process.env.BROWSER,
    headless: process.env.HEADLESS,
  }
}
