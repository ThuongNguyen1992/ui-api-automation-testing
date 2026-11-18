import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * ==============================
 * Screenshot of the Allure overview → <reportDir>/overview.png, published with the report (GitHub Pages)
 * so the Google Chat card can show it: <reportUrl>overview.png
 *   node src/core/reporting/capture-report-screenshot.js [reportDir=reports/allure-report]
 *
 * The Allure report loads its data with XHR, so it is served over http (file:// does not work).
 * ==============================
 */
const REPORT_DIR = path.resolve(process.argv[2] || 'reports/allure-report')
const OUTPUT = path.join(REPORT_DIR, 'overview.png')

const CONTENT_TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' }

function serve(dir) {
  const server = http.createServer((req, res) => {
    const file = path.join(dir, decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/\/$/, '/index.html'))
    if (!file.startsWith(dir) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404).end()
      return
    }
    res.writeHead(200, { 'Content-Type': CONTENT_TYPES[path.extname(file)] || 'application/octet-stream' })
    fs.createReadStream(file).pipe(res)
  })
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)))
}

export async function captureReportScreenshot(reportDir = REPORT_DIR, output = OUTPUT) {
  if (!fs.existsSync(path.join(reportDir, 'index.html'))) throw new Error(`No Allure report in ${reportDir} — run allure generate first`)
  const { chromium } = await import('@playwright/test')
  const server = await serve(reportDir)
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
    await page.goto(`http://127.0.0.1:${server.address().port}/`, { waitUntil: 'networkidle' })
    // wait for the charts (pass-rate donut) instead of a fixed sleep
    await page.locator('svg').first().waitFor({ timeout: 15000 })
    await page.screenshot({ path: output })
    console.log('✅ Report screenshot saved:', output)
    return output
  } finally {
    await browser.close()
    server.close()
  }
}

// ===== RUN: node capture-report-screenshot.js [reportDir] =====
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  captureReportScreenshot().catch((err) => {
    // the card is still sent without the image → never fail the pipeline here
    console.warn('⚠️ Skip report screenshot:', err.message)
  })
}
