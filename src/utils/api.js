// Cliente HTTP pro backend (NestJS). Só tem essa função por enquanto —
// criar o pedido é a única chamada que o front faz pro backend.

const BASE_URL = import.meta.env.VITE_API_URL

// Timeout generoso: no plano gratuito (Render free), se o backend estiver
// "dormindo" por falta de uso, a primeira requisição do dia pode levar até
// ~1 minuto pra acordar o servidor. Preferimos esperar a mais a mostrar erro
// à toa pro cliente.
const TIMEOUT_MS = 70_000

export class ErroPedido extends Error {
  constructor(mensagem, tipo) {
    super(mensagem)
    this.tipo = tipo // 'timeout' | 'rede' | 'validacao' | 'servidor'
  }
}

// Envia o pedido pro backend. Lança ErroPedido com um "tipo" que o front usa
// pra decidir qual mensagem mostrar pro cliente.
export async function criarPedidoNoBackend(payload) {
  if (!BASE_URL) {
    throw new ErroPedido('VITE_API_URL não configurada no front.', 'servidor')
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

  let resposta
  try {
    resposta = await fetch(`${BASE_URL}/pedidos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
  } catch (erro) {
    if (erro.name === 'AbortError') {
      throw new ErroPedido(
        'O sistema demorou demais pra responder. Isso pode acontecer quando ele fica um tempo sem uso — tente novamente em alguns segundos.',
        'timeout',
      )
    }
    throw new ErroPedido('Não foi possível conectar ao sistema. Confira sua internet e tente novamente.', 'rede')
  } finally {
    clearTimeout(timeoutId)
  }

  if (!resposta.ok) {
    if (resposta.status >= 400 && resposta.status < 500) {
      const corpo = await resposta.json().catch(() => null)
      const mensagem = corpo?.message
        ? Array.isArray(corpo.message)
          ? corpo.message.join(' ')
          : corpo.message
        : 'Não foi possível enviar o pedido. Confira os dados e tente novamente.'
      throw new ErroPedido(mensagem, 'validacao')
    }
    throw new ErroPedido('O sistema encontrou um problema ao registrar seu pedido. Tente novamente em instantes.', 'servidor')
  }

  return resposta.json()
}

// Prévia do valor da entrega, chamada enquanto o cliente ainda preenche o
// endereço (antes de confirmar o pedido). Mesmo tratamento de erro de
// criarPedidoNoBackend, mas sem timeout gigante — se o backend estiver
// "dormindo", preferimos deixar o cálculo de frete falhar rápido e deixar
// o cliente tentar de novo, a travar a tela de checkout por 1 minuto.
const TIMEOUT_FRETE_MS = 20_000

export async function calcularFreteNoBackend(endereco) {
  if (!BASE_URL) {
    throw new ErroPedido('VITE_API_URL não configurada no front.', 'servidor')
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_FRETE_MS)

  let resposta
  try {
    resposta = await fetch(`${BASE_URL}/pedidos/calcular-frete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(endereco),
      signal: controller.signal,
    })
  } catch (erro) {
    if (erro.name === 'AbortError') {
      throw new ErroPedido('Não foi possível calcular a entrega agora. Tente novamente.', 'timeout')
    }
    throw new ErroPedido('Não foi possível calcular a entrega. Confira sua internet.', 'rede')
  } finally {
    clearTimeout(timeoutId)
  }

  if (!resposta.ok) {
    const corpo = await resposta.json().catch(() => null)
    const mensagem = corpo?.message || 'Não foi possível calcular a entrega pra esse endereço.'
    throw new ErroPedido(mensagem, 'validacao')
  }

  return resposta.json()
}
