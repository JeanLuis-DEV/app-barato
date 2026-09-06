import type { ComparisonOutcome, Product, Unit, UnitGroup } from './types'

const MIN_PRODUCTS_TO_COMPARE = 2
const PRICE_TOLERANCE = 0.0000001
const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E']

const UNIT_GROUPS: Record<Unit, UnitGroup> = {
  un: 'unit',
  kg: 'weight',
  g: 'weight',
  L: 'volume',
  ml: 'volume',
}

export function parseNumber(value: number | string): number {
  if (!value) return 0

  const numericValue = typeof value === 'string'
    ? Number.parseFloat(value.replace(/\./g, '').replace(',', '.'))
    : value

  return Number.isNaN(numericValue) ? 0 : numericValue
}

export function getUnitGroup(unit: Unit): UnitGroup {
  return UNIT_GROUPS[unit]
}

export function normalizeQuantity(quantity: number, unit: Unit): number {
  return unit === 'g' || unit === 'ml' ? quantity / 1000 : quantity
}

export function areUnitsCompatible(units: Unit[]): boolean {
  const [firstUnit] = units
  return firstUnit == null || units.every((unit) => getUnitGroup(unit) === getUnitGroup(firstUnit))
}

export function calculateUnitPrice(price: number, normalizedQuantity: number): number {
  return price / normalizedQuantity
}

export function calculateComparison(products: Product[]): ComparisonOutcome {
  const comparableProducts = products
    .map((product, index) => ({
      product,
      index,
      label: product.label || OPTION_LABELS[index] || String(index + 1),
      price: parseNumber(product.price),
      rawQuantity: parseNumber(product.quantity),
    }))
    .filter(({ price, rawQuantity }) => price > 0 && rawQuantity > 0)

  if (comparableProducts.length < MIN_PRODUCTS_TO_COMPARE) {
    return { result: null, unitError: false }
  }

  if (!areUnitsCompatible(comparableProducts.map(({ product }) => product.unit))) {
    return { result: null, unitError: true }
  }

  const pricedProducts = comparableProducts.map((item) => {
    const normalizedQuantity = normalizeQuantity(item.rawQuantity, item.product.unit)

    return {
      ...item,
      normalizedQuantity,
      unitPrice: calculateUnitPrice(item.price, normalizedQuantity),
    }
  })

  const sortedProducts = [...pricedProducts].sort((a, b) => a.unitPrice - b.unitPrice)
  const bestProduct = sortedProducts[0]
  const worstProduct = sortedProducts[sortedProducts.length - 1]

  if (Math.abs(bestProduct.unitPrice - worstProduct.unitPrice) <= PRICE_TOLERANCE) {
    return {
      result: {
        winner: 'DRAW',
        winnerIndexes: [],
        winnerLabels: pricedProducts.map(({ label }) => label),
        difference: '0.0',
        savings: 0,
        comparedCount: pricedProducts.length,
      },
      unitError: false,
    }
  }

  const winnerProducts = sortedProducts.filter(
    ({ unitPrice }) => Math.abs(unitPrice - bestProduct.unitPrice) <= PRICE_TOLERANCE,
  )
  const winnerLabels = winnerProducts.map(({ label }) => label)
  const difference = ((worstProduct.unitPrice - bestProduct.unitPrice) / worstProduct.unitPrice) * 100
  const savings = (
    winnerProducts[0].normalizedQuantity * worstProduct.unitPrice
  ) - winnerProducts[0].price

  return {
    result: {
      winner: winnerProducts.length === 1 ? winnerProducts[0].label : 'TIE',
      winnerIndexes: winnerProducts.map(({ index }) => index),
      winnerLabels,
      difference: difference.toFixed(1),
      savings: Math.abs(savings),
      comparedCount: pricedProducts.length,
    },
    unitError: false,
  }
}
