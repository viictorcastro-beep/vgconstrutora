import admin from "firebase-admin";
import fs from "fs";

const oldKey = JSON.parse(fs.readFileSync("./serviceAccount-old.json", "utf8"));
const newKey = JSON.parse(fs.readFileSync("./serviceAccount-new.json", "utf8"));

// Inicializa 2 apps Admin (um pra cada projeto)
const oldApp = admin.initializeApp(
  { credential: admin.credential.cert(oldKey) },
  "old"
);
const newApp = admin.initializeApp(
  { credential: admin.credential.cert(newKey) },
  "new"
);

const oldDb = oldApp.firestore();
const newDb = newApp.firestore();

const OBRA_ID = "QD61_LT32";
const UNIDADE_ID = "GERAL";

// coleções que você quer copiar
const collections = ["lancamentos", "acertos", "history"];

async function copyCollection(colName) {
  const snap = await oldDb.collection(colName).get();
  console.log(`\n🔎 ${colName}: ${snap.size} docs`);

  let batch = newDb.batch();
  let countInBatch = 0;
  let totalCopied = 0;

  for (const docSnap of snap.docs) {
    const data = docSnap.data();

    // carimbo para o novo sistema (se não quiser, apague essas 2 linhas)
    data.obraId = data.obraId ?? OBRA_ID;
    data.unidadeId = data.unidadeId ?? UNIDADE_ID;

    const targetRef = newDb.collection(colName).doc(docSnap.id);
    batch.set(targetRef, data, { merge: true });

    countInBatch++;
    totalCopied++;

    // Firestore batch limite: 500
    if (countInBatch === 450) {
      await batch.commit();
      batch = newDb.batch();
      countInBatch = 0;
      console.log(`✅ ${colName}: ${totalCopied}/${snap.size}...`);
    }
  }

  if (countInBatch > 0) await batch.commit();
  console.log(`✅ ${colName}: finalizado (${totalCopied})`);
}

async function copyConfigMain() {
  const ref = oldDb.collection("config").doc("main");
  const snap = await ref.get();
  if (!snap.exists) {
    console.log("\nℹ️ config/main não existe no projeto antigo");
    return;
  }

  const data = snap.data();
  // carimbo opcional
  data.obraId = data.obraId ?? OBRA_ID;

  await newDb.collection("config").doc("main").set(data, { merge: true });
  console.log("✅ config/main copiado");
}

async function run() {
  console.log("🚚 Migrando qd61lt32 → qd20-lt2-a-b ...");

  // 1) coleções
  for (const col of collections) {
    await copyCollection(col);
  }

  // 2) config/main
  await copyConfigMain();

  console.log("\n🎉 Migração concluída.");
  process.exit(0);
}

run().catch((e) => {
  console.error("❌ Erro na migração:", e);
  process.exit(1);
});
