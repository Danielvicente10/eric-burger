# Eric Burger Delivery — sistema de pedidos

Site de pedidos da Eric Burger, montado a partir do sistema da Pastel de Itu
D' Pio XII (mesma arquitetura, projeto e repositório separados):

- **Front** (raiz): React + Vite. Cardápio com busca e categorias, modal de
  adicionais, sacola, entrega/retirada, pagamento e envio do pedido.
- **Backend** (`backend/`): NestJS + Prisma + PostgreSQL (Neon). Recalcula
  todos os preços no servidor, calcula a taxa de entrega e guarda os pedidos.
- **Agente de impressão** (`print-agent/`): roda no computador da loja e
  imprime o cupom na térmica.

## Como rodar localmente

```bash
npm install
npm run dev
```

Backend: ver `backend/README.md`. Agente de impressão: ver `print-agent/README.md`.

## O que muda em relação à pastelaria

- **Acréscimos por tipo de produto.** Cada acréscimo tem um `tipo` e cada item
  diz quais tipos aceita (`adicionais`):
  - `troca-hamburguer` — trocar por costela ou pimenta (+R$ 3), no máximo uma
    por lanche. Vale para hambúrgueres bovinos e combos.
  - `lanche` — cheddar, bacon, ovo, provolone etc. Vale para todos os lanches
    e cachorros-quentes.
  - `batata-pequena` / `batata-grande` — mesmos sabores com preços diferentes
    por tamanho da porção.

  O backend recusa acréscimo de tipo que o item não aceita e mais de uma troca
  de hambúrguer no mesmo item.
- **Combos e bebidas com sabor** usam variantes (todas com o mesmo preço), pra
  o sabor escolhido aparecer no WhatsApp e no cupom.

## Editar o cardápio

Tudo fica em `src/data/cardapio.js`. Depois de editar, rode:

```bash
npm run cardapio
```

Isso gera `backend/src/cardapio/cardapio.data.ts` (a cópia que o backend usa
pra recalcular preços). Sem esse passo o backend recusa os pedidos.

## Dados da loja

`src/data/loja.js`: nome, subtítulo, WhatsApp e endereço de retirada.

## Pendências antes de ir ao ar (procure por `TODO` no código)

- Endereço da loja (`src/data/loja.js`) e coordenadas/cidade do frete
  (`backend/src/pedidos/frete/frete.service.ts`) — **hoje ainda estão os da
  pastelaria**.
- Tabela de taxas de entrega (mesmo arquivo do frete).
- Horário de funcionamento (`src/utils/horario.js`).
- Tempos de preparo/entrega (`src/components/Checkout.jsx`).
- Preços cobertos na foto do cardápio: X-Burger e X-Salada (150g) e os
  adicionais cheddar, bacon e catupiry.
- Sabores de refrigerante lata, refrigerante 1,5L, Del Valle e H2O.

## Deploy

- Front: Cloudflare Pages (preset Vite, build `npm run build`, saída `dist`),
  com a variável `VITE_API_URL` apontando pro backend.
- Backend: Render (Blueprint em `render.yaml`) + banco no Neon.
