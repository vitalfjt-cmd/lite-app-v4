import React, { useState } from 'react'

type Props = {
  isOpen: boolean
  onClose: () => void
  openBusinessDate?: string | null
  todayBusinessDate?: string | null
  onProceedWithPreviousDate: () => void
  onRolloverAndProceed: () => Promise<void>
  disabled?: boolean
}

export function BusinessDateRolloverModal({
  isOpen,
  onClose,
  openBusinessDate,
  todayBusinessDate,
  onProceedWithPreviousDate,
  onRolloverAndProceed,
  disabled = false,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleRollover = async () => {
    setLoading(true)
    setError(null)
    try {
      await onRolloverAndProceed()
    } catch (err: any) {
      const msg = err.message || String(err)
      if (msg.includes('open_tickets_exist')) {
        setError('未会計の伝票が残っているため、前日を締め処理できません。残りの伝票を会計するか、前日の営業日のまま起票してください。')
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop" style={{ zIndex: 99999 }}>
      <div
        className="modal-card"
        style={{
          maxWidth: '540px',
          width: '90%',
          padding: '32px 28px',
          borderRadius: '20px',
          boxShadow: '0 20px 45px rgba(0, 0, 0, 0.25)',
          background: '#ffffff',
          border: '2px solid #ffe066',
        }}
      >
        <div
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: '#fff9db',
            color: '#f59f00',
            fontSize: '30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          ⚠️
        </div>

        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1e293b', margin: '0 0 10px 0', textAlign: 'center' }}>
          営業日付の切替時刻を経過しています
        </h2>

        <p style={{ fontSize: '0.92rem', color: '#495057', lineHeight: 1.6, margin: '0 0 20px 0', textAlign: 'center' }}>
          前日の営業日（<strong>{openBusinessDate || '未設定'}</strong>）のまま営業中ですが、<br />
          システム日付はすでに「<strong>{todayBusinessDate || '未設定'}</strong>」に達しています。<br />
          どちらの営業日として伝票を発行しますか？
        </p>

        {error && (
          <div style={{
            background: '#fff5f5',
            border: '1px solid #ffc9c9',
            borderRadius: '10px',
            color: '#e03131',
            padding: '12px 16px',
            fontSize: '0.88rem',
            lineHeight: 1.5,
            marginBottom: '20px',
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
          {/* 選択肢1: 本日の営業を開始して起票 */}
          <button
            type="button"
            disabled={disabled || loading}
            onClick={handleRollover}
            style={{
              padding: '16px 20px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #228be6 0%, #1c7ed6 100%)',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              boxShadow: '0 4px 12px rgba(34, 139, 230, 0.3)',
              transition: 'transform 0.1s, box-shadow 0.1s',
            }}
          >
            <div style={{ fontSize: '1.05rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>☀️</span>
              <span>本日（{todayBusinessDate}）の営業を開始して発行</span>
            </div>
            <span style={{ fontSize: '0.82rem', opacity: 0.9, marginLeft: '28px' }}>
              前日を自動で締め処理（閉店）し、本日の伝票として発行します
            </span>
          </button>

          {/* 選択肢2: 前日の営業のまま起票 */}
          <button
            type="button"
            disabled={disabled || loading}
            onClick={() => {
              onProceedWithPreviousDate()
              onClose()
            }}
            style={{
              padding: '16px 20px',
              borderRadius: '14px',
              background: '#f8f9fa',
              color: '#343a40',
              border: '2px solid #dee2e6',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              transition: 'background 0.1s',
            }}
          >
            <div style={{ fontSize: '1.05rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🌙</span>
              <span>前日（{openBusinessDate}）の営業日のまま発行</span>
            </div>
            <span style={{ fontSize: '0.82rem', color: '#868e96', marginLeft: '28px' }}>
              深夜営業などの延長として、前日付けで伝票を発行します
            </span>
          </button>
        </div>

        <div style={{ textAlign: 'center' }}>
          <button
            type="button"
            disabled={disabled || loading}
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#868e96',
              fontSize: '0.9rem',
              cursor: 'pointer',
              padding: '8px 16px',
            }}
          >
            発行を中止して戻る
          </button>
        </div>
      </div>
    </div>
  )
}

