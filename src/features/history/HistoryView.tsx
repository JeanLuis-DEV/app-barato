import { Button, Card, EmptyState } from '@apps-simples/ui'
import type { HistoryItem, HistoryProduct, HistoryResult } from './types'

type HistoryViewProps = {
  history: HistoryItem[]
  onDelete: (id: string) => void
  onRequestClear: () => void
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const quantityFormatter = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 3,
})

const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
})

function getProductName(product: HistoryProduct): string {
  return product.name || `Opção ${product.label}`
}

function describeResult(result: HistoryResult, products: HistoryProduct[]): string {
  if (result.winner === 'DRAW') return 'Empate entre todas as opções.'

  if (result.winner === 'TIE') {
    return `Opções ${result.winnerLabels.join(' e ')} empataram como mais vantajosas.`
  }

  const winner = products.find(({ label }) => label === result.winner)
  return `${winner ? getProductName(winner) : `Opção ${result.winner}`} foi a opção mais vantajosa.`
}

export default function HistoryView({
  history,
  onDelete,
  onRequestClear,
}: HistoryViewProps) {
  return (
    <section className="history-view" aria-labelledby="history-title">
      <header className="history-view__header">
        <div>
          <h1 id="history-title">Histórico</h1>
          <p>{history.length} {history.length === 1 ? 'registro salvo' : 'registros salvos'}</p>
        </div>

        {history.length > 0 && (
          <Button type="button" variant="danger" onClick={onRequestClear}>
            Limpar histórico
          </Button>
        )}
      </header>

      {history.length === 0 ? (
        <Card>
          <EmptyState
            title="Nenhuma comparação salva"
            description="Salve uma comparação válida para encontrá-la aqui."
          />
        </Card>
      ) : (
        <div className="history-list">
          {history.map((item) => (
            <Card className="history-item" key={item.id}>
              <div className="history-item__header">
                <time dateTime={new Date(item.createdAt).toISOString()}>
                  {dateTimeFormatter.format(item.createdAt)}
                </time>
                <Button
                  type="button"
                  variant="ghost"
                  size="compact"
                  onClick={() => onDelete(item.id)}
                  aria-label={`Excluir comparação de ${dateTimeFormatter.format(item.createdAt)}`}
                >
                  Excluir
                </Button>
              </div>

              <ul className="history-item__products" aria-label="Opções comparadas">
                {item.products.map((product) => (
                  <li key={product.label}>
                    <strong>{getProductName(product)}</strong>
                    <span>
                      {quantityFormatter.format(product.quantity)} {product.unit} por{' '}
                      {currencyFormatter.format(product.price)}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="history-item__result">
                <strong>{describeResult(item.result, item.products)}</strong>
                {item.result.winner !== 'DRAW' && (
                  <span>
                    {quantityFormatter.format(item.result.differencePercent)}% mais barato · Economia estimada de{' '}
                    {currencyFormatter.format(item.result.savings)}
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  )
}
