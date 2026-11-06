/**
 * Formata centavos como moeda brasileira: 2500 -> "R$ 25,00".
 *
 * A conta é feita à mão, sem Intl/toLocaleString, pelo mesmo motivo do
 * front e do agente de impressão: um formatador só, igual nos três, para
 * que valor em mensagem de erro, na tela e no cupom nunca divirjam.
 * (No agente o Intl nem está disponível — ele roda empacotado como .exe,
 * onde só existem os dados de idioma em inglês.)
 */
export function formatarReais(centavos: number): string {
  const arredondado = Math.round(centavos);
  const sinal = arredondado < 0 ? '-' : '';
  const absoluto = Math.abs(arredondado);

  const inteiros = String(Math.floor(absoluto / 100)).replace(
    /\B(?=(\d{3})+(?!\d))/g,
    '.',
  );
  const centavosRestantes = String(absoluto % 100).padStart(2, '0');

  return `${sinal}R$ ${inteiros},${centavosRestantes}`;
}
