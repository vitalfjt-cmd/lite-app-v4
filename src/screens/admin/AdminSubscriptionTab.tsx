import React, { useState, useEffect } from 'react'
import type { SubscriptionStatus } from '../../types'
import {
  getSubscriptionStatusApi,
  createBillingCheckoutSessionApi,
  createBillingPortalSessionApi,
  mockActivateSubscriptionApi,
  mockResetSubscriptionApi,
  mockExpireSubscriptionApi,
} from '../../lib/staffReadApi'

type Props = {
  storeSlug: string
  onNotify?: (message: string) => void
}

export function AdminSubscriptionTab({ storeSlug, onNotify }: Props) {
  const [loading, setLoading] = useState(true)
  const [subStatus, setSubStatus] = useState<SubscriptionStatus | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadStatus = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await getSubscriptionStatusApi(storeSlug)
      setSubStatus(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStatus()
  }, [storeSlug])

  // Checkout Session 起動
  const handleStartCheckout = async () => {
    try {
      setProcessing(true)
      setError(null)
      const currentUrl = new URL(window.location.href)
      currentUrl.searchParams.set('view', 'admin')
      currentUrl.searchParams.set('adminTab', 'billing')
      currentUrl.searchParams.set('checkout', 'success')
      const successUrl = currentUrl.toString()

      currentUrl.searchParams.set('checkout', 'cancel')
      const cancelUrl = currentUrl.toString()

      const res = await createBillingCheckoutSessionApi(storeSlug, successUrl, cancelUrl, 'LITE')
      if (res.isMock) {
        // モックモードの場合は即時アクティベート
        await mockActivateSubscriptionApi(storeSlug, 'LITE')
        await loadStatus()
        if (onNotify) onNotify('【テスト決済完了】Liteプランへのアップグレードが完了しました！')
      } else if (res.checkoutUrl) {
        window.location.href = res.checkoutUrl
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setProcessing(false)
    }
  }

  // Customer Portal 起動
  const handleOpenPortal = async () => {
    try {
      setProcessing(true)
      setError(null)
      const currentUrl = new URL(window.location.href)
      currentUrl.searchParams.set('view', 'admin')
      currentUrl.searchParams.set('adminTab', 'billing')
      const returnUrl = currentUrl.toString()

      const res = await createBillingPortalSessionApi(storeSlug, returnUrl)
      if (res.isMock) {
        if (onNotify) onNotify('【テスト環境】Stripe カスタマーポータル（モック）の呼び出しに成功しました。')
      } else if (res.portalUrl) {
        window.location.href = res.portalUrl
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setProcessing(false)
    }
  }

  // 開発・テスト用モックアクティベート
  const handleMockActivate = async () => {
    try {
      setProcessing(true)
      setError(null)
      await mockActivateSubscriptionApi(storeSlug, 'LITE')
      await loadStatus()
      if (onNotify) onNotify('【テスト環境】プランを「月額契約中（Active）」に切り替えました。')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setProcessing(false)
    }
  }

  // 開発・テスト用モックリセット（トライアル戻し）
  const handleMockReset = async () => {
    try {
      setProcessing(true)
      setError(null)
      await mockResetSubscriptionApi(storeSlug)
      await loadStatus()
      if (onNotify) onNotify('【テスト環境】プランを「無料トライアル（Trialing）」にリセットしました。')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setProcessing(false)
    }
  }

  // 開発・テスト用モック利用期限切れ（Expired）
  const handleMockExpire = async () => {
    try {
      setProcessing(true)
      setError(null)
      await mockExpireSubscriptionApi(storeSlug)
      await loadStatus()
      if (onNotify) onNotify('【テスト環境】利用期限切れ（Expired: 注文・会計ブロック状態）に切り替えました。')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setProcessing(false)
    }
  }

  const isTrial = subStatus?.subscription_status === 'trialing'
  const isActive = subStatus?.subscription_status === 'active'

  return (
    <div className="subscription-tab-container">
      {/* 契約ステータスヘッダー */}
      <section className="subscription-section subscription-status-panel">
        <div className="admin-list-head">
          <div>
            <h2>プラン・月額課金管理</h2>
            <p className="hint">Stripeと連動した安全なサブスクリプション課金および利用状況の管理を行います。</p>
          </div>
          <button className="secondary-button" onClick={loadStatus} disabled={loading || processing}>
            {loading ? '更新中...' : '状態を再取得'}
          </button>
        </div>

        {error && (
          <div className="subscription-alert-box error">
            <span className="alert-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="subscription-loading">読み込み中...</div>
        ) : (
          <div className="subscription-current-card">
            <div className="status-hero-row">
              <div className="status-meta">
                <span className="plan-badge-pill">
                  {subStatus?.plan === 'STANDARD' ? 'Standard プラン' : 'Lite プラン'}
                </span>
                <h3 className="status-title">
                  {isActive ? (
                    <span className="status-text active">月額サブスクリプション契約中</span>
                  ) : isTrial ? (
                    <span className="status-text trialing">無料トライアル期間中</span>
                  ) : (
                    <span className="status-text expired">利用期限終了 / 未契約</span>
                  )}
                </h3>
              </div>

              <div className="status-highlight-box">
                {isTrial && subStatus?.days_left_in_trial !== null && (
                  <div className="trial-countdown">
                    <span className="countdown-label">無料トライアル残り</span>
                    <span className="countdown-number">{subStatus.days_left_in_trial}</span>
                    <span className="countdown-unit">日</span>
                  </div>
                )}
                {isActive && (
                  <div className="active-badge-display">
                    <span className="pulse-dot"></span>
                    <span>自動更新 有効</span>
                  </div>
                )}
              </div>
            </div>

            <div className="status-details-grid">
              <div className="detail-item">
                <span className="label">月額料金</span>
                <span className="value">¥2,980 / 月 (税込)</span>
              </div>
              <div className="detail-item">
                <span className="label">現在のステータス</span>
                <span className="value status-val">
                  {subStatus?.subscription_status || 'unknown'}
                </span>
              </div>
              <div className="detail-item">
                <span className="label">
                  {isActive ? '次回更新日' : 'トライアル終了日'}
                </span>
                <span className="value">
                  {subStatus?.current_period_end
                    ? new Date(subStatus.current_period_end).toLocaleDateString('ja-JP', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : subStatus?.trial_ends_at
                    ? new Date(subStatus.trial_ends_at).toLocaleDateString('ja-JP', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : '未設定'}
                </span>
              </div>
              <div className="detail-item">
                <span className="label">Stripe Customer ID</span>
                <span className="value mono">
                  {subStatus?.stripe_customer_id || '未発行（初回決済時に自動連携）'}
                </span>
              </div>
            </div>

            {/* アクションボタン */}
            <div className="subscription-actions-row">
              {!isActive ? (
                <button
                  type="button"
                  className="primary-button checkout-cta-btn"
                  onClick={handleStartCheckout}
                  disabled={processing}
                >
                  {processing ? 'Stripeへ接続中...' : '💳 Liteプラン（¥2,980/月）に申し込む'}
                </button>
              ) : (
                <button
                  type="button"
                  className="secondary-button portal-cta-btn"
                  onClick={handleOpenPortal}
                  disabled={processing}
                >
                  {processing ? 'ポータルへ接続中...' : '⚙️ Stripe契約ポータルを開く (支払い方法変更・領収書・解約)'}
                </button>
              )}

              {/* 上部でもワンクリックでテストできるクイックテストボタン */}
              <div style={{ display: 'inline-flex', gap: '8px', marginLeft: 'auto', flexWrap: 'wrap' }}>
                {!isActive ? (
                  <button
                    type="button"
                    className="secondary-button"
                    style={{ fontSize: '0.82rem', padding: '6px 12px', background: '#eff6ff', color: '#1d4ed8', borderColor: '#bfdbfe' }}
                    onClick={handleMockActivate}
                    disabled={processing}
                    title="D1 DBのステータスを即座に active に更新します"
                  >
                    ⚡ [テスト] Activeに切替
                  </button>
                ) : (
                  <button
                    type="button"
                    className="secondary-button"
                    style={{ fontSize: '0.82rem', padding: '6px 12px', background: '#f0fdf4', color: '#15803d', borderColor: '#bbf7d0' }}
                    onClick={handleMockReset}
                    disabled={processing}
                    title="D1 DBのステータスを即座に trialing に戻します"
                  >
                    🔄 [テスト] トライアルに戻す
                  </button>
                )}
                <button
                  type="button"
                  className="secondary-button"
                  style={{ fontSize: '0.82rem', padding: '6px 12px', background: '#fef2f2', color: '#b91c1c', borderColor: '#fecaca' }}
                  onClick={handleMockExpire}
                  disabled={processing}
                  title="D1 DBのステータスを即座に expired にし、注文・会計ブロックの動作をテストします"
                >
                  ⚠️ [テスト] 期限切れ(Expired)に切替
                </button>
              </div>
            </div>

            <p className="security-notice">
              🔒 決済処理は世界標準の決済プラットフォーム <strong>Stripe</strong> により暗号化され、安全に保護されます。当サービスがカード情報を直接保持することはありません。
            </p>
          </div>
        )}
      </section>

      {/* プラン比較 & 機能案内カード */}
      <section className="subscription-section subscription-plans-panel">
        <div className="admin-list-head">
          <div>
            <h2>プラン機能の比較</h2>
            <p className="hint">飲食店の運用規模や必要な設備に合わせていつでも切り替えが可能です。</p>
          </div>
        </div>

        <div className="plans-comparison-grid">
          {/* Lite Plan */}
          <div className={`plan-card-box ${subStatus?.plan === 'LITE' ? 'current-plan-border' : ''}`}>
            {subStatus?.plan === 'LITE' && <div className="card-top-tag">現在ご利用中</div>}
            <div className="plan-card-header">
              <h3>Lite プラン</h3>
              <div className="plan-price-tag">
                <span className="amount">¥2,980</span>
                <span className="term">/ 月</span>
              </div>
              <p className="plan-tagline">紙伝票＋既存レジのまま、スマホオーダーを最速導入</p>
            </div>
            <ul className="plan-feature-list">
              <li>✅ お客さまのスマホQR注文（無制限）</li>
              <li>✅ リアルタイム伝票管理・注文一覧</li>
              <li>✅ 厨房用KDS（調理ステータス管理）</li>
              <li>✅ スタッフ用注文確認＆簡易小計・テンキー会計</li>
              <li>✅ 既存レジや紙伝票の運用をそのまま維持</li>
              <li>✅ 端末・タブレット台数の制限なし</li>
            </ul>
          </div>

          {/* Standard Plan */}
          <div className="plan-card-box standard-plan-box">
            <div className="card-top-tag standard">上位プラン</div>
            <div className="plan-card-header">
              <h3>Standard プラン</h3>
              <div className="plan-price-tag">
                <span className="amount">¥4,980</span>
                <span className="term">/ 月 ＋ 初期導入費</span>
              </div>
              <p className="plan-tagline">店内ローカル主系の POS / OES 一体型システム</p>
            </div>
            <ul className="plan-feature-list">
              <li>✅ Lite の全機能</li>
              <li>✅ 店内ローカル主系（オフライン耐性・超高速）</li>
              <li>✅ キャッシュドロア自動連動</li>
              <li>✅ 会計用高速サーマルレシート印刷</li>
              <li>✅ 厨房キッチンプリンター自動印字</li>
              <li>✅ 専用ハンディ端末（スタッフ注文入力）対応</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 開発・検証用テストコントローラー */}
      <section className="subscription-section subscription-dev-panel">
        <div className="admin-list-head">
          <div>
            <h3>🧪 開発・テスト用シミュレーター</h3>
            <p className="hint">StripeのAPIキーを設定する前でも、安全に課金切り替えのUI/UX動作を検証できます。</p>
          </div>
        </div>
        <div className="dev-actions-grid" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="secondary-button"
            onClick={handleMockActivate}
            disabled={processing}
          >
            ⚡ [テスト] 即座に「月額契約中 (Active)」に切り替え
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={handleMockReset}
            disabled={processing}
          >
            🔄 [テスト] 即座に「無料トライアル (Trialing)」に戻す
          </button>
          <button
            type="button"
            className="secondary-button"
            style={{ color: '#b91c1c', borderColor: '#fecaca', background: '#fff5f5' }}
            onClick={handleMockExpire}
            disabled={processing}
          >
            ⚠️ [テスト] 即座に「利用期限切れ (Expired)」に切り替え
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={async () => {
              try {
                setProcessing(true)
                await loadStatus()
                if (onNotify) onNotify('契約ステータスを再取得しました。')
              } finally {
                setProcessing(false)
              }
            }}
            disabled={processing}
          >
            🔃 状態リフレッシュ
          </button>
        </div>
      </section>
    </div>
  )
}
