import admin from "firebase-admin";
import { readFileSync } from "fs";

const serviceAccount = JSON.parse(readFileSync("./serviceAccount-new.json", "utf8"));
const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = app.firestore();

async function checkObras() {
  try {
    console.log("🔍 Verificando coleção 'obras'...\n");
    
    const obrasSnap = await db.collection("obras").get();
    
    if (obrasSnap.empty) {
      console.log("❌ Nenhuma obra encontrada!");
      console.log("\n🔧 Criando obra QD61_LT32...\n");
      
      await db.collection("obras").doc("QD61_LT32").set({
        nome: "QD61 LT32 (Migrado)",
        endereco: "QD 61 LT 32",
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log("✅ Obra criada!");
      
      await db.collection("obras").doc("QD61_LT32").collection("unidades").doc("GERAL").set({
        nome: "GERAL",
        areaConstruida: 0,
        createdAt: new Date()
      });
      
      console.log("✅ Unidade GERAL criada!");
    } else {
      console.log(`✅ Encontradas ${obrasSnap.size} obra(s):\n`);
      
      obrasSnap.forEach(doc => {
        const data = doc.data();
        console.log(`📁 ID: ${doc.id}`);
        console.log(`   Nome: ${data.nome || 'N/A'}`);
        console.log(`   Endereço: ${data.endereco || 'N/A'}`);
        console.log(`   CreatedAt: ${data.createdAt?.toDate?.() || data.createdAt || 'N/A'}\n`);
      });
    }
    
  } catch (err) {
    console.error("❌ Erro:", err.message);
  } finally {
    process.exit(0);
  }
}

checkObras();
