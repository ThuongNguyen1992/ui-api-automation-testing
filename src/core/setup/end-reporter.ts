import type { FullResult, Reporter } from '@playwright/test/reporter'
import { execa } from 'execa'
import { CONFIG } from '@config/config'
import Consts from '@config/consts'

export default class EndReporter implements Reporter {
  async onEnd(result: FullResult): Promise<void> {
    console.log('\n')
    console.log(`                     END TESTING — ${result.status.toUpperCase()}`)
    console.log('■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■')

    // CI builds the report itself (keeps the history of previous runs) → only generate it locally
    if (!CONFIG.allure_report || process.env.CI) return

    console.log('. Generating Allure report ............')
    try {
      await execa('npx', ['allure', 'generate', Consts.ALLURE_RESULTS_ROOT, '--clean', '-o', Consts.ALLURE_REPORT_ROOT], { stdio: 'inherit', shell: true, timeout: 120_000 })
      console.log(`✅ Allure report generated → npm run report:allure`)
    } catch (error) {
      console.error('❌ Failed to generate Allure report')
      console.error(error)
    }
  }
}
