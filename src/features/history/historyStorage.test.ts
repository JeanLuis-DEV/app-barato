import { describe, expect, it } from 'vitest'
import {
  clearHistory,
  deleteHistoryItem,
  HISTORY_LIMIT,
  HISTORY_STORAGE_KEY,
  loadHistory,
  saveHistory,
} from './historyStorage'
import { HISTORY_SCHEMA_VERSION, type HistoryItem } from './types'

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>()

  get length() {
    return this.values.size
  }

  clear() {
    this.values.clear()
  }

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  key(index: number) {
    return [...this.values.keys()][index] ?? null
  }

  removeItem(key: string) {
    this.values.delete(key)
  }

  setItem(key: string, value: string) {
    this.values.set(key, value)
  }
}

function historyItem(id: string, createdAt: number): HistoryItem {
  return {
    schemaVersion: HISTORY_SCHEMA_VERSION,
    id,
    createdAt,
    products: [
      { label: 'A', name: 'Produto A', price: 10, quantity: 500, unit: 'g' },
      { label: 'B', name: 'Produto B', price: 14, quantity: 800, unit: 'g' },
    ],
    result: {
      winner: 'B',
      winnerLabels: ['B'],
      differencePercent: 12.5,
      savings: 2,
    },
  }
}

function legacyResult() {
  return {
    winner: 'B',
    winnerIndexes: [1],
    winnerLabels: ['B'],
    difference: '12.5',
    savings: 2,
    comparedCount: 2,
  }
}

describe('historyStorage', () => {
  it('carrega histórico vazio quando a chave não existe', () => {
    expect(loadHistory(new MemoryStorage())).toEqual({
      ok: true,
      data: [],
      warnings: [],
      discardedItems: 0,
    })
  })

  it('carrega o novo schema versionado', () => {
    const storage = new MemoryStorage()
    const item = historyItem('new-item', 1_700_000_000_000)
    storage.setItem(HISTORY_STORAGE_KEY, JSON.stringify([item]))

    expect(loadHistory(storage)).toMatchObject({ ok: true, data: [item] })
  })

  it('normaliza o schema legado com products', () => {
    const storage = new MemoryStorage()
    storage.setItem(HISTORY_STORAGE_KEY, JSON.stringify([{
      id: 1_700_000_000_000,
      date: '14/11/2023 19:13',
      products: [
        { label: 'A', name: 'Produto A', price: 10, quantity: '500', unit: 'g' },
        { label: 'B', name: 'Produto B', price: 14, quantity: '800', unit: 'g' },
      ],
      result: legacyResult(),
    }]))

    const loaded = loadHistory(storage)
    expect(loaded.ok && loaded.data[0]).toEqual(historyItem('1700000000000', 1_700_000_000_000))
  })

  it('normaliza o schema antigo com productA e productB', () => {
    const storage = new MemoryStorage()
    storage.setItem(HISTORY_STORAGE_KEY, JSON.stringify([{
      id: 1_700_000_000_000,
      productA: { name: 'Produto A', price: '10,00', quantity: '500', unit: 'g' },
      productB: { name: 'Produto B', price: '14,00', quantity: '800', unit: 'g' },
      result: legacyResult(),
    }]))

    const loaded = loadHistory(storage)
    expect(loaded.ok && loaded.data[0]).toEqual(historyItem('1700000000000', 1_700_000_000_000))
  })

  it('trata JSON inválido sem lançar erro', () => {
    const storage = new MemoryStorage()
    storage.setItem(HISTORY_STORAGE_KEY, '{invalid')

    expect(loadHistory(storage)).toEqual({
      ok: true,
      data: [],
      warnings: ['invalid-json'],
      discardedItems: 0,
    })
  })

  it('rejeita raiz que não seja array', () => {
    const storage = new MemoryStorage()
    storage.setItem(HISTORY_STORAGE_KEY, JSON.stringify({ items: [] }))

    expect(loadHistory(storage)).toMatchObject({ ok: true, data: [], warnings: ['invalid-root'] })
  })

  it('descarta item estruturalmente inválido sem perder os válidos', () => {
    const storage = new MemoryStorage()
    storage.setItem(HISTORY_STORAGE_KEY, JSON.stringify([
      { id: 123, products: [], result: null },
      historyItem('valid', 456),
    ]))

    expect(loadHistory(storage)).toMatchObject({
      ok: true,
      data: [historyItem('valid', 456)],
      warnings: ['invalid-items'],
      discardedItems: 1,
    })
  })

  it('descarta item com unidade inválida', () => {
    const storage = new MemoryStorage()
    const item = historyItem('invalid-unit', 123) as unknown as Record<string, unknown>
    const products = (item.products as Array<Record<string, unknown>>)
    products[0].unit = 'oz'
    storage.setItem(HISTORY_STORAGE_KEY, JSON.stringify([item]))

    expect(loadHistory(storage)).toMatchObject({
      ok: true,
      data: [],
      warnings: ['invalid-items'],
      discardedItems: 1,
    })
  })

  it('limita a persistência aos 50 registros mais recentes', () => {
    const storage = new MemoryStorage()
    const items = Array.from({ length: HISTORY_LIMIT + 5 }, (_, index) => historyItem(String(index), index + 1))

    const saved = saveHistory(items, storage)
    expect(saved.ok && saved.data).toHaveLength(HISTORY_LIMIT)
    expect(saved.ok && saved.data.at(0)?.id).toBe('54')
    expect(saved.ok && saved.data.at(-1)?.id).toBe('5')
  })

  it('ordena do registro mais recente para o mais antigo', () => {
    const storage = new MemoryStorage()
    storage.setItem(HISTORY_STORAGE_KEY, JSON.stringify([
      historyItem('old', 100),
      historyItem('new', 300),
      historyItem('middle', 200),
    ]))

    const loaded = loadHistory(storage)
    expect(loaded.ok && loaded.data.map(({ id }) => id)).toEqual(['new', 'middle', 'old'])
  })

  it('exclui um item e persiste o restante', () => {
    const storage = new MemoryStorage()
    saveHistory([historyItem('first', 100), historyItem('second', 200)], storage)

    expect(deleteHistoryItem('first', storage)).toMatchObject({ ok: true, data: [{ id: 'second' }] })
    expect(loadHistory(storage)).toMatchObject({ ok: true, data: [{ id: 'second' }] })
  })

  it('limpa o histórico removendo a chave', () => {
    const storage = new MemoryStorage()
    saveHistory([historyItem('item', 100)], storage)

    expect(clearHistory(storage)).toEqual({ ok: true, data: [] })
    expect(storage.getItem(HISTORY_STORAGE_KEY)).toBeNull()
  })

  it('representa falha de leitura do localStorage', () => {
    const error = new Error('read unavailable')
    const storage = new MemoryStorage()
    storage.getItem = () => { throw error }

    expect(loadHistory(storage)).toEqual({
      ok: false,
      data: [],
      error: { operation: 'read', cause: error },
    })
  })

  it('não finge sucesso quando a gravação falha', () => {
    const error = new Error('quota exceeded')
    const storage = new MemoryStorage()
    storage.setItem = () => { throw error }

    expect(saveHistory([historyItem('item', 100)], storage)).toEqual({
      ok: false,
      error: { operation: 'write', cause: error },
    })
  })

  it('não sobrescreve dados legados somente por carregá-los', () => {
    const storage = new MemoryStorage()
    const legacy = JSON.stringify([{
      id: 1_700_000_000_000,
      products: [
        { label: 'A', price: 10, quantity: 500, unit: 'g' },
        { label: 'B', price: 14, quantity: 800, unit: 'g' },
      ],
      result: legacyResult(),
    }])
    storage.setItem(HISTORY_STORAGE_KEY, legacy)

    expect(loadHistory(storage).ok).toBe(true)
    expect(storage.getItem(HISTORY_STORAGE_KEY)).toBe(legacy)
  })
})
