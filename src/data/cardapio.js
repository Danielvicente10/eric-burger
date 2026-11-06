// Cardápio completo da Eric Burger Delivery.
// Para atualizar itens, grupos ou preços, edite este arquivo, rode
// `npm run cardapio` (gera a cópia do backend) e faça um novo deploy.

// ---------------------------------------------------------------------------
// ACRÉSCIMOS
// ---------------------------------------------------------------------------
//
// Diferente da pastelaria, aqui cada tipo de produto tem a SUA lista de
// acréscimos, com preços próprios: o "Bacon" de um lanche custa R$ 5, o de
// uma batata pequena R$ 5 e o de uma batata grande R$ 8. Por isso cada
// acréscimo pertence a um "tipo", e cada item do cardápio diz quais tipos
// aceita (campo `adicionais`). O backend recusa acréscimo de tipo que o item
// não aceita — não dá pra pôr o bacon de R$ 5 numa batata grande.
//
// `exclusivo: true` = o cliente escolhe no máximo uma opção do grupo (é o
// caso da troca do hambúrguer: não dá pra trocar por costela E por pimenta).

export const TIPOS_ADICIONAL = [
  { id: 'troca-hamburguer', titulo: 'Trocar o hambúrguer (opcional)', exclusivo: true },
  { id: 'lanche', titulo: 'Adicionais (opcional)', exclusivo: false },
  { id: 'batata-pequena', titulo: 'Adicionais da batata (opcional)', exclusivo: false },
  { id: 'batata-grande', titulo: 'Adicionais da batata (opcional)', exclusivo: false },
]

export const ADICIONAIS = [
  // TROCA DE HAMBÚRGUER
  { id: 'troca-costela', tipo: 'troca-hamburguer', nome: 'Trocar por hambúrguer de costela', preco: 3 },
  { id: 'troca-pimenta', tipo: 'troca-hamburguer', nome: 'Trocar por hambúrguer de pimenta', preco: 3 },

  // ADICIONAIS LANCHES
  // TODO: na foto do cardápio os preços de cheddar, bacon e catupiry ficaram
  // parcialmente cobertos. Lidos como R$ 5 — confirmar com a loja.
  { id: 'cheddar', tipo: 'lanche', nome: 'Cheddar', preco: 5 },
  { id: 'bacon', tipo: 'lanche', nome: 'Bacon', preco: 5 },
  { id: 'catupiry', tipo: 'lanche', nome: 'Catupiry', preco: 5 },
  { id: 'cebola-roxa', tipo: 'lanche', nome: 'Cebola roxa', preco: 3 },
  { id: 'milho', tipo: 'lanche', nome: 'Milho', preco: 3 },
  { id: 'salsichas-queijo', tipo: 'lanche', nome: '2 salsichas + queijo', preco: 7 },
  { id: 'cebola-grelhada', tipo: 'lanche', nome: 'Cebola grelhada', preco: 3 },
  { id: 'ovo', tipo: 'lanche', nome: 'Ovo', preco: 3 },
  { id: 'batata-palha', tipo: 'lanche', nome: 'Batata palha', preco: 3 },
  { id: 'queijo-prato', tipo: 'lanche', nome: 'Queijo prato', preco: 3 },
  { id: 'provolone', tipo: 'lanche', nome: 'Provolone', preco: 4 },
  { id: 'presunto', tipo: 'lanche', nome: 'Presunto', preco: 3 },
  { id: 'hamburguer-queijo', tipo: 'lanche', nome: 'Hambúrguer + queijo', preco: 14 },

  // ADICIONAL BATATA FRITA — PEQUENA
  { id: 'batata-p-bacon', tipo: 'batata-pequena', nome: 'Bacon', preco: 5 },
  { id: 'batata-p-catupiry', tipo: 'batata-pequena', nome: 'Catupiry', preco: 5 },
  { id: 'batata-p-cheddar', tipo: 'batata-pequena', nome: 'Cheddar', preco: 5 },
  { id: 'batata-p-queijo', tipo: 'batata-pequena', nome: 'Queijo', preco: 8 },

  // ADICIONAL BATATA FRITA — GRANDE
  { id: 'batata-g-bacon', tipo: 'batata-grande', nome: 'Bacon', preco: 8 },
  { id: 'batata-g-catupiry', tipo: 'batata-grande', nome: 'Catupiry', preco: 8 },
  { id: 'batata-g-cheddar', tipo: 'batata-grande', nome: 'Cheddar', preco: 8 },
  { id: 'batata-g-queijo', tipo: 'batata-grande', nome: 'Queijo', preco: 9 },
]

export const CATEGORIAS = [
  { id: 'todos', nome: 'Todos' },
  { id: 'hamburgueres', nome: 'Hambúrgueres' },
  { id: 'lanches', nome: 'Frango, carne e pernil' },
  { id: 'vegetarianos', nome: 'Vegetarianos' },
  { id: 'cachorro-quente', nome: 'Cachorro quente' },
  { id: 'combos', nome: 'Combos' },
  { id: 'porcoes', nome: 'Porções' },
  { id: 'bebidas', nome: 'Bebidas' },
]

// Combinações de acréscimos mais usadas
const BOVINO = ['troca-hamburguer', 'lanche']
const LANCHE = ['lanche']

let contador = 0
function item(dados) {
  contador += 1
  const adicionais = dados.adicionais || []
  return {
    id: `${dados.categoria}-${contador}-${slugify(dados.nome)}`,
    ...dados,
    adicionais,
    permiteAcrescimo: adicionais.length > 0,
  }
}

function slugify(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// Sabores oferecidos onde o cardápio só diz "refrigerante lata a escolha".
// TODO: o cardápio impresso não lista os sabores — confirmar com a loja.
const SABORES_REFRI_LATA = ['Coca-Cola', 'Coca-Cola Zero', 'Guaraná Antarctica', 'Fanta Laranja', 'Sprite']

function variantesComPreco(nomes, preco) {
  return nomes.map((nome) => ({ id: slugify(nome), nome, preco }))
}

// ---------------------------------------------------------------------------
// HAMBÚRGUERES
// ---------------------------------------------------------------------------

const G150 = 'Hambúrguer Bovino 150g'
const G90 = 'Hambúrguer Bovino 90g'

export const HAMBURGUERES = [
  // TODO: os dois primeiros itens ficaram parcialmente cobertos na foto do
  // cardápio. Lidos como X-Burger (R$ 27) e X-Salada (R$ 28) — confirmar.
  item({ categoria: 'hamburgueres', grupo: G150, adicionais: BOVINO, nome: 'X-Burger', descricao: 'Pão, hambúrguer, queijo e maionese', preco: 27 }),
  item({ categoria: 'hamburgueres', grupo: G150, adicionais: BOVINO, nome: 'X-Salada', descricao: 'Pão, hambúrguer, queijo, maionese, alface e tomate', preco: 28 }),
  item({ categoria: 'hamburgueres', grupo: G150, adicionais: BOVINO, nome: 'X-Bacon', descricao: 'Pão, hambúrguer, bacon, queijo, maionese, alface e tomate', preco: 33 }),
  item({ categoria: 'hamburgueres', grupo: G150, adicionais: BOVINO, nome: 'X-Bacon Egg', descricao: 'Pão, hambúrguer, bacon, ovo, queijo, maionese, alface e tomate', preco: 35 }),
  item({ categoria: 'hamburgueres', grupo: G150, adicionais: BOVINO, nome: 'Big Bacon', descricao: 'Pão, 2 hambúrgueres, bacon, queijo, maionese, alface e tomate', preco: 48 }),
  item({ categoria: 'hamburgueres', grupo: G150, adicionais: BOVINO, nome: 'X-Egg', descricao: 'Pão, hambúrguer, ovo, queijo, maionese, alface e tomate', preco: 30 }),
  item({ categoria: 'hamburgueres', grupo: G150, adicionais: BOVINO, nome: 'X-Egg Duplo', descricao: 'Pão, hambúrguer, queijo, 2 ovos, maionese, alface e tomate', preco: 35 }),
  item({ categoria: 'hamburgueres', grupo: G150, adicionais: BOVINO, nome: 'Big City', descricao: 'Pão, 2 hambúrgueres, bacon, ovo, queijo, maionese, alface e tomate', preco: 49 }),
  item({ categoria: 'hamburgueres', grupo: G150, adicionais: BOVINO, nome: 'Monster City', descricao: 'Pão, 3 hambúrgueres, 2 ovos, queijo, bacon, maionese, alface e tomate', preco: 67 }),
  item({ categoria: 'hamburgueres', grupo: G150, adicionais: BOVINO, nome: 'X-Tudo', descricao: 'Pão, hambúrguer, frango, presunto, queijo, provolone, ovo, catupiry, bacon, maionese, alface, cebola grelhada e tomate', preco: 59 }),
  item({ categoria: 'hamburgueres', grupo: G150, adicionais: BOVINO, nome: 'X-Americano', descricao: 'Pão, hambúrguer, presunto, queijo, ovo, maionese, alface e tomate', preco: 33 }),
  item({ categoria: 'hamburgueres', grupo: G150, adicionais: BOVINO, nome: 'X-Acebolado', descricao: 'Pão, hambúrguer, cebola grelhada, queijo, maionese, alface e tomate', preco: 30 }),
  item({ categoria: 'hamburgueres', grupo: G150, adicionais: BOVINO, nome: 'X-Carne à Moda da Casa', descricao: 'Pão, hambúrguer, queijo, catupiry, provolone, maionese, alface e tomate', preco: 36 }),
  item({ categoria: 'hamburgueres', grupo: G150, adicionais: BOVINO, nome: 'X-Carne à Moda da Casa + Bacon', descricao: 'Pão, hambúrguer, bacon, queijo, catupiry, provolone, maionese, alface e tomate', preco: 40 }),

  item({ categoria: 'hamburgueres', grupo: G90, adicionais: BOVINO, nome: 'X-Burger P', descricao: 'Pão, hambúrguer, queijo e maionese', preco: 20 }),
  item({ categoria: 'hamburgueres', grupo: G90, adicionais: BOVINO, nome: 'X-Salada P', descricao: 'Pão, hambúrguer, queijo, maionese, alface e tomate', preco: 21 }),
  item({ categoria: 'hamburgueres', grupo: G90, adicionais: BOVINO, nome: 'X-Bacon P', descricao: 'Pão, hambúrguer, bacon, queijo, maionese, alface e tomate', preco: 22 }),
  item({ categoria: 'hamburgueres', grupo: G90, adicionais: BOVINO, nome: 'X-Egg P', descricao: 'Pão, hambúrguer, ovo, queijo, maionese, alface e tomate', preco: 22 }),
]

// ---------------------------------------------------------------------------
// FRANGO, CARNE, PERNIL E MISTO
// ---------------------------------------------------------------------------

export const LANCHES = [
  item({ categoria: 'lanches', grupo: 'Lanches de Frango', adicionais: LANCHE, nome: 'X-Frango', descricao: 'Pão, filé de frango em cubos, queijo, maionese, alface e tomate', preco: 28 }),
  item({ categoria: 'lanches', grupo: 'Lanches de Frango', adicionais: LANCHE, nome: 'X-Frango à Moda da Casa', descricao: 'Pão, filé de frango em cubos, queijo, catupiry, provolone, maionese, alface e tomate', preco: 35 }),
  item({ categoria: 'lanches', grupo: 'Lanches de Frango', adicionais: LANCHE, nome: 'X-Franbacon', descricao: 'Pão, filé de frango em cubos, queijo, bacon, maionese, alface e tomate', preco: 33 }),

  item({ categoria: 'lanches', grupo: 'Lanches de Carne', adicionais: LANCHE, nome: 'Churrasquinho', descricao: 'Baguete, alcatra, queijo, maionese, tomate, rúcula ou alface', preco: 38 }),
  item({ categoria: 'lanches', grupo: 'Lanches de Carne', adicionais: LANCHE, nome: 'Churrasquinho Filé Mignon', descricao: 'Baguete, filé mignon, queijo, provolone, cebola roxa, maionese, tomate, rúcula ou alface', preco: 59 }),

  item({ categoria: 'lanches', grupo: 'Lanche de Pernil', adicionais: LANCHE, nome: 'X-Pernil', descricao: 'Baguete, pernil desfiado, queijo, cebola grelhada, maionese, alface e tomate', preco: 30 }),

  item({ categoria: 'lanches', grupo: 'Misto Quente', adicionais: LANCHE, nome: 'Misto Quente', descricao: 'Pão de hambúrguer, presunto, queijo, maionese e tomate', preco: 20 }),
]

// ---------------------------------------------------------------------------
// VEGETARIANOS
// ---------------------------------------------------------------------------

export const VEGETARIANOS = [
  item({ categoria: 'vegetarianos', grupo: 'Vegetarianos', adicionais: LANCHE, nome: 'Vegetariano', descricao: 'Pão, hambúrguer de legumes, queijo, maionese, alface e tomate', preco: 26 }),
  item({ categoria: 'vegetarianos', grupo: 'Vegetarianos', adicionais: LANCHE, nome: 'Vegetariano 3 Queijos', descricao: 'Pão, hambúrguer de legumes, queijo, provolone, catupiry, maionese, alface e tomate', preco: 33 }),
  item({ categoria: 'vegetarianos', grupo: 'Vegetarianos', adicionais: LANCHE, nome: 'X-Schin', descricao: 'Pão, 2 ovos, queijo prato, provolone, cebola roxa, tomate e alface', preco: 33 }),
]

// ---------------------------------------------------------------------------
// CACHORRO QUENTE
// ---------------------------------------------------------------------------

export const CACHORROS = [
  item({ categoria: 'cachorro-quente', grupo: 'Cachorro Quente', adicionais: LANCHE, nome: 'Cachorro Quente Simples', descricao: 'Pão, 2 salsichas, queijo e maionese', preco: 19 }),
  item({ categoria: 'cachorro-quente', grupo: 'Cachorro Quente', adicionais: LANCHE, nome: 'Cachorro Quente', descricao: 'Pão, 2 salsichas, queijo, milho verde, batata palha e tomate picado', preco: 25 }),
  item({ categoria: 'cachorro-quente', grupo: 'Cachorro Quente', adicionais: LANCHE, nome: 'Cachorro Quente com Bacon', descricao: 'Pão, 2 salsichas, bacon, queijo, milho verde, batata palha e tomate picado', preco: 29 }),
]

// ---------------------------------------------------------------------------
// COMBOS
// ---------------------------------------------------------------------------
// O refrigerante do combo é escolhido como variante (todas com o mesmo
// preço do combo), pra ele aparecer no pedido e no cupom.

export const COMBOS = [
  item({ categoria: 'combos', grupo: 'Combos', adicionais: BOVINO, nome: 'Combo X-Salada', descricao: 'X-Salada + refri lata à escolha + batata 200g', tituloVariante: 'Escolha o refrigerante', variantes: variantesComPreco(SABORES_REFRI_LATA, 40) }),
  item({ categoria: 'combos', grupo: 'Combos', adicionais: BOVINO, nome: 'Combo X-Bacon', descricao: 'X-Bacon + refri lata à escolha + batata 200g', tituloVariante: 'Escolha o refrigerante', variantes: variantesComPreco(SABORES_REFRI_LATA, 45) }),
]

// ---------------------------------------------------------------------------
// PORÇÕES
// ---------------------------------------------------------------------------

export const PORCOES = [
  item({ categoria: 'porcoes', grupo: 'Porção de Batata Frita', adicionais: ['batata-pequena'], nome: 'Batata Palito Pequena', preco: 12 }),
  item({ categoria: 'porcoes', grupo: 'Porção de Batata Frita', adicionais: ['batata-grande'], nome: 'Batata Palito Grande', preco: 22 }),
  item({ categoria: 'porcoes', grupo: 'Porção de Batata Frita', adicionais: ['batata-pequena'], nome: 'Batata Ondulada Pequena', preco: 14 }),
  item({ categoria: 'porcoes', grupo: 'Porção de Batata Frita', adicionais: ['batata-grande'], nome: 'Batata Ondulada Grande', preco: 26 }),
  item({ categoria: 'porcoes', grupo: 'Polenta', nome: 'Polenta Frita 500g', preco: 18 }),
]

// ---------------------------------------------------------------------------
// BEBIDAS
// ---------------------------------------------------------------------------
// TODO: sabores das variantes (refri lata, refri 1,5L, Del Valle e H2O) não
// aparecem no cardápio impresso — são suposições, confirmar com a loja.

export const BEBIDAS = [
  item({ categoria: 'bebidas', grupo: 'Refrigerantes', nome: 'Refrigerante Lata', tituloVariante: 'Escolha o sabor', variantes: variantesComPreco(SABORES_REFRI_LATA, 8) }),
  item({ categoria: 'bebidas', grupo: 'Refrigerantes', nome: 'Coca-Cola 600ml', preco: 11 }),
  item({ categoria: 'bebidas', grupo: 'Refrigerantes', nome: 'Coca-Cola 1L', preco: 11 }),
  item({ categoria: 'bebidas', grupo: 'Refrigerantes', nome: 'Refrigerante 1,5L', tituloVariante: 'Escolha o sabor', variantes: variantesComPreco(['Guaraná Antarctica', 'Fanta Laranja', 'Sprite'], 13) }),
  item({ categoria: 'bebidas', grupo: 'Refrigerantes', nome: 'Coca-Cola 2L', preco: 20 }),

  item({ categoria: 'bebidas', grupo: 'Sucos', nome: 'Suco Del Valle Lata', tituloVariante: 'Escolha o sabor', variantes: variantesComPreco(['Uva', 'Pêssego', 'Maracujá', 'Manga'], 8) }),
  item({ categoria: 'bebidas', grupo: 'Sucos', nome: 'Suco de Laranja', preco: 12 }),

  item({ categoria: 'bebidas', grupo: 'Água', nome: 'H2O', tituloVariante: 'Escolha o sabor', variantes: variantesComPreco(['Limão', 'Limoneto'], 9) }),
  item({ categoria: 'bebidas', grupo: 'Água', nome: 'Água', preco: 4 }),

  item({ categoria: 'bebidas', grupo: 'Cervejas', nome: 'Heineken Long Neck', preco: 13 }),
  item({ categoria: 'bebidas', grupo: 'Cervejas', nome: 'Cerveja Lata', tituloVariante: 'Escolha a cerveja', variantes: variantesComPreco(['Skol', 'Brahma'], 8) }),
  item({ categoria: 'bebidas', grupo: 'Cervejas', nome: 'Antarctica Original', preco: 8 }),
]

export const ITENS_POR_CATEGORIA = {
  hamburgueres: HAMBURGUERES,
  lanches: LANCHES,
  vegetarianos: VEGETARIANOS,
  'cachorro-quente': CACHORROS,
  combos: COMBOS,
  porcoes: PORCOES,
  bebidas: BEBIDAS,
}

export const TODOS_ITENS = [
  ...HAMBURGUERES,
  ...LANCHES,
  ...VEGETARIANOS,
  ...CACHORROS,
  ...COMBOS,
  ...PORCOES,
  ...BEBIDAS,
]

/** Acréscimos que um item aceita, agrupados por tipo, na ordem de TIPOS_ADICIONAL. */
export function gruposDeAdicionais(item) {
  return TIPOS_ADICIONAL.filter((t) => item.adicionais?.includes(t.id)).map((t) => ({
    ...t,
    opcoes: ADICIONAIS.filter((a) => a.tipo === t.id),
  }))
}
