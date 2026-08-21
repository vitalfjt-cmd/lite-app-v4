import { useMemo, useState } from 'react'
import { AdminFloor } from './types'

type Props = {
  liveFloors: AdminFloor[]
  disabled: boolean
  onEditFloor: (id: string) => void
  onDeleteFloor: (id: string) => void
  onOpenModal: () => void
}

export function AdminFloorsTab(props: Props) {
  const [searchDraft, setSearchDraft] = useState('')
  const [search, setSearch] = useState('')

  const filteredFloors = useMemo(() => {
    const query = search.trim().toLowerCase()
    return props.liveFloors
      .filter((floor) =>
        !query || floor.name.toLowerCase().includes(query)
      )
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name, 'ja'))
  }, [props.liveFloors, search])

  return (
    <div className="ops-grid">
      <section className="panel admin-list-panel admin-list-panel-wide admin-section-floors">
        <div className="admin-list-head">
          <div>
            <h2>フロア一覧</h2>
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
            <input value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} placeholder="フロア名で検索" />
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
                <th>フロア名</th>
                <th>表示順</th>
                <th>状態</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredFloors.map((floor) => (
                <tr key={floor.id}>
                  <td>{floor.name}</td>
                  <td>{floor.sort_order ?? 0}</td>
                  <td>{floor.is_active ? '有効' : '無効'}</td>
                  <td>
                    <div className="admin-table-actions">
                      <button className="secondary-button" onClick={() => {
                        props.onEditFloor(floor.id)
                      }}>編集</button>
                      <button className="danger-button" onClick={() => props.onDeleteFloor(floor.id)} disabled={props.disabled}>削除</button>
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
