import { useState } from 'react'
import { formatarValor } from './utils/formato.js'
import Cardapio from './components/Cardapio.jsx'
import ModalProduto from './components/ModalProduto.jsx'
import Sacola from './components/Sacola.jsx'
import Checkout from './components/Checkout.jsx'
import logoLoja from './assets/logo-eric-burger.png'
import { NOME_LOJA, SUBTITULO_LOJA, NUMERO_WHATSAPP } from './data/loja.js'
import {
  montarMensagem,
  montarLinkWhatsapp,
  montarPayloadPedido,
  montarDescricaoPagamento,
  calcularTotalPedido,
  calcularTotalItens,
} from './utils/pedido.js'
import { dinheiroParaNumero } from './utils/mascaras.js'
import { verificarAtendimento } from './utils/horario.js'
import { criarPedidoNoBackend } from './utils/api.js'

const ENDERECO_VAZIO = { cep: '', rua: '', numero: '', bairro: '', complemento: '', referencia: '' }

export default function App() {
  const [tela, setTela] = useState('cardapio') // 'cardapio' | 'sacola' | 'checkout'
  const [sacola, setSacola] = useState([])
  const [modal, setModal] = useState(null) // { item, editIndex? }
  const [dados, setDados] = useState({
    nomeCliente: '',
    telefone: '',
    tipoEntrega: 'retirada',
    endereco: ENDERECO_VAZIO,
    pagamento: '',
    // null = ainda não respondeu. Só valem quando o pagamento é Dinheiro.
    precisaTroco: null,
    trocoPara: '',
  })
  const [erro, setErro] = useState('')
  const [pedidoEnviado, setPedidoEnviado] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [frete, setFrete] = useState(null)

  function abrirModalNovoItem(item) {
    setModal({ item })
  }

  function abrirModalEdicao(index) {
    setModal({ item: sacola[index].item, editIndex: index })
  }

  function fecharModal() {
    setModal(null)
  }

  function confirmarModal(dadosItem) {
    if (modal.editIndex !== undefined) {
      setSacola((atual) =>
        atual.map((it, i) =>
          i === modal.editIndex
            ? { ...it, ...dadosItem, chave: it.chave }
            : it
        )
      )
    } else {
      setSacola((atual) => [
        ...atual,
        { ...dadosItem, chave: `${dadosItem.item.id}-${Date.now()}-${Math.random()}` },
      ])
    }
    setModal(null)
  }

  function removerItem(index) {
    setSacola((atual) => atual.filter((_, i) => i !== index))
  }

  function validar() {
    if (sacola.length === 0) return 'Adicione ao menos um item à sacola.'

    // Segunda checagem de horário. A do modal do produto usa a janela mais
    // larga do dia, porque lá o tipo de entrega ainda não foi escolhido —
    // é aqui que a diferença entre entrega e retirada passa a valer.
    const atendimento = verificarAtendimento({ tipoEntrega: dados.tipoEntrega })
    if (!atendimento.aberto) return atendimento.mensagem
    if (!dados.nomeCliente.trim()) return 'Informe seu nome.'
    // 10 dígitos = fixo com DDD, 11 = celular. Aceita os dois: nem todo
    // cliente informa celular, e o telefone serve pra loja ligar se faltar
    // alguma informação do pedido.
    const digitosTelefone = dados.telefone.replace(/\D/g, '').length
    if (digitosTelefone < 10 || digitosTelefone > 11) {
      return 'Informe seu telefone com DDD — a loja usa pra falar com você se precisar.'
    }
    if (!dados.pagamento) return 'Escolha a forma de pagamento.'

    if (dados.pagamento === 'Dinheiro') {
      if (dados.precisaTroco === null) return 'Informe se você precisa de troco.'

      if (dados.precisaTroco === true) {
        const valorTroco = dinheiroParaNumero(dados.trocoPara)
        if (!valorTroco) return 'Informe com quanto você vai pagar, pra separarmos o troco.'

        // Comparar com o total evita o caso em que o entregador chega com
        // troco separado pra menos do que a conta.
        const totalPedido =
          calcularTotalPedido(sacola) +
          (dados.tipoEntrega === 'entrega' && frete?.status === 'ok' ? frete.taxaCentavos / 100 : 0)

        if (valorTroco < totalPedido) {
          return `O valor precisa ser pelo menos o total do pedido (R$ ${formatarValor(totalPedido)}).`
        }
      }
    }
    if (dados.tipoEntrega === 'entrega') {
      // O CEP é obrigatório: é ele que localiza o endereço pro cálculo da
      // distância. Sem ele a busca cairia no nome da rua dentro da cidade da loja
      // e um endereço de cidade vizinha com rua homônima sairia mais barato.
      // O backend recusa igual — aqui é só pra avisar antes de enviar.
      if (dados.endereco.cep.replace(/\D/g, '').length !== 8) {
        return 'Informe o CEP completo — é por ele que calculamos a entrega.'
      }
      if (!dados.endereco.rua.trim() || !dados.endereco.numero.trim() || !dados.endereco.bairro.trim()) {
        return 'Preencha rua, número e bairro para entrega.'
      }
      // Checagem defensiva — o botão já fica desabilitado nesse caso, isso
      // aqui só cobre o caso de o clique escapar por algum motivo.
      if (!frete || frete.status !== 'ok') {
        return 'Aguarde o cálculo da taxa de entrega antes de confirmar.'
      }
    }
    return ''
  }

  async function enviarPedido() {
    const mensagemErro = validar()
    if (mensagemErro) {
      setErro(mensagemErro)
      return
    }
    setErro('')
    setEnviando(true)

    try {
      // Primeiro o pedido vai pro backend — é isso que grava no banco e
      // manda pra impressora da loja. O WhatsApp abre só depois, como uma
      // cópia/recibo opcional pro cliente; a impressão não depende dele.
      const payload = montarPayloadPedido({ dados, sacola })
      const pedidoCriado = await criarPedidoNoBackend(payload)

      const mensagem = montarMensagem({
        idPedido: pedidoCriado.codigo,
        nomeCliente: dados.nomeCliente,
        telefone: dados.telefone,
        sacola,
        tipoEntrega: dados.tipoEntrega,
        endereco: dados.endereco,
        pagamento: montarDescricaoPagamento(dados),
        // Valores de verdade, recalculados no backend — não os que o
        // Checkout mostrou como prévia.
        taxaEntregaCentavos: pedidoCriado.taxaEntregaCentavos,
        totalCentavos: pedidoCriado.totalCentavos,
        trocoParaCentavos: pedidoCriado.trocoParaCentavos,
      })
      const link = montarLinkWhatsapp(NUMERO_WHATSAPP, mensagem)
      window.open(link, '_blank')
      setPedidoEnviado(true)
    } catch (erroPedido) {
      setErro(erroPedido.message || 'Não foi possível enviar seu pedido. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  const totalItens = calcularTotalItens(sacola)

  return (
    <div className="app">
      <header className="topo">
        <div className="topo-linha">
          <div className="topo-marca">
            <img src={logoLoja} alt={`${NOME_LOJA} Delivery`} className="topo-logo" />
            <h1>{NOME_LOJA}</h1>
          </div>
          {/* O selo "Aberto agora" foi removido por enquanto: era fixo, então
              aparecia mesmo com a loja fechada. Os estilos (.topo-status e
              .bolinha-status, em index.css) continuam lá pra quando ele voltar
              ligado ao horário de funcionamento de verdade. */}
        </div>
        <p className="topo-tradicao">{SUBTITULO_LOJA}</p>
        <p>Monte seu pedido e envie direto pro nosso WhatsApp</p>
      </header>

      <main className="conteudo">
        {tela === 'cardapio' && <Cardapio onSelecionarItem={abrirModalNovoItem} />}

        {tela === 'sacola' && (
          <Sacola
            sacola={sacola}
            onEditarItem={abrirModalEdicao}
            onRemoverItem={removerItem}
            onContinuarComprando={() => setTela('cardapio')}
            onIrParaEntrega={() => setTela('checkout')}
          />
        )}

        {tela === 'checkout' && (
          <Checkout
            sacola={sacola}
            dados={dados}
            onMudar={(m) => setDados((atual) => ({ ...atual, ...m }))}
            erro={erro}
            enviando={enviando}
            onVoltarSacola={() => setTela('sacola')}
            onConfirmar={enviarPedido}
            onFreteMudou={setFrete}
          />
        )}
      </main>

      {tela === 'cardapio' && sacola.length > 0 && (
        <button type="button" className="barra-carrinho" onClick={() => setTela('sacola')}>
          <span className="barra-carrinho-itens">
            🛍️ {totalItens} {totalItens === 1 ? 'item' : 'itens'}
          </span>
          <span className="barra-carrinho-total">
            R$ {formatarValor(calcularTotalPedido(sacola))} · Ver sacola
          </span>
        </button>
      )}

      {modal && (
        <ModalProduto
          item={modal.item}
          itemSacolaExistente={modal.editIndex !== undefined ? sacola[modal.editIndex] : undefined}
          onFechar={fecharModal}
          onConfirmar={confirmarModal}
        />
      )}

      {pedidoEnviado && (
        <div className="modal-fundo" role="dialog" aria-modal="true" aria-label="Pedido enviado">
          <div className="modal-caixa modal-confirmacao">
            <div className="modal-conteudo">
              <p className="confirmacao-emoji" aria-hidden="true">🍔✅</p>
              <h2>Pedido enviado!</h2>
              <p>Abrimos o WhatsApp com seu pedido pronto para enviar. Se não abriu automaticamente, confira se seu navegador bloqueou a nova aba.</p>
            </div>
            <div className="modal-rodape">
              <button
                type="button"
                className="btn-primario"
                onClick={() => {
                  setSacola([])
                  setDados({
                    nomeCliente: '',
                    telefone: '',
                    tipoEntrega: 'retirada',
                    endereco: ENDERECO_VAZIO,
                    pagamento: '',
                    precisaTroco: null,
                    trocoPara: '',
                  })
                  setFrete(null)
                  setPedidoEnviado(false)
                  setTela('cardapio')
                }}
              >
                Fazer novo pedido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
