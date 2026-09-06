import type { Unit } from '../comparison/types'

export const HISTORY_SCHEMA_VERSION = 1 as const

export type HistoryProduct = {
  label: string
  name?: string
  price: number
  quantity: number
  unit: Unit
}

export type HistoryResult = {
  winner: string | 'DRAW' | 'TIE'
  winnerLabels: string[]
  differencePercent: number
  savings: number
}

export type HistoryItem = {
  schemaVersion: typeof HISTORY_SCHEMA_VERSION
  id: string
  createdAt: number
  products: HistoryProduct[]
  result: HistoryResult
}

export type HistoryLoadWarning =
  | 'invalid-json'
  | 'invalid-root'
  | 'invalid-items'

export type HistoryStorageError = {
  operation: 'read' | 'write' | 'clear'
  cause: unknown
}

export type HistoryLoadResult =
  | {
      ok: true
      data: HistoryItem[]
      warnings: HistoryLoadWarning[]
      discardedItems: number
    }
  | {
      ok: false
      data: []
      error: HistoryStorageError
    }

export type HistoryWriteResult =
  | { ok: true; data: HistoryItem[] }
  | { ok: false; error: HistoryStorageError }

