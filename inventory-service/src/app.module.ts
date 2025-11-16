import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { KafkaConsumerService } from './kafka.consumer';
import { KafkaProducerService } from './kafka.producer.service';
import { ProductClient } from './product.client';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, KafkaConsumerService, KafkaProducerService, ProductClient],
})
export class AppModule {}
