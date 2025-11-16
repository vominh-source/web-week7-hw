import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OrderController } from './order/order.controller';
import { KafkaService } from '../kafka.service';
import { ProductClient } from '../product.client';

@Module({
  imports: [],
  controllers: [AppController, OrderController],
  providers: [AppService, KafkaService, ProductClient],
})
export class AppModule {}
