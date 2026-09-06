import { Card, Input, Select } from '@apps-simples/ui'
import type { Product, Unit } from './types'

type ProductFormProps = {
  label: string
  product: Product
  onChange: (product: Product) => void
}

function formatPriceInput(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (!digits) return ''

  return (Number.parseInt(digits, 10) / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatQuantityInput(value: string): string {
  const sanitizedValue = value.replace(/[^0-9,]/g, '')
  const parts = sanitizedValue.split(',')
  return parts.length > 1 ? `${parts[0]},${parts.slice(1).join('')}` : sanitizedValue
}

export default function ProductForm({ label, product, onChange }: ProductFormProps) {
  function updateProduct(field: keyof Product, value: string) {
    onChange({ ...product, [field]: value })
  }

  return (
    <Card className="product-form">
      <h2 className="product-form__title">Produto {label}</h2>

      <div className="product-form__fields">
        <Input
          label="Nome do produto (opcional)"
          name={`product-${label}-name`}
          value={product.name ?? ''}
          onChange={(event) => updateProduct('name', event.target.value)}
          placeholder={`Produto ${label}`}
          autoComplete="off"
        />

        <Input
          label="Preço"
          name={`product-${label}-price`}
          value={product.price}
          onChange={(event) => updateProduct('price', formatPriceInput(event.target.value))}
          placeholder="0,00"
          prefix="R$"
          inputMode="numeric"
          autoComplete="off"
        />

        <div className="product-form__measurements">
          <Input
            label="Quantidade"
            name={`product-${label}-quantity`}
            value={product.quantity}
            onChange={(event) => updateProduct('quantity', formatQuantityInput(event.target.value))}
            placeholder="Ex.: 500"
            inputMode="decimal"
            autoComplete="off"
          />

          <Select
            label="Unidade"
            name={`product-${label}-unit`}
            value={product.unit}
            onChange={(event) => updateProduct('unit', event.target.value as Unit)}
          >
            <option value="un">un</option>
            <option value="kg">kg</option>
            <option value="g">g</option>
            <option value="L">L</option>
            <option value="ml">ml</option>
          </Select>
        </div>
      </div>
    </Card>
  )
}
