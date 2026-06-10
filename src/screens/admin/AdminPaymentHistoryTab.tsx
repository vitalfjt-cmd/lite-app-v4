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

  // Initialize dates with the current business day
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
    <div className="admin-tab-content" style={{ maxHeight: '100%', height: '100%', overflowY: 'auto', paddingRight: '12px', paddingBottom: '32px' }}>
      <div className="admin-tab-head">
        <div>
          <h2>会計種別データ照会</h2>
          <p className="caption">期間を指定して、日付ごとの会計種別（決済手段）別の売上金額を集計・照会します。</p>
        </div>
      </div>

      <div style={{ padding: '24px', background: 'white', borderRadius: '12px', border: '1px solid #dee2e6', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.9rem', color: '#495057' }}>開始日:</span>
            <input 
              type="date" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)}
              style={{ padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '8px', fontSize: '1rem' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.9rem', color: '#495057' }}>終了日:</span>
            <input 
              type="date" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)}
              style={{ padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '8px', fontSize: '1rem' }}
            />
          </div>
          <button 
            className="primary-button" 
            style={{ background: '#228be6', padding: '10px 20px' }} 
            disabled={disabled || loading || !startDate || !endDate} 
            onClick={handleSearch}
          >
            {loading ? '検索中...' : '検索する'}
          </button>
        </div>

        {payments && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
            <thead>
              <tr style={{ background: '#f8f9fa' }}>
                <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '2px solid #dee2e6', color: '#495057' }}>日付</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '2px solid #dee2e6', color: '#495057' }}>会計種別</th>
                <th style={{ padding: '12px 8px', textAlign: 'right', borderBottom: '2px solid #dee2e6', color: '#495057' }}>売上金額</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ padding: '24px', textAlign: 'center', color: '#adb5bd' }}>
                    指定された期間の会計種別データはありません。
                  </td>
                </tr>
              ) : (
                payments.map((p, idx) => {
                  let typeLabel = p.payment_type
                  if (p.payment_type === 'CASH') typeLabel = '現金'
                  else if (p.payment_type === 'CARD') typeLabel = 'クレジットカード'
                  else if (p.payment_type === 'OTHER') typeLabel = 'その他'

                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f3f5' }}>
                      <td style={{ padding: '12px 8px', color: '#212529' }}>{p.business_date}</td>
                      <td style={{ padding: '12px 8px', color: '#212529' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.85rem',
                          fontWeight: 'bold',
                          background: p.payment_type === 'CASH' ? '#e3fafc' : p.payment_type === 'CARD' ? '#edf2ff' : '#f3f0ff',
                          color: p.payment_type === 'CASH' ? '#0b7285' : p.payment_type === 'CARD' ? '#364fc7' : '#5f3dc4',
                        }}>
                          {typeLabel}
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold', color: '#212529' }}>{yen(p.amount)}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
