import { ENDERECO_LOJA, NOME_LOJA } from '../data/loja.js'
import { formatarValor } from './formato.js'
import { dinheiroParaNumero } from './mascaras.js'

// Descrição do pagamento que vai pro cupom e pro WhatsApp.
//
// Quando há troco, o valor NÃO entra aqui: ele viaja no campo
// trocoParaCentavos e ganha seção própria no cupom, com o troco já
// calculado sobre o total oficial. Repetir o valor nesta linha só faria
// ela quebrar em duas na bobina de 58mm e dizer duas vezes a mesma coisa.
//
// O "(sem troco)" fica, porque não existe número pra carregar essa
// informação — e ela é útil: avisa o entregador que não precisa levar
// dinheiro trocado.
export function montarDescricaoPagamento({ pagamento, precisaTroco }) {
  if (pagamento === 'Dinheiro' && precisaTroco === false) return 'Dinheiro (sem troco)'
  return pagamento
}

// O código do pedido (ex: "12-A7K") é gerado pelo backend, em
// backend/src/pedidos/codigo-pedido.util.ts — é ele a fonte única, pra que
// o número mostrado ao cliente seja exatamente o que ficou salvo no banco.

// Preço base de um item da sacola (considera variante, se houver)
export function precoBaseItem(itemSacola) {
  if (itemSacola.variante) return itemSacola.variante.preco
  return itemSacola.item.preco
}

// Calcula o preço unitário (base + acréscimos) de um item da sacola
export function calcularPrecoUnitario(itemSacola) {
  const precoAcrescimos = itemSacola.acrescimos.reduce((soma, a) => soma + a.preco, 0)
  return precoBaseItem(itemSacola) + precoAcrescimos
}

// Calcula o preço total de um item da sacola (unitário * quantidade)
export function calcularPrecoItem(itemSacola) {
  return calcularPrecoUnitario(itemSacola) * itemSacola.quantidade
}

export function calcularTotalPedido(sacola) {
  return sacola.reduce((soma, itemSacola) => soma + calcularPrecoItem(itemSacola), 0)
}

export function calcularTotalItens(sacola) {
  return sacola.reduce((soma, itemSacola) => soma + itemSacola.quantidade, 0)
}

// Monta a mensagem final formatada para o WhatsApp.
// taxaEntregaCentavos/totalCentavos vêm da resposta do backend (fonte da
// verdade, já recalculada no servidor) — não são recalculados aqui.
export function montarMensagem({
  idPedido,
  nomeCliente,
  telefone,
  sacola,
  tipoEntrega,
  endereco,
  pagamento,
  taxaEntregaCentavos = 0,
  totalCentavos,
  trocoParaCentavos,
}) {
  const linhas = []

  linhas.push(`🍔 *NOVO PEDIDO - ${NOME_LOJA.toUpperCase()}*`)
  linhas.push(`📦 Pedido: ${idPedido}`)
  linhas.push('')
  linhas.push(`👤 Cliente: ${nomeCliente}`)
  if (telefone) linhas.push(`📱 Telefone: ${telefone}`)
  linhas.push('')
  linhas.push(`📋 *Itens:*`)

  sacola.forEach((itemSacola) => {
    const varianteLabel = itemSacola.variante ? ` (${itemSacola.variante.nome})` : ''
    linhas.push(
      `${itemSacola.quantidade}x ${itemSacola.item.nome}${varianteLabel} — R$ ${formatarValor(precoBaseItem(itemSacola))} cada`
    )
    itemSacola.acrescimos.forEach((a) => {
      linhas.push(`   + ${a.nome} (R$ ${formatarValor(a.preco)})`)
    })
    if (itemSacola.observacao) {
      linhas.push(`   Obs: ${itemSacola.observacao}`)
    }
    linhas.push(`   Subtotal: R$ ${formatarValor(calcularPrecoItem(itemSacola))}`)
  })

  linhas.push('')
  if (tipoEntrega === 'entrega') {
    linhas.push(`🚚 Entrega`)
    if (endereco.cep) linhas.push(`   CEP: ${endereco.cep}`)
    linhas.push(`📍 ${endereco.rua}, ${endereco.numero} - Bairro ${endereco.bairro}`)
    if (endereco.complemento) linhas.push(`   Complemento: ${endereco.complemento}`)
    if (endereco.referencia) linhas.push(`   Referência: ${endereco.referencia}`)
  } else {
    linhas.push(`🏪 Retirada no local`)
    linhas.push(`📍 ${ENDERECO_LOJA}`)
  }

  linhas.push('')
  linhas.push(`💳 Pagamento: ${pagamento}`)
  linhas.push('')
  linhas.push(`Subtotal: R$ ${formatarValor(calcularTotalPedido(sacola))}`)
  if (tipoEntrega === 'entrega' && taxaEntregaCentavos > 0) {
    linhas.push(`Taxa de entrega: R$ ${formatarValor(taxaEntregaCentavos / 100)}`)
  }
  const total = totalCentavos != null ? totalCentavos / 100 : calcularTotalPedido(sacola)
  linhas.push(`💰 *Total: R$ ${formatarValor(total)}*`)

  // O troco sai da mesma conta que o cupom impresso faz — os dois partem do
  // total devolvido pelo backend, então nunca divergem.
  if (trocoParaCentavos != null) {
    linhas.push('')
    linhas.push(`💵 Paga com: R$ ${formatarValor(trocoParaCentavos / 100)}`)
    linhas.push(`🔄 *Troco: R$ ${formatarValor(trocoParaCentavos / 100 - total)}*`)
  }

  return linhas.join('\n')
}

// Monta o link wa.me com a mensagem já codificada
export function montarLinkWhatsapp(numeroDono, mensagem) {
  const texto = encodeURIComponent(mensagem)
  return `https://wa.me/${numeroDono}?text=${texto}`
}

// Converte a sacola (shape usado no front) pro payload que o backend espera
// em POST /pedidos. O backend recalcula todos os preços a partir só dos ids
// e quantidade — nenhum valor em reais é enviado daqui.
export function montarPayloadPedido({ dados, sacola }) {
  return {
    nomeCliente: dados.nomeCliente,
    telefone: dados.telefone || undefined,
    tipoEntrega: dados.tipoEntrega,
    endereco: dados.tipoEntrega === 'entrega' ? dados.endereco : undefined,
    pagamento: montarDescricaoPagamento(dados),
    trocoParaCentavos:
      dados.pagamento === 'Dinheiro' && dados.precisaTroco === true
        ? Math.round(dinheiroParaNumero(dados.trocoPara) * 100) || undefined
        : undefined,
    itens: sacola.map((itemSacola) => ({
      itemCardapioId: itemSacola.item.id,
      varianteId: itemSacola.variante?.id,
      quantidade: itemSacola.quantidade,
      acrescimosIds: itemSacola.acrescimos.map((a) => a.id),
      observacao: itemSacola.observacao || undefined,
    })),
  }
}
