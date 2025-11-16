import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
  console.log('[OrderService] Service started on port 3000');
  console.log('[OrderService] Ready to accept requests');
}
bootstrap();
