import React, { useState } from 'react'

interface LoginScreenProps {
  email: string
  onEmailChange: (val: string) => void
  password: string
  onPasswordChange: (val: string) => void
  onSignIn: (event?: React.FormEvent) => Promise<void>
  authBusy: boolean
  error?: string | null
  authStoreSlug?: string
  onAuthStoreSlugChange?: (val: string) => void
}

export function LoginScreen({
  email,
  onEmailChange,
  password,
  onPasswordChange,
  onSignIn,
  authBusy,
  error: propError,
  authStoreSlug,
  onAuthStoreSlugChange
}: LoginScreenProps) {
  const [localError, setLocalError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)
    try {
      await onSignIn(e)
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : String(err))
    }
  }

  const displayError = propError || localError

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div className="login-logo-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 100" width="240" height="75" className="login-logo-svg">
              <g fill="none" stroke="#1b813e" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M 56 38 Q 50 70 46 105" />
                <path d="M 52 38 C 28 42 12 36 12 28 C 12 20 28 26 52 38" />
                <path d="M 52 38 C 20 24 16 12 26 8 C 36 4 44 20 52 38" />
                <path d="M 52 38 C 45 10 52 2 60 2 C 68 2 65 15 52 38" />
                <path d="M 52 38 C 72 14 84 8 90 14 C 96 20 78 30 52 38" />
                <path d="M 52 38 C 84 32 98 40 96 48 C 94 56 76 46 52 38" />
                
                <path d="M 52 38 L 22 29" strokeWidth="2.5" />
                <path d="M 52 38 L 32 14" strokeWidth="2.5" />
                <path d="M 52 38 L 56 6" strokeWidth="2.5" />
                <path d="M 52 38 L 76 18" strokeWidth="2.5" />
                <path d="M 52 38 L 82 41" strokeWidth="2.5" />
              </g>
              <text x="115" y="60" fontFamily="'Outfit', 'Inter', -apple-system, sans-serif" fontSize="44" fontWeight="700" fill="#1b813e" letterSpacing="-1.5">pachira</text>
              <text x="118" y="85" fontFamily="'Outfit', 'Inter', -apple-system, sans-serif" fontSize="16" fontWeight="500" fill="#64748b" letterSpacing="0.5">Food Order System</text>
            </svg>
          </div>
          <div className="admin-login-tag" style={{ marginTop: '16px' }}>ADMIN LOGIN</div>
          <h1 className="login-title">管理者ログイン</h1>
        </div>
        
        <form className="login-form" onSubmit={handleSubmit}>
          {authStoreSlug !== undefined && onAuthStoreSlugChange && (
            <div className="form-group">
              <label className="form-label">店舗ID</label>
              <input
                type="text"
                className="form-input"
                value={authStoreSlug}
                onChange={(e) => onAuthStoreSlugChange(e.target.value)}
                placeholder="店舗IDを入力してください"
                required
              />
            </div>
          )}
          
          <div className="form-group">
            <label className="form-label">メールアドレス</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="example@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">パスワード</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {displayError && (
            <div className="login-error-message">
              {displayError}
            </div>
          )}

          <div className="form-footer">
            <button
              type="submit"
              className="login-submit-btn"
              disabled={authBusy}
            >
              {authBusy ? 'ログイン中...' : 'ログイン'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .login-container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          width: 100%;
          background: linear-gradient(180deg, #f7f3ec 0%, #fcfaf5 100%);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          padding: 20px;
          box-sizing: border-box;
        }

        .login-card {
          background-color: #ffffff;
          border-radius: 20px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
          width: 100%;
          max-width: 500px;
          padding: 48px;
          box-sizing: border-box;
        }

        .login-header {
          margin-bottom: 36px;
        }

        .admin-login-tag {
          color: #1b813e;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.1em;
          margin-bottom: 8px;
        }

        .login-title {
          color: #0f172a;
          font-size: 32px;
          font-weight: 800;
          margin: 0;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-label {
          color: #475569;
          font-size: 14px;
          font-weight: 700;
        }

        .form-input {
          background-color: #eef2f6;
          border: none;
          border-radius: 12px;
          color: #1e293b;
          font-size: 16px;
          padding: 16px;
          outline: none;
          width: 100%;
          box-sizing: border-box;
          transition: background-color 0.2s;
        }

        .form-input:focus {
          background-color: #e2e8f0;
        }

        .login-error-message {
          color: #ef4444;
          font-size: 14px;
          background-color: #fef2f2;
          padding: 12px 16px;
          border-radius: 8px;
          border-left: 4px solid #ef4444;
          font-weight: 500;
        }

        .form-footer {
          display: flex;
          justify-content: flex-end;
          margin-top: 12px;
        }

        .login-submit-btn {
          background-color: #1b813e;
          border: none;
          border-radius: 12px;
          color: #ffffff;
          cursor: pointer;
          font-size: 16px;
          font-weight: 700;
          padding: 12px 32px;
          transition: background-color 0.2s, opacity 0.2s;
        }

        .login-submit-btn:hover {
          background-color: #146932;
        }

        .login-submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  )
}
