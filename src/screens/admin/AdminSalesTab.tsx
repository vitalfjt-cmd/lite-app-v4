import React, { useState, useEffect } from 'react'
import { openStaffBusinessDay, closeStaffBusinessDay, getStaffSalesReport, voidStaffTicket, fetchStaffTicketDetail } from '../../lib/staffReadApi'

type Props = {
  storeSlug: string
  disabled: boolean
  yen: (value: number) => string
  setAdminMessage: (msg: string | null) => void
  setError: (msg: string | null) => void
}

export function AdminSalesTab({ storeSlug, disabled, yen, setAdminMessage, setError }: Props) {
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [businessDateStr, setBusinessDateStr] = useState<string>('')
  const [activeSubTab, setActiveSubTab] = useState<'status' | 'void' | 'summary' | 'hourly' | 'items'>('status')
  
  const [voidReceiptNo, setVoidReceiptNo] = useState('')
  const [voidPaymentType, setVoidPaymentType] = useState<string>('')
  const [loadedTicket, setLoadedTicket] = useState<any>(null)
  const [receiptPaymentChanges, setReceiptPaymentChanges] = useState<any[]>([])

  const fetchReport = async (date?: string) => {
    if (!storeSlug) return
    setLoading(true)
    try {
      const res = await getStaffSalesReport(storeSlug, date)
      setReport(res.report)
      setBusinessDateStr(res.report?.business_date || '')
    } catch (err: any) {
      setError(err.message || String(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
  }, [storeSlug])

  const handleOpen = async () => {
    if (!window.confirm('新しい営業日を開店しますか？')) return
    setLoading(true)
    try {
      await openStaffBusinessDay(storeSlug)
      setAdminMessage('開店しました')
      await fetchReport()
    } catch (err: any) {
      setError(err.message || String(err))
      setLoading(false)
    }
  }

  const handleClose = async () => {
    if (!window.confirm('現在の営業日を締め（閉店）ますか？')) return
    setLoading(true)
    try {
      await closeStaffBusinessDay(storeSlug)
      setAdminMessage('閉店処理が完了しました')
      await fetchReport()
    } catch (err: any) {
      const msg = err.message || String(err)
      if (msg === 'open_tickets_exist') {
        setError('未会計の伝票が残っています')
      } else {
        setError(msg)
      }
      setLoading(false)
    }
  }

  const handleSearchReceipt = async () => {
    if (!voidReceiptNo) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetchStaffTicketDetail(storeSlug, null, null, voidReceiptNo)
      if (res.ticket) {
        setLoadedTicket(res.ticket)
        const initialChanges = (res.ticket.payment_entries || []).map((entry: any) => ({
          id: entry.id,
          paymentType: entry.payment_type,
          amount: entry.final_amount,
          isNew: false,
          isDeleted: false,
        }))
        setReceiptPaymentChanges(initialChanges)
      } else {
        setError('該当する伝票が見つかりませんでした')
        setLoadedTicket(null)
      }
    } catch (err: any) {
      setError(err.message || String(err))
      setLoadedTicket(null)
    } finally {
      setLoading(false)
    }
  }

  const handleAddPayment = () => {
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    setReceiptPaymentChanges((prev: any) => [
      ...prev,
      {
        id: tempId,
        paymentType: 'CASH',
        amount: 0,
        isNew: true,
        isDeleted: false,
      }
    ])
  }

  const hasPaymentChanges = () => {
    if (!loadedTicket || !loadedTicket.payment_entries) return false
    
    // Check if there are any new items that are not deleted
    const hasNew = receiptPaymentChanges.some((change: any) => change.isNew && !change.isDeleted)
    if (hasNew) return true

    // Check if any existing items are marked as deleted
    const hasDeleted = receiptPaymentChanges.some((change: any) => change.isDeleted)
    if (hasDeleted) return true

    // Check if any existing items are modified (amount or type)
    const hasModified = receiptPaymentChanges.some((change: any) => {
      if (change.isNew || change.isDeleted) return false
      const orig = loadedTicket.payment_entries.find((pe: any) => pe.id === change.id)
      if (!orig) return false
      return orig.payment_type !== change.paymentType || orig.final_amount !== Number(change.amount)
    })
    return hasModified
  }

  const handleSavePaymentChanges = async () => {
    if (!voidReceiptNo || !loadedTicket) return
    
    const changedItems: any[] = []

    receiptPaymentChanges.forEach((change: any) => {
      if (change.isNew) {
        if (!change.isDeleted) {
          changedItems.push({
            id: change.id,
            paymentType: change.paymentType,
            amount: Number(change.amount),
            action: 'ADD',
          })
        }
      } else if (change.isDeleted) {
        changedItems.push({
          id: change.id,
          action: 'DELETE',
        })
      } else {
        const orig = loadedTicket.payment_entries.find((pe: any) => pe.id === change.id)
        if (orig && (orig.payment_type !== change.paymentType || orig.final_amount !== Number(change.amount))) {
          changedItems.push({
            id: change.id,
            paymentType: change.paymentType,
            amount: Number(change.amount),
            action: 'UPDATE',
          })
        }
      }
    })

    if (changedItems.length === 0) return

    if (!window.confirm(`レシート番号 ${voidReceiptNo} の決済明細を変更しますか？`)) return
    setLoading(true)
    try {
      await voidStaffTicket(storeSlug, voidReceiptNo, null, changedItems)
      setAdminMessage('決済明細の変更が完了しました')
      setVoidReceiptNo('')
      setLoadedTicket(null)
      await fetchReport()
    } catch (err: any) {
      setError(err.message || String(err))
      setLoading(false)
    }
  }

  const handleVoidExecuteOnly = async () => {
    if (!voidReceiptNo) return
    if (!window.confirm(`レシート番号 ${voidReceiptNo} の伝票をVOID（取消）しますか？`)) return
    setLoading(true)
    try {
      await voidStaffTicket(storeSlug, voidReceiptNo, null, null)
      setAdminMessage('VOID処理が完了しました')
      setVoidReceiptNo('')
      setLoadedTicket(null)
      await fetchReport()
    } catch (err: any) {
      setError(err.message || String(err))
      setLoading(false)
    }
  }

  if (loading && !report) {
    return <div className="admin-tab-content">読み込み中...</div>
  }

  return (
    <div className="admin-tab-content" style={{ maxHeight: '100%', height: '100%', overflowY: 'auto', paddingRight: '12px', paddingBottom: '32px' }}>
      <div className="admin-tab-head">
        <div>
          <h2>売上管理・レジ締め</h2>
          <p className="caption">現在の営業日の売上状況や、開店・閉店の操作を行います。</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid #dee2e6', paddingBottom: '12px', flexWrap: 'wrap' }}>
        {[
          { id: 'status', label: '営業状況' },
          { id: 'void', label: 'VOID・会計変更' },
          { id: 'summary', label: '売上サマリー' },
          { id: 'hourly', label: '時間帯別売上' },
          { id: 'items', label: '商品別注文数' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveSubTab(t.id as any)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #dee2e6',
              background: activeSubTab === t.id ? '#228be6' : 'white',
              color: activeSubTab === t.id ? 'white' : '#495057',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeSubTab === 'status' && (
        <div style={{ padding: '24px', background: 'white', borderRadius: '12px', border: '1px solid #dee2e6', marginBottom: '24px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '1.2rem', color: '#343a40' }}>営業状況</h3>
          
          {report ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <div>
                <span style={{ fontSize: '0.9rem', color: '#868e96', display: 'block', marginBottom: '4px' }}>現在の営業日</span>
                <strong style={{ fontSize: '1.5rem', color: '#212529' }}>{report.business_date || '未設定'}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.9rem', color: '#868e96', display: 'block', marginBottom: '4px' }}>ステータス</span>
                <span style={{ 
                  display: 'inline-block', 
                  padding: '4px 12px', 
                  borderRadius: '100px', 
                  background: report.is_open ? '#ebfbee' : '#f8f9fa', 
                  color: report.is_open ? '#2b8a3e' : '#495057',
                  fontWeight: 'bold'
                }}>
                  {report.is_open ? '営業中' : '閉店'}
                </span>
              </div>
              <div style={{ flex: 1 }} />
              <div>
                {report.is_open ? (
                  <button className="primary-button" style={{ background: '#fa5252' }} disabled={disabled || loading} onClick={handleClose}>
                    締め処理（閉店）を行う
                  </button>
                ) : (
                  <button className="primary-button" style={{ background: '#51cf66' }} disabled={disabled || loading} onClick={handleOpen}>
                    新しい営業日を開店する
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div style={{ color: '#868e96' }}>レポートがありません。開店してください。</div>
          )}
        </div>
      )}

      {activeSubTab === 'void' && (
        <div style={{ padding: '24px', background: 'white', borderRadius: '12px', border: '1px solid #dee2e6', marginBottom: '24px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '1.2rem', color: '#343a40' }}>VOID・会計変更</h3>
          <p style={{ color: '#868e96', fontSize: '0.9rem', marginBottom: '16px' }}>
            レシート番号を入力して検索し、会計の取消（VOID）または決済明細ごとの会計種別の変更を行います。
          </p>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '20px' }}>
            <input 
              type="text" 
              placeholder="レシート番号" 
              value={voidReceiptNo} 
              onChange={e => {
                setVoidReceiptNo(e.target.value)
                setLoadedTicket(null)
              }}
              style={{ padding: '12px', border: '1px solid #ced4da', borderRadius: '8px', fontSize: '1rem', width: '200px' }}
            />
            <button 
              className="primary-button" 
              style={{ background: '#228be6' }} 
              disabled={disabled || loading || !voidReceiptNo} 
              onClick={handleSearchReceipt}
            >
              検索する
            </button>
          </div>

          {loadedTicket && (
            <div style={{ marginTop: '24px', padding: '20px', background: '#f8f9fa', borderRadius: '12px', border: '1px solid #e9ecef' }}>
              <h4 style={{ marginTop: 0, marginBottom: '16px', fontSize: '1.1rem', color: '#495057' }}>
                レシート情報: {loadedTicket.receipt_no || voidReceiptNo}
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <span style={{ fontSize: '0.85rem', color: '#868e96', display: 'block' }}>伝票番号</span>
                  <strong style={{ color: '#212529' }}>{loadedTicket.ticket_no}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.85rem', color: '#868e96', display: 'block' }}>テーブル</span>
                  <strong style={{ color: '#212529' }}>{loadedTicket.table?.label}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.85rem', color: '#868e96', display: 'block' }}>合計金額</span>
                  <strong style={{ color: '#212529' }}>{yen(loadedTicket.reference_subtotal)}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.85rem', color: '#868e96', display: 'block' }}>状態</span>
                  <span style={{ 
                    display: 'inline-block', 
                    padding: '2px 8px', 
                    borderRadius: '4px', 
                    fontSize: '0.85rem', 
                    fontWeight: 'bold',
                    background: loadedTicket.status === 'CLOSED' ? '#ebfbee' : loadedTicket.status === 'VOIDED' ? '#fff5f5' : '#fff9db',
                    color: loadedTicket.status === 'CLOSED' ? '#2b8a3e' : loadedTicket.status === 'VOIDED' ? '#c92a2a' : '#f59f00'
                  }}>
                    {loadedTicket.status === 'CLOSED' ? '会計済' : loadedTicket.status === 'VOIDED' ? 'VOID（取消済）' : loadedTicket.status}
                  </span>
                </div>
              </div>

              {loadedTicket.status !== 'VOIDED' && (
                <>
                  <h5 style={{ margin: '16px 0 8px 0', fontSize: '1rem', color: '#495057' }}>決済明細（複数可）</h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                    {(receiptPaymentChanges || []).map((change: any, index: number) => {
                      const origEntry = loadedTicket.payment_entries?.find((pe: any) => pe.id === change.id)
                      const isVoided = origEntry?.entry_status === 'VOIDED' || origEntry?.entry_status === 'VOID'
                      const isDeleted = change.isDeleted

                      return (
                        <div 
                          key={change.id} 
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '16px', 
                            background: 'white', 
                            padding: '12px 16px', 
                            borderRadius: '8px', 
                            border: '1px solid #dee2e6',
                            opacity: isDeleted ? 0.5 : 1,
                            textDecoration: isDeleted ? 'line-through' : 'none'
                          }}
                        >
                          <span style={{ fontWeight: 'bold', color: '#495057', minWidth: '60px' }}>決済 #{index + 1}</span>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input 
                              type="number"
                              value={change.amount}
                              disabled={disabled || loading || isVoided || isDeleted}
                              onChange={e => {
                                const val = e.target.value
                                setReceiptPaymentChanges((prev: any) => prev.map((item: any) => 
                                  item.id === change.id ? { ...item, amount: val === '' ? '' : (parseInt(val, 10) || 0) } : item
                                ))
                              }}
                              style={{ 
                                padding: '8px', 
                                border: '1px solid #ced4da', 
                                borderRadius: '6px', 
                                fontSize: '0.95rem', 
                                width: '100px',
                                textAlign: 'right'
                              }}
                            />
                            <span style={{ fontSize: '0.9rem', color: '#495057' }}>円</span>
                          </div>

                          <select 
                            value={change.paymentType} 
                            disabled={disabled || loading || isVoided || isDeleted}
                            onChange={e => {
                              const val = e.target.value
                              setReceiptPaymentChanges((prev: any) => prev.map((item: any) => 
                                item.id === change.id ? { ...item, paymentType: val } : item
                              ))
                            }}
                            style={{ padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '6px', fontSize: '0.95rem', width: '150px' }}
                          >
                            <option value="CASH">現金</option>
                            <option value="CARD">クレジットカード</option>
                            <option value="OTHER">その他</option>
                          </select>

                          {isVoided && <span style={{ color: '#fa5252', fontSize: '0.85rem' }}>（取消済）</span>}
                          
                          {!isVoided && (
                            isDeleted ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setReceiptPaymentChanges((prev: any) => prev.map((item: any) =>
                                    item.id === change.id ? { ...item, isDeleted: false } : item
                                  ))
                                }}
                                style={{
                                  padding: '6px 12px',
                                  background: '#e9ecef',
                                  border: '1px solid #ced4da',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '0.85rem',
                                  color: '#495057'
                                }}
                              >
                                元に戻す
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  if (change.isNew) {
                                    setReceiptPaymentChanges((prev: any) => prev.filter((item: any) => item.id !== change.id))
                                  } else {
                                    setReceiptPaymentChanges((prev: any) => prev.map((item: any) =>
                                      item.id === change.id ? { ...item, isDeleted: true } : item
                                    ))
                                  }
                                }}
                                style={{
                                  padding: '6px 12px',
                                  background: '#fff5f5',
                                  border: '1px solid #ffc9c9',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '0.85rem',
                                  color: '#fa5252'
                                }}
                              >
                                削除
                              </button>
                            )
                          )}
                        </div>
                      )
                    })}
                  </div>

                  <div style={{ marginBottom: '24px' }}>
                    <button
                      type="button"
                      disabled={disabled || loading}
                      onClick={handleAddPayment}
                      style={{
                        padding: '8px 16px',
                        background: 'white',
                        border: '1px solid #228be6',
                        color: '#228be6',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <span>＋</span> 明細を追加
                    </button>
                  </div>

                  {(() => {
                    const activeTotal = (receiptPaymentChanges || [])
                      .filter((change: any) => !change.isDeleted)
                      .reduce((sum: number, change: any) => sum + Number(change.amount || 0), 0)
                    const isTotalMismatch = activeTotal !== loadedTicket.reference_subtotal

                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
                        <div>
                          <span style={{ fontSize: '0.9rem', color: '#868e96' }}>現在の決済合計: </span>
                          <strong style={{ fontSize: '1.2rem', color: '#212529' }}>{yen(activeTotal)}</strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.9rem', color: '#868e96' }}>伝票合計: </span>
                          <strong style={{ fontSize: '1.2rem', color: '#212529' }}>{yen(loadedTicket.reference_subtotal)}</strong>
                        </div>
                        {isTotalMismatch && (
                          <span style={{
                            display: 'inline-block',
                            padding: '4px 12px',
                            borderRadius: '4px',
                            fontSize: '0.85rem',
                            fontWeight: 'bold',
                            background: '#fff9db',
                            color: '#f59f00',
                            border: '1px solid #ffe3e3'
                          }}>
                            ⚠️ 決済合計が伝票合計と異なります
                          </span>
                        )}
                      </div>
                    )
                  })()}

                  <div style={{ display: 'flex', gap: '16px' }}>
                    <button 
                      className="primary-button" 
                      style={{ background: '#4dabf7' }} 
                      disabled={disabled || loading || !hasPaymentChanges()} 
                      onClick={handleSavePaymentChanges}
                    >
                      決済明細を変更
                    </button>
                    <button 
                      className="primary-button" 
                      style={{ background: '#fa5252' }} 
                      disabled={disabled || loading} 
                      onClick={handleVoidExecuteOnly}
                    >
                      VOID取消を実行
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'summary' && (
        report ? (
          <div style={{ padding: '24px', background: 'white', borderRadius: '12px', border: '1px solid #dee2e6', marginBottom: '24px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '1.2rem', color: '#343a40' }}>売上サマリー</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.9rem', color: '#868e96', marginBottom: '4px' }}>総売上</div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#212529' }}>{yen(report.total_sales || 0)}</div>
              </div>
              <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.9rem', color: '#868e96', marginBottom: '4px' }}>値引・割引額</div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fa5252' }}>{yen(report.total_discount || 0)}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.9rem', color: '#868e96', marginBottom: '4px' }}>組数（会計件数）</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#212529' }}>{report.total_groups || 0} 組</div>
              </div>
              <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.9rem', color: '#868e96', marginBottom: '4px' }}>客数</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#212529' }}>{report.total_customers || 0} 名</div>
              </div>
            </div>

            <h4 style={{ marginTop: 0, marginBottom: '12px', fontSize: '1rem', color: '#495057' }}>決済手段別</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '8px 0', borderBottom: '1px solid #f1f3f5', color: '#495057' }}>現金</td>
                  <td style={{ padding: '8px 0', borderBottom: '1px solid #f1f3f5', textAlign: 'right', fontWeight: 'bold' }}>{yen(report.cash_sales || 0)}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 0', borderBottom: '1px solid #f1f3f5', color: '#495057' }}>クレジットカード</td>
                  <td style={{ padding: '8px 0', borderBottom: '1px solid #f1f3f5', textAlign: 'right', fontWeight: 'bold' }}>{yen(report.card_sales || 0)}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 0', borderBottom: '1px solid #f1f3f5', color: '#495057' }}>その他 (QR等)</td>
                  <td style={{ padding: '8px 0', borderBottom: '1px solid #f1f3f5', textAlign: 'right', fontWeight: 'bold' }}>{yen(report.other_sales || 0)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '24px', background: 'white', borderRadius: '12px', border: '1px solid #dee2e6', marginBottom: '24px', color: '#868e96' }}>
            レポートがありません。開店してください。
          </div>
        )
      )}

      {activeSubTab === 'hourly' && (
        report ? (
          <div style={{ padding: '24px', background: 'white', borderRadius: '12px', border: '1px solid #dee2e6', marginBottom: '24px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '1.2rem', color: '#343a40' }}>時間帯別売上</h3>
            <div style={{ overflowY: 'auto', maxHeight: 'min(500px, 50vh)', border: '1px solid #dee2e6', borderRadius: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa' }}>
                    <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #f1f3f5', color: '#868e96', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 1 }}>時間</th>
                    <th style={{ padding: '8px', textAlign: 'right', borderBottom: '2px solid #f1f3f5', color: '#868e96', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 1 }}>売上</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(report.sales_by_hour || {}).length === 0 && (
                    <tr>
                      <td colSpan={2} style={{ padding: '16px', textAlign: 'center', color: '#adb5bd' }}>データなし</td>
                    </tr>
                  )}
                  {Object.entries(report.sales_by_hour || {}).map(([hour, amount]: [string, any]) => (
                    <tr key={hour}>
                      <td style={{ padding: '8px', borderBottom: '1px solid #f1f3f5', color: '#495057' }}>{hour}:00</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #f1f3f5', textAlign: 'right', fontWeight: 'bold' }}>{yen(amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div style={{ padding: '24px', background: 'white', borderRadius: '12px', border: '1px solid #dee2e6', marginBottom: '24px', color: '#868e96' }}>
            レポートがありません。開店してください。
          </div>
        )
      )}

      {activeSubTab === 'items' && (
        report ? (
          <div style={{ padding: '24px', background: 'white', borderRadius: '12px', border: '1px solid #dee2e6', marginBottom: '24px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '1.2rem', color: '#343a40' }}>商品別注文数</h3>
            <div style={{ overflowY: 'auto', maxHeight: 'min(500px, 50vh)', border: '1px solid #dee2e6', borderRadius: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa' }}>
                    <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #f1f3f5', color: '#868e96', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 1 }}>商品名</th>
                    <th style={{ padding: '8px', textAlign: 'right', borderBottom: '2px solid #f1f3f5', color: '#868e96', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 1 }}>数量</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(report.item_sales || {}).length === 0 && (
                    <tr>
                      <td colSpan={2} style={{ padding: '16px', textAlign: 'center', color: '#adb5bd' }}>データなし</td>
                    </tr>
                  )}
                  {Object.entries(report.item_sales || {})
                    .sort((a: any, b: any) => b[1] - a[1])
                    .map(([itemName, qty]: [string, any]) => (
                    <tr key={itemName}>
                      <td style={{ padding: '8px', borderBottom: '1px solid #f1f3f5', color: '#495057' }}>{itemName}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #f1f3f5', textAlign: 'right', fontWeight: 'bold' }}>{qty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div style={{ padding: '24px', background: 'white', borderRadius: '12px', border: '1px solid #dee2e6', marginBottom: '24px', color: '#868e96' }}>
            レポートがありません。開店してください。
          </div>
        )
      )}
    </div>
  )
}
