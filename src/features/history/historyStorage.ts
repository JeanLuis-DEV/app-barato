import type { Unit } from '../comparison/types'
import {
  HISTORY_SCHEMA_VERSION,
  type HistoryItem,
  type HistoryLoadResult,
  type HistoryLoadWarning,
  type HistoryProduct,
  type HistoryResult,
  type HistoryWriteResult,
} from './types'

export const HISTORY_STORAGE_KEY = 'app-barato-history'
export const HISTORY_LIMIT = 50

type HistoryStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
type UnknownRecord = Record<string, unknown>

const ALLOWED_UNITS = new Set<Unit>(['un', 'kg', 'g', 'L', 'ml'])

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parsePositiveNumber(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) && value > 0 ? value : null
  }

  if (typeof value !== 'string') return null

  const trimmedValue = value.trim()
  const validLegacyNumber = /^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d+)?$/
  if (!validLegacyNumber.test(trimmedValue)) return null

  const number = Number(trimmedValue.replace(/\./g, '').replace(',', '.'))
  return Number.isFinite(number) && number > 0 ? number : null
}

function parseNonNegativeNumber(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) && value >= 0 ? value : null
  }

  if (typeof value !== 'string' || value.trim() === '') return null

  const number = Number(value)
  return Number.isFinite(number) && number >= 0 ? number : null
}

function normalizeId(value: unknown): string | null {
  if (typeof value === 'string' && value.trim() !== '') return value
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return null
}

function normalizeTimestamp(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) return value

  if (typeof value === 'string' && /^\d+$/.test(value)) {
    const timestamp = Number(value)
    return Number.isFinite(timestamp) && timestamp > 0 ? timestamp : null
  }

  return null
}

function normalizeProduct(value: unknown, index: number): HistoryProduct | null {
  if (!isRecord(value) || !ALLOWED_UNITS.has(value.unit as Unit)) return null

  const price = parsePositiveNumber(value.price)
  const quantity = parsePositiveNumber(value.quantity)
  if (price == null || quantity == null) return null

  const label = typeof value.label === 'string' && value.label.trim() !== ''
    ? value.label.trim()
    : String.fromCharCode(65 + index)
  const name = typeof value.name === 'string' && value.name.trim() !== ''
    ? value.name.trim()
    : undefined

  return {
    label,
    ...(name ? { name } : {}),
    price,
    quantity,
    unit: value.unit as Unit,
  }
}

function normalizeProducts(value: unknown): HistoryProduct[] | null {
  if (!Array.isArray(value) || value.length < 2) return null

  const products = value.map(normalizeProduct)
  return products.every((product): product is HistoryProduct => product !== null)
    ? products
    : null
}

function normalizeResult(value: unknown, products: HistoryProduct[]): HistoryResult | null {
  if (!isRecord(value) || typeof value.winner !== 'string' || value.winner.trim() === '') return null

  const winner = value.winner.trim()
  const differencePercent = parseNonNegativeNumber(value.differencePercent ?? value.difference)
  const savings = parseNonNegativeNumber(value.savings)
  if (differencePercent == null || savings == null) return null

  let winnerLabels: string[]
  if (Array.isArray(value.winnerLabels)) {
    if (!value.winnerLabels.every((label) => typeof label === 'string' && label.trim() !== '')) return null
    winnerLabels = value.winnerLabels.map((label) => label.trim())
  } else if (winner !== 'DRAW' && winner !== 'TIE') {
    winnerLabels = [winner]
  } else {
    winnerLabels = []
  }

  const productLabels = new Set(products.map(({ label }) => label))
  if (winnerLabels.some((label) => !productLabels.has(label))) return null
  if (winner === 'TIE' && winnerLabels.length < 2) return null
  if (winner !== 'DRAW' && winner !== 'TIE' && !productLabels.has(winner)) return null

  return { winner, winnerLabels, differencePercent, savings }
}

export function normalizeHistoryItem(value: unknown): HistoryItem | null {
  if (!isRecord(value)) return null

  const isNewSchema = value.schemaVersion === HISTORY_SCHEMA_VERSION
  const isLegacyProductsSchema = value.schemaVersion == null && Array.isArray(value.products)
  const isLegacyPairSchema = value.schemaVersion == null && (value.productA != null || value.productB != null)
  if (!isNewSchema && !isLegacyProductsSchema && !isLegacyPairSchema) return null

  const id = normalizeId(value.id)
  const createdAt = normalizeTimestamp(isNewSchema ? value.createdAt : value.id)
  if (id == null || createdAt == null) return null

  const rawProducts = isLegacyPairSchema
    ? [value.productA, value.productB]
    : value.products
  const products = normalizeProducts(rawProducts)
  if (products == null) return null

  const result = normalizeResult(value.result, products)
  if (result == null) return null

  return {
    schemaVersion: HISTORY_SCHEMA_VERSION,
    id,
    createdAt,
    products,
    result,
  }
}

function normalizeItems(items: readonly unknown[]): HistoryItem[] {
  return items
    .map(normalizeHistoryItem)
    .filter((item): item is HistoryItem => item !== null)
    .sort((first, second) => second.createdAt - first.createdAt)
}

function normalizeAndLimit(items: readonly unknown[]): HistoryItem[] {
  return normalizeItems(items)
    .slice(0, HISTORY_LIMIT)
}

export function loadHistory(storage: HistoryStorage = localStorage): HistoryLoadResult {
  let serializedHistory: string | null

  try {
    serializedHistory = storage.getItem(HISTORY_STORAGE_KEY)
  } catch (cause) {
    return { ok: false, data: [], error: { operation: 'read', cause } }
  }

  if (serializedHistory == null) {
    return { ok: true, data: [], warnings: [], discardedItems: 0 }
  }

  let parsedHistory: unknown
  try {
    parsedHistory = JSON.parse(serializedHistory)
  } catch {
    return { ok: true, data: [], warnings: ['invalid-json'], discardedItems: 0 }
  }

  if (!Array.isArray(parsedHistory)) {
    return { ok: true, data: [], warnings: ['invalid-root'], discardedItems: 0 }
  }

  const normalizedHistory = normalizeItems(parsedHistory)
  const data = normalizedHistory.slice(0, HISTORY_LIMIT)
  const discardedItems = parsedHistory.length - normalizedHistory.length
  const warnings: HistoryLoadWarning[] = discardedItems > 0 ? ['invalid-items'] : []

  return { ok: true, data, warnings, discardedItems }
}

export function saveHistory(
  history: readonly HistoryItem[],
  storage: HistoryStorage = localStorage,
): HistoryWriteResult {
  const data = normalizeAndLimit(history)

  try {
    storage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(data))
    return { ok: true, data }
  } catch (cause) {
    return { ok: false, error: { operation: 'write', cause } }
  }
}

export function deleteHistoryItem(
  id: string,
  storage: HistoryStorage = localStorage,
): HistoryWriteResult {
  const loadedHistory = loadHistory(storage)
  if (!loadedHistory.ok) return loadedHistory

  return saveHistory(loadedHistory.data.filter((item) => item.id !== id), storage)
}

export function clearHistory(storage: HistoryStorage = localStorage): HistoryWriteResult {
  try {
    storage.removeItem(HISTORY_STORAGE_KEY)
    return { ok: true, data: [] }
  } catch (cause) {
    return { ok: false, error: { operation: 'clear', cause } }
  }
}
