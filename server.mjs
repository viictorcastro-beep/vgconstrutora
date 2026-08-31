import "dotenv/config";
import express from "express";
import fs from "fs";
import path from "path";
import { applicationDefault, cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { seedCatalogos, listCatalogo } from "./catalogos.mjs";

const app = express();
app.use(express.json());
const allowedOrigins = new Set(
  (process.env.ALLOWED_ORIGINS || "https://viictorcastro-beep.github.io,http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001")
    .split(",")
    .map(value => value.trim())
    .filter(Boolean)
);
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization,X-Admin-Token");
  if (req.method === "OPTIONS") {
    return !origin || allowedOrigins.has(origin) ? res.sendStatus(204) : res.sendStatus(403);
  }
  next();
});

const ENV_CREDENTIALS_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const SERVICE_ACCOUNT_PATH = process.env.SERVICE_ACCOUNT_PATH || "./serviceAccount-new.json";

let firebaseApp;
if (ENV_CREDENTIALS_PATH) {
  if (!fs.existsSync(ENV_CREDENTIALS_PATH)) {
    console.error("❌ Service account não encontrado:", ENV_CREDENTIALS_PATH);
    console.error("ℹ️ GOOGLE_APPLICATION_CREDENTIALS:", ENV_CREDENTIALS_PATH);
    console.error("ℹ️ Dica (Windows): Test-Path <caminho-do-json>");
    console.error("ℹ️ Se não tiver o arquivo, baixe o service account no Firebase e configure GOOGLE_APPLICATION_CREDENTIALS.");
    process.exit(1);
  }
  firebaseApp = initializeApp({ credential: applicationDefault() });
} else {
  if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    console.error("❌ Service account não encontrado:", SERVICE_ACCOUNT_PATH);
    console.error("ℹ️ GOOGLE_APPLICATION_CREDENTIALS: (não definido)");
    console.error("ℹ️ Dica (Windows): Test-Path <caminho-do-json>");
    console.error("ℹ️ Se não tiver o arquivo, baixe o service account no Firebase e configure GOOGLE_APPLICATION_CREDENTIALS.");
    process.exit(1);
  }
  const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, "utf8"));
  firebaseApp = initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);
const allowedEmails = new Set([
  "viictor.castro@gmail.com",
  "gcm.conceicao@gmail.com"
]);

function canAccessObra(user, obra) {
  if (user?.email === "viictor.castro@gmail.com") return true;
  const usuarios = Array.isArray(obra?.usuarios) ? obra.usuarios : [];
  return usuarios.some(item => item?.email === user?.email);
}

app.use("/api", async (req, res, next) => {
  try {
    const authorization = String(req.headers.authorization || "");
    const match = authorization.match(/^Bearer\s+(.+)$/i);
    if (!match) return res.status(401).json({ error: "authentication_required" });
    const decoded = await auth.verifyIdToken(match[1]);
    if (!decoded.email_verified || !allowedEmails.has(decoded.email)) {
      return res.status(403).json({ error: "forbidden" });
    }
    req.user = decoded;
    next();
  } catch (err) {
    console.warn("Token Firebase inválido:", err?.code || err?.message || "unknown");
    res.status(401).json({ error: "invalid_token" });
  }
});

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

function numeroFinanceiro(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string") return 0;
  const text = value.trim();
  if (!text) return 0;
  const normalized = text.includes(",")
    ? text.replace(/\./g, "").replace(",", ".")
    : text;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getLancamentoDate(l, modoData) {
  if (modoData === "pagamento") return l.dataPagamento || null;
  return l.dataCompetencia || l.data || null;
}

app.get("/api/catalogos/etapas", async (req, res) => {
  try {
    const etapas = await listCatalogo({ db, collectionName: "catalogo_etapas" });
    if (etapas.length === 0) {
      return res.status(503).json({ error: "catalogo_etapas_empty" });
    }
    res.json({ items: etapas });
  } catch (err) {
    console.error("❌ Erro /api/catalogos/etapas:", err);
    res.status(500).json({ error: "catalogo_etapas_error" });
  }
});

app.get("/api/catalogos/tipos-custo", async (req, res) => {
  try {
    const tipos = await listCatalogo({ db, collectionName: "catalogo_tipos_custo" });
    if (tipos.length === 0) {
      return res.status(503).json({ error: "catalogo_tipos_custo_empty" });
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
    const counts = await seedCatalogos({ db, logger: console, ...getSeedContext() });
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
    if (!canAccessObra(req.user, obraSnap.data())) {
      return res.status(403).json({ error: "obra_forbidden" });
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
      return res.status(503).json({ error: "catalogos_empty" });
    }

    const etapas = etapasCatalogo;
    const tipos = tiposCatalogo;

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
      const valor = numeroFinanceiro(l.valor);

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

    const geral = lancs.reduce((sum, l) => sum + numeroFinanceiro(l.valor), 0);
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

app.listen(PORT, () => {
  console.log(`🚀 API VG Construtora rodando na porta ${PORT}`);
});
