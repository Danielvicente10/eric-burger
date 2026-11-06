// Horário de atendimento da loja.
//
// A hora é sempre calculada no fuso de Brasília (UTC-3 fixo, o Brasil não
// tem horário de verão desde 2019), e não no relógio do aparelho do
// cliente. Se alguém estiver viajando, com o fuso do celular errado ou com
// o horário automático desligado, o site continua abrindo e fechando junto
// com a loja de verdade.

const FUSO_BRASIL_EM_MS = -3 * 60 * 60 * 1000

export const HORA_ABERTURA = 18

/** Converte um horário do relógio em minutos desde a meia-noite. */
function emMinutos(hora, minuto = 0) {
  return hora * 60 + minuto
}

const ABERTURA_EM_MINUTOS = emMinutos(HORA_ABERTURA)

// Hora em que cada modalidade para de aceitar pedido. Os limites estão em
// minutos porque os fechamentos caem na meia hora — trabalhar com hora
// cheia arredondaria 22h30 pra 22h ou 23h, e cada arredondamento desses é
// meia hora de venda perdida ou meia hora de pedido que a loja não entrega.
//
// TODO: horários herdados da pastelaria como ponto de partida — o cardápio
// da Eric Burger não informa. Confirmar abertura, fechamento e dias.
const SEGUNDA_A_QUINTA = { entrega: emMinutos(22, 30), retirada: emMinutos(23) }
const SEXTA_E_SABADO = { entrega: emMinutos(23), retirada: emMinutos(23, 30) }
const DOMINGO = { entrega: emMinutos(22, 30), retirada: emMinutos(23) }

// Indexado por getUTCDay: 0 = domingo ... 6 = sábado.
const LIMITES_POR_DIA = [
  DOMINGO,
  SEGUNDA_A_QUINTA,
  SEGUNDA_A_QUINTA,
  SEGUNDA_A_QUINTA,
  SEGUNDA_A_QUINTA,
  SEXTA_E_SABADO,
  SEXTA_E_SABADO,
]

/** 1350 vira "22h30"; 1320 vira "22h" — ninguém fala "22h00". */
function porExtenso(minutos) {
  const hora = Math.floor(minutos / 60)
  const minuto = minutos % 60
  return minuto === 0 ? `${hora}h` : `${hora}h${String(minuto).padStart(2, '0')}`
}

/**
 * Diz se a loja aceita pedido agora.
 *
 * `tipoEntrega` pode vir nulo: é o caso de quem ainda está montando o item
 * e nem escolheu entre retirada e entrega. Aí vale a janela mais larga do
 * dia — não faz sentido barrar às 22h05 numa terça alguém que talvez vá
 * retirar no local, o que segue liberado até as 22h30.
 */
export function verificarAtendimento({ tipoEntrega = null, agora = new Date() } = {}) {
  // Rodando local (npm run dev) ou numa prévia publicada com
  // VITE_SEMPRE_ABERTO=true, a loja fica sempre aberta, pra dar pra testar
  // o fluxo inteiro a qualquer hora. No site de verdade vale o horário.
  if (import.meta.env?.DEV || import.meta.env?.VITE_SEMPRE_ABERTO === 'true') {
    return { aberto: true, mensagem: '' }
  }

  const noBrasil = new Date(agora.getTime() + FUSO_BRASIL_EM_MS)
  const dia = noBrasil.getUTCDay()
  const minutosAgora = noBrasil.getUTCHours() * 60 + noBrasil.getUTCMinutes()

  const limites = LIMITES_POR_DIA[dia]

  if (minutosAgora < ABERTURA_EM_MINUTOS) {
    return {
      aberto: false,
      mensagem: `Ainda não abrimos. Começamos o atendimento às ${HORA_ABERTURA}h.`,
    }
  }

  const limite =
    tipoEntrega === 'entrega'
      ? limites.entrega
      : tipoEntrega === 'retirada'
        ? limites.retirada
        : Math.max(limites.entrega, limites.retirada)

  if (minutosAgora < limite) {
    return { aberto: true, mensagem: '' }
  }

  // Entrega fecha antes da retirada. Em vez de só negar, avisa que ainda dá
  // pra buscar no balcão — o pedido não precisa ser perdido por causa disso.
  if (tipoEntrega === 'entrega' && minutosAgora < limites.retirada) {
    return {
      aberto: false,
      mensagem: `As entregas de hoje já encerraram, mas você ainda pode retirar no local até ${porExtenso(limites.retirada)}.`,
    }
  }

  return {
    aberto: false,
    mensagem: `Nosso atendimento de hoje já encerrou. Voltamos amanhã às ${HORA_ABERTURA}h.`,
  }
}
