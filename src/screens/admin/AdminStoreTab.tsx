
import { AdminStoreSettings } from './types'

type Props = {
  adminStoreName: string
  adminStoreSlug: string
  adminStoreTimezone: string
  adminStoreBusinessOffsetMinutes: string
  adminStorePaymentTimingMode: 'PREPAID' | 'POSTPAID'
  adminStoreTicketNoResetMode: 'DAILY' | 'SEQUENCE'
  adminStoreTicketNoDigits: string
  disabled: boolean
  onStoreNameChange: (value: string) => void
  onStoreSlugChange: (value: string) => void
  onStoreTimezoneChange: (value: string) => void
  onStoreBusinessOffsetMinutesChange: (value: string) => void
  onStorePaymentTimingModeChange: (value: 'PREPAID' | 'POSTPAID') => void
  onStoreTicketNoResetModeChange: (value: 'DAILY' | 'SEQUENCE') => void
  onStoreTicketNoDigitsChange: (value: string) => void
  onSaveStoreSettings: () => void
}

export function AdminStoreTab(props: Props) {
  return (
    <div className="ops-grid">
      <section className="panel admin-section-store">
        <div className="admin-list-head">
          <div>
            <p className="eyebrow">STORE</p>
            <h2>店舗設定</h2>
          </div>
        </div>
        <div className="form-stack">
          <label>店舗名<input value={props.adminStoreName} onChange={(event) => props.onStoreNameChange(event.target.value)} disabled={props.disabled} /></label>
          <label>店舗スラッグ (URL用)<input value={props.adminStoreSlug} onChange={(event) => props.onStoreSlugChange(event.target.value)} disabled={props.disabled} /></label>
          <label>タイムゾーン<input value={props.adminStoreTimezone} onChange={(event) => props.onStoreTimezoneChange(event.target.value)} disabled={props.disabled} /></label>
          <label>営業日切替オフセット (分)<input type="number" value={props.adminStoreBusinessOffsetMinutes} onChange={(event) => props.onStoreBusinessOffsetMinutesChange(event.target.value)} disabled={props.disabled} /></label>
          <label>
            支払いタイミング
            <select value={props.adminStorePaymentTimingMode} onChange={(event) => props.onStorePaymentTimingModeChange(event.target.value as 'PREPAID' | 'POSTPAID')} disabled={props.disabled}>
              <option value="PREPAID">先払い</option>
              <option value="POSTPAID">後払い</option>
            </select>
          </label>
          <label>
            伝票番号リセット設定
            <select value={props.adminStoreTicketNoResetMode} onChange={(event) => props.onStoreTicketNoResetModeChange(event.target.value as 'DAILY' | 'SEQUENCE')} disabled={props.disabled}>
              <option value="DAILY">毎日リセット</option>
              <option value="SEQUENCE">通し番号</option>
            </select>
          </label>
          <label>伝票番号桁数<input type="number" value={props.adminStoreTicketNoDigits} onChange={(event) => props.onStoreTicketNoDigitsChange(event.target.value)} disabled={props.disabled} /></label>
          <div className="button-row">
            <button className="primary-button" onClick={props.onSaveStoreSettings} disabled={props.disabled}>店舗設定を保存</button>
          </div>
        </div>
      </section>
    </div>
  )
}
