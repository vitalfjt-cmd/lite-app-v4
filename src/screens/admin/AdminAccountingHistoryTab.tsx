import React, { useState, useEffect, useMemo } from 'react'
import { getStaffSalesReport, getStaffAccountingTransactions } from '../../lib/staffReadApi'

type Props = {
  storeSlug: string
  disabled: boolean
  yen: (value: number) => string
  setError: (msg: string | null) => void
}

export function AdminAccountingHistoryTab({ storeSlug, disabled, yen, setError }: Props) {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [transactions, setTransactions] = useState<any[] | null>(null)

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
      const res = await getStaffAccountingTransactions(storeSlug, startDate, endDate)
      setTransactions(res.transactions || [])
    } catch (err: any) {
      setError(err.message || String(err))
    } finally {
      setLoading(false)
    }
  }

  // Calculate summaries on-the-fly from search results
  const summary = useMemo(() => {
    if (!transactions) return null
    let totalCount = transactions.length
    let totalAmount = 0
    let cashAmount = 0
    let cardAmount = 0
    let otherAmount = 0

    for (const tx of transactions) {
      totalAmount += tx.amount
      if (tx.payment_type === 'CASH') {
        cashAmount += tx.amount
      } else if (tx.payment_type === 'CARD') {
        cardAmount += tx.amount
      } else {
        otherAmount += tx.amount
      }
    }

    return { totalCount, totalAmount, cashAmount, cardAmount, otherAmount }
  }, [transactions])

  const formatTokyoTime = (paidAt: string) => {
    try {
      const date = new Date(paidAt)
      return new Intl.DateTimeFormat('ja-JP', {
        timeZone: 'Asia/Tokyo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(date)
    } catch (e) {
      return paidAt
    }
  }

  return (
    <div className="admin-tab-content" style={{ maxHeight: '100%', height: '100%', overflowY: 'auto', paddingRight: '12px', paddingBottom: '32px' }}>
      <div className="admin-tab-head">
        <div>
          <h2>会計データ照会</h2>
          <p className="caption">期間を指定して、個別の会計データ（レシート単位）を照会します。</p>
        </div>
      </div>

      <div style={{ padding: '24px', background: 'white', borderRadius: '12px', border: '1px solid #dee2e6', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap' }}>
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

        {summary && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '10px', border: '1px solid #dee2e6' }}>
              <div style={{ fontSize: '0.85rem', color: '#868e96', marginBottom: '4px' }}>会計件数</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#212529' }}>{summary.totalCount} 件</div>
            </div>
            <div style={{ background: '#e8f7ff', padding: '16px', borderRadius: '10px', border: '1px solid #b3e3ff' }}>
              <div style={{ fontSize: '0.85rem', color: '#006699', marginBottom: '4px' }}>合計金額</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#006699' }}>{yen(summary.totalAmount)}</div>
            </div>
            <div style={{ background: '#ebfbee', padding: '16px', borderRadius: '10px', border: '1px solid #c3fae8' }}>
              <div style={{ fontSize: '0.85rem', color: '#0b7285', marginBottom: '4px' }}>現金合計</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#0b7285' }}>{yen(summary.cashAmount)}</div>
            </div>
            <div style={{ background: '#edf2ff', padding: '16px', borderRadius: '10px', border: '1px solid #d0ebff' }}>
              <div style={{ fontSize: '0.85rem', color: '#364fc7', marginBottom: '4px' }}>クレジットカード合計</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#364fc7' }}>{yen(summary.cardAmount)}</div>
            </div>
            <div style={{ background: '#f3f0ff', padding: '16px', borderRadius: '10px', border: '1px solid #e5dbff' }}>
              <div style={{ fontSize: '0.85rem', color: '#5f3dc4', marginBottom: '4px' }}>その他合計</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#5f3dc4' }}>{yen(summary.otherAmount)}</div>
            </div>
          </div>
        )}

        {transactions && (
          <div style={{ overflowY: 'auto', maxHeight: '500px', border: '1px solid #dee2e6', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
              <thead>
                <tr style={{ background: '#f8f9fa' }}>
                  <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '2px solid #dee2e6', color: '#495057', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 1 }}>日付</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '2px solid #dee2e6', color: '#495057', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 1 }}>会計時刻(asia-tokyo)</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '2px solid #dee2e6', color: '#495057', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 1 }}>レシート番号</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '2px solid #dee2e6', color: '#495057', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 1 }}>会計種別</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right', borderBottom: '2px solid #dee2e6', color: '#495057', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 1 }}>金額</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#adb5bd' }}>
                      指定された期間の会計データはありません。
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx, idx) => {
                    let typeLabel = tx.payment_type
                    if (tx.payment_type === 'CASH') typeLabel = '現金'
                    else if (tx.payment_type === 'CARD') typeLabel = 'クレジットカード'
                    else if (tx.payment_type === 'OTHER') typeLabel = 'その他'

                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f3f5' }}>
                        <td style={{ padding: '12px 8px', color: '#212529' }}>{tx.business_date}</td>
                        <td style={{ padding: '12px 8px', color: '#212529' }}>{formatTokyoTime(tx.paid_at)}</td>
                        <td style={{ padding: '12px 8px', color: '#212529', fontFamily: 'monospace' }}>{tx.receipt_no}</td>
                        <td style={{ padding: '12px 8px', color: '#212529' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '0.85rem',
                            fontWeight: 'bold',
                            background: tx.payment_type === 'CASH' ? '#e3fafc' : tx.payment_type === 'CARD' ? '#edf2ff' : '#f3f0ff',
                            color: tx.payment_type === 'CASH' ? '#0b7285' : tx.payment_type === 'CARD' ? '#364fc7' : '#5f3dc4',
                          }}>
                            {typeLabel}
                          </span>
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold', color: '#212529' }}>{yen(tx.amount)}</td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
