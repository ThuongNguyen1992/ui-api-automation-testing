/**
 * Step library: lists every public method of pages/components → find existing steps before writing new ones
 *
 * node .claude/skills/ui-test-from-cases/scripts/list-steps.mjs [keyword]
 *   e.g. node .../list-steps.mjs product   → only methods / classes containing "product"
 *
 * Each line: appPage.<Key>.<method>(<params>)   ← <file>:<line>   [<comment group>]
 */
import fs from 'fs'
import path from 'path'

const ROOT = process.cwd()
const UI_DIR = path.join(ROOT, 'src/page-objects')
const APP_PAGES = path.join(UI_DIR, 'app-pages.ts')
const keyword = (process.argv[2] || '').toLowerCase()

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name)
    return e.isDirectory() ? walk(p) : /\.(page|component)\.ts$/.test(e.name) ? [p] : []
  })

// classes registered in app-pages.ts → key used in specs (appPage.<Key>)
const appPagesSrc = fs.readFileSync(APP_PAGES, 'utf8')
const registered = new Set([...appPagesSrc.matchAll(/^\s+(\w+):\s*\w+\s*$/gm)].map((m) => m[1]))

const unregistered = []
let total = 0

for (const file of walk(UI_DIR).sort()) {
  const lines = fs.readFileSync(file, 'utf8').split('\n')
  const className = lines.join('\n').match(/export default class (\w+)/)?.[1]
  if (!className) continue
  if (!registered.has(className)) unregistered.push(path.relative(ROOT, file))

  const rel = path.relative(ROOT, file)
  let group = ''
  const out = []

  lines.forEach((line, i) => {
    const groupMatch = line.match(/^\s*\/\/\s*([A-Z][A-Z0-9 &/_-]{2,})\s*$/)
    if (groupMatch) group = groupMatch[1].trim()

    const m = line.match(/^\s+async\s+([a-zA-Z]\w*)\s*\(([^)]*)\)/)
    if (!m || m[1] === 'constructor') return
    const sig = `appPage.${className}.${m[1]}(${m[2].replace(/\s+/g, ' ').trim()})`
    if (keyword && !`${sig} ${rel} ${group}`.toLowerCase().includes(keyword)) return
    out.push(`  ${sig.padEnd(95)} ← ${rel}:${i + 1}${group ? `  [${group}]` : ''}`)
  })

  if (out.length) {
    total += out.length
    console.log(`\n${className}`)
    console.log(out.join('\n'))
  }
}

console.log(`\n${total} method(s)${keyword ? ` matching "${keyword}"` : ''}`)
if (unregistered.length) {
  console.log(`\n⚠️ Not registered in src/page-objects/app-pages.ts:\n  ${unregistered.join('\n  ')}`)
}
