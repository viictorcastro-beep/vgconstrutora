import admin from "firebase-admin";
import { readFileSync } from "fs";

const serviceAccount = JSON.parse(readFileSync("./serviceAccount-new.json", "utf8"));
const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = app.firestore();

async function moveDataToObra() {
  try {
    const OBRA_ID = "QD61_LT32";
    const BATCH_SIZE = 450;
    
    console.log(`🚚 Movendo dados para obras/${OBRA_ID}/...\n`);
    
    // Mover lancamentos
    const lancsSnap = await db.collection("lancamentos").where("obraId", "==", OBRA_ID).get();
    console.log(`📦 Encontrados ${lancsSnap.size} lançamentos`);
    
    if (lancsSnap.size > 0) {
      let batch = db.batch();
      let count = 0;
      
      for (const doc of lancsSnap.docs) {
        const data = doc.data();
        delete data.obraId; // Remove campo, já está no path
        
        const newRef = db.collection("obras").doc(OBRA_ID).collection("lancamentos").doc(doc.id);
        batch.set(newRef, data);
        
        // Delete old
        batch.delete(doc.ref);
        
        count++;
        if (count % BATCH_SIZE === 0) {
          await batch.commit();
          console.log(`  ✅ ${count}/${lancsSnap.size}...`);
          batch = db.batch();
        }
      }
      
      if (count % BATCH_SIZE !== 0) {
        await batch.commit();
      }
      console.log(`✅ lancamentos movidos (${lancsSnap.size})\n`);
    }
    
    // Mover acertos
    const acertosSnap = await db.collection("acertos").where("obraId", "==", OBRA_ID).get();
    console.log(`📦 Encontrados ${acertosSnap.size} acertos`);
    
    if (acertosSnap.size > 0) {
      let batch = db.batch();
      let count = 0;
      
      for (const doc of acertosSnap.docs) {
        const data = doc.data();
        delete data.obraId;
        
        const newRef = db.collection("obras").doc(OBRA_ID).collection("acertos").doc(doc.id);
        batch.set(newRef, data);
        batch.delete(doc.ref);
        
        count++;
        if (count % BATCH_SIZE === 0) {
          await batch.commit();
          console.log(`  ✅ ${count}/${acertosSnap.size}...`);
          batch = db.batch();
        }
      }
      
      if (count % BATCH_SIZE !== 0) {
        await batch.commit();
      }
      console.log(`✅ acertos movidos (${acertosSnap.size})\n`);
    }
    
    // Mover history
    const historySnap = await db.collection("history").where("obraId", "==", OBRA_ID).get();
    console.log(`📦 Encontrados ${historySnap.size} registros de history`);
    
    if (historySnap.size > 0) {
      let batch = db.batch();
      let count = 0;
      
      for (const doc of historySnap.docs) {
        const data = doc.data();
        delete data.obraId;
        
        const newRef = db.collection("obras").doc(OBRA_ID).collection("history").doc(doc.id);
        batch.set(newRef, data);
        batch.delete(doc.ref);
        
        count++;
        if (count % BATCH_SIZE === 0) {
          await batch.commit();
          console.log(`  ✅ ${count}/${historySnap.size}...`);
          batch = db.batch();
        }
      }
      
      if (count % BATCH_SIZE !== 0) {
        await batch.commit();
      }
      console.log(`✅ history movido (${historySnap.size})\n`);
    }
    
    console.log("🎉 Dados reorganizados com sucesso!");
    
  } catch (err) {
    console.error("❌ Erro:", err);
  } finally {
    process.exit(0);
  }
}

moveDataToObra();
