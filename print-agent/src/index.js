import { config } from './config.js';
import { buscarPedidosRecebidos, marcarComoImpresso } from './api.js';
import { formatarCupom } from './formatarCupom.js';
import { imprimir } from './imprimir.js';

let cicloEmAndamento = false;

// Sem toLocaleTimeString pelo mesmo motivo do formatarCupom.js: o .exe
// empacotado não carrega os dados de idioma além do inglês. Aqui usamos o
// relógio do próprio computador, que é o que se espera de um log ("que
// horas ISTO aconteceu na loja").
function horario() {
  const agora = new Date();
  const doisDigitos = (n) => String(n).padStart(2, '0');
  return `${doisDigitos(agora.getHours())}:${doisDigitos(agora.getMinutes())}:${doisDigitos(agora.getSeconds())}`;
}

async function processarPedido(pedido) {
  const identificador = pedido.codigo ?? pedido.id;
  try {
    const cupom = formatarCupom(pedido, config);
    await imprimir(cupom, config);
    // Só marca como impresso DEPOIS de confirmar que a impressão não deu
    // erro. Se a impressora estiver sem papel/desligada, o pedido continua
    // com status "recebido" e volta a aparecer no próximo ciclo — nada se
    // perde (mesmo comportamento documentado em backend/docs/API.md).
    await marcarComoImpresso(config, pedido.id);
    console.log(`[${horario()}] Pedido ${identificador} impresso e marcado.`);
  } catch (erro) {
    console.error(`[${horario()}] Falha ao processar pedido ${identificador}: ${erro.message}`);
  }
}

async function ciclo() {
  if (cicloEmAndamento) return; // evita sobrepor ciclos se uma busca demorar
  cicloEmAndamento = true;
  try {
    const pedidos = await buscarPedidosRecebidos(config);
    if (pedidos.length > 0) {
      console.log(`[${horario()}] ${pedidos.length} pedido(s) novo(s) na fila.`);
    }
    for (const pedido of pedidos) {
      await processarPedido(pedido);
    }
  } catch (erro) {
    console.error(`[${horario()}] Erro ao buscar pedidos: ${erro.message}`);
  } finally {
    cicloEmAndamento = false;
  }
}

console.log('Agente de impressão — Eric Burger');
console.log(`  API:               ${config.apiBaseUrl}`);
console.log(`  Modo de impressão: ${config.printMode}`);
if (config.printMode === 'windows') {
  console.log(`  Impressora:        ${config.printerName}`);
}
console.log(`  Verificando a cada ${config.pollIntervalMs}ms. Ctrl+C pra parar.\n`);

ciclo();
setInterval(ciclo, config.pollIntervalMs);
