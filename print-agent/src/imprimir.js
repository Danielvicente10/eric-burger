// "Transporte" do cupom já formatado até a impressora de verdade.
//
// PRINT_MODE=console: só mostra no terminal. Serve pra testar o agente
// inteiro (busca + formatação + marcação de status) sem gastar papel nem
// precisar ter a impressora em mãos.
//
// PRINT_MODE=windows: entrega os bytes ESC/POS ao spooler do Windows em
// modo RAW, via PowerShell (veja scriptImpressaoRaw.js, que explica por
// que não dá pra usar o comando `print` nem o `Out-Printer`). A impressora
// precisa estar instalada com driver genérico/raw — "Generic / Text Only".

import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { SCRIPT_IMPRESSAO_RAW } from './scriptImpressaoRaw.js';

const execAsync = promisify(exec);

async function imprimirNoWindows(bytes, printerName) {
  const dir = await mkdtemp(path.join(tmpdir(), 'ericburger-cupom-'));
  const arquivoCupom = path.join(dir, 'cupom.prn');
  const arquivoScript = path.join(dir, 'enviar.ps1');

  try {
    await writeFile(arquivoCupom, bytes);
    await writeFile(arquivoScript, SCRIPT_IMPRESSAO_RAW, 'utf8');

    // -ExecutionPolicy Bypass: o script é gerado por nós numa pasta
    // temporária, mas a política padrão do Windows bloquearia mesmo assim.
    // -NoProfile: não carrega o perfil do usuário, que poderia imprimir
    // coisas na saída e atrapalhar a leitura do resultado.
    const comando =
      `powershell -NoProfile -ExecutionPolicy Bypass -File "${arquivoScript}" ` +
      `-Impressora "${printerName}" -Arquivo "${arquivoCupom}"`;

    // Se o script sair com código diferente de zero, execAsync rejeita e o
    // erro sobe — é assim que o pedido continua na fila em vez de ser
    // marcado como impresso sem ter saído no papel.
    const { stdout } = await execAsync(comando);

    if (!stdout.includes('OK')) {
      throw new Error(`Resposta inesperada da impressora: ${stdout.trim()}`);
    }
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

function imprimirNoConsole(texto) {
  const moldura = '='.repeat(42);
  console.log(`\n${moldura}`);
  console.log(texto);
  console.log(`${moldura}\n`);
}

/** @param {{ texto: string, bytes: Buffer }} cupom */
export async function imprimir(cupom, config) {
  if (config.printMode === 'console') {
    imprimirNoConsole(cupom.texto);
    return;
  }

  if (config.printMode === 'windows') {
    await imprimirNoWindows(cupom.bytes, config.printerName);
    return;
  }

  throw new Error(`PRINT_MODE desconhecido: "${config.printMode}" (use "console" ou "windows")`);
}
