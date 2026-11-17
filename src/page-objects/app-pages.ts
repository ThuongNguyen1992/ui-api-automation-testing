import { Page } from '@playwright/test'
import Control from '@core/ui/control'

// COMMON
import CommonFlowPage from '@page-objects/pages/common/common-flow.page'
import HeaderComponent from '@page-objects/components/common/header.component'

// SWAG LABS
import LoginPage from '@page-objects/pages/swag-labs/login.page'
import InventoryPage from '@page-objects/pages/swag-labs/inventory.page'
import ProductDetailPage from '@page-objects/pages/swag-labs/product-detail.page'
import CartPage from '@page-objects/pages/swag-labs/cart.page'
import CheckoutPage from '@page-objects/pages/swag-labs/checkout.page'

// Page object registry — every page / component is registered here and used in specs as appPage.<Name>
//   1. import XxxPage from '@page-objects/pages/<domain>/xxx.page'
//   2. add `XxxPage: XxxPage` to AppPages
//   3. add `appPages.XxxPage = new XxxPage(page, appPages)` to createAppPages

export type AppPages = {
  Control: Control
  // COMMON
  CommonFlowPage: CommonFlowPage
  HeaderComponent: HeaderComponent
  // SWAG LABS
  LoginPage: LoginPage
  InventoryPage: InventoryPage
  ProductDetailPage: ProductDetailPage
  CartPage: CartPage
  CheckoutPage: CheckoutPage
}

export function createAppPages(page: Page): AppPages {
  const appPages = {} as AppPages

  appPages.Control = new Control(page)
  // COMMON
  appPages.CommonFlowPage = new CommonFlowPage(page, appPages)
  appPages.HeaderComponent = new HeaderComponent(page, appPages)
  // SWAG LABS
  appPages.LoginPage = new LoginPage(page, appPages)
  appPages.InventoryPage = new InventoryPage(page, appPages)
  appPages.ProductDetailPage = new ProductDetailPage(page, appPages)
  appPages.CartPage = new CartPage(page, appPages)
  appPages.CheckoutPage = new CheckoutPage(page, appPages)

  return appPages
}
