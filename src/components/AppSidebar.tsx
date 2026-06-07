import { useEffect, useState } from 'react'
import type { FormEventHandler } from 'react'
import type { AppView } from '../types'

type SidebarView = {
  id: AppView
  label: string
  caption: string
}

type LoginCandidate = {
  email: string
  displayName: string
  roleType: 'ADMIN' | 'STAFF' | 'KDS'
}

type SidebarProps = {
  view: AppView
  views: SidebarView[]
  session: { user: unknown } | null
  authEnabled: boolean
  authModeLabel: string
  publicMenuReady: boolean
  loginCandidates: LoginCandidate[]
  email: string
  password: string
  authBusy: boolean
  profile: {
    display_name: string
    role_type: 'ADMIN' | 'STAFF' | 'KDS'
  } | null
  liveStoreName: string
  error: string | null
  onMove: (view: AppView) => void
  onPickLoginCandidate: (email: string) => void
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onSignIn: FormEventHandler<HTMLFormElement>
  onSignOut: () => void
  onDirectAction?: (action: 'HANDY' | 'PAYMENT') => void
}

function roleLabel(roleType: 'ADMIN' | 'STAFF' | 'KDS') {
  if (roleType === 'ADMIN') return 'Admin'
  if (roleType === 'KDS') return 'KDS'
  return 'Staff'
}

export function AppSidebar({
  view,
  views,
  session,
  authEnabled,
  authModeLabel,
  publicMenuReady,
  loginCandidates,
  email,
  password,
  authBusy,
  profile,
  liveStoreName,
  error,
  onMove,
  onPickLoginCandidate,
  onEmailChange,
  onPasswordChange,
  onSignIn,
  onSignOut,
  onDirectAction,
}: SidebarProps) {
  const [showStatusPanel, setShowStatusPanel] = useState(false)
  const activeView = views.find((item) => item.id === view)
  const visibleViews = (view === 'customer' || view === 'cust-tablet') ? views : views.filter((item) => item.id !== 'customer' && item.id !== 'cust-tablet')

  useEffect(() => {
    setShowStatusPanel(false)
  }, [session])

  useEffect(() => {
    if (!showStatusPanel) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowStatusPanel(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showStatusPanel])

  const getBtnStyle = (isActive: boolean, activeColor: string) => ({
    padding: '8px 20px',
    background: isActive ? activeColor : '#2c2c2c',
    color: '#fff',
    border: 'none',
    borderRadius: '20px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '0.95rem',
    transition: 'all 0.2s',
    boxShadow: isActive ? `0 2px 8px ${activeColor}40` : 'none',
    whiteSpace: 'nowrap' as const,
  })

  return (
    <header className={`topbar ${(view === 'customer' || view === 'cust-tablet') ? 'hidden-on-customer' : ''}`}>
      <div className="topbar-header" style={{ 
        background: '#1a1a1a', 
        padding: '12px 24px', 
        display: 'flex', 
        alignItems: 'center',
        gap: '12px',
        borderBottom: '1px solid #333',
        borderRadius: 0,
        boxShadow: 'none',
        flexWrap: 'wrap',
      }}>
        <span style={{ color: '#888', fontWeight: 'bold', marginRight: '16px', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Lite POS
        </span>
        
        <button style={getBtnStyle(view === 'customer', '#ff5a5f')} onClick={() => onMove('customer')}>
          📱 Cust(Mobile)
        </button>
        <button style={getBtnStyle(view === 'cust-tablet', '#ff5a5f')} onClick={() => onMove('cust-tablet')}>
          📱 Cust(Tablet)
        </button>
        <button style={getBtnStyle(view === 'staff', '#4dabf7')} onClick={() => onMove('staff')}>
          🖥️ Staff
        </button>
        <button style={getBtnStyle(false, '#cc5de8')} onClick={() => onDirectAction?.('HANDY')}>
          📝 Handy
        </button>
        <button style={getBtnStyle(view === 'kds', '#fd7e14')} onClick={() => onMove('kds')}>
          🔥 KDS
        </button>
        <button style={getBtnStyle(false, '#51cf66')} onClick={() => onDirectAction?.('PAYMENT')}>
          💳 Payment
        </button>
        <button style={getBtnStyle(view === 'admin', '#adb5bd')} onClick={() => onMove('admin')}>
          ⚙️ Admin
        </button>

        <div style={{ flex: 1, minWidth: '20px' }}></div>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginRight: '16px' }}>
          <span style={{ color: '#aaa', fontSize: '0.75rem' }}>{liveStoreName}</span>
          {profile && <span style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 'bold' }}>{profile.display_name}</span>}
        </div>

        <button
          className="secondary-button topbar-login"
          data-testid="sidebar-login-toggle"
          onClick={() => setShowStatusPanel((current) => !current)}
          type="button"
          style={{ background: session ? '#333' : '#fff', color: session ? '#fff' : '#000', border: 'none', borderRadius: '20px', padding: '8px 24px', fontWeight: 'bold' }}
        >
          {session ? 'ログアウト' : 'ログイン'}
        </button>
      </div>

      {showStatusPanel ? (
        <div className="sidebar-modal-backdrop" role="presentation">
          <section className="status-card modal" data-testid="sidebar-login-panel" onClick={(event) => event.stopPropagation()}>
            <div className="sidebar-modal-head">
              <div>
                <p className="eyebrow">STAFF LOGIN</p>
                <h2 className="section-title">認証とログイン</h2>
              </div>
              <button className="secondary-button topbar-login" onClick={() => setShowStatusPanel(false)} type="button">
                閉じる
              </button>
            </div>

            <div className="badge-row compact-badges">
              <span className="badge soft" data-testid="sidebar-auth-status">
                {session ? 'ログイン中' : '未ログイン'}
              </span>
              <span className="badge soft" data-testid="sidebar-auth-busy">
                {authBusy ? '認証処理中' : '待機中'}
              </span>
              {publicMenuReady ? <span className="badge accent">公開メニュー確認済み</span> : null}
            </div>

            {loginCandidates.length > 0 ? (
              <label className="field">
                <span>候補から選ぶ</span>
                <select
                  data-testid="sidebar-login-candidate-select"
                  onChange={(event) => {
                    if (!event.target.value) return
                    onPickLoginCandidate(event.target.value)
                  }}
                  value={loginCandidates.some((candidate) => candidate.email === email) ? email : ''}
                >
                  <option value="">選択してください</option>
                  {loginCandidates.map((candidate) => (
                    <option key={candidate.email} value={candidate.email}>
                      {candidate.displayName} / {roleLabel(candidate.roleType)} / {candidate.email}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            <div className="auth-form" data-testid="sidebar-login-form">
              <label className="field">
                <span>メールアドレス</span>
                <input data-testid="sidebar-login-email" value={email} onChange={(event) => onEmailChange(event.target.value)} type="email" />
              </label>
              <label className="field">
                <span>パスワード</span>
                <input data-testid="sidebar-login-password" value={password} onChange={(event) => onPasswordChange(event.target.value)} type="password" onKeyDown={(e) => { if (e.key === 'Enter') onSignIn(e as any) }} />
              </label>
              <div className="button-row">
                <button className="primary-button" data-testid="sidebar-login-submit" disabled={authBusy || !authEnabled} onClick={(e) => onSignIn(e as any)} type="button">
                  {authBusy ? 'ログイン中...' : 'ログイン'}
                </button>
                <button className="secondary-button" data-testid="sidebar-login-signout" disabled={authBusy || !session} onClick={onSignOut} type="button">
                  ログアウト
                </button>
              </div>
            </div>

            {profile ? (
              <dl className="key-value">
                <div>
                  <dt>表示名</dt>
                  <dd data-testid="sidebar-profile-name">{profile.display_name}</dd>
                </div>
                <div>
                  <dt>ロール</dt>
                  <dd data-testid="sidebar-profile-role">{profile.role_type}</dd>
                </div>
                <div>
                  <dt>店舗</dt>
                  <dd data-testid="sidebar-profile-store">{liveStoreName}</dd>
                </div>
              </dl>
            ) : (
              <p className="muted">Customer 画面は未ログインでも確認できます。</p>
            )}

            {error ? (
              <p className="notice error" data-testid="sidebar-login-error">
                {error}
              </p>
            ) : null}
          </section>
        </div>
      ) : null}
    </header>
  )
}
