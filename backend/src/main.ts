import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // FRONTEND_URL aceita mais de uma origem, separadas por vírgula. Isso
  // existe porque um projeto na Vercel pode responder por mais de um
  // domínio ao mesmo tempo (ex: o domínio antigo, mantido depois de
  // renomear o projeto, e o novo). Se o cliente abrir o site por um
  // domínio que não está aqui, o navegador bloqueia a criação do pedido —
  // o site carrega normalmente e só falha na hora de confirmar, que é o
  // tipo de erro difícil de associar à causa.
  const origens = (configService.get<string>('FRONTEND_URL') ?? '')
    .split(',')
    .map((origem) => origem.trim())
    .filter(Boolean);
  app.enableCors({ origin: origens });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Documentação interativa (Swagger/OpenAPI) — disponível em /docs.
  // Não é protegida por senha: como não expõe nada sensível (só a forma dos
  // endpoints), fica aberta pra facilitar consulta. Dá pra restringir depois
  // se algum dia isso incomodar.
  const config = new DocumentBuilder()
    .setTitle('Eric Burger — API')
    .setDescription(
      "API do sistema de pedidos da Eric Burger. Documentação completa (em texto corrido) em backend/docs/API.md.",
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        description:
          'Chave fixa do agente de impressão (variável de ambiente PRINT_AGENT_API_KEY) — não é um token de usuário.',
      },
      'api-key',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = configService.get<string>('PORT') ?? 3000;
  // O '0.0.0.0' é obrigatório em hospedagem tipo Render: sem ele o Node
  // escuta só em localhost, de dentro do contêiner, e o serviço fica
  // inacessível de fora (o deploy sobe mas nada responde).
  await app.listen(port, '0.0.0.0');
  console.log(`Backend rodando em http://localhost:${port}`);
  console.log(`Documentação interativa em http://localhost:${port}/docs`);
}
bootstrap().catch((erro: unknown) => {
  console.error('Falha ao iniciar o backend:', erro);
  process.exit(1);
});
