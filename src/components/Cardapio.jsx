import { useState, useMemo } from 'react'
import { formatarValor } from '../utils/formato.js'
import { CATEGORIAS, ITENS_POR_CATEGORIA, TODOS_ITENS } from '../data/cardapio.js'
import { IconeGarrafa2L, IconeAgua, IconeLata, corDaBebida } from './Icones.jsx'

const TODOS = TODOS_ITENS

export default function Cardapio({ onSelecionarItem }) {
  const [busca, setBusca] = useState('')
  const [categoria, setCategoria] = useState('todos')

  const baseLista = categoria === 'todos' ? TODOS : ITENS_POR_CATEGORIA[categoria] || []

  const itensFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return baseLista
    return baseLista.filter((p) => {
      const bateNome = p.nome.toLowerCase().includes(termo)
      const bateDescricao = (p.descricao || '').toLowerCase().includes(termo)
      const bateGrupo = p.grupo.toLowerCase().includes(termo)
      return bateNome || bateDescricao || bateGrupo
    })
  }, [busca, baseLista])

  // Agrupa os itens filtrados por "grupo" (subseção do cardápio), preservando a ordem
  const grupos = useMemo(() => {
    const mapa = new Map()
    itensFiltrados.forEach((p) => {
      if (!mapa.has(p.grupo)) mapa.set(p.grupo, [])
      mapa.get(p.grupo).push(p)
    })
    return Array.from(mapa.entries())
  }, [itensFiltrados])

  return (
    <section className="cardapio" id="cardapio">
      <div className="cardapio-busca">
        <span className="icone-busca" aria-hidden="true">🔍</span>
        <input
          type="text"
          className="busca-input"
          placeholder="Buscar lanche... (ex: bacon, frango)"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      <div className="chips-categoria" role="tablist" aria-label="Filtrar por categoria">
        {CATEGORIAS.map((c) => (
          <button
            key={c.id}
            role="tab"
            aria-selected={categoria === c.id}
            className={categoria === c.id ? 'chip ativo' : 'chip'}
            onClick={() => setCategoria(c.id)}
          >
            {c.nome}
          </button>
        ))}
      </div>

      {grupos.length === 0 ? (
        <p className="sem-resultado">Nenhum item encontrado com esse termo.</p>
      ) : (
        grupos.map(([nomeGrupo, itens]) => (
          <div className="grupo-cardapio" key={nomeGrupo}>
            <h2 className="grupo-titulo">{nomeGrupo}</h2>
            <div className="lista-itens">
              {itens.map((p) => (
                <CardItem key={p.id} item={p} onSelecionar={onSelecionarItem} />
              ))}
            </div>
          </div>
        ))
      )}
    </section>
  )
}

function IconeItem({ item }) {
  if (item.categoria === 'bebidas') {
    // Casa pelo grupo e pelo nome, e não por id: assim uma bebida nova já
    // nasce com o ícone certo, em vez de cair no genérico sem ninguém notar.
    if (item.grupo === 'Água') return <IconeAgua />
    if (/lata/i.test(item.nome) || /long neck|original/i.test(item.nome)) {
      return <IconeLata cor={corDaBebida(item.nome)} />
    }
    if (/laranja/i.test(item.nome) && item.grupo === 'Sucos') return <span>🍊</span>
    return <IconeGarrafa2L cor={corDaBebida(item.nome)} />
  }
  if (item.categoria === 'cachorro-quente') return <span>🌭</span>
  if (item.categoria === 'porcoes') return <span>{/polenta/i.test(item.nome) ? '🧆' : '🍟'}</span>
  if (item.categoria === 'combos') return <span>🍱</span>
  if (item.categoria === 'vegetarianos') return <span>🥬</span>
  if (item.grupo === 'Lanches de Carne' || item.grupo === 'Lanche de Pernil') return <span>🥖</span>
  return <span>🍔</span>
}

function CardItem({ item, onSelecionar }) {
  const precoUnico = !item.variantes || item.variantes.every((v) => v.preco === item.variantes[0].preco)
  const precoExibido = item.variantes ? item.variantes[0].preco : item.preco

  return (
    <article className="card-item" onClick={() => onSelecionar(item)}>
      <div className="card-item-icone" aria-hidden="true">
        <IconeItem item={item} />
      </div>
      <div className="card-item-info">
        <h3>{item.nome}</h3>
        {item.descricao && <p>{item.descricao}</p>}
        <div className="precos">
          {!precoUnico ? (
            item.variantes.map((v) => (
              <span key={v.id}>{v.nome} R$ {formatarValor(v.preco)}</span>
            ))
          ) : (
            <span>R$ {formatarValor(precoExibido)}</span>
          )}
        </div>
      </div>
      <button
        type="button"
        className="btn-adicionar"
        onClick={(e) => {
          e.stopPropagation()
          onSelecionar(item)
        }}
        aria-label={`Adicionar ${item.nome}`}
      >
        +
      </button>
    </article>
  )
}
