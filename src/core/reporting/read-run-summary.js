import fs from 'node:fs'
import path from 'node:path'
import dotenv from 'dotenv'

// ENV_CI / BROWSER_CI of the run (written by `npm run env:<env>`); not there → local defaults
dotenv.config({ path: '.env.ci' })

/**
 * ==============================
 * Summary of the last run, read from the Playwright JSON reporter (reports/json/results.json)
 * Input of every report channel: report history (Google Sheet), Google Chat card, GitHub job summary
 * ==============================
 */
const RESULTS_FILE = path.join(process.cwd(), 'reports', 'json', 'results.json')

// Script ID = the tag that looks like ABC-DEF-001 / ABC-001
const SCRIPT_ID = /^@?[A-Z]{2,6}(-[A-Z]{2,6})?-\d{3}$/

const pad = (n) => String(n).padStart(2, '0')

// 27/10/2026 22:24 — local time of the runner (CI sets TZ)
export const formatDate = (ts) => {
  const d = new Date(ts)
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// 389 → "6m 29s"
export const formatDuration = (sec) => (sec >= 60 ? `${Math.floor(sec / 60)}m ${sec % 60}s` : `${sec}s`)

function collectTests(suite, out = []) {
  for (const spec of suite.specs ?? []) {
    for (const test of spec.tests) {
      out.push({
        title: spec.title,
        file: spec.file,
        scriptId: (spec.tags ?? []).map((t) => `@${t.replace(/^@/, '')}`).find((t) => SCRIPT_ID.test(t))?.slice(1) ?? '',
        project: test.projectName,
        status: test.status, // expected | unexpected | flaky | skipped
        error: (test.results.at(-1)?.errors?.[0]?.message ?? '').replace(/\u001b\[[0-9;]*m/g, '').split('\n').find((l) => l.trim()) ?? '',
      })
    }
  }
  for (const child of suite.suites ?? []) collectTests(child, out)
  return out
}

export function readRunSummary(file = RESULTS_FILE) {
  if (!fs.existsSync(file)) return null
  const report = JSON.parse(fs.readFileSync(file, 'utf-8'))
  // setup projects are infrastructure, not test cases
  const tests = report.suites.flatMap((s) => collectTests(s)).filter((t) => !t.project.startsWith('Setup'))
  const count = (status) => tests.filter((t) => t.status === status).length

  const projects = [...new Set(tests.map((t) => t.project))]
  const hasUi = projects.some((p) => p.startsWith('UI'))
  const hasApi = projects.some((p) => p.startsWith('API'))

  const passed = count('expected') + count('flaky')
  const failed = count('unexpected')
  const skipped = count('skipped')
  const executed = passed + failed
  return {
    runTimestamp: Date.parse(report.stats.startTime),
    env: process.env.ENV_CI || process.env.ENV || 'stag',
    testType: hasUi && hasApi ? 'UI + API' : hasApi ? 'API' : 'UI',
    total: tests.length,
    passed,
    failed,
    skipped,
    flaky: count('flaky'),
    passRate: executed ? Number(((passed / executed) * 100).toFixed(1)) : 0,
    durationSec: Math.round(report.stats.duration / 1000),
    browser: process.env.BROWSER_CI || process.env.BROWSER || 'chrome',
    tests,
    failedTests: tests.filter((t) => t.status === 'unexpected'),
  }
}
