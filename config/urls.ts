// ENV
const ENV = process.env.ENV || 'stag'

// One entry per environment. The demo applications only have one public instance, so every environment points to it —
// in a real project each block holds that environment's hosts and nothing else changes.
const ENV_CONFIG = {
  dev: {
    // SWAG LABS (UI)
    swagLabs: 'https://www.saucedemo.com',
    // DUMMYJSON (API)
    dummyApi: 'https://dummyjson.com',
  },
  stag: {
    swagLabs: 'https://www.saucedemo.com',
    dummyApi: 'https://dummyjson.com',
  },
  prod: {
    swagLabs: 'https://www.saucedemo.com',
    dummyApi: 'https://dummyjson.com',
  },
} as const

const config = ENV_CONFIG[ENV as keyof typeof ENV_CONFIG] || ENV_CONFIG.stag

class Urls {
  // SWAG LABS
  public BASE_URL = config.swagLabs
  public LOGIN_URL = `${this.BASE_URL}/`
  public INVENTORY_URL = `${this.BASE_URL}/inventory.html`
  public CART_URL = `${this.BASE_URL}/cart.html`
  public CHECKOUT_COMPLETE_URL = `${this.BASE_URL}/checkout-complete.html`

  // API
  public API_BASE_URL = config.dummyApi
}

export default new Urls()
