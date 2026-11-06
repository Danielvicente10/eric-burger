# Backend — Eric Burger

API em NestJS + Prisma + PostgreSQL do sistema de pedidos da Eric Burger. Recebe os pedidos feitos no site, recalcula os preços no servidor (nunca confia em valor vindo do front) e serve os dados pro agente de impressão local.

## Documentação da API

- **Explicada, em texto:** [`docs/API.md`](docs/API.md) — o que cada endpoint faz, por que existe, exemplos de request/response.
- **Interativa (testar direto no navegador):** com o backend rodando, acesse `http://localhost:3000/docs`.

## Rodando localmente

```bash
npm install
cp .env.example .env   # preencha DATABASE_URL, DIRECT_URL, PRINT_AGENT_API_KEY
npx prisma migrate dev # cria as tabelas no banco configurado
npm run start:dev      # sobe em http://localhost:3000, com recarga automática
```

Banco local: suba um Postgres com `docker-compose up -d` (usa o `docker-compose.yml` deste diretório), ou aponte `DATABASE_URL`/`DIRECT_URL` direto pra um banco na Neon.

## Variáveis de ambiente

Veja [`.env.example`](.env.example) — todas comentadas. Resumo:

| Variável | Pra que serve |
|---|---|
| `DATABASE_URL` | Connection string do Postgres (pooled, em produção) |
| `DIRECT_URL` | Connection string direta, só usada pelo `prisma migrate` |
| `PRINT_AGENT_API_KEY` | Chave fixa que o agente de impressão usa pra se autenticar |
| `FRONTEND_URL` | Origem liberada no CORS. Aceita várias separadas por vírgula, se o front responder por mais de um domínio |
| `AWESOMEAPI_TOKEN` | Consulta de CEP pro cálculo de frete. Opcional em dev, **obrigatório em produção** — sem token a cota é por IP, e IP de hospedagem compartilhada chega saturado (HTTP 429). Gratuito, 100 mil consultas/mês |
| `PORT` | Porta do servidor (padrão 3000) |

## Scripts úteis

| Comando | O que faz |
|---|---|
| `npm run start:dev` | Sobe o servidor com recarga automática |
| `npm run build` | Gera o Prisma Client e compila o TypeScript pra `dist/` |
| `npm run start:prod` | Aplica migrations pendentes e sobe o build compilado (é o que o Render roda) |
| `npm test` | Roda os testes unitários (cálculo de preço, faixas de frete, código do pedido) |
| `npm run lint` | Lint + auto-fix |
| `npx prisma studio` | Interface visual pra ver/editar os dados do banco |

## Deploy no Render

A configuração já está pronta em [`render.yaml`](../render.yaml) (na raiz do repositório), então o serviço se monta sozinho:

1. Em [render.com](https://render.com), **New + → Blueprint**
2. Escolher o repositório `Danielvicente10/eric-burger`
3. O Render lê o `render.yaml` e pede só os segredos:

| Variável | Valor |
|---|---|
| `DATABASE_URL` | connection string **pooled** da Neon |
| `DIRECT_URL` | connection string **direta** da Neon (sem pooling) |
| `PRINT_AGENT_API_KEY` | gere uma chave forte — **não reuse a de desenvolvimento** |
| `FRONTEND_URL` | a URL do site na Cloudflare Pages (ex: `https://eric-burger.pages.dev`) |
| `AWESOMEAPI_TOKEN` | crie um gratuito em [awesomeapi.com.br](https://awesomeapi.com.br) — **sem ele nenhuma entrega é calculada** (ver abaixo) |

4. Deploy

Depois de subir, apontar o front pra API: na Cloudflare Pages, definir `VITE_API_URL` com a URL do serviço no Render e refazer o deploy do front.

### Detalhes que importam

- **`FRONTEND_URL` é a única origem liberada no CORS.** Se estiver errada ou faltando, o site carrega mas nenhum pedido passa — o navegador bloqueia a chamada.
- **`AWESOMEAPI_TOKEN` não é opcional aqui.** A cota da consulta de CEP é contada por IP quando não há token, e o IP de saída do Render é compartilhado com outros serviços — na prática ele já chega estourado e toda consulta volta `HTTP 429`. O sintoma é o cliente ver "a consulta de CEP está indisponível" ao tentar entrega. Dá pra confirmar nos logs procurando por `AwesomeAPI`.
- **As migrations rodam sozinhas** a cada start (`prisma migrate deploy`), então mudança de schema não exige passo manual.
- **O plano gratuito hiberna** depois de ~15 min sem uso, e a primeira chamada seguinte demora até ~1 min pra acordar. O front já espera até 70s antes de desistir, e mostra um aviso ao cliente. Pra evitar, dá pra apontar um serviço tipo [cron-job.org](https://cron-job.org) pro `/health` a cada 10–14 min durante o horário comercial.
- **O agente de impressão** (`print-agent/.env`) precisa apontar pra URL do Render e usar a **mesma** `PRINT_AGENT_API_KEY` configurada aqui.

## Estrutura

```
src/
├── cardapio/     # Cópia do cardápio + recálculo de preço (nunca confia no front)
├── pedidos/      # Endpoints de pedido (criar, listar, atualizar status)
├── health/       # /health, usado pelo keep-alive
├── prisma/       # Conexão com o banco
└── common/       # ApiKeyGuard (autenticação do agente de impressão)
```
