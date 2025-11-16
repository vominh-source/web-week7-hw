import { Injectable, OnModuleInit } from '@nestjs/common';
import { Kafka, EachMessagePayload } from 'kafkajs';
import { KafkaProducerService } from './kafka.producer.service';

@Injectable()
export class KafkaConsumerService implements OnModuleInit {
  kafka = new Kafka({ brokers: ['localhost:9092'], clientId: 'payment-service' });
  consumer = this.kafka.consumer({ groupId: 'payment-service-group' });

  constructor(private readonly producer: KafkaProducerService) {}

  async onModuleInit() {
    await this.consumer.connect();
    await this.consumer.subscribe({ topic: 'orders', fromBeginning: true });
    await this.consumer.run({
      eachMessage: async ({ message }: EachMessagePayload) => {
        try {
          if (!message.value) {
            console.warn('[PaymentService] Received empty message, skipping');
            return;
          }
          const raw = message.value.toString();
          const event = JSON.parse(raw);
          
          if (event && event.type === 'OrderCreated') {
            console.log(`[PaymentService] Processing payment for order ${event.data.id}`);
            
            // Simulate payment processing (90% success rate)
            await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
            const paymentSuccess = Math.random() > 0.1;
            
            if (paymentSuccess) {
              await this.producer.emit('orders', {
                type: 'PaymentCompleted',
                data: { 
                  orderId: event.data.id,
                  userId: event.data.userId,
                  productId: event.data.productId,
                  quantity: event.data.quantity,
                  amount: 100 * event.data.quantity // mock amount
                }
              });
              console.log(`[PaymentService] ✓ Payment completed for order ${event.data.id}`);
            } else {
              await this.producer.emit('orders', {
                type: 'PaymentFailed',
                data: { orderId: event.data.id, reason: 'Insufficient funds' }
              });
              console.log(`[PaymentService] ✗ Payment failed for order ${event.data.id}`);
            }
          }
        } catch (err) {
          console.error('[PaymentService] Failed to process message', err);
        }
      }
    });
  }
}
