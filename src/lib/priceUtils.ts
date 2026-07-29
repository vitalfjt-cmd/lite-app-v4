export type TaxType = 'INCLUDED' | 'EXCLUDED' | 'NONE'
export type TaxRateType = 'STANDARD' | 'REDUCED' | 'NONE'
export type TaxDisplayMode = 'INCLUDED' | 'EXCLUDED'

export function getEffectiveTaxRate(
  taxRateType: TaxRateType | undefined,
  standardRate: number = 10,
  reducedRate: number = 8,
): number {
  if (taxRateType === 'NONE') return 0
  if (taxRateType === 'REDUCED') return reducedRate
  return standardRate
}

export function formatItemPrice(
  price: number,
  taxType: TaxType | undefined,
  taxRateType: TaxRateType | undefined,
  taxDisplayMode: TaxDisplayMode | undefined,
  standardRate: number = 10,
  reducedRate: number = 8,
  yenFn: (val: number) => string = (val) => `¥${val.toLocaleString()}`,
): string {
  const mode = taxDisplayMode ?? 'INCLUDED'
  const type = taxType ?? 'INCLUDED'
  const rateType = taxRateType ?? (type === 'NONE' ? 'NONE' : 'STANDARD')
  const rate = getEffectiveTaxRate(rateType, standardRate, reducedRate)

  if (type === 'NONE' || rateType === 'NONE') {
    return `${yenFn(price)}（非課税）`
  }

  let computedPrice = price
  if (mode === 'INCLUDED') {
    if (type === 'EXCLUDED') {
      computedPrice = Math.round(price * (1 + rate / 100))
    }
    return `${yenFn(computedPrice)}（税込）`
  } else {
    if (type === 'INCLUDED') {
      computedPrice = Math.round(price / (1 + rate / 100))
    }
    return `${yenFn(computedPrice)}（税抜）`
  }
}
