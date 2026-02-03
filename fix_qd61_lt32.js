// Script para corrigir obra QD61 LT32
// Copie e cole este código no console do navegador (F12) quando estiver logado no site

async function fixObraQD61() {
  console.log("🔧 Iniciando correção da obra QD61 LT32...");
  
  const obraId = "QD61_LT32";
  
  try {
    // 1. Atualizar dados da obra
    const obraRef = doc(db, "obras", obraId);
    await updateDoc(obraRef, {
      endereco: "QD 61 LT 32",
      dataInicio: "2025-10-12",
      socioA: "Victor Castro",
      socioB: "Gustavo Medeiros",
      investimentoA: 0,
      investimentoB: 0
    });
    console.log("✅ Dados da obra atualizados");
    
    // 2. Criar a unidade UNICA
    const unidadesCol = collection(db, "obras", obraId, "unidades");
    const unidadeRef = await addDoc(unidadesCol, {
      nome: "UNICA",
      areaConstruida: 0,
      proprietario: "ambos",
      vgv: 0,
      venda: 0,
      createdAt: new Date(),
      createdBy: auth.currentUser?.email || "admin"
    });
    console.log("✅ Unidade UNICA criada com ID:", unidadeRef.id);
    
    // 3. Verificar lançamentos existentes
    const lancamentosCol = collection(db, "obras", obraId, "lancamentos");
    const lancamentosSnap = await getDocs(lancamentosCol);
    console.log(`📊 Encontrados ${lancamentosSnap.size} lançamentos na obra`);
    
    // 4. Se houver lançamentos sem unidadeId, vincular à nova unidade
    let updated = 0;
    for (const lancDoc of lancamentosSnap.docs) {
      const lanc = lancDoc.data();
      if (!lanc.unidadeId) {
        await updateDoc(doc(db, "obras", obraId, "lancamentos", lancDoc.id), {
          unidadeId: unidadeRef.id
        });
        updated++;
      }
    }
    
    if (updated > 0) {
      console.log(`✅ ${updated} lançamentos vinculados à unidade UNICA`);
    }
    
    console.log("🎉 Correção concluída! Recarregue a página.");
    alert("✅ Obra QD61 LT32 corrigida com sucesso! Recarregue a página (F5).");
    
  } catch (error) {
    console.error("❌ Erro ao corrigir obra:", error);
    alert("❌ Erro: " + error.message);
  }
}

// Executar
fixObraQD61();
