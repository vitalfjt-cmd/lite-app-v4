import React from 'react'
import { TicketSummaryView, LivePaymentEntry, LiveLine } from '../../types'

type PaymentKind = 'CASH' | 'CARD' | 'OTHER'

type StaffPaymentViewProps = {
  selectedSummary: TicketSummaryView
  selectedLines: LiveLine[]
  payments: Array<{
    id: number
    method: string
    amount: number
    received: number
    change: number
    items?: Array<{ name: string; qty: number; subtotal: number }>
    label?: string
  }>
  currentPaymentInput: string
  discountAmount: number
  discountRate: number
  paymentFinalized: boolean
  mutationBusy: string | null
  storeName: string
  yen: (val: number) => string
  setShowPaymentModal: (val: boolean) => void
  setPayments: React.Dispatch<React.SetStateAction<Array<{
    id: number
    method: string
    amount: number
    received: number
    change: number
    items?: Array<{ name: string; qty: number; subtotal: number }>
    label?: string
  }>>>
  setCurrentPaymentInput: React.Dispatch<React.SetStateAction<string>>
  setDiscountAmount: React.Dispatch<React.SetStateAction<number>>
  setDiscountRate: React.Dispatch<React.SetStateAction<number>>
  setPaymentFinalized: React.Dispatch<React.SetStateAction<boolean>>
  onSavePaymentEntry: (payload: any) => Promise<boolean>
  onCloseTicket: () => Promise<boolean>
  handleNumpadPayment: (num: string) => void
  addPaymentMethod: (methodStr: string) => void
  applyDiscountAmount: () => void
  applyDiscountRate: () => void
  commitPaymentToDB: () => Promise<void>
  calcMode: 'normal' | 'split' | 'itemized'
  setCalcMode: React.Dispatch<React.SetStateAction<'normal' | 'split' | 'itemized'>>
  splitCount: number
  setSplitCount: React.Dispatch<React.SetStateAction<number>>
  calculatingLineQtys: Record<string, number>
  updateCalculatingQty: (id: string, delta: number) => void
  getItemUnitPrice: (id: string) => number
  currentItemizedTotal: number
  processItemizedCalculation: () => void
  remainingTotal: number
  paidTotal: number
  finalBilledAmount: number
  discountFromRate: number
  totalDiscount: number
  changeTotal: number
  paidLineQtys: Record<string, number>
  setInputSource: React.Dispatch<React.SetStateAction<'modal' | 'manual'>>
  onReceiptClosed: () => void
  onAbortPayment: () => void
  targetPaymentAmount: number | null
  setTargetPaymentAmount: React.Dispatch<React.SetStateAction<number | null>>
  setPendingPaymentItems: React.Dispatch<React.SetStateAction<Array<{ name: string; qty: number; subtotal: number }>>>
}

export function StaffPaymentView({
  selectedSummary,
  selectedLines,
  payments,
  currentPaymentInput,
  discountAmount,
  discountRate,
  paymentFinalized,
  mutationBusy,
  storeName,
  yen,
  setShowPaymentModal,
  setPayments,
  setCurrentPaymentInput,
  setDiscountAmount,
  setDiscountRate,
  setPaymentFinalized,
  commitPaymentToDB,
  handleNumpadPayment,
  addPaymentMethod,
  applyDiscountAmount,
  applyDiscountRate,
  calcMode,
  setCalcMode,
  splitCount,
  setSplitCount,
  calculatingLineQtys,
  updateCalculatingQty,
  getItemUnitPrice,
  currentItemizedTotal,
  processItemizedCalculation,
  remainingTotal,
  paidTotal,
  finalBilledAmount,
  discountFromRate,
  totalDiscount,
  changeTotal,
  paidLineQtys,
  setInputSource,
  onReceiptClosed,
  onAbortPayment,
  targetPaymentAmount,
  setTargetPaymentAmount,
  setPendingPaymentItems,
}: StaffPaymentViewProps) {
  const [activePrintPaymentId, setActivePrintPaymentId] = React.useState<number | null>(null)
  const activePrintPayment = activePrintPaymentId ? payments.find(p => p.id === activePrintPaymentId) : null

  const renderReceiptPaper = (p: typeof activePrintPayment, hasPageBreak: boolean) => {
    return (
      <div 
        className="receipt-paper" 
        style={hasPageBreak ? { pageBreakAfter: 'always', breakAfter: 'page' } : {}}
      >
        {/* ---- 固定ヘッダー ---- */}
        <div style={{ padding: '16px 20px 0', flexShrink: 0 }}>
          {paymentFinalized && (
            <div
              style={{
                textAlign: 'center',
                color: '#51cf66',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                marginBottom: '12px',
                border: '2px solid #51cf66',
                padding: '6px',
                borderRadius: '4px',
              }}
            >
              ✓ 領収済み
            </div>
          )}
          <h3 className="receipt-brand">{storeName}</h3>
          <p className="receipt-meta">注文: {selectedSummary.orderedAt}</p>
          {p && <p className="receipt-meta" style={{ fontWeight: 'bold', fontSize: '1.05rem', marginTop: '4px', textAlign: 'center', background: '#e7f5ff', padding: '4px', borderRadius: '4px', color: '#1c7ed6' }}>{p.label}</p>}
          <div className="receipt-divider"></div>
        </div>

        {/* ---- スクロール可能な注文明細 ---- */}
        <div style={{ flex: 1, padding: '0 20px', overflowY: 'auto' }}>
          {p ? (
            p.items && p.items.length > 0 ? (
              p.items.map((item, idx) => (
                <div key={idx} className="receipt-item-row">
                  <span className="receipt-item-name">{item.name}</span>
                  <span className="receipt-item-qty">x{item.qty}</span>
                  <span className="receipt-item-price">{yen(item.subtotal)}</span>
                </div>
              ))
            ) : (calcMode === 'split' || (p && p.label && p.label.includes('割勘'))) ? (
              Object.values(
                selectedLines.reduce((acc, line) => {
                  const name = line.item_name_snapshot
                  if (!acc[name]) {
                    acc[name] = { id: name, item_name_snapshot: name, quantity: 0, line_subtotal: 0 }
                  }
                  acc[name].quantity += line.quantity
                  acc[name].line_subtotal += line.line_subtotal
                  return acc
                }, {} as Record<string, { id: string; item_name_snapshot: string; quantity: number; line_subtotal: number }>),
              ).map((l: any) => (
                <div key={l.id} className="receipt-item-row">
                  <span className="receipt-item-name">{l.item_name_snapshot}</span>
                  <span className="receipt-item-qty">x{l.quantity}</span>
                  <span className="receipt-item-price">{yen(l.line_subtotal)}</span>
                </div>
              ))
            ) : (
              <div className="receipt-item-row">
                <span className="receipt-item-name">{p.label || 'ご飲食代'}</span>
                <span className="receipt-item-qty">x1</span>
                <span className="receipt-item-price">{yen(p.amount)}</span>
              </div>
            )
          ) : (
            Object.values(
              selectedLines.reduce((acc, line) => {
                const name = line.item_name_snapshot
                if (!acc[name]) {
                  acc[name] = { id: name, item_name_snapshot: name, quantity: 0, line_subtotal: 0 }
                }
                acc[name].quantity += line.quantity
                acc[name].line_subtotal += line.line_subtotal
                return acc
              }, {} as Record<string, { id: string; item_name_snapshot: string; quantity: number; line_subtotal: number }>),
            ).map((l: any) => (
              <div key={l.id} className="receipt-item-row">
                <span className="receipt-item-name">{l.item_name_snapshot}</span>
                <span className="receipt-item-qty">x{l.quantity}</span>
                <span className="receipt-item-price">{yen(l.line_subtotal)}</span>
              </div>
            ))
          )}
        </div>

        {/* ---- 固定フッター：会計金額エリア ---- */}
        <div style={{ padding: '0 20px 16px', flexShrink: 0, borderTop: '2px dashed #aaa', background: '#fdfdfd' }}>
          {!p && discountRate > 0 && (
            <div className="receipt-deposit-group" style={{ color: '#ff5a5f', padding: '0', background: 'transparent', margin: '0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '1.2rem' }}>
                <span>割引 ({discountRate}%)</span>
                <span>-{yen(discountFromRate)}</span>
              </div>
            </div>
          )}
          {!p && discountAmount > 0 && (
            <div className="receipt-deposit-group" style={{ color: '#ff5a5f', padding: '0', background: 'transparent', margin: '0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '1.2rem' }}>
                <span>値引</span>
                <span>-{yen(discountAmount)}</span>
              </div>
            </div>
          )}
          {!p && (discountRate > 0 || discountAmount > 0) && <div className="receipt-divider"></div>}
          <div className="receipt-grand-total">
            <span>ご請求額</span>
            <span className="total-amount" style={{ color: (p ? 0 : remainingTotal) === 0 ? '#333' : '#ff5a5f' }}>
              {yen(p ? p.amount : finalBilledAmount)}
            </span>
          </div>
          <div className="receipt-deposit-group" style={{ marginTop: '16px' }}>
            {p ? (
              <>
                <div className="deposit-line">
                  <span>お預かり ({p.method})</span>
                  <span className="deposit-amount">{yen(p.received)}</span>
                </div>
                {p.change > 0 && (
                  <div className="deposit-line change">
                    <span>お釣り</span>
                    <span className="change-amount">{yen(p.change)}</span>
                  </div>
                )}
              </>
            ) : (
              <>
                {payments.length > 0 && (
                  <div className="payments-history">
                    <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '8px' }}>お支払い内訳</div>
                    {payments.map((pm) => (
                      <div key={pm.id} className="deposit-line-group" style={{ marginBottom: '8px', color: '#444' }}>
                        <div className="deposit-line" style={{ fontWeight: 'normal' }}>
                          <span>{pm.label || pm.method}</span>
                          <span>{yen(pm.amount)}</span>
                        </div>
                        {pm.received > pm.amount && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#666', paddingLeft: '12px' }}>
                            <span>(お預かり: {yen(pm.received)}</span>
                            <span>お釣り: {yen(pm.change)})</span>
                          </div>
                        )}
                      </div>
                    ))}
                    <div className="receipt-divider"></div>
                  </div>
                )}
                <div className="deposit-line">
                  <span>合計お預かり</span>
                  <span className="deposit-amount">{yen(paidTotal)}</span>
                </div>
                {changeTotal > 0 ? (
                  <div className="deposit-line change">
                    <span>お釣り</span>
                    <span className="change-amount">{yen(changeTotal)}</span>
                  </div>
                ) : (
                  <div className="deposit-line change">
                    <span>残金（不足額）</span>
                    <span className="change-amount" style={{ color: remainingTotal === 0 ? '#adb5bd' : '#fa5252' }}>
                      {yen(remainingTotal)}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="payment-app standalone">
      <header className="payment-full-header">
        <div className="header-left">
          {!paymentFinalized && (
            <button className="btn-secondary back-btn" onClick={() => { onAbortPayment(); setShowPaymentModal(false); }}>
              ← スタッフ画面へ戻る
            </button>
          )}
          <h2 className="payment-title">お会計：{selectedSummary.tableName}</h2>
        </div>
        <div className="header-right">
          {!paymentFinalized && (
            <button
              className="btn-secondary"
              onClick={() => {
                setPayments([])
                setCurrentPaymentInput('')
                setDiscountAmount(0)
                setDiscountRate(0)
                setTargetPaymentAmount(null)
                setPendingPaymentItems([])
              }}
              style={{ marginRight: '16px' }}
            >
              支払いをリセット
            </button>
          )}
          <span className="payment-time">伝票: {selectedSummary.ticketNo}</span>
        </div>
      </header>

      <div className="payment-full-layout">
        <aside className="payment-receipt-pane" style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
          {activePrintPayment ? (
            renderReceiptPaper(activePrintPayment, false)
          ) : (payments.length > 1 && payments.some(p => p.label !== '')) ? (
            payments.map((p, idx) => renderReceiptPaper(p, idx < payments.length - 1))
          ) : (
            renderReceiptPaper(null, false)
          )}
        </aside>

        <main className="payment-action-pane full">
          {paymentFinalized ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', height: '100%', gap: '24px', padding: '40px 20px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', width: '100%', maxWidth: '400px', justifyContent: 'center' }}>
                <button
                  onClick={() => setActivePrintPaymentId(null)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid #ced4da',
                    background: activePrintPaymentId === null ? '#4dabf7' : '#f1f3f5',
                    color: activePrintPaymentId === null ? 'white' : '#495057',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  全体 (一括)
                </button>
                {payments.some(p => p.label !== '') && payments.map((p, idx) => (
                  <button
                    key={p.id}
                    onClick={() => setActivePrintPaymentId(p.id)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: '1px solid #ced4da',
                      background: activePrintPaymentId === p.id ? '#4dabf7' : '#f1f3f5',
                      color: activePrintPaymentId === p.id ? 'white' : '#495057',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    {p.label || `${idx + 1}人目 (${p.method})`}
                  </button>
                ))}
              </div>

              <div style={{ width: '100%', maxWidth: '400px', background: 'white', padding: '32px', borderRadius: '16px', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', border: '1px solid #eee' }}>
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <div style={{ background: '#ebfbee', color: '#2b8a3e', display: 'inline-flex', padding: '8px 16px', borderRadius: '100px', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '16px' }}>
                    ✓ 決済完了
                  </div>
                  <h2 style={{ fontSize: '1.8rem', margin: 0, color: '#333' }}>領収書 (控え)</h2>
                  <p style={{ color: '#888', fontSize: '0.9rem', marginTop: '4px' }}>{new Date().toLocaleString('ja-JP')}</p>
                </div>
                
                <div style={{ borderTop: '2px dashed #eee', borderBottom: '2px dashed #eee', padding: '20px 0', margin: '20px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#555' }}>
                    <span>卓番: {selectedSummary.tableName}</span>
                    <span>伝票: {selectedSummary.ticketNo}</span>
                  </div>
                  <div style={{ fontWeight: 'bold', fontSize: '1.4rem', textAlign: 'center', margin: '16px 0', color: '#333' }}>
                    {activePrintPayment ? `${activePrintPayment.label || '一部お支払い'}` : '合計'}: {yen(activePrintPayment ? activePrintPayment.amount : finalBilledAmount)}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#666' }}>
                    {activePrintPayment ? (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                          <span>お支払い方法 ({activePrintPayment.method})</span>
                          <span>{yen(activePrintPayment.received)}</span>
                        </div>
                        {activePrintPayment.change > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #f1f3f5', fontWeight: 'bold', color: '#333' }}>
                            <span>お釣り</span>
                            <span>{yen(activePrintPayment.change)}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {payments.map(p => (
                          <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                            <span>{p.label || p.method}</span>
                            <span>{yen(p.amount)}</span>
                          </div>
                        ))}
                        {changeTotal > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #f1f3f5', fontWeight: 'bold', color: '#333' }}>
                            <span>お釣り</span>
                            <span>{yen(changeTotal)}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '1rem', color: '#333', fontWeight: 'bold', marginBottom: '4px' }}>{storeName}</p>
                  <p style={{ fontSize: '0.85rem', color: '#888' }}>ご利用ありがとうございました</p>
                </div>

                <button
                  onClick={() => window.print()}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#f1f3f5',
                    color: '#495057',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    border: 'none',
                    cursor: 'pointer',
                    marginTop: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <span>🖨️</span> レシートを印刷
                </button>
              </div>

              <button
                onClick={() => {
                  setPaymentFinalized(false)
                  setShowPaymentModal(false)
                  onReceiptClosed()
                }}
                style={{
                  width: '100%',
                  maxWidth: '400px',
                  padding: '20px',
                  background: '#4dabf7',
                  color: 'white',
                  borderRadius: '12px',
                  fontSize: '1.3rem',
                  fontWeight: 'bold',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(77,171,247,0.3)',
                }}
              >
                スタッフ画面へ戻る
              </button>
            </div>
          ) : remainingTotal === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div
                style={{
                  background: 'white',
                  padding: '32px',
                  borderRadius: '12px',
                  border: '1px solid #dee2e6',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  flex: 1,
                  justifyContent: 'center',
                }}
              >
                <h3 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>ご請求額を満たしました</h3>
                <p style={{ color: '#666', marginBottom: '40px' }}>内容を確認し、問題なければ会計を確定してください。</p>
                {changeTotal > 0 && (
                  <div
                    style={{
                      textAlign: 'center',
                      marginBottom: '40px',
                      background: '#f8f9fa',
                      padding: '24px',
                      width: '100%',
                      borderRadius: '12px',
                      border: '2px solid #51cf66',
                    }}
                  >
                    <div style={{ color: '#555', fontWeight: 'bold', marginBottom: '8px' }}>お客様へのお釣り</div>
                    <div style={{ fontSize: '3rem', color: '#51cf66', fontWeight: 'bold' }}>{yen(changeTotal)}</div>
                  </div>
                )}
                <button
                  onClick={commitPaymentToDB}
                  disabled={mutationBusy === 'payment-entry'}
                  style={{
                    width: '100%',
                    padding: '24px',
                    background: '#ff5a5f',
                    color: 'white',
                    borderRadius: '12px',
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(255,90,95,0.3)',
                    marginBottom: '16px',
                  }}
                >
                  ✅ {mutationBusy === 'payment-entry' ? '処理中...' : '会計を確定する'}
                </button>
                <button
                  onClick={() => setPayments((prev) => prev.slice(0, -1))}
                  style={{ background: 'transparent', border: 'none', color: '#fa5252', fontSize: '1.2rem', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  直前の支払いをやり直す
                </button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', height: '100%', overflowY: 'auto' }}>
                <div className="numpad-section">
                  <div className="numpad-display" style={targetPaymentAmount !== null ? { width: '100%', boxSizing: 'border-box' } : undefined}>
                    {targetPaymentAmount !== null ? (
                      <>
                        <div style={{ fontSize: '1rem', color: '#868e96', display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '4px' }}>
                          <span>お会計額:</span>
                          <span style={{ fontWeight: 'bold', color: '#495057' }}>{yen(targetPaymentAmount)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'baseline' }}>
                          <span className="numpad-label" style={{ margin: 0 }}>お預かり金額</span>
                          <span className="numpad-value">{yen(parseInt(currentPaymentInput || '0'))}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="numpad-label">入力金額</span>
                        <span className="numpad-value">{yen(parseInt(currentPaymentInput || '0'))}</span>
                      </>
                    )}
                  </div>
                  <div className="numpad-grid">
                    {[7, 8, 9, 4, 5, 6, 1, 2, 3, 0, '00', 'C'].map((num) => (
                      <button key={num} className={`numpad-large-btn ${num === 'C' ? 'clear-btn' : ''}`} onClick={() => handleNumpadPayment(num.toString())}>
                        {num}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                    <button
                      style={{
                        flex: 1,
                        padding: '14px 8px',
                        background: '#f8f9fa',
                        border: '1px solid #dee2e6',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        color: '#495057',
                      }}
                      onClick={() => {
                        setCurrentPaymentInput(String(remainingTotal))
                        setInputSource('modal')
                      }}
                    >
                      全額(ちょうど)
                    </button>
                    {payments.length === 0 && (
                      <>
                        <button
                          style={{
                            flex: 1,
                            padding: '14px 8px',
                            background: '#fff0f6',
                            border: '1px solid #ffdeeb',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            color: '#a61e4d',
                          }}
                          onClick={applyDiscountAmount}
                        >
                          値引(円)
                        </button>
                        <button
                          style={{
                            flex: 1,
                            padding: '14px 8px',
                            background: '#fff0f6',
                            border: '1px solid #ffdeeb',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            color: '#a61e4d',
                          }}
                          onClick={applyDiscountRate}
                        >
                          割引(%)
                        </button>
                      </>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                    <button
                      style={{
                        flex: 1,
                        padding: '16px 10px',
                        background: '#e7f5ff',
                        border: '1px solid #74c0fc',
                        borderRadius: '8px',
                        fontSize: '1.05rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        color: '#1864ab',
                      }}
                      onClick={() => {
                        setCalcMode('split')
                        setSplitCount(2)
                      }}
                    >
                      ➗ 単純割勘
                    </button>
                    <button
                      style={{
                        flex: 1,
                        padding: '16px 10px',
                        background: '#e7f5ff',
                        border: '1px solid #74c0fc',
                        borderRadius: '8px',
                        fontSize: '1.05rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        color: '#1864ab',
                      }}
                      onClick={() => {
                        setCalcMode('itemized')
                      }}
                    >
                      📋 個別計算
                    </button>
                  </div>
                </div>
              </div>
              <div className="payment-methods-section">
                <h3 className="section-title">決済方法を選択</h3>
                {!currentPaymentInput && (
                  <div style={{ padding: '12px', background: '#fff3cd', color: '#856404', borderRadius: '8px', marginBottom: '16px', fontSize: '0.95rem' }}>
                    預かり金額を入力（またはタップ）してから決済方法を選択してください。
                  </div>
                )}
                <div className="methods-grid">
                  <button className="method-card cash" disabled={!currentPaymentInput} onClick={() => addPaymentMethod('現金')}>
                    <span className="method-icon">💵</span>現金
                  </button>
                  <button className="method-card credit" disabled={!currentPaymentInput} onClick={() => addPaymentMethod('クレジットカード')}>
                    <span className="method-icon">💳</span>クレジット
                  </button>
                  <button className="method-card qr" disabled={!currentPaymentInput} onClick={() => addPaymentMethod('QR決済')}>
                    <span className="method-icon">📱</span>QRコード
                  </button>
                  <button className="method-card other" disabled={!currentPaymentInput} onClick={() => addPaymentMethod('商品券')}>
                    <span className="method-icon">🎫</span>商品券
                  </button>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {calcMode !== 'normal' && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setCalcMode('normal')}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              width: '90%',
              maxWidth: calcMode === 'split' ? '400px' : '650px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #dee2e6',
                flexShrink: 0,
              }}
            >
              <h3 style={{ fontSize: '1.5rem', margin: 0, color: '#333' }}>{calcMode === 'split' ? '➗ 単純割勘' : '📋 個別計算'}</h3>
              <button onClick={() => setCalcMode('normal')} style={{ background: 'transparent', border: 'none', fontSize: '1.8rem', cursor: 'pointer', color: '#adb5bd', lineHeight: 1 }}>
                ×
              </button>
            </div>

            {calcMode === 'split' && (
              <div style={{ padding: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '32px', marginBottom: '32px' }}>
                  <button
                    onClick={() => setSplitCount(Math.max(2, splitCount - 1))}
                    style={{
                      fontSize: '2rem',
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      border: '1px solid #dee2e6',
                      background: 'white',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                      cursor: 'pointer',
                      color: '#495057',
                    }}
                  >
                    -
                  </button>
                  <span style={{ fontSize: '2rem', fontWeight: 'bold', width: '60px', textAlign: 'center' }}>{splitCount} 人</span>
                  <button
                    onClick={() => setSplitCount(Math.max(2, splitCount + 1))}
                    style={{
                      fontSize: '2rem',
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      border: '1px solid #dee2e6',
                      background: 'white',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                      cursor: 'pointer',
                      color: '#495057',
                    }}
                  >
                    +
                  </button>
                </div>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                  <span style={{ fontSize: '1.3rem', color: '#666' }}>1人あたり: </span>
                  <span style={{ fontSize: '3rem', fontWeight: 'bold', color: '#ff5a5f' }}>{yen(Math.ceil(remainingTotal / splitCount))}</span>
                </div>
                <button
                  style={{
                    width: '100%',
                    background: '#4dabf7',
                    color: 'white',
                    padding: '20px',
                    borderRadius: '12px',
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(77,171,247,0.3)',
                  }}
                  onClick={() => {
                    const amt = Math.ceil(remainingTotal / splitCount);
                    setCurrentPaymentInput(String(amt))
                    setTargetPaymentAmount(amt)
                    setCalcMode('normal')
                    setInputSource('modal')
                  }}
                >
                  この金額をテンキー入力
                </button>
              </div>
            )}

            {calcMode === 'itemized' && (
              <>
                <div style={{ padding: '16px 24px', background: '#f8f9fa', borderBottom: '1px solid #dee2e6', color: '#495057', fontWeight: 'bold', flexShrink: 0 }}>
                  支払う商品を選んでください:
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '12px 24px' }}>
                  {(() => {
                    const groupedMap = new Map<string, LiveLine[]>()
                    for (const line of selectedLines) {
                      const name = line.item_name_snapshot
                      if (!groupedMap.has(name)) {
                        groupedMap.set(name, [])
                      }
                      groupedMap.get(name)!.push(line)
                    }

                    return Array.from(groupedMap.entries()).map(([name, lines]) => {
                      let totalRemainingQty = 0
                      let totalCalculatingQty = 0
                      for (const l of lines) {
                        const paidQty = paidLineQtys[l.id] || 0
                        const remainingQty = Math.max(0, l.quantity - paidQty)
                        const currentQty = calculatingLineQtys[l.id] || 0
                        totalRemainingQty += remainingQty
                        totalCalculatingQty += currentQty
                      }

                      if (totalRemainingQty === 0) return null

                      const firstLine = lines[0]
                      const unitPrice = getItemUnitPrice(firstLine.id)

                      const handleGroupIncrement = () => {
                        for (const l of lines) {
                          const paidQty = paidLineQtys[l.id] || 0
                          const remainingQty = Math.max(0, l.quantity - paidQty)
                          const currentQty = calculatingLineQtys[l.id] || 0
                          if (currentQty < remainingQty) {
                            updateCalculatingQty(l.id, 1)
                            break
                          }
                        }
                      }

                      const handleGroupDecrement = () => {
                        for (let i = lines.length - 1; i >= 0; i--) {
                          const l = lines[i]
                          const currentQty = calculatingLineQtys[l.id] || 0
                          if (currentQty > 0) {
                            updateCalculatingQty(l.id, -1)
                            break
                          }
                        }
                      }

                      return (
                        <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px dashed #ced4da' }}>
                          <div style={{ flex: 1, minWidth: 0, paddingRight: '16px' }}>
                            <div style={{ fontSize: '1.2rem', color: '#333', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '4px' }}>
                              {name}
                            </div>
                            <div style={{ fontSize: '1rem', color: '#868e96' }}>
                              {yen(unitPrice)} <span style={{ fontSize: '0.9rem' }}>(残 {totalRemainingQty} 個)</span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <button
                              onClick={handleGroupDecrement}
                              disabled={totalCalculatingQty === 0}
                              style={{
                                width: '44px',
                                height: '44px',
                                borderRadius: '8px',
                                background: totalCalculatingQty === 0 ? '#f1f3f5' : 'white',
                                border: totalCalculatingQty === 0 ? '1px solid #e9ecef' : '1px solid #ced4da',
                                boxShadow: totalCalculatingQty === 0 ? 'none' : '0 2px 4px rgba(0,0,0,0.05)',
                                cursor: totalCalculatingQty === 0 ? 'default' : 'pointer',
                                fontSize: '1.5rem',
                                color: totalCalculatingQty === 0 ? '#adb5bd' : '#495057',
                              }}
                            >
                              -
                            </button>
                            <span style={{ fontSize: '1.5rem', fontWeight: 'bold', width: '32px', textAlign: 'center', color: totalCalculatingQty > 0 ? '#333' : '#adb5bd' }}>{totalCalculatingQty}</span>
                            <button
                              onClick={handleGroupIncrement}
                              disabled={totalCalculatingQty >= totalRemainingQty}
                              style={{
                                width: '44px',
                                height: '44px',
                                borderRadius: '8px',
                                background: totalCalculatingQty >= totalRemainingQty ? '#f1f3f5' : 'white',
                                border: totalCalculatingQty >= totalRemainingQty ? '1px solid #e9ecef' : '1px solid #ced4da',
                                boxShadow: totalCalculatingQty >= totalRemainingQty ? 'none' : '0 2px 4px rgba(0,0,0,0.05)',
                                cursor: totalCalculatingQty >= totalRemainingQty ? 'default' : 'pointer',
                                fontSize: '1.5rem',
                                color: totalCalculatingQty >= totalRemainingQty ? '#adb5bd' : '#495057',
                              }}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      )
                    })
                  })()}
                </div>
                <div style={{ padding: '24px', borderTop: '1px solid #dee2e6', background: 'white', flexShrink: 0, borderRadius: '0 0 16px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <span style={{ fontSize: '1.3rem', color: '#666' }}>選択合計:</span>
                    <span style={{ fontSize: '2.8rem', fontWeight: 'bold', color: '#ff5a5f' }}>{yen(currentItemizedTotal)}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <button
                      style={{ flex: 1, background: '#fff5f5', color: '#f03e3e', border: '1px solid #ffc9c9', padding: '20px', borderRadius: '12px', fontSize: '1.3rem', fontWeight: 'bold', cursor: 'pointer' }}
                      onClick={() => updateCalculatingQty('__clear__', 0)}
                    >
                      クリア
                    </button>
                    <button
                      style={{
                        flex: 2,
                        background: '#4dabf7',
                        color: 'white',
                        padding: '20px',
                        borderRadius: '12px',
                        fontSize: '1.4rem',
                        fontWeight: 'bold',
                        border: 'none',
                        cursor: currentItemizedTotal > 0 ? 'pointer' : 'default',
                        opacity: currentItemizedTotal > 0 ? 1 : 0.6,
                        boxShadow: currentItemizedTotal > 0 ? '0 4px 12px rgba(77,171,247,0.3)' : 'none',
                      }}
                      disabled={currentItemizedTotal <= 0}
                      onClick={() => {
                        processItemizedCalculation()
                        setCalcMode('normal')
                        setInputSource('modal')
                      }}
                    >
                      この金額をテンキー入力
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
