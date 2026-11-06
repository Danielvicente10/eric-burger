import {
  CanActivate,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

// Autenticação simples por chave fixa (Authorization: Bearer <chave>).
// Não é um sistema de login/usuário — é só pra garantir que apenas o
// agente de impressão (dispositivo confiável, único) consegue ler/marcar
// pedidos. A chave fica em PRINT_AGENT_API_KEY (variável de ambiente).
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const chaveEsperada = this.configService.get<string>('PRINT_AGENT_API_KEY');
    if (!chaveEsperada) {
      throw new InternalServerErrorException(
        'PRINT_AGENT_API_KEY não configurada no servidor',
      );
    }

    const request = context.switchToHttp().getRequest<Request>();
    const cabecalho = request.headers['authorization'];
    const chaveRecebida = cabecalho?.startsWith('Bearer ')
      ? cabecalho.slice('Bearer '.length)
      : undefined;

    if (!chaveRecebida || chaveRecebida !== chaveEsperada) {
      throw new UnauthorizedException('Chave de API inválida ou ausente');
    }

    return true;
  }
}
