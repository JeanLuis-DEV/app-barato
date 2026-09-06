import { describe, expect, it, vi } from 'vitest'
import type { ComparisonResult, Product } from '../comparison/types'
import { APP_SHARE_TEXT, APP_URL, buildResultShareText, shareText } from './share'

const uniqueWinner: ComparisonResult = {
  winner: 'B',
  winnerIndexes: [1],
  winnerLabels: ['B'],
  difference: '12.5',
  savings: 2,
  comparedCount: 2,
}

function product(label: string, price: number, quantity: number, unit: Product['unit'], name = ''): Product {
  return { label, name, price, quantity, unit }
}

describe('buildResultShareText', () => {
  it('inclui os dois produtos, vencedor único e domínio oficial', () => {
    const text = buildResultShareText([
      product('A', 10, 500, 'g', 'Café'),
      product('B', 14, 800, 'g'),
    ], uniqueWinner)

    expect(text).toContain('- Café (Opção A): 500 g por R$ 10,00')
    expect(text).toContain('- Opção B: 800 g por R$ 14,00')
    expect(text).toContain('Vencedor: Opção B.')
    expect(text).toContain(APP_URL)
  })

  it('inclui três produtos comparados', () => {
    const text = buildResultShareText([
      product('A', 10, 1, 'kg'),
      product('B', 18, 2, 'kg'),
      product('C', 12, 1, 'kg'),
    ], { ...uniqueWinner, difference: '25.0', savings: 2, comparedCount: 3 })

    expect(text.match(/^- Opção [ABC]:/gm)).toHaveLength(3)
  })

  it('descreve empate total', () => {
    const text = buildResultShareText([
      product('A', 10, 1, 'un'),
      product('B', 20, 2, 'un'),
    ], {
      winner: 'DRAW',
      winnerIndexes: [],
      winnerLabels: ['A', 'B'],
      difference: '0.0',
      savings: 0,
      comparedCount: 2,
    })

    expect(text).toContain('Resultado: empate total entre Opção A e Opção B.')
    expect(text).toContain('Percentual: 0,0%.')
  })

  it('descreve múltiplos vencedores', () => {
    const text = buildResultShareText([
      product('A', 10, 1, 'un', 'Primeiro'),
      product('B', 20, 2, 'un'),
      product('C', 12, 1, 'un'),
    ], {
      winner: 'TIE',
      winnerIndexes: [0, 1],
      winnerLabels: ['A', 'B'],
      difference: '16.7',
      savings: 2,
      comparedCount: 3,
    })

    expect(text).toContain('Resultado: múltiplos vencedores — Primeiro (Opção A) e Opção B.')
    expect(text).toContain('Percentual: 16,7% mais barato que a pior opção.')
  })

  it('mantém moeda no formato pt-BR', () => {
    const text = buildResultShareText([
      product('A', 1234.56, 1, 'un'),
      product('B', 1500, 1, 'un'),
    ], { ...uniqueWinner, winner: 'A', winnerIndexes: [0], winnerLabels: ['A'], savings: 265.44 })

    expect(text).toContain('R$ 1.234,56')
    expect(text).toContain('Economia: R$ 265,44')
  })

  it('mantém o texto oficial de compartilhamento do aplicativo', () => {
    expect(APP_SHARE_TEXT).toBe(`App Barato\nCompare preços e descubra qual produto vale mais a pena.\n${APP_URL}`)
  })
})

describe('shareText', () => {
  it('usa navigator.share quando disponível', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    const writeText = vi.fn().mockResolvedValue(undefined)

    await expect(shareText('texto', 'Título', { share, writeText })).resolves.toEqual({ status: 'shared' })
    expect(share).toHaveBeenCalledWith({ title: 'Título', text: 'texto' })
    expect(writeText).not.toHaveBeenCalled()
  })

  it('usa clipboard quando navigator.share não existe', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)

    await expect(shareText('texto', 'Título', { writeText })).resolves.toEqual({ status: 'copied' })
    expect(writeText).toHaveBeenCalledWith('texto')
  })

  it('tenta clipboard após erro real do compartilhamento', async () => {
    const share = vi.fn().mockRejectedValue(new Error('share unavailable'))
    const writeText = vi.fn().mockResolvedValue(undefined)

    await expect(shareText('texto', 'Título', { share, writeText })).resolves.toEqual({ status: 'copied' })
    expect(writeText).toHaveBeenCalledWith('texto')
  })

  it('trata cancelamento sem tentar fallback ou retornar erro', async () => {
    const share = vi.fn().mockRejectedValue(new DOMException('cancelled', 'AbortError'))
    const writeText = vi.fn().mockResolvedValue(undefined)

    await expect(shareText('texto', 'Título', { share, writeText })).resolves.toEqual({ status: 'cancelled' })
    expect(writeText).not.toHaveBeenCalled()
  })

  it('solicita fallback manual quando nenhuma API existe', async () => {
    await expect(shareText('texto', 'Título', {})).resolves.toEqual({ status: 'manual' })
  })

  it('solicita fallback manual quando share e clipboard falham', async () => {
    const clipboardError = new Error('clipboard unavailable')
    const result = await shareText('texto', 'Título', {
      share: vi.fn().mockRejectedValue(new Error('share unavailable')),
      writeText: vi.fn().mockRejectedValue(clipboardError),
    })

    expect(result).toEqual({ status: 'manual', error: clipboardError })
  })
})
