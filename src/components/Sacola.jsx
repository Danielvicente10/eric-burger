import { calcularPrecoItem, calcularTotalPedido, precoBaseItem } from '../utils/pedido.js'
import { formatarValor } from '../utils/formato.js'

export default function Sacola({ sacola, onEditarItem, onRemoverItem, onContinuarComprando, onIrParaEntrega }) {
  return (
    <section className="sacola">
      <div className="sacola-cabecalho">
        <h2>Sua sacola</h2>
        <button type="button" className="link-continuar" onClick={onContinuarComprando}>
          + Continuar comprando
        </button>
      </div>

      {sacola.length === 0 ? (
        <p className="sacola-vazia">Sua sacola está vazia. Volte ao cardápio para adicionar itens.</p>
      ) : (
        <>
          <div className="lista-sacola">
            {sacola.map((itemSacola, index) => (
              <ItemSacola
                key={itemSacola.chave}
                itemSacola={itemSacola}
                onEditar={() => onEditarItem(index)}
                onRemover={() => onRemoverItem(index)}
              />
            ))}
          </div>

          <div className="carrinho-total">
            <span>Total</span>
            <strong>R$ {formatarValor(calcularTotalPedido(sacola))}</strong>
          </div>

          <button type="button" className="btn-primario btn-largo" onClick={onIrParaEntrega}>
            Continuar para entrega e pagamento
          </button>
        </>
      )}
    </section>
  )
}

function ItemSacola({ itemSacola, onEditar, onRemover }) {
  const { item, variante, acrescimos, quantidade, observacao } = itemSacola

  return (
    <div className="item-carrinho">
      <div className="item-topo">
        <h4>
          {quantidade}x {item.nome}
          {variante ? ` — ${variante.nome}` : ''}
        </h4>
        <button className="btn-remover" onClick={onRemover} aria-label="Remover item">
          ✕
        </button>
      </div>

      {acrescimos.length > 0 && (
        <p className="item-detalhe">+ {acrescimos.map((a) => a.nome).join(', ')}</p>
      )}
      {observacao && <p className="item-detalhe item-observacao">Obs: {observacao}</p>}

      <div className="item-rodape">
        <span className="item-preco-unitario">R$ {formatarValor(precoBaseItem(itemSacola))} cada</span>
        <div className="item-rodape-acoes">
          <button type="button" className="btn-editar" onClick={onEditar}>
            Editar
          </button>
          <strong>R$ {formatarValor(calcularPrecoItem(itemSacola))}</strong>
        </div>
      </div>
    </div>
  )
}
