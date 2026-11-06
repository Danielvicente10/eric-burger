// Cópia, no backend, do cardápio que vive em src/data/cardapio.js no
// front-end (raiz do projeto eric-burger).
//
// ARQUIVO GERADO — não edite à mão. Para mudar item, preço, variante ou
// grupo, edite src/data/cardapio.js e rode, na raiz do projeto:
//
//     npm run cardapio
//
// O motivo de ser gerado: os ids são posicionais (categoria + posição no
// arquivo + slug do nome). Inserir ou remover um item desloca o id de
// todos os seguintes; se as duas listas forem mantidas à mão, elas saem de
// sincronia e o backend passa a recusar todo pedido com "Item de cardápio
// desconhecido".
//
// Preços aqui em CENTAVOS, para evitar erro de arredondamento com ponto
// flutuante. R$ 24,00 no front == 2400 aqui.

export interface VarianteCardapio {
  id: string;
  nome: string;
  precoCentavos: number;
}

export interface ItemCardapio {
  id: string;
  nome: string;
  descricao?: string;
  categoria: string;
  grupo: string;
  permiteAcrescimo: boolean;
  /** Presente quando o item tem preço único (a maioria). Ausente quando o item só tem preço via variantes (ex: sucos). */
  precoCentavos?: number;
  /** Presente só nos itens com opções (sabor da bebida, refri do combo). */
  variantes?: VarianteCardapio[];
  /** Tipos de acréscimo que o item aceita (ids de TIPOS_ADICIONAL). Vazio = nenhum. */
  adicionais: readonly string[];
}

export interface TipoAdicionalCardapio {
  id: string;
  titulo: string;
  /** true = no máximo um acréscimo deste tipo por item (ex: troca do hambúrguer). */
  exclusivo: boolean;
}

export interface AdicionalCardapio {
  id: string;
  tipo: string;
  nome: string;
  precoCentavos: number;
}

export interface CategoriaCardapio {
  id: string;
  nome: string;
}

export const CATEGORIAS: readonly CategoriaCardapio[] = [
  { id: 'todos', nome: 'Todos' },
  { id: 'hamburgueres', nome: 'Hambúrgueres' },
  { id: 'lanches', nome: 'Frango, carne e pernil' },
  { id: 'vegetarianos', nome: 'Vegetarianos' },
  { id: 'cachorro-quente', nome: 'Cachorro quente' },
  { id: 'combos', nome: 'Combos' },
  { id: 'porcoes', nome: 'Porções' },
  { id: 'bebidas', nome: 'Bebidas' },
];

export const TIPOS_ADICIONAL: readonly TipoAdicionalCardapio[] = [
  { id: 'troca-hamburguer', titulo: 'Trocar o hambúrguer (opcional)', exclusivo: true },
  { id: 'lanche', titulo: 'Adicionais (opcional)', exclusivo: false },
  { id: 'batata-pequena', titulo: 'Adicionais da batata (opcional)', exclusivo: false },
  { id: 'batata-grande', titulo: 'Adicionais da batata (opcional)', exclusivo: false },
];

export const ADICIONAIS: readonly AdicionalCardapio[] = [
  { id: 'troca-costela', tipo: 'troca-hamburguer', nome: 'Trocar por hambúrguer de costela', precoCentavos: 300 },
  { id: 'troca-pimenta', tipo: 'troca-hamburguer', nome: 'Trocar por hambúrguer de pimenta', precoCentavos: 300 },
  { id: 'cheddar', tipo: 'lanche', nome: 'Cheddar', precoCentavos: 500 },
  { id: 'bacon', tipo: 'lanche', nome: 'Bacon', precoCentavos: 500 },
  { id: 'catupiry', tipo: 'lanche', nome: 'Catupiry', precoCentavos: 500 },
  { id: 'cebola-roxa', tipo: 'lanche', nome: 'Cebola roxa', precoCentavos: 300 },
  { id: 'milho', tipo: 'lanche', nome: 'Milho', precoCentavos: 300 },
  { id: 'salsichas-queijo', tipo: 'lanche', nome: '2 salsichas + queijo', precoCentavos: 700 },
  { id: 'cebola-grelhada', tipo: 'lanche', nome: 'Cebola grelhada', precoCentavos: 300 },
  { id: 'ovo', tipo: 'lanche', nome: 'Ovo', precoCentavos: 300 },
  { id: 'batata-palha', tipo: 'lanche', nome: 'Batata palha', precoCentavos: 300 },
  { id: 'queijo-prato', tipo: 'lanche', nome: 'Queijo prato', precoCentavos: 300 },
  { id: 'provolone', tipo: 'lanche', nome: 'Provolone', precoCentavos: 400 },
  { id: 'presunto', tipo: 'lanche', nome: 'Presunto', precoCentavos: 300 },
  { id: 'hamburguer-queijo', tipo: 'lanche', nome: 'Hambúrguer + queijo', precoCentavos: 1400 },
  { id: 'batata-p-bacon', tipo: 'batata-pequena', nome: 'Bacon', precoCentavos: 500 },
  { id: 'batata-p-catupiry', tipo: 'batata-pequena', nome: 'Catupiry', precoCentavos: 500 },
  { id: 'batata-p-cheddar', tipo: 'batata-pequena', nome: 'Cheddar', precoCentavos: 500 },
  { id: 'batata-p-queijo', tipo: 'batata-pequena', nome: 'Queijo', precoCentavos: 800 },
  { id: 'batata-g-bacon', tipo: 'batata-grande', nome: 'Bacon', precoCentavos: 800 },
  { id: 'batata-g-catupiry', tipo: 'batata-grande', nome: 'Catupiry', precoCentavos: 800 },
  { id: 'batata-g-cheddar', tipo: 'batata-grande', nome: 'Cheddar', precoCentavos: 800 },
  { id: 'batata-g-queijo', tipo: 'batata-grande', nome: 'Queijo', precoCentavos: 900 },
];

export const ITENS: readonly ItemCardapio[] = [
  {
    id: 'hamburgueres-1-x-burger',
    nome: 'X-Burger',
    descricao: 'Pão, hambúrguer, queijo e maionese',
    categoria: 'hamburgueres',
    grupo: 'Hambúrguer Bovino 150g',
    permiteAcrescimo: true,
    adicionais: ['troca-hamburguer', 'lanche'],
    precoCentavos: 2700,
  },
  {
    id: 'hamburgueres-2-x-salada',
    nome: 'X-Salada',
    descricao: 'Pão, hambúrguer, queijo, maionese, alface e tomate',
    categoria: 'hamburgueres',
    grupo: 'Hambúrguer Bovino 150g',
    permiteAcrescimo: true,
    adicionais: ['troca-hamburguer', 'lanche'],
    precoCentavos: 2800,
  },
  {
    id: 'hamburgueres-3-x-bacon',
    nome: 'X-Bacon',
    descricao: 'Pão, hambúrguer, bacon, queijo, maionese, alface e tomate',
    categoria: 'hamburgueres',
    grupo: 'Hambúrguer Bovino 150g',
    permiteAcrescimo: true,
    adicionais: ['troca-hamburguer', 'lanche'],
    precoCentavos: 3300,
  },
  {
    id: 'hamburgueres-4-x-bacon-egg',
    nome: 'X-Bacon Egg',
    descricao: 'Pão, hambúrguer, bacon, ovo, queijo, maionese, alface e tomate',
    categoria: 'hamburgueres',
    grupo: 'Hambúrguer Bovino 150g',
    permiteAcrescimo: true,
    adicionais: ['troca-hamburguer', 'lanche'],
    precoCentavos: 3500,
  },
  {
    id: 'hamburgueres-5-big-bacon',
    nome: 'Big Bacon',
    descricao: 'Pão, 2 hambúrgueres, bacon, queijo, maionese, alface e tomate',
    categoria: 'hamburgueres',
    grupo: 'Hambúrguer Bovino 150g',
    permiteAcrescimo: true,
    adicionais: ['troca-hamburguer', 'lanche'],
    precoCentavos: 4800,
  },
  {
    id: 'hamburgueres-6-x-egg',
    nome: 'X-Egg',
    descricao: 'Pão, hambúrguer, ovo, queijo, maionese, alface e tomate',
    categoria: 'hamburgueres',
    grupo: 'Hambúrguer Bovino 150g',
    permiteAcrescimo: true,
    adicionais: ['troca-hamburguer', 'lanche'],
    precoCentavos: 3000,
  },
  {
    id: 'hamburgueres-7-x-egg-duplo',
    nome: 'X-Egg Duplo',
    descricao: 'Pão, hambúrguer, queijo, 2 ovos, maionese, alface e tomate',
    categoria: 'hamburgueres',
    grupo: 'Hambúrguer Bovino 150g',
    permiteAcrescimo: true,
    adicionais: ['troca-hamburguer', 'lanche'],
    precoCentavos: 3500,
  },
  {
    id: 'hamburgueres-8-big-city',
    nome: 'Big City',
    descricao: 'Pão, 2 hambúrgueres, bacon, ovo, queijo, maionese, alface e tomate',
    categoria: 'hamburgueres',
    grupo: 'Hambúrguer Bovino 150g',
    permiteAcrescimo: true,
    adicionais: ['troca-hamburguer', 'lanche'],
    precoCentavos: 4900,
  },
  {
    id: 'hamburgueres-9-monster-city',
    nome: 'Monster City',
    descricao: 'Pão, 3 hambúrgueres, 2 ovos, queijo, bacon, maionese, alface e tomate',
    categoria: 'hamburgueres',
    grupo: 'Hambúrguer Bovino 150g',
    permiteAcrescimo: true,
    adicionais: ['troca-hamburguer', 'lanche'],
    precoCentavos: 6700,
  },
  {
    id: 'hamburgueres-10-x-tudo',
    nome: 'X-Tudo',
    descricao: 'Pão, hambúrguer, frango, presunto, queijo, provolone, ovo, catupiry, bacon, maionese, alface, cebola grelhada e tomate',
    categoria: 'hamburgueres',
    grupo: 'Hambúrguer Bovino 150g',
    permiteAcrescimo: true,
    adicionais: ['troca-hamburguer', 'lanche'],
    precoCentavos: 5900,
  },
  {
    id: 'hamburgueres-11-x-americano',
    nome: 'X-Americano',
    descricao: 'Pão, hambúrguer, presunto, queijo, ovo, maionese, alface e tomate',
    categoria: 'hamburgueres',
    grupo: 'Hambúrguer Bovino 150g',
    permiteAcrescimo: true,
    adicionais: ['troca-hamburguer', 'lanche'],
    precoCentavos: 3300,
  },
  {
    id: 'hamburgueres-12-x-acebolado',
    nome: 'X-Acebolado',
    descricao: 'Pão, hambúrguer, cebola grelhada, queijo, maionese, alface e tomate',
    categoria: 'hamburgueres',
    grupo: 'Hambúrguer Bovino 150g',
    permiteAcrescimo: true,
    adicionais: ['troca-hamburguer', 'lanche'],
    precoCentavos: 3000,
  },
  {
    id: 'hamburgueres-13-x-carne-a-moda-da-casa',
    nome: 'X-Carne à Moda da Casa',
    descricao: 'Pão, hambúrguer, queijo, catupiry, provolone, maionese, alface e tomate',
    categoria: 'hamburgueres',
    grupo: 'Hambúrguer Bovino 150g',
    permiteAcrescimo: true,
    adicionais: ['troca-hamburguer', 'lanche'],
    precoCentavos: 3600,
  },
  {
    id: 'hamburgueres-14-x-carne-a-moda-da-casa-bacon',
    nome: 'X-Carne à Moda da Casa + Bacon',
    descricao: 'Pão, hambúrguer, bacon, queijo, catupiry, provolone, maionese, alface e tomate',
    categoria: 'hamburgueres',
    grupo: 'Hambúrguer Bovino 150g',
    permiteAcrescimo: true,
    adicionais: ['troca-hamburguer', 'lanche'],
    precoCentavos: 4000,
  },
  {
    id: 'hamburgueres-15-x-burger-p',
    nome: 'X-Burger P',
    descricao: 'Pão, hambúrguer, queijo e maionese',
    categoria: 'hamburgueres',
    grupo: 'Hambúrguer Bovino 90g',
    permiteAcrescimo: true,
    adicionais: ['troca-hamburguer', 'lanche'],
    precoCentavos: 2000,
  },
  {
    id: 'hamburgueres-16-x-salada-p',
    nome: 'X-Salada P',
    descricao: 'Pão, hambúrguer, queijo, maionese, alface e tomate',
    categoria: 'hamburgueres',
    grupo: 'Hambúrguer Bovino 90g',
    permiteAcrescimo: true,
    adicionais: ['troca-hamburguer', 'lanche'],
    precoCentavos: 2100,
  },
  {
    id: 'hamburgueres-17-x-bacon-p',
    nome: 'X-Bacon P',
    descricao: 'Pão, hambúrguer, bacon, queijo, maionese, alface e tomate',
    categoria: 'hamburgueres',
    grupo: 'Hambúrguer Bovino 90g',
    permiteAcrescimo: true,
    adicionais: ['troca-hamburguer', 'lanche'],
    precoCentavos: 2200,
  },
  {
    id: 'hamburgueres-18-x-egg-p',
    nome: 'X-Egg P',
    descricao: 'Pão, hambúrguer, ovo, queijo, maionese, alface e tomate',
    categoria: 'hamburgueres',
    grupo: 'Hambúrguer Bovino 90g',
    permiteAcrescimo: true,
    adicionais: ['troca-hamburguer', 'lanche'],
    precoCentavos: 2200,
  },
  {
    id: 'lanches-19-x-frango',
    nome: 'X-Frango',
    descricao: 'Pão, filé de frango em cubos, queijo, maionese, alface e tomate',
    categoria: 'lanches',
    grupo: 'Lanches de Frango',
    permiteAcrescimo: true,
    adicionais: ['lanche'],
    precoCentavos: 2800,
  },
  {
    id: 'lanches-20-x-frango-a-moda-da-casa',
    nome: 'X-Frango à Moda da Casa',
    descricao: 'Pão, filé de frango em cubos, queijo, catupiry, provolone, maionese, alface e tomate',
    categoria: 'lanches',
    grupo: 'Lanches de Frango',
    permiteAcrescimo: true,
    adicionais: ['lanche'],
    precoCentavos: 3500,
  },
  {
    id: 'lanches-21-x-franbacon',
    nome: 'X-Franbacon',
    descricao: 'Pão, filé de frango em cubos, queijo, bacon, maionese, alface e tomate',
    categoria: 'lanches',
    grupo: 'Lanches de Frango',
    permiteAcrescimo: true,
    adicionais: ['lanche'],
    precoCentavos: 3300,
  },
  {
    id: 'lanches-22-churrasquinho',
    nome: 'Churrasquinho',
    descricao: 'Baguete, alcatra, queijo, maionese, tomate, rúcula ou alface',
    categoria: 'lanches',
    grupo: 'Lanches de Carne',
    permiteAcrescimo: true,
    adicionais: ['lanche'],
    precoCentavos: 3800,
  },
  {
    id: 'lanches-23-churrasquinho-file-mignon',
    nome: 'Churrasquinho Filé Mignon',
    descricao: 'Baguete, filé mignon, queijo, provolone, cebola roxa, maionese, tomate, rúcula ou alface',
    categoria: 'lanches',
    grupo: 'Lanches de Carne',
    permiteAcrescimo: true,
    adicionais: ['lanche'],
    precoCentavos: 5900,
  },
  {
    id: 'lanches-24-x-pernil',
    nome: 'X-Pernil',
    descricao: 'Baguete, pernil desfiado, queijo, cebola grelhada, maionese, alface e tomate',
    categoria: 'lanches',
    grupo: 'Lanche de Pernil',
    permiteAcrescimo: true,
    adicionais: ['lanche'],
    precoCentavos: 3000,
  },
  {
    id: 'lanches-25-misto-quente',
    nome: 'Misto Quente',
    descricao: 'Pão de hambúrguer, presunto, queijo, maionese e tomate',
    categoria: 'lanches',
    grupo: 'Misto Quente',
    permiteAcrescimo: true,
    adicionais: ['lanche'],
    precoCentavos: 2000,
  },
  {
    id: 'vegetarianos-26-vegetariano',
    nome: 'Vegetariano',
    descricao: 'Pão, hambúrguer de legumes, queijo, maionese, alface e tomate',
    categoria: 'vegetarianos',
    grupo: 'Vegetarianos',
    permiteAcrescimo: true,
    adicionais: ['lanche'],
    precoCentavos: 2600,
  },
  {
    id: 'vegetarianos-27-vegetariano-3-queijos',
    nome: 'Vegetariano 3 Queijos',
    descricao: 'Pão, hambúrguer de legumes, queijo, provolone, catupiry, maionese, alface e tomate',
    categoria: 'vegetarianos',
    grupo: 'Vegetarianos',
    permiteAcrescimo: true,
    adicionais: ['lanche'],
    precoCentavos: 3300,
  },
  {
    id: 'vegetarianos-28-x-schin',
    nome: 'X-Schin',
    descricao: 'Pão, 2 ovos, queijo prato, provolone, cebola roxa, tomate e alface',
    categoria: 'vegetarianos',
    grupo: 'Vegetarianos',
    permiteAcrescimo: true,
    adicionais: ['lanche'],
    precoCentavos: 3300,
  },
  {
    id: 'cachorro-quente-29-cachorro-quente-simples',
    nome: 'Cachorro Quente Simples',
    descricao: 'Pão, 2 salsichas, queijo e maionese',
    categoria: 'cachorro-quente',
    grupo: 'Cachorro Quente',
    permiteAcrescimo: true,
    adicionais: ['lanche'],
    precoCentavos: 1900,
  },
  {
    id: 'cachorro-quente-30-cachorro-quente',
    nome: 'Cachorro Quente',
    descricao: 'Pão, 2 salsichas, queijo, milho verde, batata palha e tomate picado',
    categoria: 'cachorro-quente',
    grupo: 'Cachorro Quente',
    permiteAcrescimo: true,
    adicionais: ['lanche'],
    precoCentavos: 2500,
  },
  {
    id: 'cachorro-quente-31-cachorro-quente-com-bacon',
    nome: 'Cachorro Quente com Bacon',
    descricao: 'Pão, 2 salsichas, bacon, queijo, milho verde, batata palha e tomate picado',
    categoria: 'cachorro-quente',
    grupo: 'Cachorro Quente',
    permiteAcrescimo: true,
    adicionais: ['lanche'],
    precoCentavos: 2900,
  },
  {
    id: 'combos-32-combo-x-salada',
    nome: 'Combo X-Salada',
    descricao: 'X-Salada + refri lata à escolha + batata 200g',
    categoria: 'combos',
    grupo: 'Combos',
    permiteAcrescimo: true,
    adicionais: ['troca-hamburguer', 'lanche'],
    variantes: [
      { id: 'coca-cola', nome: 'Coca-Cola', precoCentavos: 4000 },
      { id: 'coca-cola-zero', nome: 'Coca-Cola Zero', precoCentavos: 4000 },
      { id: 'guarana-antarctica', nome: 'Guaraná Antarctica', precoCentavos: 4000 },
      { id: 'fanta-laranja', nome: 'Fanta Laranja', precoCentavos: 4000 },
      { id: 'sprite', nome: 'Sprite', precoCentavos: 4000 },
    ],
  },
  {
    id: 'combos-33-combo-x-bacon',
    nome: 'Combo X-Bacon',
    descricao: 'X-Bacon + refri lata à escolha + batata 200g',
    categoria: 'combos',
    grupo: 'Combos',
    permiteAcrescimo: true,
    adicionais: ['troca-hamburguer', 'lanche'],
    variantes: [
      { id: 'coca-cola', nome: 'Coca-Cola', precoCentavos: 4500 },
      { id: 'coca-cola-zero', nome: 'Coca-Cola Zero', precoCentavos: 4500 },
      { id: 'guarana-antarctica', nome: 'Guaraná Antarctica', precoCentavos: 4500 },
      { id: 'fanta-laranja', nome: 'Fanta Laranja', precoCentavos: 4500 },
      { id: 'sprite', nome: 'Sprite', precoCentavos: 4500 },
    ],
  },
  {
    id: 'porcoes-34-batata-palito-pequena',
    nome: 'Batata Palito Pequena',
    categoria: 'porcoes',
    grupo: 'Porção de Batata Frita',
    permiteAcrescimo: true,
    adicionais: ['batata-pequena'],
    precoCentavos: 1200,
  },
  {
    id: 'porcoes-35-batata-palito-grande',
    nome: 'Batata Palito Grande',
    categoria: 'porcoes',
    grupo: 'Porção de Batata Frita',
    permiteAcrescimo: true,
    adicionais: ['batata-grande'],
    precoCentavos: 2200,
  },
  {
    id: 'porcoes-36-batata-ondulada-pequena',
    nome: 'Batata Ondulada Pequena',
    categoria: 'porcoes',
    grupo: 'Porção de Batata Frita',
    permiteAcrescimo: true,
    adicionais: ['batata-pequena'],
    precoCentavos: 1400,
  },
  {
    id: 'porcoes-37-batata-ondulada-grande',
    nome: 'Batata Ondulada Grande',
    categoria: 'porcoes',
    grupo: 'Porção de Batata Frita',
    permiteAcrescimo: true,
    adicionais: ['batata-grande'],
    precoCentavos: 2600,
  },
  {
    id: 'porcoes-38-polenta-frita-500g',
    nome: 'Polenta Frita 500g',
    categoria: 'porcoes',
    grupo: 'Polenta',
    permiteAcrescimo: false,
    adicionais: [],
    precoCentavos: 1800,
  },
  {
    id: 'bebidas-39-refrigerante-lata',
    nome: 'Refrigerante Lata',
    categoria: 'bebidas',
    grupo: 'Refrigerantes',
    permiteAcrescimo: false,
    adicionais: [],
    variantes: [
      { id: 'coca-cola', nome: 'Coca-Cola', precoCentavos: 800 },
      { id: 'coca-cola-zero', nome: 'Coca-Cola Zero', precoCentavos: 800 },
      { id: 'guarana-antarctica', nome: 'Guaraná Antarctica', precoCentavos: 800 },
      { id: 'fanta-laranja', nome: 'Fanta Laranja', precoCentavos: 800 },
      { id: 'sprite', nome: 'Sprite', precoCentavos: 800 },
    ],
  },
  {
    id: 'bebidas-40-coca-cola-600ml',
    nome: 'Coca-Cola 600ml',
    categoria: 'bebidas',
    grupo: 'Refrigerantes',
    permiteAcrescimo: false,
    adicionais: [],
    precoCentavos: 1100,
  },
  {
    id: 'bebidas-41-coca-cola-1l',
    nome: 'Coca-Cola 1L',
    categoria: 'bebidas',
    grupo: 'Refrigerantes',
    permiteAcrescimo: false,
    adicionais: [],
    precoCentavos: 1100,
  },
  {
    id: 'bebidas-42-refrigerante-1-5l',
    nome: 'Refrigerante 1,5L',
    categoria: 'bebidas',
    grupo: 'Refrigerantes',
    permiteAcrescimo: false,
    adicionais: [],
    variantes: [
      { id: 'guarana-antarctica', nome: 'Guaraná Antarctica', precoCentavos: 1300 },
      { id: 'fanta-laranja', nome: 'Fanta Laranja', precoCentavos: 1300 },
      { id: 'sprite', nome: 'Sprite', precoCentavos: 1300 },
    ],
  },
  {
    id: 'bebidas-43-coca-cola-2l',
    nome: 'Coca-Cola 2L',
    categoria: 'bebidas',
    grupo: 'Refrigerantes',
    permiteAcrescimo: false,
    adicionais: [],
    precoCentavos: 2000,
  },
  {
    id: 'bebidas-44-suco-del-valle-lata',
    nome: 'Suco Del Valle Lata',
    categoria: 'bebidas',
    grupo: 'Sucos',
    permiteAcrescimo: false,
    adicionais: [],
    variantes: [
      { id: 'uva', nome: 'Uva', precoCentavos: 800 },
      { id: 'pessego', nome: 'Pêssego', precoCentavos: 800 },
      { id: 'maracuja', nome: 'Maracujá', precoCentavos: 800 },
      { id: 'manga', nome: 'Manga', precoCentavos: 800 },
    ],
  },
  {
    id: 'bebidas-45-suco-de-laranja',
    nome: 'Suco de Laranja',
    categoria: 'bebidas',
    grupo: 'Sucos',
    permiteAcrescimo: false,
    adicionais: [],
    precoCentavos: 1200,
  },
  {
    id: 'bebidas-46-h2o',
    nome: 'H2O',
    categoria: 'bebidas',
    grupo: 'Água',
    permiteAcrescimo: false,
    adicionais: [],
    variantes: [
      { id: 'limao', nome: 'Limão', precoCentavos: 900 },
      { id: 'limoneto', nome: 'Limoneto', precoCentavos: 900 },
    ],
  },
  {
    id: 'bebidas-47-agua',
    nome: 'Água',
    categoria: 'bebidas',
    grupo: 'Água',
    permiteAcrescimo: false,
    adicionais: [],
    precoCentavos: 400,
  },
  {
    id: 'bebidas-48-heineken-long-neck',
    nome: 'Heineken Long Neck',
    categoria: 'bebidas',
    grupo: 'Cervejas',
    permiteAcrescimo: false,
    adicionais: [],
    precoCentavos: 1300,
  },
  {
    id: 'bebidas-49-cerveja-lata',
    nome: 'Cerveja Lata',
    categoria: 'bebidas',
    grupo: 'Cervejas',
    permiteAcrescimo: false,
    adicionais: [],
    variantes: [
      { id: 'skol', nome: 'Skol', precoCentavos: 800 },
      { id: 'brahma', nome: 'Brahma', precoCentavos: 800 },
    ],
  },
  {
    id: 'bebidas-50-antarctica-original',
    nome: 'Antarctica Original',
    categoria: 'bebidas',
    grupo: 'Cervejas',
    permiteAcrescimo: false,
    adicionais: [],
    precoCentavos: 800,
  },
];
