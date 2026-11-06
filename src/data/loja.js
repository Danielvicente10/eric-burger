// Informações fixas da loja — usadas no topo do site, na tela de retirada e
// na mensagem do WhatsApp. Tudo que muda de um cliente pra outro fica aqui.

export const NOME_LOJA = 'Eric Burger'
export const SUBTITULO_LOJA = 'Hambúrguer artesanal · Delivery'

// WhatsApp da loja: (19) 99248-1217 — o mesmo que está no cardápio.
// Formato exigido pelo link wa.me: DDI 55 + DDD + número, sem espaço nem
// símbolo. Se este número estiver errado, os pedidos abrem a conversa com
// a pessoa errada e o cliente nem percebe.
export const NUMERO_WHATSAPP = '5519992481217'

// TODO: endereço da loja não aparece no cardápio — pedir à Eric Burger.
// Também precisa ir pro backend (backend/src/pedidos/frete/frete.service.ts).
export const ENDERECO_LOJA = 'Endereço da loja a confirmar'
