import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  console.log('Starting Payment service...');
  console.log('Kafka consumer service running...');
  await app.listen(process.env.PORT ?? 3001);
  
}
bootstrap();
