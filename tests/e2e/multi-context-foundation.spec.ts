import { appendFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { test, expect, type BrowserContext, type BrowserContextOptions } from '@playwright/test'
import {
  bootstrapCustomerOrderingViaStaffApi,
  createStaffTicketAndGetCustomerUrl,
  createStaffTicketAndGetCustomerUrlForTable,
  discoverOrderableCustomerItemName,
  focusFirstStaffTicket,
  focusStaffTicketByTableAndTicket,
  focusStaffTicketByTicketNo,
  gotoCustomer,
  hasOrderableCustomerItem,
  openBackofficeContext,
  openCustomerContext,
  placeCustomerOrders,
  readCustomerActiveTableLabel,
  readCustomerActiveTicketNo,
  readKdsQueueCount,
  readStaffSelectedLineCount,
  waitForCustomerActiveTicketNo,
  waitForOrderableCustomerItem,
  waitForKdsQueueCount,
  waitForStaffSelectedLineCount,
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
  url.searchParams.set('view', 'cust-tablet')
  url.searchParams.set('store', store)
  url.searchParams.set('qr', qr)
  return url.toString()
}

function parsePreferredTableLabel(qr: string) {
  const matches = qr.match(/\d+/g)
  return matches?.at(-1) ?? ''
}

function logPhase(name: string, details?: Record<string, unknown>) {
  console.log('[playwright-load-phase]', JSON.stringify({ at: new Date().toISOString(), name, ...(details ?? {}) }))
}

test.describe('single-pc multi-context foundation', () => {
  test('opens multiple customer contexts with optional staff/kds companions', async ({ browser, baseURL }) => {
    const scenario = readScenario()
    const needsExtendedTimeout = scenario.exerciseOrderFlow && (scenario.staff || scenario.kds)
    test.setTimeout(needsExtendedTimeout ? 300_000 : scenario.exerciseOrderFlow ? 180_000 : 90_000)

    test.skip(!baseURL, 'baseURL is required')
    test.skip(!hasCustomerAccess(scenario), 'PW_CUSTOMER_STORE and PW_CUSTOMER_QR are required')

    const customerUrl = buildCustomerUrl(baseURL as string, scenario.customerStore, scenario.customerQr)
    const contexts: BrowserContext[] = []
    const createContext = async (options: BrowserContextOptions = {}) => {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...options })
      contexts.push(context)
      return context
    }

    try {
      const customers = await Promise.all(
        Array.from({ length: scenario.customerCount }, (_, index) =>
          openCustomerContext(createContext, customerUrl, index + 1),
        ),
      )

      for (const customer of customers) {
        await expect(customer.page).toHaveURL(new RegExp('[?&]view=cust-tablet'))
      }

      const staffSession = scenario.staff
        ? await openBackofficeContext(createContext, baseURL as string, 'staff', scenario.staff, scenario.staffStorageStatePath)
        : null
      const kdsSession = scenario.kds
        ? await openBackofficeContext(createContext, baseURL as string, 'kds', scenario.kds, scenario.kdsStorageStatePath)
        : null

      if (scenario.exerciseOrderFlow) {
        await test.step('multiple customer contexts can place lightweight staggered orders', async () => {
          logPhase('order_flow:start')
          let orderingUrl = customerUrl
          let usedStaffFallback = false
          let usedStaffBootstrap = false
          const preferredTableLabel = parsePreferredTableLabel(scenario.customerQr)
          const preferBootstrapPath = Boolean(scenario.customerOrderItemName && staffSession)
          let hasDirectOrderingPath = preferBootstrapPath ? false : await hasOrderableCustomerItem(customers[0].page)

          if (!hasDirectOrderingPath && !preferBootstrapPath) {
            await gotoCustomer(customers[0].page, customerUrl)
            try {
              await waitForOrderableCustomerItem(customers[0].page, 10_000)
              hasDirectOrderingPath = true
            } catch {
              hasDirectOrderingPath = await hasOrderableCustomerItem(customers[0].page)
            }
          }

          if (!hasDirectOrderingPath && !preferBootstrapPath) {
            const verificationContext = await createContext()
            try {
              const verificationPage = await verificationContext.newPage()
              await gotoCustomer(verificationPage, customerUrl)
              try {
                await waitForOrderableCustomerItem(verificationPage, 10_000)
                hasDirectOrderingPath = true
              } catch {
                hasDirectOrderingPath = await hasOrderableCustomerItem(verificationPage)
              } finally {
                await verificationPage.close().catch(() => undefined)
              }
            } finally {
              await verificationContext.close().catch(() => undefined)
            }
          }

          if (!hasDirectOrderingPath && staffSession && preferredTableLabel) {
            logPhase('order_flow:bootstrap_staff_api:start', { preferredTableLabel })
            try {
              orderingUrl = await bootstrapCustomerOrderingViaStaffApi({
                baseURL: baseURL as string,
                credentials: scenario.staff!,
                storeSlug: scenario.customerStore,
                tableLabel: preferredTableLabel,
              })
              await gotoCustomer(customers[0].page, orderingUrl)
              try {
                await waitForOrderableCustomerItem(customers[0].page, 10_000)
                hasDirectOrderingPath = true
                usedStaffBootstrap = true
              } catch {
                hasDirectOrderingPath = await hasOrderableCustomerItem(customers[0].page)
              }
            } catch (error) {
              logPhase('order_flow:bootstrap_staff_api:failed', {
                message: error instanceof Error ? error.message : String(error),
              })
            }
            logPhase('order_flow:bootstrap_staff_api:end', { hasDirectOrderingPath })
          }

          if (!hasDirectOrderingPath && scenario.disableStaffFallback) {
            throw new Error('customer_direct_order_path_not_found')
          }

          if (!hasDirectOrderingPath && staffSession) {
            orderingUrl = await createStaffTicketAndGetCustomerUrl(staffSession.page)
            usedStaffFallback = true
          }

          const firstCustomerUrl = customers[0].page.url()
          if (!orderingUrl.includes('ticket=') && firstCustomerUrl.includes('ticket=')) {
            orderingUrl = firstCustomerUrl
          }

          const orderingCustomers = customers.slice(0, scenario.customerOrderContexts)

          if (orderingUrl !== customerUrl) {
            logPhase('order_flow:navigate_ordering_customers', { orderingUrl })
            await Promise.all(orderingCustomers.map((customer) => gotoCustomer(customer.page, orderingUrl)))
            await waitForCustomerActiveTicketNo(orderingCustomers[0].page, 15_000)
            await waitForOrderableCustomerItem(orderingCustomers[0].page, 15_000)
          }

          logPhase('order_flow:resolve_item_name:start')
          const resolvedOrderItemName = scenario.customerOrderItemName ?? (await discoverOrderableCustomerItemName(orderingCustomers[0].page))
          logPhase('order_flow:resolve_item_name:end', { resolvedOrderItemName })

          const expectedOrderCount = scenario.customerOrderContexts * scenario.customerOrdersPerContext
          const targetTableLabel = staffSession ? await readCustomerActiveTableLabel(orderingCustomers[0].page) : ''
          const targetTicketNo = staffSession ? await readCustomerActiveTicketNo(orderingCustomers[0].page) : ''
          if (staffSession) {
            const focused = targetTableLabel && targetTicketNo
              ? await focusStaffTicketByTableAndTicket(staffSession.page, targetTableLabel, targetTicketNo)
              : targetTicketNo
                ? await focusStaffTicketByTicketNo(staffSession.page, targetTicketNo)
              : await focusFirstStaffTicket(staffSession.page)
            if (!focused && (targetTableLabel || targetTicketNo)) {
              throw new Error(`staff_target_ticket_not_found:${targetTableLabel}/${targetTicketNo}`)
            }
            if (!focused) {
              await focusFirstStaffTicket(staffSession.page)
            }
          }
          const staffBaseline = staffSession ? await readStaffSelectedLineCount(staffSession.page) : null
          const kdsBaseline = kdsSession ? await readKdsQueueCount(kdsSession.page) : null

          const timingGroups = await Promise.all(
            orderingCustomers.map((customer, index) =>
              placeCustomerOrders(customer.page, {
                itemName: resolvedOrderItemName,
                ordersPerContext: scenario.customerOrdersPerContext,
                staggerMs: scenario.orderStaggerMs,
                contextIndex: index,
              }),
            ),
          )
          logPhase('order_flow:orders_submitted')
          const timings = timingGroups.flat()
          const batchCompletedAt = Date.now()

          let staffPropagationMs: number | null = null
          let kdsPropagationMs: number | null = null

          if (staffSession && staffBaseline !== null) {
            logPhase('order_flow:wait_staff:start', { expectedOrderCount })
            const focused = targetTableLabel && targetTicketNo
              ? await focusStaffTicketByTableAndTicket(staffSession.page, targetTableLabel, targetTicketNo)
              : targetTicketNo
                ? await focusStaffTicketByTicketNo(staffSession.page, targetTicketNo)
              : await focusFirstStaffTicket(staffSession.page)
            if (!focused && (targetTableLabel || targetTicketNo)) {
              throw new Error(`staff_target_ticket_not_found:${targetTableLabel}/${targetTicketNo}`)
            }
            if (!focused) {
              await focusFirstStaffTicket(staffSession.page)
            }
            await waitForStaffSelectedLineCount(staffSession.page, staffBaseline + expectedOrderCount, 30_000)
            staffPropagationMs = Date.now() - batchCompletedAt
            logPhase('order_flow:wait_staff:end', { staffPropagationMs })
          }

          if (kdsSession && kdsBaseline !== null) {
            logPhase('order_flow:wait_kds:start', { expectedOrderCount })
            await waitForKdsQueueCount(kdsSession.page, kdsBaseline + expectedOrderCount, 30_000)
            kdsPropagationMs = Date.now() - batchCompletedAt
            logPhase('order_flow:wait_kds:end', { kdsPropagationMs })
          }

          const metricsPayload = {
            recordedAt: new Date().toISOString(),
            scenario: {
              customerContexts: scenario.customerCount,
              orderingContexts: scenario.customerOrderContexts,
              ordersPerContext: scenario.customerOrdersPerContext,
              staggerMs: scenario.orderStaggerMs,
            },
            requestMs: summarize(timings.map((timing) => timing.requestMs)),
            uiMs: summarize(timings.map((timing) => timing.uiMs)),
            totalMs: summarize(timings.map((timing) => timing.totalMs)),
            propagationMs: {
              staff: staffPropagationMs,
              kds: kdsPropagationMs,
            },
            targetTableLabel,
            targetTicketNo,
            usedStaffFallback,
            usedStaffBootstrap,
            statuses: [...new Set(timings.map((timing) => timing.responseStatus))],
            orders: timings,
          }

          await writeMetricsIfNeeded(scenario.metricsOutputPath, metricsPayload)

          console.log(
            '[playwright-load-metrics]',
            JSON.stringify(metricsPayload, null, 2),
          )

          if (scenario.maxRequestMs !== null) {
            expect(metricsPayload.requestMs.max).toBeLessThanOrEqual(scenario.maxRequestMs)
          }

          if (scenario.maxTotalMs !== null) {
            expect(metricsPayload.totalMs.max).toBeLessThanOrEqual(scenario.maxTotalMs)
          }

          if (scenario.maxStaffPropagationMs !== null) {
            expect(metricsPayload.propagationMs.staff).not.toBeNull()
            expect(metricsPayload.propagationMs.staff ?? Number.POSITIVE_INFINITY).toBeLessThanOrEqual(
              scenario.maxStaffPropagationMs,
            )
          }

          if (scenario.maxKdsPropagationMs !== null) {
            expect(metricsPayload.propagationMs.kds).not.toBeNull()
            expect(metricsPayload.propagationMs.kds ?? Number.POSITIVE_INFINITY).toBeLessThanOrEqual(
              scenario.maxKdsPropagationMs,
            )
          }

          if (staffSession) {
            await expect(staffSession.page.locator('[data-testid^="staff-ticket-"]').first()).toBeVisible({ timeout: 30_000 })
          }

          if (kdsSession) {
            await expect(kdsSession.page.locator('[data-testid^="kds-ticket-"]').first()).toBeVisible({ timeout: 30_000 })
          }
        })
      }
    } finally {
      await Promise.all(
        contexts.map(async (context) => {
          try {
            await context.close()
          } catch {
            // Ignore close races when the browser is already shutting down.
          }
        }),
      )
    }
  })
})
