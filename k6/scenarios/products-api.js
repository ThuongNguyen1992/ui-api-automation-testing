import http from 'k6/http'
import { check, group, sleep } from 'k6'
import { BASE_URL, buildOptions } from '../lib/config.js'
import { buildSummary } from '../lib/summary.js'

/**
 * ==============================
 * Catalog browsing — a visitor lists products, opens one, searches
 *   k6 run -e PROFILE=smoke k6/scenarios/products-api.js
 * ==============================
 */
export const options = buildOptions({
  'GET /products': 800,
  'GET /products/{id}': 800,
  'GET /products/search': 800,
})

const SEARCH_KEYWORDS = ['phone', 'laptop', 'watch', 'shirt']

export default function () {
  group('Browse the catalog', () => {
    const list = http.get(`${BASE_URL}/products?limit=20&skip=0`, { tags: { name: 'GET /products' } })
    check(list, {
      'list: status 200': (r) => r.status === 200,
      'list: 20 products': (r) => r.json('products').length === 20,
    })

    // open one product of the page just listed (not a fixed id → spreads the requests)
    const ids = list.status === 200 ? list.json('products').map((p) => p.id) : [1]
    const id = ids[Math.floor(Math.random() * ids.length)]
    const detail = http.get(`${BASE_URL}/products/${id}`, { tags: { name: 'GET /products/{id}' } })
    check(detail, {
      'detail: status 200': (r) => r.status === 200,
      'detail: same id': (r) => r.json('id') === id,
    })
  })

  group('Search', () => {
    const keyword = SEARCH_KEYWORDS[__ITER % SEARCH_KEYWORDS.length]
    const res = http.get(`${BASE_URL}/products/search?q=${keyword}`, { tags: { name: 'GET /products/search' } })
    check(res, {
      'search: status 200': (r) => r.status === 200,
      'search: total is a number': (r) => typeof r.json('total') === 'number',
    })
  })

  sleep(1) // think time between iterations of one user
}

export const handleSummary = (data) => buildSummary('products-api', data)
