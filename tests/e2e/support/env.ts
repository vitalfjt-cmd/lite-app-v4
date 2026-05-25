export type RoleCredentials = {
  email: string
  password: string
}

export type MultiContextScenario = {
  customerCount: number
  customerStore: string
  customerQr: string
  customerOrderItemName: string | null
  customerOrderContexts: number
  customerOrdersPerContext: number
  orderStaggerMs: number
  exerciseOrderFlow: boolean
  disableStaffFallback: boolean
  metricsOutputPath: string | null
  maxRequestMs: number | null
  maxTotalMs: number | null
  maxStaffPropagationMs: number | null
  maxKdsPropagationMs: number | null
  staffStorageStatePath: string | null
  kdsStorageStatePath: string | null
  staff: RoleCredentials | null
  kds: RoleCredentials | null
}

function readNumber(name: string, fallback: number): number {
  const raw = process.env[name]
  if (!raw) return fallback
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback
}

function readCredentials(prefix: 'PW_STAFF' | 'PW_KDS'): RoleCredentials | null {
  const email = process.env[`${prefix}_EMAIL`]?.trim() ?? ''
  const password = process.env[`${prefix}_PASSWORD`]?.trim() ?? ''
  if (!email || !password) return null
  return { email, password }
}

function readOptionalNumber(name: string): number | null {
  const raw = process.env[name]
  if (!raw) return null
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : null
}

export function readScenario(): MultiContextScenario {
  const customerCount = readNumber('PW_CUSTOMER_CONTEXTS', 4)
  return {
    customerCount,
    customerStore: process.env.PW_CUSTOMER_STORE?.trim() ?? '',
    customerQr: process.env.PW_CUSTOMER_QR?.trim() ?? '',
    customerOrderItemName: process.env.PW_CUSTOMER_ORDER_ITEM_NAME?.trim() || null,
    customerOrderContexts: Math.min(readNumber('PW_CUSTOMER_ORDER_CONTEXTS', customerCount), customerCount),
    customerOrdersPerContext: readNumber('PW_CUSTOMER_ORDERS_PER_CONTEXT', 1),
    orderStaggerMs: readNumber('PW_ORDER_STAGGER_MS', 750),
    exerciseOrderFlow: process.env.PW_EXERCISE_ORDER_FLOW === '1',
    disableStaffFallback: process.env.PW_DISABLE_STAFF_FALLBACK === '1',
    metricsOutputPath: process.env.PW_METRICS_OUTPUT_PATH?.trim() || null,
    maxRequestMs: readOptionalNumber('PW_MAX_REQUEST_MS'),
    maxTotalMs: readOptionalNumber('PW_MAX_TOTAL_MS'),
    maxStaffPropagationMs: readOptionalNumber('PW_MAX_STAFF_PROPAGATION_MS'),
    maxKdsPropagationMs: readOptionalNumber('PW_MAX_KDS_PROPAGATION_MS'),
    staffStorageStatePath: process.env.PW_STAFF_STORAGE_STATE_PATH?.trim() || 'tests/e2e/artifacts/auth/staff.json',
    kdsStorageStatePath: process.env.PW_KDS_STORAGE_STATE_PATH?.trim() || 'tests/e2e/artifacts/auth/kds.json',
    staff: readCredentials('PW_STAFF'),
    kds: readCredentials('PW_KDS'),
  }
}

export function hasCustomerAccess(scenario: MultiContextScenario): boolean {
  return Boolean(scenario.customerStore && scenario.customerQr)
}
