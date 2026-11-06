import path from 'node:path';
import dotenv from 'dotenv';

// Quando roda como .exe empacotado (pkg), __dirname aponta pra dentro do
// pacote (só existe em memória) — o .env precisa ser lido de onde o .exe
// de verdade está, não de lá. Quando roda como script Node normal, usa a
// pasta atual (process.cwd()), que é o comportamento padrão do dotenv.
const pastaBase = typeof process.pkg !== 'undefined' ? path.dirname(process.execPath) : process.cwd();
dotenv.config({ path: path.join(pastaBase, '.env') });

function obrigatorio(nome) {
  const valor = process.env[nome];
  if (!valor) {
    throw new Error(
      `Variável de ambiente ${nome} não está definida. Confira o arquivo .env (veja .env.example).`,
    );
  }
  return valor;
}

export const config = {
  apiBaseUrl: (process.env.API_BASE_URL || 'http://localhost:3000').replace(/\/+$/, ''),
  apiKey: obrigatorio('PRINT_AGENT_API_KEY'),
  pollIntervalMs: Number(process.env.POLL_INTERVAL_MS || 8000),
  // "console" (padrão, seguro) ou "windows" (imprime de verdade)
  printMode: process.env.PRINT_MODE || 'console',
  printerName: process.env.PRINTER_NAME || '',
  printerCols: Number(process.env.PRINTER_COLS || 32),
};

if (config.printMode === 'windows' && !config.printerName) {
  throw new Error(
    'PRINT_MODE="windows" mas PRINTER_NAME não foi definido no .env. ' +
      'Coloque o nome exato da impressora (veja em "Impressoras e scanners" do Windows).',
  );
}
