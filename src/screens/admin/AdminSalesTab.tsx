import React, { useState, useEffect } from 'react'
import {
  openStaffBusinessDay,
  closeStaffBusinessDay,
  getStaffSalesReport,
  voidStaffTicket,
  fetchStaffTicketDetail,
  getStaffAccountingTransactions,
} from '../../lib/staffReadApi'

type Props = {
  storeSlug: string
  disabled: boolean
  yen: (value: number) => string
  setAdminMessage: (msg: string | null) => void
  setError: (msg: string | null) => void
  initialSubTab?: 'status' | 'void' | 'summary' | 'hourly' | 'items' | 'category' | 'subcategory'
  hideHeaders?: boolean
}

function formatTokyoTime(isoString: string | null | undefined): string {
  if (!isoString) return '-'
  try {
    const d = new Date(isoString)
    if (isNaN(d.getTime())) return isoString
    return new Intl.DateTimeFormat('ja-JP', {
      timeZone: 'Asia/Tokyo',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(d)
  } catch {
    return isoString
  }
}

export function AdminSalesTab({ storeSlug, disabled, yen, setAdminMessage, setError, initialSubTab, hideHeaders }: Props) {
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [businessDateStr, setBusinessDateStr] = useState<string>('')
  const [activeSubTab, setActiveSubTab] = useState<'status' | 'void' | 'summary' | 'hourly' | 'items' | 'category' | 'subcategory'>(initialSubTab || 'status')

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab)
    }
  }, [initialSubTab])
  
  const [voidReceiptNo, setVoidReceiptNo] = useState('')
  const [voidPaymentType, setVoidPaymentType] = useState<string>('')
  const [loadedTicket, setLoadedTicket] = useState<any>(null)
  const [receiptPaymentChanges, setReceiptPaymentChanges] = useState<any[]>([])
  const [editCustomerCount, setEditCustomerCount] = useState<string>('')
  const [editBusinessDate, setEditBusinessDate] = useState<string>('')

  // Accounting history selection
  const [accountingListDate, setAccountingListDate] = useState<string>('')
  const [accountingList, setAccountingList] = useState<any[]>([])
  const [loadingAccountingList, setLoadingAccountingList] = useState(false)
  const [accountingFilterText, setAccountingFilterText] = useState('')

  const fetchAccountingList = async (dateStr: string) => {
    if (!storeSlug || !dateStr) return
    setLoadingAccountingList(true)
    try {
      const res = await getStaffAccountingTransactions(storeSlug, dateStr, dateStr)
      setAccountingList(res.transactions || [])
    } catch {
      // ignore
    } finally {
      setLoadingAccountingList(false)
    }
  }

  const fetchReport = async (date?: string) => {
    if (!storeSlug) return
    setLoading(true)
    try {
      const res = await getStaffSalesReport(storeSlug, date)
      setReport(res.report)
      const bDate = res.report?.business_date || ''
      setBusinessDateStr(bDate)
      if (bDate && !accountingListDate) {
        setAccountingListDate(bDate)
        void fetchAccountingList(bDate)
      }
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

  const handleClearLoadedTicket = () => {
    setVoidReceiptNo('')
    setLoadedTicket(null)
    setReceiptPaymentChanges([])
    setEditCustomerCount('')
    setEditBusinessDate('')
  }

  const handleLoadReceiptByNo = async (targetReceiptNo: string) => {
    if (!targetReceiptNo) return
    setLoading(true)
    setError(null)
    setVoidReceiptNo(targetReceiptNo)
    try {
      const res = await fetchStaffTicketDetail(storeSlug, null, null, targetReceiptNo)
      if (res.ticket) {
        setLoadedTicket(res.ticket)
        setEditCustomerCount(res.ticket.customer_count != null ? String(res.ticket.customer_count) : '1')
        setEditBusinessDate(res.ticket.ticket_business_date || '')
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

  const handleSearchReceipt = () => {
    void handleLoadReceiptByNo(voidReceiptNo.trim())
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

  const origCustomerCount = loadedTicket?.customer_count != null ? String(loadedTicket.customer_count) : '1'
  const isCustomerCountChanged = editCustomerCount !== '' && editCustomerCount !== origCustomerCount

  const origBusinessDate = loadedTicket?.ticket_business_date || ''
  const isBusinessDateChanged = editBusinessDate !== '' && editBusinessDate !== origBusinessDate

  const hasAnyChanges = () => {
    return hasPaymentChanges() || isCustomerCountChanged || isBusinessDateChanged
  }

  const filteredAccountingList = (accountingList || []).filter((tx) => {
    if (!accountingFilterText.trim()) return true
    const q = accountingFilterText.trim().toLowerCase()
    const tableMatch = tx.table_label && tx.table_label.toLowerCase().includes(q)
    const ticketMatch = tx.ticket_no && String(tx.ticket_no).toLowerCase().includes(q)
    const receiptMatch = tx.receipt_no && tx.receipt_no.toLowerCase().includes(q)
    const paymentMatch = (tx.payment_type_label || tx.payment_type || '').toLowerCase().includes(q)
    const amountMatch = String(tx.amount).includes(q)
    return Boolean(tableMatch || ticketMatch || receiptMatch || paymentMatch || amountMatch)
  })

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

    if (!hasAnyChanges()) return

    const confirmParts = [`レシート番号 ${voidReceiptNo} の売上データを変更しますか？\n`]
    if (isCustomerCountChanged) {
      confirmParts.push(`・客数: ${origCustomerCount}名 → ${editCustomerCount}名`)
    }
    if (isBusinessDateChanged) {
      confirmParts.push(`・営業日付: ${origBusinessDate || '未設定'} → ${editBusinessDate}`)
    }
    if (hasPaymentChanges()) {
      confirmParts.push(`・決済明細の変更`)
    }

    if (!window.confirm(confirmParts.join('\n'))) return
    setLoading(true)
    try {
      await voidStaffTicket(
        storeSlug,
        voidReceiptNo,
        null,
        changedItems.length > 0 ? changedItems : null,
        isCustomerCountChanged ? Number(editCustomerCount) : undefined,
        isBusinessDateChanged ? editBusinessDate : undefined
      )
      setAdminMessage('売上データの変更が完了しました')
      handleClearLoadedTicket()
      await fetchReport()
      if (accountingListDate) void fetchAccountingList(accountingListDate)
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
      handleClearLoadedTicket()
      await fetchReport()
      if (accountingListDate) void fetchAccountingList(accountingListDate)
    } catch (err: any) {
      setError(err.message || String(err))
      setLoading(false)
    }
  }

  if (loading && !report) {
    return <div className="admin-tab-content">読み込み中...</div>
  }

  return (
    <div className="ops-grid">
      <section className="panel admin-list-panel admin-list-panel-wide">
      <div className="admin-list-head">
        <div>
          <h2>
            {activeSubTab === 'category' ? 'カテゴリ別売上' 
             : activeSubTab === 'subcategory' ? 'サブカテゴリ別売上' 
             : '売上管理・レジ締め'}
          </h2>
          <p className="caption">
            {activeSubTab === 'category' ? '現在の営業日のカテゴリ別売上状況を表示します。' 
             : activeSubTab === 'subcategory' ? '現在の営業日のサブカテゴリ別売上状況を表示します。' 
             : '現在の営業日の売上状況や、開店・閉店の操作を行います。'}
          </p>
        </div>
      </div>

      {!hideHeaders && (
        <div className="admin-sales-subtabs">
          {[
            { id: 'status', label: '営業状況' },
            { id: 'void', label: '売上修正・VOID' },
            { id: 'summary', label: '売上サマリー' },
            { id: 'hourly', label: '時間帯別売上' },
            { id: 'items', label: '商品別注文数' },
            { id: 'category', label: 'カテゴリ別売上' },
            { id: 'subcategory', label: 'サブカテゴリ別売上' }
          ].map(t => (
            <button
              key={t.id}
              className={`admin-sales-subtab-btn ${activeSubTab === t.id ? 'active' : ''}`}
              onClick={() => setActiveSubTab(t.id as any)}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {activeSubTab === 'status' && (
        <div className="admin-card">
          <h3 className="admin-card-title">営業状況</h3>
          
          {report ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                <div>
                  <span style={{ fontSize: '0.9rem', color: '#868e96', display: 'block', marginBottom: '4px' }}>現在の営業日</span>
                  <strong style={{ fontSize: '1.5rem', color: '#212529' }}>{report.business_date || '未設定'}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.9rem', color: '#868e96', display: 'block', marginBottom: '4px' }}>ステータス</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ 
                      display: 'inline-block', 
                      padding: '4px 12px', 
                      borderRadius: '100px', 
                      background: report.is_open ? 'var(--yui-green-soft, #f0fdf4)' : 'var(--yui-surface-soft, #f1f5f9)', 
                      color: report.is_open ? 'var(--yui-green, #15803d)' : 'var(--yui-text-sub, #475569)',
                      fontWeight: 'bold'
                    }}>
                      {report.is_open ? '営業中' : '閉店'}
                    </span>
                    {report.is_open && report.today_business_date && report.today_business_date > report.business_date && (
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        borderRadius: '100px',
                        background: 'var(--yui-orange-soft, #fff7ed)',
                        color: 'var(--yui-orange, #ea580c)',
                        fontSize: '0.85rem',
                        fontWeight: 'bold'
                      }}>
                        ⚠️ 切替時刻超過（前日継続中）
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ flex: 1 }} />
                <div>
                  {report.is_open ? (
                    <button className="primary-button" style={{ background: '#dc2626' }} disabled={disabled || loading} onClick={handleClose}>
                      締め処理（閉店）を行う
                    </button>
                  ) : (
                    <button className="primary-button" style={{ background: 'var(--yui-green, #15803d)' }} disabled={disabled || loading} onClick={handleOpen}>
                      新しい営業日を開店する
                    </button>
                  )}
                </div>
              </div>

              {report.is_open && report.today_business_date && report.today_business_date > report.business_date && (
                <div style={{
                  padding: '12px 16px',
                  background: 'var(--yui-orange-soft, #fff7ed)',
                  border: '1px solid var(--yui-orange-border, #fed7aa)',
                  borderRadius: '8px',
                  color: 'var(--yui-orange-dark, #c2410c)',
                  fontSize: '0.88rem',
                  lineHeight: '1.5'
                }}>
                  <strong>※ 営業日切替時刻を経過しています</strong>
                  <div style={{ marginTop: '4px', color: '#495057' }}>
                    当日の営業日付は「<strong>{report.today_business_date}</strong>」に達していますが、前日の営業日（<strong>{report.business_date}</strong>）として伝票発行・注文・会計を継続できます。
                    全卓の退店・精算が完了した後に「<strong>締め処理（閉店）を行う</strong>」を実行してください。
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ color: '#868e96' }}>レポートがありません。開店してください。</div>
          )}
        </div>
      )}

      {activeSubTab === 'void' && (
        <div className="admin-card">
          <h3 className="admin-card-title">売上データ修正・VOID</h3>
          <p className="admin-card-caption">
            お会計一覧から選択するか、レシート番号を入力して検索し、営業日付や客数の修正、決済明細の変更、または会計の取消（VOID）を行います。
          </p>

          {/* 会計一覧から選択セクション */}
          <div style={{ background: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontWeight: 'bold', fontSize: '0.95rem', color: '#495057' }}>日付から会計データを選択:</span>
                <input 
                  type="date" 
                  value={accountingListDate}
                  onChange={(e) => {
                    const newDate = e.target.value
                    setAccountingListDate(newDate)
                    handleClearLoadedTicket()
                    if (newDate) void fetchAccountingList(newDate)
                  }}
                  style={{ padding: '6px 10px', border: '1px solid #ced4da', borderRadius: '6px', fontSize: '0.9rem' }}
                />
                <button
                  type="button"
                  className="secondary-button"
                  disabled={disabled || loadingAccountingList || !accountingListDate}
                  onClick={() => {
                    handleClearLoadedTicket()
                    void fetchAccountingList(accountingListDate)
                  }}
                  style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                >
                  {loadingAccountingList ? '取得中...' : '再取得'}
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input 
                  type="text"
                  placeholder="卓番・伝票No等で絞込..."
                  value={accountingFilterText}
                  onChange={(e) => setAccountingFilterText(e.target.value)}
                  style={{ padding: '6px 12px', border: '1px solid #ced4da', borderRadius: '6px', fontSize: '0.88rem', width: '180px' }}
                />
              </div>
            </div>

            <div style={{ maxHeight: '240px', overflowY: 'auto', background: 'white', borderRadius: '8px', border: '1px solid #dee2e6' }}>
              <table className="admin-table" style={{ margin: 0, fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ position: 'sticky', top: 0, background: '#f1f3f5', zIndex: 1 }}>
                    <th style={{ padding: '8px 12px' }}>時刻</th>
                    <th style={{ padding: '8px 12px' }}>テーブル</th>
                    <th style={{ padding: '8px 12px' }}>伝票No</th>
                    <th style={{ padding: '8px 12px' }}>客数</th>
                    <th style={{ padding: '8px 12px' }}>会計種別</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right' }}>金額</th>
                    <th style={{ padding: '8px 12px', textAlign: 'center' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingAccountingList ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '16px', color: '#868e96' }}>
                        会計一覧を取得中...
                      </td>
                    </tr>
                  ) : filteredAccountingList.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '16px', color: '#868e96' }}>
                        {accountingList.length === 0 ? '指定された日の会計データはありません。' : '条件に一致する会計データがありません。'}
                      </td>
                    </tr>
                  ) : (
                    filteredAccountingList.map((tx, idx) => {
                      const isSelected = loadedTicket && (loadedTicket.receipt_no === tx.receipt_no || voidReceiptNo === tx.receipt_no)
                      const timeStr = formatTokyoTime(tx.paid_at)
                      return (
                        <tr 
                          key={idx} 
                          style={{ 
                            background: isSelected ? 'var(--yui-green-soft, #f0fdf4)' : 'transparent',
                            cursor: 'pointer',
                            transition: 'background 0.15s'
                          }}
                          onClick={() => {
                            if (isSelected) {
                              handleClearLoadedTicket()
                            } else {
                              void handleLoadReceiptByNo(tx.receipt_no)
                            }
                          }}
                        >
                          <td style={{ padding: '8px 12px' }} title={tx.paid_at}>{timeStr}</td>
                          <td style={{ padding: '8px 12px', fontWeight: 'bold' }}>{tx.table_label || '—'}</td>
                          <td style={{ padding: '8px 12px', fontFamily: 'monospace' }}>#{tx.ticket_no || '—'}</td>
                          <td style={{ padding: '8px 12px' }}>{tx.customer_count ? `${tx.customer_count}名` : '1名'}</td>
                          <td style={{ padding: '8px 12px' }}>
                            <span style={{ 
                              padding: '2px 8px', 
                              borderRadius: '4px', 
                              fontSize: '0.8rem', 
                              background: '#f1f3f5',
                              fontWeight: 'bold'
                            }}>
                              {tx.payment_type_label || tx.payment_type}
                            </span>
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 'bold' }}>{yen(tx.amount)}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                            <button
                              type="button"
                              className={isSelected ? 'primary-button' : 'secondary-button'}
                              onClick={(e) => {
                                e.stopPropagation()
                                if (isSelected) {
                                  handleClearLoadedTicket()
                                } else {
                                  void handleLoadReceiptByNo(tx.receipt_no)
                                }
                              }}
                              style={{ padding: '3px 10px', fontSize: '0.8rem' }}
                              title={isSelected ? 'クリックで選択を解除' : 'この伝票を修正'}
                            >
                              {isSelected ? '選択中' : '修正'}
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.9rem', color: '#495057', fontWeight: 'bold' }}>または レシート番号で直接検索:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input 
                type="text" 
                placeholder="例: 0001-12345" 
                value={voidReceiptNo} 
                onChange={e => {
                  setVoidReceiptNo(e.target.value)
                  setLoadedTicket(null)
                }}
                style={{ padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '8px', fontSize: '0.95rem', width: '200px' }}
              />
              <button 
                className="secondary-button" 
                disabled={disabled || loading || !voidReceiptNo.trim()} 
                onClick={handleSearchReceipt}
                style={{ padding: '8px 16px', fontSize: '0.9rem' }}
              >
                検索
              </button>
              {(voidReceiptNo || loadedTicket) && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={handleClearLoadedTicket}
                  style={{ padding: '8px 14px', fontSize: '0.9rem', color: '#495057' }}
                  title="選択中・入力中の伝票をクリアします"
                >
                  クリア
                </button>
              )}
            </div>
          </div>

          {loadedTicket && (
            <div style={{ marginTop: '24px', padding: '20px', background: '#f8f9fa', borderRadius: '12px', border: '1px solid #e9ecef' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#495057' }}>
                  レシート情報: {loadedTicket.receipt_no || voidReceiptNo}
                </h4>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={handleClearLoadedTicket}
                  style={{ padding: '6px 14px', fontSize: '0.85rem' }}
                >
                  ✕ 選択解除（編集をやめる）
                </button>
              </div>
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
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '16px',
                    background: 'white',
                    padding: '16px',
                    borderRadius: '8px',
                    border: '1px solid #dee2e6',
                    marginBottom: '20px'
                  }}>
                    <div>
                      <label style={{ fontSize: '0.88rem', fontWeight: 'bold', color: '#495057', display: 'block', marginBottom: '6px' }}>
                        営業日付
                        {isBusinessDateChanged && <span style={{ marginLeft: '8px', color: 'var(--yui-orange, #ea580c)', fontSize: '0.8rem', fontWeight: 'bold' }}>● 変更あり</span>}
                      </label>
                      <input 
                        type="date"
                        value={editBusinessDate}
                        disabled={disabled || loading}
                        onChange={e => setEditBusinessDate(e.target.value)}
                        style={{ padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '6px', fontSize: '0.95rem', width: '100%', boxSizing: 'border-box' }}
                      />
                      <span style={{ fontSize: '0.8rem', color: '#868e96', marginTop: '4px', display: 'block' }}>
                        元の営業日付: {origBusinessDate || '未設定'}
                      </span>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.88rem', fontWeight: 'bold', color: '#495057', display: 'block', marginBottom: '6px' }}>
                        客数
                        {isCustomerCountChanged && <span style={{ marginLeft: '8px', color: 'var(--yui-orange, #ea580c)', fontSize: '0.8rem', fontWeight: 'bold' }}>● 変更あり</span>}
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input 
                          type="number"
                          min="1"
                          max="999"
                          value={editCustomerCount}
                          disabled={disabled || loading}
                          onChange={e => setEditCustomerCount(e.target.value)}
                          style={{ padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '6px', fontSize: '0.95rem', width: '120px' }}
                        />
                        <span style={{ fontSize: '0.95rem', color: '#495057' }}>名</span>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: '#868e96', marginTop: '4px', display: 'block' }}>
                        元の客数: {origCustomerCount}名
                      </span>
                    </div>
                  </div>

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
                        border: '1px solid var(--yui-green, #15803d)',
                        color: 'var(--yui-green, #15803d)',
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

                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <button 
                      className="primary-button" 
                      style={{ background: 'var(--yui-green, #15803d)' }} 
                      disabled={disabled || loading || !hasAnyChanges()} 
                      onClick={handleSavePaymentChanges}
                    >
                      修正内容を保存
                    </button>
                    <button 
                      className="primary-button" 
                      style={{ background: '#fa5252' }} 
                      disabled={disabled || loading} 
                      onClick={handleVoidExecuteOnly}
                    >
                      VOID取消を実行
                    </button>
                    <button
                      type="button"
                      className="secondary-button"
                      disabled={disabled || loading}
                      onClick={handleClearLoadedTicket}
                      style={{ padding: '10px 18px', fontSize: '0.95rem' }}
                    >
                      キャンセル
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
          <div className="admin-card">
            <h3 className="admin-card-title">売上サマリー</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div style={{ background: '#ffffff', border: '1px solid var(--admin-line)', borderLeft: '4px solid var(--yui-green)', padding: '16px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--yui-text-muted)', marginBottom: '4px' }}>総売上</div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--yui-green)' }}>{yen(report.total_sales || 0)}</div>
              </div>
              <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.9rem', color: '#868e96', marginBottom: '4px' }}>値引・割引額</div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fa5252' }}>{yen(report.total_discount || 0)}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div style={{ background: '#ffffff', border: '1px solid var(--admin-line)', borderLeft: '4px solid var(--yui-orange)', padding: '16px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--yui-text-muted)', marginBottom: '4px' }}>組数（会計件数）</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--yui-text-main)' }}>{report.total_groups || 0} 組</div>
              </div>
              <div style={{ background: '#ffffff', border: '1px solid var(--admin-line)', borderLeft: '4px solid var(--yui-orange)', padding: '16px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--yui-text-muted)', marginBottom: '4px' }}>客数</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--yui-text-main)' }}>{report.total_customers || 0} 名</div>
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
          <div className="admin-card">
            <h3 className="admin-card-title">時間帯別売上</h3>
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
          <div className="admin-card">
            <h3 className="admin-card-title">商品別注文数</h3>
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

      {activeSubTab === 'category' && (
        report ? (
          <div className="admin-card">
            <h3 className="admin-card-title">カテゴリ別売上</h3>
            <div style={{ overflowY: 'auto', maxHeight: 'min(500px, 50vh)', border: '1px solid #dee2e6', borderRadius: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa' }}>
                    <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #f1f3f5', color: '#868e96', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 1 }}>カテゴリ名</th>
                    <th style={{ padding: '8px', textAlign: 'right', borderBottom: '2px solid #f1f3f5', color: '#868e96', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 1 }}>売上</th>
                  </tr>
                </thead>
                <tbody>
                  {(!report.category_sales || Object.entries(report.category_sales).length === 0) && (
                    <tr>
                      <td colSpan={2} style={{ padding: '16px', textAlign: 'center', color: '#adb5bd' }}>データなし</td>
                    </tr>
                  )}
                  {report.category_sales && Object.entries(report.category_sales)
                    .sort((a: any, b: any) => b[1] - a[1])
                    .map(([name, amount]: [string, any]) => (
                    <tr key={name}>
                      <td style={{ padding: '8px', borderBottom: '1px solid #f1f3f5', color: '#495057' }}>{name}</td>
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

      {activeSubTab === 'subcategory' && (
        report ? (
          <div className="admin-card">
            <h3 className="admin-card-title">サブカテゴリ別売上</h3>
            <div style={{ overflowY: 'auto', maxHeight: 'min(500px, 50vh)', border: '1px solid #dee2e6', borderRadius: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa' }}>
                    <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #f1f3f5', color: '#868e96', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 1 }}>サブカテゴリ名</th>
                    <th style={{ padding: '8px', textAlign: 'right', borderBottom: '2px solid #f1f3f5', color: '#868e96', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 1 }}>売上</th>
                  </tr>
                </thead>
                <tbody>
                  {(!report.subcategory_sales || Object.entries(report.subcategory_sales).length === 0) && (
                    <tr>
                      <td colSpan={2} style={{ padding: '16px', textAlign: 'center', color: '#adb5bd' }}>データなし</td>
                    </tr>
                  )}
                  {report.subcategory_sales && Object.entries(report.subcategory_sales)
                    .sort((a: any, b: any) => b[1] - a[1])
                    .map(([name, amount]: [string, any]) => (
                    <tr key={name}>
                      <td style={{ padding: '8px', borderBottom: '1px solid #f1f3f5', color: '#495057' }}>{name}</td>
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
    </section>
    </div>
  )
}
