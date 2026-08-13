import React, { useState, useEffect } from 'react'
import { getStaffSalesReport, getStaffAccountingTransactions, fetchStaffTicketDetail } from '../../lib/staffReadApi'

type Props = {
  storeSlug: string
  disabled: boolean
  yen: (value: number) => string
  taxRate?: number
  reducedTaxRate?: number
  setError: (msg: string | null) => void
}

export function AdminReceiptReissueTab({ storeSlug, disabled, yen, taxRate, reducedTaxRate, setError }: Props) {
  const [targetDate, setTargetDate] = useState('')
  const [loadingList, setLoadingList] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [transactions, setTransactions] = useState<any[]>([])
  const [manualReceiptNo, setManualReceiptNo] = useState('')
  const [selectedReceiptNo, setSelectedReceiptNo] = useState('')
  const [ticketDetail, setTicketDetail] = useState<any | null>(null)

  useEffect(() => {
    const initDate = async () => {
      if (!storeSlug) return
      try {
        const res = await getStaffSalesReport(storeSlug)
        const date = res.report?.business_date || ''
        if (date) {
          setTargetDate((prev) => prev || date)
        }
      } catch (err) {
        // ignore
      }
    }
    initDate()
  }, [storeSlug])

  const handleSearch = async () => {
    if (!storeSlug || !targetDate) {
      setError('日付を指定してください')
      return
    }
    setLoadingList(true)
    setError(null)
    setTicketDetail(null)
    setSelectedReceiptNo('')
    try {
      const res = await getStaffAccountingTransactions(storeSlug, targetDate, targetDate)
      setTransactions(res.transactions || [])
    } catch (err: any) {
      setError(err.message || String(err))
    } finally {
      setLoadingList(false)
    }
  }

  const handleLoadReceipt = async (receiptNo: string) => {
    if (!storeSlug || !receiptNo) return
    setLoadingDetail(true)
    setError(null)
    setSelectedReceiptNo(receiptNo)
    try {
      const res = await fetchStaffTicketDetail(storeSlug, null, null, receiptNo)
      setTicketDetail(res.ticket)
    } catch (err: any) {
      setError(err.message || String(err))
      setTicketDetail(null)
    } finally {
      setLoadingDetail(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const orderSubtotal = ticketDetail
    ? ticketDetail.lines.reduce((sum: number, line: any) => sum + line.line_subtotal, 0)
    : 0

  return (
    <div className="ops-grid">
      <section className="panel admin-list-panel admin-list-panel-wide">
        <div className="admin-list-head no-print">
          <div>
            <h2>レシート再発行</h2>
          </div>
        </div>

        <div className="receipt-reissue-grid">
          <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', minHeight: 0 }}>
            <div className="admin-card" style={{ padding: '16px 20px', marginBottom: 0, flexShrink: 0 }}>
              <div className="admin-search-compact" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'end' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-sub)' }}>日付から検索</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="date"
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                      style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--admin-line)', borderRadius: '12px', fontSize: '0.9rem' }}
                    />
                    <button
                      className="primary-button"
                      type="button"
                      disabled={disabled || loadingList || !targetDate}
                      onClick={handleSearch}
                      style={{ padding: '0 16px', minWidth: '72px' }}
                    >
                      {loadingList ? '検索中...' : '検索'}
                    </button>
                  </div>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    if (manualReceiptNo.trim()) handleLoadReceipt(manualReceiptNo.trim())
                  }}
                  style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}
                >
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-sub)' }}>レシート番号で直接検索</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="例: 0001-12345"
                      value={manualReceiptNo}
                      onChange={(e) => setManualReceiptNo(e.target.value)}
                      style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--admin-line)', borderRadius: '12px', fontSize: '0.9rem' }}
                    />
                    <button
                      type="submit"
                      className="secondary-button"
                      disabled={disabled || loadingDetail || !manualReceiptNo.trim()}
                      style={{ padding: '0 16px', minWidth: '84px', whiteSpace: 'nowrap' }}
                    >
                      詳細取得
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className="admin-card" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', padding: '16px 20px', marginBottom: 0 }}>
              <h4 className="admin-card-title" style={{ marginBottom: '12px', flexShrink: 0 }}>
                {targetDate ? `${targetDate} のお会計一覧` : 'お会計一覧'}
              </h4>
              <div className="admin-table-wrap" style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>時刻</th>
                      <th>レシート番号</th>
                      <th>決済</th>
                      <th style={{ textAlign: 'right' }}>金額</th>
                      <th style={{ textAlign: 'center' }}>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-sub)' }}>
                          {loadingList ? '検索中...' : '日付を指定して検索するか、レシート番号を入力してください。'}
                        </td>
                      </tr>
                    ) : (
                      transactions.map((tx, idx) => (
                        <tr key={idx} style={{ background: selectedReceiptNo === tx.receipt_no ? 'var(--admin-surface-hover)' : 'transparent' }}>
                          <td>{tx.paid_at.split('T')[1]?.substring(0, 5) || tx.paid_at}</td>
                          <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{tx.receipt_no}</td>
                          <td>{tx.payment_type_label || tx.payment_type}</td>
                          <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{yen(tx.amount)}</td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              className="secondary-button"
                              onClick={() => handleLoadReceipt(tx.receipt_no)}
                            >
                              選択
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'stretch' }}>
            {loadingDetail && (
              <div className="admin-card" style={{ textAlign: 'center', color: 'var(--text-sub)' }}>
                データ取得中...
              </div>
            )}

            {!loadingDetail && !ticketDetail && (
              <div className="admin-card" style={{ textAlign: 'center', color: 'var(--text-sub)', borderStyle: 'dashed' }}>
                表示するレシートがありません。<br />レシートを選択するか、レシート番号を入力してください。
              </div>
            )}

            {!loadingDetail && ticketDetail && (
              <>
                <button
                  className="primary-button"
                  style={{ padding: '14px', fontSize: '1.05rem', fontWeight: 'bold' }}
                  onClick={handlePrint}
                >
                  🖨️ このレシートを再印刷
                </button>
                
                <div 
                  className="receipt-paper" 
                  style={{ 
                    background: 'white', 
                    boxShadow: '0 4px 15px rgba(0,0,0,0.08)', 
                    borderRadius: '14px', 
                    border: '1px solid var(--admin-line)',
                    color: '#333',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <div style={{ padding: '24px 20px 0' }}>
                    <div style={{
                      textAlign: 'center',
                      color: 'var(--admin-accent)',
                      fontWeight: 'bold',
                      fontSize: '1rem',
                      marginBottom: '16px',
                      border: '2px solid var(--admin-accent)',
                      padding: '4px',
                      borderRadius: '4px',
                    }}>
                      再発行領収書
                    </div>
                    <h3 className="receipt-brand" style={{ textAlign: 'center', margin: '0 0 8px' }}>店舗デモ</h3>
                    <p className="receipt-meta" style={{ textAlign: 'center', color: '#666', margin: '0 0 4px' }}>レシート番号: {ticketDetail.receipt_no}</p>
                    <p className="receipt-meta" style={{ textAlign: 'center', color: '#666', margin: '0 0 16px' }}>会計日時: {new Date(ticketDetail.payment_entries[0]?.paid_at || ticketDetail.ordered_at).toLocaleString('ja-JP')}</p>
                    <div className="receipt-divider" style={{ borderTop: '1px dashed #ccc', margin: '12px 0' }}></div>
                    <p style={{ margin: '4px 0', fontSize: '1rem' }}>卓番: {ticketDetail.table?.label || '-'}</p>
                    <p style={{ margin: '4px 0', fontSize: '1rem' }}>伝票番号: {ticketDetail.ticket_no}</p>
                    <div className="receipt-divider" style={{ borderTop: '1px dashed #ccc', margin: '12px 0' }}></div>
                  </div>

                  <div style={{ flex: 1, padding: '0 20px' }}>
                    {ticketDetail.lines.map((line: any, idx: number) => {
                      const isReduced = line.tax_rate_type === 'REDUCED'
                      return (
                        <div key={idx} className="receipt-item-row" style={{ display: 'grid', gridTemplateColumns: '1fr auto 80px', gap: '8px', marginBottom: '8px' }}>
                          <span className="receipt-item-name">{line.item_name_snapshot}{isReduced ? ' ※' : ''}</span>
                          <span className="receipt-item-qty">x{line.quantity}</span>
                          <span className="receipt-item-price" style={{ textAlign: 'right' }}>{yen(line.line_subtotal)}</span>
                        </div>
                      )
                    })}
                  </div>

                  <div style={{ padding: '0 20px 24px', borderTop: '2px dashed #aaa', marginTop: '16px', background: '#fafafa', borderRadius: '0 0 14px 14px' }}>
                    <div className="receipt-grand-total" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.3rem', fontWeight: 'bold', margin: '16px 0 8px' }}>
                      <span>ご請求額</span>
                      <span className="total-amount">{yen(orderSubtotal)}</span>
                    </div>

                    {(() => {
                      let total10 = 0
                      let total8 = 0
                      let totalNone = 0
                      for (const line of ticketDetail.lines) {
                        const rateType = line.tax_rate_type || 'STANDARD'
                        if (rateType === 'REDUCED') total8 += line.line_subtotal
                        else if (rateType === 'NONE') totalNone += line.line_subtotal
                        else total10 += line.line_subtotal
                      }
                      const stdRate = taxRate ?? 10
                      const redRate = reducedTaxRate ?? 8
                      const tax10 = Math.round(total10 * stdRate / (100 + stdRate))
                      const tax8 = Math.round(total8 * redRate / (100 + redRate))

                      return (
                        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #ccc', fontSize: '0.85rem', color: '#555' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>{stdRate}%対象金額</span>
                            <span>{yen(total10)}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '8px', color: '#777' }}>
                            <span>(内消費税額)</span>
                            <span>{yen(tax10)}</span>
                          </div>
                          {total8 > 0 && (
                            <>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                                <span>{redRate}%対象金額(※)</span>
                                <span>{yen(total8)}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '8px', color: '#777' }}>
                                <span>(内消費税額)</span>
                                <span>{yen(tax8)}</span>
                              </div>
                            </>
                          )}
                        </div>
                      )
                    })()}

                    <div className="receipt-divider" style={{ borderTop: '1px dashed #ccc', margin: '12px 0' }}></div>
                    
                    {ticketDetail.payment_entries.map((entry: any, idx: number) => (
                      <div key={idx} style={{ marginBottom: '8px', fontSize: '0.95rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>お預かり ({entry.payment_type_label || entry.payment_type})</span>
                          <span>{yen(entry.received_amount || entry.final_amount)}</span>
                        </div>
                        {entry.change_amount > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666', fontSize: '0.85rem', paddingLeft: '12px', marginTop: '2px' }}>
                            <span>お釣り</span>
                            <span>{yen(entry.change_amount)}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
