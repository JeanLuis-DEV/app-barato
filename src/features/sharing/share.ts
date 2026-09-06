import { parseNumber } from '../comparison/comparison'
import type { ComparisonResult, Product } from '../comparison/types'
import { APP_INFO } from '../../config/appInfo'

export const APP_URL = APP_INFO.siteUrl

export const APP_SHARE_TEXT = `App Barato
Compare preços e descubra qual produto vale mais a pena.
${APP_URL}`

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const percentageFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

type ShareEnvironment = {
  share?: (data: ShareData) => Promise<void>
  writeText?: (text: string) => Promise<void>
}

export type ShareAttemptResult =
  | { status: 'shared' }
  | { status: 'copied' }
  | { status: 'cancelled' }
  | { status: 'manual'; error?: unknown }

function getOptionLabel(product: Product, index: number) {
  return product.label || String.fromCharCode(65 + index)
}

function getProductName(product: Product, index: number) {
  const option = `Opção ${getOptionLabel(product, index)}`
  const name = product.name?.trim()
  return name ? `${name} (${option})` : option
}

function formatQuantity(quantity: Product['quantity']) {
  return typeof quantity === 'number' ? quantity.toLocaleString('pt-BR') : quantity.trim()
}

function formatList(items: string[]) {
  if (items.length < 2) return items[0] ?? ''
  return `${items.slice(0, -1).join(', ')} e ${items.at(-1)}`
}

export function buildResultShareText(products: Product[], result: ComparisonResult) {
  const comparedProducts = products
    .map((product, index) => ({ product, index }))
    .filter(({ product }) => parseNumber(product.price) > 0 && parseNumber(product.quantity) > 0)

  const productLines = comparedProducts.map(({ product, index }) => (
    `- ${getProductName(product, index)}: ${formatQuantity(product.quantity)} ${product.unit} por ${currencyFormatter.format(parseNumber(product.price))}`
  ))

  const winnerNames = comparedProducts
    .filter(({ product, index }) => result.winnerLabels.includes(getOptionLabel(product, index)))
    .map(({ product, index }) => getProductName(product, index))

  let outcome: string
  if (result.winner === 'DRAW') {
    outcome = `Resultado: empate total entre ${formatList(winnerNames)}.`
  } else if (result.winner === 'TIE') {
    outcome = `Resultado: múltiplos vencedores — ${formatList(winnerNames)}.`
  } else {
    outcome = `Vencedor: ${winnerNames[0] ?? `Opção ${result.winner}`}.`
  }

  const percentage = percentageFormatter.format(Number(result.difference))
  const percentageLine = result.winner === 'DRAW'
    ? `Percentual: ${percentage}%.`
    : `Percentual: ${percentage}% mais barato que a pior opção.`

  return [
    'App Barato — Comparação de preços',
    '',
    'Produtos comparados:',
    ...productLines,
    '',
    outcome,
    percentageLine,
    `Economia: ${currencyFormatter.format(result.savings)} na quantidade informada.`,
    '',
    `Compare no App Barato: ${APP_URL}`,
  ].join('\n')
}

function isShareCancellation(error: unknown) {
  return typeof error === 'object'
    && error !== null
    && 'name' in error
    && error.name === 'AbortError'
}

function getBrowserEnvironment(): ShareEnvironment {
  if (typeof navigator === 'undefined') return {}

  return {
    share: typeof navigator.share === 'function' ? navigator.share.bind(navigator) : undefined,
    writeText: typeof navigator.clipboard?.writeText === 'function'
      ? navigator.clipboard.writeText.bind(navigator.clipboard)
      : undefined,
  }
}

export async function shareText(
  text: string,
  title = 'App Barato',
  environment = getBrowserEnvironment(),
): Promise<ShareAttemptResult> {
  if (environment.share) {
    try {
      await environment.share({ title, text })
      return { status: 'shared' }
    } catch (error) {
      if (isShareCancellation(error)) return { status: 'cancelled' }
    }
  }

  if (environment.writeText) {
    try {
      await environment.writeText(text)
      return { status: 'copied' }
    } catch (error) {
      return { status: 'manual', error }
    }
  }

  return { status: 'manual' }
}
