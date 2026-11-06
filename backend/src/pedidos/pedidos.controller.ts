import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ApiKeyGuard } from '../common/guards/api-key.guard.js';
import {
  AtualizarPedidoDto,
  STATUS_PEDIDO_VALORES,
  type StatusPedidoInput,
} from './dto/atualizar-pedido.dto.js';
import { CriarPedidoDto, EnderecoDto } from './dto/criar-pedido.dto.js';
import { PedidosService } from './pedidos.service.js';

function parseStatusQuery(status?: string): StatusPedidoInput[] | undefined {
  if (!status) return undefined;
  const valores = status.split(',').map((s) => s.trim().toLowerCase());
  const validos = valores.filter((v): v is StatusPedidoInput =>
    (STATUS_PEDIDO_VALORES as readonly string[]).includes(v),
  );
  return validos.length ? validos : undefined;
}

@ApiTags('pedidos')
@Controller('pedidos')
export class PedidosController {
  constructor(private readonly pedidosService: PedidosService) {}

  // Rota pública: é aqui que o front manda o pedido assim que o cliente
  // finaliza a compra no site. Limite de 5 pedidos/min por IP contra spam.
  @Post()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Cria um novo pedido (rota pública, usada pelo site)',
    description:
      'O front chama isso assim que o cliente finaliza a compra. O backend recalcula TODOS os preços a partir dos ids/quantidade enviados — nunca confia em nenhum valor em reais vindo do cliente. Gera o "codigo" do pedido (ex: 12-A7K, onde 12 é a posição no dia) e salva com status RECEBIDO. Limite: 5 pedidos por minuto por IP.',
  })
  @ApiResponse({
    status: 201,
    description:
      'Pedido criado com sucesso — retorna o pedido completo, incluindo o "codigo" gerado.',
  })
  @ApiResponse({
    status: 400,
    description:
      'Dado inválido: item/variante/acréscimo inexistente, acréscimo em item que não permite, campo obrigatório faltando, etc. A mensagem explica o motivo exato.',
  })
  @ApiResponse({
    status: 429,
    description: 'Mais de 5 pedidos no último minuto vindos do mesmo IP.',
  })
  criar(@Body() dto: CriarPedidoDto) {
    return this.pedidosService.criar(dto);
  }

  // Rota pública: o front chama enquanto o cliente ainda está preenchendo o
  // endereço, pra mostrar o valor da entrega (ou avisar que está fora da
  // área) antes de confirmar o pedido. Não salva nada no banco — é só uma
  // prévia. O valor final de verdade é recalculado de novo dentro de
  // POST /pedidos, nunca confiando no que foi mostrado aqui.
  @Post('calcular-frete')
  @Throttle({ default: { limit: 15, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Calcula o valor da entrega pra um endereço (rota pública, prévia)',
    description:
      'Geocodifica o endereço (OpenStreetMap/Nominatim), calcula a distância em linha reta até a loja e devolve a faixa de preço correspondente. Não cria pedido nem salva nada. Lança 400 se não conseguir localizar o endereço ou se ele estiver fora da área de entrega (hoje, além de 10km).',
  })
  @ApiResponse({
    status: 200,
    description: 'Endereço dentro da área de entrega — retorna distância e taxa.',
  })
  @ApiResponse({
    status: 400,
    description: 'Endereço não encontrado ou fora da área de entrega.',
  })
  calcularFrete(@Body() dto: EnderecoDto) {
    return this.pedidosService.calcularFrete(dto);
  }

  // A partir daqui, só o agente de impressão (chave fixa) tem acesso.
  @Get()
  @UseGuards(ApiKeyGuard)
  @ApiBearerAuth('api-key')
  @ApiOperation({
    summary: 'Lista pedidos (protegida — usada pelo agente de impressão)',
    description:
      'É essa rota que o agente de impressão local consulta a cada poucos segundos (polling) perguntando "tem pedido novo?". Sem o parâmetro "status", retorna todos os pedidos; com ele, filtra só os status pedidos. Ordenado do mais antigo pro mais novo (fila).',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description:
      'Um ou mais status separados por vírgula (ex: "recebido" ou "recebido,em_preparo"). Valores inválidos são ignorados silenciosamente.',
    example: 'recebido',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de pedidos (pode vir vazia), cada um com seus itens.',
  })
  @ApiResponse({
    status: 401,
    description: 'Faltou o cabeçalho Authorization ou a chave está errada.',
  })
  listar(@Query('status') status?: string) {
    return this.pedidosService.listarPorStatus(parseStatusQuery(status));
  }

  @Patch(':id')
  @UseGuards(ApiKeyGuard)
  @ApiBearerAuth('api-key')
  @ApiOperation({
    summary:
      'Muda o status de um pedido (protegida — usada pelo agente de impressão)',
    description:
      'O agente chama isso logo depois de imprimir com sucesso, mandando status="impresso" — é o que faz o pedido sumir da fila de "recebido" e evita imprimir duas vezes. Também serve pra mover o pedido pelo resto do fluxo (em_preparo, pronto, entregue), caso algum painel/tela futura queira usar. Ao marcar como "impresso", o campo impressoEm é preenchido automaticamente com a data/hora atual.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Pedido atualizado — retorna o pedido completo com o novo status.',
  })
  @ApiResponse({
    status: 401,
    description: 'Faltou o cabeçalho Authorization ou a chave está errada.',
  })
  @ApiResponse({ status: 404, description: 'Não existe pedido com esse id.' })
  atualizar(@Param('id') id: string, @Body() dto: AtualizarPedidoDto) {
    return this.pedidosService.atualizarStatus(id, dto.status);
  }
}
