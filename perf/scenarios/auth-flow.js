import http from 'k6/http'
import { check, sleep } from 'k6'
import { BASE_URL, USER, buildOptions } from '../lib/config.js'
import { buildSummary } from '../lib/summary.js'

/**
 * ==============================
 * Login → call an authenticated endpoint with the token
 *   k6 run -e PROFILE=smoke perf/scenarios/auth-flow.js
 * ==============================
 */
export const options = buildOptions({
  'POST /auth/login': 1500,
  'GET /auth/me': 1000,
})

const JSON_HEADERS = { 'Content-Type': 'application/json' }

export default function () {
  const login = http.post(`${BASE_URL}/auth/login`, JSON.stringify({ ...USER, expiresInMins: 30 }), {
    headers: JSON_HEADERS,
    tags: { name: 'POST /auth/login' },
  })
  const loggedIn = check(login, {
    'login: status 200': (r) => r.status === 200,
    'login: access token returned': (r) => !!r.json('accessToken'),
  })

  if (loggedIn) {
    const me = http.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${login.json('accessToken')}` },
      tags: { name: 'GET /auth/me' },
    })
    check(me, {
      'me: status 200': (r) => r.status === 200,
      'me: same user': (r) => r.json('username') === USER.username,
    })
  }

  sleep(1)
}

export const handleSummary = (data) => buildSummary('auth-flow', data)
