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

export function aplicarAcertosNaPosicao(posicaoBruta, acertosPago, acertosRecebido) {
  return numeroFinanceiro(posicaoBruta)
    + numeroFinanceiro(acertosPago)
    - numeroFinanceiro(acertosRecebido);
}

export function calcularTransferenciaEntreSocios(socios, tolerancia = 0.01) {
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

  if (saldoRelativoA > 0) {
    return {
      de: socioB.id,
      deNome: socioB.nome,
      para: socioA.id,
      paraNome: socioA.nome,
      valor: Math.abs(saldoRelativoA)
    };
  }

  return {
    de: socioA.id,
    deNome: socioA.nome,
    para: socioB.id,
    paraNome: socioB.nome,
    valor: Math.abs(saldoRelativoA)
  };
}
