// Cliente HTTP pro backend. Usa fetch nativo do Node (disponível desde o Node 18).

async function chamar(config, caminho, opcoes = {}) {
  const resposta = await fetch(`${config.apiBaseUrl}${caminho}`, {
    ...opcoes,
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      ...(opcoes.body ? { 'Content-Type': 'application/json' } : {}),
      ...opcoes.headers,
    },
  });

  if (!resposta.ok) {
    const corpo = await resposta.text().catch(() => '');
    throw new Error(`${opcoes.method || 'GET'} ${caminho} -> ${resposta.status} ${corpo}`.trim());
  }

  return resposta.json();
}

/** Busca os pedidos ainda não impressos (fila de impressão). */
export function buscarPedidosRecebidos(config) {
  return chamar(config, '/pedidos?status=recebido');
}

/** Marca um pedido como impresso, depois que a impressão deu certo de verdade. */
export function marcarComoImpresso(config, pedidoId) {
  return chamar(config, `/pedidos/${pedidoId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'impresso' }),
  });
}
