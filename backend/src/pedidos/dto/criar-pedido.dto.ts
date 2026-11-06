import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export class EnderecoDto {
  // O CEP é OBRIGATÓRIO na entrega — este DTO só é validado quando
  // tipoEntrega = "entrega". É ele que localiza o endereço pra calcular a
  // distância até a loja.
  //
  // Sem CEP, a única fonte que sobra é a busca pelo nome da rua, e ela
  // recebe sempre a cidade da loja (CIDADE_LOJA em frete.service.ts). Um endereço de cidade
  // vizinha com rua de mesmo nome casaria com a rua errada e sairia com
  // frete mais barato do que devia, sem erro nenhum aparecer. Exigir o CEP
  // fecha esse buraco na origem.
  @ApiProperty({
    example: '13140-000',
    description:
      'CEP com 8 dígitos, com ou sem hífen. Obrigatório: é por ele que o endereço é localizado pro cálculo da taxa de entrega. O formato é validado aqui, mas a existência do CEP só é verificada na consulta.',
  })
  @IsString()
  @IsNotEmpty({ message: 'Informe o CEP — é por ele que calculamos a entrega.' })
  @Matches(/^\d{5}-?\d{3}$/, {
    message: 'CEP inválido. Use o formato 13360-079 (8 dígitos).',
  })
  cep: string;

  @ApiProperty({ example: 'Rua das Flores' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 150)
  rua: string;

  @ApiProperty({ example: '123' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 20)
  numero: string;

  @ApiProperty({ example: 'Centro' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 80)
  bairro: string;

  @ApiPropertyOptional({ example: 'Apto 12' })
  @IsOptional()
  @IsString()
  @Length(0, 150)
  complemento?: string;

  @ApiPropertyOptional({ example: 'Perto do mercado' })
  @IsOptional()
  @IsString()
  @Length(0, 150)
  referencia?: string;
}

export class ItemPedidoDto {
  @ApiProperty({
    example: 'pasteis-salgados-1-a-moda-da-casa',
    description:
      'Id do item no cardápio (backend/src/cardapio/cardapio.data.ts). O backend rejeita ids desconhecidos.',
  })
  @IsString()
  @IsNotEmpty()
  itemCardapioId: string;

  @ApiPropertyOptional({
    example: 'leite',
    description:
      'Só é usado (e exigido pelo CardapioService) em itens que têm variantes, como os sucos (água/leite). Nos demais itens deve vir vazio.',
  })
  @IsOptional()
  @IsString()
  varianteId?: string;

  @ApiProperty({ example: 2, minimum: 1, maximum: 50 })
  @IsInt()
  @Min(1)
  @Max(50)
  quantidade: number;

  @ApiProperty({
    example: ['bacon', 'catupiry'],
    description:
      'Ids dos acréscimos (backend/src/cardapio/cardapio.data.ts). Vazio se o item não tiver acréscimo.',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(15)
  acrescimosIds: string[];

  @ApiPropertyOptional({
    example: 'sem cebola, capricha na fritura',
    maxLength: 300,
  })
  @IsOptional()
  @IsString()
  @Length(0, 300)
  observacao?: string;
}

export class CriarPedidoDto {
  @ApiProperty({ example: 'Maria Silva' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 120)
  nomeCliente: string;

  // Obrigatório: é o único jeito de a loja falar com o cliente se faltar
  // alguma informação do pedido ou o entregador não achar o endereço.
  // Aceita 10 dígitos (fixo com DDD) ou 11 (celular), com ou sem máscara.
  @ApiProperty({ example: '(19) 99999-8888' })
  @IsString()
  @IsNotEmpty({ message: 'Informe o telefone de contato.' })
  @Matches(/^\(?\d{2}\)?[\s-]?\d{4,5}-?\d{4}$/, {
    message: 'Telefone inválido. Use DDD + número, como (19) 99999-8888.',
  })
  telefone: string;

  @ApiProperty({ enum: ['retirada', 'entrega'], example: 'entrega' })
  @IsIn(['retirada', 'entrega'])
  tipoEntrega: 'retirada' | 'entrega';

  @ApiPropertyOptional({
    type: EnderecoDto,
    description:
      'Obrigatório (e validado) só quando tipoEntrega = "entrega". Ignorado se for "retirada".',
  })
  // Só é validado/obrigatório quando tipoEntrega === 'entrega'.
  @ValidateIf((o: CriarPedidoDto) => o.tipoEntrega === 'entrega')
  @ValidateNested()
  @Type(() => EnderecoDto)
  endereco?: EnderecoDto;

  @ApiProperty({ example: 'Pix' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 40)
  pagamento: string;

  @ApiPropertyOptional({
    example: 5000,
    description:
      'Com quanto o cliente vai pagar, em centavos — só faz sentido em pagamento com dinheiro e troco. O troco a devolver NÃO vem daqui: é calculado como (trocoParaCentavos - totalCentavos), sempre contra o total recalculado pelo servidor.',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  trocoParaCentavos?: number;

  @ApiProperty({ type: [ItemPedidoDto], description: 'Pelo menos 1 item.' })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(80)
  @ValidateNested({ each: true })
  @Type(() => ItemPedidoDto)
  itens: ItemPedidoDto[];
}
