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

  const summary = useMemo(() => {
    if (!transactions) return null
    let totalCount = transactions.length
    let totalAmount = 0
    let cashAmount = 0
    let cardAmount = 0
    let otherAmount = 0

    for (const tx of transactions) {
      totalAmount += tx.amount
      const isCash = tx.payment_type.toLowerCase().includes('cash') || tx.payment_type === 'CASH'
      const isCard = tx.payment_type.toLowerCase().includes('card') || tx.payment_type === 'CARD'
      if (isCash) {
        cashAmount += tx.amount
      } else if (isCard) {
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

  const getDwellTime = (orderedAt: string, paidAt: string) => {
    if (!orderedAt || !paidAt) return '-'
    const diffMs = new Date(paidAt).getTime() - new Date(orderedAt).getTime()
    if (diffMs < 0) return '-'
    const diffMins = Math.floor(diffMs / 1000 / 60)
    const hours = Math.floor(diffMins / 60)
    const mins = diffMins % 60
    if (hours > 0) {
      return `${hours}時間${mins}分`
    }
    return `${mins}分`
  }

  return (
    <div className="ops-grid">
      <section className="panel admin-list-panel admin-list-panel-wide">
        <div className="admin-list-head">
          <div>
            <h2>会計データ照会</h2>
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

        {summary && (
          <div className="admin-kpi-grid">
            <div className="admin-kpi-box">
              <div className="kpi-label">会計件数</div>
              <div className="kpi-value">{summary.totalCount} 件</div>
            </div>
            <div className="admin-kpi-box">
              <div className="kpi-label">合計金額</div>
              <div className="kpi-value">{yen(summary.totalAmount)}</div>
            </div>
            <div className="admin-kpi-box">
              <div className="kpi-label">現金合計</div>
              <div className="kpi-value">{yen(summary.cashAmount)}</div>
            </div>
            <div className="admin-kpi-box">
              <div className="kpi-label">カード合計</div>
              <div className="kpi-value">{yen(summary.cardAmount)}</div>
            </div>
            <div className="admin-kpi-box">
              <div className="kpi-label">その他合計</div>
              <div className="kpi-value">{yen(summary.otherAmount)}</div>
            </div>
          </div>
        )}

        {transactions && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>日付</th>
                  <th>会計時刻</th>
                  <th>レシート番号</th>
                  <th>会計種別</th>
                  <th>滞留時間</th>
                  <th style={{ textAlign: 'right' }}>金額</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-sub)' }}>
                      指定された期間の会計データはありません。
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx, idx) => {
                    const typeLabel = tx.payment_type_label || (
                      tx.payment_type === 'CASH' ? '現金' :
                      tx.payment_type === 'CARD' ? 'クレジットカード' :
                      tx.payment_type === 'OTHER' ? 'その他' : tx.payment_type
                    )
                    return (
                      <tr key={idx}>
                        <td>{tx.business_date}</td>
                        <td>{formatTokyoTime(tx.paid_at)}</td>
                        <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{tx.receipt_no}</td>
                        <td>
                          <span className="badge" style={{ padding: '4px 10px', borderRadius: '12px', background: 'var(--admin-surface-soft)', border: '1px solid var(--admin-line)', fontWeight: 'bold' }}>
                            {typeLabel}
                          </span>
                        </td>
                        <td>{getDwellTime(tx.ordered_at, tx.paid_at)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{yen(tx.amount)}</td>
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
