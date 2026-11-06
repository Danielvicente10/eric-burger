// Máscaras de formatação de campos de formulário (só formatação visual —
// quem valida de verdade se o valor faz sentido é o backend).

// Aceita só dígitos, limita a 11 (DDD + celular com 9) e formata
// progressivamente: (11) 9999-9999 ou (11) 99999-9999.
export function formatarTelefone(valor) {
  const digitos = valor.replace(/\D/g, '').slice(0, 11)
  if (digitos.length <= 2) return digitos
  if (digitos.length <= 6) return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`
  if (digitos.length <= 10) return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`
  return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`
}

// Máscara de dinheiro: o usuário digita só números e o valor se monta da
// direita pra esquerda, como em maquininha de cartão. "5000" vira "50,00".
// Limite de 8 dígitos = R$ 999.999,99, folgado pra qualquer pedido.
export function formatarDinheiro(valor) {
  const digitos = valor.replace(/\D/g, '').slice(0, 8)
  if (!digitos) return ''

  const emCentavos = Number(digitos)
  const inteiros = String(Math.floor(emCentavos / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${inteiros},${String(emCentavos % 100).padStart(2, '0')}`
}

/** "1.234,50" -> 1234.5 — usado pra comparar com o total do pedido. */
export function dinheiroParaNumero(texto) {
  const digitos = (texto || '').replace(/\D/g, '')
  return digitos ? Number(digitos) / 100 : 0
}

// Aceita só dígitos, limita a 8 e formata como 99999-999.
export function formatarCep(valor) {
  const digitos = valor.replace(/\D/g, '').slice(0, 8)
  if (digitos.length <= 5) return digitos
  return `${digitos.slice(0, 5)}-${digitos.slice(5)}`
}

// Consulta o ViaCEP (API pública, gratuita, sem chave) e retorna
// { rua, bairro } quando o CEP existe, ou null se não encontrar/der erro.
export async function buscarEnderecoPorCep(cepFormatado) {
  const digitos = cepFormatado.replace(/\D/g, '')
  if (digitos.length !== 8) return null

  try {
    const resposta = await fetch(`https://viacep.com.br/ws/${digitos}/json/`)
    if (!resposta.ok) return null
    const dados = await resposta.json()
    if (dados.erro) return null
    return { rua: dados.logradouro || '', bairro: dados.bairro || '' }
  } catch {
    return null
  }
}
