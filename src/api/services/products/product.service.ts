import Request from '@core/api/client/request-api'
import apiDataInput from '@data/api/api-data-input'
import HeadersApi from '@core/api/headers/headers-api'
import { getToken } from '@core/api/auth/get-token'

export type Product = { id: number; title: string; description: string; category: string; price: number; rating: number; stock: number }
export type ProductPage = { products: Product[]; total: number; skip: number; limit: number }

export default class ProductService extends Request {
    private baseUrl = apiDataInput.user.api_url.baseUrl

    async getProducts(limit: number, skip: number) {
        const header = await HeadersApi.authHeaders()
        return await this.sendRequest<ProductPage>('GET', `${this.baseUrl}/products?limit=${limit}&skip=${skip}`, header)
    }
    async getProduct(id: number) {
        const header = await HeadersApi.authHeaders()
        return await this.sendRequest<Product & { message?: string }>('GET', `${this.baseUrl}/products/${id}`, header) // message on 404
    }
    async searchProducts(keyword: string) {
        const header = await HeadersApi.authHeaders()
        return await this.sendRequest<ProductPage>('GET', `${this.baseUrl}/products/search?q=${encodeURIComponent(keyword)}`, header)
    }
    // write endpoints need the signed-in user (Bearer token)
    async addProduct(product: Partial<Product>) {
        const header = await HeadersApi.authHeaders(await getToken(this.request))
        return await this.sendRequest<Product>('POST', `${this.baseUrl}/products/add`, header, product)
    }
    async updateProduct(id: number, changes: Partial<Product>) {
        const header = await HeadersApi.authHeaders(await getToken(this.request))
        return await this.sendRequest<Product>('PUT', `${this.baseUrl}/products/${id}`, header, changes)
    }
    async deleteProduct(id: number) {
        const header = await HeadersApi.authHeaders(await getToken(this.request))
        return await this.sendRequest<Product & { isDeleted: boolean; deletedOn: string }>('DELETE', `${this.baseUrl}/products/${id}`, header)
    }
}
