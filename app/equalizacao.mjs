export const MARCO_EQUALIZACAO_ISO = "2026-08-31T03:00:00.000Z";
export const MARCO_EQUALIZACAO_LABEL = "31/08/2026";

export function numeroFinanceiro(valor) {
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : 0;
  if (typeof valor !== "string") return 0;

  const texto = valor.trim();
  if (!texto) return 0;

  const normalizado = texto.includes(",")
    ? texto.replace(/\./g, "").replace(",", ".")
    : texto;
  const numero = Number(normalizado);
  return Number.isFinite(numero) ? numero : 0;
}

export function arredondarMoeda(valor) {
  const numero = numeroFinanceiro(valor);
  return Math.round((numero + (numero >= 0 ? 1e-9 : -1e-9)) * 100) / 100;
}

export function distribuirValor(valor, itens) {
  const totalCentavos = Math.round(numeroFinanceiro(valor) * 100);
  const pesos = (Array.isArray(itens) ? itens : [])
    .map(item => ({ ...item, peso: Math.max(0, numeroFinanceiro(item?.peso)) }))
    .filter(item => item.id && item.peso > 0);
  const somaPesos = pesos.reduce((soma, item) => soma + item.peso, 0);
  if (totalCentavos <= 0 || somaPesos <= 0) return [];

  const calculados = pesos.map((item, index) => {
    const exato = (totalCentavos * item.peso) / somaPesos;
    return { ...item, index, centavos: Math.floor(exato), resto: exato - Math.floor(exato) };
  });
  let residuo = totalCentavos - calculados.reduce((soma, item) => soma + item.centavos, 0);
  [...calculados]
    .sort((a, b) => b.resto - a.resto || a.index - b.index)
    .forEach(item => {
      if (residuo <= 0) return;
      item.centavos += 1;
      residuo -= 1;
    });
  return calculados.map(item => ({ id: item.id, valor: item.centavos / 100 }));
}

function nomeComparavel(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase("pt-BR");
}

export function resolverPercentuaisSocios({
  percentualA = null,
  percentualB = null,
  victorPercent = null,
  gustavoPercent = null,
  socioANome = "",
  socioBNome = ""
} = {}) {
  const percentualNominal = (nome, fallback) => {
    const comparavel = nomeComparavel(nome);
    if (/\bgustavo\b/.test(comparavel) && gustavoPercent != null) return gustavoPercent;
    if (/\b(?:victor|vitor)\b/.test(comparavel) && victorPercent != null) return victorPercent;
    return fallback;
  };

  return {
    percentualA: Math.max(0, numeroFinanceiro(
      percentualA ?? percentualNominal(socioANome, victorPercent) ?? 50
    )),
    percentualB: Math.max(0, numeroFinanceiro(
      percentualB ?? percentualNominal(socioBNome, gustavoPercent) ?? 50
    ))
  };
}

export function criarAlocacoesRecebimento({
  valor,
  socioAId,
  socioBId,
  alocacoes = null,
  percentualA = null,
  percentualB = null,
  victorPercent = null,
  gustavoPercent = null,
  socioANome = socioAId,
  socioBNome = socioBId
}) {
  const total = arredondarMoeda(valor);
  if (total <= 0 || !socioAId) return [];

  const explicitas = (Array.isArray(alocacoes) ? alocacoes : [])
    .map(item => ({ id: item?.socioId, peso: numeroFinanceiro(item?.valor) }))
    .filter(item => item.id && item.peso > 0);
  if (explicitas.length > 0) {
    return distribuirValor(total, explicitas)
      .map(item => ({ socioId: item.id, valor: item.valor }));
  }

  if (!socioBId) return [{ socioId: socioAId, valor: total }];

  const percentuais = resolverPercentuaisSocios({
    percentualA,
    percentualB,
    victorPercent,
    gustavoPercent,
    socioANome,
    socioBNome
  });
  const pesoA = percentuais.percentualA;
  const pesoB = percentuais.percentualB;
  const pesos = pesoA + pesoB > 0
    ? [{ id: socioAId, peso: pesoA }, { id: socioBId, peso: pesoB }]
    : [{ id: socioAId, peso: 50 }, { id: socioBId, peso: 50 }];

  return distribuirValor(total, pesos)
    .map(item => ({ socioId: item.id, valor: item.valor }));
}

export function valorRateioPago(rateio) {
  if (!rateio || rateio.pago === false) return 0;
  const status = String(rateio.status || "").trim().toLocaleLowerCase("pt-BR");
  if (status && !["pago", "quitado", "recebido"].includes(status)) return 0;

  const distribuicao = Array.isArray(rateio.distribuicao)
    ? rateio.distribuicao.reduce((soma, item) => soma + numeroFinanceiro(item?.valor), 0)
    : 0;
  const declarado = arredondarMoeda(rateio.valorTotal);
  return arredondarMoeda(declarado > 0 ? declarado : distribuicao);
}

export function calcularCenario50a50({ socioAId, socioBId, custos = [], recebimentos = [], acertos = [] }) {
  if (!socioAId || !socioBId || socioAId === socioBId) {
    throw new Error("Informe dois sócios diferentes para calcular a equalização.");
  }

  let pagoA = 0;
  let pagoB = 0;
  let devePagarA = 0;
  let devePagarB = 0;
  for (const custo of custos) {
    if (custo?.pago === false) continue;
    const valor = arredondarMoeda(custo?.valor);
    if (valor <= 0) continue;
    const { percentualA: pesoA, percentualB: pesoB } = resolverPercentuaisSocios({
      ...custo,
      socioANome: socioAId,
      socioBNome: socioBId
    });
    const somaPesos = pesoA + pesoB || 100;
    const custoA = valor * ((pesoA + pesoB > 0 ? pesoA : 50) / somaPesos);
    const custoB = valor * ((pesoA + pesoB > 0 ? pesoB : 50) / somaPesos);
    devePagarA += custoA;
    devePagarB += custoB;
    if (custo.pagadorId === socioAId) pagoA += valor;
    else if (custo.pagadorId === socioBId) pagoB += valor;
    else if (custo.pagadorId === "AMBOS") {
      pagoA += custoA;
      pagoB += custoB;
    }
  }

  let recebidoA = 0;
  let recebidoB = 0;
  let direitoA = 0;
  let direitoB = 0;
  for (const recebimento of recebimentos) {
    const valor = arredondarMoeda(recebimento?.valor);
    if (valor <= 0) continue;
    if (recebimento.recebidoPor === socioAId) recebidoA += valor;
    else if (recebimento.recebidoPor === socioBId) recebidoB += valor;
    else if (recebimento.recebidoPor === "AMBOS") {
      const partes = distribuirValor(valor, [{ id: socioAId, peso: 1 }, { id: socioBId, peso: 1 }]);
      recebidoA += partes.find(item => item.id === socioAId)?.valor || 0;
      recebidoB += partes.find(item => item.id === socioBId)?.valor || 0;
    }
    const alocacoes = criarAlocacoesRecebimento({
      valor,
      socioAId,
      socioBId,
      alocacoes: recebimento?.alocacoes,
      percentualA: recebimento?.percentualA,
      percentualB: recebimento?.percentualB,
      victorPercent: recebimento?.victorPercent,
      gustavoPercent: recebimento?.gustavoPercent,
      socioANome: socioAId,
      socioBNome: socioBId
    });
    direitoA += alocacoes.find(item => item.socioId === socioAId)?.valor || 0;
    direitoB += alocacoes.find(item => item.socioId === socioBId)?.valor || 0;
  }

  let saldoA = (pagoA - devePagarA) - (recebidoA - direitoA);
  let saldoB = (pagoB - devePagarB) - (recebidoB - direitoB);

  for (const acerto of acertos) {
    if (acerto?.considerarNaEqualizacao !== true) continue;
    const valor = arredondarMoeda(acerto?.valor);
    if (valor <= 0 || acerto.de === acerto.para) continue;
    if (acerto.de === socioAId && acerto.para === socioBId) {
      saldoA += valor;
      saldoB -= valor;
    } else if (acerto.de === socioBId && acerto.para === socioAId) {
      saldoB += valor;
      saldoA -= valor;
    }
  }

  saldoA = arredondarMoeda(saldoA);
  saldoB = arredondarMoeda(saldoB);
  return {
    saldoA,
    saldoB,
    transferencia: calcularTransferenciaEntreSocios([
      { id: socioAId, nome: socioAId, saldo: saldoA },
      { id: socioBId, nome: socioBId, saldo: saldoB }
    ], 0)
  };
}

function instanteEmMilissegundos(valor) {
  if (valor == null) return Number.NaN;
  if (typeof valor?.toMillis === "function") return valor.toMillis();
  if (typeof valor?.toDate === "function") return valor.toDate().getTime();
  if (valor instanceof Date) return valor.getTime();
  if (typeof valor === "object" && Number.isFinite(Number(valor.seconds))) {
    return (Number(valor.seconds) * 1000) + (Number(valor.nanoseconds || 0) / 1e6);
  }
  const data = new Date(valor);
  return data.getTime();
}

export function registroCriadoDesdeMarco(registro, marcoIso = MARCO_EQUALIZACAO_ISO) {
  const criadoEm = instanteEmMilissegundos(registro?.createdAt);
  const marco = instanteEmMilissegundos(marcoIso);
  return Number.isFinite(criadoEm) && Number.isFinite(marco) && criadoEm >= marco;
}

export function aplicarAcertosNaPosicao(posicaoBruta, acertosPago, acertosRecebido) {
  return numeroFinanceiro(posicaoBruta)
    + numeroFinanceiro(acertosPago)
    - numeroFinanceiro(acertosRecebido);
}

export function resolverSocioIdPorNomeUnico(valor, socios, idsPermitidos = null) {
  if (valor == null || !Array.isArray(socios)) return null;
  const busca = String(valor).trim().toLocaleLowerCase("pt-BR");
  if (!busca) return null;
  const permitidos = Array.isArray(idsPermitidos)
    ? new Set(idsPermitidos.filter(Boolean).map(String))
    : null;

  const ids = new Set(
    socios
      .filter(socio => {
        const id = socio?.firestoreId || socio?.firestoreID || socio?.uid || socio?.id;
        if (!id || (permitidos && !permitidos.has(String(id)))) return false;
        const nome = String(socio?.nome || "").trim().toLocaleLowerCase("pt-BR");
        const primeiroNome = nome.split(/\s+/)[0];
        return nome === busca || primeiroNome === busca;
      })
      .map(socio => socio.firestoreId || socio.firestoreID || socio.uid || socio.id)
      .filter(Boolean)
      .map(String)
  );

  return ids.size === 1 ? [...ids][0] : null;
}

export function calcularTransferenciaEntreSocios(socios, tolerancia = 0.0049) {
  if (!Array.isArray(socios) || socios.length !== 2) {
    throw new Error("A equalização exige exatamente dois sócios.");
  }

  const [socioA, socioB] = socios;
  const saldoA = numeroFinanceiro(socioA.saldo);
  const saldoB = numeroFinanceiro(socioB.saldo);

  // Remove qualquer componente comum e mantém somente a diferença entre os
  // dois sócios. Em um conjunto perfeitamente fechado, isso equivale ao saldo A.
  const saldoRelativoA = (saldoA - saldoB) / 2;
  if (Math.abs(saldoRelativoA) <= tolerancia) return null;
  const valorTransferencia = Math.round((Math.abs(saldoRelativoA) + 1e-9) * 100) / 100;

  if (saldoRelativoA > 0) {
    return {
      de: socioB.id,
      deNome: socioB.nome,
      para: socioA.id,
      paraNome: socioA.nome,
      valor: valorTransferencia
    };
  }

  return {
    de: socioA.id,
    deNome: socioA.nome,
    para: socioB.id,
    paraNome: socioB.nome,
    valor: valorTransferencia
  };
}
