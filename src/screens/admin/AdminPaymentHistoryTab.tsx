import React, { useState, useEffect } from 'react'
import { getStaffSalesHistory, getStaffSalesReport } from '../../lib/staffReadApi'

type Props = {
  storeSlug: string
  disabled: boolean
  yen: (value: number) => string
  setError: (msg: string | null) => void
}

export function AdminPaymentHistoryTab({ storeSlug, disabled, yen, setError }: Props) {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [payments, setPayments] = useState<any[] | null>(null)

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
      const res = await getStaffSalesHistory(storeSlug, startDate, endDate)
      setPayments(res.payments || [])
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
            <h2>会計種別データ照会</h2>
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

        {payments && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>日付</th>
                  <th>会計種別</th>
                  <th style={{ textAlign: 'right' }}>売上金額</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-sub)' }}>
                      指定された期間の会計種別データはありません。
                    </td>
                  </tr>
                ) : (
                  payments.map((p, idx) => {
                    const typeLabel = p.payment_type_label || (
                      p.payment_type === 'CASH' ? '現金' :
                      p.payment_type === 'CARD' ? 'クレジットカード' :
                      p.payment_type === 'OTHER' ? 'その他' : p.payment_type
                    )
                    return (
                      <tr key={idx}>
                        <td>{p.business_date}</td>
                        <td>
                          <span className="badge" style={{ padding: '4px 10px', borderRadius: '12px', background: 'var(--admin-surface-soft)', border: '1px solid var(--admin-line)', fontWeight: 'bold' }}>
                            {typeLabel}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{yen(p.amount)}</td>
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
