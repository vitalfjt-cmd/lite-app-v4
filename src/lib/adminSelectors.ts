type LiveCategoryLike = {
  id: string
  name: string
  sort_order: number
  parent_category_id?: string | null
}

type LiveSubcategoryLike = {
  id: string
  name: string
}

type LiveMenuBookLike = {
  id: string
  name: string
}

type LiveMenuItemLike = {
  id: string
  category_id: string
  name: string
  price: number
  tax_type?: 'INCLUDED' | 'EXCLUDED' | 'NONE'
  image_url?: string | null
  sort_order: number
  is_active: boolean
  is_sold_out: boolean
}

type LiveBookCategoryLike = {
  id: string
  menu_book_id: string
  menu_category_id: string
  sort_order: number
}

type LiveBookCategorySubcategoryLike = {
  id: string
  menu_book_id: string
  menu_category_id: string
  menu_subcategory_id: string
  sort_order: number
}

type LiveBookSubcategoryItemLike = {
  id: string
  menu_book_id: string
  menu_category_id: string
  menu_subcategory_id: string
  menu_item_id: string
  sort_order: number
  display_name_override?: string | null
  description_override?: string | null
}

export function buildAdminTopCategories<TCategory extends LiveCategoryLike>(liveCategories: TCategory[]) {
  return liveCategories.filter((category) => !category.parent_category_id)
}

export function buildAdminVisibleItems<TItem extends LiveMenuItemLike>(
  liveBookSubcategoryItems: LiveBookSubcategoryItemLike[],
  liveItems: TItem[],
  adminMenuBookId: string,
) {
  return liveBookSubcategoryItems
    .filter((relation) => !adminMenuBookId || relation.menu_book_id === adminMenuBookId)
    .map((relation) => {
      const item = liveItems.find((candidate) => candidate.id === relation.menu_item_id)
      if (!item) return null
      return {
        ...item,
        category_id: relation.menu_subcategory_id,
      }
    })
    .filter((item): item is TItem => Boolean(item))
}

export function buildAdminPlacements(
  liveBookSubcategoryItems: LiveBookSubcategoryItemLike[],
  liveMenuBooks: LiveMenuBookLike[],
  liveBookCategorySubcategories: LiveBookCategorySubcategoryLike[],
  liveCategories: LiveCategoryLike[],
  liveSubcategories: LiveSubcategoryLike[],
  liveItems: LiveMenuItemLike[],
) {
  return liveBookSubcategoryItems.map((relation) => {
    return {
      id: relation.id,
      menuBookId: relation.menu_book_id,
      menuBookName: liveMenuBooks.find((menuBook) => menuBook.id === relation.menu_book_id)?.name ?? '-',
      topCategoryId: relation.menu_category_id,
      topCategoryName: liveCategories.find((category) => category.id === relation.menu_category_id)?.name ?? '-',
      subcategoryId: relation.menu_subcategory_id,
      subcategoryName: liveSubcategories.find((subcategory) => subcategory.id === relation.menu_subcategory_id)?.name ?? '-',
      itemId: relation.menu_item_id,
      itemName: liveItems.find((item) => item.id === relation.menu_item_id)?.name ?? '-',
      sortOrder: relation.sort_order,
      displayNameOverride: relation.display_name_override ?? null,
      descriptionOverride: relation.description_override ?? null,
    }
  })
}

export function buildAdminBookCategories(
  liveBookCategories: LiveBookCategoryLike[],
  liveMenuBooks: LiveMenuBookLike[],
  liveCategories: LiveCategoryLike[],
) {
  return liveBookCategories.map((relation) => ({
    id: relation.id,
    menuBookId: relation.menu_book_id,
    menuBookName: liveMenuBooks.find((menuBook) => menuBook.id === relation.menu_book_id)?.name ?? '-',
    topCategoryId: relation.menu_category_id,
    topCategoryName: liveCategories.find((category) => category.id === relation.menu_category_id)?.name ?? '-',
    sortOrder: relation.sort_order,
  }))
}

export function buildAdminBookCategorySubcategories(
  liveBookCategorySubcategories: LiveBookCategorySubcategoryLike[],
  liveMenuBooks: LiveMenuBookLike[],
  liveCategories: LiveCategoryLike[],
  liveSubcategories: LiveSubcategoryLike[],
) {
  return liveBookCategorySubcategories.map((relation) => ({
    id: relation.id,
    menuBookId: relation.menu_book_id,
    menuBookName: liveMenuBooks.find((menuBook) => menuBook.id === relation.menu_book_id)?.name ?? '-',
    topCategoryId: relation.menu_category_id,
    topCategoryName: liveCategories.find((category) => category.id === relation.menu_category_id)?.name ?? '-',
    subcategoryId: relation.menu_subcategory_id,
    subcategoryName: liveSubcategories.find((subcategory) => subcategory.id === relation.menu_subcategory_id)?.name ?? '-',
    sortOrder: relation.sort_order,
  }))
}
