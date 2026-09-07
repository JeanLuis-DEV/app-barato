import { version } from '../../package.json'

export const APP_INFO = {
  name: 'App Barato',
  description: 'Compare preços e quantidades de até três produtos e descubra qual oferece o melhor custo-benefício.',
  version,
  siteUrl: 'https://appbarato.com.br/',
  privacyUrl: 'https://jeanluis-dev.github.io/Central-de-Privacidade/apps/app-barato.html',
  contact: {
    email: 'jeanluis.dev@gmail.com',
    emailUrl: 'mailto:jeanluis.dev@gmail.com',
  },
  pix: {
    type: 'Chave aleatória',
    key: 'd2654dd9-8da5-4e8a-a256-c5f3e188aa8b',
    holder: 'Jean Luis de Souza Machado',
    bank: 'Santander',
  },
} as const
