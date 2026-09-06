import { describe, expect, it } from 'vitest'
import {
  calculateComparison,
  parseNumber,
} from './comparison'
import type { Product } from './types'

function product(price: Product['price'], quantity: Product['quantity'], unit: Product['unit']): Product {
  return { price, quantity, unit }
}

describe('calculateComparison', () => {
  it('compara 500 g por R$ 10 com 800 g por R$ 14', () => {
    const outcome = calculateComparison([product(10, 500, 'g'), product(14, 800, 'g')])

    expect(outcome).toEqual({
      result: {
        winner: 'B',
        winnerIndexes: [1],
        winnerLabels: ['B'],
        difference: '12.5',
        savings: 2,
        comparedCount: 2,
      },
      unitError: false,
    })
  })

  it('normaliza kg e g antes de comparar', () => {
    const outcome = calculateComparison([product(10, 1, 'kg'), product(9, 800, 'g')])

    expect(outcome.result).toMatchObject({ winner: 'A', difference: '11.1', savings: 1.25 })
  })

  it('normaliza L e ml antes de comparar', () => {
    const outcome = calculateComparison([product(8, 1, 'L'), product(6.75, 750, 'ml')])

    expect(outcome.result).toMatchObject({ winner: 'A', difference: '11.1', savings: 1 })
  })

  it('compara quantidades em unidades', () => {
    const outcome = calculateComparison([product(12, 6, 'un'), product(18, 10, 'un')])

    expect(outcome.result).toMatchObject({ winner: 'B', difference: '10.0', savings: 2 })
  })

  it('retorna empate exato', () => {
    const outcome = calculateComparison([product(10, 500, 'g'), product(20, 1, 'kg')])

    expect(outcome.result).toEqual({
      winner: 'DRAW',
      winnerIndexes: [],
      winnerLabels: ['A', 'B'],
      difference: '0.0',
      savings: 0,
      comparedCount: 2,
    })
  })

  it('retorna empate dentro da tolerância absoluta', () => {
    const outcome = calculateComparison([product(1, 1, 'un'), product(1.00000005, 1, 'un')])

    expect(outcome.result?.winner).toBe('DRAW')
  })

  it('sinaliza unidades incompatíveis', () => {
    const outcome = calculateComparison([product(10, 1, 'kg'), product(10, 1, 'L')])

    expect(outcome).toEqual({ result: null, unitError: true })
  })

  it('ignora produto com preço zero', () => {
    const outcome = calculateComparison([product(0, 1, 'kg'), product(10, 1, 'kg')])

    expect(outcome).toEqual({ result: null, unitError: false })
  })

  it('ignora produto com quantidade zero', () => {
    const outcome = calculateComparison([product(10, 0, 'kg'), product(10, 1, 'kg')])

    expect(outcome).toEqual({ result: null, unitError: false })
  })

  it('não compara quando há somente um produto válido', () => {
    const outcome = calculateComparison([product(10, 1, 'kg')])

    expect(outcome).toEqual({ result: null, unitError: false })
  })

  it('não considera a unidade de produtos inválidos', () => {
    const outcome = calculateComparison([
      product(0, 1, 'kg'),
      product(8, 1, 'L'),
      product(6.75, 750, 'ml'),
    ])

    expect(outcome).toEqual({
      result: {
        winner: 'B',
        winnerIndexes: [1],
        winnerLabels: ['B'],
        difference: '11.1',
        savings: 1,
        comparedCount: 2,
      },
      unitError: false,
    })
  })

  it('usa a melhor e a pior opções entre três produtos', () => {
    const outcome = calculateComparison([
      product(10, 500, 'g'),
      product(18, 1, 'kg'),
      product(38, 2, 'kg'),
    ])

    expect(outcome.result).toEqual({
      winner: 'B',
      winnerIndexes: [1],
      winnerLabels: ['B'],
      difference: '10.0',
      savings: 2,
      comparedCount: 3,
    })
  })

  it('preserva empate parcial entre as melhores opções', () => {
    const outcome = calculateComparison([
      product(10, 1, 'un'),
      product(20.0000001, 2, 'un'),
      product(12, 1, 'un'),
    ])

    expect(outcome.result).toMatchObject({
      winner: 'TIE',
      winnerIndexes: [0, 1],
      winnerLabels: ['A', 'B'],
      difference: '16.7',
      savings: 2,
    })
  })
})

describe('parseNumber', () => {
  it('interpreta vírgula decimal brasileira', () => {
    expect(parseNumber('10,5')).toBe(10.5)
  })

  it('remove pontos como separadores de milhar', () => {
    expect(parseNumber('1.000')).toBe(1000)
    expect(parseNumber('1.234,56')).toBe(1234.56)
  })

  it('preserva o formato monetário produzido pela interface legada', () => {
    expect(parseNumber('10,50')).toBe(10.5)
  })
})
