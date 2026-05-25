import React, { useState } from 'react'
import { TicketSummaryView, LiveLine, StaffPrototypeTopCategory, StaffPrototypeSubCategory, StaffPrototypeItem } from '../../types'

type StaffHandyViewProps = {
  selectedSummary: TicketSummaryView
  selectedLines: LiveLine[]
  handyCart: Array<{ id: string; name: string; price: number; qty: number }>
  handyTopCategories: StaffPrototypeTopCategory[]
  visibleHandySubCategories: StaffPrototypeSubCategory[]
  visibleHandyItems: StaffPrototypeItem[]
  handyTopCategoryId: string | null
  handySubCategoryId: string | null
  mutationBusy: string | null
  yen: (val: number) => string
  setShowHandyModal: (val: boolean) => void
  setHandyTopCategoryId: (val: string | null) => void
  setHandySubCategoryId: (val: string | null) => void
  handleAddHandyItem: (item: StaffPrototypeItem) => void
  updateHandyQty: (id: string, delta: number) => void
  submitHandyCartToKitchen: () => Promise<void>
}

export function StaffHandyView({
  selectedSummary,
  selectedLines,
  handyCart,
  handyTopCategories,
  visibleHandySubCategories,
  visibleHandyItems,
  handyTopCategoryId,
  handySubCategoryId,
  mutationBusy,
  yen,
  setShowHandyModal,
  setHandyTopCategoryId,
  setHandySubCategoryId,
  handleAddHandyItem,
  updateHandyQty,
  submitHandyCartToKitchen,
}: StaffHandyViewProps) {
  const [showSlip, setShowSlip] = useState(false)
  const handyTotal = handyCart.reduce((sum, item) => sum + item.price * item.qty, 0)
  const handyCount = handyCart.reduce((sum, item) => sum + item.qty, 0)

  return (
    <div className="handy-app standalone">
      <header className="handy-header">
        <div className="handy-header-left">
          <button className="handy-back-btn" onClick={() => setShowHandyModal(false)}>
            ← 戻る
          </button>
          <h2 className="handy-title">オーダー入力：{selectedSummary.tableName}</h2>
        </div>
      </header>

      <div className="handy-layout">
        <section className="handy-menu-pane">
          <div className="handy-cat-bar" style={{ flexWrap: 'wrap', gap: '8px' }}>
            {handyTopCategories.map((cat) => (
              <button key={cat.id} className={`handy-cat-btn ${handyTopCategoryId === cat.id ? 'active' : ''}`} onClick={() => setHandyTopCategoryId(cat.id)}>
                {cat.name}
              </button>
            ))}
          </div>
          {visibleHandySubCategories.length > 0 && (
            <div className="handy-cat-bar sub">
              {visibleHandySubCategories.map((cat) => (
                <button key={cat.id} className={`handy-cat-btn ${handySubCategoryId === cat.id ? 'active' : ''}`} onClick={() => setHandySubCategoryId(cat.id)}>
                  {cat.name}
                </button>
              ))}
            </div>
          )}
          <div className="handy-items-grid">
            {visibleHandyItems.map((item) => {
              const cartItem = handyCart.find((c) => c.id === item.id);
              const qtyInCart = cartItem ? cartItem.qty : 0;
              return (
                <button
                  key={item.id}
                  className={`handy-item-btn ${qtyInCart > 0 ? 'has-in-cart' : ''}`}
                  onClick={() => handleAddHandyItem(item)}
                >
                  <span className="h-item-name">{item.name}</span>
                  <span className="h-item-price">{yen(item.price)}</span>
                  {qtyInCart > 0 && <span className="h-item-qty-badge">{qtyInCart}</span>}
                </button>
              );
            })}
          </div>
        </section>

        <aside className={`handy-slip-pane ${showSlip ? 'open' : ''}`}>
          <div className="mobile-only" style={{padding:'8px', textAlign:'center'}}>
            <button onClick={() => setShowSlip(false)} style={{background:'transparent', border:'none', color:'#888', fontSize:'1.5rem'}}>▼ 閉じる</button>
          </div>
          <div className="slip-header">
            <h3>伝票明細</h3>
            <span className="slip-meta">
              {handyCart.length}品追加 / カート合計 {yen(handyTotal)}
            </span>
          </div>

          <div className="slip-list" style={{ flex: 1, overflowY: 'auto' }}>
            {handyCart.length === 0 ? (
              <div className="slip-empty-state">
                <span className="empty-icon">🛒</span>
                <p>カートは空です</p>
                <p className="empty-sub">メニューから商品を追加してください</p>
              </div>
            ) : (
              handyCart.map((item) => (
                <div key={item.id} className="slip-line unsent">
                  <div className="slip-line-info">
                    <span className="badge" style={{ background: '#ff5a5f', color: 'white' }}>
                      新規追加
                    </span>
                    <span className="name">{item.name}</span>
                  </div>
                  <div className="slip-line-actions">
                    <div className="stepper">
                      <button onClick={() => updateHandyQty(item.id, -1)}>-</button>
                      <span>{item.qty}</span>
                      <button onClick={() => updateHandyQty(item.id, 1)}>+</button>
                    </div>
                    <button className="del-btn" onClick={() => updateHandyQty(item.id, -item.qty)}>
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="slip-footer">
            <button className={`send-kitchen-btn ${handyCart.length > 0 ? 'ready' : ''}`} disabled={handyCart.length === 0 || mutationBusy !== null} onClick={submitHandyCartToKitchen}>
              {mutationBusy !== null ? '送信中...' : handyCart.length > 0 ? '厨房へ送信する' : '新しく追加された注文はありません'}
            </button>
          </div>
        </aside>
      </div>

      <button className="mobile-cart-toggle mobile-only" onClick={() => setShowSlip(true)}>
        🛒
        {handyCount > 0 && <span className="mobile-cart-count">{handyCount}</span>}
      </button>
    </div>
  )
}
