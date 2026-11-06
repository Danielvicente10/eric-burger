// Formatação de números no padrão brasileiro.
//
// Existe porque o site inteiro usava `.toFixed(2)`, que sempre devolve
// ponto decimal: os preços apareciam como "R$ 30.00" em vez de "R$ 30,00".
// Passa despercebido em revisão de código e salta aos olhos do cliente.
//
// A conta é feita à mão, e não com Intl/toLocaleString, para bater exatamente
// com o formato do cupom impresso — o agente de impressão roda empacotado
// como .exe, onde o Intl não tem os dados de português e cai calado no
// formato americano. Um formato só, dos dois lados.

/** Ex.: 30 → "30,00" · 1234.5 → "1.234,50" */
export function formatarValor(valorEmReais) {
  const emCentavos = Math.round(valorEmReais * 100)
  const sinal = emCentavos < 0 ? '-' : ''
  const absoluto = Math.abs(emCentavos)

  const inteiros = String(Math.floor(absoluto / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  const centavos = String(absoluto % 100).padStart(2, '0')

  return `${sinal}${inteiros},${centavos}`
}

/** Ex.: 1.9 → "1,9" · 3 → "3,0" */
export function formatarKm(km) {
  return Number(km).toFixed(1).replace('.', ',')
}
