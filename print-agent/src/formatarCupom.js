// Monta o cupom de um pedido em dois formatos a partir da MESMA lista de
// "blocos" (uma descrição neutra do conteúdo): texto puro (pra conferir no
// terminal, modo PRINT_MODE=console) e bytes ESC/POS (pra imprimir de
// verdade numa térmica, modo PRINT_MODE=windows).

const ESC = 0x1b;
const GS = 0x1d;

function comandoInicializar() {
  return Buffer.from([ESC, 0x40]);
}

function comandoAlinhar(alinhamento) {
  // 0 = esquerda, 1 = centro, 2 = direita
  return Buffer.from([ESC, 0x61, alinhamento]);
}

function comandoNegrito(ligado) {
  return Buffer.from([ESC, 0x45, ligado ? 1 : 0]);
}

function comandoTamanhoDuplo(ligado) {
  return Buffer.from([GS, 0x21, ligado ? 0x11 : 0x00]);
}

function comandoCortar() {
  return Buffer.from([GS, 0x56, 0x00]);
}

function comandoAvancarLinhas(n) {
  return Buffer.from(Array(n).fill(0x0a));
}

// A maioria das térmicas baratas (clones ESC/POS) não decodifica UTF-8
// corretamente e o codepage varia de modelo pra modelo. Pra não arriscar
// imprimir caractere quebrado sem saber o modelo exato da impressora da
// loja, tiramos os acentos — garante leitura correta em qualquer impressora.
const REGEX_MARCAS_DIACRITICAS = new RegExp('[\\u0300-\\u036f]', 'g');

function semAcentos(texto) {
  return texto.normalize('NFD').replace(REGEX_MARCAS_DIACRITICAS, '');
}

// Valor e data são formatados na mão, sem toLocaleString/Intl, de propósito.
//
// O agente roda na loja como .exe empacotado (pkg), e o Node embutido nele
// só carrega os dados de idioma em inglês. Pedir 'pt-BR' nesse ambiente não
// dá erro: ele cai calado no formato americano. Na prática o cupom saía
// "R$ 30.00" em vez de "R$ 30,00" e "08-13 22:20" em vez de "13/08, 22:20"
// — errado no papel, e sem nenhum sinal de que algo tinha falhado.
//
// As duas funções abaixo produzem exatamente o mesmo resultado que o
// toLocaleString('pt-BR') produzia rodando com Node completo.

function separarMilhar(inteiro) {
  return String(inteiro).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function formatarReais(centavos) {
  const arredondado = Math.round(centavos);
  const sinal = arredondado < 0 ? '-' : '';
  const absoluto = Math.abs(arredondado);
  const reais = separarMilhar(Math.floor(absoluto / 100));
  const centavosRestantes = String(absoluto % 100).padStart(2, '0');
  return `${sinal}R$ ${reais},${centavosRestantes}`;
}

// A loja fica em SP, que é UTC-3 o ano inteiro: o Brasil não tem horário de verão
// desde 2019. Fixar o deslocamento evita depender da base de fusos (que o
// .exe também não carrega) e do relógio do computador da loja estar com o
// fuso configurado certo — o horário do cupom sai correto de qualquer jeito.
const FUSO_BRASIL_EM_MS = -3 * 60 * 60 * 1000;

function formatarDataHora(iso) {
  const noHorarioLocal = new Date(new Date(iso).getTime() + FUSO_BRASIL_EM_MS);
  const dia = String(noHorarioLocal.getUTCDate()).padStart(2, '0');
  const mes = String(noHorarioLocal.getUTCMonth() + 1).padStart(2, '0');
  const hora = String(noHorarioLocal.getUTCHours()).padStart(2, '0');
  const minuto = String(noHorarioLocal.getUTCMinutes()).padStart(2, '0');
  return `${dia}/${mes}, ${hora}:${minuto}`;
}

/** Descreve o conteúdo do cupom como uma lista neutra de blocos de texto. */
function montarBlocos(pedido, cols) {
  const linhaSeparadora = '-'.repeat(cols);
  const blocos = [];

  // Em fonte dupla cabe cerca de metade das colunas da bobina (~16 numa de
  // 58mm): "ERIC BURGER" (11) cabe numa linha só.
  blocos.push({ centro: true, negrito: true, duplo: true, texto: 'ERIC BURGER' });
  blocos.push({ centro: true, texto: 'Delivery' });
  blocos.push({ centro: true, texto: `Pedido ${pedido.codigo}` });
  blocos.push({ centro: true, texto: formatarDataHora(pedido.criadoEm) });
  blocos.push({ texto: linhaSeparadora });

  blocos.push({ negrito: true, texto: `Cliente: ${pedido.nomeCliente}` });
  if (pedido.telefone) {
    blocos.push({ texto: `Tel: ${pedido.telefone}` });
  }

  if (pedido.tipoEntrega === 'ENTREGA' && pedido.endereco) {
    const e = pedido.endereco;
    blocos.push({ negrito: true, texto: '>> ENTREGA' });
    blocos.push({ texto: `${e.rua ?? ''}, ${e.numero ?? 's/n'} - ${e.bairro ?? ''}` });
    if (e.complemento) blocos.push({ texto: `Compl: ${e.complemento}` });
    if (e.referencia) blocos.push({ texto: `Ref: ${e.referencia}` });
    if (e.cep) blocos.push({ texto: `CEP: ${e.cep}` });
  } else {
    blocos.push({ negrito: true, texto: '>> RETIRADA NO LOCAL' });
  }

  blocos.push({ texto: linhaSeparadora });

  for (const item of pedido.itens) {
    let nomeItem = item.itemNome;
    if (item.varianteNome) nomeItem += ` (${item.varianteNome})`;
    blocos.push({ negrito: true, texto: `${item.quantidade}x ${nomeItem}` });
    for (const acrescimo of item.acrescimos ?? []) {
      blocos.push({ texto: `   + ${acrescimo.nome}` });
    }
    if (item.observacao) {
      blocos.push({ texto: `   obs: ${item.observacao}` });
    }
    blocos.push({ direita: true, texto: formatarReais(item.subtotalCentavos) });
  }

  blocos.push({ texto: linhaSeparadora });
  if (pedido.taxaEntregaCentavos > 0) {
    blocos.push({ texto: `Taxa de entrega: ${formatarReais(pedido.taxaEntregaCentavos)}` });
  }
  blocos.push({ texto: `Pagamento: ${pedido.pagamento}` });
  blocos.push({ negrito: true, duplo: true, texto: `TOTAL: ${formatarReais(pedido.totalCentavos)}` });

  // Troco calculado aqui, e não recebido pronto: a conta usa o total que o
  // servidor gravou, então o papel nunca discorda do que foi cobrado.
  // Em negrito porque é o número que alguém precisa separar em espécie
  // antes de a moto sair.
  if (pedido.trocoParaCentavos != null) {
    const trocoCentavos = pedido.trocoParaCentavos - pedido.totalCentavos;
    blocos.push({ texto: linhaSeparadora });
    blocos.push({ texto: `Paga com: ${formatarReais(pedido.trocoParaCentavos)}` });
    blocos.push({ negrito: true, texto: `TROCO: ${formatarReais(trocoCentavos)}` });
  }
  blocos.push({ texto: linhaSeparadora });
  blocos.push({ centro: true, texto: 'Obrigado pela preferencia!' });

  return blocos;
}

// Quebra um bloco que não cabe na largura da bobina em vários blocos, sem
// partir palavra no meio. Sem isso, a impressora quebra sozinha em qualquer
// ponto (inclusive no meio de uma palavra) — o que já estava acontecendo com
// a linha do endereço de entrega, justamente a que o entregador precisa ler.
// Blocos em fonte dupla ocupam o dobro por caractere, então cabem metade.
function quebrarBloco(bloco, cols) {
  const largura = bloco.duplo ? Math.floor(cols / 2) : cols;
  if (bloco.texto.length <= largura) return [bloco];

  const linhas = [];
  let atual = '';
  for (const palavra of bloco.texto.split(' ')) {
    const candidata = atual ? `${atual} ${palavra}` : palavra;
    if (candidata.length <= largura) {
      atual = candidata;
      continue;
    }
    if (atual) linhas.push(atual);
    // Palavra sozinha maior que a linha inteira (raro): corta no limite.
    if (palavra.length > largura) {
      let resto = palavra;
      while (resto.length > largura) {
        linhas.push(resto.slice(0, largura));
        resto = resto.slice(largura);
      }
      atual = resto;
    } else {
      atual = palavra;
    }
  }
  if (atual) linhas.push(atual);

  return linhas.map((texto) => ({ ...bloco, texto }));
}

function ajustarLargura(blocos, cols) {
  return blocos.flatMap((bloco) => quebrarBloco(bloco, cols));
}

function renderizarTexto(blocos) {
  return blocos.map((b) => b.texto).join('\n');
}

function renderizarEscPos(blocos) {
  const partes = [comandoInicializar(), comandoAlinhar(0)];
  let alinhamentoAtual = 0;

  for (const bloco of blocos) {
    const alvo = bloco.centro ? 1 : bloco.direita ? 2 : 0;
    if (alvo !== alinhamentoAtual) {
      partes.push(comandoAlinhar(alvo));
      alinhamentoAtual = alvo;
    }
    if (bloco.negrito) partes.push(comandoNegrito(true));
    if (bloco.duplo) partes.push(comandoTamanhoDuplo(true));

    partes.push(Buffer.from(semAcentos(bloco.texto) + '\n', 'ascii'));

    if (bloco.duplo) partes.push(comandoTamanhoDuplo(false));
    if (bloco.negrito) partes.push(comandoNegrito(false));
  }

  partes.push(comandoAvancarLinhas(3));
  partes.push(comandoCortar());
  return Buffer.concat(partes);
}

/**
 * Formata um pedido (no formato retornado pela API) como cupom.
 * Retorna { texto, bytes } — use `texto` pra conferir/depurar e `bytes`
 * pra mandar de verdade pra impressora térmica.
 */
export function formatarCupom(pedido, config) {
  const blocos = ajustarLargura(montarBlocos(pedido, config.printerCols), config.printerCols);
  return {
    texto: renderizarTexto(blocos),
    bytes: renderizarEscPos(blocos),
  };
}
