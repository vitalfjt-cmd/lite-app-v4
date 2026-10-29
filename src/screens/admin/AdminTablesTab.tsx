import { useMemo, useState } from 'react'
import { AdminTableRow } from './types'
import { AdminTableBatchQrPrintModal } from './AdminTableBatchQrPrintModal'

type Props = {
  liveTables: AdminTableRow[]
  disabled: boolean
  storeName?: string
  storeSlug?: string
  onEditTable: (id: string) => void
  onDeleteTable: (id: string) => void
  onShowQr: (id: string) => void
  onOpenModal: () => void
}

export function AdminTablesTab(props: Props) {
  const [tableSearchDraft, setTableSearchDraft] = useState('')
  const [tableSearch, setTableSearch] = useState('')
  const [isBatchQrModalOpen, setIsBatchQrModalOpen] = useState(false)

  const filteredTables = useMemo(() => {
    const search = tableSearch.trim().toLowerCase()
    return props.liveTables
      .filter((table) =>
        !search ||
        [table.label, table.qr_token, table.group_name ?? ''].some((value) => value.toLowerCase().includes(search)),
      )
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.label.localeCompare(b.label, 'ja'))
  }, [props.liveTables, tableSearch])

  return (
    <div className="ops-grid">
      <section className="panel admin-list-panel admin-list-panel-wide admin-section-tables">
        <div className="admin-list-head">
          <div>
            <h2>テーブル一覧</h2>
          </div>
          <div className="admin-list-actions">
            <button
              className="secondary-button batch-qr-trigger-btn"
              type="button"
              onClick={() => setIsBatchQrModalOpen(true)}
              title="すべてのテーブルの卓上QRコードをA4用紙またはPDFにまとめて出力します"
            >
              🖨️ 全卓QR一括印刷 (A4)
            </button>
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
            <input value={tableSearchDraft} onChange={(event) => setTableSearchDraft(event.target.value)} placeholder="テーブル名・QRトークン・グループで検索" />
          </label>
          <div className="admin-filter-actions">
            <button className="primary-button" type="button" onClick={() => setTableSearch(tableSearchDraft)}>検索</button>
            <button className="secondary-button" type="button" onClick={() => {
              setTableSearchDraft('')
              setTableSearch('')
            }}>クリア</button>
          </div>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>テーブル名</th>
                <th>QRトークン</th>
                <th>グループ</th>
                <th>表示順</th>
                <th>状態</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredTables.map((table) => (
                <tr key={table.id}>
                  <td>{table.label}</td>
                  <td>{table.qr_token}</td>
                  <td>{table.group_name || '-'}</td>
                  <td>{table.sort_order ?? 0}</td>
                  <td>{table.is_active ? '有効' : '無効'}</td>
                  <td>
                    <div className="admin-table-actions">
                      <button className="secondary-button" onClick={() => {
                        props.onEditTable(table.id)
                      }}>編集</button>
                      <button className="secondary-button" onClick={() => props.onShowQr(table.id)} type="button">
                        QR
                      </button>
                      <button className="danger-button" onClick={() => props.onDeleteTable(table.id)} disabled={props.disabled}>削除</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <AdminTableBatchQrPrintModal
        isOpen={isBatchQrModalOpen}
        storeName={props.storeName || ''}
        storeSlug={props.storeSlug || ''}
        tables={props.liveTables}
        onClose={() => setIsBatchQrModalOpen(false)}
      />
    </div>
  )
}
