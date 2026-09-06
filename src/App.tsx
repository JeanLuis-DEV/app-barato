import { Alert } from '@apps-simples/ui'
import { useState } from 'react'
import AppLayout from './layouts/AppLayout'
import { calculateComparison } from './features/comparison/comparison'
import ProductForm from './features/comparison/ProductForm'
import type { Product } from './features/comparison/types'
import './App.css'

const INITIAL_PRODUCTS: Product[] = [
  { label: 'A', name: '', price: '', quantity: '', unit: 'un' },
  { label: 'B', name: '', price: '', quantity: '', unit: 'un' },
]

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

export default function App() {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS)
  const { result, unitError } = calculateComparison(products)

  function updateProduct(index: number, updatedProduct: Product) {
    setProducts((currentProducts) => currentProducts.map((product, productIndex) => (
      productIndex === index ? updatedProduct : product
    )))
  }

  function renderResult() {
    if (unitError) {
      return (
        <Alert type="warning" title="Unidades incompatíveis">
          Compare unidades, peso com peso (kg/g) ou volume com volume (L/ml).
        </Alert>
      )
    }

    if (result == null) {
      return (
        <Alert type="info" title="Preencha os dois produtos">
          Informe preço e quantidade maiores que zero para ver a comparação.
        </Alert>
      )
    }

    if (result.winner === 'DRAW') {
      return (
        <Alert type="info" title="Empate">
          Os dois produtos têm o mesmo custo por unidade.
        </Alert>
      )
    }

    const winnerIndex = result.winnerIndexes[0]
    const winner = products[winnerIndex]
    const winnerName = winner?.name?.trim() || `Produto ${result.winner}`

    return (
      <Alert type="success" title={`${winnerName} é mais vantajoso`}>
        {result.difference}% mais barato, com economia estimada de{' '}
        {currencyFormatter.format(result.savings)} na quantidade informada.
      </Alert>
    )
  }

  return (
    <AppLayout appName="App Barato" footer="Apps Simples — Design System oficial">
      <div className="comparison-page">
        <header className="comparison-page__intro">
          <h1>Qual está mais barato?</h1>
          <p>Compare preço e quantidade de dois produtos.</p>
        </header>

        <section className="comparison-products" aria-label="Produtos para comparação">
          {products.map((product, index) => (
            <ProductForm
              key={product.label}
              label={product.label ?? String(index + 1)}
              product={product}
              onChange={(updatedProduct) => updateProduct(index, updatedProduct)}
            />
          ))}
        </section>

        <section className="comparison-result" aria-labelledby="comparison-result-title" aria-live="polite">
          <h2 id="comparison-result-title">Resultado</h2>
          {renderResult()}
        </section>
      </div>
    </AppLayout>
  )
}
