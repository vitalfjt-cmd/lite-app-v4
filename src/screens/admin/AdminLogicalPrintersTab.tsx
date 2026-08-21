import React, { useMemo, useState } from 'react'
import { AdminLogicalPrinter } from './types'

type Props = {
  logicalPrinters: AdminLogicalPrinter[]
  disabled: boolean
  onEditLogicalPrinter: (lp: AdminLogicalPrinter) => void
  onDeleteLogicalPrinter: (id: string) => void
  onOpenModal: () => void
}

export function AdminLogicalPrintersTab(props: Props) {
  const [searchDraft, setSearchDraft] = useState('')
  const [search, setSearch] = useState('')

  const filteredPrinters = useMemo(() => {
    const query = search.trim().toLowerCase()
    return props.logicalPrinters
      .filter((lp) =>
        !query ||
        lp.name.toLowerCase().includes(query) ||
        lp.code.toLowerCase().includes(query)
      )
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.code.localeCompare(b.code))
  }, [props.logicalPrinters, search])

  return (
    <div className="ops-grid">
      <section className="panel admin-list-panel admin-list-panel-wide admin-section-printers">
        <div className="admin-list-head">
          <div>
            <h2>部門別出力プリンター一覧 (論理)</h2>
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
            <input value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} placeholder="名前やコードで検索" />
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
                <th>論理コード</th>
                <th>部門・出力名</th>
                <th>表示順</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredPrinters.map((lp) => (
                <tr key={lp.id}>
                  <td><span className="code-badge">{lp.code}</span></td>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {lp.name}
                      {lp.is_receipt_printer && (
                        <span style={{ backgroundColor: '#e3f2fd', color: '#0d47a1', fontSize: '11px', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                          会計伝票
                        </span>
                      )}
                    </span>
                  </td>
                  <td>{lp.sort_order ?? 0}</td>
                  <td>
                    <div className="admin-table-actions">
                      <button className="secondary-button" onClick={() => {
                        props.onEditLogicalPrinter(lp)
                      }}>編集</button>
                      <button className="danger-button" onClick={() => props.onDeleteLogicalPrinter(lp.id)} disabled={props.disabled}>削除</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredPrinters.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: '#999' }}>
                    データがありません。新規追加ボタンから登録してください。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
