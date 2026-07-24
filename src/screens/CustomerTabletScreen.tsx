import { useRef, useState } from 'react'
import { ToppingModal } from '../components/ToppingModal'
import { fetchStaffPrototypeBootstrap } from '../lib/staffReadApi'
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
  timeLimitInfo?: { remainingSeconds: number; isLastOrder: boolean; isTimeUp: boolean } | null
  publicMenuBook?: { available_from_time?: string | null; available_to_time?: string | null } | null
  publicMenuReady: boolean
  customerApiAvailable: boolean
  selectedCustomerUrl?: string | null
  yen: (value: number) => string
  onSelectTopCategory: (id: string) => void
  onSelectCategory: (id: string) => void
  onDecrementItem: (cartKey: string) => void
  onIncrementItem: (cartKey: string, toppingIds?: string[]) => void
  onOpenConfirm: () => void
  onBackToMenu: () => void
  onSubmitOrder: () => void
  ticketReceipt?: TicketReceipt | null
  ticketSummaryLines?: ReceiptSummaryLine[]
  onRefreshTicket?: () => void
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
  timeLimitInfo,
  publicMenuBook,
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
  ticketReceipt,
  ticketSummaryLines,
  onRefreshTicket,
}: CustomerTabletScreenProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const [showQrModal, setShowQrModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [toppingModalOpen, setToppingModalOpen] = useState(false)
  const [activeToppingItem, setActiveToppingItem] = useState<CustomerMenuItem | null>(null)
  const [lang, setLang] = useState<'ja' | 'en'>('ja')

  const isBookOutOfTime = Boolean(
    publicMenuBook && !isTimeWithinWindow(publicMenuBook.available_from_time, publicMenuBook.available_to_time)
  )

  // Setup states
  const [showSetupScreen, setShowSetupScreen] = useState(() => {
    const hasStore = new URLSearchParams(window.location.search).get('store') || window.localStorage.getItem('pos_tablet_store')
    const hasQr = new URLSearchParams(window.location.search).get('qr') || window.localStorage.getItem('pos_tablet_qr')
    return !hasStore || !hasQr
  })
  const [setupStoreSlug, setSetupStoreSlug] = useState(() => {
    return new URLSearchParams(window.location.search).get('store') || window.localStorage.getItem('pos_tablet_store') || 'demo-bbq'
  })
  const [tablesList, setTablesList] = useState<{ id: string; label: string; qr_token: string }[]>([])
  const [loadingTables, setLoadingTables] = useState(false)
  const [setupError, setSetupError] = useState<string | null>(null)
  const [selectedTableQr, setSelectedTableQr] = useState('')

  // Passcode and tap states
  const [showPasscodeModal, setShowPasscodeModal] = useState(false)
  const [passcode, setPasscode] = useState('')
  const [passcodeError, setPasscodeError] = useState('')
  const [tapCount, setTapCount] = useState(0)
  const [tapTimer, setTapTimer] = useState<number | null>(null)

  const hasEnglishNames = visibleCustomerItems.some((item) => item.name_en)

  const getItemName = (item: { name: string; name_en?: string | null }) => {
    return (lang === 'en' && item.name_en) ? item.name_en : item.name
  }

  const formatRemainingTime = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    }
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  const renderTabletTimeLimitBanner = (inModal = false) => {
    if (!timeLimitInfo) return null
    const { remainingSeconds, isLastOrder, isTimeUp } = timeLimitInfo
    const stateClass = isTimeUp ? 'time-up' : isLastOrder ? 'last-order' : 'normal'
    const style = inModal ? { margin: '0 0 16px 0', fontSize: '1rem', padding: '10px 16px' } : undefined
    return (
      <div className={`tablet-time-limit-banner ${stateClass}`} style={style}>
        <span style={{ marginRight: '10px' }}>⏱️</span>
        <span>
          {isTimeUp
            ? '注文時間が終了しました。'
            : isLastOrder
              ? `【ラストオーダー】注文終了まであと ${formatRemainingTime(remainingSeconds)}`
              : `注文終了まであと ${formatRemainingTime(remainingSeconds)}`}
        </span>
      </div>
    )
  }
  
  const scrollHorizontally = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction === 'right' ? 800 : -800,
        behavior: 'smooth',
      })
    }
  }

  const handleFetchTables = async () => {
    setLoadingTables(true)
    setSetupError(null)
    try {
      const data = await fetchStaffPrototypeBootstrap(setupStoreSlug)
      if (data && data.tables) {
        // Only active tables
        const activeTables = data.tables.filter((t) => t.is_active)
        setTablesList(activeTables)
        if (activeTables.length > 0) {
          setSelectedTableQr(activeTables[0].qr_token)
        } else {
          setSetupError('この店舗には有効なテーブルがありません。')
        }
      } else {
        setSetupError('テーブル情報の取得に失敗しました。')
      }
    } catch (err: any) {
      setSetupError(`エラー: ${err.message || String(err)}`)
    } finally {
      setLoadingTables(false)
    }
  }

  const handleSaveSetup = () => {
    if (!setupStoreSlug) {
      setSetupError('店舗IDを入力してください。')
      return
    }
    if (!selectedTableQr) {
      setSetupError('テーブルを選択してください。')
      return
    }
    
    // Save to localStorage
    window.localStorage.setItem('pos_tablet_store', setupStoreSlug)
    window.localStorage.setItem('pos_tablet_qr', selectedTableQr)
    
    // Redirect to clean url with store & qr params
    const url = new URL(window.location.href)
    url.searchParams.set('view', 'cust-tablet')
    url.searchParams.set('store', setupStoreSlug)
    url.searchParams.set('qr', selectedTableQr)
    url.searchParams.delete('ticket')
    
    window.location.replace(url.toString())
  }

  const handleTableBadgeClick = () => {
    setTapCount((prev) => {
      const next = prev + 1
      if (next >= 5) {
        setShowPasscodeModal(true)
        return 0
      }
      return next
    })
    if (tapTimer) window.clearTimeout(tapTimer)
    setTapTimer(window.setTimeout(() => setTapCount(0), 2000))
  }

  const handleVerifyPasscode = () => {
    if (passcode === '1234') {
      setShowPasscodeModal(false)
      setPasscode('')
      setPasscodeError('')
      setShowSetupScreen(true)
      void handleFetchTables()
    } else {
      setPasscodeError('パスコードが正しくありません。')
    }
  }

  if (showSetupScreen) {
    return (
      <div
        className="customer-tablet-app"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: 'linear-gradient(135deg, #1a1c23 0%, #111217 100%)',
          color: '#e2e8f0',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}
      >
        <div
          style={{
            background: 'rgba(30, 41, 59, 0.7)',
            backdropFilter: 'blur(16px)',
            borderRadius: '24px',
            padding: '48px',
            width: '100%',
            maxWidth: '500px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxSizing: 'border-box'
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>⚙️</div>
            <h2 style={{ fontSize: '2rem', margin: 0, fontWeight: 'bold', letterSpacing: '-0.5px' }}>タブレット初期設定</h2>
            <p style={{ color: '#94a3b8', marginTop: '8px' }}>店舗IDとテーブル番号を設定してください。</p>
          </div>

          {setupError && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
                padding: '16px',
                borderRadius: '12px',
                marginBottom: '24px',
                fontSize: '0.95rem',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                lineHeight: '1.5'
              }}
            >
              {setupError}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', color: '#94a3b8', marginBottom: '8px', fontWeight: '600' }}>店舗ID (store slug)</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input
                  type="text"
                  value={setupStoreSlug}
                  onChange={(e) => setSetupStoreSlug(e.target.value)}
                  placeholder="例: demo-bbq"
                  style={{
                    flex: 1,
                    padding: '14px 18px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(15, 23, 42, 0.6)',
                    color: 'white',
                    fontSize: '1.1rem',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box'
                  }}
                />
                <button
                  onClick={handleFetchTables}
                  disabled={loadingTables || !setupStoreSlug}
                  style={{
                    padding: '0 24px',
                    borderRadius: '12px',
                    background: '#4dabf7',
                    color: 'white',
                    border: 'none',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'opacity 0.2s',
                    opacity: (loadingTables || !setupStoreSlug) ? 0.6 : 1
                  }}
                >
                  {loadingTables ? '読込中...' : 'テーブル取得'}
                </button>
              </div>
            </div>

            {tablesList.length > 0 && (
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', color: '#94a3b8', marginBottom: '8px', fontWeight: '600' }}>テーブル選択</label>
                <select
                  value={selectedTableQr}
                  onChange={(e) => setSelectedTableQr(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(15, 23, 42, 0.6)',
                    color: 'white',
                    fontSize: '1.1rem',
                    outline: 'none',
                    cursor: 'pointer',
                    boxSizing: 'border-box'
                  }}
                >
                  {tablesList.map((t) => (
                    <option key={t.id} value={t.qr_token} style={{ background: '#1e293b', color: 'white' }}>
                      卓番: {t.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
              {(activeStoreName || activeTableName) && (
                <button
                  onClick={() => setShowSetupScreen(false)}
                  style={{
                    flex: 1,
                    padding: '16px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    border: 'none',
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  キャンセル
                </button>
              )}
              <button
                onClick={handleSaveSetup}
                disabled={!selectedTableQr}
                style={{
                  flex: 2,
                  padding: '16px',
                  borderRadius: '12px',
                  background: 'var(--tab-primary, #ff6b00)',
                  color: 'white',
                  border: 'none',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(255,107,0,0.3)',
                  transition: 'opacity 0.2s',
                  opacity: !selectedTableQr ? 0.6 : 1
                }}
              >
                設定を保存して起動
              </button>
            </div>
          </div>
        </div>
      </div>
    )
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
        {renderTabletTimeLimitBanner()}
        
        {customerMessage && (
          <div style={{ padding: '16px 32px', background: 'var(--tab-primary, #ff6b00)', color: 'white', textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}>
            {customerMessage}
          </div>
        )}

        <main className="tablet-main" style={{ padding: '32px', justifyContent: 'center', alignItems: 'flex-start', overflowY: 'auto' }}>
          <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto', background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
            {cartItems.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#888', fontSize: '1.2rem' }}>{lang === 'en' ? 'No items selected.' : 'まだ商品が選ばれていません。'}</p>
            ) : null}
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {cartItems.map((item) => (
                <div key={item.cartKey} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed #eee', paddingBottom: '24px' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1.5rem', color: '#333' }}>{getItemName(item)}</h4>
                    {item.toppings && item.toppings.length > 0 && (
                      <div style={{ fontSize: '1.1rem', color: '#666', marginTop: '6px' }}>
                        {item.toppings.map((t) => `＋ ${(lang === 'en' && t.name_en) ? t.name_en : t.name}`).join(' ')}
                      </div>
                    )}
                    <span style={{ color: 'var(--tab-primary, #ff6b00)', fontWeight: 'bold', fontSize: '1.3rem' }}>{yen(item.price)}</span>
                  </div>
                  <div className="stepper active" style={{ width: '150px', margin: 0, display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button disabled={!customerOrderingEnabled || isBookOutOfTime} onClick={() => onDecrementItem(item.cartKey)} style={{ width: '40px', height: '40px', fontSize: '1.5rem', borderRadius: '50%', border: '1px solid #ccc', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
                    <span style={{ fontSize: '1.5rem', minWidth: '30px', textAlign: 'center', fontWeight: 'bold' }}>{item.qty}</span>
                    <button disabled={!customerOrderingEnabled || isBookOutOfTime} onClick={() => onIncrementItem(item.cartKey)} style={{ width: '40px', height: '40px', fontSize: '1.5rem', borderRadius: '50%', border: '1px solid #ccc', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px', paddingTop: '16px', borderTop: '2px solid #eee', fontSize: '2rem', fontWeight: 'bold', color: '#333' }}>
              <span>小計</span>
              <span style={{ color: 'var(--tab-primary, #ff6b00)' }}>{yen(cartSubtotal)}</span>
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

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <button
              className="tablet-submit-btn glowing"
              style={{
                background: '#4dabf7',
                boxShadow: '0 4px 15px rgba(77,171,247,0.4)',
                cursor: 'pointer',
              }}
              onClick={() => {
                onRefreshTicket?.()
                setShowHistoryModal(true)
              }}
              data-testid="customer-open-my-order"
            >
              📋 注文履歴
            </button>

            <button
              className={`tablet-submit-btn glowing`}
              disabled={cartCount === 0 || !customerOrderingEnabled || customerBusy || isBookOutOfTime}
              style={isBookOutOfTime ? { background: '#888', cursor: 'not-allowed', opacity: 0.7 } : undefined}
              onClick={onSubmitOrder}
              data-testid="customer-submit-order"
            >
              {isBookOutOfTime ? '時間外' : customerBusy ? '送信中...' : '注文を確定する'}
            </button>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="customer-tablet-app" data-testid="customer-screen">
      {/* Header with 2-tier category nav */}
      <header className="tablet-header" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 0, padding: 0 }}>
        {/* Top row: store name + table badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 64px', borderBottom: '1px solid #eee' }}>
          <div className="tablet-meta" style={{ marginBottom: 0 }}>
            <h1 style={{ margin: 0 }}>{activeStoreName || '焼肉 UCD'}</h1>
            {hasEnglishNames && (
              <button
                onClick={() => setLang(lang === 'ja' ? 'en' : 'ja')}
                style={{
                  padding: '8px 16px',
                  fontSize: '1rem',
                  background: '#f0f3f5',
                  border: '1px solid #ccc',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  marginLeft: '16px',
                }}
              >
                {lang === 'ja' ? 'English' : '日本語'}
              </button>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {activeTicketNo && (
              <span style={{ background: '#555', color: 'white', padding: '4px 12px', borderRadius: '6px', fontSize: '0.9rem' }}>
                伝票 #{activeTicketNo}
              </span>
            )}
            <span 
              className="tablet-table-badge"
              style={{ cursor: 'pointer' }}
              onClick={handleTableBadgeClick}
            >
              卓番: {activeTableName || '—'}
            </span>
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
          <div style={{ padding: '12px 64px', background: 'var(--tab-primary, #ff6b00)', color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
            {customerMessage}
          </div>
        )}

        {isBookOutOfTime && (
          <div style={{ padding: '12px 64px', background: '#e03131', color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
            現在、このメニューの提供時間外です ({publicMenuBook?.available_from_time || ''} 〜 {publicMenuBook?.available_to_time || ''})
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
                data-testid={`customer-top-category-${cat.id}`}
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
                data-testid={`customer-sub-category-${cat.id}`}
                style={{
                  fontSize: '1.05rem',
                  padding: '10px 22px',
                  background: selectedCustomerCategoryId === cat.id ? 'var(--tab-primary, #ff6b00)' : '#f0f3f5',
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
      {renderTabletTimeLimitBanner()}

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
              {lang === 'en' ? 'No items in this category' : 'このカテゴリのメニューはありません'}
            </div>
          ) : (
            visibleCustomerItems.map((item) => {
              const qty = cartItems.filter((cItem) => cItem.id === item.id).reduce((sum, cItem) => sum + cItem.qty, 0);
              return (
                <article
                  key={item.id}
                  className={`tablet-menu-card ${item.soldOut ? 'sold-out' : ''}`}
                  data-testid={`customer-menu-item-${item.id}`}
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
                        {getItemName(item).slice(0, 1).toUpperCase()}
                      </span>
                    )}
                    {qty > 0 && <span className="tablet-qty-badge">{qty}</span>}
                    {item.soldOut && <div className="tablet-sold-out-overlay">{lang === 'en' ? 'Sold Out' : '売切'}</div>}
                  </div>

                  <div className="tablet-card-content">
                    <div className="tablet-card-text">
                      <h3 className="tablet-item-name">{getItemName(item)}</h3>
                      {item.lead && <p className="tablet-item-lead">{item.lead}</p>}
                      <strong className="tablet-item-price">{yen(item.price)}</strong>
                    </div>

                    {!item.soldOut && (
                      <div className="tablet-actions">
                        <button
                          className="tablet-add-btn"
                          disabled={!customerOrderingEnabled || isBookOutOfTime}
                          style={isBookOutOfTime ? { background: '#888', borderColor: '#777', cursor: 'not-allowed', opacity: 0.7 } : undefined}
                          data-testid={`customer-item-increment-${item.id}`}
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
                          {isBookOutOfTime ? '時間外' : '注文リストへ追加'}
                        </button>
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

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <button
            className="tablet-submit-btn glowing"
            style={{
              background: '#4dabf7',
              boxShadow: '0 4px 15px rgba(77,171,247,0.4)',
              cursor: 'pointer',
            }}
            onClick={() => {
              onRefreshTicket?.()
              setShowHistoryModal(true)
            }}
            data-testid="customer-open-my-order"
          >
            📋 注文履歴
          </button>

          <button
            className={`tablet-submit-btn ${cartCount > 0 && !isBookOutOfTime ? 'glowing' : ''}`}
            disabled={cartCount === 0 || !customerOrderingEnabled || customerBusy || isBookOutOfTime}
            style={isBookOutOfTime ? { background: '#888', cursor: 'not-allowed', opacity: 0.7 } : undefined}
            onClick={onOpenConfirm}
            data-testid="customer-open-confirm"
          >
            {isBookOutOfTime ? '時間外' : customerBusy ? '送信中...' : '注文を確認して送信する'}
          </button>
        </div>
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

      {showHistoryModal && (
        <div 
          style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.8)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex: 2000}}
          onClick={() => setShowHistoryModal(false)}
        >
          <div 
            style={{background:'white', padding:'32px', borderRadius:'24px', color:'#333', width:'100%', maxWidth:'600px', maxHeight:'80vh', display:'flex', flexDirection:'column', boxShadow:'0 20px 40px rgba(0,0,0,0.2)', position:'relative'}}
            onClick={e => e.stopPropagation()}
            data-testid="customer-my-order-panel"
          >
            {/* Header */}
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #eee', paddingBottom:'16px', marginBottom:'16px'}}>
              <h2 style={{margin:0, fontSize:'1.8rem', fontWeight:'bold', color:'#333'}}>📋 ご注文履歴</h2>
              <button 
                onClick={() => setShowHistoryModal(false)}
                style={{background:'none', border:'none', fontSize:'1.8rem', color:'#999', cursor:'pointer'}}
              >
                ×
              </button>
            </div>

            {/* Body */}
             <div style={{flex: 1, overflowY: 'auto', paddingRight: '4px'}}>
               {renderTabletTimeLimitBanner(true)}
               {ticketReceipt ? (
                <>
                  <div style={{background:'#f8f9fa', padding:'16px', borderRadius:'12px', marginBottom:'20px', fontSize:'1.1rem', color:'#555', display:'flex', justifyContent:'space-between'}}>
                    <span><strong>伝票番号:</strong> {ticketReceipt.ticketNo || activeTicketNo || '—'}</span>
                    <span>
                      <strong>注文時刻:</strong> {(() => {
                        try {
                          return new Intl.DateTimeFormat('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(ticketReceipt.orderedAt))
                        } catch {
                          return ticketReceipt.orderedAt || '—'
                        }
                      })()}
                    </span>
                  </div>

                  {ticketSummaryLines && ticketSummaryLines.length > 0 ? (
                    <div style={{display:'flex', flexDirection:'column', gap:'16px'}}>
                      {ticketSummaryLines.map((line) => (
                        <div key={line.itemName} style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px dashed #eee', paddingBottom:'12px'}}>
                          <div>
                            <strong style={{fontSize:'1.3rem', color:'#333'}}>{line.itemName}</strong>
                            <div style={{color:'#666', fontSize:'1rem', marginTop:'4px'}}>数量: {line.qty}点</div>
                          </div>
                          <strong style={{fontSize:'1.3rem', color:'#333'}}>{yen(line.subtotal)}</strong>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{textAlign:'center', color:'#888', margin:'32px 0', fontSize:'1.2rem'}}>注文内容はまだありません。</p>
                  )}

                  {/* Summary */}
                  <div style={{display:'flex', justifyContent:'space-between', marginTop:'24px', paddingTop:'16px', borderTop:'2px solid #333', fontSize:'1.8rem', fontWeight:'bold', color:'#333'}}>
                    <span>合計金額</span>
                    <span style={{color:'var(--tab-primary, #ff6b00)'}}>{yen(ticketReceipt.subtotal)}</span>
                  </div>
                </>
              ) : customerBusy ? (
                <div style={{textAlign:'center', padding:'48px 0'}}>
                  <div style={{fontSize:'2.5rem', marginBottom:'16px', animation: 'spin 1.5s linear infinite'}}>🔄</div>
                  <p style={{color:'#888', fontSize:'1.2rem', margin:0}}>注文履歴を読み込んでいます...</p>
                  <style>{`
                    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                  `}</style>
                </div>
              ) : (
                <p style={{textAlign:'center', color:'#888', padding:'48px 0', fontSize:'1.2rem'}}>注文履歴はありません。</p>
              )}
            </div>

            {/* Footer buttons */}
            <div style={{display:'flex', gap:'16px', marginTop:'24px', borderTop:'1px solid #eee', paddingTop:'20px'}}>
              <button 
                className="tablet-submit-btn glowing" 
                style={{flex: 1, padding:'16px', background:'#4dabf7', boxShadow:'0 4px 15px rgba(77,171,247,0.3)', cursor:'pointer'}}
                onClick={() => onRefreshTicket?.()}
                disabled={customerBusy}
              >
                {customerBusy ? '更新中...' : '最新状態に更新'}
              </button>
              <button 
                className="tablet-submit-btn" 
                style={{flex: 1, padding:'16px', background:'#f0f3f5', color:'#555', cursor:'pointer'}}
                onClick={() => setShowHistoryModal(false)}
                data-testid="customer-back-to-menu-from-my-order"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
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
      {showPasscodeModal && (
        <div 
          style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.85)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex: 3000}}
          onClick={() => {
            setShowPasscodeModal(false)
            setPasscode('')
            setPasscodeError('')
          }}
        >
          <div 
            style={{background:'white', padding:'32px', borderRadius:'24px', textAlign:'center', color:'#333', width:'100%', maxWidth:'400px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)'}}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{margin: '0 0 16px', fontSize: '1.5rem', fontWeight: 'bold'}}>管理者認証</h3>
            <p style={{color: '#666', marginBottom: '24px'}}>テーブル変更にはパスコードが必要です。</p>
            
            {passcodeError && (
              <div style={{color: 'var(--tab-primary, #ff6b00)', fontSize: '0.95rem', marginBottom: '16px', fontWeight: 'bold'}}>{passcodeError}</div>
            )}
            
            <input
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="パスコードを入力"
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                border: '1px solid #ccc',
                fontSize: '1.2rem',
                textAlign: 'center',
                marginBottom: '24px',
                boxSizing: 'border-box'
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleVerifyPasscode()
              }}
              autoFocus
            />
            
            <div style={{display:'flex', gap:'16px'}}>
              <button 
                onClick={() => {
                  setShowPasscodeModal(false)
                  setPasscode('')
                  setPasscodeError('')
                }}
                style={{flex:1, padding:'14px', background:'#f0f3f5', border:'none', borderRadius:'12px', cursor:'pointer', fontSize:'1rem', fontWeight:'bold', color:'#555'}}
              >
                キャンセル
              </button>
              <button 
                onClick={handleVerifyPasscode}
                style={{flex:1, padding:'14px', background:'var(--tab-primary, #ff6b00)', border:'none', borderRadius:'12px', cursor:'pointer', fontSize:'1rem', fontWeight:'bold', color:'white'}}
              >
                確認
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
