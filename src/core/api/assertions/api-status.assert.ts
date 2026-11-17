import { expect } from '@playwright/test'
import type { ApiResult } from '@core/api/client/request-api'

// assertions on the ApiResult returned by RequestApi.sendRequest (status is a number, not APIResponse.status())

export class ApiStatusAssert {
  static ok(res: ApiResult) {
    expect(res.status, `Expected status 200, got ${res.status}: ${JSON.stringify(res.data).slice(0, 300)}`).toBe(200)
  }

  static created(res: ApiResult) {
    expect(res.status, `Expected status 201, got ${res.status}: ${JSON.stringify(res.data).slice(0, 300)}`).toBe(201)
  }

  static accepted(res: ApiResult) {
    expect(res.status, `Expected status 202, got ${res.status}: ${JSON.stringify(res.data).slice(0, 300)}`).toBe(202)
  }

  static noContent(res: ApiResult) {
    expect(res.status, `Expected status 204, got ${res.status}: ${JSON.stringify(res.data).slice(0, 300)}`).toBe(204)
  }

  static badRequest(res: ApiResult) {
    expect(res.status, `Expected status 400, got ${res.status}: ${JSON.stringify(res.data).slice(0, 300)}`).toBe(400)
  }

  static unauthorized(res: ApiResult) {
    expect(res.status, `Expected status 401, got ${res.status}: ${JSON.stringify(res.data).slice(0, 300)}`).toBe(401)
  }

  static forbidden(res: ApiResult) {
    expect(res.status, `Expected status 403, got ${res.status}: ${JSON.stringify(res.data).slice(0, 300)}`).toBe(403)
  }

  static notFound(res: ApiResult) {
    expect(res.status, `Expected status 404, got ${res.status}: ${JSON.stringify(res.data).slice(0, 300)}`).toBe(404)
  }

  static conflict(res: ApiResult) {
    expect(res.status, `Expected status 409, got ${res.status}: ${JSON.stringify(res.data).slice(0, 300)}`).toBe(409)
  }

  static unprocessable(res: ApiResult) {
    expect(res.status, `Expected status 422, got ${res.status}: ${JSON.stringify(res.data).slice(0, 300)}`).toBe(422)
  }

  static serverError(res: ApiResult) {
    expect(res.status, `Expected status 500, got ${res.status}: ${JSON.stringify(res.data).slice(0, 300)}`).toBe(500)
  }
  static notEmptyArray(data: any[]) {
    expect(data.length, 'Expected array should not be empty').toBeGreaterThan(0)
  }
  static toEqual(fieldName: any, actual: any, expected: any) {
    expect(actual, `Expected field "${fieldName}" value should be equal`).toBe(expected)
  }
}