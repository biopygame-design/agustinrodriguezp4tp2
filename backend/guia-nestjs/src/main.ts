import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 🔓 Habilitar CORS para permitir peticiones desde Angular (puerto 4200)
  app.enableCors({
    origin: [
    'http://localhost:4200',
    'https://agustinrodriguezp4tp2.vercel.app',
    'https://agustinrodriguezp4tp2-git-sprint-3-biopygame-design.vercel.app'
  ],
    
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.setGlobalPrefix('api');
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
}
void bootstrap();