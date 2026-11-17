import { APIRequestContext } from '@playwright/test'
import AuthService from '@api/services/auth/auth.service'
import ProductService from '@api/services/products/product.service'
import CartService from '@api/services/carts/cart.service'

// API service registry — every service is registered here and used in specs as apiManager.<name>
export type ApiManager = {
  request: APIRequestContext
  auth: AuthService
  products: ProductService
  carts: CartService
}

export function createApiManager(request: APIRequestContext): ApiManager {
  return {
    request,
    auth: new AuthService(request),
    products: new ProductService(request),
    carts: new CartService(request),
  }
}
