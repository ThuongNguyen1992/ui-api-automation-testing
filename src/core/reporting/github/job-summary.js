import fs from 'node:fs'
import { formatDate, formatDuration, readRunSummary } from '../read-run-summary.js'

/**
 * ==============================
 * Run result as Markdown on the GitHub Actions run page (job summary) — no secret needed
 *   node src/core/reporting/github/job-summary.js [reportUrl]
 * Writes to $GITHUB_STEP_SUMMARY on CI, prints to the console locally.
 * ==============================
 */
const reportUrl = process.argv.slice(2).find((a) => a.startsWith('http')) ?? ''
const MAX_ERROR = 160

// a "|" or a line break inside a cell breaks the Markdown table
const cell = (text = '') => String(text).replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim()
const truncate = (text, max) => (text.length > max ? `${text.slice(0, max - 1)}…` : text)

function buildMarkdown(s) {
  const status = s.failed ? '❌ Failed' : '✅ Passed'
  const lines = [
    `## 🧪 ${s.testType} test run — ${status}`,
    '',
    `**Environment:** ${s.env} · **Browser:** ${s.browser} · **Run at:** ${formatDate(s.runTimestamp)} · **Duration:** ${formatDuration(s.durationSec)}`,
    '',
    '| Total | ✅ Passed | ❌ Failed | ⏭ Skipped | 🔁 Flaky | 📈 Pass rate |',
    '| ---: | ---: | ---: | ---: | ---: | ---: |',
    `| ${s.total} | ${s.passed} | ${s.failed} | ${s.skipped} | ${s.flaky} | **${s.passRate}%** |`,
    '',
    '<details><summary>Result per project</summary>',
    '',
    '| Project | Passed | Failed | Skipped | Flaky |',
    '| --- | ---: | ---: | ---: | ---: |',
  ]

  const projects = [...new Set(s.tests.map((t) => t.project))]
  for (const project of projects) {
    const tests = s.tests.filter((t) => t.project === project)
    const count = (...statuses) => tests.filter((t) => statuses.includes(t.status)).length
    lines.push(`| ${project} | ${count('expected', 'flaky')} | ${count('unexpected')} | ${count('skipped')} | ${count('flaky')} |`)
  }
  lines.push('', '</details>', '')

  if (s.failedTests.length) {
    lines.push('### ❌ Failed tests', '', '| Script ID | Test case | Project | Error |', '| --- | --- | --- | --- |')
    for (const t of s.failedTests) lines.push(`| \`${t.scriptId || '-'}\` | ${cell(t.title)} | ${t.project} | ${cell(truncate(t.error, MAX_ERROR))} |`)
    lines.push('')
  }

  if (reportUrl) lines.push(`📊 **Allure report:** ${reportUrl}`, '')
  return lines.join('\n')
}

const summary = readRunSummary()
if (!summary) {
  console.error('❌ No reports/json/results.json — run the tests first')
  process.exit(1)
}
const markdown = buildMarkdown(summary)
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${markdown}\n`)
else console.log(markdown)
