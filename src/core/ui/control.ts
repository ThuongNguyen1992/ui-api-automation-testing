// core/Control.ts
import { Page, Locator, expect } from '@playwright/test'
import fs from 'fs'

export default class Control {
  protected page: Page
  protected readonly DEFAULT_TIMEOUT = 9000
  constructor(page: Page) {
    this.page = page
  }

  // ===== Helpers =====
  protected _get_locator(el: string | Locator): Locator {
    return typeof el === 'string' ? this.page.locator(el) : el
  }

  // responsive layouts render some blocks twice (desktop + hidden mobile copy) → the copy the user actually sees.
  // Only for duplicated copies / "any item of a list" checks — never to pick the N-th item (use %s + text instead).
  protected _get_visible_locator(el: string | Locator): Locator {
    return this._get_locator(el).filter({ visible: true }).first()
  }

  protected async _get_locators(xpath: string): Promise<Locator[]> {
    const locator = this.page.locator(xpath)
    let count = await locator.count()

    if (count === 0) {
      await this.page.waitForTimeout(1000)
      count = await locator.count()
      if (count === 0) return []
    }
    return locator.all()
  }
  protected throwError(action: string, err: unknown) {
    let apiName = ''
    let errorMsg = ''

    if (err instanceof Error) {
      const symbols = Object.getOwnPropertySymbols(err)

      for (const sym of symbols) {
        const step = (err as any)[sym]

        if (step?.title && step?.apiName) {
          apiName = step.apiName

          if (step?.error?.message) {
            errorMsg = step.error.message
          }
          break
        }
      }
      // wrapped helper error (message starts with "\n❌ …") → keep its non-empty lines, otherwise the cause is lost
      if (!errorMsg) errorMsg = err.message.split('\n').filter((line) => line.trim()).slice(0, 6).join('\n   ')
    }

    const customError = new Error(`
❌ ${action}
🔧 ${apiName || 'unknown'}
💥 ${errorMsg}`
    )
    Error.captureStackTrace(customError, this.throwError)
    throw customError
  }

  // ===== Browser =====
  async _goto(url: string) {
    try {
      await this.page.goto(url, { waitUntil: 'domcontentloaded' })
    } catch (err) {
      this.throwError(`goto(${url})`, err)
    }
  }

  // wait for the "load" event: client-side handlers are attached only after hydration, early clicks are lost.
  // Soft wait: third-party assets (ads, chat) can keep "load" pending — the following assertions still verify the page.
  // Polls document.readyState (no failed step in the report when "load" never comes).
  async _wait_for_page_load(timeout = 15000) {
    await this._poll(async () => (await this.page.evaluate(() => document.readyState)) === 'complete', timeout)
  }

  async _go_back() {
    try {
      await this.page.goBack({ waitUntil: 'domcontentloaded' })
    } catch (err) {
      this.throwError('goBack()', err)
    }
  }

  async _refresh() {
    try {
      await this.page.reload()
    } catch (err) {
      this.throwError('refresh()', err)
    }
  }

  // ===== Element wait =====
  // Every action / getter / verify below waits through these first. A wait that times out FAILS the step right here
  // (clear "[ERR] Wait …" message) — it never returns false and lets the test continue to the next step.
  async _wait_for_element_displayed(el: string | Locator, timeout = this.DEFAULT_TIMEOUT) {
    try {
      await this._get_locator(el).waitFor({ state: 'visible', timeout })
    } catch (err) {
      this.throwError(`[ERR] Wait for displayed: ${el}`, err)
    }
  }

  async _wait_for_element_disappear(el: string | Locator, timeout = this.DEFAULT_TIMEOUT) {
    try {
      await this._get_locator(el).waitFor({ state: 'hidden', timeout })
    } catch (err) {
      this.throwError(`[ERR] Wait for disappear: ${el}`, err)
    }
  }

  // in the DOM, visible or not (hidden file inputs, lazy content before scrolling)
  async _wait_for_element_exist(el: string | Locator, timeout = this.DEFAULT_TIMEOUT) {
    try {
      await this._get_locator(el).waitFor({ state: 'attached', timeout })
    } catch (err) {
      this.throwError(`[ERR] Wait for exist: ${el}`, err)
    }
  }

  async _wait_for_element_enabled(el: string | Locator, timeout = this.DEFAULT_TIMEOUT) {
    try {
      await expect(this._get_locator(el)).toBeEnabled({ timeout })
    } catch (err) {
      this.throwError(`[ERR] Wait for enabled: ${el}`, err)
    }
  }

  // displayed + enabled + scrolled into view → ready for click / fill / select
  async _wait_for_element_clickable(el: string | Locator, timeout = this.DEFAULT_TIMEOUT) {
    try {
      const locator = this._get_locator(el)
      await locator.waitFor({ state: 'visible', timeout })
      await expect(locator).toBeEnabled({ timeout })
      await locator.scrollIntoViewIfNeeded({ timeout })
    } catch (err) {
      this.throwError(`[ERR] Wait for clickable: ${el}`, err)
    }
  }

  // ===== Actions =====
  async _click_element(el: string | Locator, timeout = this.DEFAULT_TIMEOUT) {
    try {
      const locator = this._get_locator(el)
      await this._wait_for_element_clickable(locator, timeout)
      await locator.click()
    } catch (err) {
      this.throwError(`click(${el})`, err)
    }
  }
  async _hover_element(el: string | Locator, timeout = this.DEFAULT_TIMEOUT) {
    try {
      const locator = this._get_locator(el)
      await this._wait_for_element_displayed(locator, timeout)
      await locator.hover()
    } catch (err) {
      this.throwError(`hover(${el})`, err)
    }
  }
  async _Enter() {
    await this.page.keyboard.press('Enter')
  }

  async _set_value(el: string | Locator, value: string, timeout = this.DEFAULT_TIMEOUT) {
    try {
      const locator = this._get_locator(el)
      await this._wait_for_element_clickable(locator, timeout)
      await locator.fill(value, { timeout })
    } catch (err) {
      this.throwError(`fill(${el}, ${value})`, err)
    }
  }

  // type key by key (segmented inputs like date spinbuttons ignore fill())
  async _type_text(el: string | Locator, text: string, timeout = this.DEFAULT_TIMEOUT) {
    try {
      const locator = this._get_locator(el)
      await this._wait_for_element_clickable(locator, timeout)
      await locator.click()
      await locator.pressSequentially(text, { delay: 50 })
    } catch (err) {
      this.throwError(`type(${el}, ${text})`, err)
    }
  }

  async _select_by_text(el: string | Locator, text: string, timeout = this.DEFAULT_TIMEOUT) {
    try {
      await this._wait_for_element_clickable(el, timeout)
      await this._get_locator(el).selectOption({ label: text })
    } catch (err) {
      this.throwError(`selectByText(${el}, ${text})`, err)
    }
  }
  async _get_text(el: string | Locator, timeout = this.DEFAULT_TIMEOUT) {
    try {
      await this._wait_for_element_displayed(el, timeout)
      return await this._get_locator(el).innerText()
    } catch (err) {
      this.throwError(`getText(${el})`, err)
    }
  }

  async _get_text_all(el: string | Locator, timeout = this.DEFAULT_TIMEOUT) {
    try {
      const locator = this._get_locator(el)
      await this._wait_for_element_displayed(locator.first(), timeout) // a list: wait for its first item
      return await locator.allTextContents()
    } catch (err) {
      this.throwError(`getTextAll(${el})`, err)
    }
  }

  // attribute of an attached element (href, aria-expanded, placeholder…) — hidden elements allowed
  async _get_attribute(el: string | Locator, name: string, timeout = this.DEFAULT_TIMEOUT): Promise<string | null> {
    try {
      const locator = this._get_locator(el)
      await this._wait_for_element_exist(locator, timeout)
      return await locator.getAttribute(name)
    } catch (err) {
      this.throwError(`getAttribute(${el}, ${name})`, err)
      return null
    }
  }

  // number of elements matching right now (0 allowed) — wait for the list / page first when it loads lazily
  async _get_count(el: string | Locator): Promise<number> {
    return await this._get_locator(el).count()
  }

  // quiet wait until exactly `count` elements match (blocks mounted twice while the page hydrates) → true / false
  async _wait_for_count(el: string | Locator, count: number, timeout = this.DEFAULT_TIMEOUT): Promise<boolean> {
    const locator = this._get_locator(el)
    return !!(await this._poll(async () => (await locator.count()) === count, timeout))
  }

  async _click_by_role(
    role: Parameters<Page['getByRole']>[0],
    name: string
  ) {
    try {
      const locator = this.page.getByRole(role, { name })
      await this._wait_for_element_clickable(locator)
      await locator.click()
    } catch (err) {
      this.throwError(`clickByRole(${role}, ${name})`, err)
    }
  }

  async _fill_by_role(
    role: Parameters<Page['getByRole']>[0],
    name: string,
    value: string
  ) {
    try {
      const locator = this.page.getByRole(role, { name })
      await this._wait_for_element_clickable(locator)
      await locator.fill(value)
    } catch (err) {
      this.throwError(`fillByRole(${role}, ${name})`, err)
    }
  }

  // ===== quiet polling =====
  // checks fn() every 500ms until it returns a truthy value or the timeout ends; never throws and never records a
  // failed step (unlike expect / waitFor that time out) → base of the non-failing checks below.
  protected async _poll<T>(fn: () => Promise<T>, timeout = this.DEFAULT_TIMEOUT): Promise<T | null> {
    const end = Date.now() + timeout
    while (true) {
      const value = await fn()
      if (value) return value
      if (Date.now() >= end) return null
      await new Promise((r) => setTimeout(r, 500))
    }
  }

  // ===== element is displayed =====
  // waits up to the timeout for the element to be displayed → true / false. Never fails by itself and leaves no failed
  // step in the report (polls isVisible(), no expect) → the CALLER decides: branch on it (retry a missed click, dropdown
  // with a search box…) or assert it (Assert.true / expect). Must-be-displayed checks → _verify_element_visible.
  async _is_element_displayed(el: string | Locator, timeout = this.DEFAULT_TIMEOUT): Promise<boolean> {
    const locator = this._get_locator(el).first()
    return !!(await this._poll(() => locator.isVisible(), timeout))
  }

  // ===== one of several outcomes =====
  // "A or B" expectations (sign-in modal OR results, onboarding URL OR sign-in modal…): waits until ONE candidate shows
  // up — locator visible or URL matching a RegExp — and returns its key. None within the timeout → the test FAILS here.
  // The caller then verifies the outcome it got; nothing is skipped silently.
  async _wait_for_any<K extends string>(candidates: Record<K, string | Locator | RegExp>, timeout = this.DEFAULT_TIMEOUT): Promise<K> {
    const keys = Object.keys(candidates) as K[]
    const isUrl = (k: K) => candidates[k] instanceof RegExp
    const firstMatch = async (): Promise<K | null> => {
      for (const key of keys) {
        const c = candidates[key]
        if (c instanceof RegExp ? c.test(this.page.url()) : await this._get_locator(c).first().isVisible()) return key
      }
      return null
    }
    const message = `None of [${keys.join(', ')}] is displayed after ${timeout / 1000}s`
    try {
      if (!keys.some(isUrl)) {
        const any = keys.map((k) => this._get_locator(candidates[k] as string | Locator)).reduce((a, b) => a.or(b))
        await expect(any.first(), message).toBeVisible({ timeout })
      }
      // URL candidates: quiet polling (expect.poll would leave failed retry steps in the report)
      const key = await this._poll(firstMatch, keys.some(isUrl) ? timeout : 0)
      if (!key) throw new Error(message)
      return key
    } catch (err) {
      this.throwError(`[ERR] ${message}`, err)
      throw err
    }
  }

  // ===== Verify =====

  async _verify_element_not_visible(el: string | Locator, timeout = this.DEFAULT_TIMEOUT): Promise<boolean> {
    try {
      const locator = this._get_locator(el)
      await expect(locator).not.toBeVisible({ timeout })
      return true
    } catch (err) {
      this.throwError(`[ERR] Element is still displayed: ${el}`, err)
      return false
    }
  }

  async _verify_element_visible(el: string | Locator, timeout = this.DEFAULT_TIMEOUT): Promise<boolean> {
    try {
      const locator = this._get_locator(el)
      await this._wait_for_element_displayed(locator, timeout)
      await expect(locator).toBeVisible({ timeout })
      return true
    } catch (err) {
      this.throwError(`[ERR] Is Element Displayed: ${el}`, err)
      return false
    }
  }

  async _verify_element_enabled(el: string | Locator, timeout = this.DEFAULT_TIMEOUT): Promise<boolean> {
    try {
      await this._wait_for_element_displayed(el, timeout)
      await expect(this._get_locator(el)).toBeEnabled({ timeout })
      return true
    } catch (err) {
      this.throwError(`[ERR] Element is not enabled: ${el}`, err)
      return false
    }
  }

  async _verify_element_disabled(el: string | Locator, timeout = this.DEFAULT_TIMEOUT): Promise<boolean> {
    try {
      await this._wait_for_element_displayed(el, timeout)
      await expect(this._get_locator(el)).toBeDisabled({ timeout })
      return true
    } catch (err) {
      this.throwError(`[ERR] Element is not disabled: ${el}`, err)
      return false
    }
  }

  async _verify_url_not_match(unexpected: string | RegExp, timeout = this.DEFAULT_TIMEOUT): Promise<boolean> {
    try {
      await expect(this.page).not.toHaveURL(unexpected, { timeout })
      return true
    } catch (err) {
      this.throwError(`[ERR] URL still matches: ${unexpected}`, err)
      return false
    }
  }

  async _verify_url(expected: string | RegExp, timeout = this.DEFAULT_TIMEOUT): Promise<boolean> {
    try {
      await expect(this.page).toHaveURL(expected, { timeout })
      return true
    } catch (err) {
      this.throwError(`[ERR] URL does not match: ${expected}`, err)
      return false
    }
  }

  async _get_current_url(): Promise<string> {
    return this.page.url()
  }

  // click a link that opens a new tab → verify the new tab URL, then close it (current page is unaffected)
  async _click_element_and_verify_new_tab_url(el: string | Locator, expected: string | RegExp, timeout = this.DEFAULT_TIMEOUT): Promise<boolean> {
    try {
      const [newTab] = await Promise.all([
        this.page.context().waitForEvent('page', { timeout }),
        this._click_element(el, timeout),
      ])
      await expect(newTab).toHaveURL(expected, { timeout })
      await newTab.close()
      return true
    } catch (err) {
      this.throwError(`[ERR] New tab URL does not match: ${expected}`, err)
      return false
    }
  }

  // external link safety: the new tab must not get a reference to this page (window.opener === null, i.e. rel=noopener)
  async _click_element_and_verify_new_tab_isolated(el: string | Locator, expected: string | RegExp, timeout = this.DEFAULT_TIMEOUT): Promise<boolean> {
    try {
      const [newTab] = await Promise.all([
        this.page.context().waitForEvent('page', { timeout }),
        this._click_element(el, timeout),
      ])
      await expect(newTab).toHaveURL(expected, { timeout })
      const hasOpener = await newTab.evaluate(() => window.opener !== null)
      await newTab.close()
      expect(hasOpener, 'New tab has no access to window.opener').toBe(false)
      return true
    } catch (err) {
      this.throwError(`[ERR] New tab is not opened safely: ${expected}`, err)
      return false
    }
  }

  // click a link that opens a new tab → return its URL and close it (lets the test continue the flow in the current tab)
  async _click_element_and_get_new_tab_url(el: string | Locator, timeout = this.DEFAULT_TIMEOUT): Promise<string> {
    try {
      const [newTab] = await Promise.all([
        this.page.context().waitForEvent('page', { timeout }),
        this._click_element(el, timeout),
      ])
      await newTab.waitForLoadState('domcontentloaded')
      const url = newTab.url()
      await newTab.close()
      return url
    } catch (err) {
      this.throwError(`[ERR] No new tab opened by: ${el}`, err)
      return ''
    }
  }

  // lazy-loaded sections only exist after scrolling → scroll down until the element is attached
  // stops as soon as it is found, or at the bottom of the page (after one extra wait for lazy content) → "Locator not found"
  async _scroll_until_element_attached(el: string | Locator, maxScrolls = 30) {
    const locator = this._get_locator(el)
    // only when the window itself scrolls (pages with an inner scroll container keep the old maxScrolls behaviour)
    const isAtBottom = () => this.page.evaluate(() => {
      const height = document.documentElement.scrollHeight
      return height > window.innerHeight + 2 && window.innerHeight + window.scrollY >= height - 2
    })
    let scrolls = 0
    let bottomHits = 0
    while ((await locator.count()) === 0) {
      if (await isAtBottom()) {
        // the bottom can trigger more lazy content → give it one chance before giving up
        if (++bottomHits > 1) break
        await this.page.waitForTimeout(1000)
        continue
      }
      if (scrolls >= maxScrolls) break
      await this.page.mouse.wheel(0, 700)
      await this.page.waitForTimeout(300)
      scrolls++
    }
    if ((await locator.count()) === 0) {
      const where = bottomHits > 1 ? 'reached the bottom of the page' : `stopped after ${maxScrolls} scrolls`
      this.throwError(`[ERR] Locator not found: ${el}`, new Error(`scrolled ${scrolls} time(s), ${where}`))
    }
    try {
      // several matches (lists, hidden responsive copies) → prefer a visible one, else the first attached one
      const visible = locator.filter({ visible: true })
      const target = (await visible.count()) > 0 ? visible.first() : locator.first()
      await target.scrollIntoViewIfNeeded({ timeout: this.DEFAULT_TIMEOUT })
    } catch (err) {
      this.throwError(`[ERR] Locator found but cannot be scrolled into view: ${el}`, err)
    }
  }

  async _sleep_in_seconds(seconds = 1, showLog = false): Promise<void> {
    if (showLog) {
      console.log(`⏱ Waiting for ${seconds} seconds`)
    }
    await this.page.waitForTimeout(seconds * 1000)
  }

  async _sleep_in_milliseconds(milliseconds = 1000, showLog = false): Promise<void> {
    if (showLog) {
      console.log(`⏱ Waiting for ${milliseconds} milliseconds`)
    }
    await this.page.waitForTimeout(milliseconds)
  }

  async _generate_dynamic_locator(baseLocator: string, sub: any | string[]): Promise<string> {
    let result = baseLocator

    if (Array.isArray(sub)) {
      sub.forEach((value) => {
        result = result.replace('%s', value)
      })
    } else {
      result = result.replace('%s', sub)
    }

    return result
  }

  //================ File Upload ========
  async _set_input_files(el: string | Locator, files: string | string[], timeout = this.DEFAULT_TIMEOUT) {
    try {
      const locator = this._get_locator(el)
      await this._wait_for_element_exist(locator, timeout) // <input type=file> is often hidden
      const fileList = Array.isArray(files) ? files : [files]
      await locator.setInputFiles(fileList)

      // optional: wait UI update
      await this._sleep_in_milliseconds(500)
    } catch (err) {
      this.throwError(`setInputFiles(${el}, ${JSON.stringify(files)})`, err)
    }
  }
  async _wait_for_api_response(url: string, method: string = 'GET') {
    const response = await this.page.waitForResponse(res => res.url().includes(url) && res.request().method() === method)

    const status = response.status()
    let body: any
    try {
      body = await response.json()
    } catch {
      body = await response.text()
    }
    console.log('API URL:', response.url())
    console.log('Status:', status)
    // console.log('🚀 Request:', response.request().postData())
    console.log('Response:', body)

    if (status >= 400) {
      throw new Error(`❌ API failed: ${status} - ${JSON.stringify(body)}`)
    }

    return body
  }
  async _click_element_and_wait_api(el: any, apiUrl: string | string[], method: string = 'POST') {
    const locator = this._get_locator(el)
    const [response] = await Promise.all([
      this.page.waitForResponse(res => {
        const urls = Array.isArray(apiUrl) ? apiUrl : [apiUrl]
        return (urls.some(url => res.url().includes(url)) && res.request().method() === method)
      }),

      this._click_element(locator),
    ])
    const status = response.status()
    let body: any
    try {
      body = await response.json()
    } catch {
      body = await response.text()
    }
    if (status >= 400) {
      const errorLog = {
        status,
        method: response.request().method(),
        url: response.url(),
        request: response.request().postData(),
        response: body,
      }

      console.error(
        '❌ API ERROR:\n',
        JSON.stringify(errorLog, null, 2)
      )

      throw new Error(`❌ API failed: ${status}`)
    }
    return body
  }
}

