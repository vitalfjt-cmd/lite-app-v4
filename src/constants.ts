import { AppView } from './types'

export const VIEWS: { id: AppView; label: string; caption: string }[] = [
  { id: 'customer', label: 'スマホ', caption: '' },
  { id: 'cust-tablet', label: 'タブレット', caption: '' },
  { id: 'staff', label: '伝票一覧', caption: '' },
  { id: 'kds', label: 'KDS', caption: '' },
  { id: 'seats', label: '座席情報', caption: '' },
  { id: 'admin', label: 'マスタメンテナンス', caption: '' },
  { id: 'sales', label: '売上管理', caption: '' },
]

export const PROTOTYPE_STAFF_SESSION_STORAGE_KEY = 'lite-pos.prototype-staff-session'

export const EMPTY_ACTIVE_STORE = {
  name: '',
  tableName: '',
  ticketNo: '',
}
