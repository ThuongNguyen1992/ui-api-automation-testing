/**
 * List failed / flaky / broken tests from a Playwright run → one block per test
 *
 * node .claude/skills/qa-failure-analyzer/scripts/list-failures.mjs                      # local: reports/json/results.json
 * node .claude/skills/qa-failure-analyzer/scripts/list-failures.mjs reports/allure-results  # a downloaded allure-results folder
 * node .claude/skills/qa-failure-analyzer/scripts/list-failures.mjs <file|dir> --json
 *
 * Shows: env, title, tags, spec file:line, project, every attempt (retries), first error lines,
 * the failing spec step + page-object line from the stack, and artifacts (screenshot / video / trace).
 * ⚠️ every new run overwrites these folders → copy them before re-running (see SKILL.md Phase 1).
 */
import fs from 'fs'
import path from 'path'

const args = process.argv.slice(2)
const asJson = args.includes('--json')
const input = args.find((arg) => !arg.startsWith('--')) || 'reports/json/results.json'
if (!fs.existsSync(input)) {
  console.error(`❌ ${input} not found — run the tests first, or pass a downloaded allure-results folder`)
  process.exit(1)
}

const stripAnsi = (text = '') => text.replace(/\u001b\[[0-9;]*m/g, '')
const firstLines = (text, count = 6) => stripAnsi(text).split('\n').filter((line) => line.trim()).slice(0, count).join('\n')
// "at …/src/tests/…spec.ts:25:9" → step in the spec, "at …/src/page-objects/…page.ts:40:5" → page object / component line
const frames = (stack = '') => {
  const lines = stripAnsi(stack).split('\n')
  const find = (re) => lines.map((l) => l.match(/\(?((?:[A-Za-z]:)?[^\s()]*?(src\/[^\s():]+):(\d+)):\d+\)?/)).find((m) => m && re.test(m[2]))
  const spec = find(/^src\/tests\//)
  const pageObject = find(/^src\/(page-objects|api|core)\//)
  return { specStep: spec ? `${spec[2]}:${spec[3]}` : '', pageObject: pageObject ? `${pageObject[2]}:${pageObject[3]}` : '' }
}

function fromPlaywrightJson(file) {
  const report = JSON.parse(fs.readFileSync(file, 'utf-8'))
  const specs = []
  const walk = (suite) => {
    for (const spec of suite.specs || []) specs.push(spec)
    for (const child of suite.suites || []) walk(child)
  }
  report.suites.forEach(walk)
  const failures = []
  for (const spec of specs) {
    for (const test of spec.tests) {
      if (test.status === 'expected' || test.status === 'skipped') continue // keep "unexpected" (failed) and "flaky"
      failures.push({
        status: test.status === 'flaky' ? 'FLAKY' : 'FAILED',
        title: spec.title,
        tags: spec.tags.map((tag) => `@${tag}`),
        file: `${spec.file}:${spec.line}`,
        project: test.projectName,
        attempts: test.results.map((result) => {
          const error = result.errors?.[0] || result.error || {}
          return {
            retry: result.retry,
            status: result.status,
            seconds: Math.round(result.duration / 1000),
            error: firstLines(error.message),
            ...frames(result.error?.stack || error.stack),
            attachments: (result.attachments || []).filter((a) => a.path).map((a) => `${a.name}: ${a.path}`),
          }
        }),
      })
    }
  }
  const { stats } = report
  return {
    summary: `passed ${stats.expected} · failed ${stats.unexpected} · flaky ${stats.flaky} · skipped ${stats.skipped}`,
    startTime: stats.startTime,
    failures,
  }
}

// attachments can sit on the result or on any nested step
const allureAttachments = (node) => [...(node.attachments || []), ...(node.steps || []).flatMap(allureAttachments)]

// allure-results: one <uuid>-result.json per attempt; attempts of the same test share historyId
function fromAllureDir(dir) {
  const results = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('-result.json'))
    .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8')))
  const byTest = new Map()
  for (const r of results) byTest.set(r.historyId || r.fullName, [...(byTest.get(r.historyId || r.fullName) || []), r])
  const failures = []
  const counts = { passed: 0, failed: 0, flaky: 0, skipped: 0 }
  for (const attempts of byTest.values()) {
    attempts.sort((a, b) => a.start - b.start)
    const last = attempts[attempts.length - 1]
    const anyFailed = attempts.some((a) => ['failed', 'broken'].includes(a.status))
    if (last.status === 'skipped') counts.skipped++
    else if (last.status === 'passed' && !anyFailed) counts.passed++
    else if (last.status === 'passed') counts.flaky++
    else counts.failed++
    if (!anyFailed) continue
    const label = (name) => last.labels.filter((l) => l.name === name).map((l) => l.value)
    // label titlePath = " > <project> > <spec file> > <describe>"
    const titlePath = (label('titlePath')[0] || '').split(' > ').map((p) => p.trim()).filter(Boolean)
    failures.push({
      status: last.status === 'passed' ? 'FLAKY' : 'FAILED',
      title: last.name,
      tags: label('tag').map((tag) => `@${tag}`),
      file: titlePath.find((p) => p.endsWith('.ts')) || label('package')[0] || '',
      project: titlePath[0] || '',
      attempts: attempts.map((a, i) => ({
        retry: i,
        status: a.status,
        seconds: Math.round((a.stop - a.start) / 1000),
        error: firstLines(a.statusDetails?.message),
        ...frames(a.statusDetails?.trace),
        attachments: allureAttachments(a).map((att) => `${att.name}: ${path.join(dir, att.source)}`),
      })),
    })
  }
  const starts = results.map((r) => r.start).filter(Boolean)
  return {
    summary: `passed ${counts.passed} · failed ${counts.failed} · flaky ${counts.flaky} · skipped ${counts.skipped}`,
    startTime: starts.length ? new Date(Math.min(...starts)).toISOString() : '',
    failures,
  }
}

const isDir = fs.statSync(input).isDirectory()
const run = isDir ? fromAllureDir(input) : fromPlaywrightJson(input)
const envFile = path.join(isDir ? input : 'reports/allure-results', 'environment.properties')
const env = fs.existsSync(envFile) ? fs.readFileSync(envFile, 'utf-8').trim().split('\n').join(' · ') : 'unknown (check "Test Env" in the run log)'

if (asJson) {
  console.log(JSON.stringify({ source: input, env, ...run }, null, 2))
  process.exit(0)
}

console.log(`Source ${input} · ${env}`)
console.log(`Run ${run.startTime} — ${run.summary}\n`)
if (!run.failures.length) console.log('✅ No failed or flaky tests in this report.')
for (const f of run.failures) {
  console.log(`■ [${f.status}] ${f.title}`)
  console.log(`  tags: ${f.tags.join(' ')}   project: ${f.project}`)
  console.log(`  spec: ${f.file}`)
  for (const a of f.attempts) {
    console.log(`  - attempt ${a.retry}: ${a.status} (${a.seconds}s)`)
    if (a.specStep) console.log(`      step: ${a.specStep}${a.pageObject ? `   ← ${a.pageObject}` : ''}`)
    if (a.error) console.log(a.error.split('\n').map((line) => `      ${line}`).join('\n'))
    for (const attachment of a.attachments) console.log(`      📎 ${attachment}`)
  }
  console.log('')
}
