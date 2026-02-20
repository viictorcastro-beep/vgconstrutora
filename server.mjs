import "dotenv/config";
import express from "express";
import fs from "fs";
import path from "path";
import admin from "firebase-admin";
import { seedCatalogos, listCatalogo } from "./catalogos.mjs";

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

const ENV_CREDENTIALS_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const SERVICE_ACCOUNT_PATH = process.env.SERVICE_ACCOUNT_PATH || "./serviceAccount-new.json";

if (ENV_CREDENTIALS_PATH) {
  if (!fs.existsSync(ENV_CREDENTIALS_PATH)) {
    console.error("❌ Service account não encontrado:", ENV_CREDENTIALS_PATH);
    console.error("ℹ️ GOOGLE_APPLICATION_CREDENTIALS:", ENV_CREDENTIALS_PATH);
    console.error("ℹ️ Dica (Windows): Test-Path <caminho-do-json>");
    console.error("ℹ️ Se não tiver o arquivo, baixe o service account no Firebase e configure GOOGLE_APPLICATION_CREDENTIALS.");
    process.exit(1);
  }
  admin.initializeApp({ credential: admin.credential.applicationDefault() });
} else {
  if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    console.error("❌ Service account não encontrado:", SERVICE_ACCOUNT_PATH);
    console.error("ℹ️ GOOGLE_APPLICATION_CREDENTIALS: (não definido)");
    console.error("ℹ️ Dica (Windows): Test-Path <caminho-do-json>");
    console.error("ℹ️ Se não tiver o arquivo, baixe o service account no Firebase e configure GOOGLE_APPLICATION_CREDENTIALS.");
    process.exit(1);
  }
  const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, "utf8"));
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();

function getSeedContext() {
  return {
    projectId: process.env.GOOGLE_CLOUD_PROJECT || "unknown",
    env: process.env.NODE_ENV || "dev"
  };
}

function requireAdminToken(req, res) {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) {
    res.status(501).json({ error: "admin_token_not_configured" });
    return false;
  }
  const received = req.headers["x-admin-token"];
  if (!received || received !== expected) {
    res.status(403).json({ error: "forbidden" });
    return false;
  }
  return true;
}

function parseDate(value) {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getLancamentoDate(l, modoData) {
  if (modoData === "pagamento") return l.dataPagamento || null;
  return l.dataCompetencia || l.data || null;
}

app.get("/api/catalogos/etapas", async (req, res) => {
  try {
    let etapas = await listCatalogo({ db, collectionName: "catalogo_etapas" });
    if (etapas.length === 0) {
      console.warn("⚠️ Catálogo de etapas vazio. Rodando seed...");
      await seedCatalogos({ db, admin, logger: console, ...getSeedContext() });
      etapas = await listCatalogo({ db, collectionName: "catalogo_etapas" });
    }
    if (etapas.length === 0) {
      console.error("❌ Catálogo de etapas segue vazio após seed");
      return res.status(500).json({ error: "catalogo_etapas_empty" });
    }
    res.json({ items: etapas });
  } catch (err) {
    console.error("❌ Erro /api/catalogos/etapas:", err);
    res.status(500).json({ error: "catalogo_etapas_error" });
  }
});

app.get("/api/catalogos/tipos-custo", async (req, res) => {
  try {
    let tipos = await listCatalogo({ db, collectionName: "catalogo_tipos_custo" });
    if (tipos.length === 0) {
      console.warn("⚠️ Catálogo de tipos vazio. Rodando seed...");
      await seedCatalogos({ db, admin, logger: console, ...getSeedContext() });
      tipos = await listCatalogo({ db, collectionName: "catalogo_tipos_custo" });
    }
    if (tipos.length === 0) {
      console.error("❌ Catálogo de tipos segue vazio após seed");
      return res.status(500).json({ error: "catalogo_tipos_custo_empty" });
    }
    res.json({ items: tipos });
  } catch (err) {
    console.error("❌ Erro /api/catalogos/tipos-custo:", err);
    res.status(500).json({ error: "catalogo_tipos_custo_error" });
  }
});

app.get("/api/health/catalogos", async (req, res) => {
  try {
    const etapas = await listCatalogo({ db, collectionName: "catalogo_etapas" });
    const tipos = await listCatalogo({ db, collectionName: "catalogo_tipos_custo" });
    const ok = etapas.length > 0 && tipos.length > 0;
    res.status(ok ? 200 : 500).json({
      etapasCount: etapas.length,
      tiposCount: tipos.length,
      ok
    });
  } catch (err) {
    console.error("❌ Erro /api/health/catalogos:", err);
    res.status(500).json({ etapasCount: 0, tiposCount: 0, ok: false });
  }
});

app.post("/api/admin/catalogos/seed", async (req, res) => {
  if (!requireAdminToken(req, res)) return;
  try {
    const counts = await seedCatalogos({ db, admin, logger: console, ...getSeedContext() });
    const etapas = await listCatalogo({ db, collectionName: "catalogo_etapas" });
    const tipos = await listCatalogo({ db, collectionName: "catalogo_tipos_custo" });
    res.json({
      counts,
      etapasCount: etapas.length,
      tiposCount: tipos.length
    });
  } catch (err) {
    console.error("❌ Erro /api/admin/catalogos/seed:", err);
    res.status(500).json({ error: "seed_error" });
  }
});

app.get("/api/dashboard/custos", async (req, res) => {
  try {
    const obraId = req.query.obraId;
    const unidadeId = req.query.unidadeId || "all";
    const modoData = req.query.modoData || "competencia";
    const dtIni = parseDate(req.query.dtIni);
    const dtFim = parseDate(req.query.dtFim);

    if (!obraId) {
      return res.status(400).json({ error: "obraId_required" });
    }

    const obraRef = db.collection("obras").doc(String(obraId));
    const obraSnap = await obraRef.get();
    if (!obraSnap.exists) {
      return res.status(404).json({ error: "obra_not_found" });
    }

    if (unidadeId !== "all") {
      const unidSnap = await obraRef.collection("unidades").doc(String(unidadeId)).get();
      if (!unidSnap.exists) {
        return res.status(400).json({ error: "unidade_invalid" });
      }
    }

    let lancSnap = await obraRef.collection("lancamentos").get();
    let lancs = lancSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    lancs = lancs.filter(l => !l.isAcerto && !l.acerto && l.tipo !== "ACERTO");

    if (modoData === "pagamento") {
      lancs = lancs.filter(l => !!l.dataPagamento);
    }

    if (unidadeId !== "all") {
      lancs = lancs.filter(l => l.unidadeId === unidadeId);
    }

    if (dtIni || dtFim) {
      lancs = lancs.filter(l => {
        const data = getLancamentoDate(l, modoData);
        if (!data) return false;
        const dataObj = new Date(data);
        if (dtIni && dataObj < dtIni) return false;
        if (dtFim && dataObj > dtFim) return false;
        return true;
      });
    }

    const etapasCatalogo = await listCatalogo({ db, collectionName: "catalogo_etapas" });
    const tiposCatalogo = await listCatalogo({ db, collectionName: "catalogo_tipos_custo" });

    if (etapasCatalogo.length === 0 || tiposCatalogo.length === 0) {
      console.warn("⚠️ Catálogos vazios no dashboard. Rodando seed...");
      await seedCatalogos({ db, admin, logger: console, ...getSeedContext() });
    }

    const etapas = etapasCatalogo.length ? etapasCatalogo : await listCatalogo({ db, collectionName: "catalogo_etapas" });
    const tipos = tiposCatalogo.length ? tiposCatalogo : await listCatalogo({ db, collectionName: "catalogo_tipos_custo" });

    const tiposIds = tipos.map(t => t.id);
    const totaisPorTipo = {};
    tiposIds.forEach(id => { totaisPorTipo[id] = 0; });

    const etapasMap = {};
    etapas.forEach(e => {
      etapasMap[e.id] = {
        etapaId: e.id,
        etapaNome: e.nome,
        total: 0,
        porTipo: { ...totaisPorTipo },
        material: 0,
        mao_obra: 0,
        outros: 0
      };
    });

    const fallbackEtapaId = "administracao_financeiro";
    const fallbackTipoId = "outros";

    lancs.forEach(l => {
      const etapaId = etapasMap[l.etapaId] ? l.etapaId : fallbackEtapaId;
      const tipoId = tiposIds.includes(l.tipoCustoId) ? l.tipoCustoId : fallbackTipoId;
      const valor = Number(l.valor || 0);

      if (!etapasMap[etapaId]) {
        etapasMap[etapaId] = {
          etapaId,
          etapaNome: etapaId,
          total: 0,
          porTipo: { ...totaisPorTipo },
          material: 0,
          mao_obra: 0,
          outros: 0
        };
      }

      etapasMap[etapaId].total += valor;
      etapasMap[etapaId].porTipo[tipoId] = (etapasMap[etapaId].porTipo[tipoId] || 0) + valor;
      totaisPorTipo[tipoId] = (totaisPorTipo[tipoId] || 0) + valor;
    });

    const porEtapa = Object.values(etapasMap).filter(e => e.total > 0);
    porEtapa.forEach(e => {
      e.material = e.porTipo.material || 0;
      e.mao_obra = e.porTipo.mao_obra || 0;
      e.outros = e.total - e.material - e.mao_obra;
    });

    const geral = lancs.reduce((sum, l) => sum + Number(l.valor || 0), 0);
    const material = totaisPorTipo.material || 0;
    const mao_obra = totaisPorTipo.mao_obra || 0;
    const outros = geral - material - mao_obra;

    res.json({
      filtros: {
        obraId,
        unidadeId,
        dtIni: req.query.dtIni || null,
        dtFim: req.query.dtFim || null,
        modoData
      },
      totais: {
        geral,
        porTipo: totaisPorTipo,
        material,
        mao_obra,
        outros
      },
      porEtapa: porEtapa.map(e => ({
        etapaId: e.etapaId,
        etapaNome: e.etapaNome,
        total: e.total,
        porTipo: e.porTipo,
        material: e.material,
        mao_obra: e.mao_obra,
        outros: e.outros
      }))
    });
  } catch (err) {
    console.error("❌ Erro /api/dashboard/custos:", err);
    res.status(500).json({ error: "dashboard_custos_error" });
  }
});

const PORT = process.env.PORT || 3001;

(async () => {
  try {
    await seedCatalogos({ db, admin, logger: console, ...getSeedContext() });
    const etapas = await listCatalogo({ db, collectionName: "catalogo_etapas" });
    const tipos = await listCatalogo({ db, collectionName: "catalogo_tipos_custo" });
    console.log(`✅ catalogos ok: etapas=${etapas.length} tipos=${tipos.length}`);

    app.listen(PORT, () => {
      console.log(`🚀 API VG Construtora rodando na porta ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Seed falhou. Encerrando.", err);
    process.exit(1);
  }
})();
