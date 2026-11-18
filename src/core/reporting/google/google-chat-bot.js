import 'dotenv/config'
import { formatDate, formatDuration, readRunSummary } from '../read-run-summary.js'

/**
 * ==============================
 * Google Chat run notification — one card per run: Allure overview screenshot, run info, result, failed tests, links
 *   node src/core/reporting/google/google-chat-bot.js <reportUrl> [--dry-run]
 *
 * Webhook per environment (env vars / GitHub secrets) — none set → the step is skipped, the run is not failed:
 *   GG_CHAT_WEBHOOK_DEV · GG_CHAT_WEBHOOK_STAG · GG_CHAT_WEBHOOK_PROD   one space per environment
 *   GG_CHAT_WEBHOOK                                                    default space
 * Screenshot: <reportUrl>overview.png (capture-report-screenshot.js, published with the report); missing → card without image
 * ==============================
 */
const WEBHOOK_MAP = {
  dev: process.env.GG_CHAT_WEBHOOK_DEV,
  stag: process.env.GG_CHAT_WEBHOOK_STAG,
  prod: process.env.GG_CHAT_WEBHOOK_PROD,
  default: process.env.GG_CHAT_WEBHOOK,
}
const MAX_FAILED_LINES = 10

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const reportUrl = args.find((a) => a.startsWith('http')) ?? ''

function getWebhookUrl(env) {
  const key = String(env || '').toLowerCase()
  const webhookUrl = WEBHOOK_MAP[key] || WEBHOOK_MAP.default
  if (webhookUrl) console.log(`✅ Selected webhook: ${WEBHOOK_MAP[key] ? key : 'default'} (ENV=${env})`)
  return webhookUrl
}

// the screenshot is optional: only put it on the card when the published report has it
async function getScreenshotUrl() {
  if (!reportUrl) return null
  const url = `${reportUrl}overview.png`
  try {
    const res = await fetch(url, { method: 'HEAD' })
    return res.ok ? `${url}?t=${Date.now()}` : null // ?t= → Chat does not reuse the image of the previous run
  } catch {
    return null
  }
}

const historyUrl = () => process.env.GG_REPORT_SPREADSHEET_ID && `https://docs.google.com/spreadsheets/d/${process.env.GG_REPORT_SPREADSHEET_ID}`

// ==============================
// 🧾 Build card
// ==============================
function buildCard(summary, screenshotUrl) {
  const isApi = summary.testType === 'API'

  const executionLines = [
    `📅 Run at: ${formatDate(summary.runTimestamp)}`,
    `⏱ Duration: ${formatDuration(summary.durationSec)}`,
    `🔥 Module: ${summary.testType}`,
    !isApi && `🌐 Browser: ${summary.browser}`,
    `🔧 Environment: ${summary.env}`,
  ].filter(Boolean)

  const resultLines = [
    `🟦 Total: ${summary.total}`,
    `🟩 Passed: ${summary.passed}`,
    `🟥 Failed: ${summary.failed}`,
    `🟨 Skipped: ${summary.skipped}`,
    summary.flaky && `🔁 Flaky (passed on retry): ${summary.flaky}`,
    `<b>📈 Pass Rate: ${summary.passRate}%</b>`,
  ].filter(Boolean)

  const failedLines = summary.failedTests.slice(0, MAX_FAILED_LINES).map((t) => `• <b>${t.scriptId || '-'}</b> ${t.title}`)
  if (summary.failedTests.length > MAX_FAILED_LINES) failedLines.push(`… and ${summary.failedTests.length - MAX_FAILED_LINES} more in the report`)

  const buttons = [
    reportUrl && { text: '🔍 VIEW REPORT', onClick: { openLink: { url: reportUrl } } },
    historyUrl() && { text: '📘 REPORT HISTORY', onClick: { openLink: { url: historyUrl() } } },
  ].filter(Boolean)

  return {
    cardsV2: [
      {
        cardId: 'report',
        card: {
          header: { title: `📊 ${summary.testType} Automation Test Report` },
          sections: [
            // 📸 IMAGE
            screenshotUrl && { widgets: [{ image: { imageUrl: screenshotUrl, altText: 'Allure report overview' } }] },
            // 🧪 SUMMARY
            { header: '🧪 Test Execution Summary', widgets: [{ textParagraph: { text: executionLines.join('<br>') } }] },
            // 📊 RESULT
            { header: '📊 Result', widgets: [{ textParagraph: { text: resultLines.join('<br>') } }] },
            // ❌ FAILED TESTS (Script ID → spec tag / test case list)
            failedLines.length && { header: '❌ Failed tests', widgets: [{ textParagraph: { text: failedLines.join('<br>') } }] },
            // 🔘 BUTTON
            buttons.length && { widgets: [{ buttonList: { buttons } }] },
          ].filter(Boolean),
        },
      },
    ],
  }
}

// ==============================
// 🚀 Send Google Chat notification
// ==============================
export async function sendGoogleChatReport(summary) {
  const card = buildCard(summary, await getScreenshotUrl())
  if (dryRun) {
    console.log(JSON.stringify(card, null, 2))
    return
  }

  const webhookUrl = getWebhookUrl(summary.env)
  if (!webhookUrl) {
    console.log('⚠️ Google Chat skipped — set GG_CHAT_WEBHOOK (or GG_CHAT_WEBHOOK_<ENV>)')
    return
  }

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
    body: JSON.stringify(card),
  })
  if (!res.ok) throw new Error(`Google Chat webhook ${res.status}: ${await res.text()}`)
  console.log('🎉 Google Chat card sent')
}

// ===== RUN =====
const summary = readRunSummary()
if (!summary) {
  console.error('❌ No reports/json/results.json — run the tests first')
  process.exit(1)
}
try {
  await sendGoogleChatReport(summary)
} catch (err) {
  console.error('❌ Error sending Google Chat report:', err.message)
  process.exit(1)
}
