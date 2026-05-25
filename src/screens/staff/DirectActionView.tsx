import React from 'react'
import { TicketSummaryView } from '../../types'

type DirectActionViewProps = {
  directAction: 'HANDY' | 'PAYMENT'
  liveTicketSummaries: TicketSummaryView[]
  onSelectTicket: (ticketId: string) => void
  onClearDirectAction: () => void
  setShowHandyModal: (val: boolean) => void
  setShowPaymentModal: (val: boolean) => void
  yen: (val: number) => string
}

export function DirectActionView({
  directAction,
  liveTicketSummaries,
  onSelectTicket,
  onClearDirectAction,
  setShowHandyModal,
  setShowPaymentModal,
  yen,
}: DirectActionViewProps) {
  return (
    <div
      className="staff-app dark-mode"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: '#212529',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px',
        zIndex: 9999,
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          borderBottom: '1px solid #495057',
          paddingBottom: '24px',
        }}
      >
        <h2 style={{ color: 'white', fontSize: '2rem', fontWeight: 'bold' }}>
          {directAction === 'HANDY' ? '📝 追加注文(Handy)' : '💳 会計(Payment)'}：対象のテーブルを選んでください
        </h2>
        <button
          onClick={onClearDirectAction}
          style={{
            padding: '16px 32px',
            fontSize: '1.2rem',
            borderRadius: '8px',
            border: '1px solid #868e96',
            background: 'transparent',
            color: '#ced4da',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          ✕ キャンセル
        </button>
      </div>

      {liveTicketSummaries.length === 0 ? (
        <div style={{ padding: '64px', textAlign: 'center', color: '#868e96', fontSize: '1.5rem' }}>現在稼働中のテーブルはありません</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '24px' }}>
          {liveTicketSummaries.map((t) => (
            <button
              key={t.ticketId}
              onClick={() => {
                onSelectTicket(t.ticketId)
                if (directAction === 'HANDY') setShowHandyModal(true)
                if (directAction === 'PAYMENT') setShowPaymentModal(true)
                onClearDirectAction()
              }}
              style={{
                background: '#343a40',
                border: `3px solid ${t.status === 'NEW' ? '#f03e3e' : t.status === 'COOKING' ? '#fd7e14' : '#495057'}`,
                borderRadius: '16px',
                padding: '24px',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px',
                boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
                transition: 'transform 0.1s',
              }}
              onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.97)')}
              onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <div style={{ fontSize: '3rem', fontWeight: 'bold' }}>{t.tableName}</div>
              <div style={{ display: 'flex', gap: '12px', fontSize: '1.2rem', color: '#adb5bd' }}>
                <span>{t.orderedAt}</span>
                <span>({t.lineCount}点)</span>
              </div>
              <div style={{ fontSize: '1.5rem', color: '#51cf66', fontWeight: 'bold', marginTop: '8px' }}>{yen(t.subtotal)}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
