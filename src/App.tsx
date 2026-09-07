import { Alert, Button, Modal, Toast, type ToastType } from '@apps-simples/ui'
import { useState } from 'react'
import AppLayout from './layouts/AppLayout'
import { calculateComparison, parseNumber } from './features/comparison/comparison'
import ProductForm from './features/comparison/ProductForm'
import type { Product } from './features/comparison/types'
import HistoryView from './features/history/HistoryView'
import AboutView from './features/about/AboutView'
import WelcomeView from './features/onboarding/WelcomeView'
import { markWelcomeSeen, shouldShowWelcome } from './features/onboarding/onboardingStorage'
import {
  clearHistory,
  deleteHistoryItem,
  loadHistory,
  saveHistory,
} from './features/history/historyStorage'
import { HISTORY_SCHEMA_VERSION, type HistoryItem, type HistoryProduct } from './features/history/types'
import {
  APP_SHARE_TEXT,
  buildResultShareText,
  shareText,
} from './features/sharing/share'
import './App.css'

const INITIAL_PRODUCTS: Product[] = [
  { label: 'A', name: '', price: '', quantity: '', unit: 'un' },
  { label: 'B', name: '', price: '', quantity: '', unit: 'un' },
]

const THIRD_PRODUCT: Product = {
  label: 'C',
  name: '',
  price: '',
  quantity: '',
  unit: 'un',
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

type AppView = 'comparison' | 'history' | 'about'

type PersistenceFeedback = {
  type: 'error' | 'warning'
  title: string
  message: string
}

type ShareFeedback = {
  type: ToastType
  message: string
}

function getInitialHistory() {
  const loadedHistory = loadHistory()

  if (!loadedHistory.ok) {
    return {
      history: [],
      feedback: {
        type: 'error',
        title: 'Não foi possível carregar o histórico',
        message: 'O armazenamento local está indisponível. Tente novamente mais tarde.',
      } satisfies PersistenceFeedback,
    }
  }

  return {
    history: loadedHistory.data,
    feedback: loadedHistory.warnings.length > 0
      ? {
          type: 'warning',
          title: 'Parte do histórico não pôde ser carregada',
          message: 'Os registros inválidos foram ignorados com segurança.',
        } satisfies PersistenceFeedback
      : null,
  }
}

export default function App() {
  const [isWelcomeVisible, setIsWelcomeVisible] = useState(shouldShowWelcome)
  const [initialHistory] = useState(getInitialHistory)
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS)
  const [history, setHistory] = useState<HistoryItem[]>(initialHistory.history)
  const [currentView, setCurrentView] = useState<AppView>('comparison')
  const [isCurrentComparisonSaved, setIsCurrentComparisonSaved] = useState(false)
  const [persistenceFeedback, setPersistenceFeedback] = useState<PersistenceFeedback | null>(
    initialHistory.feedback,
  )
  const [isClearConfirmationOpen, setIsClearConfirmationOpen] = useState(false)
  const [shareFeedback, setShareFeedback] = useState<ShareFeedback | null>(null)
  const [manualShareText, setManualShareText] = useState<string | null>(null)
  const { result, unitError } = calculateComparison(products)

  function continueToApp() {
    markWelcomeSeen()
    setIsWelcomeVisible(false)
  }

  async function handleShare(text: string, successMessage: string) {
    setShareFeedback(null)
    const shareResult = await shareText(text)

    if (shareResult.status === 'cancelled') return

    if (shareResult.status === 'manual') {
      setManualShareText(text)
      setShareFeedback({
        type: 'error',
        message: 'Não foi possível compartilhar automaticamente. Copie o texto manualmente.',
      })
      return
    }

    setManualShareText(null)
    setShareFeedback({
      type: 'success',
      message: shareResult.status === 'copied' ? 'Texto copiado para a área de transferência.' : successMessage,
    })
  }

  function shareCurrentResult() {
    if (result == null) return
    return handleShare(buildResultShareText(products, result), 'Resultado compartilhado.')
  }

  function updateProduct(index: number, updatedProduct: Product) {
    setProducts((currentProducts) => currentProducts.map((product, productIndex) => (
      productIndex === index ? updatedProduct : product
    )))
    setIsCurrentComparisonSaved(false)
  }

  function addThirdProduct() {
    setProducts((currentProducts) => (
      currentProducts.length === INITIAL_PRODUCTS.length
        ? [...currentProducts, THIRD_PRODUCT]
        : currentProducts
    ))
    setIsCurrentComparisonSaved(false)
  }

  function removeThirdProduct() {
    setProducts((currentProducts) => currentProducts.slice(0, INITIAL_PRODUCTS.length))
    setIsCurrentComparisonSaved(false)
  }

  function clearCurrentComparison() {
    setProducts(INITIAL_PRODUCTS)
    setIsCurrentComparisonSaved(false)
  }

  function saveCurrentComparison() {
    if (result == null || isCurrentComparisonSaved) return

    const historyProducts = products
      .map((product, index): HistoryProduct | null => {
        const price = parseNumber(product.price)
        const quantity = parseNumber(product.quantity)
        if (price <= 0 || quantity <= 0) return null

        return {
          label: product.label || String.fromCharCode(65 + index),
          ...(product.name?.trim() ? { name: product.name.trim() } : {}),
          price,
          quantity,
          unit: product.unit,
        }
      })
      .filter((product): product is HistoryProduct => product !== null)

    const createdAt = Date.now()
    const newItem: HistoryItem = {
      schemaVersion: HISTORY_SCHEMA_VERSION,
      id: crypto.randomUUID(),
      createdAt,
      products: historyProducts,
      result: {
        winner: result.winner,
        winnerLabels: result.winnerLabels,
        differencePercent: Number(result.difference),
        savings: result.savings,
      },
    }

    const savedHistory = saveHistory([newItem, ...history])
    if (!savedHistory.ok) {
      setPersistenceFeedback({
        type: 'error',
        title: 'Não foi possível salvar a comparação',
        message: 'O histórico não foi alterado. Verifique o armazenamento e tente novamente.',
      })
      return
    }

    setHistory(savedHistory.data)
    setIsCurrentComparisonSaved(true)
    setPersistenceFeedback(null)
  }

  function removeHistoryItem(id: string) {
    const updatedHistory = deleteHistoryItem(id)
    if (!updatedHistory.ok) {
      setPersistenceFeedback({
        type: 'error',
        title: 'Não foi possível excluir o registro',
        message: 'O histórico não foi alterado. Tente novamente.',
      })
      return
    }

    setHistory(updatedHistory.data)
    setPersistenceFeedback(null)
  }

  function confirmClearHistory() {
    const clearedHistory = clearHistory()
    if (!clearedHistory.ok) {
      setIsClearConfirmationOpen(false)
      setPersistenceFeedback({
        type: 'error',
        title: 'Não foi possível limpar o histórico',
        message: 'Nenhum registro foi removido. Tente novamente.',
      })
      return
    }

    setHistory(clearedHistory.data)
    setIsClearConfirmationOpen(false)
    setPersistenceFeedback(null)
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
        <Alert type="info" title="Preencha pelo menos dois produtos">
          Informe preço e quantidade maiores que zero em pelo menos dois produtos.
        </Alert>
      )
    }

    if (result.winner === 'DRAW') {
      return (
        <Alert type="info" title="Empate">
          Os produtos têm o mesmo custo por unidade.
        </Alert>
      )
    }

    if (result.winner === 'TIE') {
      return (
        <Alert type="success" title={`Produtos ${result.winnerLabels.join(' e ')} são mais vantajosos`}>
          Eles têm o mesmo custo por unidade e são {result.difference}% mais baratos que a pior opção.
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

  if (isWelcomeVisible) {
    return (
      <AppLayout appName="App Barato" footer="Apps Simples — Design System oficial">
        <WelcomeView onContinue={continueToApp} />
      </AppLayout>
    )
  }

  return (
    <AppLayout
      appName="App Barato"
      actions={(
        <>
          <Button
            type="button"
            variant="ghost"
            size="compact"
            onClick={() => setCurrentView((view) => view === 'about' ? 'comparison' : 'about')}
          >
            {currentView === 'about' ? 'Comparar' : 'Sobre'}
          </Button>
          {currentView !== 'about' && (
            <Button
              type="button"
              variant="ghost"
              size="compact"
              onClick={() => setCurrentView((view) => view === 'history' ? 'comparison' : 'history')}
            >
              {currentView === 'history' ? 'Comparar' : `Histórico (${history.length})`}
            </Button>
          )}
        </>
      )}
      footer="Apps Simples — Design System oficial"
    >
      {persistenceFeedback && (
        <Alert
          type={persistenceFeedback.type}
          title={persistenceFeedback.title}
          dismissible
          onDismiss={() => setPersistenceFeedback(null)}
          className="persistence-feedback"
        >
          {persistenceFeedback.message}
        </Alert>
      )}

      {currentView === 'comparison' ? (
        <div className="comparison-page">
          <header className="comparison-page__intro">
            <h1>Qual está mais barato?</h1>
            <p>Compare preço e quantidade de até três produtos.</p>
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

          <div className="comparison-products__actions">
            {products.length === INITIAL_PRODUCTS.length ? (
              <Button type="button" variant="secondary" onClick={addThirdProduct}>
                Adicionar produto
              </Button>
            ) : (
              <Button type="button" variant="ghost" onClick={removeThirdProduct}>
                Remover Produto C
              </Button>
            )}

            <Button type="button" variant="ghost" onClick={clearCurrentComparison}>
              Limpar
            </Button>

            <Button
              type="button"
              variant="primary"
              onClick={saveCurrentComparison}
              disabled={result == null || isCurrentComparisonSaved}
            >
              {isCurrentComparisonSaved ? 'Comparação salva' : 'Salvar comparação'}
            </Button>
          </div>

          <section className="comparison-result" aria-labelledby="comparison-result-title" aria-live="polite">
            <h2 id="comparison-result-title">Resultado</h2>
            {renderResult()}
            {result != null && (
              <Button type="button" variant="secondary" onClick={() => void shareCurrentResult()}>
                Compartilhar resultado
              </Button>
            )}
          </section>
        </div>
      ) : currentView === 'history' ? (
        <HistoryView
          history={history}
          onBack={() => setCurrentView('comparison')}
          onDelete={removeHistoryItem}
          onRequestClear={() => setIsClearConfirmationOpen(true)}
        />
      ) : (
        <AboutView onShareApp={() => void handleShare(APP_SHARE_TEXT, 'App compartilhado.')} />
      )}

      <Modal
        open={isClearConfirmationOpen}
        onClose={() => setIsClearConfirmationOpen(false)}
        title="Limpar histórico?"
        footer={(
          <>
            <Button type="button" variant="ghost" onClick={() => setIsClearConfirmationOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" variant="danger" onClick={confirmClearHistory}>
              Limpar tudo
            </Button>
          </>
        )}
      >
        Esta ação removerá todas as comparações salvas e não poderá ser desfeita.
      </Modal>

      <Modal
        open={manualShareText != null}
        onClose={() => setManualShareText(null)}
        title="Copiar texto manualmente"
        footer={(
          <Button type="button" variant="primary" onClick={() => setManualShareText(null)}>
            Fechar
          </Button>
        )}
      >
        <p>Selecione e copie o texto abaixo:</p>
        <label className="manual-share__label" htmlFor="manual-share-text">Texto para compartilhar</label>
        <textarea
          id="manual-share-text"
          className="manual-share__text"
          value={manualShareText ?? ''}
          readOnly
          rows={12}
          onFocus={(event) => event.currentTarget.select()}
        />
      </Modal>

      <Toast
        open={shareFeedback != null}
        type={shareFeedback?.type ?? 'info'}
        message={shareFeedback?.message ?? ''}
        onClose={() => setShareFeedback(null)}
      />
    </AppLayout>
  )
}
