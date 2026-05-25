import { useMemo, useState } from 'react'
import { buildQrImageUrl } from '../lib/appUtils'

type Props = {
  isOpen: boolean
  storeName: string
  tableLabel: string
  qrToken: string
  customerUrl: string | null
  onClose: () => void
}

export function TableQrModal({ isOpen, storeName, tableLabel, qrToken, customerUrl, onClose }: Props) {
  const [copyMessage, setCopyMessage] = useState<string | null>(null)
  const qrImageUrl = useMemo(() => (customerUrl ? buildQrImageUrl(customerUrl) : null), [customerUrl])

  if (!isOpen) return null

  async function handleCopy() {
    if (!customerUrl) return
    try {
      await navigator.clipboard.writeText(customerUrl)
      setCopyMessage('URLをコピーしました。')
    } catch {
      window.prompt('このURLをコピーしてください。', customerUrl)
      setCopyMessage('URLを表示しました。')
    }
  }

  function handlePrint() {
    if (!customerUrl) return
    window.print()
  }

  return (
    <div className="payment-modal-backdrop" onClick={onClose}>
      <section className="panel admin-modal-panel table-qr-modal" onClick={(event) => event.stopPropagation()}>
        <div className="admin-modal-head">
          <div>
            <p className="eyebrow">TABLE QR</p>
            <h2>{tableLabel}</h2>
          </div>
          <button className="secondary-button" type="button" onClick={onClose}>
            閉じる
          </button>
        </div>

        <div className="table-qr-layout">
          <div className="table-qr-card">
            <div className="table-qr-sheet">
              <p className="eyebrow">Order QR</p>
              <h3>{storeName}</h3>
              <strong className="table-qr-label">{tableLabel}</strong>
              {qrImageUrl ? <img className="table-qr-image" src={qrImageUrl} alt={`${tableLabel} order QR`} /> : <div className="empty-state">URLを生成できませんでした。</div>}
              <div className="table-qr-token">Token: {qrToken}</div>
            </div>
          </div>

          <div className="table-qr-details">
            <label className="table-qr-url-field">
              <span>注文URL</span>
              <textarea readOnly rows={4} value={customerUrl ?? ''} />
            </label>
            <div className="table-qr-actions">
              <button className="primary-button" type="button" onClick={() => void handleCopy()} disabled={!customerUrl}>
                URLコピー
              </button>
              <a className={`secondary-button ${customerUrl ? '' : 'is-disabled'}`} href={customerUrl ?? undefined} rel="noreferrer" target="_blank">
                注文画面を開く
              </a>
              <button className="secondary-button" type="button" onClick={handlePrint} disabled={!customerUrl}>
                印刷
              </button>
            </div>
            <p className="panel-copy">
              スマホでQRを読み取るか、同じURLを開いて実卓テストできます。QR画像は外部生成サービスを利用しています。
            </p>
            {copyMessage ? <p className="notice success">{copyMessage}</p> : null}
          </div>
        </div>
      </section>
    </div>
  )
}
