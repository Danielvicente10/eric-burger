# Agente de impressão — Eric Burger

Script que roda **no computador da loja**, ligado numa impressora térmica
de cupom (ESC/POS) via USB. Ele fica perguntando pro backend "tem pedido
novo?" e, quando tem, imprime o cupom e avisa o backend que já imprimiu.

Não tem interface gráfica — é um terminal aberto rodando em loop. Ele não
guarda nada localmente: toda a informação (pedidos, status) vive no backend.

## Como funciona

```
a cada poucos segundos:
  1. GET /pedidos?status=recebido   → busca pedidos ainda não impressos
  2. pra cada pedido:
     a. formata o cupom
     b. manda pra impressora
     c. se imprimiu com sucesso → PATCH /pedidos/:id { status: "impresso" }
        se deu erro (sem papel, impressora desligada, etc.) → não marca
        nada, tenta esse mesmo pedido de novo no próximo ciclo
```

Isso significa que é seguro deixar a impressora sem papel por um tempo:
nenhum pedido é perdido, só fica esperando na fila.

## Testando sem impressora (modo `console`)

Esse é o modo padrão — não precisa de impressora nenhuma, só mostra o
cupom formatado no terminal. Bom pra testar agora, ou pra sempre que quiser
conferir se o agente está buscando os pedidos certos.

```bash
cd print-agent
npm install
cp .env.example .env
```

Edite o `.env` e preencha `PRINT_AGENT_API_KEY` com a **mesma chave** que
está em `backend/.env` (`PRINT_AGENT_API_KEY`). Se o backend estiver rodando
em `http://localhost:3000`, o resto do `.env.example` já serve como está.

```bash
npm start
```

Crie um pedido pelo site (`http://localhost:5173`) e veja o cupom aparecer
formatado no terminal alguns segundos depois.

## Configurando na máquina da loja, com a impressora de verdade

### 1. Instalar o Node.js

Baixe e instale a versão LTS em https://nodejs.org (é só clicar em
"Next" até o fim — não precisa mexer em nenhuma opção).

### 2. Instalar a impressora no Windows como impressora "genérica / texto"

A impressora térmica ESC/POS precisa aparecer como uma impressora comum do
Windows, usando um driver que **não reformata** o que a gente manda pra ela
(senão o texto sai errado). Passo a passo:

1. Conecte a impressora via USB e ligue.
2. Abra **Configurações → Bluetooth e dispositivos → Impressoras e
   scanners → Adicionar dispositivo**.
3. Se o Windows não achar automaticamente, clique em **"A impressora que eu
   quero não está na lista"** → **"Adicionar uma impressora local ou de
   rede com configurações manuais"**.
4. Porta: escolha a porta USB que apareceu (geralmente algo como `USB001`).
5. Fabricante: **Generic**. Impressora: **Generic / Text Only**.
   *(Se o fabricante da sua impressora forneceu um driver próprio — pen
   drive, CD ou site do fabricante — pode usar ele no lugar deste passo;
   normalmente também funciona em modo raw.)*
6. Dê um nome fácil de lembrar, por exemplo `Impressora Cupom`. **Esse nome
   é o que você vai colocar em `PRINTER_NAME` no `.env`.**
7. Finalize sem imprimir página de teste (o teste padrão do Windows não
   sai legível numa térmica — é normal).

Pra confirmar o nome exato mais tarde: **Configurações → Impressoras e
scanners** → o nome aparece na lista.

### 3. Configurar o agente

```bash
cd print-agent
npm install
copy .env.example .env
```

Edite o `.env`:

```bash
API_BASE_URL="https://SEU-BACKEND.onrender.com"   # URL do backend em produção
PRINT_AGENT_API_KEY="a-mesma-chave-do-backend-em-producao"
PRINT_MODE="windows"
PRINTER_NAME="Impressora Cupom"                    # o nome que você deu no passo 2.6
PRINTER_COLS=32                                    # 32 = bobina 58mm, ~42-48 = 80mm
```

Teste:

```bash
npm start
```

Faça um pedido de teste pelo site e confira se sai um cupom físico da
impressora.

### 4. Deixar rodando sempre (inicia com o Windows)

Enquanto o projeto é pequeno, a forma mais simples é criar um atalho do
comando `npm start` na pasta de Inicialização do Windows:

1. Aperte `Win + R`, digite `shell:startup` e Enter (abre a pasta de
   inicialização).
2. Crie um arquivo `iniciar-agente.bat` **dentro dessa pasta** com o
   conteúdo abaixo (ajustando o caminho pra onde o projeto está no PC da
   loja):

   ```bat
   cd /d "C:\caminho\para\eric-burger\print-agent"
   npm start
   ```

3. Agora, toda vez que o Windows ligar, uma janela de terminal abre
   automaticamente rodando o agente. Não feche essa janela — ela precisa
   ficar aberta o tempo todo pra continuar buscando pedidos.

*(Se no futuro quiser que rode escondido, sem janela visível, dá pra migrar
esse `.bat` pro Agendador de Tarefas do Windows ou usar um gerenciador de
processo como o [pm2](https://pm2.keymetrics.io/) — não é necessário agora.)*

## Ajustando o layout do cupom

O conteúdo e a formatação do cupom ficam em
[`src/formatarCupom.js`](src/formatarCupom.js), na função `montarBlocos`.
Cada linha do cupom é um "bloco" (`{ texto, negrito, centro, duplo, direita }`)
— dá pra reordenar, adicionar ou remover sem mexer no resto do agente.

Detalhe técnico: o cupom sai **sem acentos**. A maioria das térmicas
baratas (clones ESC/POS) não decodifica UTF-8 e o codepage certo varia de
modelo pra modelo — sem saber a marca/modelo exato da impressora, remover
os acentos garante que o texto sai legível em qualquer uma. Se depois você
identificar o modelo exato, dá pra trocar por uma codificação com acentos
(ex: CP860).

## Variáveis de ambiente

Veja [`.env.example`](.env.example) — todas comentadas.

| Variável | Pra que serve |
|---|---|
| `API_BASE_URL` | URL do backend |
| `PRINT_AGENT_API_KEY` | Mesma chave do `PRINT_AGENT_API_KEY` do backend |
| `POLL_INTERVAL_MS` | Intervalo entre verificações (padrão 8000 = 8s) |
| `PRINT_MODE` | `console` (teste, sem impressora) ou `windows` (impressão real) |
| `PRINTER_NAME` | Nome exato da impressora no Windows (só p/ modo `windows`) |
| `PRINTER_COLS` | Colunas por linha do cupom (32 = 58mm, 42-48 = 80mm) |
