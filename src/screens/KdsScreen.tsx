import { useMemo, useState, useEffect } from 'react'

type KdsQueueItem = {
  id: string
  itemName: string
  qty: number
  status: 'NEW' | 'COOKING' | 'SERVED' | 'CANCELLED'
  ticketNo: string
  tableName: string
  createdAt: string
  subcategoryName?: string
  subcategorySortOrder?: number
  itemSortOrder?: number
  toppings?: { id: string; name: string; price: number }[]
}

type KdsScreenProps = {
  queue: KdsQueueItem[]
  tableOptions: string[]
  mode: 'all' | 'table'
  selectedTableName: string | null
  mutationBusy: string | null
  formatTime: (value: string) => string
  kdsStatusLabel: (status: KdsQueueItem['status']) => string
  onModeChange: (mode: 'all' | 'table') => void
  onSelectTable: (tableName: string) => void
  onAdvanceStatus: (lineId: string) => void
  onOpenLauncher?: () => void
}

export function KdsScreen({
  queue,
  tableOptions,
  mode,
  selectedTableName,
  mutationBusy,
  formatTime,
  kdsStatusLabel,
  onModeChange,
  onSelectTable,
  onAdvanceStatus,
  onOpenLauncher,
}: KdsScreenProps) {
  const [now, setNow] = useState(Date.now())

  // Force tick every minute to update the elapsed timers
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000)
    return () => clearInterval(timer)
  }, [])

  // Filter items based on mode
  const displayedQueue = useMemo(() => {
    return queue.filter(item => {
      // Ignore served or cancelled here if you want a clean board, 
      // but usually the backend queue prop already strips SERVED unless it's just been served.
      if (item.status === 'SERVED' || item.status === 'CANCELLED') return false
      if (mode === 'table' && selectedTableName && item.tableName !== selectedTableName) return false
      return true
    })
  }, [queue, mode, selectedTableName])

  // Group items by ticket into Cards
  const groupedOrders = useMemo(() => {
    const map = new Map<string, KdsQueueItem[]>()
    displayedQueue.forEach(item => {
      const key = `${item.tableName}-${item.ticketNo}`
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(item)
    })

    return Array.from(map.entries()).map(([key, items]) => {
      // Find the earliest ordered item in this group
      const earliestStr = items.reduce((earliest, cur) => {
         if (!cur.createdAt) return earliest
         if (!earliest) return cur.createdAt
         return new Date(cur.createdAt) < new Date(earliest) ? cur.createdAt : earliest
      }, items[0].createdAt)
      
      let elapsedMin = 0
      if (earliestStr) {
         elapsedMin = Math.max(0, Math.floor((now - new Date(earliestStr).getTime()) / 60000))
      }

      const allDone = items.every(i => i.status === 'COOKING') // Assuming click makes them COOKING, then SERVE button serves them all!
      
      return {
        id: key,
        ticketNo: items[0].ticketNo,
        tableName: items[0].tableName,
        items,
        elapsedMin,
        isUrgent: elapsedMin >= 10,
        allDone
      }
    }).sort((a,b) => b.elapsedMin - a.elapsedMin) // longest waiting first
  }, [displayedQueue, now])

  const handleServeAll = async (orderGroup: typeof groupedOrders[0]) => {
      // Advance ALL items in the group to SERVED.
      // If they are COOKING, one advance makes them SERVED.
      for (const item of orderGroup.items) {
          // You might need to trigger advanceStatus.
          if (item.status !== 'SERVED') {
             onAdvanceStatus(item.id)
          }
      }
  }

  return (
    <div className="kds-app dark-mode" data-testid="kds-screen">
      <header className="kds-header">
        <div className="logo-area">
          <button className="menu-trigger" onClick={onOpenLauncher} aria-label="Open Menu">
            <span className="material-icons">menu</span>
          </button>
          <h2 className="glow-text">KDS / 調理指示画面</h2>
        </div>
        <div className="header-meta">
          <div className="filter-chips" style={{marginRight: '24px'}}>
             <button className={`chip ${mode === 'all' ? 'active' : ''}`} onClick={() => onModeChange('all')}>すべて</button>
             {tableOptions.map(table => (
               <button 
                 key={table} 
                 className={`chip ${mode === 'table' && selectedTableName === table ? 'active' : ''}`} 
                 onClick={() => { onModeChange('table'); onSelectTable(table) }}
                >
                 {table}
               </button>
             ))}
          </div>
          <span className="queue-badge">現在: {groupedOrders.length} 件</span>
        </div>
      </header>

      <main className="kds-board">
        {groupedOrders.map(order => {
          return (
            <article key={order.id} className={`kds-card ${order.isUrgent ? 'urgent' : ''}`}>
              <div className="kds-card-head">
                 <div style={{display:'flex', flexDirection:'column'}}>
                   <span className="kds-table-name">{order.tableName}</span>
                   <span style={{fontSize:'0.9rem', color:'rgba(255,255,255,0.7)'}}>伝票: {order.ticketNo}</span>
                 </div>
                <div className={`kds-timer ${order.isUrgent ? 'flash' : ''}`}>
                  {order.elapsedMin} 分経過
                </div>
              </div>
              <div className="kds-items">
                {(() => {
                  const subcategoryMap = new Map<string, { name: string; sortOrder: number; items: typeof order.items }>()
                  order.items.forEach(item => {
                    const subcatName = item.subcategoryName || 'その他'
                    const subcatSort = item.subcategorySortOrder ?? 9999
                    if (!subcategoryMap.has(subcatName)) {
                      subcategoryMap.set(subcatName, { name: subcatName, sortOrder: subcatSort, items: [] })
                    }
                    subcategoryMap.get(subcatName)!.items.push(item)
                  })

                  const sortedSubcategories = Array.from(subcategoryMap.values()).sort((a, b) => a.sortOrder - b.sortOrder)

                  return sortedSubcategories.map(subcat => (
                    <div key={subcat.name} className="kds-subcategory-group">
                      <div className="kds-subcategory-title">{subcat.name}</div>
                      <div className="kds-subcategory-items">
                        {[...subcat.items].sort((a, b) => (a.itemSortOrder ?? 9999) - (b.itemSortOrder ?? 9999)).map(item => {
                          const isDone = item.status === 'COOKING';
                          return (
                            <button 
                              key={item.id} 
                              className={`kds-item-btn ${isDone ? 'done' : ''}`}
                              disabled={mutationBusy === item.id || item.status === 'SERVED'}
                              onClick={() => onAdvanceStatus(item.id)}
                            >
                              <div className="checkbox-ring"></div>
                              <span className="item-name">
                                {item.itemName}
                                {item.toppings && item.toppings.length > 0 && (
                                  <div style={{ fontSize: '0.85em', opacity: 0.8, marginTop: '4px' }}>
                                    {item.toppings.map(t => ` ＋ ${t.name}`).join(' ')}
                                  </div>
                                )}
                              </span>
                              <strong className="item-qty">x{item.qty}</strong>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))
                })()}
              </div>
              <div className="kds-card-footer">
                <button 
                  className={`kds-serve-btn ${order.allDone ? 'ready' : ''}`}
                  disabled={mutationBusy !== null}
                  onClick={() => handleServeAll(order)}
                >
                   {mutationBusy !== null ? '更新中...' : order.allDone ? '提供済みにする' : '提供済みにする（個別状態無視）'}
                </button>
              </div>
            </article>
          )
        })}

        {groupedOrders.length === 0 && (
          <div className="kds-empty">
            <h3>現在調理待ちの注文はありません</h3>
            <p>厨房はクリーンです✌️</p>
          </div>
        )}
      </main>
    </div>
  )
}
