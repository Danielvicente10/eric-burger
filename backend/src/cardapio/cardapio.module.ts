import { Module } from '@nestjs/common';
import { CardapioService } from './cardapio.service.js';

@Module({
  providers: [CardapioService],
  exports: [CardapioService],
})
export class CardapioModule {}
