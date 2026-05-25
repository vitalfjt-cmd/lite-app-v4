import { appendFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { test, expect, type BrowserContext, type BrowserContextOptions } from '@playwright/test'
import {
  addOneItemAndOpenConfirm,
  bootstrapCustomerOrderingViaStaffApi,
  createStaffTicketAndGetCustomerUrlForTable,
  gotoCustomer,
  hasOrderableCustomerItem,
  openBackofficeContext,
  openCustomerContext,
  readCustomerActiveTableLabel,
  readStaffSelectedLineCount,
  submitOrder,
  waitForCustomerActiveTicketNo,
  waitForDelay,
  waitForNamedOrderableCustomerItem,
} from './support/app'
import { hasCustomerAccess, readScenario } from './support/env'

function summarize(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b)
  const pick = (ratio: number) => sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * ratio) - 1))]

  return {
    count: sorted.length,
    min: sorted[0] ?? 0,
    p50: pick(0.5) ?? 0,
    p95: pick(0.95) ?? 0,
    max: sorted[sorted.length - 1] ?? 0,
  }
}

async function writeMetricsIfNeeded(outputPath: string | null, payload: unknown) {
  if (!outputPath) return
  const resolvedPath = path.resolve(process.cwd(), outputPath)
  await mkdir(path.dirname(resolvedPath), { recursive: true })
  await appendFile(resolvedPath, `${JSON.stringify(payload)}\n`, 'utf8')
}

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

async function ensureOrderableCustomerPage(
  customerUrl: string,
  page: Awaited<ReturnType<typeof openCustomerContext>>['page'],
  itemName: string,
) {
  let lastError: unknown = null
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await gotoCustomer(page, customerUrl)
    try {
      await waitForCustomerActiveTicketNo(page, 15_000)
      await waitForNamedOrderableCustomerItem(page, itemName, 15_000)
      return
    } catch (error) {
      lastError = error
      await page.waitForTimeout(1_000)
    }
  }
  throw lastError instanceof Error ? lastError : new Error('customer_ordering_not_ready')
}

test.describe('oct double order smoke', () => {
  test('submits two orders from eight customer contexts', async ({ browser, baseURL }) => {
    const scenario = readScenario()
    test.setTimeout(480_000)

    test.skip(!baseURL, 'baseURL is required')
    test.skip(!hasCustomerAccess(scenario), 'PW_CUSTOMER_STORE and PW_CUSTOMER_QR are required')
    test.skip(!scenario.customerOrderItemName, 'PW_CUSTOMER_ORDER_ITEM_NAME is required for oct double smoke')

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
        try {
          customerUrl = await bootstrapCustomerOrderingViaStaffApi({
            baseURL: baseURL as string,
            credentials: scenario.staff,
            storeSlug: scenario.customerStore,
            tableLabel: parsePreferredTableLabel(scenario.customerQr),
          })
        } catch {
          const bootstrapStaff = await openBackofficeContext(
            createContext,
            baseURL as string,
            'staff',
            scenario.staff,
            scenario.staffStorageStatePath,
          )
          customerUrl = await createStaffTicketAndGetCustomerUrlForTable(
            bootstrapStaff.page,
            parsePreferredTableLabel(scenario.customerQr),
          )
        }
      }

      await ensureOrderableCustomerPage(customerUrl, customerA.page, scenario.customerOrderItemName!)
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
        await ensureOrderableCustomerPage(customerUrl, customer.page, scenario.customerOrderItemName!)
      }

      const allCustomers = [customerA, ...additionalCustomers]
      const timings = await Promise.all(
        allCustomers.map(async (customer, index) => {
          const results = []
          await waitForDelay(index * 250)
          await addOneItemAndOpenConfirm(customer.page, scenario.customerOrderItemName)
          results.push(await submitOrder(customer.page, index, 1))
          await customer.page.getByTestId('customer-back-to-menu-from-my-order').click()
          await ensureOrderableCustomerPage(customerUrl, customer.page, scenario.customerOrderItemName!)
          await addOneItemAndOpenConfirm(customer.page, scenario.customerOrderItemName)
          results.push(await submitOrder(customer.page, index, 2))
          return results
        }),
      )

      const flatTimings = timings.flat()
      const batchCompletedAt = Date.now()
      for (const timing of flatTimings) {
        expect(timing.responseStatus).toBe(200)
      }
      expect(Math.max(...flatTimings.map((timing) => timing.totalMs))).toBeLessThanOrEqual(scenario.maxTotalMs ?? 5_000)

      let staffPropagationMs: number | null = null
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
        await expect.poll(async () => await readStaffSelectedLineCount(staff.page), { timeout: 30_000 }).toBeGreaterThanOrEqual(16)
        staffPropagationMs = Date.now() - batchCompletedAt
      }

      const metrics = {
        recordedAt: new Date().toISOString(),
        scenario: {
          customerContexts: 8,
          orderingContexts: 8,
          ordersPerContext: 2,
          staggerMs: 250,
        },
        requestMs: summarize(flatTimings.map((timing) => timing.requestMs)),
        uiMs: summarize(flatTimings.map((timing) => timing.uiMs)),
        totalMs: summarize(flatTimings.map((timing) => timing.totalMs)),
        propagationMs: {
          staff: staffPropagationMs,
        },
        targetTableLabel: await readCustomerActiveTableLabel(customerA.page),
        statuses: [...new Set(flatTimings.map((timing) => timing.responseStatus))].sort((a, b) => a - b),
        orders: flatTimings,
      }

      console.log('[playwright-smoke-metrics]', JSON.stringify(metrics, null, 2))
      await writeMetricsIfNeeded(scenario.metricsOutputPath, metrics)
    } finally {
      for (const context of contexts.reverse()) {
        await context.close().catch(() => undefined)
      }
    }
  })
})
