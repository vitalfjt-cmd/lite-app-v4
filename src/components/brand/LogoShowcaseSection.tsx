import React from 'react'
import { BrandLogo, LOGO_OPTIONS, type LogoOption } from './BrandLogo'

interface Props {
  activeLogoId: string
  onSelectLogo: (id: string) => void
}

export const LogoShowcaseSection: React.FC<Props> = ({ activeLogoId, onSelectLogo }) => {
  const activeLogo = LOGO_OPTIONS.find((l) => l.id === activeLogoId) || LOGO_OPTIONS[0]

  return (
    <section className="lp-logo-showcase-section" id="logo-variations">
      <div className="lp-section-inner">
        <div className="lp-section-header">
          <span className="lp-section-eyebrow">BRAND & LOGO DESIGN</span>
          <h2 className="lp-section-title">Yui-Order ブランドロゴ</h2>
          <p style={{ marginTop: '8px', color: '#64748b', fontSize: '0.95rem' }}>
            「<strong>Yui-Order</strong>」の正式ロゴデザイン（フォーク＆スマホ客・結びノット／グリーン×オレンジ）および各種バリエーションです。
            カードをクリックしてページ上部のヘッダーやフッターの切り替えプレビューをお試しいただけます。
          </p>
        </div>

        <div className="logo-grid">
          {LOGO_OPTIONS.map((logo: LogoOption) => {
            const isSelected = activeLogoId === logo.id
            return (
              <div
                key={logo.id}
                className={`logo-card ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelectLogo(logo.id)}
                style={{ borderColor: isSelected ? logo.accentColor : undefined }}
              >
                {isSelected && (
                  <span className="selected-badge" style={{ background: logo.accentColor }}>
                    適用中
                  </span>
                )}

                <div className="logo-card-header">
                  <div className="logo-card-icon-wrap">{logo.faviconMark}</div>
                  <div className="logo-card-titles">
                    <h3>{logo.name}</h3>
                    <span className="logo-subtitle" style={{ color: logo.accentColor }}>
                      {logo.subtitle}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    margin: '12px 0 16px',
                    padding: '14px',
                    background: '#f8fafc',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  {logo.fullLogoSvg}
                </div>

                <p className="logo-card-desc">{logo.desc}</p>

                <button
                  type="button"
                  className={`logo-select-btn ${isSelected ? 'active' : ''}`}
                  style={{
                    background: isSelected ? logo.accentColor : '#f8fafc',
                    color: isSelected ? '#ffffff' : '#334155',
                    border: isSelected ? 'none' : '1px solid #e2e8f0',
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelectLogo(logo.id)
                  }}
                >
                  {isSelected ? '✓ 現在適用中' : 'このロゴをプレビュー試用'}
                </button>
              </div>
            )
          })}
        </div>

        <div
          style={{
            marginTop: '24px',
            padding: '16px 20px',
            background: '#0b0f19',
            borderRadius: '12px',
            border: `1.5px solid rgba(255, 255, 255, 0.15)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#94a3b8' }}>
              ヘッダー実機プレビュー（Dark）:
            </span>
            <div style={{ display: 'inline-flex', alignItems: 'center' }}>
              <BrandLogo logoId={activeLogoId} showBadge={true} badgeText="SaaS" theme="dark" />
            </div>
          </div>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#38bdf8' }}>
            ● {activeLogo.subtitle}
          </span>
        </div>
      </div>
    </section>
  )
}

