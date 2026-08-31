import admin from "firebase-admin";
import { existsSync, readFileSync } from "node:fs";

const applyChanges = process.env.APPLY === "1";
const obraId = process.env.OBRA_ID || "QD61_LT32";
const serviceAccountPath = process.env.SERVICE_ACCOUNT_PATH || "./serviceAccount-new.json";
const batchSize = 150; // 3 operações por documento; limite do Firestore = 500.
const runId = new Date().toISOString().replace(/[:.]/g, "-");

if (!existsSync(serviceAccountPath)) {
  throw new Error(`Service account não encontrado em ${serviceAccountPath}`);
}

const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));
const app = admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = app.firestore();

async function moveCollection(collectionName) {
  const source = await db.collection(collectionName).where("obraId", "==", obraId).get();
  console.log(`${collectionName}: ${source.size} documento(s) encontrado(s).`);
  if (source.empty) return;

  const planned = [];
  for (const sourceDoc of source.docs) {
    const data = { ...sourceDoc.data() };
    data.obraId = obraId;
    const destination = db.collection("obras").doc(obraId).collection(collectionName).doc(sourceDoc.id);
    const destinationSnap = await destination.get();
    if (destinationSnap.exists) {
      throw new Error(`Conflito: ${destination.path} já existe. Nada foi sobrescrito.`);
    }
    planned.push({ sourceDoc, destination, data });
  }

  console.log(`${collectionName}: plano validado sem conflitos (${applyChanges ? "APLICAR" : "DRY-RUN"}).`);
  if (!applyChanges) return;

  for (let offset = 0; offset < planned.length; offset += batchSize) {
    const chunk = planned.slice(offset, offset + batchSize);
    const batch = db.batch();
    for (const item of chunk) {
      const backup = db.collection("migrationBackups").doc(runId)
        .collection(`${collectionName}_${obraId}`).doc(item.sourceDoc.id);
      batch.set(backup, {
        ...item.sourceDoc.data(),
        sourcePath: item.sourceDoc.ref.path,
        backedUpAt: admin.firestore.FieldValue.serverTimestamp()
      });
      batch.create(item.destination, item.data);
      batch.delete(item.sourceDoc.ref);
    }
    await batch.commit();
    console.log(`${collectionName}: ${Math.min(offset + chunk.length, planned.length)}/${planned.length}.`);
  }
}

async function main() {
  console.log(`Migração para obras/${obraId} — ${applyChanges ? "MODO APLICAÇÃO" : "DRY-RUN"}.`);
  if (!applyChanges) console.log("Nenhuma escrita será feita. Use APPLY=1 somente após revisar este plano.");
  for (const collectionName of ["lancamentos", "acertos", "history"]) {
    await moveCollection(collectionName);
  }
  console.log(applyChanges ? `Migração concluída. Backup: migrationBackups/${runId}.` : "Dry-run concluído.");
}

main()
  .catch(err => {
    console.error("Falha na migração:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await app.delete();
  });
