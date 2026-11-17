import Request from '@core/api/client/request-api'
import apiDataInput from '@data/api/api-data-input'
import HeadersApi from '@core/api/headers/headers-api'

export type LoginResponse = {
    accessToken: string
    refreshToken: string
    id: number
    username: string
    email: string
    firstName: string
    lastName: string
}

export default class AuthService extends Request {
    private baseUrl = apiDataInput.user.api_url.baseUrl

    async login(username: string, password: string, expiresInMins?: number) {
        const header = await HeadersApi.authHeaders()
        return await this.sendRequest<LoginResponse>('POST', `${this.baseUrl}/auth/login`, header, { username, password, expiresInMins })
    }
    // token = null → request without Authorization header
    async getCurrentUser(token: string | null) {
        const header = await HeadersApi.authHeaders(token)
        return await this.sendRequest('GET', `${this.baseUrl}/auth/me`, header)
    }
}
