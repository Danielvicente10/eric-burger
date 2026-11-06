// Gera backend/src/cardapio/cardapio.data.ts a partir de src/data/cardapio.js.
//
// Rode sempre que mexer no cardápio:
//     npm run cardapio
//
// POR QUE ISTO EXISTE
//
// Os ids dos itens são POSICIONAIS: o front monta
// `${categoria}-${contador}-${slug}` com um contador global, na ordem do
// arquivo. Inserir ou remover um item no meio desloca o id de todos os
// seguintes.
//
// Como o backend guardava esses ids como literais escritos à mão, editar
// os dois arquivos separadamente colocava as listas fora de sincronia — e
// aí o front passa a mandar ids que o backend não conhece, fazendo TODO
// pedido falhar com "Item de cardápio desconhecido". Gerando um a partir
// do outro, isso deixa de ser possível.
//
// O backend continua sendo a fonte de verdade do CÁLCULO (nunca confia em
// preço vindo do cliente). O que este script garante é que as duas listas
// descrevem exatamente os mesmos itens.

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const origem = path.join(raiz, 'src', 'data', 'cardapio.js');
const destino = path.join(raiz, 'backend', 'src', 'cardapio', 'cardapio.data.ts');

const { ADICIONAIS, CATEGORIAS, TIPOS_ADICIONAL, TODOS_ITENS } = await import(
  new URL(`file:///${origem.replace(/\\/g, '/')}`).href
);

const centavos = (reais) => Math.round(reais * 100);
const aspas = (s) => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

const cabecalho = `// Cópia, no backend, do cardápio que vive em src/data/cardapio.js no
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
`;

const blocoCategorias =
  `\nexport const CATEGORIAS: readonly CategoriaCardapio[] = [\n` +
  CATEGORIAS.map((c) => `  { id: ${aspas(c.id)}, nome: ${aspas(c.nome)} },`).join('\n') +
  `\n];\n`;

const blocoTipos =
  `\nexport const TIPOS_ADICIONAL: readonly TipoAdicionalCardapio[] = [\n` +
  TIPOS_ADICIONAL.map(
    (t) => `  { id: ${aspas(t.id)}, titulo: ${aspas(t.titulo)}, exclusivo: ${t.exclusivo} },`,
  ).join('\n') +
  `\n];\n`;

const blocoAdicionais =
  `\nexport const ADICIONAIS: readonly AdicionalCardapio[] = [\n` +
  ADICIONAIS.map(
    (a) =>
      `  { id: ${aspas(a.id)}, tipo: ${aspas(a.tipo)}, nome: ${aspas(a.nome)}, precoCentavos: ${centavos(a.preco)} },`,
  ).join('\n') +
  `\n];\n`;

function itemParaTs(item) {
  const linhas = [`    id: ${aspas(item.id)},`, `    nome: ${aspas(item.nome)},`];
  if (item.descricao) linhas.push(`    descricao: ${aspas(item.descricao)},`);
  linhas.push(`    categoria: ${aspas(item.categoria)},`);
  linhas.push(`    grupo: ${aspas(item.grupo)},`);
  linhas.push(`    permiteAcrescimo: ${item.permiteAcrescimo},`);
  linhas.push(`    adicionais: [${item.adicionais.map(aspas).join(', ')}],`);

  if (Array.isArray(item.variantes)) {
    linhas.push(`    variantes: [`);
    for (const v of item.variantes) {
      linhas.push(
        `      { id: ${aspas(v.id)}, nome: ${aspas(v.nome)}, precoCentavos: ${centavos(v.preco)} },`,
      );
    }
    linhas.push(`    ],`);
  } else {
    linhas.push(`    precoCentavos: ${centavos(item.preco)},`);
  }

  return `  {\n${linhas.join('\n')}\n  },`;
}

const blocoItens =
  `\nexport const ITENS: readonly ItemCardapio[] = [\n` +
  TODOS_ITENS.map(itemParaTs).join('\n') +
  `\n];\n`;

// Antes de gravar, checa o que quebraria em silêncio.
const problemas = [];

const semPreco = TODOS_ITENS.filter(
  (i) => !Array.isArray(i.variantes) && typeof i.preco !== 'number',
);
for (const i of semPreco) problemas.push(`item sem preço: ${i.nome}`);

const tiposValidos = new Set(TIPOS_ADICIONAL.map((t) => t.id));
for (const a of ADICIONAIS) {
  if (!tiposValidos.has(a.tipo)) problemas.push(`acréscimo com tipo desconhecido: ${a.id} (${a.tipo})`);
}
for (const i of TODOS_ITENS) {
  for (const t of i.adicionais) {
    if (!tiposValidos.has(t)) problemas.push(`item com tipo de acréscimo desconhecido: ${i.nome} (${t})`);
  }
}
const idsAdicionais = new Set();
for (const a of ADICIONAIS) {
  if (idsAdicionais.has(a.id)) problemas.push(`acréscimo com id duplicado: ${a.id}`);
  idsAdicionais.add(a.id);
}

const vistos = new Set();
for (const i of TODOS_ITENS) {
  if (vistos.has(i.id)) problemas.push(`id duplicado: ${i.id}`);
  vistos.add(i.id);
}

if (problemas.length) {
  console.error('Cardápio inconsistente — nada foi gerado:');
  for (const p of problemas) console.error(`  - ${p}`);
  process.exit(1);
}

writeFileSync(destino, cabecalho + blocoCategorias + blocoTipos + blocoAdicionais + blocoItens, 'utf8');

const comVariantes = TODOS_ITENS.filter((i) => i.variantes).length;
console.log(`cardapio.data.ts gerado`);
console.log(`  itens        : ${TODOS_ITENS.length} (${comVariantes} com variantes)`);
console.log(`  acréscimos   : ${ADICIONAIS.length}`);
console.log(`  categorias   : ${CATEGORIAS.length}`);
