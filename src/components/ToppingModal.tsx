import React, { useState } from 'react'

interface Topping {
  id: string
  name: string
  name_en?: string | null
  price: number
  is_sold_out: boolean
}

interface ToppingModalProps {
  isOpen: boolean
  onClose: () => void
  itemName: string
  toppings: Topping[]
  onConfirm: (selectedToppingIds: string[]) => void
  lang?: 'ja' | 'en'
}

export const ToppingModal: React.FC<ToppingModalProps> = ({
  isOpen,
  onClose,
  itemName,
  toppings,
  onConfirm,
  lang = 'ja',
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  if (!isOpen) return null

  const handleToggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }

  const handleConfirm = () => {
    onConfirm(selectedIds)
    setSelectedIds([])
    onClose()
  }

  const handleClose = () => {
    setSelectedIds([])
    onClose()
  }

  return (
    <div className="topping-modal-overlay" onClick={handleClose}>
      <div className="topping-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="topping-modal-header">
          <h3>{itemName}</h3>
          <p>{lang === 'en' ? 'Select options' : 'オプションを選択してください'}</p>
        </div>
        <div className="topping-options-list">
          {toppings.map((topping) => {
            const isSelected = selectedIds.includes(topping.id)
            return (
              <div
                key={topping.id}
                className={`topping-option-item ${isSelected ? 'selected' : ''} ${
                  topping.is_sold_out ? 'sold-out' : ''
                }`}
                onClick={() => !topping.is_sold_out && handleToggle(topping.id)}
              >
                <div className="topping-info">
                  <span className="topping-name">{(lang === 'en' && topping.name_en) ? topping.name_en : topping.name}</span>
                  <span className="topping-price">
                    {topping.is_sold_out
                      ? ''
                      : topping.price > 0
                        ? `+¥${topping.price}`
                        : '無料'}
                  </span>
                  {topping.is_sold_out && (
                    <span className="topping-sold-out-badge">{lang === 'en' ? 'Sold Out' : '売り切れ'}</span>
                  )}
                </div>
                <div className="topping-checkbox">
                  {!topping.is_sold_out && (isSelected ? '✓' : '')}
                </div>
              </div>
            )
          })}
        </div>
        <div className="topping-modal-actions">
          <button className="topping-btn-cancel" onClick={handleClose}>
            {lang === 'en' ? 'Cancel' : 'キャンセル'}
          </button>
          <button className="topping-btn-confirm" onClick={handleConfirm}>
            {lang === 'en'
              ? (selectedIds.length > 0 ? 'Add with options' : 'Add without options')
              : (selectedIds.length > 0 ? 'オプション付きで追加' : 'オプションなしで追加')}
          </button>
        </div>
      </div>
    </div>
  )
}
