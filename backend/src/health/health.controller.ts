import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service.js';

// Endpoint público e leve, usado por dois motivos:
// 1) o keep-alive (cron-job.org/GitHub Actions) bate aqui pra evitar o
//    Render dormir durante o horário comercial;
// 2) uma checagem rápida de que o backend E o banco (Neon) estão de pé.
@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({
    summary: 'Verifica se o backend e o banco estão de pé (rota pública)',
    description:
      'Faz um SELECT 1 rápido no Postgres pra confirmar a conexão. Usada pelo serviço de keep-alive (cron-job.org) pra evitar o cold start do Render durante o horário comercial, e serve também como checagem manual rápida.',
  })
  @ApiResponse({
    status: 200,
    description: 'Backend e banco respondendo normalmente.',
  })
  @ApiResponse({
    status: 503,
    description: 'Backend no ar, mas sem conseguir falar com o banco.',
  })
  async verificar() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      throw new ServiceUnavailableException('Sem conexão com o banco de dados');
    }
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
