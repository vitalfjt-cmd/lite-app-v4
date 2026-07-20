import { useMemo, useState } from 'react'
import { AdminPaymentMethod } from './types'

type Props = {
  livePaymentMethods: AdminPaymentMethod[]
  disabled: boolean
  onEditPaymentMethod: (id: string) => void
  onDeletePaymentMethod: (id: string) => void
  onOpenModal: () => void
}

export function AdminPaymentMethodsTab(props: Props) {
  const [searchDraft, setSearchDraft] = useState('')
  const [search, setSearch] = useState('')

  const filteredMethods = useMemo(() => {
    const query = search.trim().toLowerCase()
    return props.livePaymentMethods
      .filter((pm) =>
        !query || pm.name.toLowerCase().includes(query)
      )
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name, 'ja'))
  }, [props.livePaymentMethods, search])

  return (
    <div className="ops-grid">
      <section className="panel admin-list-panel admin-list-panel-wide admin-section-payment-methods">
        <div className="admin-list-head">
          <div>
            <p className="eyebrow">PAYMENT METHOD</p>
            <h2>決済種別一覧</h2>
          </div>
          <div className="admin-list-actions">
            <button
              className="primary-button"
              type="button"
              disabled={props.disabled}
              onClick={props.onOpenModal}
            >
              新規追加
            </button>
          </div>
        </div>
        <div className="admin-filter-bar compact">
          <label className="admin-filter-field wide">
            <span>検索</span>
            <input value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} placeholder="決済種別名で検索" />
          </label>
          <div className="admin-filter-actions">
            <button className="primary-button" type="button" onClick={() => setSearch(searchDraft)}>検索</button>
            <button className="secondary-button" type="button" onClick={() => {
              setSearchDraft('')
              setSearch('')
            }}>クリア</button>
          </div>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>決済種別名</th>
                <th>表示順</th>
                <th>状態</th>
                <th>釣銭</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredMethods.map((pm) => (
                <tr key={pm.id}>
                  <td>{pm.name}</td>
                  <td>{pm.sort_order ?? 0}</td>
                  <td>{pm.is_active ? '有効' : '無効'}</td>
                  <td>{pm.is_change_allowed ? '釣銭あり' : '釣銭なし'}</td>
                  <td>
                    <div className="admin-table-actions">
                      <button className="secondary-button" onClick={() => {
                        props.onEditPaymentMethod(pm.id)
                      }}>編集</button>
                      <button className="danger-button" onClick={() => props.onDeletePaymentMethod(pm.id)} disabled={props.disabled}>削除</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
