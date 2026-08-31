import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

const key = JSON.parse(fs.readFileSync("./serviceAccount-new.json", "utf8"));

const firebaseApp = initializeApp({ credential: cert(key) });
const db = getFirestore(firebaseApp);

const OBRA_ID = process.env.OBRA_ID || null;

const TIPOS = [
  { id: "material", keywords: ["material", "cimento", "tijolo", "areia", "brita", "bloco", "tinta", "cimento", "argamassa", "cimento cola", "revestimento", "porcelanato", "tubo", "fio", "cabo"] },
  { id: "mao_obra", keywords: ["mão de obra", "mao de obra", "pedreiro", "pintor", "eletricista", "encanador", "jardineiro", "serralheiro", "diária", "diaria", "serviço", "servico"] },
  { id: "frete_entrega", keywords: ["frete", "entrega", "transporte"] },
  { id: "locacao_equipamento", keywords: ["aluguel", "locação", "locacao", "andaime", "equipamento"] },
  { id: "taxas_licencas", keywords: ["taxa", "licença", "licenca", "prefeitura", "cartório", "cartorio"] },
  { id: "consumiveis", keywords: ["epi", "parafuso", "cola", "limpeza", "luva", "rolo", "lixa"] }
];

const ETAPAS = [
  { id: "terreno_regularizacao", keywords: ["terreno", "regularização", "regularizacao", "matrícula", "matricula"] },
  { id: "projetos_aprovacoes", keywords: ["projeto", "aprovação", "aprovacao", "alvará", "alvara"] },
  { id: "preparacao_implantacao", keywords: ["limpeza", "demolição", "demolicao", "implantação", "implantacao"] },
  { id: "fundacao", keywords: ["fundação", "fundacao", "sapata", "baldrame", "estaca"] },
  { id: "estrutura", keywords: ["estrutura", "viga", "laje", "pilar"] },
  { id: "alvenaria_vedacoes", keywords: ["alvenaria", "vedação", "vedacao", "tijolo", "bloco"] },
  { id: "cobertura", keywords: ["telhado", "cobertura", "telha"] },
  { id: "esquadrias_vidros", keywords: ["esquadria", "vidro", "janela", "porta"] },
  { id: "eletrica_telecom", keywords: ["elétrica", "eletrica", "telecom", "fio", "cabo"] },
  { id: "hidraulica_sanitaria", keywords: ["hidráulica", "hidraulica", "sanitária", "sanitaria", "tubo", "registro"] },
  { id: "revestimentos", keywords: ["revestimento", "porcelanato", "azulejo", "piso"] },
  { id: "gesso_forros", keywords: ["gesso", "forro", "drywall"] },
  { id: "pintura", keywords: ["pintura", "tinta", "verniz"] },
  { id: "marcenaria", keywords: ["marcenaria", "planejado", "armário", "armario"] },
  { id: "externo_paisagismo", keywords: ["paisagismo", "externo", "jardim"] },
  { id: "pos_obra", keywords: ["pós", "pos", "assistência", "assistencia"] },
  { id: "administracao_financeiro", keywords: ["administrativo", "financeiro", "contábil", "contabil", "banco"] },
  { id: "comercializacao_venda", keywords: ["venda", "comissão", "comissao", "corretor"] }
];

function normalize(text) {
  return (text || "").toLowerCase();
}

function inferFromKeywords(text, options, fallback) {
  const t = normalize(text);
  for (const opt of options) {
    if (opt.keywords.some(k => t.includes(normalize(k)))) return opt.id;
  }
  return fallback;
}

async function getObras() {
  if (OBRA_ID) return [OBRA_ID];
  const snap = await db.collection("obras").get();
  return snap.docs.map(d => d.id);
}

async function migrateObra(obraId) {
  const categoriasSnap = await db.collection("obras").doc(obraId).collection("categorias").get();
  const categorias = new Map(categoriasSnap.docs.map(d => [d.id, d.data()]));

  const lancSnap = await db.collection("obras").doc(obraId).collection("lancamentos").get();
  console.log(`🏗️ ${obraId}: ${lancSnap.size} lançamentos`);

  let updated = 0;
  let batch = db.batch();
  let count = 0;

  for (const docSnap of lancSnap.docs) {
    const data = docSnap.data();
    if (data.etapaId && data.tipoCustoId) continue;

    const categoriaNome = categorias.get(data.categoriaId)?.nome || "";
    const baseText = `${categoriaNome} ${data.descricao || ""}`;

    const tipoCustoId = inferFromKeywords(baseText, TIPOS, "outros");
    const etapaId = inferFromKeywords(baseText, ETAPAS, "administracao_financeiro");

    const update = {
      obraId: data.obraId || obraId,
      etapaId,
      tipoCustoId,
      escopo: data.unidadeId ? "UNIDADE" : "GERAL"
    };

    batch.update(docSnap.ref, update);
    updated++;
    count++;

    if (count >= 400) {
      await batch.commit();
      batch = db.batch();
      count = 0;
      console.log(`✅ ${obraId}: ${updated} atualizados...`);
    }
  }

  if (count > 0) await batch.commit();
  console.log(`✅ ${obraId}: finalizado (${updated} atualizados)`);
}

async function run() {
  const obras = await getObras();
  for (const obraId of obras) {
    await migrateObra(obraId);
  }
  console.log("🎉 Migração concluída.");
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Erro na migração:", err);
  process.exit(1);
});
