/**
 * normalize-lancamentos.mjs
 * 
 * Script idempotente para normalizar lançamentos legados no Firestore.
 * Resolve:
 *   1) dataPagamento ausente quando status=pago (usa dataCompetencia/data)
 *   2) descricao ausente (gera fallback estruturado)
 *   3) Campos redundantes: unifica status/statusPagamento, data/dataCompetencia
 *   4) Garante etapaId e tipoCustoId (fallback se ausente)
 *   5) Garante escopo (GERAL/UNIDADE)
 * 
 * Uso:
 *   node scripts/normalize-lancamentos.mjs
 *   OBRA_ID=abc123 node scripts/normalize-lancamentos.mjs   # apenas uma obra
 *   node scripts/normalize-lancamentos.mjs --dry-run       # só relatório
 * 
 * Idempotente: pode rodar múltiplas vezes sem efeitos colaterais.
 */

import "dotenv/config";
import { cert, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import fs from "fs";

// --- Firebase init ---
const SERVICE_ACCOUNT_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS 
  || process.env.SERVICE_ACCOUNT_PATH 
  || "./serviceAccount-new.json";

if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
  console.error("❌ Service account não encontrado:", SERVICE_ACCOUNT_PATH);
  console.error("ℹ️  Configure GOOGLE_APPLICATION_CREDENTIALS ou coloque serviceAccount-new.json na raiz.");
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, "utf8"));
const firebaseApp = initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore(firebaseApp);

// --- Config ---
const OBRA_ID = process.env.OBRA_ID || null;
const DRY_RUN = process.argv.includes("--dry-run") || process.env.DRY_RUN === "1" || process.env.DRY_RUN === "true";

const FALLBACK_ETAPA = "administracao_financeiro";
const FALLBACK_TIPO = "outros";

// --- Helpers ---
function isValidDate(str) {
  if (!str) return false;
  const d = new Date(str);
  return !isNaN(d.getTime());
}

function inferStatus(l) {
  if (l.statusPagamento) return l.statusPagamento;
  if (l.status) return l.status;
  if (l.pago === true) return "pago";
  return "pendente";
}

function buildFallbackDescricao(l, categorias) {
  const parts = [];
  if (l.categoriaId && categorias.has(l.categoriaId)) {
    parts.push(categorias.get(l.categoriaId).nome || l.categoriaId);
  }
  if (l.etapaId && l.etapaId !== FALLBACK_ETAPA) {
    parts.push(l.etapaId.replace(/_/g, ' '));
  }
  if (l.tipoCustoId && l.tipoCustoId !== FALLBACK_TIPO) {
    parts.push(l.tipoCustoId.replace(/_/g, ' '));
  }
  if (l.fornecedorId) {
    parts.push(`forn:${l.fornecedorId}`);
  }
  if (parts.length === 0) {
    return "[migrado - sem descrição]";
  }
  return `[migrado] ${parts.join(' / ')}`;
}

// --- Main ---
async function getObras() {
  if (OBRA_ID) return [OBRA_ID];
  const snap = await db.collection("obras").get();
  return snap.docs.map(d => d.id);
}

async function normalizeObra(obraId) {
  const obraRef = db.collection("obras").doc(obraId);
  const obraSnap = await obraRef.get();
  if (!obraSnap.exists) {
    console.warn(`⚠️  Obra ${obraId} não encontrada. Pulando.`);
    return { obraId, total: 0, corrigidos: 0, pendentes: 0, excecoes: [] };
  }

  // Carregar categorias legadas (se existirem)
  const categoriasSnap = await obraRef.collection("categorias").get();
  const categorias = new Map(categoriasSnap.docs.map(d => [d.id, d.data()]));

  // Carregar fornecedores
  const fornSnap = await obraRef.collection("fornecedores").get();
  const fornecedores = new Map(fornSnap.docs.map(d => [d.id, d.data()]));

  const lancSnap = await obraRef.collection("lancamentos").get();
  const total = lancSnap.size;
  let corrigidos = 0;
  let pendentes = 0;
  const excecoes = [];

  let batch = db.batch();
  let batchCount = 0;

  for (const docSnap of lancSnap.docs) {
    const l = docSnap.data();
    const update = {};
    const issues = [];

    // 1) Normalizar status
    const status = inferStatus(l);
    if (l.statusPagamento !== status || l.status !== status) {
      update.status = status;
      update.statusPagamento = status;
      update.pago = status === "pago";
      issues.push("status");
    }

    // 2) Normalizar dataCompetencia
    const dataComp = l.dataCompetencia || l.data || null;
    if (!l.dataCompetencia && l.data) {
      update.dataCompetencia = l.data;
      issues.push("dataCompetencia");
    }

    // 3) Normalizar dataPagamento
    if (status === "pago" && !l.dataPagamento) {
      if (isValidDate(dataComp)) {
        update.dataPagamento = dataComp;
        issues.push("dataPagamento←competencia");
      } else {
        excecoes.push({
          id: docSnap.id,
          motivo: "pago sem dataPagamento e sem data inferível",
          valor: l.valor,
          descricao: l.descricao || "(sem)"
        });
        pendentes++;
        // Marcar como pendente de revisão
        update._migNormPendente = true;
        issues.push("dataPagamento:PENDENTE");
      }
    }

    // 4) Normalizar descricao
    if (!l.descricao || l.descricao.trim() === "") {
      const fallback = buildFallbackDescricao(l, categorias);
      update.descricao = fallback;
      issues.push("descricao");
    }

    // 5) Garantir etapaId
    if (!l.etapaId) {
      update.etapaId = FALLBACK_ETAPA;
      issues.push("etapaId");
    }

    // 6) Garantir tipoCustoId
    if (!l.tipoCustoId) {
      update.tipoCustoId = FALLBACK_TIPO;
      issues.push("tipoCustoId");
    }

    // 7) Garantir escopo
    if (!l.escopo) {
      update.escopo = l.unidadeId ? "UNIDADE" : "GERAL";
      issues.push("escopo");
    }

    // 8) Garantir obraId
    if (!l.obraId) {
      update.obraId = obraId;
      issues.push("obraId");
    }

    // 9) Normalizar campos redundantes (sync)
    if (l.comprovante && !l.anexoUrl) {
      update.anexoUrl = l.comprovante;
      issues.push("anexoUrl");
    } else if (l.anexoUrl && !l.comprovante) {
      update.comprovante = l.anexoUrl;
      issues.push("comprovante");
    }

    if (l.pagador && !l.pagadorId) {
      update.pagadorId = l.pagador;
      issues.push("pagadorId");
    } else if (l.pagadorId && !l.pagador) {
      update.pagador = l.pagadorId;
      issues.push("pagador");
    }

    // Aplicar update se necessário
    if (Object.keys(update).length > 0) {
      update._migNormAt = FieldValue.serverTimestamp();
      update._migNormVer = "normalize-v1";

      if (!DRY_RUN) {
        batch.update(docSnap.ref, update);
        batchCount++;
        if (batchCount >= 400) {
          await batch.commit();
          batch = db.batch();
          batchCount = 0;
        }
      }
      corrigidos++;
      if (issues.length > 0) {
        console.log(`  📝 ${docSnap.id}: ${issues.join(', ')}`);
      }
    }
  }

  if (!DRY_RUN && batchCount > 0) {
    await batch.commit();
  }

  return { obraId, total, corrigidos, pendentes, excecoes };
}

async function run() {
  console.log("═══════════════════════════════════════════════");
  console.log("  🔧 NORMALIZAÇÃO DE LANÇAMENTOS LEGADOS");
  console.log(`  ${DRY_RUN ? "🔍 MODO DRY RUN (sem alterações)" : "✏️  MODO ESCRITA (alterações aplicadas)"}`);
  console.log("═══════════════════════════════════════════════\n");

  const obras = await getObras();
  console.log(`📋 Obras a processar: ${obras.length}\n`);

  const relatorio = {
    totalGeral: 0,
    corrigidosGeral: 0,
    pendentesGeral: 0,
    excecoesGeral: [],
    porObra: []
  };

  for (const obraId of obras) {
    console.log(`\n🏗️  Processando obra: ${obraId}`);
    const resultado = await normalizeObra(obraId);
    relatorio.totalGeral += resultado.total;
    relatorio.corrigidosGeral += resultado.corrigidos;
    relatorio.pendentesGeral += resultado.pendentes;
    relatorio.excecoesGeral.push(...resultado.excecoes);
    relatorio.porObra.push(resultado);

    console.log(`  ✅ ${resultado.total} analisados | ${resultado.corrigidos} corrigidos | ${resultado.pendentes} pendentes | ${resultado.excecoes.length} exceções`);
  }

  // Relatório final
  console.log("\n═══════════════════════════════════════════════");
  console.log("  📊 RELATÓRIO FINAL");
  console.log("═══════════════════════════════════════════════");
  console.log(`  Total analisado:  ${relatorio.totalGeral}`);
  console.log(`  Corrigidos:       ${relatorio.corrigidosGeral}`);
  console.log(`  Pendentes:        ${relatorio.pendentesGeral}`);
  console.log(`  Exceções:         ${relatorio.excecoesGeral.length}`);

  if (relatorio.excecoesGeral.length > 0) {
    console.log("\n  ⚠️  EXCEÇÕES (revisão manual necessária):");
    relatorio.excecoesGeral.forEach((ex, i) => {
      console.log(`    ${i + 1}. [${ex.id}] ${ex.motivo} | R$ ${ex.valor} | "${ex.descricao}"`);
    });
  }

  if (DRY_RUN) {
    console.log("\n  ℹ️  Nenhuma alteração foi feita (DRY_RUN). Para aplicar: execute sem --dry-run.");
  }

  console.log("\n═══════════════════════════════════════════════\n");
  process.exit(0);
}

run().catch(err => {
  console.error("❌ Erro fatal:", err);
  process.exit(1);
});
