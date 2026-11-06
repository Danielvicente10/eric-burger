// Código do pedido no formato "12-A7K": o número sequencial do dia (o que
// o balcão usa pra saber que é o 12º pedido de hoje) seguido de 3 caracteres
// sorteados.
//
// O sufixo aleatório existe por um motivo específico: sem ele, sabendo que
// seu pedido é o 12, qualquer um adivinha que existem o 11 e o 13 e poderia
// tentar retirar o pedido de outra pessoa no balcão. Com o sufixo, o número
// continua legível e curto, mas não dá pra deduzir o código do vizinho.
// (Pela API não haveria risco — o código não é usado pra consultar nem
// alterar nada; as rotas de leitura/alteração pedem a chave do agente de
// impressão e usam o id interno. O risco é presencial mesmo.)

// Sem O/0, I/1 e L pra não confundir na hora de ler o cupom impresso.
const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

const TAMANHO_SUFIXO = 3;

function sortearSufixo(): string {
  let sufixo = '';
  for (let i = 0; i < TAMANHO_SUFIXO; i++) {
    sufixo += ALFABETO[Math.floor(Math.random() * ALFABETO.length)];
  }
  return sufixo;
}

/** Monta o código a partir da posição do pedido no dia. Ex: 12 -> "12-A7K". */
export function montarCodigoPedido(sequenciaDoDia: number): string {
  return `${sequenciaDoDia}-${sortearSufixo()}`;
}

/**
 * Instante em que começou o dia atual no fuso de Brasília.
 *
 * Importa porque em produção (Render) o servidor roda em UTC: usar a
 * meia-noite do servidor faria a contagem "do dia" zerar às 21h no horário
 * de Brasília — no meio do movimento da lanchonete.
 *
 * O Brasil não tem horário de verão desde 2019, então UTC-3 é fixo.
 */
export function inicioDoDiaNoBrasil(agora: Date = new Date()): Date {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(agora);
  const [ano, mes, dia] = partes.split('-').map(Number);
  // Meia-noite em São Paulo = 03:00 UTC do mesmo dia.
  return new Date(Date.UTC(ano, mes - 1, dia, 3, 0, 0, 0));
}
