/**
 * migrate-fornecedores-global.mjs
 * 
 * Migra fornecedores de subcoleções per-obra (obras/{id}/fornecedores)
 * para coleção global top-level (/fornecedores).
 * 
 * Lógica:
 *  1. Lê todas as obras
 *  2. Para cada obra, lê seus fornecedores
 *  3. Deduplica por nome (case-insensitive) — mantém o mais completo
 *  4. Cria na coleção global /fornecedores
 *  5. Atualiza fornecedorId em lançamentos e rateios para o novo ID global
 * 
 * Uso: node scripts/migrate-fornecedores-global.mjs
 * Requer: serviceAccount configurado via GOOGLE_APPLICATION_CREDENTIALS
 * 
 * ⚠️  Este script é idempotente — verifica se já existe antes de criar.
 * ⚠️  Se não tiver service account, rode a migração pelo console do app (ver abaixo).
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

// --- Config ---
const SA_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS || './serviceAccount.json';
let sa;
try {
  sa = JSON.parse(readFileSync(SA_PATH, 'utf8'));
} catch (e) {
  console.error(`❌ Não encontrou service account em "${SA_PATH}".`);
  console.log(`\n💡 Alternativa: rode a migração direto no app!`);
  console.log(`   No console do navegador (F12), cole:`);
  console.log(`   await window._migrarFornecedoresGlobal()`);
  process.exit(1);
}

initializeApp({ credential: cert(sa) });
const db = getFirestore();

async function migrate() {
  console.log('🚀 Migrando fornecedores para coleção global...\n');

  // 1. Ler todas as obras
  const obrasSnap = await db.collection('obras').get();
  console.log(`📁 ${obrasSnap.size} obras encontradas`);

  // 2. Coletar todos os fornecedores per-obra
  const porNome = new Map(); // nome_lower → { dados, origens: [{obraId, oldId}] }
  let totalLegado = 0;

  for (const obraDoc of obrasSnap.docs) {
    const fornSnap = await db.collection('obras').doc(obraDoc.id).collection('fornecedores').get();
    console.log(`  📦 ${obraDoc.id}: ${fornSnap.size} fornecedores`);
    totalLegado += fornSnap.size;

    for (const fornDoc of fornSnap.docs) {
      const data = fornDoc.data();
      const nomeKey = (data.nome || '').trim().toLowerCase();
      if (!nomeKey) continue;

      if (!porNome.has(nomeKey)) {
        porNome.set(nomeKey, {
          nome: data.nome.trim(),
          contato: data.contato || null,
          documento: data.documento || null,
          origens: []
        });
      }

      const entry = porNome.get(nomeKey);
      entry.origens.push({ obraId: obraDoc.id, oldId: fornDoc.id });

      // Preencher campos se o existente está vazio
      if (!entry.contato && data.contato) entry.contato = data.contato;
      if (!entry.documento && data.documento) entry.documento = data.documento;
    }
  }

  console.log(`\n📊 ${totalLegado} fornecedores legados → ${porNome.size} únicos por nome\n`);

  // 3. Verificar o que já existe na coleção global
  const existentesSnap = await db.collection('fornecedores').get();
  const existentesPorNome = new Map();
  existentesSnap.docs.forEach(d => {
    existentesPorNome.set((d.data().nome || '').trim().toLowerCase(), d.id);
  });

  // 4. Criar na coleção global + montar mapa old→new
  const idMap = new Map(); // "obraId::oldId" → newGlobalId
  let criados = 0, jaExistiam = 0;

  for (const [nomeKey, entry] of porNome.entries()) {
    let globalId;

    if (existentesPorNome.has(nomeKey)) {
      globalId = existentesPorNome.get(nomeKey);
      jaExistiam++;
    } else {
      const newRef = await db.collection('fornecedores').add({
        nome: entry.nome,
        contato: entry.contato,
        documento: entry.documento,
        createdAt: FieldValue.serverTimestamp(),
        createdBy: 'migration-script',
        _migratedFrom: entry.origens.map(o => `${o.obraId}/${o.oldId}`)
      });
      globalId = newRef.id;
      criados++;
      console.log(`  ✅ Criado: "${entry.nome}" → ${globalId}`);
    }

    for (const origem of entry.origens) {
      idMap.set(`${origem.obraId}::${origem.oldId}`, globalId);
    }
  }

  console.log(`\n📦 ${criados} criados | ${jaExistiam} já existiam\n`);

  // 5. Atualizar fornecedorId em lançamentos e rateios
  let lancAtualizados = 0, ratAtualizados = 0;

  for (const obraDoc of obrasSnap.docs) {
    // Lançamentos
    const lancSnap = await db.collection('obras').doc(obraDoc.id).collection('lancamentos').get();
    for (const lancDoc of lancSnap.docs) {
      const oldFornId = lancDoc.data().fornecedorId;
      if (!oldFornId) continue;
      const newId = idMap.get(`${obraDoc.id}::${oldFornId}`);
      if (newId && newId !== oldFornId) {
        await lancDoc.ref.update({
          fornecedorId: newId,
          _fornecedorIdLegado: oldFornId
        });
        lancAtualizados++;
      }
    }

    // Rateios
    const ratSnap = await db.collection('obras').doc(obraDoc.id).collection('rateios').get();
    for (const ratDoc of ratSnap.docs) {
      const oldFornId = ratDoc.data().fornecedorId;
      if (!oldFornId) continue;
      const newId = idMap.get(`${obraDoc.id}::${oldFornId}`);
      if (newId && newId !== oldFornId) {
        await ratDoc.ref.update({
          fornecedorId: newId,
          _fornecedorIdLegado: oldFornId
        });
        ratAtualizados++;
      }
    }
  }

  console.log(`🔄 ${lancAtualizados} lançamentos atualizados`);
  console.log(`🔄 ${ratAtualizados} rateios atualizados`);
  console.log('\n✅ Migração concluída!');
}

migrate().catch(err => {
  console.error('❌ Erro fatal:', err);
  process.exit(1);
});
