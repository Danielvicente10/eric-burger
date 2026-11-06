import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, StatusPedido } from '@prisma/client';
import { CardapioService } from '../cardapio/cardapio.service.js';
import { formatarReais } from '../common/formatar-reais.util.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { inicioDoDiaNoBrasil, montarCodigoPedido } from './codigo-pedido.util.js';
import type { StatusPedidoInput } from './dto/atualizar-pedido.dto.js';
import type { CriarPedidoDto, EnderecoDto } from './dto/criar-pedido.dto.js';
import { FreteService } from './frete/frete.service.js';

const MAPA_STATUS_INPUT_PARA_ENUM: Record<StatusPedidoInput, StatusPedido> = {
  recebido: StatusPedido.RECEBIDO,
  impresso: StatusPedido.IMPRESSO,
  em_preparo: StatusPedido.EM_PREPARO,
  pronto: StatusPedido.PRONTO,
  entregue: StatusPedido.ENTREGUE,
};

// Máximo de tentativas caso o código gerado (data/hora + 2 dígitos
// aleatórios) colida com um pedido já existente no mesmo minuto.
const MAX_TENTATIVAS_CODIGO = 5;

@Injectable()
export class PedidosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cardapio: CardapioService,
    private readonly frete: FreteService,
  ) {}

  /** Usado tanto na criação do pedido quanto na prévia (POST /pedidos/calcular-frete). */
  calcularFrete(endereco: EnderecoDto) {
    return this.frete.calcular(endereco);
  }

  async criar(dto: CriarPedidoDto) {
    const itensCalculados = dto.itens.map((item) =>
      this.cardapio.calcularItem({
        itemCardapioId: item.itemCardapioId,
        varianteId: item.varianteId,
        quantidade: item.quantidade,
        acrescimosIds: item.acrescimosIds ?? [],
        observacao: item.observacao,
      }),
    );
    const totalItensCentavos = this.cardapio.calcularTotal(itensCalculados);

    // Só calcula (e só cobra) frete quando é entrega. Se o endereço estiver
    // fora da área, o FreteService lança 400 e o pedido nem chega a ser
    // criado — o cliente vê o erro antes de qualquer coisa ser salva.
    const taxaEntregaCentavos =
      dto.tipoEntrega === 'entrega' && dto.endereco
        ? (await this.frete.calcular(dto.endereco)).taxaEntregaCentavos
        : 0;
    const totalCentavos = totalItensCentavos + taxaEntregaCentavos;

    // Mesma checagem que o site faz, repetida aqui porque validação de
    // front não é garantia: um pedido montado por fora chegaria com troco
    // menor que a conta, e o entregador só descobriria na porta do cliente.
    if (dto.trocoParaCentavos != null && dto.trocoParaCentavos < totalCentavos) {
      throw new BadRequestException(
        `O valor informado para troco (${formatarReais(dto.trocoParaCentavos)}) é menor que o total do pedido (${formatarReais(totalCentavos)}).`,
      );
    }

    const enderecoJson =
      dto.tipoEntrega === 'entrega' && dto.endereco
        ? (dto.endereco as unknown as Prisma.InputJsonValue)
        : undefined;

    let ultimoErro: unknown;
    for (let tentativa = 0; tentativa < MAX_TENTATIVAS_CODIGO; tentativa++) {
      // Recontado a cada tentativa pra pegar o número mais atual do dia.
      const pedidosHoje = await this.prisma.pedido.count({
        where: { criadoEm: { gte: inicioDoDiaNoBrasil() } },
      });

      try {
        return await this.prisma.pedido.create({
          data: {
            codigo: montarCodigoPedido(pedidosHoje + 1),
            nomeCliente: dto.nomeCliente,
            telefone: dto.telefone,
            tipoEntrega: dto.tipoEntrega === 'entrega' ? 'ENTREGA' : 'RETIRADA',
            endereco: enderecoJson,
            pagamento: dto.pagamento,
            totalCentavos,
            taxaEntregaCentavos,
            trocoParaCentavos: dto.trocoParaCentavos,
            itens: {
              create: itensCalculados.map((item) => ({
                itemCardapioId: item.itemCardapioId,
                itemNome: item.itemNome,
                varianteId: item.varianteId,
                varianteNome: item.varianteNome,
                precoUnitarioCentavos: item.precoUnitarioCentavos,
                acrescimos: item.acrescimos as unknown as Prisma.InputJsonValue,
                observacao: item.observacao,
                quantidade: item.quantidade,
                subtotalCentavos: item.subtotalCentavos,
              })),
            },
          },
          include: { itens: true },
        });
      } catch (erro) {
        // P2002 = violação de unique constraint (colisão no "codigo"). Tenta de novo com outro código.
        if (
          erro instanceof Prisma.PrismaClientKnownRequestError &&
          erro.code === 'P2002'
        ) {
          ultimoErro = erro;
          continue;
        }
        throw erro;
      }
    }
    throw ultimoErro;
  }

  async listarPorStatus(statusList?: StatusPedidoInput[]) {
    const where = statusList?.length
      ? {
          status: { in: statusList.map((s) => MAPA_STATUS_INPUT_PARA_ENUM[s]) },
        }
      : undefined;

    return this.prisma.pedido.findMany({
      where,
      include: { itens: true },
      orderBy: { criadoEm: 'asc' },
    });
  }

  async atualizarStatus(id: string, statusInput: StatusPedidoInput) {
    const pedidoExistente = await this.prisma.pedido.findUnique({
      where: { id },
    });
    if (!pedidoExistente) {
      throw new NotFoundException(`Pedido "${id}" não encontrado`);
    }

    const status = MAPA_STATUS_INPUT_PARA_ENUM[statusInput];
    return this.prisma.pedido.update({
      where: { id },
      data: {
        status,
        impressoEm:
          status === StatusPedido.IMPRESSO
            ? new Date()
            : pedidoExistente.impressoEm,
      },
      include: { itens: true },
    });
  }
}
