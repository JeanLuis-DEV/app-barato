export type Unit = 'un' | 'kg' | 'g' | 'L' | 'ml'

export type UnitGroup = 'unit' | 'weight' | 'volume'

export type Product = {
  name?: string
  label?: string
  price: number | string
  quantity: number | string
  unit: Unit
}

export type ComparisonResult = {
  winner: string | 'DRAW' | 'TIE'
  winnerIndexes: number[]
  winnerLabels: string[]
  difference: string
  savings: number
  comparedCount: number
}

export type ComparisonOutcome = {
  result: ComparisonResult | null
  unitError: boolean
}
