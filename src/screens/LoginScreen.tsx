import React, { useState } from 'react'

interface LoginScreenProps {
  email: string
  onEmailChange: (val: string) => void
  password: string
  onPasswordChange: (val: string) => void
  onSignIn: (event?: React.FormEvent) => Promise<void>
  onSignUp?: (storeName: string, slug: string, email: string, password: string) => Promise<any>
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
  onSignUp,
  authBusy,
  error: propError,
  authStoreSlug,
  onAuthStoreSlugChange
}: LoginScreenProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [storeName, setStoreName] = useState('')
  const [storeSlug, setStoreSlug] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)
  const [signupSuccessData, setSignupSuccessData] = useState<any | null>(null)

  const handleStoreNameChange = (val: string) => {
    setStoreName(val)
    if (!storeSlug || storeSlug === '') {
      // 簡易スラッグ自動生成 (半角英数・ハイフン)
      const autoSlug = val
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
      if (autoSlug) {
        setStoreSlug(autoSlug)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)
    try {
      if (mode === 'signup') {
        if (!onSignUp) {
          throw new Error('新規登録機能は現在準備中です。')
        }
        if (!storeName.trim()) {
          throw new Error('店舗名を入力してください。')
        }
        const effectiveSlug = (storeSlug || 'store-' + Math.random().toString(36).substring(2, 8)).trim().toLowerCase()
        const result = await onSignUp(storeName.trim(), effectiveSlug, email.trim(), password)
        setSignupSuccessData(result)
      } else {
        await onSignIn(e)
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : String(err))
    }
  }

  function formatDisplayError(rawError: string | null): string | null {
    if (!rawError) return null
    if (rawError.includes('store_user_not_found')) {
      return '店舗IDまたはメールアドレスが正しくありません。所属店舗をご確認ください。'
    }
    if (rawError.includes('store_not_found')) {
      return '指定された店舗IDが見つかりません。店舗IDをご確認ください。'
    }
    if (rawError.includes('staff_user_not_found')) {
      return 'スタッフアカウントが見つかりません。'
    }
    if (
      rawError.includes('auth/invalid-credential') ||
      rawError.includes('auth/user-not-found') ||
      rawError.includes('auth/wrong-password') ||
      rawError.includes('invalid_login')
    ) {
      return 'メールアドレスまたはパスワードが正しくありません。'
    }
    if (rawError.includes('auth/too-many-requests')) {
      return 'ログイン試行回数が上限を超えました。しばらく待ってから再度お試しください。'
    }
    return rawError
  }

  const displayError = formatDisplayError(propError || localError)

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div className="login-logo-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 100" width="240" height="75" className="login-logo-svg">
              <g fill="none" stroke="#1b813e" strokeLinecap="round" strokeLinejoin="round">
                <path d="M 55 45 L 55 80" strokeWidth="4.5" />
                <path d="M 43 80 L 67 80 L 63 92 L 47 92 Z" fill="#1b813e" strokeWidth="0" />
                <path d="M 55 45 C 51 32 51 15 55 10 C 59 15 59 32 55 45 Z" fill="#1b813e" strokeWidth="1.5" />
                <path d="M 55 45 C 42 36 29 27 30 20 C 38 18 48 29 55 45 Z" fill="#1b813e" strokeWidth="1.5" />
                <path d="M 55 45 C 68 36 81 27 80 20 C 72 18 62 29 55 45 Z" fill="#1b813e" strokeWidth="1.5" />
                <path d="M 55 45 C 39 47 23 49 20 42 C 26 37 42 40 55 45 Z" fill="#1b813e" strokeWidth="1.5" />
                <path d="M 55 45 C 71 47 87 49 90 42 C 84 37 68 40 55 45 Z" fill="#1b813e" strokeWidth="1.5" />
              </g>
              <text x="115" y="60" fontFamily="'Outfit', 'Inter', -apple-system, sans-serif" fontSize="44" fontWeight="700" fill="#1b813e" letterSpacing="-1.5">pachira</text>
              <text x="118" y="85" fontFamily="'Outfit', 'Inter', -apple-system, sans-serif" fontSize="16" fontWeight="500" fill="#64748b" letterSpacing="0.5">Food Order System</text>
            </svg>
          </div>

          <div className="admin-login-tabs">
            <button
              type="button"
              className={`auth-tab-btn ${mode === 'login' ? 'active' : ''}`}
              onClick={() => { setMode('login'); setLocalError(null); }}
            >
              ログイン
            </button>
            <button
              type="button"
              className={`auth-tab-btn ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => { setMode('signup'); setLocalError(null); }}
            >
              新規店舗作成 (30秒で開始)
            </button>
          </div>

          <h1 className="login-title">
            {mode === 'login' ? '管理者ログイン' : '無料アカウント作成'}
          </h1>
          <p className="login-subtitle">
            {mode === 'login'
              ? '登録済みの店舗アカウントでログインしてください'
              : '店舗名とメールアドレスを入力するだけで即座に体験できます'}
          </p>
        </div>

        {signupSuccessData ? (
          <div className="signup-success-card">
            <div className="success-icon">🎉</div>
            <h2 className="success-title">店舗の作成が完了しました！</h2>
            <p className="success-desc">
              店舗名: <strong>{signupSuccessData.store?.name}</strong><br />
              店舗ID: <code>{signupSuccessData.store?.slug}</code>
            </p>
            <div className="first-table-info">
              <span className="badge">初期設定完了</span>
              <p>卓番1のQRコードおよびサンプルメニューが自動作成されました。</p>
            </div>
            <button
              type="button"
              className="login-submit-btn full-width"
              onClick={() => {
                const targetSlug = signupSuccessData?.store?.slug
                if (targetSlug) {
                  window.localStorage.setItem('last_active_store_slug', targetSlug)
                  const url = new URL(window.location.href)
                  url.searchParams.set('store', targetSlug)
                  url.hash = '#admin'
                  window.location.href = url.toString()
                } else {
                  window.location.hash = '#admin'
                  window.location.reload()
                }
              }}
            >
              管理ダッシュボードを開く
            </button>
          </div>
        ) : (
          <form className="login-form" onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <>
                <div className="form-group">
                  <label className="form-label">店舗名 <span className="required-mark">*</span></label>
                  <input
                    type="text"
                    className="form-input"
                    value={storeName}
                    onChange={(e) => handleStoreNameChange(e.target.value)}
                    placeholder="例: テストカフェ 新宿店"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    店舗ID (URL用スラッグ) <span className="sub-label">半角英数・ハイフン</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={storeSlug}
                    onChange={(e) => setStoreSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '-'))}
                    placeholder="例: test-cafe-shinjuku"
                    required
                  />
                </div>
              </>
            )}

            {mode === 'login' && authStoreSlug !== undefined && onAuthStoreSlugChange && (
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
              <label className="form-label">メールアドレス <span className="required-mark">*</span></label>
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
              <label className="form-label">パスワード <span className="required-mark">*</span></label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => onPasswordChange(e.target.value)}
                placeholder="6文字以上のパスワード"
                required
                minLength={6}
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
                className="login-submit-btn full-width"
                disabled={authBusy}
              >
                {authBusy
                  ? (mode === 'signup' ? '店舗を作成中...' : 'ログイン中...')
                  : (mode === 'signup' ? '今すぐ無料で店舗を作成' : 'ログイン')}
              </button>
            </div>
          </form>
        )}
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

        .login-submit-btn.full-width {
          width: 100%;
          text-align: center;
        }

        .admin-login-tabs {
          display: flex;
          background-color: #f1f5f9;
          padding: 4px;
          border-radius: 12px;
          margin-top: 16px;
          margin-bottom: 20px;
          width: 100%;
          box-sizing: border-box;
          gap: 4px;
        }

        .auth-tab-btn {
          flex: 1;
          padding: 8px 12px;
          font-size: 13px;
          font-weight: 700;
          color: #64748b;
          background: transparent;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .auth-tab-btn.active {
          background-color: #ffffff;
          color: #1b813e;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
        }

        .login-subtitle {
          color: #64748b;
          font-size: 13px;
          margin-top: 8px;
          margin-bottom: 0;
          line-height: 1.5;
        }

        .required-mark {
          color: #ef4444;
          font-weight: 700;
        }

        .sub-label {
          font-size: 11px;
          font-weight: 400;
          color: #94a3b8;
          margin-left: 6px;
        }

        .signup-success-card {
          text-align: center;
          padding: 16px 0;
        }

        .success-icon {
          font-size: 48px;
          margin-bottom: 12px;
        }

        .success-title {
          font-size: 20px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 12px 0;
        }

        .success-desc {
          color: #475569;
          font-size: 14px;
          line-height: 1.6;
          background-color: #f8fafc;
          padding: 12px;
          border-radius: 10px;
          margin-bottom: 16px;
        }

        .first-table-info {
          background-color: #f0fdf4;
          border: 1px solid #bbf7d0;
          padding: 12px;
          border-radius: 10px;
          margin-bottom: 24px;
          font-size: 13px;
          color: #166534;
        }

        .first-table-info .badge {
          display: inline-block;
          background-color: #22c55e;
          color: white;
          font-size: 11px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 9999px;
          margin-bottom: 6px;
        }
      `}</style>
    </div>
  )
}
