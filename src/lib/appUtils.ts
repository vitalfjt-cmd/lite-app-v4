import type { AppView } from '../types'

export type CustomerAccessParams = {
  storeSlug: string
  qrToken: string
  ticketToken: string
}

export type BrowserLocationLike = {
  href: string
  hash: string
  search: string
  origin: string
  pathname: string
}

function resolveAppOrigin(currentLocation: Pick<BrowserLocationLike, 'origin'>): string {
  const publicOrigin = import.meta.env.VITE_PUBLIC_APP_ORIGIN?.trim()
  if (publicOrigin) {
    return publicOrigin.replace(/\/+$/, '')
  }
  return currentLocation.origin
}

export function normalizeAppLocation(currentLocation: Pick<Location, 'href' | 'hash' | 'pathname' | 'search'> = window.location) {
  const url = new URL(currentLocation.href)
  
  // Handle path-based ticket ID: /UUID-like-string
  const pathParts = url.pathname.split('/').filter(Boolean)
  if (pathParts.length === 1 && pathParts[0].length > 20) {
    const ticketId = pathParts[0]
    url.searchParams.set('ticket', ticketId)
    // If store is missing, we might need a default for this prototype
    if (!url.searchParams.get('store')) {
      url.searchParams.set('store', 'demo-bbq')
    }
    // If QR is missing, we might need a placeholder or let it fail
    if (!url.searchParams.get('qr')) {
      url.searchParams.set('qr', 'qr-demo-bbq-101') // Default or placeholder
    }
    url.pathname = '/'
  }

  const hash = url.hash
  if (hash.startsWith('#/')) {
    const raw = hash.slice(2)
    const [hashView, hashQuery = ''] = raw.split('?')
    if (hashView === 'customer' || hashView === 'staff' || hashView === 'handy' || hashView === 'kds' || hashView === 'admin' || hashView === 'sales' || hashView === 'cust-tablet' || hashView === 'cust-table') {
      url.searchParams.set('view', hashView === 'cust-table' ? 'cust-tablet' : hashView)
    }

    const hashParams = new URLSearchParams(hashQuery)
    hashParams.forEach((value, key) => {
      url.searchParams.set(key, value)
    })
    url.hash = ''
  }
  
  let view = url.searchParams.get('view')
  if (view === 'cust-table') {
    url.searchParams.set('view', 'cust-tablet')
    view = 'cust-tablet'
  }

  if (view === 'cust-tablet') {
    const store = url.searchParams.get('store')
    const qr = url.searchParams.get('qr')
    if (store && qr) {
      window.localStorage.setItem('pos_tablet_store', store)
      window.localStorage.setItem('pos_tablet_qr', qr)
    } else {
      const savedStore = window.localStorage.getItem('pos_tablet_store')
      const savedQr = window.localStorage.getItem('pos_tablet_qr')
      if (savedStore && savedQr) {
        if (!store) url.searchParams.set('store', savedStore)
        if (!qr) url.searchParams.set('qr', savedQr)
      }
    }
  }

  if (url.toString() !== currentLocation.href) {
    const originalUrl = new URL(currentLocation.href)
    const isTabletRestoring = view === 'cust-tablet' && (
      url.searchParams.get('store') !== originalUrl.searchParams.get('store') ||
      url.searchParams.get('qr') !== originalUrl.searchParams.get('qr') ||
      url.searchParams.get('view') !== originalUrl.searchParams.get('view')
    )
    if (isTabletRestoring) {
      window.location.replace(url.toString())
      return
    }
    window.history.replaceState({}, '', url)
  }
}

export function readCustomerAccessParams(
  currentLocation: Pick<Location, 'hash' | 'search'> = window.location,
): CustomerAccessParams {
  const hash = currentLocation.hash
  const hashQuery = hash.includes('?') ? hash.slice(hash.indexOf('?') + 1) : ''
  const searchParams = new URLSearchParams(currentLocation.search)
  const hashParams = new URLSearchParams(hashQuery)
  return {
    storeSlug: hashParams.get('store') || searchParams.get('store') || '',
    qrToken: hashParams.get('qr') || searchParams.get('qr') || '',
    ticketToken: hashParams.get('ticket') || searchParams.get('ticket') || '',
  }
}

export function readViewFromHash(currentLocation: Pick<Location, 'hash' | 'search'> = window.location): AppView | null {
  const params = new URLSearchParams(currentLocation.search)
  let queryView = params.get('view')
  if (queryView === 'cust-table') {
    queryView = 'cust-tablet'
  }
  if (queryView === 'staff' || queryView === 'handy' || queryView === 'kds' || queryView === 'admin' || queryView === 'sales' || queryView === 'customer' || queryView === 'cust-tablet') return queryView as AppView
  const hash = currentLocation.hash.replace('#/', '')
  const hashView = hash === 'cust-table' ? 'cust-tablet' : hash
  return hashView === 'staff' || hashView === 'handy' || hashView === 'kds' || hashView === 'admin' || hashView === 'sales' || hashView === 'cust-tablet' || hashView === 'customer' ? hashView as AppView : null
}

export function yen(value: number): string {
  return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 }).format(value)
}

export function composeScopedCategoryId(parentId: string | null | undefined, categoryId: string) {
  return parentId ? `${parentId}:${categoryId}` : categoryId
}

export function syncCustomerTicketInUrl(ticketToken: string | null) {
  const url = new URL(window.location.href)
  if (ticketToken) {
    url.searchParams.set('ticket', ticketToken)
  } else {
    url.searchParams.delete('ticket')
  }
  window.history.replaceState({}, '', url)
}

export async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  return await Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => reject(new Error(message)), timeoutMs)
    }),
  ])
}


export async function resizeMenuItemImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') {
    return file
  }

  const imageUrl = URL.createObjectURL(file)
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const nextImage = new Image()
      nextImage.onload = () => resolve(nextImage)
      nextImage.onerror = () => reject(new Error('画像の読み込みに失敗しました。'))
      nextImage.src = imageUrl
    })

    const maxDimension = 1600
    const longestSide = Math.max(image.naturalWidth, image.naturalHeight)
    if (longestSide <= maxDimension && file.size <= 1024 * 1024) {
      return file
    }

    const scale = Math.min(1, maxDimension / longestSide)
    const width = Math.max(1, Math.round(image.naturalWidth * scale))
    const height = Math.max(1, Math.round(image.naturalHeight * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) {
      throw new Error('画像処理の初期化に失敗しました。')
    }

    context.drawImage(image, 0, 0, width, height)

    const outputType = file.type === 'image/png' ? 'image/png' : 'image/webp'
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((nextBlob) => {
        if (nextBlob) resolve(nextBlob)
        else reject(new Error('画像の変換に失敗しました。'))
      }, outputType, outputType === 'image/png' ? undefined : 0.86)
    })

    const extension = outputType === 'image/png' ? 'png' : 'webp'
    const fileName = file.name.replace(/\.[^.]+$/, '') || 'image'
    return new File([blob], `${fileName}.${extension}`, {
      type: outputType,
      lastModified: Date.now(),
    })
  } finally {
    URL.revokeObjectURL(imageUrl)
  }
}

export async function fileToDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('画像の読み込みに失敗しました。'))
      }
    }
    reader.onerror = () => reject(new Error('画像の読み込みに失敗しました。'))
    reader.readAsDataURL(file)
  })
}

export function formatTime(value: string): string {
  return new Intl.DateTimeFormat('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}

export function formatError(err: unknown): string {
  if (err instanceof Error) return err.message
  if (err && typeof err === 'object') {
    const candidate = err as { message?: unknown; details?: unknown; hint?: unknown; code?: unknown }
    const parts = [
      typeof candidate.message === 'string' ? candidate.message : '',
      typeof candidate.details === 'string' ? candidate.details : '',
      typeof candidate.hint === 'string' ? candidate.hint : '',
      typeof candidate.code === 'string' ? `(${candidate.code})` : '',
    ].filter(Boolean)
    if (parts.length > 0) return parts.join(' ')
  }
  return String(err || 'Unknown error.')
}

export function toBookCode(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function toQrTokenPart(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function messageTone(message: string | null): 'success' | 'error' {
  if (
    !message ||
    message.includes('failed') ||
    message.includes('cannot') ||
    message.includes('error') ||
    message.includes('not found') ||
    message.includes('Failed')
  ) {
    return 'error'
  }
  return 'success'
}

export function sanitizeFilePart(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'image'
}

export function buildCustomerUrl(
  baseLocation: Pick<BrowserLocationLike, 'origin' | 'pathname'>,
  storeSlug: string | null | undefined,
  qrToken: string | null | undefined,
  ticketToken?: string | null | undefined,
): string | null {
  if (!storeSlug || !qrToken) return null
  const url = new URL(resolveAppOrigin(baseLocation) + baseLocation.pathname)
  url.searchParams.set('view', 'customer')
  url.searchParams.set('store', storeSlug)
  url.searchParams.set('qr', qrToken)
  if (ticketToken) {
    url.searchParams.set('ticket', ticketToken)
  }
  return url.toString()
}

export function buildQrImageUrl(payload: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=16&data=${encodeURIComponent(payload)}`
}

export function parseTimeToMinutes(timeStr: string | null | undefined): number | null {
  if (!timeStr) return null
  const normalized = String(timeStr).replace(/：/g, ':').replace(/\s+/g, '').trim()
  const parts = normalized.split(':')
  if (parts.length < 2) return null
  const hours = parseInt(parts[0], 10)
  const minutes = parseInt(parts[1], 10)
  if (isNaN(hours) || isNaN(minutes)) return null
  return hours * 60 + minutes
}

export function isTimeWithinWindow(
  fromTime: string | null | undefined,
  toTime: string | null | undefined,
  now: Date = new Date()
): boolean {
  const fromMin = parseTimeToMinutes(fromTime)
  const toMin = parseTimeToMinutes(toTime)

  if (fromMin === null && toMin === null) return true

  const currentMin = now.getHours() * 60 + now.getMinutes()

  if (fromMin !== null && toMin === null) return currentMin >= fromMin
  if (fromMin === null && toMin !== null) return currentMin <= toMin

  if (fromMin !== null && toMin !== null) {
    if (fromMin <= toMin) {
      return currentMin >= fromMin && currentMin <= toMin
    } else {
      return currentMin >= fromMin || currentMin <= toMin
    }
  }
  return true
}

