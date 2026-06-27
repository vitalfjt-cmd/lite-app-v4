import type { AppView } from '../types'
import { VIEWS } from '../constants'
import { FormEventHandler } from 'react'

type LoginCandidate = {
  email: string
  displayName: string
  roleType: 'ADMIN' | 'STAFF' | 'KDS'
}

type LauncherProps = {
  isOpen: boolean
  onClose: () => void
  currentView: AppView
  onMove: (view: AppView) => void
  onSignOut: () => void
  session: unknown | null
  email: string
  password: string
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onSignIn: FormEventHandler<HTMLFormElement>
  authBusy: boolean
  error: string | null
  loginCandidates: LoginCandidate[]
  onPickLoginCandidate: (email: string) => void
}

export function AppLauncher({
  isOpen,
  onClose,
  currentView,
  onMove,
  onSignOut,
  session,
  email,
  password,
  onEmailChange,
  onPasswordChange,
  onSignIn,
  authBusy,
  error,
  loginCandidates,
  onPickLoginCandidate,
}: LauncherProps) {
  if (!isOpen) return null

  return (
    <div className="launcher-overlay" onClick={onClose}>
      <div className="launcher-content" onClick={(e) => e.stopPropagation()}>
        <div className="launcher-header">
          <h2>
            オーナー{"\n"}
            POS 2{"\n"}
            Demo
          </h2>
          <button className="launcher-close" onClick={onClose}>&times;</button>
        </div>
        
        {session ? (
          <>
            <div className="launcher-grid">
              {VIEWS.map((view) => (
                <button
                  key={view.id}
                  className={`launcher-item ${currentView === view.id ? 'active' : ''}`}
                  onClick={() => {
                    onMove(view.id)
                    onClose()
                  }}
                >
                  <div className="launcher-icon">{getIcon(view.id, currentView === view.id)}</div>
                  <div className="launcher-info">
                    <span className="launcher-label">{view.label}</span>
                    <span className="launcher-caption">{view.caption}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="launcher-footer">
              <button className="launcher-auth-button signout" onClick={() => { onSignOut(); onClose(); }}>
                Sign Out
              </button>
            </div>
          </>
        ) : (
          <div className="launcher-auth-box">
            <h3>Staff Login</h3>
            {loginCandidates.length > 0 && (
              <div className="field">
                <span>Quick Select</span>
                <select 
                  onChange={(e) => onPickLoginCandidate(e.target.value)}
                  value={loginCandidates.some(c => c.email === email) ? email : ''}
                >
                  <option value="">Select a staff member</option>
                  {loginCandidates.map(c => (
                    <option key={c.email} value={c.email}>{c.displayName} ({c.roleType})</option>
                  ))}
                </select>
              </div>
            )}
            <form className="auth-form" onSubmit={(e) => { e.preventDefault(); onSignIn(e); }}>
              <label className="field">
                <span>Email</span>
                <input value={email} onChange={e => onEmailChange(e.target.value)} type="email" required />
              </label>
              <label className="field">
                <span>Password</span>
                <input value={password} onChange={e => onPasswordChange(e.target.value)} type="password" required />
              </label>
              {error && <p className="notice error">{error}</p>}
              <button className="primary-button large" disabled={authBusy} type="submit">
                {authBusy ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
            <div className="launcher-grid" style={{ marginTop: '24px', opacity: 0.5 }}>
               {/* Show customer views even when not logged in */}
               {VIEWS.filter(v => v.id.startsWith('cust')).map((view) => (
                <button
                  key={view.id}
                  className={`launcher-item ${currentView === view.id ? 'active' : ''}`}
                  onClick={() => {
                    onMove(view.id)
                    onClose()
                  }}
                >
                  <div className="launcher-icon">{getIcon(view.id, currentView === view.id)}</div>
                  <div className="launcher-info">
                    <span className="launcher-label">{view.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function getIcon(view: AppView, active: boolean) {
  switch (view) {
    case 'customer':
      return (
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="10" y="2" width="20" height="36" rx="4" fill="#ffffff" stroke="#333333" strokeWidth="2" />
          <rect x="13" y="5" width="14" height="25" fill="#f1f3f5" stroke="#333333" strokeWidth="1.5" />
          <text x="20" y="20" fontSize="6.5" fontWeight="bold" fontFamily="system-ui, sans-serif" textAnchor="middle" fill="#333333">注文</text>
          <line x1="17" y1="3.5" x2="23" y2="3.5" stroke="#333333" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="20" cy="34" r="1.5" fill={active ? "#1b813e" : "#868e96"} />
          <circle cx="16" cy="34" r="1" fill={active ? "#495057" : "#adb5bd"} />
          <circle cx="24" cy="34" r="1" fill={active ? "#495057" : "#adb5bd"} />
        </svg>
      )
    case 'cust-tablet':
      return (
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="6" width="34" height="28" rx="4" fill="#ffffff" stroke="#333333" strokeWidth="2" />
          <rect x="6" y="9" width="28" height="22" fill="#f1f3f5" stroke="#333333" strokeWidth="1.5" />
          <text x="20" y="22" fontSize="7.5" fontWeight="bold" fontFamily="system-ui, sans-serif" textAnchor="middle" fill="#333333">注文</text>
          <circle cx="4.5" cy="20" r="0.75" fill="#333333" />
          <circle cx="35.5" cy="20" r="1" fill={active ? "#1b813e" : "#868e96"} />
        </svg>
      )
    case 'staff':
      return (
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 6h16v24H12z" fill="#ffffff" stroke="#333333" strokeWidth="1.5" transform="rotate(-6 20 18)" />
          <path d="M9 9h16v24H9z" fill="#ffffff" stroke="#333333" strokeWidth="1.5" />
          <line x1="13" y1="15" x2="21" y2="15" stroke={active ? "#1b813e" : "#868e96"} strokeWidth="1.5" strokeLinecap="round" />
          <line x1="13" y1="20" x2="21" y2="20" stroke={active ? "#1b813e" : "#868e96"} strokeWidth="1.5" strokeLinecap="round" />
          <line x1="13" y1="25" x2="18" y2="25" stroke={active ? "#1b813e" : "#868e96"} strokeWidth="1.5" strokeLinecap="round" />
          <rect x="14" y="6" width="6" height="4" rx="1" fill="#ced4da" stroke="#333" strokeWidth="1.5" />
          <g transform="translate(24, 18) rotate(45)">
            <rect x="-2" y="-12" width="4" height="16" fill={active ? "#228be6" : "#868e96"} stroke="#333333" strokeWidth="1.5" rx="1" />
            <path d="M-2 -12 L0 -16 L2 -12 Z" fill="#ffec99" stroke="#333333" strokeWidth="1" />
            <path d="M-1 -14 L0 -16 L1 -14 Z" fill="#333333" />
            <rect x="-2" y="2" width="4" height="2" fill="#e03131" stroke="#333333" strokeWidth="1" />
          </g>
        </svg>
      )
    case 'kds':
      return (
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 32h10l-2-4h-6z" fill="#ced4da" stroke="#333333" strokeWidth="2" strokeLinejoin="round" />
          <rect x="19" y="26" width="2" height="4" fill="#868e96" stroke="#333333" strokeWidth="1.5" />
          <rect x="4" y="6" width="32" height="22" rx="2" fill="#ffffff" stroke="#333333" strokeWidth="2" />
          <rect x="6" y="8" width="28" height="18" fill="#f8f9fa" />
          <rect x="8" y="10" width="7" height="3" rx="0.5" fill={active ? "#fa5252" : "#868e96"} />
          <line x1="8" y1="15" x2="14" y2="15" stroke="#333333" strokeWidth="1" />
          <line x1="8" y1="17" x2="12" y2="17" stroke="#333333" strokeWidth="1" />

          <rect x="17" y="10" width="7" height="3" rx="0.5" fill={active ? "#12b886" : "#868e96"} />
          <line x1="17" y1="15" x2="23" y2="15" stroke="#333333" strokeWidth="1" />
          <line x1="17" y1="17" x2="21" y2="17" stroke="#333333" strokeWidth="1" />

          <rect x="26" y="10" width="6" height="3" rx="0.5" fill={active ? "#228be6" : "#868e96"} />
          <line x1="26" y1="15" x2="31" y2="15" stroke="#333333" strokeWidth="1" />
          <line x1="26" y1="17" x2="29" y2="17" stroke="#333333" strokeWidth="1" />
        </svg>
      )
    case 'admin':
      return (
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(16, 24)">
            <rect x="-3" y="-11" width="6" height="22" rx="1" fill={active ? "#74c0fc" : "#ced4da"} stroke="#333333" strokeWidth="1.5" />
            <rect x="-3" y="-11" width="6" height="22" rx="1" fill={active ? "#74c0fc" : "#ced4da"} stroke="#333333" strokeWidth="1.5" transform="rotate(30)" />
            <rect x="-3" y="-11" width="6" height="22" rx="1" fill={active ? "#74c0fc" : "#ced4da"} stroke="#333333" strokeWidth="1.5" transform="rotate(60)" />
            <rect x="-3" y="-11" width="6" height="22" rx="1" fill={active ? "#74c0fc" : "#ced4da"} stroke="#333333" strokeWidth="1.5" transform="rotate(90)" />
            <rect x="-3" y="-11" width="6" height="22" rx="1" fill={active ? "#74c0fc" : "#ced4da"} stroke="#333333" strokeWidth="1.5" transform="rotate(120)" />
            <rect x="-3" y="-11" width="6" height="22" rx="1" fill={active ? "#74c0fc" : "#ced4da"} stroke="#333333" strokeWidth="1.5" transform="rotate(150)" />
            <circle cx="0" cy="0" r="8" fill={active ? "#74c0fc" : "#ced4da"} stroke="#333333" strokeWidth="1.5" />
            <circle cx="0" cy="0" r="3" fill="#ffffff" stroke="#333333" strokeWidth="1.5" />
          </g>
          <g transform="translate(28, 14)">
            <rect x="-2" y="-8" width="4" height="16" rx="0.8" fill={active ? "#a5d8ff" : "#e9ecef"} stroke="#333333" strokeWidth="1.5" />
            <rect x="-2" y="-8" width="4" height="16" rx="0.8" fill={active ? "#a5d8ff" : "#e9ecef"} stroke="#333333" strokeWidth="1.5" transform="rotate(45)" />
            <rect x="-2" y="-8" width="4" height="16" rx="0.8" fill={active ? "#a5d8ff" : "#e9ecef"} stroke="#333333" strokeWidth="1.5" transform="rotate(90)" />
            <rect x="-2" y="-8" width="4" height="16" rx="0.8" fill={active ? "#a5d8ff" : "#e9ecef"} stroke="#333333" strokeWidth="1.5" transform="rotate(135)" />
            <circle cx="0" cy="0" r="5.5" fill={active ? "#a5d8ff" : "#e9ecef"} stroke="#333333" strokeWidth="1.5" />
            <circle cx="0" cy="0" r="2" fill="#ffffff" stroke="#333333" strokeWidth="1.5" />
          </g>
        </svg>
      )
    case 'sales':
      return (
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 32h28" stroke="#333333" strokeWidth="2" strokeLinecap="round" />
          <rect x="9" y="20" width="5" height="12" fill={active ? "#4dabf7" : "#adb5bd"} stroke="#333333" strokeWidth="1.5" />
          <rect x="17" y="14" width="5" height="18" fill={active ? "#40c057" : "#adb5bd"} stroke="#333333" strokeWidth="1.5" />
          <rect x="25" y="24" width="5" height="8" fill={active ? "#ff8787" : "#adb5bd"} stroke="#333333" strokeWidth="1.5" />
          <path d="M9 26l8-8 8 4 6-12" fill="none" stroke={active ? "#fab005" : "#495057"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="9" cy="26" r="2" fill={active ? "#fab005" : "#ffffff"} stroke="#333333" strokeWidth="1.5" />
          <circle cx="17" cy="18" r="2" fill={active ? "#fab005" : "#ffffff"} stroke="#333333" strokeWidth="1.5" />
          <circle cx="25" cy="22" r="2" fill={active ? "#fab005" : "#ffffff"} stroke="#333333" strokeWidth="1.5" />
          <circle cx="31" cy="10" r="2" fill={active ? "#fab005" : "#ffffff"} stroke="#333333" strokeWidth="1.5" />
        </svg>
      )
    case 'handy':
      return (
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 8h20v24H10z" fill="#ffffff" stroke="#333333" strokeWidth="2" />
          <line x1="14" y1="14" x2="26" y2="14" stroke={active ? "#cc5de8" : "#868e96"} strokeWidth="2" strokeLinecap="round" />
          <line x1="14" y1="20" x2="26" y2="20" stroke={active ? "#cc5de8" : "#868e96"} strokeWidth="2" strokeLinecap="round" />
          <line x1="14" y1="26" x2="22" y2="26" stroke={active ? "#cc5de8" : "#868e96"} strokeWidth="2" strokeLinecap="round" />
        </svg>
      )
    default:
      return (
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 6s-6 8-6 16c0 3.3 2.7 6 6 6s6-2.7 6-6c0-8-6-16-6-16z" fill={active ? "#ff922b" : "#ced4da"} stroke="#333333" strokeWidth="2" />
          <path d="M17 28l-3 4h6l-3-4z" fill="#ff922b" stroke="#333333" strokeWidth="1.5" />
          <path d="M23 28l3 4h-6l3-4z" fill="#ff922b" stroke="#333333" strokeWidth="1.5" />
        </svg>
      )
  }
}
