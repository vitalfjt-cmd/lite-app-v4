import { useState } from 'react'
import type { ReactNode } from 'react'
import { ToppingModal } from '../components/ToppingModal'
import { isTimeWithinWindow } from '../lib/appUtils'

type CustomerCategory = { id: string; name: string; parentId?: string | null }
type CustomerMenuItem = {
  id: string
  name: string
  name_en?: string | null
  lead?: string
  price: number
  soldOut: boolean
  imageUrl?: string | null
  toppings?: { id: string; name: string; name_en?: string | null; price: number; is_sold_out: boolean }[]
}
type CartItem = Omit<CustomerMenuItem, 'toppings'> & {
  qty: number
  cartKey: string
  toppings: { id: string; name: string; name_en?: string | null; price: number }[]
  toppingIds: string[]
}
type TicketReceipt = {
  ticketNo: string
  orderedAt: string
  subtotal: number
  lines: { id: string; itemName: string; qty: number; subtotal: number }[]
}
type ReceiptSummaryLine = { itemName: string; qty: number; subtotal: number }

type CustomerScreenProps = {
  activeStoreName: string
  activeTableName: string
  activeTicketNo: string
  customerStep: 'menu' | 'confirm' | 'myOrder'
  customerMessage: string | null
  customerBusy: boolean
  customerTopCategories: CustomerCategory[]
  customerSubCategories: CustomerCategory[]
  selectedCustomerTopCategoryId: string | null
  selectedCustomerCategoryId: string | null
  visibleCustomerItems: CustomerMenuItem[]
  ticketReceipt: TicketReceipt | null
  ticketSummaryLines: ReceiptSummaryLine[]
  cart: Record<string, number>
  cartItems: CartItem[]
  cartCount: number
  cartSubtotal: number
  customerFocusedItemId: string | null
  customerOrderingEnabled: boolean
  customerCanViewMyOrder: boolean
  timeLimitInfo?: { remainingSeconds: number; isLastOrder: boolean; isTimeUp: boolean } | null
  publicMenuBook?: { available_from_time?: string | null; available_to_time?: string | null } | null
  publicMenuReady: boolean
  customerApiAvailable: boolean
  formatTime: (value: string) => string
  yen: (value: number) => string
  messageTone: (message: string | null) => 'success' | 'error'
  onSelectTopCategory: (id: string) => void
  onSelectCategory: (id: string) => void
  onFocusItem: (id: string) => void
  onDecrementItem: (cartKey: string) => void
  onIncrementItem: (cartKey: string, toppingIds?: string[]) => void
  onReloadMenu: () => void
  onOpenMyOrder: () => void
  onOpenConfirm: () => void
  onBackToMenu: () => void
  onSubmitOrder: () => void
  onRefreshTicket: () => void
}

function itemInitial(name: string): string {
  return name.slice(0, 1).toUpperCase()
}

export function CustomerScreen({
  activeStoreName,
  activeTableName,
  activeTicketNo,
  customerStep,
  customerMessage,
  customerBusy,
  customerTopCategories,
  customerSubCategories,
  selectedCustomerTopCategoryId,
  selectedCustomerCategoryId,
  visibleCustomerItems,
  ticketReceipt,
  ticketSummaryLines,
  cart,
  cartItems,
  cartCount,
  cartSubtotal,
  customerFocusedItemId,
  customerOrderingEnabled,
  customerCanViewMyOrder,
  timeLimitInfo,
  publicMenuBook,
  publicMenuReady,
  customerApiAvailable,
  formatTime,
  yen,
  messageTone,
  onSelectTopCategory,
  onSelectCategory,
  onFocusItem,
  onDecrementItem,
  onIncrementItem,
  onReloadMenu,
  onOpenMyOrder,
  onOpenConfirm,
  onBackToMenu,
  onSubmitOrder,
  onRefreshTicket,
}: CustomerScreenProps) {
  const [toppingModalOpen, setToppingModalOpen] = useState(false)
  const [activeToppingItem, setActiveToppingItem] = useState<CustomerMenuItem | null>(null)
  const [lang, setLang] = useState<'ja' | 'en'>('ja')

  const isBookOutOfTime = Boolean(
    publicMenuBook && !isTimeWithinWindow(publicMenuBook.available_from_time, publicMenuBook.available_to_time)
  )

  const hasEnglishNames = visibleCustomerItems.some((item) => item.name_en)

  const getItemName = (item: { name: string; name_en?: string | null }) => {
    return (lang === 'en' && item.name_en) ? item.name_en : item.name
  }

  const formatRemainingTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    if (lang === 'en') {
      return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    }
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  const renderTimeLimitBanner = () => {
    if (!timeLimitInfo) return null
    const { remainingSeconds, isLastOrder, isTimeUp } = timeLimitInfo
    const stateClass = isTimeUp ? 'time-up' : isLastOrder ? 'last-order' : 'normal'
    return (
      <div className={`time-limit-banner ${stateClass}`}>
        <span className="time-icon">⏱️</span>
        <span className="banner-text">
          {isTimeUp
            ? '注文時間が終了しました。'
            : isLastOrder
              ? `【ラストオーダー】残り ${formatRemainingTime(remainingSeconds)}`
              : `残り注文時間: ${formatRemainingTime(remainingSeconds)}`}
        </span>
      </div>
    )
  }
  
  if (customerStep === 'confirm') {
    return (
      <div className="customer-app">
        <header className="customer-header">
          <div className="header-meta">
            <h1>{lang === 'en' ? 'Confirm Order' : '注文内容の確認'}</h1>
            <span className="table-badge">{lang === 'en' ? 'Table' : '卓番'}: {activeTableName}</span>
          </div>
          <button className="customer-header-btn" onClick={onBackToMenu}>{lang === 'en' ? 'Back' : '戻る'}</button>
        </header>
        
        {customerMessage ? <p style={{background:'#ff5a5f', color:'white', padding:'8px', textAlign:'center'}}>{customerMessage}</p> : null}
        {renderTimeLimitBanner()}

        <main className="menu-grid" style={{paddingTop: '24px'}}>
          <div style={{background:'white', borderRadius:'16px', padding:'24px', boxShadow:'0 4px 12px rgba(0,0,0,0.05)'}}>
            {cartItems.length === 0 ? <p style={{textAlign:'center', color:'#888'}}>{lang === 'en' ? 'No items selected.' : 'まだ商品が選ばれていません。'}</p> : null}
            
            <div style={{display:'flex', flexDirection:'column', gap:'16px'}}>
              {cartItems.map((item) => (
                <div key={item.cartKey} style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px dashed #eee', paddingBottom:'16px'}}>
                  <div>
                    <h4 style={{margin:0, fontSize:'1.1rem'}}>{getItemName(item)}</h4>
                    {item.toppings && item.toppings.length > 0 && (
                      <div style={{fontSize:'0.85rem', color:'#666', marginTop:'4px'}}>
                        {item.toppings.map((t) => `＋ ${(lang === 'en' && t.name_en) ? t.name_en : t.name}`).join(' ')}
                      </div>
                    )}
                    <span style={{color:'#ff5a5f', fontWeight:'bold', fontSize:'1.1rem'}}>{yen(item.price)}</span>
                  </div>
                  <div className="stepper active" style={{width: '120px', margin:0}}>
                    <button disabled={!customerOrderingEnabled} onClick={() => onDecrementItem(item.cartKey)}>-</button>
                    <span>{item.qty}</span>
                    <button disabled={!customerOrderingEnabled} onClick={() => onIncrementItem(item.cartKey)}>+</button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{display:'flex', justifyContent:'space-between', marginTop:'24px', fontSize:'1.5rem', fontWeight:'bold', color:'#333'}}>
              <span>小計</span>
              <span style={{color:'#ff5a5f'}}>{yen(cartSubtotal)}</span>
            </div>
          </div>
        </main>

        <div className={`floating-cart-container visible`}>
          <button className="floating-cart-btn" onClick={onSubmitOrder} disabled={!customerOrderingEnabled || cartCount === 0 || customerBusy}>
            <div className="cart-meta" style={{alignItems:'center'}}>
              <span className="cart-action-text" style={{fontSize:'1.3rem'}}>{customerBusy ? '送信中...' : '注文を確定する'}</span>
            </div>
          </button>
        </div>
      </div>
    );
  }

  if (customerStep === 'myOrder') {
    return (
      <div className="customer-app">
        <header className="customer-header">
          <div className="header-meta">
            <span className="table-badge">{ticketReceipt ? `伝票: ${ticketReceipt.ticketNo}` : '注文履歴'}</span>
          </div>
          <button className="customer-header-btn" onClick={onBackToMenu}>戻る</button>
        </header>
        {renderTimeLimitBanner()}

        <main className="menu-grid" style={{paddingTop: '24px'}}>
          <div style={{background:'white', borderRadius:'16px', padding:'24px', boxShadow:'0 4px 12px rgba(0,0,0,0.05)'}}>
            {ticketReceipt ? (
              <>
                <h3 style={{marginBottom:'16px', color:'#555', borderBottom:'2px solid #eee', paddingBottom:'8px'}}>注文時刻 {formatTime(ticketReceipt.orderedAt)}</h3>
                
                {ticketSummaryLines.length === 0 ? <p style={{textAlign:'center', color:'#888'}}>注文内容はまだありません。</p> : null}
                
                <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
                  {ticketSummaryLines.map((line) => (
                    <div key={line.itemName} style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                      <div>
                        <strong style={{fontSize:'1.1rem'}}>{line.itemName}</strong>
                        <div style={{color:'#888', fontSize:'0.9rem'}}>{line.qty} 点</div>
                      </div>
                      <strong style={{fontSize:'1.2rem'}}>{yen(line.subtotal)}</strong>
                    </div>
                  ))}
                </div>

                <div style={{display:'flex', justifyContent:'space-between', marginTop:'24px', paddingTop:'16px', borderTop:'2px solid #333', fontSize:'1.5rem', fontWeight:'bold', color:'#333'}}>
                  <span>合計</span>
                  <span style={{color:'#ff5a5f'}}>{yen(ticketReceipt.subtotal)}</span>
                </div>
              </>
            ) : customerBusy ? (
              <p style={{textAlign:'center', color:'#888'}}>読み込み中...</p>
            ) : (
              <p style={{textAlign:'center', color:'#888'}}>注文履歴はありません。</p>
            )}
          </div>
        </main>
        
        <div className={`floating-cart-container visible`}>
          <button className="floating-cart-btn" onClick={onRefreshTicket} disabled={customerBusy} style={{background: '#4dabf7'}}>
            <div className="cart-meta" style={{alignItems:'center'}}>
              <span className="cart-action-text" style={{fontSize:'1.3rem'}}>{customerBusy ? '更新中...' : '最新状態に更新'}</span>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // Menu Step
  return (
    <div className="customer-app" data-testid="customer-screen">
      <div style={{ position: 'sticky', top: 0, zIndex: 20 }}>
        <header className="customer-header">
          <div className="header-meta">
            <span className="table-badge">{lang === 'en' ? 'Table' : '卓番'}: {activeTableName}</span>
            {hasEnglishNames && (
              <button
                onClick={() => setLang(lang === 'ja' ? 'en' : 'ja')}
                style={{
                  padding: '4px 8px',
                  fontSize: '0.85rem',
                  background: '#f0f3f5',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginLeft: '8px',
                }}
              >
                {lang === 'ja' ? 'English' : '日本語'}
              </button>
            )}
          </div>
          {customerCanViewMyOrder && (
            <button className="customer-header-btn" onClick={onOpenMyOrder}>
              {lang === 'en' ? 'History' : '注文履歴'}
            </button>
          )}
        </header>
        
        {customerMessage ? <p style={{background:'#ff5a5f', color:'white', padding:'8px', textAlign:'center', margin:0}}>{customerMessage}</p> : null}
        {renderTimeLimitBanner()}
        {isBookOutOfTime && (
          <p style={{background:'#e03131', color:'white', padding:'8px', textAlign:'center', margin:0, fontWeight:'bold'}}>
            現在、このメニューの提供時間外です ({publicMenuBook?.available_from_time || ''} 〜 {publicMenuBook?.available_to_time || ''})
          </p>
        )}

        {!customerOrderingEnabled && publicMenuReady && (!timeLimitInfo || !timeLimitInfo.isTimeUp) ? (
          <p style={{background:'#fcc419', color:'#333', padding:'8px', textAlign:'center', margin:0, fontWeight:'bold'}}>この卓は現在注文を受け付けていません。</p>
        ) : null}

        <div className="customer-category-tiers" style={{ background: 'white', borderBottom: '1px solid var(--c-border)' }}>
          {customerTopCategories.length > 0 && (
            <div className="category-scroller" style={{ borderBottom: 'none', position: 'relative', zIndex: 1, paddingBottom: customerTopCategories.length > 0 && customerSubCategories.length > 0 ? '6px' : '12px' }}>
              {customerTopCategories.map((cat) => (
                <button 
                  key={cat.id} 
                  className={`category-tab ${selectedCustomerTopCategoryId === cat.id ? 'active' : ''}`}
                  onClick={() => onSelectTopCategory(cat.id)}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
          
          {customerSubCategories.length > 0 && customerTopCategories.length > 0 && (
            <div className="category-scroller" style={{ borderBottom: 'none', position: 'relative', zIndex: 1, paddingTop: '0px' }}>
              {customerSubCategories.map((cat) => (
                <button 
                  key={cat.id} 
                  className={`customer-sub-tab ${selectedCustomerCategoryId === cat.id ? 'active' : ''}`}
                  onClick={() => onSelectCategory(cat.id)}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          {/* Fallback if no top-level categories */}
          {customerTopCategories.length === 0 && customerSubCategories.length > 0 && (
            <div className="category-scroller" style={{ borderBottom: 'none', position: 'relative', zIndex: 1 }}>
              {customerSubCategories.map((cat) => (
                <button 
                  key={cat.id} 
                  className={`category-tab ${selectedCustomerCategoryId === cat.id ? 'active' : ''}`}
                  onClick={() => onSelectCategory(cat.id)}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <main className="menu-grid">
        {!publicMenuReady && customerApiAvailable && customerTopCategories.length === 0 && !customerBusy ? (
          <div style={{textAlign:'center', padding:'40px 20px', color:'#888'}}>
            <strong>メニューを読み込めませんでした。</strong><br/><br/>
            <button style={{padding:'12px 24px', background:'#eee', border:'none', borderRadius:'8px'}} onClick={onReloadMenu}>読み込み直す</button>
          </div>
        ) : null}

        {visibleCustomerItems.length === 0 && publicMenuReady ? (
          <div style={{textAlign:'center', padding:'40px 20px', color:'#888'}}>
            <strong>{lang === 'en' ? 'No items in this category.' : 'このカテゴリの商品はまだありません。'}</strong>
          </div>
        ) : null}

        {visibleCustomerItems.map((item) => {
          const qty = cartItems.filter((cItem) => cItem.id === item.id).reduce((sum, cItem) => sum + cItem.qty, 0);
          return (
            <article key={item.id} className={`menu-card ${item.soldOut ? 'sold-out' : ''}`}>
              <div 
                className="card-image" 
                style={item.imageUrl ? { backgroundImage: `url(${item.imageUrl})` } : { background: '#f0f0f0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'3rem', color:'#ccc' }}
              >
                {!item.imageUrl && itemInitial(getItemName(item))}
                {qty > 0 && <span className="qty-badge">{qty}</span>}
                {item.soldOut && <div className="sold-out-overlay">{lang === 'en' ? 'Sold Out' : '売切'}</div>}
              </div>
              <div className="card-content">
                <h3 className="item-name">{getItemName(item)}</h3>
                <p className="item-lead">{item.lead}</p>
                <div className="card-bottom">
                  <strong className="item-price">{yen(item.price)}</strong>
                  {!item.soldOut && (
                    <div className="actions">
                      <button 
                        className="add-btn" 
                        disabled={!customerOrderingEnabled || isBookOutOfTime} 
                        style={isBookOutOfTime ? { background: '#888', borderColor: '#777', cursor: 'not-allowed', opacity: 0.7 } : undefined}
                        onClick={() => {
                          if (isBookOutOfTime) return
                          if (item.toppings && item.toppings.length > 0) {
                            setActiveToppingItem(item)
                            setToppingModalOpen(true)
                          } else {
                            onIncrementItem(item.id)
                          }
                        }}
                      >
                        {isBookOutOfTime ? (lang === 'en' ? 'Out of Hours' : '時間外') : (lang === 'en' ? 'Add' : '追加')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </main>

      {/* Floating Cart Button */}
      <div className={`floating-cart-container ${cartCount > 0 ? 'visible' : ''}`}>
        <button 
          className="floating-cart-btn" 
          onClick={onOpenConfirm}
          disabled={!customerOrderingEnabled || cartCount === 0 || customerBusy}
        >
          <div className="cart-meta">
            <span className="cart-count">{lang === 'en' ? `${cartCount} items in cart` : `カートに ${cartCount} 点`}</span>
            <span className="cart-subtotal">{yen(cartSubtotal)}</span>
          </div>
          <span className="cart-action-text">{lang === 'en' ? 'To order confirmation →' : '注文確認へ →'}</span>
        </button>
      </div>

      {activeToppingItem && (
        <ToppingModal
          isOpen={toppingModalOpen}
          onClose={() => {
            setToppingModalOpen(false)
            setActiveToppingItem(null)
          }}
          itemName={getItemName(activeToppingItem)}
          toppings={activeToppingItem.toppings || []}
          onConfirm={(selectedToppingIds) => {
            onIncrementItem(activeToppingItem.id, selectedToppingIds)
          }}
          lang={lang}
        />
      )}
    </div>
  );
}
