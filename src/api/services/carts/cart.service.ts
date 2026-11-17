import Request from '@core/api/client/request-api'
import apiDataInput from '@data/api/api-data-input'
import HeadersApi from '@core/api/headers/headers-api'
import { getToken } from '@core/api/auth/get-token'

export type CartLine = { id: number; title: string; price: number; quantity: number; total: number }
export type Cart = { id: number; userId: number; products: CartLine[]; total: number; totalProducts: number; totalQuantity: number }

export default class CartService extends Request {
    private baseUrl = apiDataInput.user.api_url.baseUrl

    async addCart(userId: number, items: { id: number; quantity: number }[]) {
        const header = await HeadersApi.authHeaders(await getToken(this.request))
        return await this.sendRequest<Cart>('POST', `${this.baseUrl}/carts/add`, header, { userId, products: items })
    }
    async getCart(id: number) {
        const header = await HeadersApi.authHeaders()
        return await this.sendRequest<Cart>('GET', `${this.baseUrl}/carts/${id}`, header)
    }
}
