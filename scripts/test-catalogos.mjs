import "dotenv/config";
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import { seedCatalogos, listCatalogo, CATALOGO_ETAPAS_SEED, CATALOGO_TIPOS_CUSTO_SEED } from "../catalogos.mjs";
import http from "http";
import https from "https";

const SERVICE_ACCOUNT_PATH = process.env.SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS || "./serviceAccount-new.json";
if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
  const envPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || "(não definido)";
  console.error("❌ Service account não encontrado:", SERVICE_ACCOUNT_PATH);
  console.error("ℹ️ GOOGLE_APPLICATION_CREDENTIALS:", envPath);
  console.error("ℹ️ Dica (Windows): Test-Path <caminho-do-json>");
  console.error("ℹ️ Se não tiver o arquivo, baixe o service account no Firebase e configure GOOGLE_APPLICATION_CREDENTIALS.");
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, "utf8"));
const firebaseApp = initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore(firebaseApp);

const projectId = serviceAccount.project_id || process.env.GOOGLE_CLOUD_PROJECT || "unknown";
const env = process.env.NODE_ENV || "dev";

async function testSeedIdempotente() {
  console.log("🧪 Teste: seed idempotente");
  await seedCatalogos({ db, logger: console, projectId, env });
  const etapas1 = await listCatalogo({ db, collectionName: "catalogo_etapas" });
  const tipos1 = await listCatalogo({ db, collectionName: "catalogo_tipos_custo" });

  await seedCatalogos({ db, logger: console, projectId, env });
  const etapas2 = await listCatalogo({ db, collectionName: "catalogo_etapas" });
  const tipos2 = await listCatalogo({ db, collectionName: "catalogo_tipos_custo" });

  if (etapas1.length !== etapas2.length || tipos1.length !== tipos2.length) {
    throw new Error("Seed não é idempotente: contagens divergentes");
  }

  if (etapas2.length !== CATALOGO_ETAPAS_SEED.length) {
    throw new Error(`Etapas incompletas: ${etapas2.length}`);
  }
  if (tipos2.length !== CATALOGO_TIPOS_CUSTO_SEED.length) {
    throw new Error(`Tipos incompletos: ${tipos2.length}`);
  }

  const ordemEtapas = etapas2.map(e => e.ordem);
  const ordemTipos = tipos2.map(t => t.ordem);
  const isEtapasOrdenado = ordemEtapas.every((v, i, a) => i === 0 || a[i - 1] <= v);
  const isTiposOrdenado = ordemTipos.every((v, i, a) => i === 0 || a[i - 1] <= v);
  if (!isEtapasOrdenado || !isTiposOrdenado) {
    throw new Error("Ordenação por ordem falhou");
  }

  console.log("✅ Seed idempotente OK");
}

async function testEndpoints() {
  const apiBase = process.env.API_BASE || "http://localhost:3001";
  console.log(`🧪 Teste: endpoints (${apiBase})`);
  const getJson = async (url) => {
    if (globalThis.fetch) {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    }

    return new Promise((resolve, reject) => {
      const lib = url.startsWith("https") ? https : http;
      lib.get(url, (res) => {
        const { statusCode } = res;
        let rawData = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => { rawData += chunk; });
        res.on("end", () => {
          if (statusCode && statusCode >= 400) {
            reject(new Error(`HTTP ${statusCode}`));
            return;
          }
          try {
            resolve(JSON.parse(rawData));
          } catch (err) {
            reject(err);
          }
        });
      }).on("error", reject);
    });
  };
  try {
    const [etapasJson, tiposJson] = await Promise.all([
      getJson(`${apiBase}/api/catalogos/etapas`),
      getJson(`${apiBase}/api/catalogos/tipos-custo`)
    ]);

    const etapas = etapasJson.items || [];
    const tipos = tiposJson.items || [];
    if (!Array.isArray(etapas) || !Array.isArray(tipos)) {
      throw new Error("Resposta inválida dos endpoints");
    }

    const isEtapasOrdenado = etapas.every((v, i, a) => i === 0 || (a[i - 1].ordem || 0) <= (v.ordem || 0));
    const isTiposOrdenado = tipos.every((v, i, a) => i === 0 || (a[i - 1].ordem || 0) <= (v.ordem || 0));
    if (!isEtapasOrdenado || !isTiposOrdenado) {
      throw new Error("Endpoints não retornaram ordenado por ordem");
    }

    console.log("✅ Endpoints OK");
  } catch (err) {
    console.error("❌ Falha no teste de endpoints:", err.message || err);
    console.error("   Certifique-se de que a API está rodando em", apiBase);
    process.exit(1);
  }
}

async function run() {
  await testSeedIdempotente();
  await testEndpoints();
  console.log("🎉 Testes mínimos concluídos.");
}

run().catch((err) => {
  console.error("❌ Erro nos testes:", err);
  process.exit(1);
});
