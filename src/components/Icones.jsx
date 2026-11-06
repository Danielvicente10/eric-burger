// Ícones ilustrados (estilo "desenho animado", não fotorrealista) usados no
// cardápio para diferenciar visualmente as bebidas dos lanches.
// Cada ícone recebe uma cor (hex) que tinge o líquido/rótulo conforme o sabor.

/** Jarra de suco com o líquido colorido de acordo com o sabor. */
export function IconeJarra({ cor = '#e0435a', tamanho = 34 }) {
  const idLiquido = `liq-${cor.replace('#', '')}`
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id={idLiquido} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={cor} stopOpacity="0.95" />
          <stop offset="100%" stopColor={cor} stopOpacity="0.75" />
        </linearGradient>
        <clipPath id={`clip-${idLiquido}`}>
          <path d="M17 20 Q16 16 20 15 L42 13 Q46 12 46 18 L45 50 Q45 55 40 55 L21 55 Q17 55 17 50 Z" />
        </clipPath>
      </defs>

      {/* alça */}
      <path d="M46 22 Q58 24 57 36 Q56 46 46 46" fill="none" stroke="#d9821f" strokeWidth="4" strokeLinecap="round" />

      {/* corpo da jarra (vidro) */}
      <path
        d="M17 20 Q16 16 20 15 L42 13 Q46 12 46 18 L45 50 Q45 55 40 55 L21 55 Q17 55 17 50 Z"
        fill="#fff7ec"
        fillOpacity="0.35"
        stroke="#5a4636"
        strokeWidth="2.5"
      />

      {/* bico */}
      <path d="M17 20 Q12 17 15 13 Q18 15 20 15 Z" fill="#fff7ec" fillOpacity="0.5" stroke="#5a4636" strokeWidth="2" strokeLinejoin="round" />

      {/* líquido */}
      <g clipPath={`url(#clip-${idLiquido})`}>
        <rect x="14" y="30" width="34" height="28" fill={`url(#${idLiquido})`} />
        <ellipse cx="31" cy="30" rx="15" ry="3" fill={cor} opacity="0.9" />
        <circle cx="26" cy="42" r="2" fill="#ffffff" opacity="0.5" />
        <circle cx="35" cy="47" r="1.4" fill="#ffffff" opacity="0.45" />
      </g>

      {/* brilho no vidro */}
      <path d="M21 18 L20 45" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" opacity="0.55" />
    </svg>
  )
}

/** Garrafa de refrigerante 2L. */
export function IconeGarrafa2L({ cor = '#8a2b1f', tamanho = 34 }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 64 64" aria-hidden="true">
      <path
        d="M27 6 L37 6 L37 14 Q42 18 42 26 L44 26 Q48 30 48 38 L48 54 Q48 58 44 58 L20 58 Q16 58 16 54 L16 38 Q16 30 20 26 L22 26 Q22 18 27 14 Z"
        fill="#eaf3ef"
        stroke="#3a3a3a"
        strokeWidth="2"
      />
      <rect x="26" y="4" width="12" height="6" rx="1.5" fill={cor} stroke="#3a3a3a" strokeWidth="1.5" />
      <path d="M18 38 Q32 34 46 38 L46 54 Q46 56 44 56 L20 56 Q18 56 18 54 Z" fill={cor} opacity="0.9" />
      <rect x="18" y="38" width="28" height="4" fill="#ffffff" opacity="0.35" />
      <path d="M23 30 L23 54" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
    </svg>
  )
}

/** Garrafa de água. */
export function IconeAgua({ tamanho = 34 }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 64 64" aria-hidden="true">
      <path
        d="M28 6 L36 6 L36 13 Q40 16 40 22 L41 22 Q45 26 45 34 L45 52 Q45 57 40 57 L24 57 Q19 57 19 52 L19 34 Q19 26 23 22 L24 22 Q24 16 28 13 Z"
        fill="#eaf6fb"
        fillOpacity="0.55"
        stroke="#2f6da3"
        strokeWidth="2"
      />
      <rect x="27" y="4" width="10" height="5" rx="1.4" fill="#2f8fd0" stroke="#215a80" strokeWidth="1.2" />
      <path d="M20 40 Q32 45 44 40 L44 52 Q44 55 41 55 L23 55 Q20 55 20 52 Z" fill="#7fc7ec" opacity="0.55" />
      <path d="M23 30 Q28 34 23 40 Q19 34 23 30 Z" fill="#2f8fd0" opacity="0.6" />
      <path d="M25 24 L25 50" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
    </svg>
  )
}

/** Lata de bebida (refrigerante/cerveja em lata). */
export function IconeLata({ cor = '#c1272d', tamanho = 34 }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 64 64" aria-hidden="true">
      <path d="M20 14 Q20 10 32 10 Q44 10 44 14 L44 52 Q44 57 32 57 Q20 57 20 52 Z" fill={cor} stroke="#3a3a3a" strokeWidth="2" />
      <ellipse cx="32" cy="14" rx="12" ry="3.4" fill="#d7d7d7" stroke="#8a8a8a" strokeWidth="1.2" />
      <ellipse cx="32" cy="13.4" rx="9" ry="2.2" fill="#eeeeee" />
      <path d="M27 12.6 Q32 15.4 37 12.6" stroke="#8a8a8a" strokeWidth="1" fill="none" />
      <rect x="20" y="30" width="24" height="10" fill="#ffffff" opacity="0.25" />
      <path d="M25 20 L25 50" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
    </svg>
  )
}

// Mapas de cor por palavra-chave no nome do item — usados para "adivinhar" a
// cor certa a partir do sabor/rótulo sem precisar cadastrar cor item a item.
const CORES_SUCO = [
  [/morango/i, '#e0435a'],
  [/maracuj/i, '#f4b400'],
  [/coco/i, '#f1e6c8'],
  [/abacaxi.*hortel|hortel.*abacaxi/i, '#bcd85a'],
  [/abacaxi.*lim|lim.*abacaxi/i, '#d9e05a'],
  [/abacaxi.*acerola|acerola.*abacaxi/i, '#e2543a'],
  [/abacaxi.*menta|menta.*abacaxi/i, '#7bc47f'],
  [/abacaxi/i, '#f2c94c'],
  [/caju/i, '#e8734a'],
  [/aça/i, '#5b3a86'],
  [/vitamina/i, '#e8b64a'],
  [/uva/i, '#6a3ea1'],
  [/acerola/i, '#e2543a'],
]

export function corDoSuco(nome) {
  const encontrada = CORES_SUCO.find(([regex]) => regex.test(nome))
  return encontrada ? encontrada[1] : '#e0435a'
}

// A ORDEM IMPORTA: vale o primeiro que casar. "Fanta Uva" precisa bater em
// /uva/ antes de /fanta/, senão sairia laranja; "Guaraná Antarctica" precisa
// bater em /guaran/ antes da regra das cervejas, que também pega "antarctica".
const CORES_BEBIDA = [
  [/heineken/i, '#1e7a3a'],
  [/del valle/i, '#e2701f'],
  [/h2o/i, '#5bb8e0'],
  [/coca/i, '#8a2b1f'],
  [/uva/i, '#6a3ea1'],
  [/guaran/i, '#7a8f3d'],
  [/fanta|laranja/i, '#f4a300'],
  [/sprite|limão|limao/i, '#4caf50'],
  [/tuba[íi]na/i, '#d94a6a'],
  [/gengibirra|gengibre/i, '#c98a2e'],
  [/ma[çc][ãa]/i, '#8bc34a'],
  [/abacaxi/i, '#f2c94c'],
  [/brahma|skol|antarctica|antártica|cerveja/i, '#e0a730'],
  [/pepsi/i, '#1f4fa3'],
]

export function corDaBebida(nome) {
  const encontrada = CORES_BEBIDA.find(([regex]) => regex.test(nome))
  return encontrada ? encontrada[1] : '#8a2b1f'
}
