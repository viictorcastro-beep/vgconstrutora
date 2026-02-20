import "dotenv/config";
import admin from "firebase-admin";
import fs from "fs";
import { seedCatalogos } from "../catalogos.mjs";

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
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const projectId = serviceAccount.project_id || process.env.GOOGLE_CLOUD_PROJECT || "unknown";
const env = process.env.NODE_ENV || "dev";

seedCatalogos({ db, admin, logger: console, projectId, env })
  .then(() => {
    console.log("✅ Seed concluído com sucesso");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Seed falhou:", err);
    process.exit(1);
  });
