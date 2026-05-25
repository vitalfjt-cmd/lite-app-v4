import { test, expect, type BrowserContext, type BrowserContextOptions } from '@playwright/test'
import {
  addOneItemAndOpenConfirm,
  bootstrapCustomerOrderingViaStaffApi,
  gotoCustomer,
  hasOrderableCustomerItem,
  openBackofficeContext,
  openCustomerContext,
  readCustomerActiveTableLabel,
  readStaffSelectedLineCount,
  submitOrder,
  waitForCustomerActiveTicketNo,
  waitForDelay,
  waitForOrderableCustomerItem,
} from './support/app'
import { hasCustomerAccess, readScenario } from './support/env'

function buildCustomerUrl(baseURL: string, store: string, qr: string) {
  const url = new URL(baseURL)
  url.searchParams.set('view', 'customer')
  url.searchParams.set('store', store)
  url.searchParams.set('qr', qr)
  return url.toString()
}

function parsePreferredTableLabel(qr: string) {
  const matches = qr.match(/\d+/g)
  return matches?.at(-1) ?? ''
}

async function ensureOrderableCustomerPage(customerUrl: string, page: Awaited<ReturnType<typeof openCustomerContext>>['page']) {
  let lastError: unknown = null
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await gotoCustomer(page, customerUrl)
    try {
      await waitForCustomerActiveTicketNo(page, 15_000)
      await waitForOrderableCustomerItem(page, 15_000)
      return
    } catch (error) {
      lastError = error
      await page.waitForTimeout(1_000)
    }
  }
  throw lastError instanceof Error ? lastError : new Error('customer_ordering_not_ready')
}

test.describe('dual order smoke', () => {
  test('submits one order from two customer contexts', async ({ browser, baseURL }) => {
    const scenario = readScenario()
    test.setTimeout(240_000)

    test.skip(!baseURL, 'baseURL is required')
    test.skip(!hasCustomerAccess(scenario), 'PW_CUSTOMER_STORE and PW_CUSTOMER_QR are required')
    test.skip(!scenario.customerOrderItemName, 'PW_CUSTOMER_ORDER_ITEM_NAME is required for dual smoke')

    const contexts: BrowserContext[] = []
    const createContext = async (options: BrowserContextOptions = {}) => {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...options })
      contexts.push(context)
      return context
    }

    try {
      let customerUrl = buildCustomerUrl(baseURL as string, scenario.customerStore, scenario.customerQr)
      const customerA = await openCustomerContext(createContext, customerUrl, 1)
      let hasDirectOrderingPath = await hasOrderableCustomerItem(customerA.page)

      if (!hasDirectOrderingPath && scenario.staff) {
        customerUrl = await bootstrapCustomerOrderingViaStaffApi({
          baseURL: baseURL as string,
          credentials: scenario.staff,
          storeSlug: scenario.customerStore,
          tableLabel: parsePreferredTableLabel(scenario.customerQr),
        })
      }

      await ensureOrderableCustomerPage(customerUrl, customerA.page)
      customerUrl = customerA.page.url()

      const customerB = await openCustomerContext(createContext, customerUrl, 2)
      await ensureOrderableCustomerPage(customerUrl, customerB.page)

      const [timingA, timingB] = await Promise.all([
        (async () => {
          await addOneItemAndOpenConfirm(customerA.page, scenario.customerOrderItemName)
          return await submitOrder(customerA.page, 0, 1)
        })(),
        (async () => {
          await waitForDelay(500)
          await addOneItemAndOpenConfirm(customerB.page, scenario.customerOrderItemName)
          return await submitOrder(customerB.page, 1, 1)
        })(),
      ])

      expect(timingA.responseStatus).toBe(200)
      expect(timingB.responseStatus).toBe(200)
      expect(Math.max(timingA.totalMs, timingB.totalMs)).toBeLessThanOrEqual(scenario.maxTotalMs ?? 5_000)

      if (scenario.staff) {
        const staff = await openBackofficeContext(
          createContext,
          baseURL as string,
          'staff',
          scenario.staff,
          scenario.staffStorageStatePath,
        )
        const targetTableLabel = await readCustomerActiveTableLabel(customerA.page)
        const ticketCard = staff.page.locator('[data-testid^="staff-ticket-"]').filter({ hasText: targetTableLabel }).first()
        await expect(ticketCard).toBeVisible({ timeout: 30_000 })
        await ticketCard.click()
        await expect.poll(async () => await readStaffSelectedLineCount(staff.page), { timeout: 30_000 }).toBeGreaterThanOrEqual(2)
      }
    } finally {
      for (const context of contexts.reverse()) {
        await context.close().catch(() => undefined)
      }
    }
  })
})
