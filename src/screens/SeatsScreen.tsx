import { useState, useEffect, useMemo } from 'react'
import type { LiveTableRef, TicketSummaryView } from '../types'
import { TableQrModal } from '../components/TableQrModal'
import { buildCustomerUrl } from '../lib/appUtils'

type SeatsScreenProps = {
  liveTables: LiveTableRef[]
  liveTicketSummaries: TicketSummaryView[]
  yen: (value: number) => string
  onSelectTable?: (tableName: string) => void
  onOpenLauncher: () => void
  storeName: string
  storeSlug?: string
}

export function SeatsScreen({
  liveTables,
  liveTicketSummaries,
  yen,
  onSelectTable,
  onOpenLauncher,
  storeName,
  storeSlug = 'demo-bbq',
}: SeatsScreenProps) {
  const [now, setNow] = useState(() => new Date())
  const [selectedTableForQr, setSelectedTableForQr] = useState<LiveTableRef | null>(null)

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date())
    }, 10000)
    return () => clearInterval(timer)
  }, [])

  const sortedTables = useMemo(() => {
    return [...liveTables].sort((a, b) => {
      const sa = a.sort_order ?? 0
      const sb = b.sort_order ?? 0
      if (sa !== sb) return sa - sb
      return a.label.localeCompare(b.label, undefined, { numeric: true, sensitivity: 'base' })
    })
  }, [liveTables])

  const selectedTableTicket = useMemo(
    () => liveTicketSummaries.find((t) => t.tableName === selectedTableForQr?.label),
    [liveTicketSummaries, selectedTableForQr],
  )

  const selectedTableCustomerUrl = useMemo(
    () =>
      selectedTableForQr
        ? buildCustomerUrl(window.location, storeSlug, selectedTableForQr.qr_token, selectedTableTicket?.customerUrl || null)
        : null,
    [selectedTableForQr, storeSlug, selectedTableTicket],
  )

  const handleTableClick = (table: LiveTableRef) => {
    setSelectedTableForQr(table)
  }

  return (
    <div className="seats-screen" data-testid="seats-screen">
      <header className="seats-header">
        <div className="logo-area">
          <button className="menu-trigger" onClick={onOpenLauncher} aria-label="Open Menu">
            <span className="material-icons">menu</span>
          </button>
          <h2>座席情報</h2>
        </div>
      </header>

      <div className="seats-content">
        <div className="seats-legend">
          <span className="legend-title">滞留時間区分:</span>
          <div className="legend-items">
            <div className="legend-item">
              <div className="legend-color blue"></div>
              <span>1時間未満</span>
            </div>
            <div className="legend-item">
              <div className="legend-color yellow"></div>
              <span>2時間未満</span>
            </div>
            <div className="legend-item">
              <div className="legend-color red"></div>
              <span>2時間以上</span>
            </div>
            <div className="legend-item">
              <div className="legend-color grey"></div>
              <span>空席</span>
            </div>
          </div>
        </div>

        <div className="seats-grid">
          {sortedTables.map((table) => {
            const ticket = liveTicketSummaries.find(
              (t) => t.tableName === table.label
            )

            if (!ticket) {
              return (
                <div
                  key={table.id}
                  className="seat-card empty"
                  onClick={() => handleTableClick(table)}
                  style={{ cursor: 'pointer' }}
                  data-testid={`seat-card-${table.label}`}
                >
                  <div className="seat-card-top">
                    <span className="seat-table-label">{table.label}</span>
                  </div>
                  <div className="seat-card-middle"></div>
                  <div className="seat-card-bottom"></div>
                </div>
              )
            }

            const checkInTime = new Date(ticket.orderedAt)
            const elapsedMs = now.getTime() - checkInTime.getTime()
            const elapsedMins = Math.max(0, elapsedMs / (1000 * 60))
            const elapsedHours = elapsedMins / 60

            let colorClass = 'blue'
            if (elapsedHours >= 2) {
              colorClass = 'red'
            } else if (elapsedHours >= 1) {
              colorClass = 'yellow'
            }

            const checkInStr = checkInTime.getHours().toString().padStart(2, '0') + ':' + checkInTime.getMinutes().toString().padStart(2, '0')

            return (
              <div
                key={table.id}
                className={`seat-card occupied ${colorClass}`}
                onClick={() => handleTableClick(table)}
                data-testid={`seat-card-${table.label}`}
              >
                <div className="seat-card-top">
                  <span className="seat-table-label">{table.label}</span>
                  <span className="seat-customer-count">{ticket.customerCount || 1}名</span>
                </div>
                <div className="seat-card-middle">
                  {checkInStr}
                </div>
                <div className="seat-card-bottom">
                  {yen(ticket.subtotal)}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <TableQrModal
        isOpen={Boolean(selectedTableForQr)}
        storeName={storeName}
        tableLabel={selectedTableForQr?.label ?? ''}
        qrToken={selectedTableForQr?.qr_token ?? ''}
        customerUrl={selectedTableCustomerUrl}
        onClose={() => setSelectedTableForQr(null)}
      />
    </div>
  )
}
