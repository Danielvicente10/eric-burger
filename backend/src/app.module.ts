import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { CardapioModule } from './cardapio/cardapio.module.js';
import { HealthModule } from './health/health.module.js';
import { PedidosModule } from './pedidos/pedidos.module.js';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Limite padrão (mais generoso) pra todas as rotas; o POST /pedidos
    // tem um limite mais apertado próprio, via @Throttle no controller.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 30 }]),
    PrismaModule,
    CardapioModule,
    PedidosModule,
    HealthModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
