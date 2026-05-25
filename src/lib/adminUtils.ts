export function resetAdminBookForm(
  setEditingMenuBookId: (value: string | null) => void,
  setAdminMenuBookName: (value: string) => void,
  setAdminMenuBookCode: (value: string) => void,
  setAdminMenuBookDescription: (value: string) => void,
  setAdminMenuBookSortOrder: (value: string) => void,
  setAdminMenuBookIsActive: (value: boolean) => void,
  setAdminMenuBookAvailableFromTime: (value: string) => void,
  setAdminMenuBookAvailableToTime: (value: string) => void,
  setAdminMenuBookValidFrom: (value: string) => void,
  setAdminMenuBookValidTo: (value: string) => void,
) {
  setEditingMenuBookId(null)
  setAdminMenuBookName('')
  setAdminMenuBookCode('')
  setAdminMenuBookDescription('')
  setAdminMenuBookSortOrder('10')
  setAdminMenuBookIsActive(true)
  setAdminMenuBookAvailableFromTime('')
  setAdminMenuBookAvailableToTime('')
  setAdminMenuBookValidFrom('')
  setAdminMenuBookValidTo('')
}

export function resetAdminCategoryForm(
  setEditingCategoryId: (value: string | null) => void,
  setAdminCategoryName: (value: string) => void,
  setAdminCategorySortOrder: (value: string) => void,
) {
  setEditingCategoryId(null)
  setAdminCategoryName('')
  setAdminCategorySortOrder('10')
}

export function resetAdminSubCategoryForm(
  setEditingSubCategoryId: (value: string | null) => void,
  setAdminSubCategoryName: (value: string) => void,
  setAdminSubCategorySortOrder: (value: string) => void,
  setAdminCategoryParentId: (value: string) => void,
) {
  setEditingSubCategoryId(null)
  setAdminSubCategoryName('')
  setAdminSubCategorySortOrder('10')
  setAdminCategoryParentId('')
}

export function resetAdminItemForm(
  setEditingMenuItemId: (value: string | null) => void,
  setAdminItemCategoryId: (value: string) => void,
  setAdminItemCode: (value: string) => void,
  setAdminItemName: (value: string) => void,
  setAdminItemPrice: (value: string) => void,
  setAdminItemTaxType: (value: 'INCLUDED' | 'EXCLUDED' | 'NONE') => void,
  setAdminItemImageUrl: (value: string) => void,
  setAdminItemSortOrder: (value: string) => void,
  setAdminItemIsActive: (value: boolean) => void,
  setAdminItemIsSoldOut: (value: boolean) => void,
) {
  setEditingMenuItemId(null)
  setAdminItemCategoryId('')
  setAdminItemCode('')
  setAdminItemName('')
  setAdminItemPrice('500')
  setAdminItemTaxType('INCLUDED')
  setAdminItemImageUrl('')
  setAdminItemSortOrder('10')
  setAdminItemIsActive(true)
  setAdminItemIsSoldOut(false)
}

export function resetAdminPlacementForm(
  setEditingPlacementId: (value: string | null) => void,
  setAdminPlacementMenuBookId: (value: string) => void,
  setAdminPlacementTopCategoryId: (value: string) => void,
  setAdminPlacementCategoryId: (value: string) => void,
  setAdminPlacementItemId: (value: string) => void,
  setAdminPlacementDisplayNameOverride: (value: string) => void,
  setAdminPlacementDescriptionOverride: (value: string) => void,
) {
  setEditingPlacementId(null)
  setAdminPlacementMenuBookId('')
  setAdminPlacementTopCategoryId('')
  setAdminPlacementCategoryId('')
  setAdminPlacementItemId('')
  setAdminPlacementDisplayNameOverride('')
  setAdminPlacementDescriptionOverride('')
}
