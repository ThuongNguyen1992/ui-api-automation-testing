import { test, expect } from '@core/fixtures/test.fixture'
import apiDataInput from '@data/api/api-data-input'
import { ApiStatusAssert } from '@core/api/assertions/api-status.assert'
import { expectShape, type Shape } from '@core/api/assertions/api-shape.assert'

const { login_data, messages } = apiDataInput.user

const LOGIN_RESPONSE: Shape = {
    accessToken: 'string', refreshToken: 'string', id: 'number', username: 'string',
    email: 'string', firstName: 'string', lastName: 'string', gender: 'string', image: 'string',
}

test.describe('API - Auth', { tag: ['@api', '@regression'] }, () => {
    test('POST /auth/login - Valid credentials - 200 with tokens and the user profile', { tag: ['@API-AUTH-001', '@smoke'] }, async ({ apiManager }) => {
        const res = await apiManager.auth.login(login_data.username, login_data.password, login_data.token_lifetime_mins)
        ApiStatusAssert.ok(res)
        expectShape(res.data, LOGIN_RESPONSE, 'login response')
        expect(res.data.username, 'Logged-in user').toBe(login_data.username)
        expect(res.data.accessToken.split('.'), 'accessToken is a JWT (header.payload.signature)').toHaveLength(3)
    })

    test('POST /auth/login - Wrong password - 400 with an error and no token', { tag: '@API-AUTH-002' }, async ({ apiManager }) => {
        const res = await apiManager.auth.login(login_data.username, login_data.wrong_password)
        ApiStatusAssert.badRequest(res)
        expect(res.data, 'Error message').toEqual({ message: messages.invalid_credentials })
    })

    test('GET /auth/me - With the access token - 200 returns the same user', { tag: '@API-AUTH-003' }, async ({ apiManager }) => {
        const login = await apiManager.auth.login(login_data.username, login_data.password)
        ApiStatusAssert.ok(login)
        const res = await apiManager.auth.getCurrentUser(login.data.accessToken)
        ApiStatusAssert.ok(res)
        expect(res.data.id, 'Same user id as the login').toBe(login.data.id)
        expect(res.data.username, 'Same username as the login').toBe(login_data.username)
    })

    test('GET /auth/me - Without a token - 401', { tag: '@API-AUTH-004' }, async ({ apiManager }) => {
        const res = await apiManager.auth.getCurrentUser(null)
        ApiStatusAssert.unauthorized(res)
        expect(res.data.message, 'Error message').toBe(messages.token_required)
    })
})
