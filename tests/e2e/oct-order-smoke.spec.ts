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

test.describe('oct order smoke', () => {
  test('submits one order from eight customer contexts', async ({ browser, baseURL }) => {
    const scenario = readScenario()
    test.setTimeout(420_000)

    test.skip(!baseURL, 'baseURL is required')
    test.skip(!hasCustomerAccess(scenario), 'PW_CUSTOMER_STORE and PW_CUSTOMER_QR are required')
    test.skip(!scenario.customerOrderItemName, 'PW_CUSTOMER_ORDER_ITEM_NAME is required for oct smoke')

    const contexts: BrowserContext[] = []
    const createContext = async (options: BrowserContextOptions = {}) => {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...options })
      contexts.push(context)
      return context
    }

    try {
      let customerUrl = buildCustomerUrl(baseURL as string, scenario.customerStore, scenario.customerQr)
      const customerA = await openCustomerContext(createContext, customerUrl, 1)
      const hasDirectOrderingPath = await hasOrderableCustomerItem(customerA.page)

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

      const additionalCustomers = await Promise.all([
        openCustomerContext(createContext, customerUrl, 2),
        openCustomerContext(createContext, customerUrl, 3),
        openCustomerContext(createContext, customerUrl, 4),
        openCustomerContext(createContext, customerUrl, 5),
        openCustomerContext(createContext, customerUrl, 6),
        openCustomerContext(createContext, customerUrl, 7),
        openCustomerContext(createContext, customerUrl, 8),
      ])

      for (const customer of additionalCustomers) {
        await ensureOrderableCustomerPage(customerUrl, customer.page)
      }

      const allCustomers = [customerA, ...additionalCustomers]
      const timings = await Promise.all(
        allCustomers.map(async (customer, index) => {
          await waitForDelay(index * 300)
          await addOneItemAndOpenConfirm(customer.page, scenario.customerOrderItemName)
          return await submitOrder(customer.page, index, 1)
        }),
      )

      for (const timing of timings) {
        expect(timing.responseStatus).toBe(200)
      }
      expect(Math.max(...timings.map((timing) => timing.totalMs))).toBeLessThanOrEqual(scenario.maxTotalMs ?? 5_000)

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
        await expect.poll(async () => await readStaffSelectedLineCount(staff.page), { timeout: 30_000 }).toBeGreaterThanOrEqual(8)
      }
    } finally {
      for (const context of contexts.reverse()) {
        await context.close().catch(() => undefined)
      }
    }
  })
})
