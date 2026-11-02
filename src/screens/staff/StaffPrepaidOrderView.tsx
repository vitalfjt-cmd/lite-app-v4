import React, { useState, useMemo } from 'react'
import { ToppingModal } from '../../components/ToppingModal'
import {
  StaffPrototypeTopCategory,
  StaffPrototypeSubCategory,
  StaffPrototypeItem,
  LiveTableRef,
  LiveMenuBook,
} from '../../types'
import { formatItemPrice } from '../../lib/priceUtils'

export type PrepaidCartItem = {
  id: string
  cartKey: string
  name: string
  price: number
  qty: number
  toppings: { id: string; name: string; price: number }[]
  toppingIds: string[]
}

type StaffPrepaidOrderViewProps = {
  storeName: string
  terminalName?: string
  staffMessage?: string | null
  handyTopCategories: StaffPrototypeTopCategory[]
  visibleHandySubCategories: StaffPrototypeSubCategory[]
  visibleHandyItems: StaffPrototypeItem[]
  handyTopCategoryId: string | null
  handySubCategoryId: string | null
  availableTables: LiveTableRef[]
  liveMenuBooks: LiveMenuBook[]
  selectedTableId: string
  selectedMenuBookId: string
  customerCount: number
  mutationBusy: string | null
  taxDisplayMode?: 'INCLUDED' | 'EXCLUDED'
  taxRate?: number
  reducedTaxRate?: number
  openBusinessDate?: string | null
  todayBusinessDate?: string
  yen: (val: number) => string
  setHandyTopCategoryId: (val: string | null) => void
  setHandySubCategoryId: (val: string | null) => void
  onTableChange: (tableId: string) => void
  onMenuBookChange: (menuBookId: string) => void
  onCustomerCountChange: (count: number) => void
  onOpenLauncher: () => void
  onSwitchToTicketList?: () => void
  onProceedToPayment: (cart: PrepaidCartItem[]) => Promise<void>
}

export function StaffPrepaidOrderView({
  storeName,
  terminalName,
  openBusinessDate,
  todayBusinessDate,
  staffMessage,
  handyTopCategories,
  visibleHandySubCategories,
  visibleHandyItems,
  handyTopCategoryId,
  handySubCategoryId,
  availableTables,
  liveMenuBooks,
  selectedTableId,
  selectedMenuBookId,
  customerCount,
  mutationBusy,
  taxDisplayMode,
  taxRate,
  reducedTaxRate,
  yen,
  setHandyTopCategoryId,
  setHandySubCategoryId,
  onTableChange,
  onMenuBookChange,
  onCustomerCountChange,
  onOpenLauncher,
  onSwitchToTicketList,
  onProceedToPayment,
}: StaffPrepaidOrderViewProps) {
  const [cart, setCart] = useState<PrepaidCartItem[]>([])
  const [showSlip, setShowSlip] = useState(false)
  const [toppingModalOpen, setToppingModalOpen] = useState(false)
  const [activeToppingItem, setActiveToppingItem] = useState<StaffPrototypeItem | null>(null)

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.qty, 0),
    [cart],
  )
  const cartItemCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.qty, 0),
    [cart],
  )

  const handleAddItem = (item: StaffPrototypeItem, selectedToppingIds: string[] = []) => {
    const selectedToppings = (item.toppings || []).filter((t) =>
      selectedToppingIds.includes(t.id),
    )
    const toppingsExtra = selectedToppings.reduce((sum, t) => sum + t.price, 0)
    const unitPrice = item.price + toppingsExtra
    const toppingKey = [...selectedToppingIds].sort().join('-')
    const cartKey = `${item.id}_${toppingKey}`

    setCart((prev) => {
      const existing = prev.find((c) => c.cartKey === cartKey)
      if (existing) {
        return prev.map((c) =>
          c.cartKey === cartKey ? { ...c, qty: c.qty + 1 } : c,
        )
      }
      return [
        ...prev,
        {
          id: item.id,
          cartKey,
          name: item.name,
          price: unitPrice,
          qty: 1,
          toppings: selectedToppings,
          toppingIds: selectedToppingIds,
        },
      ]
    })
  }

  const updateCartQty = (cartKey: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => (c.cartKey === cartKey ? { ...c, qty: c.qty + delta } : c))
        .filter((c) => c.qty > 0),
    )
  }

  const clearCart = () => {
    if (cart.length === 0) return
    if (window.confirm('カートの内容をすべて消去しますか？')) {
      setCart([])
    }
  }

  const handleCheckoutClick = async () => {
    if (cart.length === 0) return
    if (todayBusinessDate && openBusinessDate && todayBusinessDate > openBusinessDate) {
      const confirmed = window.confirm(
        `【営業日切替時刻を超過しています】\n\n` +
        `現在の営業日: ${openBusinessDate}\n` +
        `システム日付: ${todayBusinessDate}\n\n` +
        `前日の営業日（${openBusinessDate}）のまま注文・会計を進行しますか？\n` +
        `※営業終了後は必ず「売上管理 > 営業状況」から閉店処理を行ってください。`
      )
      if (!confirmed) return
    }
    try {
      await onProceedToPayment(cart)
      setCart([])
    } catch (e) {
      console.error('Checkout failed', e)
    }
  }

  return (
    <div className="handy-app standalone staff-prepaid-view" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {staffMessage && (
        <div style={{
          background: '#e03131',
          color: 'white',
          padding: '8px 16px',
          textAlign: 'center',
          fontWeight: 'bold',
          fontSize: '0.9rem',
          zIndex: 100,
        }}>
          ⚠️ {staffMessage}
        </div>
      )}
      {/* Header */}
      <header
        className="handy-header"
        style={{
          background: '#1a1a1a',
          borderBottom: '1px solid #333',
          padding: '10px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            className="menu-trigger"
            onClick={onOpenLauncher}
            aria-label="Open Menu"
            style={{
              background: '#333',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <span className="material-icons">menu</span>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#fff', fontWeight: 700 }}>
              レジ（注文・会計）
            </h2>
            <span
              className="staff-badge"
              style={{
                background: '#16a34a',
                color: '#fff',
                fontSize: '0.75rem',
                padding: '2px 8px',
                borderRadius: '12px',
                fontWeight: 700,
              }}
            >
              先払い
            </span>
            {terminalName && (
              <span className="staff-badge" style={{ background: '#5d7281', fontSize: '0.75rem' }}>
                {terminalName}
              </span>
            )}
            {openBusinessDate ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  className="staff-badge"
                  style={{
                    background: '#2b8a3e',
                    color: '#fff',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 8px',
                    borderRadius: '12px'
                  }}
                >
                  <span style={{ opacity: 0.85 }}>営業日:</span> {openBusinessDate}
                  <span style={{ background: '#237032', padding: '1px 5px', borderRadius: '8px', fontSize: '0.7rem', marginLeft: '2px' }}>営業中</span>
                </span>
                {todayBusinessDate && todayBusinessDate > openBusinessDate && (
                  <span
                    className="staff-badge"
                    style={{
                      background: '#e8590c',
                      color: '#fff',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '12px'
                    }}
                    title="営業日切替時刻を経過しています（前日営業を継続中）"
                  >
                    ⚠️ 切替時刻超過
                  </span>
                )}
              </div>
            ) : (
              <span
                className="staff-badge"
                style={{
                  background: '#868e96',
                  color: '#fff',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '12px'
                }}
              >
                閉店中 {todayBusinessDate ? `(${todayBusinessDate})` : ''}
              </span>
            )}
          </div>
        </div>

        {/* Controls: Table selection, Menu book, Customer count, Switch to ticket list */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Table / Order Type selector */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ccc', fontSize: '0.85rem' }}>
            <span>卓/種別:</span>
            <select
              value={selectedTableId}
              onChange={(e) => onTableChange(e.target.value)}
              style={{
                background: '#2a2a2a',
                color: '#fff',
                border: '1px solid #444',
                borderRadius: '6px',
                padding: '6px 10px',
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              {availableTables.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>

          {/* Customer count */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ccc', fontSize: '0.85rem' }}>
            <span>客数:</span>
            <select
              value={customerCount}
              onChange={(e) => onCustomerCountChange(Number(e.target.value))}
              style={{
                background: '#2a2a2a',
                color: '#fff',
                border: '1px solid #444',
                borderRadius: '6px',
                padding: '6px 8px',
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <option key={n} value={n}>
                  {n}名
                </option>
              ))}
            </select>
          </label>

          {/* Menu Book selector (if multiple) */}
          {liveMenuBooks.length > 1 && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ccc', fontSize: '0.85rem' }}>
              <span>メニュー:</span>
              <select
                value={selectedMenuBookId}
                onChange={(e) => onMenuBookChange(e.target.value)}
                style={{
                  background: '#2a2a2a',
                  color: '#fff',
                  border: '1px solid #444',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                {liveMenuBooks.map((mb) => (
                  <option key={mb.id} value={mb.id}>
                    {mb.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          {/* Switch to ticket list */}
          {onSwitchToTicketList && (
            <button
              type="button"
              className="btn-secondary"
              onClick={onSwitchToTicketList}
              style={{
                background: '#333',
                color: '#ddd',
                border: '1px solid #555',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              📋 伝票一覧・履歴
            </button>
          )}
        </div>
      </header>

      {/* Main Order Layout: Menu Pane + Slip Pane */}
      <div className="handy-layout" style={{ flex: 1, minHeight: 0 }}>
        {/* Menu Pane */}
        <section className="handy-menu-pane">
          {/* Top categories */}
          <div className="handy-cat-bar" style={{ flexWrap: 'wrap', gap: '8px' }}>
            {handyTopCategories.map((cat) => (
              <button
                key={cat.id}
                className={`handy-cat-btn ${handyTopCategoryId === cat.id ? 'active' : ''}`}
                onClick={() => setHandyTopCategoryId(cat.id)}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Subcategories (if any) */}
          {visibleHandySubCategories.length > 0 && (
            <div className="handy-cat-bar sub" style={{ flexWrap: 'wrap', gap: '6px' }}>
              {visibleHandySubCategories.map((cat) => (
                <button
                  key={cat.id}
                  className={`handy-cat-btn ${handySubCategoryId === cat.id ? 'active' : ''}`}
                  onClick={() => setHandySubCategoryId(cat.id)}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          {/* Items Grid */}
          <div className="handy-items-grid">
            {visibleHandyItems.map((item) => {
              const inCartCount = cart
                .filter((c) => c.id === item.id)
                .reduce((sum, c) => sum + c.qty, 0)

              return (
                <button
                  key={item.id}
                  className={`handy-item-btn ${inCartCount > 0 ? 'has-in-cart' : ''}`}
                  onClick={() => {
                    if (item.toppings && item.toppings.length > 0) {
                      setActiveToppingItem(item)
                      setToppingModalOpen(true)
                    } else {
                      handleAddItem(item)
                    }
                  }}
                  disabled={item.isSoldOut}
                  style={item.isSoldOut ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
                >
                  <span className="h-item-name">{item.name}</span>
                  <span className="h-item-price">
                    {formatItemPrice(
                      item.price,
                      item.tax_type,
                      item.tax_rate_type,
                      taxDisplayMode,
                      taxRate,
                      reducedTaxRate,
                      yen,
                    )}
                  </span>
                  {item.isSoldOut && (
                    <span style={{ fontSize: '0.75rem', color: '#ff5a5f', fontWeight: 'bold' }}>
                      売切
                    </span>
                  )}
                  {inCartCount > 0 && <span className="h-item-qty-badge">{inCartCount}</span>}
                </button>
              )
            })}
          </div>
        </section>

        {/* Right Slip / Cart Pane */}
        <aside className={`handy-slip-pane ${showSlip ? 'open' : ''}`}>
          <div className="mobile-only" style={{ padding: '8px', textAlign: 'center' }}>
            <button
              onClick={() => setShowSlip(false)}
              style={{ background: 'transparent', border: 'none', color: '#888', fontSize: '1.5rem' }}
            >
              ▼ 閉じる
            </button>
          </div>

          <div
            className="slip-header"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>注文カート</h3>
              <span className="slip-meta">
                {cartItemCount}点 / {yen(cartTotal)}
              </span>
            </div>
            {cart.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                style={{
                  background: 'transparent',
                  color: '#999',
                  border: '1px solid #444',
                  borderRadius: '4px',
                  padding: '2px 8px',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                全クリア
              </button>
            )}
          </div>

          {/* Cart item list */}
          <div className="slip-list" style={{ flex: 1, overflowY: 'auto' }}>
            {cart.length === 0 ? (
              <div className="slip-empty-state">
                <span className="empty-icon">🛒</span>
                <p>カートは空です</p>
                <p className="empty-sub">メニューから商品を選択してください</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.cartKey} className="slip-line unsent">
                  <div
                    className="slip-line-info"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      gap: '4px',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span className="name" style={{ fontWeight: 600 }}>
                        {item.name}
                      </span>
                    </div>
                    {item.toppings && item.toppings.length > 0 && (
                      <div style={{ fontSize: '0.8rem', color: '#888', marginLeft: '8px' }}>
                        {item.toppings.map((t) => `＋${t.name}`).join(' ')}
                      </div>
                    )}
                    <span style={{ fontSize: '0.85rem', color: '#ffb703', fontWeight: 600 }}>
                      {yen(item.price * item.qty)}
                    </span>
                  </div>

                  <div className="slip-line-actions">
                    <div className="stepper">
                      <button onClick={() => updateCartQty(item.cartKey, -1)}>-</button>
                      <span>{item.qty}</span>
                      <button onClick={() => updateCartQty(item.cartKey, 1)}>+</button>
                    </div>
                    <button
                      className="del-btn"
                      onClick={() => updateCartQty(item.cartKey, -item.qty)}
                      title="削除"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Slip footer: Proceed to payment button */}
          <div className="slip-footer" style={{ padding: '16px' }}>
            <button
              className={`send-kitchen-btn ${cart.length > 0 ? 'ready' : ''}`}
              disabled={cart.length === 0 || mutationBusy !== null}
              onClick={handleCheckoutClick}
              style={{
                width: '100%',
                padding: '14px 20px',
                fontSize: '1.1rem',
                fontWeight: 700,
                borderRadius: '10px',
                background: cart.length > 0 ? '#16a34a' : '#333',
                color: '#fff',
                border: 'none',
                cursor: cart.length > 0 ? 'pointer' : 'not-allowed',
                boxShadow: cart.length > 0 ? '0 4px 12px rgba(22, 163, 74, 0.4)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {mutationBusy ? (
                <span>処理中...</span>
              ) : cart.length > 0 ? (
                <>
                  <span>💳 お会計へ進む</span>
                  <span style={{ fontSize: '1.2rem', marginLeft: '6px' }}>{yen(cartTotal)}</span>
                </>
              ) : (
                <span>商品を選択してください</span>
              )}
            </button>
          </div>
        </aside>
      </div>

      {/* Topping modal */}
      {activeToppingItem && (
        <ToppingModal
          isOpen={toppingModalOpen}
          onClose={() => {
            setToppingModalOpen(false)
            setActiveToppingItem(null)
          }}
          itemName={activeToppingItem.name}
          toppings={activeToppingItem.toppings || []}
          onConfirm={(selectedToppingIds) => {
            handleAddItem(activeToppingItem, selectedToppingIds)
          }}
        />
      )}

      {/* Mobile cart toggle button */}
      <button
        className="mobile-cart-toggle mobile-only"
        onClick={() => setShowSlip(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: '#16a34a',
          color: '#fff',
          fontSize: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: 'none',
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          zIndex: 100,
        }}
      >
        🛒
        {cartItemCount > 0 && <span className="mobile-cart-count">{cartItemCount}</span>}
      </button>
    </div>
  )
}

