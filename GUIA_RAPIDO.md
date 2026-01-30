# 📖 GUIA RÁPIDO - VG CONSTRUTORA ERP

## 🚀 INÍCIO RÁPIDO

### 1. Acesso ao Sistema
1. Acesse: https://viictorcastro-beep.github.io/vgconstrutora/
2. Clique em **"Entrar com Google"**
3. Aguarde autenticação

### 2. Primeira Configuração

#### Criar Obra
1. Clique em **"Obras"** no header
2. Preencha:
   - Nome da obra
   - Data de início da construção
   - Data de recebimento/venda
3. Clique em **"Criar Obra"**

#### Criar Unidades (Casas)
1. Clique em **"Unidades"** no header
2. Preencha:
   - Nome (ex: Casa A, Lote 1)
   - Área em m²
   - Status (disponível/reservada/vendida)
   - VGV Previsto (valor estimado de venda)
   - Valor Real de Venda (quando vendido)
3. Clique em **"Criar Unidade"**

#### Configurar Categorias
1. Clique em **"Categorias"** no header
2. Crie categorias como:
   - Material de Construção
   - Mão de Obra
   - Elétrica
   - Hidráulica
   - Acabamento
   - etc.

#### Configurar Fornecedores
1. Clique em **"Fornecedores"** no header
2. Adicione seus fornecedores

#### Configurar Sócios
1. Vá para aba **"⚙️ Config"**
2. Seção **"Sócios"**
3. Digite nomes dos sócios
4. Clique em **"Salvar Sócios"**

#### Configurar Deduções (IR, Taxas)
1. Na aba **"⚙️ Config"**
2. Seção **"Deduções (IR, Taxas)"**
3. Preencha:
   - Nome (ex: IR, INSS, Corretagem)
   - Tipo: Percentual ou Fixo
   - Base: Lucro Bruto ou Valor de Venda
   - Valor (% ou R$)
4. Clique em **"Criar Dedução"**

---

## 💰 OPERAÇÕES DIÁRIAS

### Registrar Lançamento (Gasto)
1. Vá para **"💰 Lançamentos"**
2. Preencha:
   - Data (quando aconteceu)
   - Data Vencimento (quando vence)
   - Data Competência (qual mês conta)
   - Unidade (qual casa)
   - Categoria
   - Fornecedor
   - Valor
   - Descrição
   - Status (pendente/pago/atrasado)
   - Quem pagou (Sócio A ou B)
3. Clique em **"Adicionar Lançamento"**

### Registrar Rateio (Gasto Compartilhado)
1. Vá para **"⚖️ Rateios"**
2. Para gastos que devem ser divididos entre casas
3. Preencha:
   - Data
   - Categoria
   - Fornecedor
   - Valor total
   - Distribuição por unidade
4. Use **"Ratear Igualmente"** para dividir igual
5. Clique em **"Salvar Rateio"**

### Registrar Recebimento
1. Vá para **"💵 Recebimentos"**
2. Quando receber dinheiro de venda:
   - Data
   - Unidade vendida
   - Tipo (sinal/parcela/quitação)
   - Forma de pagamento
   - Valor
3. Clique em **"Adicionar Recebimento"**

### Registrar Acerto entre Sócios
1. Vá para **"🤝 Acertos Sócios"**
2. Quando um sócio transferir dinheiro para outro
3. Preencha:
   - Data
   - Valor
   - Quem pagou
   - Quem recebeu
4. Clique em **"Registrar Acerto"**

---

## 📊 USANDO O DASHBOARD

### KPIs Principais (Topo)
- **💰 Custo Total**: Quanto gastou até agora
- **💎 VGV Previsto**: Quanto espera vender (total)
- **💵 Recebido**: Quanto já recebeu
- **🏦 Fluxo de Caixa**: Recebido - Custos
- **📊 Lucro Bruto**: VGV - Custos
- **💵 Lucro Líquido**: Lucro Bruto - Deduções

### Análise de Rentabilidade
Mostra:
- **VGV Previsto vs Real**: Comparação do esperado com o negociado
- **Variação**: Percentual de ganho/perda
- **Tempo de Operação**: Quantos dias/meses desde o início
- **ROI Total**: Retorno sobre investimento (%)
- **ROI Mensal**: Quanto rende por mês (%)

### Análise por Sócio
Para cada sócio (50/50):
- **Investimento**: Quanto colocou
- **Lucro Líquido**: Quanto vai lucrar
- **ROI Individual**: Retorno percentual
- **ROI Mensal**: Retorno por mês
- **Lucro/Mês**: Valor mensal

### Gráficos Interativos

#### 1. Evolução de Custos
- **Linha azul**: Custos mensais
- **Linha vermelha**: Custos acumulados
- Mostra como os gastos evoluem no tempo

#### 2. Distribuição por Categoria
- **Pizza**: Mostra onde está gastando mais
- **Cores diferentes**: Cada categoria
- **Percentual**: % de cada categoria

#### 3. Fluxo de Caixa Projetado
- **Barras verdes**: Entradas
- **Barras vermelhas**: Saídas
- **Linha azul**: Saldo acumulado
- Projeção dos próximos 6 meses

#### 4. ROI Comparativo
- **Barras coloridas**: 4 indicadores
  - ROI (%)
  - Margem Bruta (%)
  - Margem Líquida (%)
  - % Recebido

### Custo por m²
- **Total da Obra**: Custo total
- **Área Total**: Soma das áreas
- **Custo Médio/m²**: Quanto custa cada m²
- **Por Unidade**: Custo e área de cada casa

### Top 5 Categorias
- 5 categorias que mais gastou
- Valor em R$
- Ordenado do maior para menor

### Top 5 Fornecedores
- 5 fornecedores que mais vendeu
- Valor em R$
- Ordenado do maior para menor

### Lucro por Sócio
- Divisão 50/50
- Mostra lucro de cada um
- Considera deduções

### Equalização
- Calcula quem deve para quem
- Considera:
  - Quem pagou mais gastos
  - Acertos já feitos
- Sugere transferência

---

## 🎨 PERSONALIZAÇÃO

### Alternar Tema (Claro/Escuro)
1. Clique no botão **🌙** no header
2. Alterna entre tema claro e escuro
3. Preferência salva automaticamente

---

## 📤 EXPORTAÇÕES

### Excel (Planilha Completa)
1. Clique em **"📊 Excel"** no header
2. Gera arquivo com 4 abas:
   - **Lançamentos**: Todos os gastos
   - **Rateios**: Gastos rateados
   - **Recebimentos**: Valores recebidos
   - **Dashboard**: Resumo dos KPIs
3. Arquivo salvo como: `VG_NomeDaObra_2026-01-30.xlsx`

### PDF (Relatório Profissional)
1. Vá para **"📊 Dashboard"**
2. Role até o final
3. Clique em **"📄 Exportar Dashboard PDF"**
4. Gera relatório com:
   - Header profissional
   - Dados da obra
   - Indicadores financeiros
   - Análise de rentabilidade
   - Distribuição por sócio
   - Top 5 categorias
   - Footer com paginação

---

## 🔍 FILTROS AVANÇADOS

### No Dashboard
1. **Período**: Todos, Mês Atual, Mês Anterior, Trimestre, Ano
2. **Status**: Todos, Pendente, Pago, Atrasado
3. **Categoria**: Filtra por categoria específica
4. **Fornecedor**: Filtra por fornecedor específico
5. **Buscar**: Pesquisa por descrição

### Limpar Filtros
- Clique em **"Limpar Filtros"**
- Volta para ver tudo

---

## ⚡ ATALHOS E DICAS

### Navegação Rápida
- As abas no topo alternam as views
- Clique em **"📊 Dashboard"** para voltar à visão geral

### Status de Pagamento
- **⏳ Pendente**: Ainda não pagou
- **✅ Pago**: Já foi pago
- **🚨 Atrasado**: Venceu e não pagou

### Alertas Automáticos
- Sistema mostra alertas de:
  - **Vencidos**: Pagamentos atrasados
  - **Vencendo em 7 dias**: Atenção

### Editar Unidade
- Na lista de unidades, clique em **"✏️ Editar"**
- Pode alterar:
  - Status (disponível → vendida)
  - Valor real de venda

### Sugestão de Equalização
- Na aba **"🤝 Acertos Sócios"**
- Clique em **"Sugerir Equalização"**
- Sistema calcula quem deve para quem

### Rateio Rápido
- Na aba **"⚖️ Rateios"**
- Clique em **"Ratear Igualmente"**
- Divide o valor igual para todas as unidades selecionadas

---

## 🆘 RESOLUÇÃO DE PROBLEMAS

### Não consigo ver meus dados
1. Verifique se selecionou a obra correta no header
2. Cada obra tem dados isolados

### Gráficos não aparecem
1. Aguarde carregar completamente
2. Atualize a página (F5)
3. Verifique se tem dados cadastrados

### Excel não baixa
1. Permita downloads no navegador
2. Verifique se há dados para exportar

### Equalização está errada
1. Verifique se todos os gastos têm o campo "Pagador" preenchido
2. Verifique se registrou os acertos já feitos
3. Sistema considera: quanto pagou - quanto deve - acertos

### Dashboard mostra zero
1. Cadastre unidades com VGV previsto
2. Registre lançamentos e rateios
3. Dados aparecem em tempo real

---

## 📞 SUPORTE

### Dados Técnicos
- **Acesso**: https://viictorcastro-beep.github.io/vgconstrutora/
- **Email autorizado**: viictor.castro@gmail.com, gcm.conceicao@gmail.com
- **Dados**: Firebase Firestore (tempo real)
- **Backup**: Automático pelo Firebase

### Atualizações
- Sistema atualizado automaticamente
- Sem necessidade de instalar nada
- Sempre a versão mais recente

---

## 🎯 FLUXO RECOMENDADO

### Setup Inicial (1x)
1. Criar Obra
2. Criar Unidades
3. Criar Categorias
4. Criar Fornecedores
5. Configurar Sócios
6. Configurar Deduções (IR, taxas)

### Operação Diária
1. Registrar Lançamentos conforme gastando
2. Marcar como "pago" quando pagar
3. Registrar Rateios para gastos compartilhados
4. Registrar Recebimentos quando vender

### Análise Semanal
1. Ver Dashboard
2. Verificar gráficos
3. Analisar top categorias
4. Verificar alertas de vencimento

### Fechamento Mensal
1. Verificar equalização
2. Fazer acertos entre sócios se necessário
3. Exportar Excel para contabilidade
4. Gerar PDF para arquivo

### Venda de Unidade
1. Editar unidade → Status "vendida"
2. Preencher "Valor Real de Venda"
3. Registrar Recebimentos conforme receber
4. Verificar impacto no ROI

---

## 💡 DICAS DE USO

### Categorias Sugeridas
- Material de Construção
- Mão de Obra - Pedreiro
- Mão de Obra - Eletricista
- Mão de Obra - Encanador
- Mão de Obra - Pintor
- Acabamento
- Documentação
- Taxas e Impostos
- Outros

### Deduções Comuns
- IR (15% sobre lucro)
- INSS (11% sobre faturamento)
- Corretagem (5-6% sobre venda)
- Taxas Bancárias (valor fixo)

### Boas Práticas
1. **Registre tudo**: Não deixe nenhum gasto sem registrar
2. **Use descrições claras**: Facilita encontrar depois
3. **Preencha datas corretamente**: Competência é importante
4. **Atualize status**: Marque como "pago" quando pagar
5. **Faça backup**: Exporte Excel mensalmente
6. **Revise equalização**: Faça acertos regularmente
7. **Atualize valores reais**: Quando vender, atualize o valor

---

**🚀 Sistema pronto para usar! Comece agora e tenha controle total das suas obras!**
