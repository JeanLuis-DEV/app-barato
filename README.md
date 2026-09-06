# App Barato

Nova aplicação da família Apps Simples, criada a partir do App Base oficial com Vite, React, TypeScript e CSS.

Esta etapa contém somente a estrutura visual e técnica comum do template. A lógica do comparador será migrada separadamente a partir da versão legada preservada em `../App Barato - Legado`.

## Design System

Os componentes e tokens oficiais são consumidos por `@apps-simples/ui`, sem cópias locais. O CSS oficial é carregado por `@apps-simples/ui/style.css`.

A dependência está fixada na tag `v0.4.1` do repositório `JeanLuis-DEV/design-system-apps-simples`. O `AppLayout`, os estilos globais e os arquivos específicos da aplicação permanecem locais.

## Execução

Requer Node.js `20.19+` na linha 20, ou `22.12+`, e npm.

```sh
npm install
npm run dev
```

## Build

```sh
npm run build
```

O comando verifica os tipos com TypeScript e gera os arquivos de produção em `dist/`.

## Estrutura

```text
src/
  assets/
  components/
  hooks/
  layouts/
    AppLayout.tsx
  styles/
    global.css
    layout.css
  types/
  utils/
  App.tsx
  main.tsx
public/
AGENTS.md
index.html
package.json
package-lock.json
tsconfig.json
vite.config.ts
```

`src/components/` é reservado a componentes específicos do aplicativo. Componentes compartilhados e tokens visuais pertencem a `@apps-simples/ui`.
