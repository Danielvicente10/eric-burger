# API do backend — Eric Burger

Documentação explicada de cada endpoint. Se preferir uma versão interativa (onde dá pra clicar em "Try it out" e testar de verdade), suba o backend (`npm run start:dev`) e acesse **http://localhost:3000/docs** — é a mesma informação, gerada automaticamente a partir do código (Swagger/OpenAPI), só que navegável.

## Visão geral

O backend existe por um motivo principal: **ser a fonte de verdade dos preços e do estado do pedido**, já que o front-end (site) não pode ser confiável pra isso — qualquer pessoa consegue abrir o DevTools do navegador e alterar valores no JavaScript do site antes de enviar. Por isso, todo endpoint que recebe dados calcula os preços de novo, do zero, com base só nos *ids* enviados (nunca em valores em reais vindos do cliente).

- **Base URL (desenvolvimento local):** `http://localhost:3000`
- **Base URL (produção):** a URL do serviço no Render, depois do deploy.
- **Formato:** tudo em JSON (`Content-Type: application/json`).
- **Dinheiro:** todo valor monetário nas respostas vem em **centavos** (`totalCentavos`, `precoUnitarioCentavos`, `subtotalCentavos`), nunca em reais com vírgula/ponto. R$ 24,00 aparece como `2400`. Isso evita erro de arredondamento com ponto flutuante — a conversão pra "R$ 24,00" é responsabilidade de quem exibe (front-end, agente de impressão), não do backend.

## Autenticação

Existem dois "níveis" de acesso, sem sistema de login/usuário — é tudo bem mais simples que isso:

| Nível | Quem usa | Como funciona |
|---|---|---|
| **Público** | O site (front-end) | Sem autenticação nenhuma. Qualquer um que saiba a URL pode chamar (protegido só por rate limit). |
| **Protegido por chave fixa** | O agente de impressão (rodando no PC/dispositivo da loja) | Precisa mandar o cabeçalho `Authorization: Bearer <PRINT_AGENT_API_KEY>`. O valor da chave é uma variável de ambiente configurada no backend — não é uma senha de usuário, é só um "segredo compartilhado" entre o backend e o agente, pra garantir que só o dispositivo confiável da loja consegue ler/mudar pedidos. |

Exemplo de chamada autenticada:
```bash
curl http://localhost:3000/pedidos?status=recebido \
  -H "Authorization: Bearer dev-local-print-agent-key"
```

Se a chave estiver errada ou faltando, a resposta é `401 Unauthorized`.

## Formato de erro

Quando algo dá errado, a resposta segue o padrão do NestJS:
```json
{
  "statusCode": 400,
  "message": "O item \"Água sem gás 500ml\" não aceita acréscimos",
  "error": "Bad Request"
}
```
`message` também pode vir como uma lista de strings quando é erro de validação de vários campos ao mesmo tempo.

---

## `POST /pedidos` — Criar um pedido

**Quem usa:** o site, no momento em que o cliente clica em "Confirmar e enviar pedido".
**Autenticação:** nenhuma (rota pública).
**Limite:** 5 chamadas por minuto por IP (`ThrottlerModule`) — proteção simples contra spam/bot.

### O que acontece internamente

1. Recebe uma lista de itens contendo só **ids** (do sabor, da variante, dos acréscimos) e a **quantidade** — nunca preço.
2. Pra cada item, o `CardapioService` procura o item real no cardápio (`cardapio.data.ts`) e:
   - Se o id não existe → erro 400.
   - Se o item exige variante (ex: suco, que tem "com água"/"com leite") e nenhuma foi informada → erro 400.
   - Se algum acréscimo foi pedido mas o item não permite acréscimo (ex: uma bebida) → erro 400.
   - Caso contrário, calcula `precoUnitarioCentavos` (preço base + soma dos acréscimos) e `subtotalCentavos` (preço unitário × quantidade).
3. Soma o `subtotalCentavos` de todos os itens.
4. Se `tipoEntrega = "entrega"`, calcula a **taxa de entrega** (`FreteService`, veja seção própria abaixo) a partir do endereço e soma ao total. Se o endereço estiver fora da área de entrega ou não for encontrado, a criação do pedido falha com 400 — nada é salvo.
5. `totalCentavos` = soma dos itens + `taxaEntregaCentavos` (0 se for retirada).
6. Gera o código do pedido no formato `<sequência do dia>-<3 caracteres sorteados>` (ex: `12-A7K`) — é esse código que aparece pro cliente e na mensagem do WhatsApp. A sequência conta os pedidos do dia no fuso de São Paulo (não do servidor, que roda em UTC) e o sufixo sorteado impede que alguém deduza o código do pedido vizinho. Se o código sorteado já existir, tenta de novo automaticamente (até 5 vezes). Ver [`codigo-pedido.util.ts`](../src/pedidos/codigo-pedido.util.ts).
7. Salva tudo no banco com status inicial `RECEBIDO`.

### Corpo da requisição

```json
{
  "nomeCliente": "Maria Silva",
  "telefone": "(19) 99999-8888",
  "tipoEntrega": "entrega",
  "endereco": {
    "cep": "13140-000",
    "rua": "Rua das Flores",
    "numero": "123",
    "bairro": "Centro",
    "complemento": "Apto 12",
    "referencia": "Perto do mercado"
  },
  "pagamento": "Pix",
  "itens": [
    {
      "itemCardapioId": "pasteis-salgados-1-a-moda-da-casa",
      "quantidade": 2,
      "acrescimosIds": ["bacon"]
    },
    {
      "itemCardapioId": "sucos-175-morango",
      "varianteId": "leite",
      "quantidade": 1,
      "acrescimosIds": [],
      "observacao": "sem gelo"
    }
  ]
}
```

| Campo | Obrigatório? | Observação |
|---|---|---|
| `nomeCliente` | sim | 1 a 120 caracteres |
| `telefone` | não | livre, até 30 caracteres (o front já formata como `(11) 99999-9999`) |
| `tipoEntrega` | sim | só `"retirada"` ou `"entrega"` |
| `endereco` | só se `tipoEntrega = "entrega"` | ignorado/pode faltar se for retirada |
| `endereco.cep` | não | só texto livre — o backend não valida contra a base dos Correios |
| `endereco.rua`, `.numero`, `.bairro` | sim (dentro de endereco) | — |
| `endereco.complemento`, `.referencia` | não | — |
| `pagamento` | sim | texto livre (ex: "Pix", "Dinheiro") |
| `itens` | sim | pelo menos 1 item, no máximo 80 |
| `itens[].itemCardapioId` | sim | precisa existir em `cardapio.data.ts` |
| `itens[].varianteId` | só se o item tiver variantes | ex: sucos |
| `itens[].quantidade` | sim | inteiro entre 1 e 50 |
| `itens[].acrescimosIds` | sim (pode ser `[]`) | só válido se o item permitir acréscimo |
| `itens[].observacao` | não | até 300 caracteres, texto livre do cliente |

### Resposta de sucesso — `201 Created`

```json
{
  "id": "cmskvurco0000hj443o47tvji",
  "codigo": "12-A7K",
  "nomeCliente": "Maria Silva",
  "telefone": "(19) 99999-8888",
  "tipoEntrega": "ENTREGA",
  "endereco": { "cep": "13140-000", "rua": "Rua das Flores", "numero": "123", "bairro": "Centro" },
  "pagamento": "Pix",
  "status": "RECEBIDO",
  "totalCentavos": 8500,
  "taxaEntregaCentavos": 0,
  "criadoEm": "2026-08-09T21:25:42.263Z",
  "atualizadoEm": "2026-08-09T21:25:42.263Z",
  "impressoEm": null,
  "itens": [
    {
      "id": "cmskvurcp0001hj4423wu24ru",
      "itemCardapioId": "pasteis-salgados-1-a-moda-da-casa",
      "itemNome": "A Moda da Casa",
      "varianteId": null,
      "varianteNome": null,
      "precoUnitarioCentavos": 3000,
      "acrescimos": [{ "id": "bacon", "nome": "Bacon", "precoCentavos": 600 }],
      "observacao": null,
      "quantidade": 2,
      "subtotalCentavos": 6000
    }
  ]
}
```

Repare que a resposta traz de volta o `codigo` gerado pelo servidor — é ele (não mais um id gerado no front) que o site usa pra montar a mensagem do WhatsApp, garantindo que o número mostrado pro cliente é sempre o mesmo que ficou salvo no banco.

---

## `POST /pedidos/calcular-frete` — Prévia do valor da entrega

**Quem usa:** o site, enquanto o cliente ainda está preenchendo o endereço na tela de checkout — pra mostrar o valor da entrega (ou avisar que está fora da área) antes de ele confirmar o pedido.
**Autenticação:** nenhuma (rota pública).
**Limite:** 15 chamadas por minuto por IP.

### Como funciona

1. Recebe um endereço (mesmo formato do campo `endereco` de `POST /pedidos`: `rua`, `numero`, `bairro` obrigatórios, `cep`/`complemento`/`referencia` opcionais).
2. Descobre as coordenadas do endereço — **pelo CEP** (AwesomeAPI, base dos Correios) quando ele vem preenchido; senão, cai pro [Nominatim](https://nominatim.openstreetmap.org/) buscando por nome de rua. Ver [`geocodificacao.service.ts`](../src/pedidos/frete/geocodificacao.service.ts), que explica por que o CEP é a fonte principal.
3. Calcula a distância em **linha reta** (não é distância de rota/trajeto) entre a loja e o endereço, usando a fórmula de haversine.
4. Aplica a faixa de preço correspondente:

| Distância | Taxa |
|---|---|
| até 3km | R$ 8,00 |
| até 4km | R$ 10,00 |
| até 5km | R$ 13,00 |
| até 7km | R$ 16,00 |
| até 10km | R$ 20,00 |
| acima de 10km | não entrega (erro 400) |

O ponto de referência (coordenadas da loja) e as faixas ficam em [`src/pedidos/frete/frete.service.ts`](../src/pedidos/frete/frete.service.ts) — é só editar essa lista pra mudar os valores/distâncias no futuro.

Essa rota **não salva nada** — é só uma prévia. O valor de verdade é recalculado do zero dentro de `POST /pedidos` (nunca confia em nada vindo do front), então mesmo que alguém chame só essa rota e depois mande um `totalCentavos` diferente pro `POST /pedidos`, não faz diferença: o backend ignora e recalcula.

### Corpo da requisição

```json
{
  "rua": "Rua das Flores",
  "numero": "123",
  "bairro": "Centro",
  "cep": "13140-000"
}
```

### Resposta de sucesso — `200 OK`

```json
{ "distanciaKm": 2.7, "taxaEntregaCentavos": 800 }
```

### Erros possíveis

- `400 Bad Request` — endereço não encontrado pela geocodificação, ou distância acima de 10km (`"Esse endereço está a 14.2km da loja — fora da nossa área de entrega (até 10km)."`).

---

## `GET /pedidos` — Listar pedidos

**Quem usa:** o agente de impressão local, perguntando repetidamente ("polling", a cada poucos segundos) se tem pedido novo pra imprimir.
**Autenticação:** chave fixa obrigatória.

### Parâmetro de busca

`status` (opcional, na query string) — filtra por um ou mais status, separados por vírgula. Valores aceitos: `recebido`, `impresso`, `em_preparo`, `pronto`, `entregue`.

```bash
# Só os que ainda não foram impressos
GET /pedidos?status=recebido

# Recebidos ou em preparo
GET /pedidos?status=recebido,em_preparo

# Todos os pedidos, sem filtro nenhum
GET /pedidos
```

Sem o parâmetro (ou com um valor inválido), devolve todos os pedidos. A lista sempre vem ordenada do mais antigo pro mais novo (`criadoEm` crescente) — é literalmente uma fila.

### Resposta — `200 OK`

Um array de pedidos, no mesmo formato do retorno do `POST /pedidos` (cada um com seus `itens`). Vazio (`[]`) se não tiver nenhum pedido com esse status.

---

## `PATCH /pedidos/:id` — Atualizar o status de um pedido

**Quem usa:** o agente de impressão, logo depois de imprimir com sucesso.
**Autenticação:** chave fixa obrigatória.

### Por que existe

É o mecanismo que evita imprimir o mesmo pedido duas vezes: o agente busca pedidos com `status=recebido`, imprime, e só *depois* de confirmar que a impressão deu certo chama esse endpoint com `{"status": "impresso"}`. Se a impressora estiver sem papel ou desligada, o agente nunca chama esse endpoint — então o pedido continua aparecendo na busca por `recebido` no próximo ciclo, e nada se perde.

**Importante:** o backend **não impõe uma ordem** de status (não é uma máquina de estados travada). Você pode, tecnicamente, mandar qualquer valor a qualquer momento — quem decide a sequência lógica (recebido → impresso → em preparo → pronto → entregue) é quem está chamando a API, não uma regra do servidor. Isso foi uma escolha deliberada de simplicidade; se um dia surgir a necessidade de restringir transições (ex: impedir voltar de "entregue" pra "recebido"), dá pra adicionar depois.

### Corpo da requisição

```json
{ "status": "impresso" }
```

Valores aceitos: `recebido`, `impresso`, `em_preparo`, `pronto`, `entregue`.

Quando o novo status é `"impresso"`, o campo `impressoEm` é preenchido automaticamente com a data/hora atual do servidor — não precisa (e não dá pra) mandar esse timestamp manualmente.

### Resposta — `200 OK`

O pedido completo atualizado, mesmo formato de sempre.

### Erros possíveis

- `404 Not Found` — não existe pedido com esse `id`.
- `401 Unauthorized` — chave errada/ausente.

---

## `GET /health` — Verificação de saúde

**Quem usa:** o serviço de keep-alive (ex: cron-job.org), batendo aqui a cada 10-14 minutos durante o horário comercial pra evitar o backend "dormir" no plano gratuito do Render. Também serve pra qualquer checagem manual rápida.
**Autenticação:** nenhuma (rota pública).

Faz um `SELECT 1` no Postgres pra confirmar que o banco (Neon) está acessível, não só que o processo Node está rodando.

### Resposta — `200 OK`
```json
{ "status": "ok", "timestamp": "2026-08-09T21:25:29.369Z" }
```

### Resposta — `503 Service Unavailable`
Se o backend está de pé mas não consegue falar com o banco (raro, mas acontece se a connection string estiver errada ou o Neon estiver fora do ar).

---

## Ciclo de vida de um pedido

```mermaid
stateDiagram-v2
    [*] --> RECEBIDO: POST /pedidos (site)
    RECEBIDO --> IMPRESSO: PATCH .../id (agente, após imprimir)
    IMPRESSO --> EM_PREPARO
    EM_PREPARO --> PRONTO
    PRONTO --> ENTREGUE
    ENTREGUE --> [*]
```

Hoje, só as transições `RECEBIDO → IMPRESSO` são efetivamente usadas (pelo agente de impressão). Os status `EM_PREPARO`, `PRONTO` e `ENTREGUE` já existem no banco e na API prontos pra uso, caso um dia surja uma tela/painel pra equipe da loja acompanhar o pedido além da impressão.

## Onde estão os preços (pra quem for alterar o cardápio)

O backend tem sua **própria cópia** do cardápio em [`src/cardapio/cardapio.data.ts`](../src/cardapio/cardapio.data.ts), separada da que o front-end usa em `src/data/cardapio.js`. Isso é debito técnico conhecido e documentado no topo daquele arquivo: **qualquer alteração de preço/sabor precisa ser feita nos dois lugares**, até existir um endpoint único de cardápio servido pelo backend e consumido pelo front (não implementado ainda).
