import { appendFile, mkdir, readFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import path from 'node:path'

function parseArgs(argv) {
  const options = {
    runs: 5,
    output: 'tests/e2e/artifacts/load-run-results.jsonl',
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--runs' && argv[index + 1]) {
      const parsed = Number(argv[index + 1])
      if (Number.isFinite(parsed) && parsed > 0) {
        options.runs = Math.floor(parsed)
      }
      index += 1
      continue
    }
    if (arg === '--output' && argv[index + 1]) {
      options.output = argv[index + 1]
      index += 1
    }
  }

  return options
}

function classifyFailure(output) {
  if (output.includes('staff_target_ticket_not_found')) return 'staff_target_ticket'
  if (output.includes('customer_direct_order_path_not_found')) return 'direct_order_path'
  if (output.includes('customer_orderable_item_not_found')) return 'customer_orderable_item'
  if (output.includes('staff_create_ticket_table_not_available')) return 'staff_create_ticket_table'
  if (output.includes('createStaffTicketAndGetCustomerUrlForTable') && output.includes('staff-create-ticket-table')) {
    return 'staff_create_ticket_table'
  }
  if (output.includes('staff_created_ticket_without_orderable_customer_menu')) return 'staff_create_ticket_menu'
  if (output.includes('toBeLessThanOrEqual') && output.includes('3000')) return 'total_threshold'
  if (output.includes('Expected: <=') && output.includes('Received:') && output.includes('5000')) return 'staff_threshold'
  if (output.includes('Expected: <=') && output.includes('Received:') && output.includes('7000')) return 'kds_threshold'
  if (output.includes('toBeGreaterThan') && output.includes('ticketCard.count')) return 'staff_target_ticket'
  if (output.includes('toBeGreaterThanOrEqual') && output.includes('waitForStaffSelectedLineCount')) return 'staff_observation'
  if (output.includes('toBeGreaterThanOrEqual') && output.includes('waitForKdsQueueCount')) return 'kds_observation'
  if (output.includes('Test timeout')) return 'timeout'
  return 'other'
}

function readMetricsPayload(output) {
  const marker = '[playwright-load-metrics]'
  const markerIndex = output.lastIndexOf(marker)
  if (markerIndex === -1) return null
  const braceIndex = output.indexOf('{', markerIndex)
  if (braceIndex === -1) return null

  let depth = 0
  let inString = false
  let escaping = false

  for (let index = braceIndex; index < output.length; index += 1) {
    const char = output[index]
    if (inString) {
      if (escaping) {
        escaping = false
      } else if (char === '\\') {
        escaping = true
      } else if (char === '"') {
        inString = false
      }
      continue
    }

    if (char === '"') {
      inString = true
      continue
    }

    if (char === '{') depth += 1
    if (char === '}') depth -= 1

    if (depth === 0) {
      try {
        return JSON.parse(output.slice(braceIndex, index + 1))
      } catch {
        return null
      }
    }
  }

  return null
}

function runFoundationOnce() {
  return new Promise((resolve) => {
    const child = spawn(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', 'npm.cmd run test:e2e:foundation'], {
      cwd: process.cwd(),
      env: process.env,
      shell: false,
    })

    let combined = ''

    child.stdout.on('data', (chunk) => {
      const text = chunk.toString()
      combined += text
      process.stdout.write(text)
    })

    child.stderr.on('data', (chunk) => {
      const text = chunk.toString()
      combined += text
      process.stderr.write(text)
    })

    child.on('close', (code) => {
      resolve({ code: code ?? 1, output: combined })
    })
  })
}

function summarize(results) {
  const counts = new Map()
  for (const result of results) {
    counts.set(result.reason, (counts.get(result.reason) ?? 0) + 1)
  }

  return {
    pass: results.filter((result) => result.exitCode === 0).length,
    fail: results.filter((result) => result.exitCode !== 0).length,
    failRate:
      results.length > 0
        ? Math.round((results.filter((result) => result.exitCode !== 0).length / results.length) * 1000) / 10
        : 0,
    byReason: Object.fromEntries([...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]))),
  }
}

async function appendResult(outputPath, payload) {
  const resolved = path.resolve(process.cwd(), outputPath)
  await mkdir(path.dirname(resolved), { recursive: true })
  await appendFile(resolved, `${JSON.stringify(payload)}\n`, 'utf8')
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const results = []

  for (let run = 1; run <= options.runs; run += 1) {
    console.log(`=== Sample ${run}/${options.runs} ===`)
    const startedAt = new Date().toISOString()
    const { code, output } = await runFoundationOnce()
    const metrics = readMetricsPayload(output)
    const reason = code === 0 ? 'pass' : classifyFailure(output)
    const payload = {
      recordedAt: startedAt,
      run,
      exitCode: code,
      reason,
      scenario: metrics?.scenario ?? null,
      propagationMs: metrics?.propagationMs ?? null,
      totalMs: metrics?.totalMs ?? null,
      requestMs: metrics?.requestMs ?? null,
      targetTableLabel: metrics?.targetTableLabel ?? null,
      targetTicketNo: metrics?.targetTicketNo ?? null,
      usedStaffFallback: metrics?.usedStaffFallback ?? null,
    }
    results.push(payload)
    await appendResult(options.output, payload)
    console.log(`=== Result ${run}: ${reason} (exit ${code}) ===`)
  }

  console.log(JSON.stringify(summarize(results), null, 2))
}

main().catch((error) => {
  console.error(`Failed to run load samples: ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
})
