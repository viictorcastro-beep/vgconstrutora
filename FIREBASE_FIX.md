# 🔥 CORREÇÃO: Firebase API Key Inválida

## ❌ PROBLEMA
```
auth/api-key-not-valid.-please-pass-a-valid-api-key.
```

## ✅ SOLUÇÃO

### OPÇÃO 1: Remover Restrições da API Key (RECOMENDADO)

1. Acesse: https://console.firebase.google.com/project/qd20-lt2-a-b/settings/general

2. Vá em **Project Settings** > **General** > **Web API Key**

3. Clique no link da **Web API Key** (vai abrir Google Cloud Console)

4. Na página da API Key, procure por **"Application restrictions"**

5. Selecione **"None"** (sem restrições) OU configure corretamente:
   - HTTP referrers (web sites)
   - Adicione: `viictorcastro-beep.github.io/*`
   - Adicione: `localhost/*` (para testes locais)

6. Clique em **SAVE**

### OPÇÃO 2: Gerar Nova API Key

1. Acesse: https://console.firebase.google.com/project/qd20-lt2-a-b/settings/general

2. Em **Your apps** > **Web app** > Clique no ícone de configuração (⚙️)

3. Em **SDK setup and configuration**, copie a nova `apiKey`

4. Substitua no código:
```javascript
const firebaseConfig = {
  apiKey: "NOVA_API_KEY_AQUI",  // ← Cole a nova key aqui
  authDomain: "qd20-lt2-a-b.firebaseapp.com",
  projectId: "qd20-lt2-a-b",
  storageBucket: "qd20-lt2-a-b.firebasestorage.app",
  messagingSenderId: "819564880932",
  appId: "1:819564880932:web:cc74ed5c4ba91aa4cb50c2"
};
```

### OPÇÃO 3: Verificar Status da API

1. Acesse: https://console.cloud.google.com/apis/credentials?project=qd20-lt2-a-b

2. Procure pela **Browser key (auto created by Firebase)**

3. Verifique se está **ENABLED**

4. Se estiver desabilitada, clique e ative

---

## 🔍 DIAGNOSTICAR

Execute no Console do navegador (F12):

```javascript
// Ver configuração atual
console.log("API Key:", firebaseConfig.apiKey);
console.log("Project ID:", firebaseConfig.projectId);

// Testar conexão
fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseConfig.apiKey}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ returnSecureToken: true })
})
.then(r => r.json())
.then(d => console.log("API Response:", d))
.catch(e => console.error("API Error:", e));
```

---

## 🎯 APÓS CORRIGIR:

1. Limpe o cache do navegador (Ctrl+Shift+Del)
2. Recarregue a página (Ctrl+F5)
3. Tente fazer login novamente

---

## 📧 ME AVISE APÓS TENTAR

Caso precise de ajuda adicional, compartilhe:
- Print do Google Cloud Console mostrando as restrições da API Key
- Mensagem de erro completa do Console (F12)
