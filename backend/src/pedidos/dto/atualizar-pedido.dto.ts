import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export const STATUS_PEDIDO_VALORES = [
  'recebido',
  'impresso',
  'em_preparo',
  'pronto',
  'entregue',
] as const;
export type StatusPedidoInput = (typeof STATUS_PEDIDO_VALORES)[number];

export class AtualizarPedidoDto {
  @ApiProperty({
    enum: STATUS_PEDIDO_VALORES,
    example: 'impresso',
    description:
      'Novo status do pedido. Não existe uma "ordem" imposta pelo backend — qualquer status pode ser setado a qualquer momento (quem decide a sequência é o agente de impressão/operador).',
  })
  @IsIn(STATUS_PEDIDO_VALORES)
  status: StatusPedidoInput;
}
