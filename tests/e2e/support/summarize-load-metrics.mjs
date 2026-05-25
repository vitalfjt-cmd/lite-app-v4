import { readFile } from 'node:fs/promises'
import path from 'node:path'

function toNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function formatMs(value) {
  return value === null ? '-' : `${value}ms`
}

function formatDelta(current, previous) {
  if (current === null || previous === null) return '-'
  const delta = current - previous
  const sign = delta > 0 ? '+' : ''
  return `${sign}${delta}ms`
}

function pad(value, width) {
  return String(value).padEnd(width, ' ')
}

function formatRecordedAt(value) {
  return String(value ?? '').replace('T', ' ').replace('.000Z', 'Z').slice(0, 22)
}

function parseArgs(argv) {
  const options = {
    file: process.env.PW_METRICS_OUTPUT_PATH || 'tests/e2e/artifacts/load-metrics.jsonl',
    limit: 5,
    scenario: '',
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--file' && argv[index + 1]) {
      options.file = argv[index + 1]
      index += 1
      continue
    }
    if (arg === '--limit' && argv[index + 1]) {
      const parsed = Number(argv[index + 1])
      if (Number.isFinite(parsed) && parsed > 0) {
        options.limit = Math.floor(parsed)
      }
      index += 1
      continue
    }
    if (arg === '--scenario' && argv[index + 1]) {
      options.scenario = argv[index + 1].trim()
      index += 1
    }
  }

  return options
}

function parseJsonLines(content) {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line))
}

function toScenarioKey(entry) {
  return `${entry?.scenario?.customerContexts ?? '?'}c/${entry?.scenario?.orderingContexts ?? '?'}o/${entry?.scenario?.ordersPerContext ?? '?'}x/${entry?.scenario?.staggerMs ?? '?'}ms`
}

function summarizeEntry(entry) {
  return {
    recordedAt: entry.recordedAt ?? '',
    scenario: toScenarioKey(entry),
    totalP95: toNumber(entry?.totalMs?.p95),
    totalMax: toNumber(entry?.totalMs?.max),
    requestP95: toNumber(entry?.requestMs?.p95),
    requestMax: toNumber(entry?.requestMs?.max),
    staffPropagation: toNumber(entry?.propagationMs?.staff),
    kdsPropagation: toNumber(entry?.propagationMs?.kds),
    statuses: Array.isArray(entry?.statuses) ? entry.statuses.join(',') : '-',
  }
}

function average(values) {
  const filtered = values.filter((value) => value !== null)
  if (filtered.length === 0) return null
  return Math.round(filtered.reduce((sum, value) => sum + value, 0) / filtered.length)
}

function printTable(entries) {
  const headers = [
    ['recordedAt', 22],
    ['scenario', 10],
    ['totalP95', 10],
    ['totalMax', 10],
    ['reqP95', 10],
    ['reqMax', 10],
    ['staffProp', 11],
    ['kdsProp', 11],
    ['statuses', 10],
  ]

  console.log(headers.map(([label, width]) => pad(label, width)).join(' '))
  console.log(headers.map(([, width]) => '-'.repeat(width)).join(' '))

  for (const entry of entries) {
    console.log(
      [
        pad(formatRecordedAt(entry.recordedAt), 22),
        pad(entry.scenario, 10),
        pad(formatMs(entry.totalP95), 10),
        pad(formatMs(entry.totalMax), 10),
        pad(formatMs(entry.requestP95), 10),
        pad(formatMs(entry.requestMax), 10),
        pad(formatMs(entry.staffPropagation), 11),
        pad(formatMs(entry.kdsPropagation), 11),
        pad(entry.statuses, 10),
      ].join(' '),
    )
  }
}

function printComparison(entries, scenarioKey) {
  if (entries.length < 2) {
    console.log('Comparison: not enough runs for delta')
    return
  }

  const previous = entries.at(-2)
  const latest = entries.at(-1)
  console.log(`Comparison: latest vs previous${scenarioKey ? ` for ${scenarioKey}` : ''}`)
  console.log(`latest:   ${formatRecordedAt(latest.recordedAt)}`)
  console.log(`previous: ${formatRecordedAt(previous.recordedAt)}`)
  console.log(
    [
      `totalP95 ${formatDelta(latest.totalP95, previous.totalP95)}`,
      `totalMax ${formatDelta(latest.totalMax, previous.totalMax)}`,
      `reqP95 ${formatDelta(latest.requestP95, previous.requestP95)}`,
      `staffProp ${formatDelta(latest.staffPropagation, previous.staffPropagation)}`,
      `kdsProp ${formatDelta(latest.kdsPropagation, previous.kdsPropagation)}`,
    ].join(' | '),
  )
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const resolvedPath = path.resolve(process.cwd(), options.file)
  const content = await readFile(resolvedPath, 'utf8')
  const entries = parseJsonLines(content)

  if (entries.length === 0) {
    console.log(`No metrics found: ${resolvedPath}`)
    return
  }

  const summarized = entries.map(summarizeEntry)
  const filtered = options.scenario ? summarized.filter((entry) => entry.scenario === options.scenario) : summarized

  if (filtered.length === 0) {
    console.log(`No metrics found for scenario: ${options.scenario}`)
    return
  }

  const recent = filtered.slice(-options.limit)

  console.log(`Load metrics: ${resolvedPath}`)
  console.log(`Runs shown: ${recent.length} / ${filtered.length}${options.scenario ? ` for ${options.scenario}` : ''}`)
  console.log('')
  printTable(recent)
  console.log('')
  console.log(
    [
      `avg totalP95=${formatMs(average(recent.map((entry) => entry.totalP95)))}`,
      `avg totalMax=${formatMs(average(recent.map((entry) => entry.totalMax)))}`,
      `avg staffProp=${formatMs(average(recent.map((entry) => entry.staffPropagation)))}`,
      `avg kdsProp=${formatMs(average(recent.map((entry) => entry.kdsPropagation)))}`,
    ].join(' | '),
  )
  console.log('')
  printComparison(filtered, options.scenario)
}

main().catch((error) => {
  console.error(`Failed to summarize load metrics: ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
})
