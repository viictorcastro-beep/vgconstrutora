# vgconstrutora

## Custos padronizados (Etapas/Tipos)

Scripts:

- Seed automático dos catálogos roda no app (admin).
- Migração de dados legados:
	- `npm run migrate:custos` (use `OBRA_ID` opcional).
- Teste mínimo:
	- `OBRA_ID=<id> npm run test:custos`

API de catálogos:

- `npm install`
- Defina as variáveis localmente (ex.: `.env`):
	- `GOOGLE_APPLICATION_CREDENTIALS=<CAMINHO_REAL_DO_SERVICE_ACCOUNT.json>`
	- `ADMIN_TOKEN=<token_forte_para_seed_admin>` (opcional)
	- `PORT=3001` (opcional)
- Windows (PowerShell) para validar o caminho:
	- `Test-Path "<CAMINHO_REAL_DO_SERVICE_ACCOUNT.json>"` (deve retornar True)
	- Se não tiver o arquivo, baixe o service account no Firebase e configure a env.
- `npm run start`
- Healthcheck: `GET /api/health/catalogos`

Regras sugeridas do Firestore em `firestore.rules`.

## GitHub Pages (UI oficial)

- Produção é main:/docs.
- Arquivo oficial: docs/index.html.
- Como validar: abrir o site, Ctrl+U e buscar por BUILD.