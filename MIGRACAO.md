# 🚚 MIGRAÇÃO FIREBASE: qd61lt32 → qd20-lt2-a-b

## 📋 **INSTRUÇÕES COMPLETAS**

### **PASSO 1: Baixar as Credenciais**

#### **Projeto Antigo (qd61lt32)**
1. Acesse: https://console.firebase.google.com/project/qd61lt32/settings/serviceaccounts/adminsdk
2. Clique em **"Generate new private key"**
3. Confirme e baixe o arquivo JSON
4. **Renomeie para:** `serviceAccount-old.json`
5. **Coloque na raiz do repo:** `C:\Users\victo\OneDrive\Documents\vgconstrutora\`

#### **Projeto Novo (qd20-lt2-a-b)**
1. Acesse: https://console.firebase.google.com/project/qd20-lt2-a-b/settings/serviceaccounts/adminsdk
2. Clique em **"Generate new private key"**
3. Confirme e baixe o arquivo JSON
4. **Renomeie para:** `serviceAccount-new.json`
5. **Coloque na raiz do repo:** `C:\Users\victo\OneDrive\Documents\vgconstrutora\`

**⚠️ IMPORTANTE:** Esses arquivos já estão protegidos no `.gitignore` e **NUNCA** serão commitados!

---

### **PASSO 2: Instalar Dependências**

```powershell
cd C:\Users\victo\OneDrive\Documents\vgconstrutora
npm install
```

Isso vai instalar o `firebase-admin` necessário para a migração.

---

### **PASSO 3: Executar a Migração**

```powershell
npm run migrate
```

**OU:**

```powershell
node scripts/migrate-qd61-to-new.mjs
```

---

### **PASSO 4: Acompanhar o Progresso**

Você verá no terminal:

```
🚚 Migrando qd61lt32 → qd20-lt2-a-b ...

🔎 lancamentos: 245 docs
✅ lancamentos: 245/245...
✅ lancamentos: finalizado (245)

🔎 acertos: 12 docs
✅ acertos: finalizado (12)

🔎 history: 89 docs
✅ history: finalizado (89)

✅ config/main copiado

🎉 Migração concluída.
```

---

### **PASSO 5: Conferir no Firebase Console**

#### **Abrir Firestore do Projeto Novo:**
https://console.firebase.google.com/project/qd20-lt2-a-b/firestore

#### **Verificar se tem dados em:**
- ✅ `lancamentos` (coleção com documentos)
- ✅ `acertos` (coleção com documentos)
- ✅ `history` (coleção com documentos)
- ✅ `config/main` (documento único)

---

## 🔧 **CONFIGURAÇÃO DO SCRIPT**

### **Personalizar (se necessário):**

Abra: `scripts/migrate-qd61-to-new.mjs`

```javascript
// IDs padrão que serão atribuídos aos dados antigos
const OBRA_ID = "QD61_LT32";      // ← Mudar se quiser outro ID
const UNIDADE_ID = "GERAL";       // ← Mudar se quiser outro ID

// Coleções a copiar
const collections = ["lancamentos", "acertos", "history"];  // ← Adicionar/remover coleções
```

---

## 🛡️ **SEGURANÇA**

### **Arquivos Protegidos (não vão para o Git):**
- `serviceAccount-old.json`
- `serviceAccount-new.json`
- `serviceAccount*.json` (qualquer arquivo com esse padrão)

### **Após a Migração:**
Você pode **DELETAR** os arquivos de credenciais se quiser:

```powershell
Remove-Item serviceAccount-old.json
Remove-Item serviceAccount-new.json
```

---

## ❌ **PROBLEMAS COMUNS**

### **Erro: "Cannot find module 'firebase-admin'"**
```powershell
npm install
```

### **Erro: "ENOENT: no such file or directory, open './serviceAccount-old.json'"**
- Certifique-se que os arquivos JSON estão na **raiz** do repo
- Verifique os nomes: `serviceAccount-old.json` e `serviceAccount-new.json`

### **Erro: "Permission denied"**
- As credenciais estão corretas?
- O Service Account tem permissão de leitura no projeto antigo?
- O Service Account tem permissão de escrita no projeto novo?

---

## 📊 **O QUE O SCRIPT FAZ**

1. **Conecta** nos 2 projetos Firebase simultaneamente
2. **Lê** todos os documentos das coleções antigas
3. **Adiciona** campos `obraId` e `unidadeId` (se não existirem)
4. **Copia** para o projeto novo usando batch writes (eficiente)
5. **Copia** o documento `config/main` separadamente
6. **Finaliza** mostrando estatísticas

---

## 🎯 **PRÓXIMOS PASSOS APÓS MIGRAÇÃO**

1. ✅ Conferir dados no Firestore novo
2. ✅ Testar o sistema em: https://viictorcastro-beep.github.io/vgconstrutora/
3. ✅ Criar obras e unidades no novo sistema
4. ✅ Verificar se os lançamentos antigos aparecem corretamente
5. ✅ Deletar as credenciais JSON da sua máquina (segurança)

---

**Dúvidas?** Execute o script e me avise se aparecer algum erro! 🚀
