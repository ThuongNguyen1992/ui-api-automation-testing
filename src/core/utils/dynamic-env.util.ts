import { CONFIG } from '@config/config'
import dotenv from 'dotenv'
import fs from 'fs'

/**
 * Resolves RUNNER / ENV / BROWSER / HEADLESS for a run, in this order:
 *   1. .env.ci (written by `npm run env:<env>`) → RUNNER_CI_ENV_CI_BROWSER_CI, e.g. ci_prod_chrome
 *   2. a "ci_…" CLI argument or the `env` variable → e.g. env=local_stag_chrome_true npx playwright test
 *   3. config/config.ts (local defaults)
 * The tokens can be given in any order: runner (ci | local | api) · env (dev | stag | prod) · browser · headless (true | false)
 */
let run_dynamic = false

process.env.RUNNER = ''
process.env.ENV = ''
process.env.BROWSER = ''
process.env.HEADLESS = ''
const default_runner: string = 'local'
const args: string[] = process.argv
let envArg: string | undefined
if (fs.existsSync('.env.ci')) {
  dotenv.config({ path: '.env.ci' })
  envArg = `${process.env.RUNNER_CI}_${process.env.ENV_CI}_${process.env.BROWSER_CI}`
} else {
  envArg = args.filter((a) => a.startsWith('ci_'))[0] || process.env.env
}
const tokens = () => String(envArg).split('_')

class DynamicEnvUtil {
  async isRunDynamic() {
    return (run_dynamic = !!envArg)
  }

  async initConfig() {
    await this.isRunDynamic()
    // process.env.RUNNER
    await this.checkRunnerMode()
    // process.env.BROWSER
    await this.checkBrowserMode()
    // process.env.HEADLESS
    await this.checkHeadlessMode()
    // process.env.ENV
    await this.checkEnvMode()
  }

  async checkRunnerMode() {
    if (!run_dynamic) return (process.env.RUNNER = default_runner)
    if (tokens().includes('ci')) process.env.RUNNER = 'ci'
    else if (tokens().includes('api')) process.env.RUNNER = 'api'
    else process.env.RUNNER = default_runner
  }

  async checkBrowserMode() {
    if (!run_dynamic || process.env.RUNNER === 'api') return (process.env.BROWSER = CONFIG.browser)
    for (const browser of ['chrome', 'firefox', 'chromium', 'safari']) {
      if (tokens().includes(browser)) return (process.env.BROWSER = browser)
    }
    return (process.env.BROWSER = CONFIG.browser)
  }

  async checkHeadlessMode() {
    if (!run_dynamic) return (process.env.HEADLESS = String(CONFIG.headless))
    if (process.env.RUNNER === 'ci' || process.env.RUNNER === 'api') return (process.env.HEADLESS = 'true')
    if (process.env.BROWSER === 'safari') return (process.env.HEADLESS = 'false') // safari has no headless mode
    if (tokens().includes('true')) return (process.env.HEADLESS = 'true')
    if (tokens().includes('false')) return (process.env.HEADLESS = 'false')
    return (process.env.HEADLESS = String(CONFIG.headless))
  }

  async checkEnvMode() {
    if (!run_dynamic) return (process.env.ENV = CONFIG.env)
    for (const env of ['dev', 'stag', 'prod']) {
      if (tokens().includes(env)) return (process.env.ENV = env)
    }
    return (process.env.ENV = CONFIG.env)
  }
}

export default new DynamicEnvUtil()
