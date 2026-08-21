
import { AdminStoreSettings } from './types'

type Props = {
  adminStoreName: string
  adminStoreCode: string
  adminStoreSlug: string
  adminStoreTimezone: string
  adminStoreBusinessOffsetMinutes: string
  adminStorePaymentTimingMode: 'PREPAID' | 'POSTPAID'
  adminStoreTicketNoResetMode: 'DAILY' | 'SEQUENCE'
  adminStoreTicketNoDigits: string
  adminStoreTaxRate: string
  adminStoreReducedTaxRate: string
  adminStoreTaxDisplayMode: 'INCLUDED' | 'EXCLUDED'
  disabled: boolean
  onStoreNameChange: (value: string) => void
  onStoreCodeChange: (value: string) => void
  onStoreSlugChange: (value: string) => void
  onStoreTimezoneChange: (value: string) => void
  onStoreBusinessOffsetMinutesChange: (value: string) => void
  onStorePaymentTimingModeChange: (value: 'PREPAID' | 'POSTPAID') => void
  onStoreTicketNoResetModeChange: (value: 'DAILY' | 'SEQUENCE') => void
  onStoreTicketNoDigitsChange: (value: string) => void
  onStoreTaxRateChange: (value: string) => void
  onStoreReducedTaxRateChange: (value: string) => void
  onStoreTaxDisplayModeChange: (value: 'INCLUDED' | 'EXCLUDED') => void
  onSaveStoreSettings: () => void
}

export function AdminStoreTab(props: Props) {
  return (
    <div className="ops-grid">
      <section className="panel admin-section-store">
        <div className="admin-list-head">
          <div>
<h2>店舗設定</h2>
          </div>
        </div>
        <div className="form-stack">
          <label className="admin-store-field">
            <span>店舗名</span>
            <input value={props.adminStoreName} onChange={(event) => props.onStoreNameChange(event.target.value)} disabled={props.disabled} />
          </label>
          <label className="admin-store-field">
            <span>店舗コード</span>
            <input value={props.adminStoreCode} onChange={(event) => props.onStoreCodeChange(event.target.value)} disabled={props.disabled} />
          </label>
          <label className="admin-store-field">
            <span>店舗スラッグ (URL用)</span>
            <input value={props.adminStoreSlug} onChange={(event) => props.onStoreSlugChange(event.target.value)} disabled={props.disabled} />
          </label>
          <label className="admin-store-field">
            <span>タイムゾーン</span>
            <input value={props.adminStoreTimezone} onChange={(event) => props.onStoreTimezoneChange(event.target.value)} disabled={props.disabled} />
          </label>
          <label className="admin-store-field">
            <span>営業日切替時刻</span>
            <input type="number" value={props.adminStoreBusinessOffsetMinutes} onChange={(event) => props.onStoreBusinessOffsetMinutesChange(event.target.value)} disabled={props.disabled} />
            <p className="hint" style={{ fontSize: "0.85rem", color: "var(--text-sub)", marginTop: "4px" }}>{"例: 深夜営業があり AM 5:00 で営業日付を切り替えたい場合は AM 0:00 からの経過時間を分で設定します （60分×5＝300分）"}</p>
          </label>
          <label className="admin-store-field">
            <span>標準税率 (%)</span>
            <input type="number" value={props.adminStoreTaxRate} onChange={(event) => props.onStoreTaxRateChange(event.target.value)} disabled={props.disabled} />
          </label>
          <label className="admin-store-field">
            <span>軽減税率 (%)</span>
            <input type="number" value={props.adminStoreReducedTaxRate} onChange={(event) => props.onStoreReducedTaxRateChange(event.target.value)} disabled={props.disabled} />
          </label>
          <label className="admin-store-field">
            <span>税表示区分</span>
            <select value={props.adminStoreTaxDisplayMode} onChange={(event) => props.onStoreTaxDisplayModeChange(event.target.value as 'INCLUDED' | 'EXCLUDED')} disabled={props.disabled}>
              <option value="INCLUDED">税込表示</option>
              <option value="EXCLUDED">税抜表示</option>
            </select>
          </label>
          <label className="admin-store-field">
            <span>支払いタイミング</span>
            <select value={props.adminStorePaymentTimingMode} onChange={(event) => props.onStorePaymentTimingModeChange(event.target.value as 'PREPAID' | 'POSTPAID')} disabled={props.disabled}>
              <option value="PREPAID">先払い</option>
              <option value="POSTPAID">後払い</option>
            </select>
          </label>
          <label className="admin-store-field">
            <span>伝票番号リセット設定</span>
            <select value={props.adminStoreTicketNoResetMode} onChange={(event) => props.onStoreTicketNoResetModeChange(event.target.value as 'DAILY' | 'SEQUENCE')} disabled={props.disabled}>
              <option value="DAILY">毎日リセット</option>
              <option value="SEQUENCE">通し番号</option>
            </select>
          </label>
          <label className="admin-store-field">
            <span>伝票番号桁数</span>
            <input type="number" value={props.adminStoreTicketNoDigits} onChange={(event) => props.onStoreTicketNoDigitsChange(event.target.value)} disabled={props.disabled} />
          </label>
          <div className="button-row">
            <button className="primary-button" onClick={props.onSaveStoreSettings} disabled={props.disabled}>店舗設定を保存</button>
          </div>
        </div>
      </section>
    </div>
  )
}
