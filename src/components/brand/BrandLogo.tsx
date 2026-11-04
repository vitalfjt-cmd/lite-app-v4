import React from 'react'

export interface LogoOption {
  id: string
  name: string
  subtitle: string
  desc: string
  accentColor: string
  secondaryColor?: string
  badgeBg: string
  faviconMark: React.ReactNode
  fullLogoSvg: React.ReactNode
  imageSrc?: string
}

export const LOGO_OPTIONS: LogoOption[] = [
  {
    id: 'forest-orange',
    name: '案3-A修正: フォーク＆スマホ結び（グリーン × オレンジ）★採用案',
    subtitle: '和モダン・親しみやすさ・食と注文の結びつき',
    desc: '左側のフォーク（料理・厨房）と右側のスマホを持つ笑顔の人物（客席注文）が、中央の結び目（水引ノット）で心地よく繋がるデザイン。フォレストグリーンとウォームオレンジの温かいバイカラー。',
    accentColor: '#15803d',
    secondaryColor: '#ea580c',
    badgeBg: '#f0fdf4',
    imageSrc: '/images/yui-order-logo.jpg',
    faviconMark: (
      <svg width="34" height="34" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="64" height="64" rx="14" fill="#ffffff" />
        {/* グリーンループ＆フォーク */}
        <path d="M 32 34 C 24 34 12 36 12 25 C 12 14 26 14 31 24" fill="none" stroke="#15803d" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 21 21 L 21 28" stroke="#15803d" strokeWidth="3" strokeLinecap="round" />
        <path d="M 18 21 L 18 24 C 18 26.5 24 26.5 24 24 L 24 21" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" />
        {/* オレンジループ＆スマホ人物 */}
        <path d="M 31 40 C 39 40 52 40 52 27 C 52 14 38 14 33 24" fill="none" stroke="#ea580c" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="42" y="21" width="7" height="11" rx="1.5" fill="none" stroke="#ea580c" strokeWidth="2.5" />
        <circle cx="45.5" cy="14" r="3.5" fill="#ea580c" />
        {/* 結び目 */}
        <path d="M 28 26 C 30 22 34 22 36 26 C 38 30 34 35 32 35 C 30 35 26 30 28 26 Z" fill="#ea580c" />
        <circle cx="32" cy="27" r="2.2" fill="#ffffff" />
      </svg>
    ),
    fullLogoSvg: (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
        <img
          src="/images/yui-order-logo.jpg"
          alt="Yui-Order Logo"
          style={{ height: '38px', width: 'auto', borderRadius: '8px', objectFit: 'contain' }}
        />
        <span style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a' }}>
          <span style={{ color: '#15803d' }}>Yui</span>
          <span style={{ color: '#ea580c' }}>-Order</span>
        </span>
      </div>
    ),
  },
  {
    id: 'mizuhiki',
    name: '案1: 結びノット Favicon + Yui-Order',
    subtitle: '和モダン・信頼感・定番スタイル',
    desc: 'アプリのファビコン／アプリアイコンとしても映える「結び目」の角丸アイコン＋クリーンな「Yui-Order」ロゴタイプ。人と人、注文と厨房をスムーズに結びます。',
    accentColor: '#15803d',
    badgeBg: '#f0fdf4',
    faviconMark: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="8" fill="#15803d" />
        <path d="M10 16C12.5 12 19.5 12 22 16C19.5 20 12.5 20 10 16Z" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M16 9V23" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="16" cy="16" r="2.5" fill="#ffffff" />
      </svg>
    ),
    fullLogoSvg: (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
        <svg width="34" height="34" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" rx="8" fill="#15803d" />
          <path d="M10 16C12.5 12 19.5 12 22 16C19.5 20 12.5 20 10 16Z" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <path d="M16 9V23" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="16" cy="16" r="2.5" fill="#ffffff" />
        </svg>
        <span style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a' }}>
          <span style={{ color: '#15803d' }}>Yui</span>-Order
        </span>
      </div>
    ),
  },
  {
    id: 'y-infinity',
    name: '案2: Y-シェイプグラデーション + Yui-Order',
    subtitle: '先進的・ITテクノロジー・アプリ感',
    desc: '頭文字「Y」と無限ループを描く鮮やかなグラデーションアイコン。モバイル端末のホーム画面でもひと目で認識可能なモダンデザイン。',
    accentColor: '#0284c7',
    badgeBg: '#e0f2fe',
    faviconMark: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="8" fill="url(#grad-y)" />
        <defs>
          <linearGradient id="grad-y" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0284c7" />
            <stop offset="1" stopColor="#0d9488" />
          </linearGradient>
        </defs>
        <path d="M10 10L16 18L22 10" stroke="#ffffff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M16 18V24" stroke="#ffffff" strokeWidth="2.8" strokeLinecap="round" />
      </svg>
    ),
    fullLogoSvg: (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
        <svg width="34" height="34" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" rx="8" fill="url(#grad-y2)" />
          <defs>
            <linearGradient id="grad-y2" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
              <stop stopColor="#0284c7" />
              <stop offset="1" stopColor="#0d9488" />
            </linearGradient>
          </defs>
          <path d="M10 10L16 18L22 10" stroke="#ffffff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <path d="M16 18V24" stroke="#ffffff" strokeWidth="2.8" strokeLinecap="round" />
        </svg>
        <span style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a' }}>
          <span style={{ color: '#0284c7' }}>Yui</span>-Order
        </span>
      </div>
    ),
  },
  {
    id: 'kanji-yui',
    name: '案3: ミニマル和モダン + Yui-Order',
    subtitle: '重厚感・プロ仕様・ダークネイビー',
    desc: 'ダークフォレストの角丸アイコンに漢字「結」の繊細なライングラフィック。上質な割烹・和食店やプロ仕様で人気の高級感あるスタイル。',
    accentColor: '#0f172a',
    badgeBg: '#f1f5f9',
    faviconMark: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="8" fill="#0f172a" />
        <path d="M9 10H15M9 14H15M12 10V17" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
        <path d="M18 10H24M21 10V23M17 23H25" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    fullLogoSvg: (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
        <svg width="34" height="34" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" rx="8" fill="#0f172a" />
          <path d="M9 10H15M9 14H15M12 10V17" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
          <path d="M18 10H24M21 10V23M17 23H25" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a' }}>
          Yui<span style={{ color: '#166534' }}>-Order</span>
        </span>
      </div>
    ),
  },
  {
    id: 'smile-link',
    name: '案4: スマイルリンク + Yui-Order',
    subtitle: '親しみやすさ・体験重視・フレンドリー',
    desc: 'スマイルの曲線と結合リングをモチーフにしたバイオレットアイコン。明るく親しみやすい注文体験を提供します。',
    accentColor: '#7c3aed',
    badgeBg: '#f3e8ff',
    faviconMark: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="8" fill="#7c3aed" />
        <circle cx="12" cy="14" r="5" stroke="#ffffff" strokeWidth="2" fill="none" />
        <circle cx="20" cy="14" r="5" stroke="#ffffff" strokeWidth="2" fill="none" />
        <path d="M11 21C14 24 18 24 21 21" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      </svg>
    ),
    fullLogoSvg: (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
        <svg width="34" height="34" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" rx="8" fill="#7c3aed" />
          <circle cx="12" cy="14" r="5" stroke="#ffffff" strokeWidth="2" fill="none" />
          <circle cx="20" cy="14" r="5" stroke="#ffffff" strokeWidth="2" fill="none" />
          <path d="M11 21C14 24 18 24 21 21" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" fill="none" />
        </svg>
        <span style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a' }}>
          <span style={{ color: '#7c3aed' }}>Yui</span>-Order
        </span>
      </div>
    ),
  },
]

export function getLogoOption(id: string): LogoOption {
  return LOGO_OPTIONS.find((l) => l.id === id) || LOGO_OPTIONS[0]
}

interface BrandLogoProps {
  logoId?: string
  size?: 'small' | 'medium' | 'large'
  showBadge?: boolean
  badgeText?: string
  textColor?: string
  theme?: 'light' | 'dark'
  useImageThumbnail?: boolean
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  logoId = 'forest-orange',
  size = 'medium',
  showBadge = false,
  badgeText = 'SaaS',
  textColor,
  theme = 'light',
  useImageThumbnail = false,
}) => {
  const logo = getLogoOption(logoId)
  const isSmall = size === 'small'
  const isLarge = size === 'large'
  const iconSize = isSmall ? 26 : isLarge ? 44 : 34
  const fontSize = isSmall ? '1.1rem' : isLarge ? '1.8rem' : '1.35rem'

  const effectiveTextColor = textColor || (theme === 'dark' ? '#ffffff' : '#0f172a')
  const isDark = theme === 'dark'

  // ダーク背景時のカラー最適化
  const greenColor = isDark ? '#22c55e' : '#15803d'
  const orangeColor = isDark ? '#fb923c' : '#ea580c'

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: isSmall ? '8px' : '10px' }}>
      <div style={{ height: iconSize, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {useImageThumbnail && logo.imageSrc ? (
          <img
            src={logo.imageSrc}
            alt="Yui-Order Icon"
            style={{
              height: `${iconSize}px`,
              width: `${iconSize}px`,
              borderRadius: isSmall ? '6px' : '8px',
              objectFit: 'contain',
              background: '#ffffff',
              padding: '2px',
              border: '1px solid rgba(255,255,255,0.2)',
            }}
          />
        ) : (
          logo.faviconMark
        )}
      </div>
      <span
        style={{
          fontSize,
          fontWeight: 800,
          letterSpacing: '-0.02em',
          color: effectiveTextColor,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <span>
          {logo.id === 'forest-orange' ? (
            <>
              <span style={{ color: greenColor }}>Yui</span>
              <span style={{ color: orangeColor }}>-Order</span>
            </>
          ) : logo.id === 'kanji-yui' ? (
            <>
              <span style={{ color: effectiveTextColor }}>Yui</span>
              <span style={{ color: isDark ? '#4ade80' : '#166534' }}>-Order</span>
            </>
          ) : (
            <>
              <span style={{ color: isDark ? '#22c55e' : logo.accentColor }}>Yui</span>
              <span style={{ color: effectiveTextColor }}>-Order</span>
            </>
          )}
        </span>
        {showBadge && (
          <span
            style={{
              fontSize: '0.68rem',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '9999px',
              background: isDark ? 'rgba(37, 99, 235, 0.25)' : '#e2e8f0',
              color: isDark ? '#93c5fd' : '#475569',
              border: isDark ? '1px solid rgba(96, 165, 250, 0.35)' : '1px solid #cbd5e1',
              letterSpacing: '0.5px',
            }}
          >
            {badgeText}
          </span>
        )}
      </span>
    </div>
  )
}
