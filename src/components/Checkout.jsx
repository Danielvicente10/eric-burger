import { useEffect, useState } from 'react'
import { calcularPrecoItem, calcularTotalPedido } from '../utils/pedido.js'
import {
  formatarTelefone,
  formatarCep,
  formatarDinheiro,
  dinheiroParaNumero,
  buscarEnderecoPorCep,
} from '../utils/mascaras.js'
import { formatarValor, formatarKm } from '../utils/formato.js'
import { calcularFreteNoBackend } from '../utils/api.js'
import { ENDERECO_LOJA } from '../data/loja.js'

const FORMAS_PAGAMENTO = ['Pix', 'Dinheiro', 'Cartão de crédito', 'Cartão de débito']
const LINK_BUSCA_CEP = 'https://buscacepinter.correios.com.br/app/endereco/index.php'

// Estimativa de preparo mostrada ao cliente antes de confirmar. Num lugar
// só, pra ser ajuste de uma linha quando mudar.
// TODO: tempos herdados da pastelaria — confirmar com a Eric Burger.
const TEMPOS_PREPARO = {
  retirada: { de: 20, ate: 30 },
  entrega: { de: 40, ate: 60 },
}

// Espera um tempinho depois da última tecla antes de calcular o frete —
// evita disparar uma chamada pra cada letra digitada.
const DEBOUNCE_FRETE_MS = 800

const FRETE_OCIOSO = { status: 'ocioso', distanciaKm: null, taxaCentavos: 0, mensagemErro: '' }

export default function Checkout({ sacola, dados, onMudar, erro, enviando, onVoltarSacola, onConfirmar, onFreteMudou }) {
  const [frete, setFrete] = useState(FRETE_OCIOSO)
  const { tipoEntrega, endereco } = dados
  const { rua, numero, bairro, cep } = endereco

  // Total já com a entrega, quando ela foi calculada. É a base pra saber
  // quanto separar de troco.
  const totalPedido =
    calcularTotalPedido(sacola) +
    (tipoEntrega === 'entrega' && frete.status === 'ok' ? frete.taxaCentavos / 100 : 0)
  const trocoInformado = dinheiroParaNumero(dados.trocoPara)

  useEffect(() => {
    onFreteMudou?.(frete)
  }, [frete, onFreteMudou])

  useEffect(() => {
    // O CEP entra na condição porque é obrigatório pro cálculo: sem os 8
    // dígitos o backend recusa. Esperar aqui evita disparar chamada que já
    // sabemos que vai voltar erro, e evita piscar mensagem de erro na tela
    // enquanto a pessoa ainda está digitando o CEP.
    const cepCompleto = cep.replace(/\D/g, '').length === 8

    if (tipoEntrega !== 'entrega' || !cepCompleto || !rua.trim() || !numero.trim() || !bairro.trim()) {
      setFrete(FRETE_OCIOSO)
      return
    }

    setFrete((atual) => ({ ...atual, status: 'calculando' }))
    const timeoutId = setTimeout(async () => {
      try {
        const resultado = await calcularFreteNoBackend({ rua, numero, bairro, cep })
        setFrete({
          status: 'ok',
          distanciaKm: resultado.distanciaKm,
          taxaCentavos: resultado.taxaEntregaCentavos,
          mensagemErro: '',
        })
      } catch (erroFrete) {
        setFrete({
          status: 'erro',
          distanciaKm: null,
          taxaCentavos: 0,
          mensagemErro: erroFrete.message || 'Não foi possível calcular a entrega pra esse endereço.',
        })
      }
    }, DEBOUNCE_FRETE_MS)

    return () => clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipoEntrega, rua, numero, bairro, cep])

  async function lidarComMudancaCep(valor) {
    const cepFormatado = formatarCep(valor)
    onMudar({ endereco: { ...dados.endereco, cep: cepFormatado } })

    const digitos = cepFormatado.replace(/\D/g, '')
    if (digitos.length === 8) {
      const encontrado = await buscarEnderecoPorCep(cepFormatado)
      if (encontrado) {
        onMudar({
          endereco: {
            ...dados.endereco,
            cep: cepFormatado,
            rua: encontrado.rua || dados.endereco.rua,
            bairro: encontrado.bairro || dados.endereco.bairro,
          },
        })
      }
    }
  }

  return (
    <section className="checkout">
      <div className="sacola-cabecalho">
        <h2>Entrega e pagamento</h2>
        <button type="button" className="link-continuar" onClick={onVoltarSacola}>
          ← Voltar à sacola
        </button>
      </div>

      <div className="formulario-pedido">
        <label className="campo">
          Seu nome
          <input
            type="text"
            value={dados.nomeCliente}
            onChange={(e) => onMudar({ nomeCliente: e.target.value })}
            placeholder="Como podemos te chamar?"
          />
        </label>

        <label className="campo">
          Seu telefone <span className="campo-dica">— para a loja te avisar se precisar</span>
          <input
            type="tel"
            inputMode="numeric"
            value={dados.telefone}
            onChange={(e) => onMudar({ telefone: formatarTelefone(e.target.value) })}
            placeholder="(11) 99999-9999"
            maxLength={16}
          />
        </label>

        <div className="campo">
          <span>Retirada ou entrega?</span>
          <div className="opcoes-toggle">
            <button
              type="button"
              className={dados.tipoEntrega === 'retirada' ? 'ativo' : ''}
              onClick={() => onMudar({ tipoEntrega: 'retirada' })}
            >
              Retirar no local
            </button>
            <button
              type="button"
              className={dados.tipoEntrega === 'entrega' ? 'ativo' : ''}
              onClick={() => onMudar({ tipoEntrega: 'entrega' })}
            >
              Entrega
            </button>
          </div>
        </div>

        {dados.tipoEntrega === 'retirada' && (
          <p className="endereco-retirada">
            📍 Retire seu pedido em: <strong>{ENDERECO_LOJA}</strong>
          </p>
        )}

        {dados.tipoEntrega === 'entrega' && (
          <div className="campos-endereco">
            <label className="campo">
              CEP <span className="campo-dica">— é por ele que calculamos a entrega</span>
              <input
                type="text"
                inputMode="numeric"
                value={dados.endereco.cep}
                onChange={(e) => lidarComMudancaCep(e.target.value)}
                placeholder="00000-000"
                maxLength={9}
              />
              <a href={LINK_BUSCA_CEP} target="_blank" rel="noopener noreferrer" className="link-busca-cep">
                Não sei meu CEP
              </a>
            </label>
            <label className="campo">
              Rua
              <input
                type="text"
                value={dados.endereco.rua}
                onChange={(e) => onMudar({ endereco: { ...dados.endereco, rua: e.target.value } })}
              />
            </label>
            <div className="linha-dupla">
              <label className="campo">
                Número
                <input
                  type="text"
                  value={dados.endereco.numero}
                  onChange={(e) => onMudar({ endereco: { ...dados.endereco, numero: e.target.value } })}
                />
              </label>
              <label className="campo">
                Bairro
                <input
                  type="text"
                  value={dados.endereco.bairro}
                  onChange={(e) => onMudar({ endereco: { ...dados.endereco, bairro: e.target.value } })}
                />
              </label>
            </div>
            <label className="campo">
              Complemento (opcional)
              <input
                type="text"
                value={dados.endereco.complemento}
                onChange={(e) => onMudar({ endereco: { ...dados.endereco, complemento: e.target.value } })}
              />
            </label>
            <label className="campo">
              Ponto de referência (opcional)
              <input
                type="text"
                value={dados.endereco.referencia}
                onChange={(e) => onMudar({ endereco: { ...dados.endereco, referencia: e.target.value } })}
              />
            </label>
          </div>
        )}

        <div className="campo">
          <span>Forma de pagamento</span>
          <div className="opcoes-toggle opcoes-pagamento">
            {FORMAS_PAGAMENTO.map((forma) => (
              <button
                type="button"
                key={forma}
                className={dados.pagamento === forma ? 'ativo' : ''}
                // Trocar de forma de pagamento zera o troco: senão um "troco
                // para R$ 50" digitado antes continuaria guardado e voltaria
                // a valer se a pessoa escolhesse Dinheiro de novo mais tarde.
                onClick={() =>
                  onMudar(
                    forma === 'Dinheiro'
                      ? { pagamento: forma }
                      : { pagamento: forma, precisaTroco: null, trocoPara: '' },
                  )
                }
              >
                {forma}
              </button>
            ))}
          </div>
        </div>

        {dados.pagamento === 'Dinheiro' && (
          <div className="campo bloco-troco">
            <span>Precisa de troco?</span>
            <div className="opcoes-toggle">
              <button
                type="button"
                className={dados.precisaTroco === true ? 'ativo' : ''}
                onClick={() => onMudar({ precisaTroco: true })}
              >
                Sim
              </button>
              <button
                type="button"
                className={dados.precisaTroco === false ? 'ativo' : ''}
                onClick={() => onMudar({ precisaTroco: false, trocoPara: '' })}
              >
                Não, levo o valor certo
              </button>
            </div>

            {dados.precisaTroco === true && (
              <label className="campo campo-troco">
                Você vai pagar com quanto?
                <div className="campo-prefixado">
                  <span aria-hidden="true">R$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={dados.trocoPara}
                    onChange={(e) => onMudar({ trocoPara: formatarDinheiro(e.target.value) })}
                    placeholder="0,00"
                  />
                </div>
                {trocoInformado > 0 && trocoInformado >= totalPedido && (
                  <p className="troco-resultado">
                    Levamos <strong>R$ {formatarValor(trocoInformado - totalPedido)}</strong> de troco.
                  </p>
                )}
                {trocoInformado > 0 && trocoInformado < totalPedido && (
                  <p className="troco-alerta">
                    Menor que o total do pedido (R$ {formatarValor(totalPedido)}).
                  </p>
                )}
              </label>
            )}
          </div>
        )}
      </div>

      <div className="resumo-final">
        <h3>Revise seu pedido</h3>
        <div className="lista-resumo-final">
          {sacola.map((itemSacola) => (
            <div className="resumo-final-item" key={itemSacola.chave}>
              <span>
                {itemSacola.quantidade}x {itemSacola.item.nome}
                {itemSacola.variante ? ` — ${itemSacola.variante.nome}` : ''}
                {itemSacola.acrescimos.length > 0 && (
                  <em> (+ {itemSacola.acrescimos.map((a) => a.nome).join(', ')})</em>
                )}
              </span>
              <span>R$ {formatarValor(calcularPrecoItem(itemSacola))}</span>
            </div>
          ))}
        </div>

        {tipoEntrega === 'entrega' && (
          <div className="carrinho-total-linha">
            <span>Subtotal</span>
            <span>R$ {formatarValor(calcularTotalPedido(sacola))}</span>
          </div>
        )}

        {tipoEntrega === 'entrega' && frete.status === 'calculando' && (
          <p className="mensagem-info">Calculando taxa de entrega...</p>
        )}
        {tipoEntrega === 'entrega' && frete.status === 'ok' && (
          <div className="carrinho-total-linha">
            <span>Taxa de entrega ({formatarKm(frete.distanciaKm)} km)</span>
            <span>R$ {formatarValor(frete.taxaCentavos / 100)}</span>
          </div>
        )}
        {tipoEntrega === 'entrega' && frete.status === 'erro' && (
          <p className="mensagem-erro">{frete.mensagemErro}</p>
        )}
        {tipoEntrega === 'entrega' && frete.status === 'ocioso' && (
          <p className="mensagem-info">
            Preencha CEP, rua, número e bairro pra calcular a entrega.
          </p>
        )}

        <div className="carrinho-total">
          <span>Total</span>
          <strong>
            R${' '}
            {formatarValor(
              calcularTotalPedido(sacola) +
                (tipoEntrega === 'entrega' && frete.status === 'ok' ? frete.taxaCentavos / 100 : 0)
            )}
          </strong>
        </div>

        <p className="aviso-preparo">
          <span aria-hidden="true">⏱</span>{' '}
          {tipoEntrega === 'entrega' ? (
            <>
              Entrega em <strong>{TEMPOS_PREPARO.entrega.de} a {TEMPOS_PREPARO.entrega.ate} minutos</strong>{' '}
              após a confirmação, já contando o trajeto.
            </>
          ) : (
            <>
              Pronto para retirada em{' '}
              <strong>{TEMPOS_PREPARO.retirada.de} a {TEMPOS_PREPARO.retirada.ate} minutos</strong>{' '}
              após a confirmação.
            </>
          )}
        </p>
      </div>

      {erro && <p className="mensagem-erro">{erro}</p>}
      {enviando && (
        <p className="mensagem-info">
          Confirmando seu pedido... pode levar até 1 minuto se o sistema estiver inativo há um tempo.
        </p>
      )}

      <button
        type="button"
        className="btn-enviar"
        onClick={onConfirmar}
        disabled={enviando || (tipoEntrega === 'entrega' && frete.status !== 'ok')}
      >
        {enviando ? 'Enviando pedido...' : 'Confirmar e enviar pedido pelo WhatsApp'}
      </button>
    </section>
  )
}
