import { useState } from 'react'
import { formatarValor } from '../utils/formato.js'
import { verificarAtendimento } from '../utils/horario.js'
import { ADICIONAIS, gruposDeAdicionais } from '../data/cardapio.js'

// itemSacolaExistente: quando presente, o modal abre em modo de edição de um item já na sacola
export default function ModalProduto({ item, itemSacolaExistente, onFechar, onConfirmar }) {
  const [etapa, setEtapa] = useState('opcoes') // 'opcoes' | 'revisar'
  const [varianteId, setVarianteId] = useState(
    itemSacolaExistente?.variante?.id || item.variantes?.[0]?.id || null
  )
  const [acrescimosIds, setAcrescimosIds] = useState(
    new Set((itemSacolaExistente?.acrescimos || []).map((a) => a.id))
  )
  const [quantidade, setQuantidade] = useState(itemSacolaExistente?.quantidade || 1)
  const [observacao, setObservacao] = useState(itemSacolaExistente?.observacao || '')

  const grupos = gruposDeAdicionais(item)
  const variante = item.variantes ? item.variantes.find((v) => v.id === varianteId) : null
  const acrescimosSelecionados = ADICIONAIS.filter((a) => acrescimosIds.has(a.id))
  const precoBase = variante ? variante.preco : item.preco
  const precoAcrescimos = acrescimosSelecionados.reduce((soma, a) => soma + a.preco, 0)
  const precoUnitario = precoBase + precoAcrescimos
  const precoTotal = precoUnitario * quantidade

  // Em grupo exclusivo (troca do hambúrguer) marcar uma opção desmarca as
  // outras do mesmo grupo; clicar de novo na marcada desmarca tudo.
  function alternarAcrescimo(id, grupo) {
    setAcrescimosIds((atual) => {
      const novo = new Set(atual)
      if (novo.has(id)) {
        novo.delete(id)
        return novo
      }
      if (grupo.exclusivo) grupo.opcoes.forEach((o) => novo.delete(o.id))
      novo.add(id)
      return novo
    })
  }

  // Aqui o cliente ainda não escolheu entre retirada e entrega, então vale
  // a janela mais larga do dia. A checagem específica de cada modalidade
  // acontece depois, na confirmação do pedido.
  const atendimento = verificarAtendimento()

  function irParaRevisao() {
    if (!atendimento.aberto) return
    setEtapa('revisar')
  }

  function confirmar() {
    onConfirmar({
      item,
      variante,
      acrescimos: acrescimosSelecionados,
      quantidade,
      observacao: observacao.trim(),
    })
  }

  return (
    <div className="modal-fundo" role="dialog" aria-modal="true" aria-label={item.nome}>
      <div className="modal-caixa">
        <div className="modal-topo">
          <button type="button" className="modal-fechar" onClick={onFechar} aria-label="Fechar">
            ✕
          </button>
          <h2>{etapa === 'opcoes' ? item.nome : 'Revisar item'}</h2>
        </div>

        <div className="modal-conteudo">
          {etapa === 'opcoes' ? (
            <>
              {item.descricao && <p className="modal-descricao">{item.descricao}</p>}

              {item.variantes && (
                <div className="modal-secao">
                  <h3>{item.tituloVariante || 'Escolha uma opção'}</h3>
                  <div className="opcoes-toggle">
                    {item.variantes.map((v) => (
                      <button
                        type="button"
                        key={v.id}
                        className={varianteId === v.id ? 'ativo' : ''}
                        onClick={() => setVarianteId(v.id)}
                      >
                        {precoUnicoVariantes(item) ? v.nome : `${v.nome} · R$ ${formatarValor(v.preco)}`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {grupos.map((grupo) => (
                <div className="modal-secao" key={grupo.id}>
                  <h3>{grupo.titulo}</h3>
                  <div className="lista-acrescimos">
                    {grupo.opcoes.map((a) => {
                      const marcado = acrescimosIds.has(a.id)
                      return (
                        <label key={a.id} className={marcado ? 'acrescimo marcado' : 'acrescimo'}>
                          <input
                            type={grupo.exclusivo ? 'radio' : 'checkbox'}
                            name={grupo.exclusivo ? `grupo-${grupo.id}` : undefined}
                            checked={marcado}
                            onChange={() => {}}
                            onClick={() => alternarAcrescimo(a.id, grupo)}
                          />
                          {a.nome} (+R$ {formatarValor(a.preco)})
                        </label>
                      )
                    })}
                  </div>
                </div>
              ))}

              <div className="modal-secao">
                <h3>Quantidade</h3>
                <div className="quantidade-controle">
                  <button type="button" onClick={() => setQuantidade((q) => Math.max(1, q - 1))}>−</button>
                  <span>{quantidade}</span>
                  <button type="button" onClick={() => setQuantidade((q) => q + 1)}>+</button>
                </div>
              </div>

              <div className="modal-secao">
                <h3>Alguma observação?</h3>
                <div className="aviso-troca">
                  <p className="aviso-troca-titulo">Do seu jeito</p>
                  <ul>
                    <li>Não gosta de algum ingrediente? Escreva aqui embaixo que a gente tira.</li>
                    {grupos.length > 0 && <li>Quer incluir algo? É só marcar nos adicionais aí em cima.</li>}
                  </ul>
                </div>
                <textarea
                  className="modal-observacao"
                  placeholder="Ex: sem tomate, sem maionese, etc. (opcional)"
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  rows={2}
                />
              </div>
            </>
          ) : (
            <div className="revisao-item">
              <h3>{item.nome}{variante ? ` — ${variante.nome}` : ''}</h3>
              <p className="revisao-linha">
                <span>Preço base</span>
                <span>R$ {formatarValor(precoBase)}</span>
              </p>
              {acrescimosSelecionados.length > 0 && (
                <div className="revisao-acrescimos">
                  <span>Adicionais:</span>
                  <ul>
                    {acrescimosSelecionados.map((a) => (
                      <li key={a.id}>
                        <span>{a.nome}</span>
                        <span>+R$ {formatarValor(a.preco)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {observacao && (
                <p className="revisao-linha">
                  <span>Observação</span>
                  <span>{observacao}</span>
                </p>
              )}
              <p className="revisao-linha">
                <span>Quantidade</span>
                <span>{quantidade}</span>
              </p>
              <p className="revisao-linha revisao-total">
                <span>Total do item</span>
                <span>R$ {formatarValor(precoTotal)}</span>
              </p>
              <button type="button" className="btn-voltar-opcoes" onClick={() => setEtapa('opcoes')}>
                ← Ajustar opções
              </button>
            </div>
          )}
        </div>

        <div className="modal-rodape">
          {!atendimento.aberto && <p className="aviso-fechado">{atendimento.mensagem}</p>}
          {etapa === 'opcoes' ? (
            <button
              type="button"
              className="btn-primario"
              onClick={irParaRevisao}
              disabled={!atendimento.aberto}
            >
              {atendimento.aberto ? `Revisar · R$ ${formatarValor(precoTotal)}` : 'Fora do horário'}
            </button>
          ) : (
            <button type="button" className="btn-primario" onClick={confirmar}>
              {itemSacolaExistente ? 'Salvar alterações' : 'Adicionar à sacola'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Combos e bebidas com sabor têm o mesmo preço em todas as opções — aí não
// faz sentido repetir o preço em cada botão.
export function precoUnicoVariantes(item) {
  return item.variantes.every((v) => v.preco === item.variantes[0].preco)
}
