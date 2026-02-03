# 📋 Proprietário das Unidades - Funcionalidade

## 🎯 Objetivo

Esta funcionalidade permite registrar **em nome de qual sócio** cada unidade/casa está construída legalmente, afetando diretamente a **equalização financeira** entre os sócios.

---

## 🏗️ Como Funciona

### 1. Cadastro de Unidades

Ao criar ou editar uma unidade, você pode selecionar o **Proprietário Legal**:

- **👥 Ambos (50/50)**: Casa em nome dos dois sócios (padrão)
- **👤 Sócio A**: Casa registrada exclusivamente no nome do Sócio A
- **👤 Sócio B**: Casa registrada exclusivamente no nome do Sócio B

### 2. Impacto na Equalização

O proprietário da unidade determina **quem recebe o dinheiro** quando há recebimentos (sinais, parcelas):

#### Cenário 1: Casa em nome do Sócio A
```
Recebimento de R$ 10.000 (sinal)
→ 100% para Sócio A (R$ 10.000)
→ 0% para Sócio B (R$ 0)
```

#### Cenário 2: Casa em nome de Ambos
```
Recebimento de R$ 10.000 (sinal)
→ 50% para Sócio A (R$ 5.000)
→ 50% para Sócio B (R$ 5.000)
```

#### Cenário 3: Casa em nome do Sócio B
```
Recebimento de R$ 10.000 (sinal)
→ 0% para Sócio A (R$ 0)
→ 100% para Sócio B (R$ 10.000)
```

---

## 💡 Exemplo Prático Real

### Situação Inicial:
- Casa A: Construída em nome do Victor
- Casa B: Construída em nome do Gustavo
- Casa C: Construída em nome de ambos

### Recebimentos:
- Casa A vendeu por R$ 450.000 → **Victor recebe R$ 450.000**
- Casa B vendeu por R$ 450.000 → **Gustavo recebe R$ 450.000**
- Casa C vendeu por R$ 450.000 → **Victor R$ 225.000 + Gustavo R$ 225.000**

### Custos:
- Total de custos: R$ 900.000
- Victor pagou: R$ 500.000
- Gustavo pagou: R$ 400.000

### Equalização:

**Victor:**
- Recebeu: R$ 675.000 (Casa A + 50% Casa C)
- Pagou: R$ 500.000
- Deveria pagar: R$ 450.000 (50% dos custos)
- **Saldo: Pagou R$ 50.000 a mais que devia**

**Gustavo:**
- Recebeu: R$ 675.000 (Casa B + 50% Casa C)
- Pagou: R$ 400.000
- Deveria pagar: R$ 450.000 (50% dos custos)
- **Saldo: Pagou R$ 50.000 a menos que devia**

**Resultado:** Gustavo deve R$ 50.000 para Victor

---

## 🔧 Como Usar

### Ao Criar uma Unidade:
1. Preencha os dados básicos (nome, área, VGV)
2. Selecione o **Status** (disponível, reservada, vendida)
3. Escolha o **Proprietário Legal**:
   - Ambos (50/50) - opção padrão
   - Sócio A
   - Sócio B
4. Clique em "Criar Unidade"

### Ao Editar uma Unidade:
1. Clique no botão "✏️ Editar" da unidade
2. Altere o campo **Proprietário** se necessário
3. Clique em "💾 Salvar Alterações"

### Na Visualização:
- Cada unidade mostra uma **badge roxa** indicando o proprietário
- Exemplos:
  - 👥 Ambos (50/50)
  - 👤 Sócio A
  - 👤 Sócio B

---

## ⚖️ Impacto na Equalização

A equalização agora funciona da seguinte forma:

### 1️⃣ Dinheiro que Entrou
- **Antes:** Sempre 50/50 entre os sócios
- **Agora:** Segue o proprietário da unidade (100% A, 100% B, ou 50/50)

### 2️⃣ Dinheiro que Pagou
- Continua igual: quem efetivamente pagou os custos

### 3️⃣ Deveria Pagar
- Continua igual: 50% dos custos totais para cada sócio

### 4️⃣ Saldo Final
- Calcula considerando os recebimentos específicos de cada proprietário

---

## 🚨 Casos de Uso Importantes

### Caso 1: Casa só em nome de um sócio
```
Situação: Casa registrada só no nome do Victor
Sinal de R$ 20.000 entra

Equalização:
- Victor recebe: R$ 20.000
- Gustavo recebe: R$ 0

Se Gustavo usar R$ 10.000 desse dinheiro para pagar custos:
→ Gustavo fica devendo R$ 10.000 para Victor
(Porque usou o dinheiro que era do Victor)
```

### Caso 2: Casas em nomes diferentes
```
Situação:
- Casa 1 (Victor): Sinal R$ 10.000
- Casa 2 (Gustavo): Sinal R$ 10.000

Equalização:
- Victor recebeu: R$ 10.000
- Gustavo recebeu: R$ 10.000

Se cada um pagar R$ 10.000 de custos:
→ Contas equalizadas (cada um usou seu próprio dinheiro)
```

### Caso 3: Mix de proprietários
```
Situação:
- Casa 1 (Victor): Sinal R$ 10.000
- Casa 2 (Ambos): Sinal R$ 10.000
- Casa 3 (Gustavo): Sinal R$ 10.000

Equalização:
- Victor recebeu: R$ 15.000 (R$ 10k + 50% de R$ 10k)
- Gustavo recebeu: R$ 15.000 (R$ 10k + 50% de R$ 10k)
```

---

## 🔄 Migração de Dados Existentes

### Unidades antigas (sem proprietário definido):
- Automaticamente tratadas como **"Ambos (50/50)"**
- Você pode editar cada unidade para ajustar o proprietário correto

### Recomendação:
1. Revise todas as unidades existentes
2. Ajuste o campo "Proprietário" conforme o registro legal
3. Verifique a equalização para confirmar que está correta

---

## 📊 Visualização

### No Modal de Unidades:
Cada unidade mostra:
- Nome + Status (disponível/reservada/vendida)
- **Badge roxa** com o proprietário
- VGV e valores de venda
- Área construída

### Na Equalização:
- Explicação atualizada mostrando que os recebimentos seguem o proprietário
- Exemplo prático considerando a lógica de proprietário

---

## ✅ Benefícios

1. **Transparência Legal**: Registra formalmente em nome de quem cada casa está
2. **Equalização Precisa**: Recebimentos vão para quem legalmente é dono
3. **Rastreabilidade**: Histórico claro de propriedade de cada unidade
4. **Flexibilidade**: Permite diferentes configurações por unidade
5. **Realidade Jurídica**: Reflete a situação legal real das propriedades

---

## 🎓 Dicas

💡 **Defina o proprietário ao criar a unidade** para evitar ajustes depois

💡 **Casas em nome de apenas um sócio** recebem 100% dos valores para aquele sócio

💡 **Use "Ambos"** para casas em condomínio ou sociedade formal 50/50

💡 **Revise a equalização** após definir/alterar proprietários para confirmar os cálculos

---

## 🔗 Integração com Outros Módulos

- **Recebimentos**: Ao registrar um recebimento, o sistema automaticamente calcula quem recebe baseado no proprietário da unidade
- **Equalização**: Atualiza em tempo real conforme os proprietários
- **Relatórios**: Excel e PDF incluem informações de proprietário
- **Dashboard**: KPIs consideram a distribuição por proprietário

---

*Desenvolvido para VG Construtora - Sistema de Gestão de Obras v2.0*
