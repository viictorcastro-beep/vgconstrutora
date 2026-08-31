import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  aplicarAcertosNaPosicao,
  calcularTransferenciaEntreSocios,
  MARCO_EQUALIZACAO_ISO,
  numeroFinanceiro,
  registroCriadoDesdeMarco,
  resolverSocioIdPorNomeUnico
} from "../docs/equalizacao.mjs";

const socios = (saldoA, saldoB) => [
  { id: "victor", nome: "Victor", saldo: saldoA },
  { id: "socio", nome: "Sócio", saldo: saldoB }
];

assert.equal(numeroFinanceiro("1.234,56"), 1234.56);
assert.equal(numeroFinanceiro("1000.50"), 1000.5);

assert.equal(
  registroCriadoDesdeMarco({
    createdAt: "2026-08-31T12:06:59.716Z",
    dataCompetencia: "2026-07-07"
  }),
  true,
  "Uma compra criada após o marco entra mesmo com competência retroativa."
);
assert.equal(
  registroCriadoDesdeMarco({
    createdAt: "2026-08-30T23:59:59.999-03:00",
    updatedAt: "2026-08-31T12:00:00.000Z",
    dataCompetencia: "2026-09-01"
  }),
  false,
  "Edição posterior e competência futura não reabrem um registro anterior ao marco."
);
assert.equal(registroCriadoDesdeMarco({ dataCompetencia: "2026-08-31" }), false);
assert.equal(
  registroCriadoDesdeMarco({ createdAt: { seconds: Date.parse(MARCO_EQUALIZACAO_ISO) / 1000 } }),
  true,
  "O Timestamp do Firestore no instante do marco deve ser incluído."
);

const comprasCriadasHoje = [520.69, 115, 104, 229.46, 7.9, 319, 64, 180, 943, 249, 225, 118, 453.1, 600, 133, 530, 63]
  .map((valor, index) => ({
    valor,
    pagador: "B",
    pagadorId: "B",
    pago: true,
    createdAt: `2026-08-31T12:${String(index).padStart(2, "0")}:00.000Z`,
    dataCompetencia: index < 8 ? "2026-07-07" : "2026-08-19"
  }));
const sociosConfigurados = [
  { id: "A", nome: "Gustavo Medeiros", firestoreId: "gustavo-id" },
  { id: "B", nome: "Victor Castro", firestoreId: "victor-id" }
];
const obraAtual = { socioAId: "victor-id", socioBId: "gustavo-id" };
const pagadorReal = sociosConfigurados.find(socio => socio.id === comprasCriadasHoje[0].pagadorId)?.firestoreId;
assert.equal(pagadorReal, obraAtual.socioAId, "O pagador B dos documentos atuais é Victor nesta obra.");
const totalComprasHojeCentavos = [
  ...comprasCriadasHoje,
  { valor: 10000, pagadorId: "B", pago: true, createdAt: "2026-08-30T23:59:59.000-03:00" },
  { valor: 999, pagadorId: "B", pago: false, createdAt: "2026-08-31T15:00:00.000Z" }
]
  .filter(registro => registroCriadoDesdeMarco(registro) && registro.pago !== false)
  .reduce((total, registro) => total + Math.round(registro.valor * 100), 0);
assert.equal(totalComprasHojeCentavos, 485415);
const metadeComprasHoje = totalComprasHojeCentavos / 200;
const transferenciaComprasHoje = calcularTransferenciaEntreSocios([
  { id: "victor-id", nome: "Victor Castro", saldo: metadeComprasHoje },
  { id: "gustavo-id", nome: "Gustavo Medeiros", saldo: -metadeComprasHoje }
]);
assert.equal(transferenciaComprasHoje.de, "gustavo-id");
assert.equal(transferenciaComprasHoje.para, "victor-id");
assert.equal(transferenciaComprasHoje.valor, 2427.08);

const sociosLegados = [
  { id: "gustavo-id", nome: "Gustavo Medeiros" },
  { id: "victor-id", nome: "Victor Castro" }
];
assert.equal(resolverSocioIdPorNomeUnico("Victor", sociosLegados), "victor-id");
assert.equal(resolverSocioIdPorNomeUnico("  gustavo  ", sociosLegados), "gustavo-id");
assert.equal(
  resolverSocioIdPorNomeUnico(
    "Victor",
    [...sociosLegados, { id: "victor-outra-obra", nome: "Victor Silva" }],
    ["gustavo-id", "victor-id"]
  ),
  "victor-id",
  "Homônimo de outra obra não pode invalidar o pagador legado."
);
assert.equal(
  resolverSocioIdPorNomeUnico("Ana", [
    { id: "ana-1", nome: "Ana Costa" },
    { id: "ana-2", nome: "Ana Lima" }
  ]),
  null,
  "Primeiros nomes ambíguos não podem ser resolvidos automaticamente."
);

assert.deepEqual(
  calcularTransferenciaEntreSocios(socios(500, -500)),
  {
    de: "socio",
    deNome: "Sócio",
    para: "victor",
    paraNome: "Victor",
    valor: 500
  }
);

const victorQuitado = aplicarAcertosNaPosicao(500, 0, 500);
const socioQuitado = aplicarAcertosNaPosicao(-500, 500, 0);
assert.equal(calcularTransferenciaEntreSocios(socios(victorQuitado, socioQuitado)), null);

// Depois do acerto anterior, o sócio paga uma nova compra de R$ 200.
// O sentido precisa inverter: Victor passa R$ 100 para o sócio.
const victorAposNovaCompra = aplicarAcertosNaPosicao(400, 0, 500);
const socioAposNovaCompra = aplicarAcertosNaPosicao(-400, 500, 0);
assert.deepEqual(
  calcularTransferenciaEntreSocios(socios(victorAposNovaCompra, socioAposNovaCompra)),
  {
    de: "victor",
    deNome: "Victor",
    para: "socio",
    paraNome: "Sócio",
    valor: 100
  }
);

// Um componente comum não altera a diferença entre os dois sócios.
assert.equal(calcularTransferenciaEntreSocios(socios(100, 100)), null);

const [docsHelper, appHelper, docsIndex, appIndex] = await Promise.all([
  readFile(new URL("../docs/equalizacao.mjs", import.meta.url), "utf8"),
  readFile(new URL("../app/equalizacao.mjs", import.meta.url), "utf8"),
  readFile(new URL("../docs/index.html", import.meta.url), "utf8"),
  readFile(new URL("../app/index.html", import.meta.url), "utf8")
]);
assert.equal(appHelper, docsHelper, "Os helpers de app/ e docs/ precisam permanecer idênticos.");
assert.equal(appIndex, docsIndex, "Os espelhos app/index.html e docs/index.html precisam permanecer idênticos.");
const calculoGlobalInicio = docsIndex.indexOf("async function calcularPosicaoGlobalConsolidada");
const calculoGlobalFim = docsIndex.indexOf("async function calcularEqualizacaoGlobal", calculoGlobalInicio);
assert.ok(calculoGlobalInicio >= 0 && calculoGlobalFim > calculoGlobalInicio, "O cálculo global precisa existir.");
const calculoGlobalFonte = docsIndex.slice(calculoGlobalInicio, calculoGlobalFim);
assert.match(calculoGlobalFonte, /Lançamentos de \$\{obra\.nome \|\| obraId\}`,[\s\S]*?\{ obrigatoria: true \}/);
assert.match(calculoGlobalFonte, /Recebimentos de \$\{obra\.nome \|\| obraId\}`\s*\)/);
assert.doesNotMatch(calculoGlobalFonte, /const recebimentosSnap = await getDocs/);
assert.match(docsIndex, /pagadorId,\s*\n\s*statusPagamento/);
assert.doesNotMatch(docsIndex, /obra\?\.socioAId \?\? ['"]A['"]/);
assert.match(docsIndex, /rateio é neutro para a equalização/);
assert.match(docsIndex, /\$\{incompleto \? `/);
assert.doesNotMatch(docsIndex, /state\.equalizacaoWarnings/);
assert.match(calculoGlobalFonte, /return \{ posicoes, avisos: \[\.\.\.new Set\(avisos\)\] \}/);
assert.match(docsIndex, /Sócios inválidos no acerto/);
assert.match(docsIndex, /Pagador inválido no rateio/);
for (const colecao of ["lancamentos", "recebimentos", "rateios", "acertos", "contasReceber"]) {
  assert.match(
    calculoGlobalFonte,
    new RegExp(`const ${colecao} = \\(await carregarColecao\\([\\s\\S]*?\\)\\)\\.filter\\(registro => registroCriadoDesdeMarco\\(registro\\)\\)`),
    `${colecao} precisa respeitar o marco no cálculo global.`
  );
}
const calculoLocalInicio = docsIndex.indexOf("function computeEqualizacao()");
const calculoLocalFim = docsIndex.indexOf("function getSugestaoEqualizacao", calculoLocalInicio);
const calculoLocalFonte = docsIndex.slice(calculoLocalInicio, calculoLocalFim);
for (const colecao of ["recebimentos", "lancamentos", "rateios", "acertos"]) {
  assert.match(calculoLocalFonte, new RegExp(`state\\.${colecao}\\.filter\\(incluirNoPeriodo\\)\\.forEach`));
}
assert.match(calculoGlobalFonte, /const obraCriadaDesdeMarco = registroCriadoDesdeMarco\(obra\)/);
assert.match(calculoLocalFonte, /const obraCriadaDesdeMarco = registroCriadoDesdeMarco\(obra\)/);
assert.doesNotMatch(docsIndex, /garantirAcertoPendenteQd61Lt32\(\)\.catch/);
assert.doesNotMatch(docsIndex, /migrarEntradaTerrenoQd20Lt2\(\)\.catch/);
assert.match(docsIndex, /const acertosInversos = state\.acertos\.filter\(a =>\s*registroCriadoDesdeMarco\(a\) &&/);
assert.match(docsIndex, /Visão histórica completa/);
assert.match(docsIndex, /dívida entre os sócios é calculada separadamente/);
assert.match(docsIndex, /Equalização a partir de \$\{MARCO_EQUALIZACAO_LABEL\}/);
assert.doesNotMatch(docsIndex, /onclick="migrarProprietariosParaIDs\(\)"/);
const finalizadorInicio = docsIndex.indexOf("async function finalizeMigracaoEqualizacao()");
const finalizadorFim = docsIndex.indexOf("let editandoObraId", finalizadorInicio);
assert.ok(finalizadorInicio >= 0 && finalizadorFim > finalizadorInicio, "O finalizador legado precisa estar delimitado.");
const finalizadorFonte = docsIndex.slice(finalizadorInicio, finalizadorFim);
assert.match(finalizadorFonte, /const recebimentos = recebimentosSnap\.docs[\s\S]*?\.filter\(registro => registroCriadoDesdeMarco\(registro\)\)/);
assert.match(finalizadorFonte, /const acertosExistentes = acertosSnap\.docs[\s\S]*?\.filter\(registro => registroCriadoDesdeMarco\(registro\)\)/);
const balancoHistoricoInicio = docsIndex.indexOf("async function renderBalancoGlobal()");
const balancoHistoricoFim = docsIndex.indexOf("async function finalizeMigracaoEqualizacao()", balancoHistoricoInicio);
const balancoHistoricoFonte = docsIndex.slice(balancoHistoricoInicio, balancoHistoricoFim);
assert.match(balancoHistoricoFonte, /const recebimentos = recebimentosSnap\.docs\.map\(d => \(\{ id: d\.id, \.\.\.d\.data\(\) \}\)\);/);
assert.doesNotMatch(calculoLocalFonte, /\], 0\.99\)/);

console.log("✓ Lógica de equalização validada");
