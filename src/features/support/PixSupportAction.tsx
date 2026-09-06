import { Button, Input, Modal, Toast, type ButtonVariant } from '@apps-simples/ui'
import { useState } from 'react'
import { APP_INFO } from '../../config/appInfo'
import { copyPixKey } from './copyPix'

type PixSupportActionProps = {
  label: string
  variant?: ButtonVariant
}

export default function PixSupportAction({ label, variant = 'primary' }: PixSupportActionProps) {
  const [isManualPixOpen, setIsManualPixOpen] = useState(false)
  const [pixFeedback, setPixFeedback] = useState<'success' | 'error' | null>(null)

  async function handleCopyPix() {
    setPixFeedback(null)
    const result = await copyPixKey(APP_INFO.pix.key)

    if (result.status === 'copied') {
      setIsManualPixOpen(false)
      setPixFeedback('success')
      return
    }

    setIsManualPixOpen(true)
    setPixFeedback('error')
  }

  return (
    <>
      <Button type="button" variant={variant} onClick={() => void handleCopyPix()}>
        {label}
      </Button>

      <Modal
        open={isManualPixOpen}
        onClose={() => setIsManualPixOpen(false)}
        title="Copiar chave Pix manualmente"
        footer={(
          <Button type="button" variant="primary" onClick={() => setIsManualPixOpen(false)}>
            Fechar
          </Button>
        )}
      >
        <p>A cópia automática não funcionou. Selecione e copie a chave abaixo:</p>
        <div className="manual-pix__field">
          <Input
            id="manual-pix-key"
            label="Chave Pix"
            value={APP_INFO.pix.key}
            readOnly
            onFocus={(event) => event.currentTarget.select()}
          />
        </div>
      </Modal>

      <Toast
        open={pixFeedback != null}
        type={pixFeedback ?? 'info'}
        message={pixFeedback === 'success'
          ? 'Chave Pix copiada para a área de transferência.'
          : 'Não foi possível copiar automaticamente. Copie a chave manualmente.'}
        onClose={() => setPixFeedback(null)}
      />
    </>
  )
}
