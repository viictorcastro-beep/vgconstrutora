import "dotenv/config";
import admin from "firebase-admin";
import fs from "fs";

const SERVICE_ACCOUNT_PATH = process.env.SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS || "./serviceAccount-new.json";
if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
  const envPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || "(não definido)";
  console.error("❌ Service account não encontrado:", SERVICE_ACCOUNT_PATH);
  console.error("ℹ️ GOOGLE_APPLICATION_CREDENTIALS:", envPath);
  console.error("ℹ️ Dica (Windows): Test-Path <caminho-do-json>");
  console.error("ℹ️ Se não tiver o arquivo, baixe o service account no Firebase e configure GOOGLE_APPLICATION_CREDENTIALS.");
  process.exit(1);
}
const key = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, "utf8"));
admin.initializeApp({ credential: admin.credential.cert(key) });
const db = admin.firestore();

const OBRA_ID = process.env.OBRA_ID;
if (!OBRA_ID) {
  console.error("❌ Informe OBRA_ID no ambiente.");
  process.exit(1);
}

async function run() {
  const etapasSnap = await db.collection("catalogo_etapas").get();
  const tiposSnap = await db.collection("catalogo_tipos_custo").get();

  const etapasIds = new Set(etapasSnap.docs.map(d => d.id));
  const tiposIds = new Set(tiposSnap.docs.map(d => d.id));

  if (etapasSnap.size < 18) {
    console.error("❌ Catálogo de etapas incompleto:", etapasSnap.size);
    process.exit(1);
  }
  if (tiposSnap.size < 7) {
    console.error("❌ Catálogo de tipos incompleto:", tiposSnap.size);
    process.exit(1);
  }

  const unidadesSnap = await db.collection("obras").doc(OBRA_ID).collection("unidades").get();
  const unidadesIds = new Set(unidadesSnap.docs.map(d => d.id));

  const lancSnap = await db.collection("obras").doc(OBRA_ID).collection("lancamentos").get();
  let invalidEtapa = 0;
  let invalidTipo = 0;
  let invalidUnidade = 0;

  for (const doc of lancSnap.docs) {
    const data = doc.data();
    if (!etapasIds.has(data.etapaId)) invalidEtapa++;
    if (!tiposIds.has(data.tipoCustoId)) invalidTipo++;
    if (data.unidadeId && !unidadesIds.has(data.unidadeId)) invalidUnidade++;
  }

  console.log("✅ Catálogos OK");
  console.log(`✅ Lançamentos analisados: ${lancSnap.size}`);
  console.log(`• inválidos etapaId: ${invalidEtapa}`);
  console.log(`• inválidos tipoCustoId: ${invalidTipo}`);
  console.log(`• unidadeId inválida: ${invalidUnidade}`);

  if (invalidEtapa || invalidTipo || invalidUnidade) {
    process.exit(1);
  }

  console.log("🎉 Testes mínimos concluídos.");
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Erro nos testes:", err);
  process.exit(1);
});
