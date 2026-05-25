import { existsSync, readFileSync } from 'node:fs'
import { defineConfig } from '@playwright/test'

function readPublicAppOrigin() {
  const envPath = '.env.local'
  if (!existsSync(envPath)) return null

  const raw = readFileSync(envPath, 'utf8')
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const separatorIndex = trimmed.indexOf('=')
    if (separatorIndex <= 0) continue
    const key = trimmed.slice(0, separatorIndex).trim()
    const value = trimmed.slice(separatorIndex + 1).trim()
    if (key === 'VITE_PUBLIC_APP_ORIGIN' && value) {
      return value
    }
  }

  return null
}

const publicAppOrigin = readPublicAppOrigin()
const defaultOrigin = publicAppOrigin ? new URL(publicAppOrigin) : null
const host = process.env.PW_BASE_HOST ?? defaultOrigin?.hostname ?? '127.0.0.1'
const port = Number(process.env.PW_BASE_PORT ?? defaultOrigin?.port ?? '4173')
const protocol = process.env.PW_BASE_PROTOCOL ?? defaultOrigin?.protocol.replace(':', '') ?? 'http'
const baseURL = process.env.PW_BASE_URL ?? `${protocol}://${host}:${port}`

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 90_000,
  reporter: [['line'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    headless: process.env.PW_HEADLESS === '0' ? false : true,
  },
  webServer: {
    command: `npm run dev -- --host ${host} --port ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
