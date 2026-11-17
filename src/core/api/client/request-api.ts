import { APIRequestContext } from '@playwright/test'
import { allure } from 'allure-playwright'
import { logger } from '@core/logging/logger'

export interface ApiResult<T = any> {
  status: number
  data: T
  pass: boolean
  message?: string
}

export default class RequestApi {
  constructor(protected request: APIRequestContext) { }

  async sendRequest<T = any>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    url: string,
    headers: Record<string, string> = {},
    body?: any
  ): Promise<ApiResult<T>> {

    const stepName = `${method} ${url}`
    let result!: ApiResult<T>

    await allure.step(stepName, async () => {
      try {
        logger.info(`[API] ${method} ${url}`)

        const response = await this.request.fetch(url, {
          method,
          headers,
          data: body,
        })

        const status = response.status()
        const data = await response.json().catch(() => ({}))

        result = {
          status,
          data,
          pass: response.ok(),
        }
      } catch (err: any) {
        // network / timeout / DNS error: no HTTP response at all → fail here with the real cause
        // (never disguise it as a fake "500" that looks like a server error)
        throw new Error(`❌ [API] ${method} ${url} — no response: ${err.message}`)
      }
    })

    return result
  }
}