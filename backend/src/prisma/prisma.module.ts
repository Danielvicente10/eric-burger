import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

// @Global: qualquer módulo pode injetar o PrismaService sem precisar
// importar o PrismaModule explicitamente em cada um.
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
