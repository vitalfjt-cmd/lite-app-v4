import { useMemo, useState } from 'react'
import type { AdminTableRow } from './types'
import { buildCustomerUrl, buildQrImageUrl } from '../../lib/appUtils'

type Props = {
  isOpen: boolean
  storeName: string
  storeSlug: string
  tables: AdminTableRow[]
  onClose: () => void
}

type LayoutMode = '2-per-page' | '4-per-page' | '1-per-page'

export function AdminTableBatchQrPrintModal({
  isOpen,
  storeName,
  storeSlug,
  tables,
  onClose,
}: Props) {
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('2-per-page')
  const [onlyActive, setOnlyActive] = useState(true)
  const [customNote, setCustomNote] = useState('お会計は伝票をお持ちの上、レジまでお越しください')

  const targetTables = useMemo(() => {
    const list = onlyActive ? tables.filter((t) => t.is_active) : tables
    return [...list].sort((a, b) => {
      const sa = a.sort_order ?? 0
      const sb = b.sort_order ?? 0
      if (sa !== sb) return sa - sb
      return a.label.localeCompare(b.label, 'ja', { numeric: true, sensitivity: 'base' })
    })
  }, [tables, onlyActive])

  if (!isOpen) return null

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="payment-modal-backdrop batch-qr-modal-backdrop" onClick={onClose}>
      <section
        className="panel admin-modal-panel batch-qr-modal-panel"
        onClick={(e) => e.stopPropagation()}
      >
        {/* モーダルヘッダー（印刷時は非表示） */}
        <div className="admin-modal-head no-print">
          <div>
            <p className="eyebrow">PRINT & PDF EXPORT</p>
            <h2>全テーブルQRコード一括印刷 (A4)</h2>
          </div>
          <button className="secondary-button" type="button" onClick={onClose}>
            閉じる
          </button>
        </div>

        {/* 設定・操作バー（印刷時は非表示） */}
        <div className="batch-qr-controls no-print">
          <div className="batch-qr-control-group">
            <label className="batch-qr-label">
              <span>A4面付けレイアウト:</span>
              <select
                value={layoutMode}
                onChange={(e) => setLayoutMode(e.target.value as LayoutMode)}
                className="batch-qr-select"
              >
                <option value="2-per-page">2卓 / A4縦（卓上三角POP・スタンド推奨）</option>
                <option value="4-per-page">4卓 / A4縦（省スペース・小カード向け）</option>
                <option value="1-per-page">1卓 / A4縦（ポスター・特大案内向け）</option>
              </select>
            </label>

            <label className="batch-qr-checkbox-label">
              <input
                type="checkbox"
                checked={onlyActive}
                onChange={(e) => setOnlyActive(e.target.checked)}
              />
              <span>有効なテーブルのみ印刷 ({targetTables.length}卓)</span>
            </label>
          </div>

          <div className="batch-qr-control-group">
            <label className="batch-qr-label" style={{ flex: 1 }}>
              <span>下部案内メッセージ:</span>
              <input
                type="text"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="例: お会計は伝票をお持ちの上レジまで"
                className="batch-qr-input"
              />
            </label>

            <button
              className="primary-button batch-qr-print-btn"
              type="button"
              onClick={handlePrint}
            >
              <span className="btn-icon">🖨️</span> A4印刷・PDF出力
            </button>
          </div>

          <div className="batch-qr-help">
            💡 <strong>PDFとして保存する場合:</strong> 印刷ボタンを押した後の印刷ダイアログで、送信先（プリンター）を「<strong>PDFに保存</strong>」に変更してください。
          </div>
        </div>

        {/* 印刷用シートコンテナ */}
        <div className="batch-qr-print-scroll-wrap">
          <div className={`batch-qr-print-sheet layout-${layoutMode}`} id="batch-qr-printable-area">
            {targetTables.length === 0 ? (
              <div className="batch-qr-empty">印刷対象のテーブルがありません。</div>
            ) : (
              targetTables.map((table) => {
                const customerUrl =
                  table.customer_url ||
                  buildCustomerUrl(window.location, storeSlug, table.qr_token, null, 'customer') ||
                  ''
                const qrImgSrc = customerUrl ? buildQrImageUrl(customerUrl) : ''

                return (
                  <article key={table.id} className="batch-qr-card">
                    <div className="batch-qr-cut-guide">
                      <span className="cut-icon">✂</span>
                      <span className="cut-text">切り取り線</span>
                    </div>

                    <div className="batch-qr-inner">
                      <div className="batch-qr-store-name">{storeName || '店舗'}</div>
                      <div className="batch-qr-table-badge">
                        <span className="table-prefix">TABLE</span>
                        <strong className="table-number">{table.label}</strong>
                      </div>

                      <div className="batch-qr-headline">
                        スマートフォンで注文できます
                      </div>

                      <div className="batch-qr-code-box">
                        {qrImgSrc ? (
                          <img
                            src={qrImgSrc}
                            alt={`${table.label} QR`}
                            className="batch-qr-image"
                          />
                        ) : (
                          <div className="batch-qr-fallback">QR生成不可</div>
                        )}
                      </div>

                      <div className="batch-qr-steps">
                        <div className="step-item">
                          <span className="step-num">1</span>
                          <span className="step-desc">カメラでQRを読取</span>
                        </div>
                        <span className="step-arrow">→</span>
                        <div className="step-item">
                          <span className="step-num">2</span>
                          <span className="step-desc">メニューを選んで注文</span>
                        </div>
                        <span className="step-arrow">→</span>
                        <div className="step-item">
                          <span className="step-num">3</span>
                          <span className="step-desc">お会計はレジへ</span>
                        </div>
                      </div>

                      {customNote ? (
                        <p className="batch-qr-custom-note">{customNote}</p>
                      ) : null}

                      <div className="batch-qr-footer">
                        <span>アプリのダウンロード不要（Webブラウザで動作します）</span>
                        <span className="token-hint">Token: {table.qr_token}</span>
                      </div>
                    </div>
                  </article>
                )
              })
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
