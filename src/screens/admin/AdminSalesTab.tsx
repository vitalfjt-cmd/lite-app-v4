import React, { useState, useEffect } from 'react'
import { openStaffBusinessDay, closeStaffBusinessDay, getStaffSalesReport, voidStaffTicket } from '../../lib/staffReadApi'

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
  
  const [voidReceiptNo, setVoidReceiptNo] = useState('')
  const [voidPaymentType, setVoidPaymentType] = useState<string>('')

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

  const handleVoid = async () => {
    if (!voidReceiptNo) return
    if (!window.confirm(`レシート番号 ${voidReceiptNo} の伝票を処理しますか？\n会計種別の変更が未選択の場合はVOID（取消）になります。`)) return
    setLoading(true)
    try {
      await voidStaffTicket(storeSlug, voidReceiptNo, voidPaymentType ? (voidPaymentType as any) : null)
      setAdminMessage('VOID処理が完了しました')
      setVoidReceiptNo('')
      setVoidPaymentType('')
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

      <div style={{ padding: '24px', background: 'white', borderRadius: '12px', border: '1px solid #dee2e6', marginBottom: '24px' }}>
        <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '1.2rem', color: '#343a40' }}>VOID・会計変更</h3>
        <p style={{ color: '#868e96', fontSize: '0.9rem', marginBottom: '16px' }}>
          レシート番号を入力して会計の取消、または会計種別の変更を行います。
        </p>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <input 
            type="text" 
            placeholder="レシート番号" 
            value={voidReceiptNo} 
            onChange={e => setVoidReceiptNo(e.target.value)}
            style={{ padding: '12px', border: '1px solid #ced4da', borderRadius: '8px', fontSize: '1rem', width: '200px' }}
          />
          <select 
            value={voidPaymentType} 
            onChange={e => setVoidPaymentType(e.target.value)}
            style={{ padding: '12px', border: '1px solid #ced4da', borderRadius: '8px', fontSize: '1rem', width: '200px' }}
          >
            <option value="">（選択なし：VOID取消）</option>
            <option value="CASH">現金 に変更</option>
            <option value="CARD">クレジットカード に変更</option>
            <option value="OTHER">その他 に変更</option>
          </select>
          <button 
            className="primary-button" 
            style={{ background: voidPaymentType ? '#4dabf7' : '#fa5252' }} 
            disabled={disabled || loading || !voidReceiptNo} 
            onClick={handleVoid}
          >
            {voidPaymentType ? '会計種別を変更' : 'VOID取消を実行'}
          </button>
        </div>
      </div>

      {report && (
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, padding: '24px', background: 'white', borderRadius: '12px', border: '1px solid #dee2e6' }}>
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

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ padding: '24px', background: 'white', borderRadius: '12px', border: '1px solid #dee2e6' }}>
              <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '1.2rem', color: '#343a40' }}>時間帯別売上</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #f1f3f5', color: '#868e96' }}>時間</th>
                    <th style={{ padding: '8px', textAlign: 'right', borderBottom: '2px solid #f1f3f5', color: '#868e96' }}>売上</th>
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

            <div style={{ padding: '24px', background: 'white', borderRadius: '12px', border: '1px solid #dee2e6' }}>
              <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '1.2rem', color: '#343a40' }}>商品別注文数</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #f1f3f5', color: '#868e96' }}>商品名</th>
                    <th style={{ padding: '8px', textAlign: 'right', borderBottom: '2px solid #f1f3f5', color: '#868e96' }}>数量</th>
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
        </div>
      )}
    </div>
  )
}
