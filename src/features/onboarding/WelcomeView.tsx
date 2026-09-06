import { Button, Card } from '@apps-simples/ui'
import PixSupportAction from '../support/PixSupportAction'

type WelcomeViewProps = {
  onContinue: () => void
}

export default function WelcomeView({ onContinue }: WelcomeViewProps) {
  return (
    <section className="welcome-page" aria-labelledby="welcome-title">
      <Card className="welcome-card" variant="highlight">
        <div className="welcome-card__content">
          <h1 id="welcome-title">Boas-vindas ao App Barato</h1>
          <p>
            O App Barato é gratuito e sem anúncios. Se ele for útil para você, considere apoiar o
            desenvolvimento com uma contribuição voluntária via Pix. Esse apoio ajuda a manter o
            app disponível e em evolução.
          </p>
          <p className="welcome-card__optional">O apoio é opcional. Você pode continuar sem contribuir.</p>
        </div>

        <div className="welcome-card__actions">
          <PixSupportAction label="Apoiar com Pix" variant="secondary" />
          <Button type="button" variant="primary" onClick={onContinue}>
            Continuar para o app
          </Button>
        </div>
      </Card>
    </section>
  )
}
