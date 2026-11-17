import Urls from '@config/urls'

// DUMMYJSON — API test data (stag). Login is the public demo account documented on dummyjson.com.

export const api_url = {
    baseUrl: Urls.API_BASE_URL,
}

export const login_data = {
    username: 'emilys',
    password: 'emilyspass',
    wrong_password: 'not_the_password',
    token_lifetime_mins: 30,
}

export const messages = {
    invalid_credentials: 'Invalid credentials',
    token_required: 'Access Token is required',
    // %s = product id
    product_not_found: "Product with id '%s' not found",
}

export const products = {
    existing_id: 1,
    missing_id: 99999,
    search_keyword: 'phone',
    page: { limit: 5, skip: 10 },
    new_product: { title: 'QA Automation Pen', price: 9.5, category: 'stationery' },
    updated_title: 'QA Automation Pen v2',
}

export const carts = {
    existing_cart_id: 1,
    user_id: 1,
    // product id → quantity
    items: [
        { id: 1, quantity: 2 },
        { id: 2, quantity: 1 },
    ],
}
