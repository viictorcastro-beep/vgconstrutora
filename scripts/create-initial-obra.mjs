import { cert, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";

// Conectar ao projeto novo
const newServiceAccount = JSON.parse(readFileSync("./serviceAccount-new.json", "utf8"));
const newApp = initializeApp({
  credential: cert(newServiceAccount),
}, "new");

const newDb = getFirestore(newApp);

async function createInitialObra() {
  try {
    console.log("🏗️ Criando obra QD61_LT32...");
    
    const obraRef = newDb.collection("obras").doc("QD61_LT32");
    
    await obraRef.set({
      nome: "QD61 LT32 (Migrado)",
      endereco: "QD 61 LT 32",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });
    
    console.log("✅ Obra criada com sucesso!");
    
    // Criar unidade GERAL se não existir
    const unidadeRef = obraRef.collection("unidades").doc("GERAL");
    
    await unidadeRef.set({
      nome: "GERAL",
      areaConstruida: 0,
      createdAt: FieldValue.serverTimestamp()
    });
    
    console.log("✅ Unidade GERAL criada!");
    console.log("\n🎉 Obra e unidade iniciais prontas!");
    
  } catch (err) {
    console.error("❌ Erro:", err);
  } finally {
    process.exit(0);
  }
}

createInitialObra();
