import { Button, Card, Input, Modal, Toast } from '@apps-simples/ui'
import { useState } from 'react'
import { APP_INFO } from '../../config/appInfo'
import { copyPixKey } from '../support/copyPix'

type AboutViewProps = {
  onShareApp: () => void
}

export default function AboutView({ onShareApp }: AboutViewProps) {
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
    <div className="about-page">
      <header className="about-page__intro">
        <h1>Sobre</h1>
        <p>Informações, contato e apoio ao projeto.</p>
      </header>

      <Card className="about-card">
        <div className="about-card__heading">
          <h2>{APP_INFO.name}</h2>
          <p>{APP_INFO.description}</p>
        </div>

        <dl className="about-details">
          <div>
            <dt>Versão</dt>
            <dd>{APP_INFO.version}</dd>
          </div>
          <div>
            <dt>Site</dt>
            <dd>
              <a href={APP_INFO.siteUrl} target="_blank" rel="noopener noreferrer">
                appbarato.com.br
              </a>
            </dd>
          </div>
        </dl>

        <Button type="button" variant="secondary" onClick={onShareApp}>
          Compartilhar App
        </Button>
      </Card>

      <Card className="about-card">
        <div className="about-card__heading">
          <h2>Contato</h2>
          <p>Fale sobre dúvidas, sugestões ou problemas.</p>
        </div>

        <div className="about-contact">
          <a href={APP_INFO.contact.emailUrl}>E-mail: {APP_INFO.contact.email}</a>
          <a href={APP_INFO.contact.whatsappUrl} target="_blank" rel="noopener noreferrer">
            WhatsApp: {APP_INFO.contact.whatsapp}
          </a>
        </div>
      </Card>

      <Card className="about-card" variant="highlight">
        <div className="about-card__heading">
          <h2>Apoiar o projeto</h2>
          <p>Contribuição via Pix. O valor é livre. Obrigado por ajudar a manter o App Barato em evolução.</p>
        </div>

        <dl className="about-details">
          <div>
            <dt>Tipo</dt>
            <dd>{APP_INFO.pix.type}</dd>
          </div>
          <div>
            <dt>Chave Pix</dt>
            <dd className="about-details__value">{APP_INFO.pix.key}</dd>
          </div>
          <div>
            <dt>Titular</dt>
            <dd>{APP_INFO.pix.holder}</dd>
          </div>
          <div>
            <dt>Banco</dt>
            <dd>{APP_INFO.pix.bank}</dd>
          </div>
        </dl>

        <Button type="button" variant="primary" onClick={() => void handleCopyPix()}>
          Copiar chave Pix
        </Button>
      </Card>

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
    </div>
  )
}
