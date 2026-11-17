import { APIRequestContext } from '@playwright/test'
import apiDataInput from '@data/api/api-data-input'

// Access token of the API test account — logged in once per worker, then reused by every service call that needs it
let cachedToken: string | null = null

export async function getToken(request: APIRequestContext): Promise<string> {
    if (cachedToken) return cachedToken
    const { api_url, login_data } = apiDataInput.user
    const res = await request.post(`${api_url.baseUrl}/auth/login`, {
        data: { username: login_data.username, password: login_data.password, expiresInMins: login_data.token_lifetime_mins },
    })
    if (!res.ok()) throw new Error(`❌ Login API failed: ${res.status()} ${await res.text()}`)
    cachedToken = (await res.json()).accessToken as string
    return cachedToken
}
