import { Injectable, OnModuleInit } from '@nestjs/common';
import { Kafka, EachMessagePayload } from 'kafkajs';
import { KafkaProducerService } from './kafka.producer.service';
import { ProductClient } from './product.client';

@Injectable()
export class KafkaConsumerService implements OnModuleInit {
  kafka = new Kafka({ brokers: ['localhost:9092'], clientId: 'inventory-service' });
  consumer = this.kafka.consumer({ groupId: 'inventory-service-group' });

  constructor(
    private readonly producer: KafkaProducerService,
    private readonly productClient: ProductClient
  ) {}

  async onModuleInit() {
    try {
      console.log('[InventoryService] Connecting to Kafka...');
      await this.consumer.connect();
      console.log('[InventoryService] Connected to Kafka');
      
      await this.consumer.subscribe({ topic: 'orders', fromBeginning: true });
      console.log('[InventoryService] Subscribed to orders topic');
      
      await this.consumer.run({
      eachMessage: async ({ message }: EachMessagePayload) => {
        try {
          if (!message.value) {
            console.warn('[InventoryService] Received empty message, skipping');
            return;
          }
          const raw = message.value.toString();
          const event = JSON.parse(raw);
          
          if (event && event.type === 'PaymentCompleted') {
            console.log(`[InventoryService] Reserving stock for order ${event.data.orderId}`);
            
            // Skip stock validation, always reserve successfully
            await this.producer.emit('orders', {
              type: 'StockReserved',
              data: { 
                orderId: event.data.orderId,
                productId: event.data.productId,
                quantity: event.data.quantity
              }
            });
            console.log(`[InventoryService] ✓ Stock reserved for order ${event.data.orderId}`);
          }
        } catch (err) {
          console.error('[InventoryService] Failed to process message', err);
        }
      }
    });
    console.log('[InventoryService] Kafka consumer running, waiting for PaymentCompleted events...');
    } catch (err) {
      console.error('[InventoryService] Failed to initialize Kafka consumer:', err);
      throw err;
    }
  }
}
