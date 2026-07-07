import React, { useState, useEffect } from 'react'
import { getStaffSalesReport, getStaffAccountingTransactions, fetchStaffTicketDetail } from '../../lib/staffReadApi'

type Props = {
  storeSlug: string
  disabled: boolean
  yen: (value: number) => string
  setError: (msg: string | null) => void
}

export function AdminReceiptReissueTab({ storeSlug, disabled, yen, setError }: Props) {
  const [targetDate, setTargetDate] = useState('')
  const [loadingList, setLoadingList] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [transactions, setTransactions] = useState<any[]>([])
  const [manualReceiptNo, setManualReceiptNo] = useState('')
  const [selectedReceiptNo, setSelectedReceiptNo] = useState('')
  const [ticketDetail, setTicketDetail] = useState<any | null>(null)

  // Initialize date with current business date
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

  // Calculate order lines subtotal
  const orderSubtotal = ticketDetail
    ? ticketDetail.lines.reduce((sum: number, line: any) => sum + line.line_subtotal, 0)
    : 0

  return (
    <div className="admin-tab-content" style={{ maxHeight: '100%', height: '100%', overflowY: 'auto', paddingRight: '12px', paddingBottom: '32px' }}>
      <div className="admin-tab-head no-print">
        <div>
          <h2>レシート再発行</h2>
          <p className="caption">日付指定、またはレシート番号の直接入力で過去の会計レシートを再発行・印刷します。</p>
        </div>
      </div>

      <div className="receipt-reissue-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) 400px', gap: '24px', alignItems: 'start' }}>
        {/* Left Side Panel */}
        <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Query Block */}
          <div style={{ padding: '24px', background: 'white', borderRadius: '12px', border: '1px solid #dee2e6' }}>
            <h4 style={{ marginTop: 0, marginBottom: '16px', fontSize: '1.1rem' }}>日付から検索</h4>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                style={{ padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '8px', fontSize: '1rem' }}
              />
              <button
                className="primary-button"
                style={{ background: '#228be6', padding: '10px 20px' }}
                disabled={disabled || loadingList || !targetDate}
                onClick={handleSearch}
              >
                {loadingList ? '検索中...' : 'レシートをロード'}
              </button>
            </div>
            
            <div style={{ margin: '16px 0', borderTop: '1px solid #eee' }} />

            <h4 style={{ marginBottom: '12px', fontSize: '1.1rem' }}>レシート番号で直接検索</h4>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (manualReceiptNo.trim()) handleLoadReceipt(manualReceiptNo.trim())
              }}
              style={{ display: 'flex', gap: '12px' }}
            >
              <input
                type="text"
                placeholder="例: 0001-12345"
                value={manualReceiptNo}
                onChange={(e) => setManualReceiptNo(e.target.value)}
                style={{ flex: 1, padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '8px', fontSize: '1rem' }}
              />
              <button
                type="submit"
                className="secondary-button"
                style={{ padding: '8px 16px' }}
                disabled={disabled || loadingDetail || !manualReceiptNo.trim()}
              >
                詳細取得
              </button>
            </form>
          </div>

          {/* List of Receipts */}
          {transactions.length > 0 && (
            <div style={{ padding: '20px', background: 'white', borderRadius: '12px', border: '1px solid #dee2e6' }}>
              <h4 style={{ marginTop: 0, marginBottom: '16px' }}>{targetDate} のお会計一覧</h4>
              <div style={{ maxHeight: '350px', overflowY: 'auto', border: '1px solid #dee2e6', borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ background: '#f8f9fa' }}>
                      <th style={{ padding: '10px 8px', textAlign: 'left', borderBottom: '2px solid #dee2e6', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 1 }}>時刻</th>
                      <th style={{ padding: '10px 8px', textAlign: 'left', borderBottom: '2px solid #dee2e6', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 1 }}>レシート番号</th>
                      <th style={{ padding: '10px 8px', textAlign: 'left', borderBottom: '2px solid #dee2e6', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 1 }}>決済</th>
                      <th style={{ padding: '10px 8px', textAlign: 'right', borderBottom: '2px solid #dee2e6', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 1 }}>金額</th>
                      <th style={{ padding: '10px 8px', textAlign: 'center', borderBottom: '2px solid #dee2e6', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 1 }}>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #eee', background: selectedReceiptNo === tx.receipt_no ? '#e8f7ff' : 'transparent' }}>
                        <td style={{ padding: '10px 8px' }}>{tx.paid_at.split('T')[1]?.substring(0, 5) || tx.paid_at}</td>
                        <td style={{ padding: '10px 8px', fontFamily: 'monospace', fontWeight: 'bold' }}>{tx.receipt_no}</td>
                        <td style={{ padding: '10px 8px' }}>{tx.payment_type_label || tx.payment_type}</td>
                        <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 'bold' }}>{yen(tx.amount)}</td>
                        <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                          <button
                            className="secondary-button"
                            style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                            onClick={() => handleLoadReceipt(tx.receipt_no)}
                          >
                            選択
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right Side Panel: Receipt Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'stretch' }}>
          {loadingDetail && (
            <div style={{ textAlign: 'center', padding: '48px', background: 'white', borderRadius: '12px', border: '1px solid #dee2e6', color: '#868e96' }}>
              データ取得中...
            </div>
          )}

          {!loadingDetail && !ticketDetail && (
            <div style={{ textAlign: 'center', padding: '48px', background: '#f8f9fa', borderRadius: '12px', border: '1px dashed #ced4da', color: '#868e96' }}>
              表示するレシートがありません。<br />レシートを選択するか、レシート番号を入力してください。
            </div>
          )}

          {!loadingDetail && ticketDetail && (
            <>
              <button
                className="primary-button"
                style={{ background: '#40c057', padding: '12px', fontSize: '1.1rem', fontWeight: 'bold' }}
                onClick={handlePrint}
              >
                🖨️ このレシートを再印刷
              </button>
              
              <div 
                className="receipt-paper" 
                style={{ 
                  background: 'white', 
                  boxShadow: '0 4px 15px rgba(0,0,0,0.08)', 
                  borderRadius: '8px', 
                  border: '1px solid #dee2e6',
                  color: '#333',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {/* Header */}
                <div style={{ padding: '24px 20px 0' }}>
                  <div style={{
                    textAlign: 'center',
                    color: '#ff922b',
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    marginBottom: '16px',
                    border: '2px solid #ff922b',
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

                {/* Items */}
                <div style={{ flex: 1, padding: '0 20px' }}>
                  {ticketDetail.lines.map((line: any, idx: number) => (
                    <div key={idx} className="receipt-item-row" style={{ display: 'grid', gridTemplateColumns: '1fr auto 80px', gap: '8px', marginBottom: '8px' }}>
                      <span className="receipt-item-name">{line.item_name_snapshot}</span>
                      <span className="receipt-item-qty">x{line.quantity}</span>
                      <span className="receipt-item-price" style={{ textAlign: 'right' }}>{yen(line.line_subtotal)}</span>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div style={{ padding: '0 20px 24px', borderTop: '2px dashed #aaa', marginTop: '16px', background: '#fafafa', borderRadius: '0 0 8px 8px' }}>
                  <div className="receipt-grand-total" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.3rem', fontWeight: 'bold', margin: '16px 0 8px' }}>
                    <span>ご請求額</span>
                    <span className="total-amount">{yen(orderSubtotal)}</span>
                  </div>

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
    </div>
  )
}
