import { useRef, useState } from 'react'

type CustomerCategory = { id: string; name: string; parentId?: string | null }
type CustomerMenuItem = {
  id: string
  name: string
  lead?: string
  price: number
  soldOut: boolean
  imageUrl?: string | null
}
type CartItem = CustomerMenuItem & { qty: number }

type CustomerTabletScreenProps = {
  activeStoreName: string
  activeTableName: string
  activeTicketNo: string
  customerTopCategories: CustomerCategory[]
  customerSubCategories: CustomerCategory[]
  selectedCustomerTopCategoryId: string | null
  selectedCustomerCategoryId: string | null
  visibleCustomerItems: CustomerMenuItem[]
  cart: Record<string, number>
  cartItems: CartItem[]
  cartCount: number
  cartSubtotal: number
  customerStep: 'menu' | 'confirm' | 'myOrder'
  customerMessage: string | null
  customerOrderingEnabled: boolean
  customerBusy: boolean
  publicMenuReady: boolean
  customerApiAvailable: boolean
  selectedCustomerUrl?: string | null
  yen: (value: number) => string
  onSelectTopCategory: (id: string) => void
  onSelectCategory: (id: string) => void
  onDecrementItem: (id: string) => void
  onIncrementItem: (id: string) => void
  onOpenConfirm: () => void
  onBackToMenu: () => void
  onSubmitOrder: () => void
}

export function CustomerTabletScreen({
  activeStoreName,
  activeTableName,
  activeTicketNo,
  customerTopCategories,
  customerSubCategories,
  selectedCustomerTopCategoryId,
  selectedCustomerCategoryId,
  visibleCustomerItems,
  cart,
  cartItems,
  cartCount,
  cartSubtotal,
  customerStep,
  customerMessage,
  customerOrderingEnabled,
  customerBusy,
  publicMenuReady,
  customerApiAvailable,
  selectedCustomerUrl,
  yen,
  onSelectTopCategory,
  onSelectCategory,
  onDecrementItem,
  onIncrementItem,
  onOpenConfirm,
  onBackToMenu,
  onSubmitOrder,
}: CustomerTabletScreenProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const [showQrModal, setShowQrModal] = useState(false)
  
  const scrollHorizontally = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction === 'right' ? 800 : -800,
        behavior: 'smooth',
      })
    }
  }

  if (!customerApiAvailable) {
    return (
      <div
        className="customer-tablet-app"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}
      >
        <div style={{ textAlign: 'center', color: '#888' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚠️</div>
          <p>APIに接続できません。サーバーを確認してください。</p>
        </div>
      </div>
    )
  }

  if (!publicMenuReady) {
    return (
      <div
        className="customer-tablet-app"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}
      >
        <div style={{ textAlign: 'center', color: '#888' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🍽️</div>
          <p>メニューを読み込んでいます...</p>
        </div>
      </div>
    )
  }

  if (customerStep === 'confirm') {
    return (
      <div className="customer-tablet-app">
        <header className="tablet-header" style={{ padding: '24px 32px', borderBottom: '1px solid #eee' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <h1 style={{ margin: 0, fontSize: '2rem' }}>注文内容の確認</h1>
            <button
              onClick={onBackToMenu}
              style={{
                padding: '12px 24px',
                fontSize: '1.2rem',
                background: '#f0f3f5',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              ← メニューへ戻る
            </button>
          </div>
        </header>
        
        {customerMessage && (
          <div style={{ padding: '16px 32px', background: '#ff5a5f', color: 'white', textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}>
            {customerMessage}
          </div>
        )}

        <main className="tablet-main" style={{ padding: '32px', justifyContent: 'center', alignItems: 'flex-start', overflowY: 'auto' }}>
          <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto', background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
            {cartItems.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#888', fontSize: '1.2rem' }}>まだ商品が選ばれていません。</p>
            ) : null}
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {cartItems.map((item) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed #eee', paddingBottom: '24px' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1.5rem', color: '#333' }}>{item.name}</h4>
                    <span style={{ color: '#ff5a5f', fontWeight: 'bold', fontSize: '1.3rem' }}>{yen(item.price)}</span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#555', padding: '8px 16px', background: '#f8f9fa', borderRadius: '8px' }}>
                    {item.qty}点
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px', paddingTop: '16px', borderTop: '2px solid #eee', fontSize: '2rem', fontWeight: 'bold', color: '#333' }}>
              <span>小計</span>
              <span style={{ color: '#ff5a5f' }}>{yen(cartSubtotal)}</span>
            </div>
          </div>
        </main>

        <footer className="tablet-footer">
          <div className="tablet-cart-info">
            <div className="tablet-cart-icon">🛒</div>
            <div className="tablet-cart-details">
              <span className="tablet-cart-count">選択中の商品: <strong>{cartCount}点</strong></span>
              <span className="tablet-cart-total">小計: <strong>{yen(cartSubtotal)}</strong></span>
            </div>
          </div>

          <button
            className={`tablet-submit-btn glowing`}
            disabled={cartCount === 0 || !customerOrderingEnabled || customerBusy}
            onClick={onSubmitOrder}
          >
            {customerBusy ? '送信中...' : '注文を確定する'}
          </button>
        </footer>
      </div>
    );
  }

  return (
    <div className="customer-tablet-app">
      {/* Header with 2-tier category nav */}
      <header className="tablet-header" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 0, padding: 0 }}>
        {/* Top row: store name + table badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 64px', borderBottom: '1px solid #eee' }}>
          <div className="tablet-meta" style={{ marginBottom: 0 }}>
            <h1 style={{ margin: 0 }}>{activeStoreName || '焼肉 UCD'}</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {activeTicketNo && (
              <span style={{ background: '#555', color: 'white', padding: '4px 12px', borderRadius: '6px', fontSize: '0.9rem' }}>
                伝票 #{activeTicketNo}
              </span>
            )}
            <span className="tablet-table-badge">卓番: {activeTableName || '—'}</span>
            {selectedCustomerUrl && (
              <button 
                onClick={() => setShowQrModal(true)}
                style={{
                  background: '#4dabf7',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                }}
              >
                📱
              </button>
            )}
          </div>
        </div>
        
        {customerMessage && customerStep === 'menu' && (
          <div style={{ padding: '12px 64px', background: '#ff5a5f', color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
            {customerMessage}
          </div>
        )}

        {/* Tier 1: Top categories */}
        {customerTopCategories.length > 0 && (
          <div className="tablet-categories" style={{ padding: '14px 64px 0', borderBottom: customerSubCategories.length > 0 ? 'none' : '1px solid #eee' }}>
            {customerTopCategories.map((cat) => (
              <button
                key={cat.id}
                className={`tablet-cat-btn ${selectedCustomerTopCategoryId === cat.id ? 'active' : ''}`}
                onClick={() => onSelectTopCategory(cat.id)}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Tier 2: Subcategories */}
        {customerSubCategories.length > 0 && (
          <div
            className="tablet-categories"
            style={{
              padding: '8px 64px 14px',
              borderBottom: '1px solid #eee',
              gap: '10px',
            }}
          >
            {customerSubCategories.map((cat) => (
              <button
                key={cat.id}
                className={`tablet-cat-btn ${selectedCustomerCategoryId === cat.id ? 'active' : ''}`}
                onClick={() => onSelectCategory(cat.id)}
                style={{
                  fontSize: '1.05rem',
                  padding: '10px 22px',
                  background: selectedCustomerCategoryId === cat.id ? '#ff5a5f' : '#f0f3f5',
                  color: selectedCustomerCategoryId === cat.id ? 'white' : '#59656f',
                  borderColor: 'transparent',
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Main horizontal scroll area */}
      <main className="tablet-main">
        <button
          className="pagination-arrow left"
          onClick={() => scrollHorizontally('left')}
          aria-label="左にスクロール"
        >
          ◀
        </button>

        <div className="tablet-menu-grid-container" ref={scrollRef}>
          {visibleCustomerItems.length === 0 ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                color: '#aaa',
                fontSize: '1.2rem',
                padding: '60px',
              }}
            >
              このカテゴリのメニューはありません
            </div>
          ) : (
            visibleCustomerItems.map((item) => {
              const qty = cart[item.id] ?? 0
              return (
                <article
                  key={item.id}
                  className={`tablet-menu-card ${item.soldOut ? 'sold-out' : ''}`}
                >
                  <div
                    className="tablet-card-image"
                    style={
                      item.imageUrl
                        ? { backgroundImage: `url(${item.imageUrl})` }
                        : {
                            background: '#f0e8d8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }
                    }
                  >
                    {!item.imageUrl && (
                      <span style={{ fontSize: '3rem', color: '#c8a87a' }}>
                        {item.name.slice(0, 1)}
                      </span>
                    )}
                    {qty > 0 && <span className="tablet-qty-badge">{qty}</span>}
                    {item.soldOut && <div className="tablet-sold-out-overlay">売切</div>}
                  </div>

                  <div className="tablet-card-content">
                    <div className="tablet-card-text">
                      <h3 className="tablet-item-name">{item.name}</h3>
                      {item.lead && <p className="tablet-item-lead">{item.lead}</p>}
                      <strong className="tablet-item-price">{yen(item.price)}</strong>
                    </div>

                    {!item.soldOut && (
                      <div className="tablet-actions">
                        {qty > 0 ? (
                          <div className="tablet-stepper">
                            <button
                              disabled={!customerOrderingEnabled}
                              onClick={() => onDecrementItem(item.id)}
                            >
                              -
                            </button>
                            <span>{qty}</span>
                            <button
                              disabled={!customerOrderingEnabled}
                              onClick={() => onIncrementItem(item.id)}
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            className="tablet-add-btn"
                            disabled={!customerOrderingEnabled}
                            onClick={() => onIncrementItem(item.id)}
                          >
                            注文リストへ追加
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              )
            })
          )}
        </div>

        <button
          className="pagination-arrow right"
          onClick={() => scrollHorizontally('right')}
          aria-label="右にスクロール"
        >
          ▶
        </button>
      </main>

      {/* Footer cart bar */}
      <footer className="tablet-footer">
        <div className="tablet-cart-info">
          <div className="tablet-cart-icon">🛒</div>
          <div className="tablet-cart-details">
            <span className="tablet-cart-count">
              選択中の商品: <strong>{cartCount}点</strong>
            </span>
            <span className="tablet-cart-total">
              小計: <strong>{yen(cartSubtotal)}</strong>
            </span>
          </div>
        </div>

        <button
          className={`tablet-submit-btn ${cartCount > 0 ? 'glowing' : ''}`}
          disabled={cartCount === 0 || !customerOrderingEnabled || customerBusy}
          onClick={onOpenConfirm}
        >
          {customerBusy ? '送信中...' : '注文を確認して送信する'}
        </button>
      </footer>

      {showQrModal && selectedCustomerUrl && (
        <div 
          style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex: 2000}}
          onClick={() => setShowQrModal(false)}
        >
          <div 
            style={{background:'white', padding:'32px', borderRadius:'24px', textAlign:'center', color:'#333', maxWidth:'400px'}}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{marginBottom:'8px'}}>お手元のスマホで注文</h2>
            <p style={{marginBottom:'24px', color:'#666', lineHeight:'1.6'}}>このQRコードを読み取ると、お客様のスマホからメニューの閲覧と注文ができます。</p>
            <div style={{background:'#f8f9fa', padding:'20px', borderRadius:'16px', marginBottom:'24px'}}>
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(selectedCustomerUrl)}`} 
                alt="Mobile Order QR" 
                style={{display:'block', margin:'0 auto', maxWidth:'100%'}}
              />
            </div>
            <button 
              className="tablet-submit-btn glowing" 
              style={{width:'100%', padding:'16px'}}
              onClick={() => setShowQrModal(false)}
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
