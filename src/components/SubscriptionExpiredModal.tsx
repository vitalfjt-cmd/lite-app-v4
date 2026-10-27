import React from 'react'

type Props = {
  isOpen: boolean
  onClose: () => void
  onNavigateToBilling: () => void
  statusReason?: 'expired' | 'canceled' | string
}

export function SubscriptionExpiredModal({
  isOpen,
  onClose,
  onNavigateToBilling,
  statusReason = 'expired',
}: Props) {
  if (!isOpen) return null

  const isCanceled = statusReason === 'canceled'

  return (
    <div className="modal-backdrop subscription-expired-modal-backdrop" style={{ zIndex: 99999 }}>
      <div
        className="modal-card subscription-expired-modal"
        style={{
          maxWidth: '520px',
          padding: '32px 28px',
          borderRadius: '24px',
          textAlign: 'center',
          boxShadow: '0 20px 45px rgba(0, 0, 0, 0.25)',
          background: '#ffffff',
          border: '2px solid #fecaca',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: '#fee2e2',
            color: '#dc2626',
            fontSize: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          🔒
        </div>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e293b', margin: '0 0 10px 0' }}>
          {isCanceled ? '契約が解約されています' : '無料トライアル・ご利用期間が終了しました'}
        </h2>

        <p style={{ fontSize: '0.92rem', color: '#64748b', lineHeight: 1.6, margin: '0 0 24px 0' }}>
          {isCanceled
            ? '月額サブスクリプションの解約が完了しているため、新規注文の受付およびテンキー会計機能が一時的に制限されています。'
            : '無料トライアル期間、または月額契約の有効期限が終了したため、注文受付および会計機能が一時的に停止しています。'}
          <br />
          引き続きシステムをご利用いただくには、Liteプランのお申し込み（¥2,980/月）をお願いいたします。
        </p>

        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '14px',
            padding: '16px',
            marginBottom: '24px',
            textAlign: 'left',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>Lite プラン (月額払い)</span>
            <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#15803d' }}>¥2,980 / 月</span>
          </div>
          <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
            お客様スマホQR注文、厨房KDS、伝票管理、テンキー会計などすべての基本機能が即座に再開されます。
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            type="button"
            className="primary-button"
            style={{
              padding: '14px 20px',
              fontSize: '1.02rem',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(22, 163, 74, 0.35)',
            }}
            onClick={() => {
              onClose()
              onNavigateToBilling()
            }}
          >
            💳 プラン・契約管理（Stripe決済）へ進む
          </button>

          <button
            type="button"
            className="secondary-button"
            style={{
              padding: '10px 16px',
              fontSize: '0.9rem',
              color: '#64748b',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
            onClick={onClose}
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  )
}
