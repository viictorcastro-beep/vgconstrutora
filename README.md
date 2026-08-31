# VG Construtora — ERP de Obras

Sistema web para acompanhar obras, custos, recebimentos, contas a receber, rateios e acertos entre sócios.

## Arquitetura

| Componente | Caminho | Função |
|---|---|---|
| Interface publicada | `docs/index.html` | SPA servida pelo GitHub Pages |
| Espelho local | `app/index.html` | Fonte de desenvolvimento, mantida idêntica a `docs/` |
| Motor financeiro testável | `app/equalizacao.mjs` | Regras puras de moeda e equalização |
| Redirecionamento legado | `index.html` | Redireciona para `/vgconstrutora/` |
| API opcional | `server.mjs` | Catálogos e dashboard com autenticação Firebase |
| Regras de acesso | `firestore.rules` | Validação e autorização no Firestore |

## Regras financeiras principais

- O período de equalização atual começa em **31/08/2026** e usa a data de criação do registro, mesmo que a competência seja retroativa.
- Custos e receitas são divididos em 50/50 por padrão; percentuais explícitos são respeitados.
- O valor físico é atribuído a quem pagou ou recebeu.
- Acertos confirmados abatem o saldo sem duplicar recebimentos antigos vinculados automaticamente.
- Todos os cálculos monetários apresentados ao usuário são arredondados para centavos.

## Desenvolvimento

Requer Node.js 22 ou superior (a automação usa Node.js 24).

```bash
npm install
npm test
npm start
```

## Migrações

A movimentação entre obras é executada em modo de simulação por padrão:

```bash
node scripts/move-to-obra.mjs --source <obra-origem> --target <obra-destino>
node scripts/move-to-obra.mjs --source <obra-origem> --target <obra-destino> --apply
```

Use `--apply` somente depois de revisar a simulação e o backup gerado.

Para auditar a normalização de lançamentos sem gravar dados:

```bash
npm run migrate:normalize:dry
```

## Publicação

- Branch: `main`
- Pasta publicada: `/docs`
- Site: https://viictorcastro-beep.github.io/vgconstrutora/
- A automação de CI executa os testes de cálculo e estrutura da interface em cada atualização.

## Segurança

A API exige token de identidade do Firebase. As regras do Firestore restringem o sistema aos dois usuários autorizados e reservam operações administrativas ao proprietário.
