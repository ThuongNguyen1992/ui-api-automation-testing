/**
 * ==============================
 * k6 config shared by every scenario — target, load profile, pass/fail thresholds
 *   k6 run -e PROFILE=smoke|load [-e BASE_URL=…] perf/scenarios/<name>.js
 *
 * The target is a public demo API: keep the load small (load profile = 10 virtual users at most).
 * ==============================
 */
export const BASE_URL = __ENV.BASE_URL || 'https://dummyjson.com'

// public demo account documented on dummyjson.com (same as the API tests)
export const USER = { username: __ENV.API_USER || 'emilys', password: __ENV.API_PASSWORD || 'emilyspass' }

const PROFILES = {
  // is the script and the service OK? 1 user, 30s
  smoke: { vus: 1, duration: '30s' },
  // normal traffic: ramp up to 10 users, hold, ramp down
  load: {
    stages: [
      { duration: '30s', target: 10 },
      { duration: '1m', target: 10 },
      { duration: '30s', target: 0 },
    ],
  },
}

export const PROFILE = __ENV.PROFILE || 'smoke'
if (!PROFILES[PROFILE]) throw new Error(`Unknown PROFILE=${PROFILE} — use ${Object.keys(PROFILES).join(' | ')}`)

/**
 * k6 options: profile + thresholds. A threshold that fails → k6 exits with code 99 → the CI job fails.
 *   endpointP95: { 'GET /products': 800, … } → p(95) per request name (tag `name`)
 */
export function buildOptions(endpointP95 = {}) {
  const thresholds = {
    http_req_failed: ['rate<0.01'], // < 1% errors
    http_req_duration: ['p(95)<1500'], // 95% of requests under 1.5s (public demo API over the internet)
    checks: ['rate>0.99'], // > 99% of checks pass
  }
  for (const [name, ms] of Object.entries(endpointP95)) thresholds[`http_req_duration{name:${name}}`] = [`p(95)<${ms}`]
  return { ...PROFILES[PROFILE], thresholds, tags: { profile: PROFILE } }
}
