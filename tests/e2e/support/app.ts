import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { expect, type BrowserContext, type BrowserContextOptions, type Page } from '@playwright/test'
import type { RoleCredentials } from './env'

export type OrderTiming = {
  contextIndex: number
  orderIndex: number
  requestMs: number
  uiMs: number
  totalMs: number
  responseStatus: number
}

type BrowserNewContext = (options?: BrowserContextOptions) => Promise<BrowserContext>

function parseLeadingNumber(text: string) {
  const matched = text.match(/\d+/)
  return matched ? Number(matched[0]) : 0
}

async function fileExists(targetPath: string) {
  try {
    await access(path.resolve(process.cwd(), targetPath))
    return true
  } catch {
    return false
  }
}

async function isStorageStateFresh(storageStatePath: string, minimumRemainingSeconds = 120) {
  try {
    const raw = await readFile(path.resolve(process.cwd(), storageStatePath), 'utf8')
    const parsed = JSON.parse(raw) as {
      origins?: Array<{
        localStorage?: Array<{ name?: string; value?: string }>
      }>
    }

    const tokenEntry = parsed.origins
      ?.flatMap((origin) => origin.localStorage ?? [])
      .find((entry) => typeof entry.name === 'string' && entry.name.includes('-auth-token') && typeof entry.value === 'string')

    if (!tokenEntry?.value) return false

    const session = JSON.parse(tokenEntry.value) as { expires_at?: number | null }
    if (typeof session.expires_at !== 'number') return false

    const remainingSeconds = session.expires_at - Math.floor(Date.now() / 1000)
    return remainingSeconds > minimumRemainingSeconds
  } catch {
    return false
  }
}

async function closeLoginPanel(page: Page) {
  const loginPanel = page.getByTestId('sidebar-login-panel')
  if (!(await loginPanel.isVisible().catch(() => false))) return
  await page.locator('.sidebar-modal-backdrop').click({ position: { x: 8, y: 8 } })
  await expect(loginPanel).not.toBeVisible({ timeout: 10_000 })
}

async function isSidebarSessionReady(page: Page) {
  await page.getByTestId('sidebar-login-toggle').click()
  const loginPanel = page.getByTestId('sidebar-login-panel')
  const signOutButton = page.getByTestId('sidebar-login-signout')
  await expect(loginPanel).toBeVisible({ timeout: 10_000 })
  const ready = await signOutButton.isEnabled().catch(() => false)
  await closeLoginPanel(page)
  return ready
}

async function readLoginToggleLabel(page: Page) {
  return ((await page.getByTestId('sidebar-login-toggle').textContent().catch(() => '')) ?? '').trim()
}

async function isSidebarSignedIn(page: Page) {
  const toggleLabel = await readLoginToggleLabel(page)
  if (toggleLabel.includes('ログアウト')) {
    return true
  }

  await page.getByTestId('sidebar-login-toggle').click()
  const loginPanel = page.getByTestId('sidebar-login-panel')
  const signOutButton = page.getByTestId('sidebar-login-signout')
  await expect(loginPanel).toBeVisible({ timeout: 10_000 })
  const signedIn = await signOutButton.isEnabled().catch(() => false)
  await closeLoginPanel(page)
  return signedIn
}

async function isBackofficeReady(page: Page, view: 'staff' | 'kds') {
  if (view === 'staff') {
    const createTicketButton = page.getByTestId('staff-open-create-ticket')
    if (!(await createTicketButton.isVisible().catch(() => false))) return false
    return await createTicketButton.isEnabled().catch(() => false)
  }

  return await isSidebarSessionReady(page)
}

async function readSupabaseBrowserEnv() {
  throw new Error('Supabase is no longer supported in this project.')
}

async function signInViaApi(credentials: RoleCredentials): Promise<any> {
  throw new Error('Supabase is no longer supported in this project.')
}

async function createBackofficeStorageState(
  baseURL: string,
  credentials: RoleCredentials,
  storageStatePath: string,
) {
  throw new Error('Supabase is no longer supported in this project.')
}

async function tryOpenBackofficeWithStorageState(
  browserNewContext: BrowserNewContext,
  baseURL: string,
  view: 'staff' | 'kds',
  storageStatePath: string,
) {
  const context = await browserNewContext({ storageState: path.resolve(process.cwd(), storageStatePath) })
  const page = await context.newPage()

  try {
    await page.goto(`${baseURL}/?view=${view}`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByTestId(view === 'staff' ? 'staff-screen' : 'kds-screen')).toBeVisible()
    await expect.poll(async () => await isBackofficeReady(page, view), { timeout: 30_000 }).toBe(true)
    return { context, page }
  } catch {
    await context.close().catch(() => undefined)
    return null
  }
}

async function openBackofficeWithUiLogin(
  browserNewContext: BrowserNewContext,
  baseURL: string,
  view: 'staff' | 'kds',
  credentials: RoleCredentials,
) {
  let context = await browserNewContext()
  let page = await context.newPage()

  try {
    await page.goto(`${baseURL}/?view=${view}`, { waitUntil: 'domcontentloaded' })
    await signIn(page, credentials)
  } catch {
    await context.close().catch(() => undefined)
    context = await browserNewContext()
    page = await context.newPage()
    await page.goto(`${baseURL}/?view=${view}`, { waitUntil: 'domcontentloaded' })
    await signIn(page, credentials)
  }

  await expect(page.getByTestId(view === 'staff' ? 'staff-screen' : 'kds-screen')).toBeVisible()
  await expect.poll(async () => await isBackofficeReady(page, view), { timeout: 30_000 }).toBe(true)
  return { context, page }
}

export async function openCustomerContext(browserNewContext: BrowserNewContext, customerUrl: string, index: number) {
  const context = await browserNewContext()
  const page = await context.newPage()
  await gotoCustomer(page, customerUrl)
  return { context, page, index }
}

export async function openBackofficeContext(
  browserNewContext: BrowserNewContext,
  baseURL: string,
  view: 'staff' | 'kds',
  credentials: RoleCredentials,
  storageStatePath?: string | null,
) {
  if (storageStatePath && (await fileExists(storageStatePath)) && (await isStorageStateFresh(storageStatePath))) {
    const restored = await tryOpenBackofficeWithStorageState(browserNewContext, baseURL, view, storageStatePath)
    if (restored) return restored
  }

  // API-based storageState creation removed as it was Supabase specific.

  return await openBackofficeWithUiLogin(browserNewContext, baseURL, view, credentials)
}

export async function signIn(page: Page, credentials: RoleCredentials) {
  await page.getByTestId('sidebar-login-toggle').click()
  const loginPanel = page.getByTestId('sidebar-login-panel')
  const loginError = page.getByTestId('sidebar-login-error')
  const signOutButton = page.getByTestId('sidebar-login-signout')
  const loginToggle = page.getByTestId('sidebar-login-toggle')
  const authStatus = page.getByTestId('sidebar-auth-status')
  const authBusy = page.getByTestId('sidebar-auth-busy')
  const profileRole = page.getByTestId('sidebar-profile-role')

  await expect(loginPanel).toBeVisible()
  await page.getByTestId('sidebar-login-email').fill(credentials.email)
  await page.getByTestId('sidebar-login-password').fill(credentials.password)
  await page.getByTestId('sidebar-login-submit').click()

  let outcome = 'pending'
  try {
    await expect
      .poll(
        async () => {
          const errorText = ((await loginError.textContent().catch(() => '')) ?? '').trim()
          if (errorText) {
            outcome = `error:${errorText}`
            return outcome
          }

          const toggleLabel = ((await loginToggle.textContent().catch(() => '')) ?? '').trim()
          if (toggleLabel.includes('ログアウト')) {
            outcome = 'success'
            return outcome
          }

          const panelVisible = await loginPanel.isVisible().catch(() => false)
          if (!panelVisible) {
            outcome = 'success'
            return outcome
          }

          const signOutEnabled = await signOutButton.isEnabled().catch(() => false)
          if (signOutEnabled) {
            outcome = 'success'
            return outcome
          }

          outcome = 'pending'
          return outcome
        },
        { timeout: 30_000 },
      )
      .not.toBe('pending')
  } catch (error) {
    const details = {
      authStatus: ((await authStatus.textContent().catch(() => '')) ?? '').trim(),
      authBusy: ((await authBusy.textContent().catch(() => '')) ?? '').trim(),
      errorText: ((await loginError.textContent().catch(() => '')) ?? '').trim(),
      profileRole: ((await profileRole.textContent().catch(() => '')) ?? '').trim(),
      signOutEnabled: await signOutButton.isEnabled().catch(() => false),
      panelVisible: await loginPanel.isVisible().catch(() => false),
    }
    throw new Error(`staff_sign_in_timeout:${JSON.stringify(details)}`, { cause: error })
  }

  if (outcome.startsWith('error:')) {
    throw new Error(`staff_sign_in_failed:${outcome.slice('error:'.length)}`)
  }

  if (await loginPanel.isVisible().catch(() => false)) {
    await closeLoginPanel(page)
  }
}

export async function gotoCustomer(page: Page, customerUrl: string) {
  await page.goto(customerUrl, { waitUntil: 'domcontentloaded' })
  await expect(page.getByTestId('customer-screen')).toBeVisible({ timeout: 30_000 })
}

export async function addOneItemAndOpenConfirm(page: Page, itemName?: string | null) {
  const card = itemName
    ? await findNamedOrderableCard(page, itemName)
    : await findAnyOrderableCard(page)

  await expect(card).toBeVisible()

  const incrementButton = card.locator('[data-testid^="customer-item-increment-"]').first()
  await incrementButton.click()
  await page.getByTestId('customer-open-confirm').click()
}

export async function submitOrder(page: Page, contextIndex = 0, orderIndex = 0): Promise<OrderTiming> {
  const responsePromise = page.waitForResponse(async (response) => {
    if (!response.url().includes('/functions/v1/public-customer-api')) return false
    if (response.request().method() !== 'POST') return false

    const postData = response.request().postData()
    if (!postData) return false

    try {
      const parsed = JSON.parse(postData) as { action?: string }
      return parsed.action === 'create-order'
    } catch {
      return false
    }
  })

  const requestStartedAt = Date.now()
  await expect(page.getByTestId('customer-submit-order')).toBeVisible()
  await page.getByTestId('customer-submit-order').click()
  const response = await responsePromise
  const responseReceivedAt = Date.now()
  const openMyOrderButton = page.getByTestId('customer-open-my-order')
  await expect(openMyOrderButton).toBeVisible({ timeout: 30_000 })
  await openMyOrderButton.click()
  await expect(page.getByTestId('customer-my-order-panel')).toBeVisible({ timeout: 30_000 })
  const uiVisibleAt = Date.now()

  return {
    contextIndex,
    orderIndex,
    requestMs: responseReceivedAt - requestStartedAt,
    uiMs: uiVisibleAt - responseReceivedAt,
    totalMs: uiVisibleAt - requestStartedAt,
    responseStatus: response.status(),
  }
}

export async function waitForDelay(ms: number) {
  if (ms <= 0) return
  await new Promise((resolve) => setTimeout(resolve, ms))
}

export async function placeCustomerOrders(
  page: Page,
  options: {
    itemName?: string | null
    ordersPerContext: number
    staggerMs?: number
    contextIndex?: number
  },
) {
  const staggerMs = options.staggerMs ?? 0
  const contextIndex = options.contextIndex ?? 0
  const timings: OrderTiming[] = []

  await waitForDelay(staggerMs * contextIndex)

  for (let orderIndex = 0; orderIndex < options.ordersPerContext; orderIndex += 1) {
    await addOneItemAndOpenConfirm(page, options.itemName)
    const timing = await submitOrder(page, contextIndex, orderIndex + 1)
    timings.push(timing)

    if (orderIndex < options.ordersPerContext - 1) {
      await page.getByTestId('customer-back-to-menu-from-my-order').click()
      await expect(page.getByTestId('customer-open-confirm')).toBeVisible({ timeout: 30_000 })
    }
  }

  return timings
}

export async function hasOrderableCustomerItem(page: Page) {
  const topCategories = page.locator('[data-testid^="customer-top-category-"]')
  const topCount = await topCategories.count()

  for (let topIndex = 0; topIndex < Math.max(topCount, 1); topIndex += 1) {
    if (topCount > 0) {
      await topCategories.nth(topIndex).click()
    }

    const subCategories = page.locator('[data-testid^="customer-sub-category-"]')
    const subCount = await subCategories.count()

    for (let subIndex = 0; subIndex < Math.max(subCount, 1); subIndex += 1) {
      if (subCount > 0) {
        await subCategories.nth(subIndex).click()
      }

      const cards = page.locator('[data-testid^="customer-menu-item-"]')
      const cardCount = await cards.count()

      for (let cardIndex = 0; cardIndex < cardCount; cardIndex += 1) {
        const incrementButton = cards.nth(cardIndex).locator('[data-testid^="customer-item-increment-"]').first()
        if (await incrementButton.isEnabled()) {
          return true
        }
      }
    }
  }

  return false
}

export async function waitForOrderableCustomerItem(page: Page, timeout = 10_000) {
  await expect
    .poll(async () => await hasOrderableCustomerItem(page), { timeout })
    .toBe(true)
}

export async function createStaffTicketAndGetCustomerUrl(page: Page) {
  return await createStaffTicketAndGetCustomerUrlForTable(page)
}

export async function bootstrapCustomerOrderingViaStaffApi(options: {
  baseURL: string
  credentials: RoleCredentials
  storeSlug: string
  tableLabel: string
}): Promise<string> {
  throw new Error('Supabase is no longer supported in this project.')
}

function buildCustomerUrlWithTicket(baseURL: string, storeSlug: string, qrToken: string, ticketToken?: string | null) {
  const url = new URL(baseURL)
  url.searchParams.set('view', 'customer')
  url.searchParams.set('store', storeSlug)
  url.searchParams.set('qr', qrToken)
  if (ticketToken) {
    url.searchParams.set('ticket', ticketToken)
  }
  return url.toString()
}

export async function createStaffTicketAndGetCustomerUrlForTable(page: Page, targetTableLabel?: string | null) {
  await page.getByTestId('staff-open-create-ticket').click()
  await expect(page.getByTestId('staff-create-ticket-modal')).toBeVisible()

  const initialMenuBookOptions = await page.getByTestId('staff-create-ticket-menu-book').locator('option').evaluateAll((options) =>
    options
      .map((option) => ({ value: (option as HTMLOptionElement).value, label: option.textContent?.trim() ?? '' }))
      .filter((option) => option.value),
  )

  if (initialMenuBookOptions.length === 0) {
    throw new Error('staff_create_ticket_menu_book_not_available')
  }

  const verificationContext = await page.context().browser()?.newContext({ viewport: { width: 1440, height: 900 } })
  if (!verificationContext) {
    throw new Error('staff_customer_verification_context_unavailable')
  }

  try {
    let hasOpenModal = true
    for (const menuBookOption of initialMenuBookOptions) {
      if (!hasOpenModal) {
        await page.getByTestId('staff-open-create-ticket').click()
        await expect(page.getByTestId('staff-create-ticket-modal')).toBeVisible()
      }

      const menuBookSelect = page.getByTestId('staff-create-ticket-menu-book')
      const tableSelect = page.getByTestId('staff-create-ticket-table')
      await menuBookSelect.selectOption(menuBookOption.value)
      await expect.poll(async () => await tableSelect.locator('option').count(), { timeout: 10_000 }).toBeGreaterThan(1)

      const tableOptions = await tableSelect.locator('option').evaluateAll((options) =>
        options
          .map((option) => ({ value: (option as HTMLOptionElement).value, label: option.textContent?.trim() ?? '' }))
          .filter((option) => option.value),
      )

      if (tableOptions.length === 0) {
        continue
      }

      const prioritizedTableOptions = targetTableLabel
        ? [
            ...tableOptions.filter((option) => option.label === targetTableLabel),
            ...tableOptions.filter((option) => option.label !== targetTableLabel),
          ]
        : tableOptions

      if (targetTableLabel && !prioritizedTableOptions.some((option) => option.label === targetTableLabel)) {
        continue
      }

      for (const tableOption of prioritizedTableOptions) {
        await tableSelect.selectOption(tableOption.value)
        page.once('dialog', async (dialog) => {
          try {
            await dialog.accept()
          } catch {
            // Ignore already-handled dialogs while probing candidate menu books.
          }
        })
        await page.getByTestId('staff-create-ticket-submit').click()
        await expect(page.getByTestId('staff-create-ticket-modal')).not.toBeVisible({ timeout: 30_000 })
        hasOpenModal = false

        const customerLink = page.getByTestId('staff-selected-customer-link')
        await expect(customerLink).toBeVisible({ timeout: 30_000 })

        const customerUrl = await customerLink.getAttribute('href')
        if (!customerUrl) {
          throw new Error('staff_selected_customer_url_missing')
        }

        const verificationPage = await verificationContext.newPage()
        try {
          await gotoCustomer(verificationPage, customerUrl)
          if (await hasOrderableCustomerItem(verificationPage)) {
            return customerUrl
          }
        } finally {
          await verificationPage.close()
        }
      }
    }
  } finally {
    try {
      await verificationContext.close()
    } catch {
      // Ignore teardown races when the test times out or browser closes first.
    }
  }

  throw new Error('staff_created_ticket_without_orderable_customer_menu')
}

export async function readStaffSelectedLineCount(page: Page) {
  const summaryRow = page.locator('.staff-summary-card .summary-row').first()
  if ((await summaryRow.count()) === 0) return 0
  return parseLeadingNumber(await summaryRow.innerText())
}

export async function readCustomerActiveTicketNo(page: Page) {
  const urlTicket = new URL(page.url()).searchParams.get('ticket')?.trim() ?? ''
  if (urlTicket) {
    return urlTicket
  }
  const detailText = (await page.locator('.customer-hero p').last().textContent())?.trim() ?? ''
  const matches = detailText.match(/\d+/g)
  return matches?.at(-1) ?? ''
}

export async function readCustomerActiveTableLabel(page: Page) {
  const detailText = (await page.locator('.customer-hero p').last().textContent())?.trim() ?? ''
  const matches = detailText.match(/\d+/g)
  return matches?.[0] ?? ''
}

export async function waitForCustomerActiveTicketNo(page: Page, timeout = 10_000) {
  await expect
    .poll(async () => await readCustomerActiveTicketNo(page), { timeout })
    .not.toBe('')
}

export async function focusFirstStaffTicket(page: Page) {
  const firstTicket = page.locator('[data-testid^="staff-ticket-"]').first()
  if ((await firstTicket.count()) === 0) return false
  await firstTicket.click()
  await expect(page.locator('.staff-summary-card .summary-row').first()).toBeVisible({ timeout: 30_000 })
  return true
}

export async function focusStaffTicketByTicketNo(page: Page, ticketNo: string) {
  if (!ticketNo) return false
  const ticketCard = page.locator('[data-testid^="staff-ticket-"]').filter({ hasText: ticketNo }).first()
  if ((await ticketCard.count()) === 0) return false
  await ticketCard.click()
  await expect(page.locator('.staff-summary-card .summary-row').first()).toBeVisible({ timeout: 30_000 })
  return true
}

export async function focusStaffTicketByTableAndTicket(page: Page, tableLabel: string, ticketNo: string) {
  if (!tableLabel || !ticketNo) return false
  const searchInput = page.getByTestId('staff-ticket-search')
  if ((await searchInput.count()) > 0) {
    await searchInput.fill('')
    await searchInput.fill(tableLabel)
  }
  const ticketCard = page
    .locator('[data-testid^="staff-ticket-"]')
    .filter({ hasText: tableLabel })
    .filter({ hasText: ticketNo })
    .first()
  await expect.poll(async () => await ticketCard.count(), { timeout: 10_000 }).toBeGreaterThan(0)
  await ticketCard.click()
  await expect(page.locator('.staff-detail-head h3')).toContainText(`${tableLabel} / ${ticketNo}`, { timeout: 10_000 })
  await expect(page.locator('.staff-summary-card .summary-row').first()).toBeVisible({ timeout: 30_000 })
  return true
}

export async function readKdsQueueCount(page: Page) {
  return await page.locator('[data-testid^="kds-ticket-"]').count()
}

export async function waitForStaffSelectedLineCount(page: Page, expectedMinimum: number, timeout = 30_000) {
  await expect
    .poll(async () => await readStaffSelectedLineCount(page), { timeout })
    .toBeGreaterThanOrEqual(expectedMinimum)
}

export async function waitForKdsQueueCount(page: Page, expectedMinimum: number, timeout = 30_000) {
  await expect
    .poll(async () => await readKdsQueueCount(page), { timeout })
    .toBeGreaterThanOrEqual(expectedMinimum)
}

export async function discoverOrderableCustomerItemName(page: Page) {
  const card = await findAnyOrderableCard(page)
  const name = (await card.locator('h3').first().textContent())?.trim() ?? ''
  if (!name) {
    throw new Error('customer_orderable_item_name_not_found')
  }
  return name
}

async function findNamedOrderableCard(page: Page, itemName: string) {
  const topCategories = page.locator('[data-testid^="customer-top-category-"]')
  const topCount = await topCategories.count()

  for (let topIndex = 0; topIndex < Math.max(topCount, 1); topIndex += 1) {
    if (topCount > 0) {
      await topCategories.nth(topIndex).click()
    }

    const subCategories = page.locator('[data-testid^="customer-sub-category-"]')
    const subCount = await subCategories.count()

    for (let subIndex = 0; subIndex < Math.max(subCount, 1); subIndex += 1) {
      if (subCount > 0) {
        await subCategories.nth(subIndex).click()
      }

      const card = page.locator('[data-testid^="customer-menu-item-"]').filter({ hasText: itemName }).first()
      const incrementButton = card.locator('[data-testid^="customer-item-increment-"]').first()

      if ((await card.count()) > 0 && (await incrementButton.isEnabled())) {
        return card
      }
    }
  }

  throw new Error(`customer_order_item_not_found_or_not_orderable:${itemName}`)
}

export async function hasNamedOrderableCustomerItem(page: Page, itemName: string) {
  try {
    await findNamedOrderableCard(page, itemName)
    return true
  } catch {
    return false
  }
}

export async function waitForNamedOrderableCustomerItem(page: Page, itemName: string, timeout = 10_000) {
  await expect
    .poll(async () => await hasNamedOrderableCustomerItem(page, itemName), { timeout })
    .toBe(true)
}

async function findAnyOrderableCard(page: Page) {
  const topCategories = page.locator('[data-testid^="customer-top-category-"]')
  const topCount = await topCategories.count()

  for (let topIndex = 0; topIndex < Math.max(topCount, 1); topIndex += 1) {
    if (topCount > 0) {
      await topCategories.nth(topIndex).click()
    }

    const subCategories = page.locator('[data-testid^="customer-sub-category-"]')
    const subCount = await subCategories.count()

    for (let subIndex = 0; subIndex < Math.max(subCount, 1); subIndex += 1) {
      if (subCount > 0) {
        await subCategories.nth(subIndex).click()
      }

      const cards = page.locator('[data-testid^="customer-menu-item-"]')
      const cardCount = await cards.count()

      for (let cardIndex = 0; cardIndex < cardCount; cardIndex += 1) {
        const card = cards.nth(cardIndex)
        const incrementButton = card.locator('[data-testid^="customer-item-increment-"]').first()

        if (await incrementButton.isEnabled()) {
          return card
        }
      }
    }
  }

  throw new Error('customer_orderable_item_not_found')
}
