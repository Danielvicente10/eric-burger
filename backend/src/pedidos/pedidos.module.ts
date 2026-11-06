import { Module } from '@nestjs/common';
import { CardapioModule } from '../cardapio/cardapio.module.js';
import { GeocodificacaoService } from './frete/geocodificacao.service.js';
import { FreteService } from './frete/frete.service.js';
import { PedidosController } from './pedidos.controller.js';
import { PedidosService } from './pedidos.service.js';

@Module({
  imports: [CardapioModule],
  controllers: [PedidosController],
  providers: [PedidosService, FreteService, GeocodificacaoService],
})
export class PedidosModule {}
