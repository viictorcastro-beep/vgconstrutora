export const CATALOGO_ETAPAS_SEED = [
  { id: "terreno_regularizacao", nome: "Terreno & Regularização", ordem: 1, ativo: true, sistema: true },
  { id: "projetos_aprovacoes", nome: "Projetos & Aprovações", ordem: 2, ativo: true, sistema: true },
  { id: "preparacao_implantacao", nome: "Preparação/Implantação", ordem: 3, ativo: true, sistema: true },
  { id: "fundacao", nome: "Fundação", ordem: 4, ativo: true, sistema: true },
  { id: "estrutura", nome: "Estrutura", ordem: 5, ativo: true, sistema: true },
  { id: "alvenaria_vedacoes", nome: "Alvenaria/Vedações", ordem: 6, ativo: true, sistema: true },
  { id: "cobertura", nome: "Cobertura", ordem: 7, ativo: true, sistema: true },
  { id: "esquadrias_vidros", nome: "Esquadrias/Vidros", ordem: 8, ativo: true, sistema: true },
  { id: "eletrica_telecom", nome: "Elétrica/Telecom", ordem: 9, ativo: true, sistema: true },
  { id: "hidraulica_sanitaria", nome: "Hidráulica/Sanitária", ordem: 10, ativo: true, sistema: true },
  { id: "revestimentos", nome: "Revestimentos", ordem: 11, ativo: true, sistema: true },
  { id: "gesso_forros", nome: "Gesso/Forros", ordem: 12, ativo: true, sistema: true },
  { id: "pintura", nome: "Pintura", ordem: 13, ativo: true, sistema: true },
  { id: "marcenaria", nome: "Marcenaria/Planejados", ordem: 14, ativo: true, sistema: true },
  { id: "externo_paisagismo", nome: "Externo/Paisagismo", ordem: 15, ativo: true, sistema: true },
  { id: "pos_obra", nome: "Pós-obra/Assistência", ordem: 16, ativo: true, sistema: true },
  { id: "administracao_financeiro", nome: "Administração/Financeiro", ordem: 17, ativo: true, sistema: true },
  { id: "comercializacao_venda", nome: "Comercialização/Venda", ordem: 18, ativo: true, sistema: true }
];

export const CATALOGO_TIPOS_CUSTO_SEED = [
  { id: "material", nome: "Material", ordem: 1, ativo: true, sistema: true },
  { id: "mao_obra", nome: "Mão de Obra", ordem: 2, ativo: true, sistema: true },
  { id: "frete_entrega", nome: "Frete/Entrega", ordem: 3, ativo: true, sistema: true },
  { id: "locacao_equipamento", nome: "Locação/Equipamento", ordem: 4, ativo: true, sistema: true },
  { id: "taxas_licencas", nome: "Taxas/Licenças", ordem: 5, ativo: true, sistema: true },
  { id: "consumiveis", nome: "Consumíveis", ordem: 6, ativo: true, sistema: true },
  { id: "outros", nome: "Outros", ordem: 7, ativo: true, sistema: true },
  { id: "aquisicao_terreno", nome: "Aquisição do Terreno", ordem: 8, ativo: true, sistema: true }
];

function normalizeSeedItem(item) {
  return {
    ...item,
    id: String(item.id),
    nome: String(item.nome),
    ordem: Number.isFinite(item.ordem) ? item.ordem : 9999,
    ativo: item.ativo !== false,
    sistema: true
  };
}

export async function seedCatalogos({ db, admin, logger = console, projectId = "unknown", env = "dev" }) {
  logger.log(`🌱 Seed catálogos | project=${projectId} | env=${env}`);

  let createdEtapas = 0;
  let updatedEtapas = 0;
  let createdTipos = 0;
  let updatedTipos = 0;

  for (const etapaRaw of CATALOGO_ETAPAS_SEED) {
    const etapa = normalizeSeedItem(etapaRaw);
    const ref = db.collection("catalogo_etapas").doc(etapa.id);
    const snap = await ref.get();
    if (snap.exists) updatedEtapas++; else createdEtapas++;
    await ref.set({
      ...etapa,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  }

  for (const tipoRaw of CATALOGO_TIPOS_CUSTO_SEED) {
    const tipo = normalizeSeedItem(tipoRaw);
    const ref = db.collection("catalogo_tipos_custo").doc(tipo.id);
    const snap = await ref.get();
    if (snap.exists) updatedTipos++; else createdTipos++;
    await ref.set({
      ...tipo,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  }

  logger.log(`✅ Seed finalizado: etapas (criadas ${createdEtapas}, atualizadas ${updatedEtapas}) | tipos (criadas ${createdTipos}, atualizadas ${updatedTipos})`);
  return {
    createdEtapas,
    updatedEtapas,
    createdTipos,
    updatedTipos
  };
}

export async function listCatalogo({ db, collectionName }) {
  const snap = await db.collection(collectionName).get();
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(item => item.ativo === true)
    .sort((a, b) => {
      const ordemA = Number.isFinite(a.ordem) ? a.ordem : 9999;
      const ordemB = Number.isFinite(b.ordem) ? b.ordem : 9999;
      return ordemA - ordemB;
    });
}
