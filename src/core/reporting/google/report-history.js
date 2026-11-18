import 'dotenv/config'
import { google } from 'googleapis'
import { formatDate, readRunSummary } from '../read-run-summary.js'

/**
 * ==============================
 * Report history in Google Sheets — one row per run, plus the failed tests of that run
 *   node src/core/reporting/google/report-history.js [reportUrl] [--dry-run]
 *
 * Tab "Execution History":  No · Date · Test Type · Environment · Total · Pass · Fail · Skip · Flaky · Pass Rate (%) · Duration (s) · Report
 * Tab "Failed Tests":       Date · Environment · Script ID · Test Case · Project · Error
 * Tabs and header rows are created on the first run.
 *
 * Config (env vars / GitHub secrets) — missing → the step is skipped, the run is not failed:
 *   GG_REPORT_SPREADSHEET_ID      id of the report spreadsheet (shared with the service account as Editor)
 *   GOOGLE_SERVICE_ACCOUNT_JSON   service-account key (JSON content), or GOOGLE_SERVICE_ACCOUNT_PATH = path to the key file
 * ==============================
 */
const TABS = {
  history: { title: 'Execution History', header: ['No', 'Date', 'Test Type', 'Environment', 'Total', 'Pass', 'Fail', 'Skip', 'Flaky', 'Pass Rate (%)', 'Duration (s)', 'Report'] },
  failed: { title: 'Failed Tests', header: ['Date', 'Environment', 'Script ID', 'Test Case', 'Project', 'Error'] },
}

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const reportUrl = args.find((a) => a.startsWith('http')) ?? ''

function credentials() {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) return { credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON) }
  if (process.env.GOOGLE_SERVICE_ACCOUNT_PATH) return { keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_PATH }
  return null
}

async function ensureTabs(sheets, spreadsheetId) {
  const { data } = await sheets.spreadsheets.get({ spreadsheetId, fields: 'sheets.properties.title' })
  const existing = new Set(data.sheets.map((s) => s.properties.title))
  const missing = Object.values(TABS).filter((t) => !existing.has(t.title))
  if (!missing.length) return
  await sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests: missing.map((t) => ({ addSheet: { properties: { title: t.title, gridProperties: { frozenRowCount: 1 } } } })) } })
  await sheets.spreadsheets.values.batchUpdate({ spreadsheetId, requestBody: { valueInputOption: 'RAW', data: missing.map((t) => ({ range: `'${t.title}'!A1`, values: [t.header] })) } })
}

async function nextRunNumber(sheets, spreadsheetId) {
  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: `'${TABS.history.title}'!A2:A` })
  return (res.data.values?.length ?? 0) + 1
}


const summary = readRunSummary()
if (!summary) {
  console.error('❌ No reports/json/results.json — run the tests first')
  process.exit(1)
}

const date = formatDate(summary.runTimestamp)
const historyRow = [date, summary.testType, summary.env, summary.total, summary.passed, summary.failed, summary.skipped, summary.flaky, summary.passRate, summary.durationSec, reportUrl]
const failedRows = summary.failedTests.map((t) => [date, summary.env, t.scriptId, t.title, t.project, t.error])

if (dryRun) {
  console.log('Execution History row:', JSON.stringify(historyRow))
  console.log(`Failed Tests rows (${failedRows.length}):`)
  failedRows.forEach((row) => console.log('  ', JSON.stringify(row)))
  process.exit(0)
}

const spreadsheetId = process.env.GG_REPORT_SPREADSHEET_ID
const auth = credentials()
if (!spreadsheetId || !auth) {
  console.log('⚠️ Report history skipped — set GG_REPORT_SPREADSHEET_ID and GOOGLE_SERVICE_ACCOUNT_JSON (or _PATH)')
} else {
  const sheets = google.sheets({ version: 'v4', auth: new google.auth.GoogleAuth({ ...auth, scopes: ['https://www.googleapis.com/auth/spreadsheets'] }) })
  await ensureTabs(sheets, spreadsheetId)
  const no = await nextRunNumber(sheets, spreadsheetId)
  await sheets.spreadsheets.values.append({ spreadsheetId, range: `'${TABS.history.title}'!A1`, valueInputOption: 'USER_ENTERED', requestBody: { values: [[no, ...historyRow]] } })
  if (failedRows.length) {
    await sheets.spreadsheets.values.append({ spreadsheetId, range: `'${TABS.failed.title}'!A1`, valueInputOption: 'RAW', requestBody: { values: failedRows } })
  }
  console.log(`✅ Report history: run #${no} added, ${failedRows.length} failed test(s) logged`)
}
