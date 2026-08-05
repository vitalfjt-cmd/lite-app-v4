import React, { useState, useEffect } from 'react'
import { getStaffHourlySalesHistory, getStaffSalesReport } from '../../lib/staffReadApi'

type Props = {
  storeSlug: string
  disabled: boolean
  yen: (value: number) => string
  setError: (msg: string | null) => void
}

export function AdminHourlySalesHistoryTab({ storeSlug, disabled, yen, setError }: Props) {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<any[] | null>(null)

  useEffect(() => {
    const initDates = async () => {
      if (!storeSlug) return
      try {
        const res = await getStaffSalesReport(storeSlug)
        const date = res.report?.business_date || ''
        if (date) {
          setStartDate(prev => prev || date)
          setEndDate(prev => prev || date)
        }
      } catch (err) {
        // ignore init error
      }
    }
    initDates()
  }, [storeSlug])

  const handleSearch = async () => {
    if (!storeSlug || !startDate || !endDate) {
      setError('開始日と終了日を指定してください')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await getStaffHourlySalesHistory(storeSlug, startDate, endDate)
      setItems(res.items || [])
    } catch (err: any) {
      setError(err.message || String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ops-grid">
      <section className="panel admin-list-panel admin-list-panel-wide">
        <div className="admin-list-head">
          <div>
            <h2>時間帯別売上照会</h2>
          </div>
        </div>

        <div className="admin-filter-bar admin-filter-bar-dates">
          <label className="admin-filter-field">
            <span>開始日</span>
            <input 
              type="date" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)}
            />
          </label>
          <label className="admin-filter-field">
            <span>終了日</span>
            <input 
              type="date" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)}
            />
          </label>
          <div className="admin-filter-actions">
            <button 
              className="primary-button" 
              type="button"
              disabled={disabled || loading || !startDate || !endDate} 
              onClick={handleSearch}
            >
              {loading ? '検索中...' : '検索'}
            </button>
          </div>
        </div>

        {items && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>日付</th>
                  <th>時間帯</th>
                  <th style={{ textAlign: 'right' }}>伝票数</th>
                  <th style={{ textAlign: 'right' }}>売上金額</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-sub)' }}>
                      指定された期間の時間帯別売上データはありません。
                    </td>
                  </tr>
                ) : (
                  items.map((item, idx) => {
                    const hourLabel = item.hour_label || (item.hour !== undefined ? `${item.hour}時` : '-')
                    const countVal = item.ticket_count ?? item.count ?? '-'
                    const salesVal = item.sales_amount ?? item.amount ?? item.total_sales ?? 0
                    return (
                      <tr key={idx}>
                        <td>{item.business_date || '-'}</td>
                        <td>{hourLabel}</td>
                        <td style={{ textAlign: 'right' }}>{countVal}</td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{yen(salesVal)}</td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
