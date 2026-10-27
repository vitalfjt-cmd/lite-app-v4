import React, { useState } from 'react'
import { saveAdminPrototypeStore, saveAdminPrototypeTable, deleteAdminPrototypeTable } from '../lib/staffReadApi'

type TableItem = {
  id?: string
  label: string
  qr_token?: string
  sort_order: number
  is_active: boolean
  isNew?: boolean
}

type Props = {
  isOpen: boolean
  onClose: () => void
  storeSlug: string
  initialStore: {
    id: string
    name: string
    taxRate?: number
    reducedTaxRate?: number
    taxDisplayMode?: 'INCLUDED' | 'EXCLUDED'
    invoiceNumber?: string | null
    paymentTimingMode?: 'PREPAID' | 'POSTPAID'
  }
  initialTables: Array<{
    id: string
    label: string
    qr_token: string
    sort_order: number
    is_active: boolean
  }>
  onRefreshData: () => Promise<void>
  onNavigateToTab?: (tab: string) => void
  onNavigateToView?: (view: string) => void
}

export function OnboardingWizardModal({
  isOpen,
  onClose,
  storeSlug,
  initialStore,
  initialTables,
  onRefreshData,
  onNavigateToTab,
  onNavigateToView,
}: Props) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Step 1: 店舗基本情報
  const [storeName, setStoreName] = useState(initialStore.name || '')
  const [paymentTiming, setPaymentTiming] = useState<'PREPAID' | 'POSTPAID'>(
    initialStore.paymentTimingMode || 'POSTPAID'
  )
  const [invoiceNumber, setInvoiceNumber] = useState(initialStore.invoiceNumber || '')

  // Step 2: 税率・価格表示
  const [taxRate, setTaxRate] = useState<number>(initialStore.taxRate ?? 10)
  const [reducedTaxRate, setReducedTaxRate] = useState<number>(initialStore.reducedTaxRate ?? 8)
  const [taxDisplayMode, setTaxDisplayMode] = useState<'INCLUDED' | 'EXCLUDED'>(
    initialStore.taxDisplayMode || 'INCLUDED'
  )

  // Step 3: テーブル・卓数
  const [tables, setTables] = useState<TableItem[]>(() => {
    if (initialTables && initialTables.length > 0) {
      return initialTables.map((t) => ({ ...t }))
    }
    // デフォルト4卓
    return [
      { label: '1', sort_order: 1, is_active: true, isNew: true },
      { label: '2', sort_order: 2, is_active: true, isNew: true },
      { label: '3', sort_order: 3, is_active: true, isNew: true },
      { label: '4', sort_order: 4, is_active: true, isNew: true },
    ]
  })
  const [deletedTableIds, setDeletedTableIds] = useState<string[]>([])

  if (!isOpen) return null

  // テーブル追加
  const handleAddTable = () => {
    const nextNum = tables.length + 1
    setTables((curr) => [
      ...curr,
      {
        label: String(nextNum),
        sort_order: nextNum,
        is_active: true,
        isNew: true,
      },
    ])
  }

  // テーブル削除
  const handleRemoveTable = (index: number) => {
    const target = tables[index]
    if (target.id) {
      setDeletedTableIds((curr) => [...curr, target.id!])
    }
    setTables((curr) => curr.filter((_, i) => i !== index))
  }

  // 卓数一括調整 (例: 6卓、8卓、10卓など)
  const handleSetTableCount = (count: number) => {
    if (count <= 0) return
    const currentCount = tables.length
    if (count > currentCount) {
      // 増やす
      const added: TableItem[] = []
      for (let i = currentCount + 1; i <= count; i++) {
        added.push({ label: String(i), sort_order: i, is_active: true, isNew: true })
      }
      setTables((curr) => [...curr, ...added])
    } else if (count < currentCount) {
      // 減らす
      const toRemove = tables.slice(count)
      const removedIds = toRemove.filter((t) => t.id).map((t) => t.id!)
      setDeletedTableIds((curr) => [...curr, ...removedIds])
      setTables((curr) => curr.slice(0, count))
    }
  }

  // テーブルラベル変更
  const handleTableLabelChange = (index: number, newLabel: string) => {
    setTables((curr) =>
      curr.map((t, i) => (i === index ? { ...t, label: newLabel } : t))
    )
  }

  // 全設定の一括保存（Step 3 → Step 4 遷移時）
  const handleSaveAll = async () => {
    try {
      setSaving(true)
      setError(null)

      // 1. 店舗設定の保存
      await saveAdminPrototypeStore(storeSlug, {
        storeId: initialStore.id,
        name: storeName.trim(),
        slug: storeSlug,
        timezone: 'Asia/Tokyo',
        businessDateOffsetMinutes: 300,
        paymentTimingMode: paymentTiming,
        ticketNoResetMode: 'DAILY',
        ticketNoDigits: 4,
        taxRate: Number(taxRate),
        reducedTaxRate: Number(reducedTaxRate),
        taxDisplayMode: taxDisplayMode,
        invoiceNumber: invoiceNumber.trim() ? invoiceNumber.trim() : null,
      })

      // 2. 削除対象テーブルの削除
      for (const tableId of deletedTableIds) {
        try {
          await deleteAdminPrototypeTable(storeSlug, tableId)
        } catch (e) {
          console.warn('Failed to delete table during onboarding', e)
        }
      }

      // 3. テーブルの作成・更新
      for (let i = 0; i < tables.length; i++) {
        const t = tables[i]
        const label = t.label.trim() || String(i + 1)
        const qrToken = t.qr_token || `${storeSlug}-${label}`
        await saveAdminPrototypeTable(storeSlug, {
          tableId: t.id,
          label: label,
          qrToken: qrToken,
          sortOrder: i + 1,
          isActive: true,
        })
      }

      // 4. データリフレッシュ
      await onRefreshData()

      // オンボーディング完了フラグをローカルストレージに保存
      try {
        window.localStorage.setItem(`onboarding_completed_${storeSlug}`, '1')
      } catch (e) {
        // ignore
      }

      setStep(4)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop onboarding-modal-backdrop" style={{ zIndex: 99990, overflowY: 'auto', padding: '24px 12px' }}>
      <div
        className="modal-card onboarding-wizard-card"
        style={{
          maxWidth: '680px',
          width: '100%',
          margin: '0 auto',
          background: '#ffffff',
          borderRadius: '24px',
          padding: '32px 36px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.22)',
          border: '1px solid #e2e8f0',
          position: 'relative',
        }}
      >
        {/* ウィザードヘッダー */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <span
              style={{
                display: 'inline-block',
                background: 'rgba(27, 129, 62, 0.1)',
                color: '#1b813e',
                fontWeight: 700,
                fontSize: '0.8rem',
                padding: '4px 12px',
                borderRadius: '9999px',
                marginBottom: '6px',
              }}
            >
              初期セットアップウィザード
            </span>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
              店舗のかんたん初期設定
            </h2>
          </div>
          {step < 4 && (
            <button
              type="button"
              className="secondary-button"
              style={{ fontSize: '0.85rem', padding: '6px 14px', border: 'none', background: 'transparent', color: '#64748b' }}
              onClick={onClose}
            >
              後で設定する（スキップ）
            </button>
          )}
        </div>

        {/* プログレスバー & ステップインジケーター */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            {[
              { num: 1, title: '店舗基本情報' },
              { num: 2, title: '税率・価格' },
              { num: 3, title: 'テーブル卓数' },
              { num: 4, title: '設定完了' },
            ].map((s) => (
              <div
                key={s.num}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.84rem',
                  fontWeight: step === s.num ? 700 : 500,
                  color: step >= s.num ? '#1b813e' : '#94a3b8',
                }}
              >
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: step > s.num ? '#1b813e' : step === s.num ? '#1b813e' : '#e2e8f0',
                    color: step >= s.num ? '#ffffff' : '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                  }}
                >
                  {step > s.num ? '✓' : s.num}
                </div>
                <span>{s.title}</span>
              </div>
            ))}
          </div>
          <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
            <div
              style={{
                width: step === 1 ? '25%' : step === 2 ? '50%' : step === 3 ? '75%' : '100%',
                height: '100%',
                background: 'linear-gradient(90deg, #1b813e 0%, #22c55e 100%)',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: '12px 16px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '12px',
              color: '#dc2626',
              fontSize: '0.88rem',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* ---------------- STEP 1: 店舗基本情報 ---------------- */}
        {step === 1 && (
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 8px 0', color: '#1e293b' }}>
              Step 1. 店舗名と会計方式を確認してください
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#64748b', margin: '0 0 20px 0' }}>
              お客様のレシートや注文画面に表示される店舗基本情報です。
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.88rem', marginBottom: '6px', color: '#334155' }}>
                  店舗名 <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="例: BBQ HOUSE Pachira 渋谷店"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '1rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.88rem', marginBottom: '8px', color: '#334155' }}>
                  お会計のタイミング方式 <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div
                    onClick={() => setPaymentTiming('POSTPAID')}
                    style={{
                      border: `2px solid ${paymentTiming === 'POSTPAID' ? '#1b813e' : '#e2e8f0'}`,
                      background: paymentTiming === 'POSTPAID' ? '#f0fdf4' : '#ffffff',
                      borderRadius: '12px',
                      padding: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '1.2rem' }}>📝</span>
                      <strong style={{ fontSize: '0.95rem', color: paymentTiming === 'POSTPAID' ? '#166534' : '#1e293b' }}>
                        後会計 (おすすめ)
                      </strong>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
                      居酒屋・焼肉・レストラン向け。席でQRやスタッフ注文を行い、お食事後にレジでまとめて会計します。
                    </p>
                  </div>

                  <div
                    onClick={() => setPaymentTiming('PREPAID')}
                    style={{
                      border: `2px solid ${paymentTiming === 'PREPAID' ? '#1b813e' : '#e2e8f0'}`,
                      background: paymentTiming === 'PREPAID' ? '#f0fdf4' : '#ffffff',
                      borderRadius: '12px',
                      padding: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '1.2rem' }}>⚡</span>
                      <strong style={{ fontSize: '0.95rem', color: paymentTiming === 'PREPAID' ? '#166534' : '#1e293b' }}>
                        前会計
                      </strong>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
                      カフェ・フードコート向け。注文時または入店時に先に会計を済ませてから商品を提供します。
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.88rem', marginBottom: '6px', color: '#334155' }}>
                  インボイス登録番号（任意）
                </label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="例: T1234567890123"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.95rem',
                    boxSizing: 'border-box',
                  }}
                />
                <span style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
                  ※適格請求書発行事業者の登録番号がある場合に入力してください。レシートに自動印字されます。
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '28px' }}>
              <button
                type="button"
                className="primary-button"
                style={{ padding: '12px 28px', fontSize: '1rem', fontWeight: 700, borderRadius: '12px' }}
                onClick={() => {
                  if (!storeName.trim()) {
                    setError('店舗名を入力してください。')
                    return
                  }
                  setError(null)
                  setStep(2)
                }}
              >
                次へ進む（税率・価格設定） →
              </button>
            </div>
          </div>
        )}

        {/* ---------------- STEP 2: 税率 & 価格表示設定 ---------------- */}
        {step === 2 && (
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 8px 0', color: '#1e293b' }}>
              Step 2. 税率と価格表示方式を設定してください
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#64748b', margin: '0 0 20px 0' }}>
              メニュー画面やレシートでの消費税計算ルールを決定します。
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.88rem', marginBottom: '8px', color: '#334155' }}>
                  価格表示方式 <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div
                    onClick={() => setTaxDisplayMode('INCLUDED')}
                    style={{
                      border: `2px solid ${taxDisplayMode === 'INCLUDED' ? '#1b813e' : '#e2e8f0'}`,
                      background: taxDisplayMode === 'INCLUDED' ? '#f0fdf4' : '#ffffff',
                      borderRadius: '12px',
                      padding: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '1.2rem' }}>🏷️</span>
                      <strong style={{ fontSize: '0.95rem', color: taxDisplayMode === 'INCLUDED' ? '#166534' : '#1e293b' }}>
                        税込表示 (推奨)
                      </strong>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
                      総額表示義務に対応。メニューの価格をそのまま税込として扱い、端数が出ずシンプルです。
                    </p>
                  </div>

                  <div
                    onClick={() => setTaxDisplayMode('EXCLUDED')}
                    style={{
                      border: `2px solid ${taxDisplayMode === 'EXCLUDED' ? '#1b813e' : '#e2e8f0'}`,
                      background: taxDisplayMode === 'EXCLUDED' ? '#f0fdf4' : '#ffffff',
                      borderRadius: '12px',
                      padding: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '1.2rem' }}>📊</span>
                      <strong style={{ fontSize: '0.95rem', color: taxDisplayMode === 'EXCLUDED' ? '#166534' : '#1e293b' }}>
                        税抜表示
                      </strong>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
                      本体価格を表示し、会計時に消費税を別途加算します（外税計算）。
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.88rem', marginBottom: '6px', color: '#334155' }}>
                    標準税率 (%)
                  </label>
                  <input
                    type="number"
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                    min={0}
                    max={100}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '1rem',
                      boxSizing: 'border-box',
                    }}
                  />
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
                    店内飲食・アルコール等 (通常 10%)
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.88rem', marginBottom: '6px', color: '#334155' }}>
                    軽減税率 (%)
                  </label>
                  <input
                    type="number"
                    value={reducedTaxRate}
                    onChange={(e) => setReducedTaxRate(Number(e.target.value))}
                    min={0}
                    max={100}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '1rem',
                      boxSizing: 'border-box',
                    }}
                  />
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
                    テイクアウト・持ち帰り用 (通常 8%)
                  </span>
                </div>
              </div>

              {/* プレビュー表示 */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '14px 18px',
                  fontSize: '0.88rem',
                  color: '#475569',
                }}
              >
                💡 <strong>表示例:</strong> ¥1,000の商品の場合、メニューには{' '}
                <strong style={{ color: '#0f172a' }}>
                  {taxDisplayMode === 'INCLUDED' ? '¥1,000 (税込)' : '¥1,000 (税抜) → 会計時 ¥1,100'}
                </strong>{' '}
                として計算・案内されます。
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '28px' }}>
              <button
                type="button"
                className="secondary-button"
                style={{ padding: '12px 20px', borderRadius: '12px' }}
                onClick={() => setStep(1)}
              >
                ← 戻る
              </button>
              <button
                type="button"
                className="primary-button"
                style={{ padding: '12px 28px', fontSize: '1rem', fontWeight: 700, borderRadius: '12px' }}
                onClick={() => {
                  setError(null)
                  setStep(3)
                }}
              >
                次へ進む（テーブル卓数設定） →
              </button>
            </div>
          </div>
        )}

        {/* ---------------- STEP 3: テーブル卓数の調整 ---------------- */}
        {step === 3 && (
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 8px 0', color: '#1e293b' }}>
              Step 3. 店内のテーブル（卓数）を調整してください
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#64748b', margin: '0 0 16px 0' }}>
              自動投入された4卓をベースに、実店舗の席数に合わせて増やしたりテーブル名を変更できます。
            </p>

            {/* 一括設定プリセットバー */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                padding: '14px 18px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px',
              }}
            >
              <div>
                <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>現在の卓数: </span>
                <strong style={{ fontSize: '1.25rem', color: '#1b813e', marginLeft: '4px' }}>
                  {tables.length}
                </strong>
                <span style={{ fontSize: '0.85rem', color: '#475569' }}> 卓</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>クイック卓数:</span>
                {[4, 6, 8, 10, 12].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    className="secondary-button"
                    style={{
                      fontSize: '0.8rem',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      background: tables.length === cnt ? '#1b813e' : '#ffffff',
                      color: tables.length === cnt ? '#ffffff' : '#334155',
                      borderColor: tables.length === cnt ? '#1b813e' : '#cbd5e1',
                      fontWeight: tables.length === cnt ? 700 : 500,
                    }}
                    onClick={() => handleSetTableCount(cnt)}
                  >
                    {cnt}卓
                  </button>
                ))}
              </div>
            </div>

            {/* テーブル一覧グリッド */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                gap: '12px',
                maxHeight: '260px',
                overflowY: 'auto',
                padding: '6px 2px',
                marginBottom: '16px',
              }}
            >
              {tables.map((t, index) => (
                <div
                  key={t.id || `new-${index}`}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '12px',
                    padding: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                    position: 'relative',
                  }}
                >
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>卓 #{index + 1}</span>
                  <input
                    type="text"
                    value={t.label}
                    onChange={(e) => handleTableLabelChange(index, e.target.value)}
                    placeholder={`卓 ${index + 1}`}
                    style={{
                      width: '80%',
                      textAlign: 'center',
                      fontWeight: 700,
                      fontSize: '1rem',
                      padding: '4px',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0',
                    }}
                  />
                  {tables.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTable(index)}
                      style={{
                        fontSize: '0.75rem',
                        color: '#ef4444',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '2px 6px',
                      }}
                      title="この卓を削除"
                    >
                      削除
                    </button>
                  )}
                </div>
              ))}

              {/* 卓追加カード */}
              <button
                type="button"
                onClick={handleAddTable}
                style={{
                  border: '2px dashed #94a3b8',
                  borderRadius: '12px',
                  background: '#f8fafc',
                  padding: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  minHeight: '85px',
                  color: '#475569',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  gap: '4px',
                }}
              >
                <span style={{ fontSize: '1.3rem', lineHeight: 1 }}>+</span>
                <span>卓を追加</span>
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '28px' }}>
              <button
                type="button"
                className="secondary-button"
                style={{ padding: '12px 20px', borderRadius: '12px' }}
                onClick={() => setStep(2)}
                disabled={saving}
              >
                ← 戻る
              </button>
              <button
                type="button"
                className="primary-button"
                style={{
                  padding: '12px 32px',
                  fontSize: '1rem',
                  fontWeight: 700,
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #1b813e 0%, #15803d 100%)',
                  boxShadow: '0 4px 14px rgba(27, 129, 62, 0.35)',
                }}
                onClick={handleSaveAll}
                disabled={saving}
              >
                {saving ? '設定を保存中...' : '💾 設定を保存して完了 →'}
              </button>
            </div>
          </div>
        )}

        {/* ---------------- STEP 4: セットアップ完了 & 次のアクション案内 ---------------- */}
        {step === 4 && (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: '#dcfce7',
                color: '#15803d',
                fontSize: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              🎉
            </div>

            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 10px 0', color: '#0f172a' }}>
              初期セットアップが完了しました！
            </h3>
            <p style={{ fontSize: '0.92rem', color: '#64748b', lineHeight: 1.6, margin: '0 0 24px 0' }}>
              店舗基本設定、税率、および <strong>{tables.length}卓</strong> のテーブル準備が整いました。
              <br />
              お客様のスマホQR注文やスタッフの注文入力受付を今すぐ開始できます。
            </p>

            {/* サマリーカード */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                padding: '18px 24px',
                marginBottom: '28px',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
                textAlign: 'center',
              }}
            >
              <div>
                <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block' }}>店舗名</span>
                <strong style={{ fontSize: '1rem', color: '#0f172a' }}>{storeName}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block' }}>会計方式 / 税率</span>
                <strong style={{ fontSize: '1rem', color: '#0f172a' }}>
                  {paymentTiming === 'POSTPAID' ? '後会計' : '前会計'} (税率{taxRate}%)
                </strong>
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block' }}>テーブル数</span>
                <strong style={{ fontSize: '1rem', color: '#1b813e' }}>{tables.length} 卓</strong>
              </div>
            </div>

            {/* 次のおすすめアクション 3大カード */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '28px', textAlign: 'left' }}>
              <div
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '14px',
                  background: '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}
              >
                <div>
                  <span style={{ fontSize: '1.4rem', display: 'block', marginBottom: '6px' }}>🖨️</span>
                  <strong style={{ fontSize: '0.9rem', color: '#0f172a', display: 'block', marginBottom: '4px' }}>
                    卓上QRコードを確認
                  </strong>
                  <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
                    客席に置くスマホ注文用QRコードを表示・印刷します。
                  </p>
                </div>
                <button
                  type="button"
                  className="secondary-button"
                  style={{ marginTop: '12px', fontSize: '0.8rem', padding: '6px 10px', width: '100%' }}
                  onClick={() => {
                    onClose()
                    if (onNavigateToTab) onNavigateToTab('tables')
                  }}
                >
                  テーブル一覧へ →
                </button>
              </div>

              <div
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '14px',
                  background: '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}
              >
                <div>
                  <span style={{ fontSize: '1.4rem', display: 'block', marginBottom: '6px' }}>🍽️</span>
                  <strong style={{ fontSize: '0.9rem', color: '#0f172a', display: 'block', marginBottom: '4px' }}>
                    メニューをカスタマイズ
                  </strong>
                  <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
                    商品の追加、価格変更、トッピングの調整を行います。
                  </p>
                </div>
                <button
                  type="button"
                  className="secondary-button"
                  style={{ marginTop: '12px', fontSize: '0.8rem', padding: '6px 10px', width: '100%' }}
                  onClick={() => {
                    onClose()
                    if (onNavigateToTab) onNavigateToTab('items')
                  }}
                >
                  商品マスタへ →
                </button>
              </div>

              <div
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '14px',
                  background: '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}
              >
                <div>
                  <span style={{ fontSize: '1.4rem', display: 'block', marginBottom: '6px' }}>📱</span>
                  <strong style={{ fontSize: '0.9rem', color: '#0f172a', display: 'block', marginBottom: '4px' }}>
                    フロア画面を体験
                  </strong>
                  <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
                    実際の席伝票の発行や注文の確認画面を試します。
                  </p>
                </div>
                <button
                  type="button"
                  className="secondary-button"
                  style={{ marginTop: '12px', fontSize: '0.8rem', padding: '6px 10px', width: '100%' }}
                  onClick={() => {
                    onClose()
                    if (onNavigateToView) onNavigateToView('staff')
                  }}
                >
                  スタッフ画面を開く →
                </button>
              </div>
            </div>

            <button
              type="button"
              className="primary-button"
              style={{ padding: '14px 36px', fontSize: '1.02rem', fontWeight: 700, borderRadius: '12px', width: '100%' }}
              onClick={onClose}
            >
              管理ダッシュボードを開く
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
