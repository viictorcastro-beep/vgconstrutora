import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  aplicarAcertosNaPosicao,
  calcularTransferenciaEntreSocios,
  numeroFinanceiro,
  resolverSocioIdPorNomeUnico
} from "../docs/equalizacao.mjs";

const socios = (saldoA, saldoB) => [
  { id: "victor", nome: "Victor", saldo: saldoA },
  { id: "socio", nome: "Sócio", saldo: saldoB }
];

assert.equal(numeroFinanceiro("1.234,56"), 1234.56);
assert.equal(numeroFinanceiro("1000.50"), 1000.5);

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

console.log("✓ Lógica de equalização validada");
