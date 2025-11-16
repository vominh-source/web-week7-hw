import { Controller, Post, Body } from '@nestjs/common';
import { KafkaService } from '../../kafka.service';
import { ProductClient } from '../../product.client';

@Controller('orders')
export class OrderController{
  constructor(private kafka: KafkaService, private readonly productClient: ProductClient){}

  @Post()
  async createOrder(@Body() body){
    // Skip product validation, directly emit event
    await this.kafka.emit('orders', { type: 'OrderCreated', data: body });
    return { ok: true, orderId: body.id };
  }
}
