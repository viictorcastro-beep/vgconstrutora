# VG Construtora  ERP de Obras

## Arquitetura

| Componente | Caminho | Funcao |
|---|---|---|
| **UI oficial (Pages)** | `docs/index.html` | SPA publicada no GitHub Pages |
| **Mirror local** | `app/index.html` | Espelho de docs/ para dev local (sempre sincronizar) |
| **Redirect legacy** | `index.html` (raiz) | Redireciona para /vgconstrutora/ |
| **API (opcional)** | `server.mjs` | Express API para catalogos e dashboard |
| **Catalogos** | `catalogos.mjs` | Seed/list de etapas e tipos de custo |
| **Scripts** | `scripts/` | Migracao, seed, testes |
| **Firestore Rules** | `firestore.rules` | Regras de seguranca do banco |

## GitHub Pages (UI oficial)

- **Branch**: main
- **Pasta**: /docs
- **URL**: https://victorcastro-beep.github.io/vgconstrutora/
- **Arquivo**: `docs/index.html`
- **Validacao**: Ctrl+U no site e buscar `BUILD:`

## Catalogos (Etapas e Tipos de Custo)

### Seed via API
`ash
npm install
# Configurar GOOGLE_APPLICATION_CREDENTIALS no .env
npm run seed:catalogos
`

### Seed automatico
O front-end faz merge local com Firestore ao carregar. Se a API estiver indisponivel, usa seeds locais como fallback.

### Catalogos oficiais
- 18 etapas de obra (Terreno, Fundacao, Estrutura, ..., Comercializacao)
- 8 tipos de custo (Material, Mao de Obra, Frete, ..., Aquisicao do Terreno)

## Migracao de dados legados

`ash
# Migrar custos (inferir etapaId e tipoCustoId por keywords)
OBRA_ID=<id> npm run migrate:custos

# Normalizar dataPagamento e descricao faltantes
OBRA_ID=<id> npm run migrate:normalize

# Testar integridade
OBRA_ID=<id> npm run test:custos
`

## Desenvolvimento

`ash
npm install
npm start  # API na porta 3001
`

## Regras do Firestore
Veja `firestore.rules`. Lancamentos exigem etapaId e tipoCustoId validos (blindagem server-side).
