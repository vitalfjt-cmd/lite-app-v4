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
          <h2>Application Launcher</h2>
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
                  <div className="launcher-icon">{getIcon(view.id)}</div>
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
                  <div className="launcher-icon">{getIcon(view.id)}</div>
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

function getIcon(view: AppView) {
  switch (view) {
    case 'customer': return '📱'
    case 'cust-tablet': return '📱'
    case 'staff': return '🖥️'
    case 'kds': return '🔥'
    case 'admin': return '⚙️'
    case 'sales': return '📊'
    case 'handy': return '📝'
    default: return '🚀'
  }
}
