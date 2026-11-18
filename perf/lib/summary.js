/**
 * ==============================
 * End-of-test summary without remote libraries:
 *   console → short text · reports/k6/<name>.json → raw data · reports/k6/<name>.md → Markdown table (CI job summary)
 * ==============================
 */
const ms = (v) => (v === undefined ? '-' : `${Math.round(v)} ms`)
const pct = (v) => (v === undefined ? '-' : `${(v * 100).toFixed(2)}%`)

function thresholdRows(metrics) {
  const rows = []
  for (const [metric, data] of Object.entries(metrics)) {
    for (const [rule, result] of Object.entries(data.thresholds || {})) rows.push({ metric, rule, ok: result.ok })
  }
  return rows
}

function endpointRows(metrics) {
  return Object.entries(metrics)
    .filter(([metric]) => metric.startsWith('http_req_duration{name:'))
    .map(([metric, data]) => ({ name: metric.slice('http_req_duration{name:'.length, -1), ...data.values }))
}

export function buildSummary(name, data) {
  const m = data.metrics
  const thresholds = thresholdRows(m)
  const passed = thresholds.every((t) => t.ok)
  const profile = __ENV.PROFILE || 'smoke'

  const md = [
    `### ⚡ k6 — ${name} (${profile}) — ${passed ? '✅ thresholds passed' : '❌ thresholds failed'}`,
    '',
    '| Requests | Req/s | Failed | Checks | Avg | p(90) | p(95) | Max |',
    '| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
    `| ${m.http_reqs.values.count} | ${m.http_reqs.values.rate.toFixed(1)} | ${pct(m.http_req_failed.values.rate)} | ${pct(m.checks?.values.rate)} | ${ms(m.http_req_duration.values.avg)} | ${ms(m.http_req_duration.values['p(90)'])} | ${ms(m.http_req_duration.values['p(95)'])} | ${ms(m.http_req_duration.values.max)} |`,
    '',
    '| Endpoint | Avg | p(95) |',
    '| --- | ---: | ---: |',
    ...endpointRows(m).map((e) => `| \`${e.name}\` | ${ms(e.avg)} | ${ms(e['p(95)'])} |`),
    '',
    '| Threshold | Rule | Result |',
    '| --- | --- | --- |',
    ...thresholds.map((t) => `| \`${t.metric}\` | \`${t.rule}\` | ${t.ok ? '✅' : '❌'} |`),
    '',
  ].join('\n')

  const text = [
    '',
    `k6 ${name} (${profile}) — ${passed ? 'PASSED' : 'FAILED'}`,
    `  requests ${m.http_reqs.values.count} · failed ${pct(m.http_req_failed.values.rate)} · checks ${pct(m.checks?.values.rate)}`,
    `  duration avg ${ms(m.http_req_duration.values.avg)} · p(95) ${ms(m.http_req_duration.values['p(95)'])} · max ${ms(m.http_req_duration.values.max)}`,
    ...thresholds.map((t) => `  ${t.ok ? '✓' : '✗'} ${t.metric} ${t.rule}`),
    '',
  ].join('\n')

  return {
    stdout: text,
    [`reports/k6/${name}.json`]: JSON.stringify(data, null, 2),
    [`reports/k6/${name}.md`]: md,
  }
}
