
import { useMemo, useState } from 'react'
import { AdminStaffUserRow } from './types'

type Props = {
  liveStaffUsers: AdminStaffUserRow[]
  disabled: boolean
  prototypeLimitedMode: boolean
  onEditStaffUser: (id: string) => void
  onDeleteStaffUser: (id: string) => void
  onOpenModal: () => void
}

export function AdminStaffTab(props: Props) {
  const [staffSearchDraft, setStaffSearchDraft] = useState('')
  const [staffSearch, setStaffSearch] = useState('')

  const filteredStaffUsers = useMemo(() => {
    const search = staffSearch.trim().toLowerCase()
    return props.liveStaffUsers
      .filter((staff) =>
        !search ||
        [staff.display_name, staff.email ?? '', staff.role_type, staff.password_configured ? '設定済' : '未設定'].some((value) =>
          value.toLowerCase().includes(search),
        ),
      )
      .sort((a, b) => a.display_name.localeCompare(b.display_name, 'ja'))
  }, [props.liveStaffUsers, staffSearch])

  return (
    <div className="ops-grid">
      <section className="panel admin-list-panel admin-list-panel-wide admin-section-staff">
        <div className="admin-list-head">
          <div>
            <p className="eyebrow">STAFF</p>
            <h2>スタッフ一覧</h2>
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
            <input value={staffSearchDraft} onChange={(event) => setStaffSearchDraft(event.target.value)} placeholder="表示名・メール・ロールで検索" />
          </label>
          <div className="admin-filter-actions">
            <button className="primary-button" type="button" onClick={() => setStaffSearch(staffSearchDraft)}>検索</button>
            <button className="secondary-button" type="button" onClick={() => {
              setStaffSearchDraft('')
              setStaffSearch('')
            }}>クリア</button>
          </div>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table admin-table-staff">
            <colgroup>
              <col className="col-staff-name" />
              <col className="col-staff-email" />
              <col className="col-staff-role" />
              <col className="col-staff-status" />
              <col className="col-staff-auth" />
              <col className="col-staff-actions" />
            </colgroup>
            <thead>
              <tr>
                <th>表示名</th>
                <th>メール</th>
                <th>ロール</th>
                <th>状態</th>
                <th>{props.prototypeLimitedMode ? 'ログインPW' : 'Auth連携'}</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaffUsers.map((staff) => (
                <tr key={staff.id}>
                  <td className="admin-cell-name">{staff.display_name}</td>
                  <td className="admin-cell-email">{staff.email || '-'}</td>
                  <td className="admin-cell-role">{staff.role_type}</td>
                  <td className="admin-cell-status">{staff.is_active === false ? '無効' : '有効'}</td>
                  <td className="admin-cell-auth">{props.prototypeLimitedMode ? (staff.password_configured ? '設定済' : '未設定') : (staff.auth_user_id ? '連携済' : '未連携')}</td>
                  <td className="admin-cell-actions">
                    <div className="admin-table-actions">
                      <button className="secondary-button" onClick={() => {
                        props.onEditStaffUser(staff.id)
                      }}>編集</button>
                      <button className="danger-button" onClick={() => props.onDeleteStaffUser(staff.id)} disabled={props.disabled}>削除</button>
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
