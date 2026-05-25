import { formatError } from './appUtils'
import { LiveLine } from '../types'

export type TicketReceipt = {
  ticketNo: string
  orderedAt: string
  subtotal: number
  lines: { id: string; itemName: string; qty: number; subtotal: number }[]
}

export function nextKdsStatus(status: LiveLine['kds_status']): 'NEW' | 'COOKING' | 'SERVED' {
  if (status === 'NEW') return 'COOKING'
  if (status === 'COOKING') return 'SERVED'
  return 'NEW'
}

export function kdsStatusLabel(status: LiveLine['kds_status'] | 'NEW' | 'COOKING' | 'SERVED'): string {
  if (status === 'NEW') return '未調理'
  if (status === 'COOKING') return '調理中'
  if (status === 'SERVED') return '提供済み'
  return '取消'
}

export function ticketStatusFromLines(lines: LiveLine[]): 'NEW' | 'COOKING' | 'SERVED' {
  if (lines.length === 0) return 'NEW'
  if (lines.some((line) => line.kds_status === 'NEW')) return 'NEW'
  if (lines.some((line) => line.kds_status === 'COOKING')) return 'COOKING'
  return 'SERVED'
}

export function messageFromStaffApiError(err: unknown): string {
  const raw = formatError(err)
  if (raw.startsWith('open_ticket_exists:')) {
    return `この卓には進行中の伝票があります: ${raw.replace('open_ticket_exists:', '')}`
  }
  if (raw === 'ticket_not_open') return 'この伝票は会計確定済みです。'
  if (raw === 'received_amount_insufficient') return '預かり金額が会計金額以上になるように入力してください。'
  if (raw === 'staff_session_missing') return 'Staff セッションが見つかりません。再ログイン後にもう一度お試しください。'
  if (raw === 'staff_store_slug_missing') return 'Staff prototype の店舗設定が見つかりません。.env.local を確認してください。'
  if (raw === 'staff_table_not_found') return '選択したテーブル情報を読み込めませんでした。一度画面を更新してください。'
  return raw
}

export function createTicketReceipt(ticket: { ticket_no: string; ordered_at: string; reference_subtotal: number; lines: LiveLine[] }): TicketReceipt {
  return {
    ticketNo: ticket.ticket_no,
    orderedAt: ticket.ordered_at,
    subtotal: ticket.reference_subtotal,
    lines: ticket.lines.map((line) => ({
      id: line.id,
      itemName: line.item_name_snapshot,
      qty: line.quantity,
      subtotal: line.line_subtotal,
    })),
  }
}
export function createLocalTicketReceipt(ticketNo: string, orderedAt: string, lines: TicketReceipt['lines']): TicketReceipt {
  return {
    ticketNo,
    orderedAt,
    subtotal: lines.reduce((acc, l) => acc + l.subtotal, 0),
    lines,
  }
}
