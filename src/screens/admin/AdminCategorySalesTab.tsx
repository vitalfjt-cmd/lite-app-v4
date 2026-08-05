import React, { useState, useEffect } from 'react'
import { getStaffCategorySalesHistory, getStaffSalesReport } from '../../lib/staffReadApi'

type Props = {
  storeSlug: string
  disabled: boolean
  yen: (value: number) => string
  setError: (msg: string | null) => void
}

export function AdminCategorySalesTab({ storeSlug, disabled, yen, setError }: Props) {
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
      const res = await getStaffCategorySalesHistory(storeSlug, startDate, endDate)
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
            <h2>カテゴリ別売上</h2>
          </div>
        </div>

        <div className="admin-filter-bar compact">
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
                  <th>カテゴリ名</th>
                  <th style={{ textAlign: 'right' }}>注文数量</th>
                  <th style={{ textAlign: 'right' }}>売上金額</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-sub)' }}>
                      指定された期間のカテゴリ別売上データはありません。
                    </td>
                  </tr>
                ) : (
                  items.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.category_name}</td>
                      <td style={{ textAlign: 'right' }}>{item.total_quantity}</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{yen(item.total_sales)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
