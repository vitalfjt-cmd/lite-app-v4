import { useState, useEffect, useMemo } from 'react'
import type { LiveTableRef, TicketSummaryView } from '../types'
import { TableQrModal } from '../components/TableQrModal'
import { buildCustomerUrl } from '../lib/appUtils'

type TableQrListScreenProps = {
  mode: 'customer-qr' | 'cust-tablet-qr'
  liveTables: LiveTableRef[]
  liveTicketSummaries: TicketSummaryView[]
  yen: (value: number) => string
  onOpenLauncher: () => void
  storeName: string
  storeSlug?: string
}

export function TableQrListScreen({
  mode,
  liveTables,
  liveTicketSummaries,
  yen,
  onOpenLauncher,
  storeName,
  storeSlug = 'demo-bbq',
}: TableQrListScreenProps) {
  const [now, setNow] = useState(() => new Date())
  const [selectedTableForQr, setSelectedTableForQr] = useState<LiveTableRef | null>(null)

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date())
    }, 10000)
    return () => clearInterval(timer)
  }, [])

  const title = mode === 'cust-tablet-qr' ? 'タブレット用 QRコード発行' : 'スマホ用 QRコード発行'
  const targetView = mode === 'cust-tablet-qr' ? 'cust-tablet' : 'customer'

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
        ? buildCustomerUrl(window.location, storeSlug, selectedTableForQr.qr_token, selectedTableTicket?.customerUrl || null, targetView)
        : null,
    [selectedTableForQr, storeSlug, selectedTableTicket, targetView],
  )

  const handleTableClick = (table: LiveTableRef) => {
    setSelectedTableForQr(table)
  }

  return (
    <div className="seats-screen" data-testid="table-qr-list-screen">
      <header className="seats-header" style={{ background: mode === 'cust-tablet-qr' ? 'linear-gradient(135deg, #1864ab 0%, #155592 100%)' : 'linear-gradient(135deg, #2b8a3e 0%, #237032 100%)' }}>
        <div className="logo-area">
          <button className="menu-trigger" onClick={onOpenLauncher} aria-label="Open Menu">
            <span className="material-icons">menu</span>
          </button>
          <h2>{title}</h2>
        </div>
      </header>

      <div className="seats-content">
        <div className="seats-legend">
          <span className="legend-title">卓をタップしてQRコードを表示:</span>
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
                  data-testid={`seat-card-qr-${table.label}`}
                >
                  <div className="seat-card-top">
                    <span className="seat-table-label">{table.label}</span>
                  </div>
                  <div className="seat-card-middle" style={{ fontSize: '0.85rem', color: '#888' }}>
                    QR表示
                  </div>
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
                style={{ cursor: 'pointer' }}
                data-testid={`seat-card-qr-${table.label}`}
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
