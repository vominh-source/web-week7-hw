import { Injectable, OnModuleInit } from '@nestjs/common';
import { Kafka, EachMessagePayload } from 'kafkajs';
import { RabbitmqService } from './rabbitmq.service';

@Injectable()
export class KafkaConsumerService implements OnModuleInit {
  kafka = new Kafka({ brokers: ['localhost:9092'], clientId: 'notification-service' });
  consumer = this.kafka.consumer({ groupId: 'notification-service-group' });

  constructor(private readonly rabbit: RabbitmqService) {}

  async onModuleInit() {
    await this.consumer.connect();
    await this.consumer.subscribe({ topic: 'orders', fromBeginning: true });
    await this.consumer.run({
      eachMessage: async ({ message }: EachMessagePayload) => {
        try {
          if (!message.value) {
            console.warn('[NotificationService] Received empty message, skipping');
            return;
          }
          const raw = message.value.toString();
          const event = JSON.parse(raw);
          
          if (event && event.type === 'OrderCreated') {
            await this.rabbit.publish('notification.email', {
              orderId: event.data.id,
              userId: event.data.userId,
              type: 'email',
              template: 'order-confirmation',
              content: `Order ${event.data.id} created! Processing payment...`
            });
            console.log(`[NotificationService] ✉️  Order confirmation sent for ${event.data.id}`);
          }
          
          if (event && event.type === 'PaymentCompleted') {
            await this.rabbit.publish('notification.email', {
              orderId: event.data.orderId,
              userId: event.data.userId,
              type: 'email',
              template: 'payment-success',
              content: `Payment completed for order ${event.data.orderId}. Amount: $${event.data.amount}`
            });
            console.log(`[NotificationService] ✉️  Payment success sent for ${event.data.orderId}`);
          }
          
          if (event && event.type === 'PaymentFailed') {
            await this.rabbit.publish('notification.email', {
              orderId: event.data.orderId,
              type: 'email',
              template: 'payment-failed',
              content: `Payment failed for order ${event.data.orderId}. Reason: ${event.data.reason}`
            });
            console.log(`[NotificationService] ✉️  Payment failure alert sent for ${event.data.orderId}`);
          }
          
          if (event && event.type === 'StockReserved') {
            await this.rabbit.publish('notification.sms', {
              orderId: event.data.orderId,
              type: 'sms',
              content: `Order ${event.data.orderId} confirmed! Preparing shipment.`
            });
            console.log(`[NotificationService] 📱 Stock reserved SMS sent for ${event.data.orderId}`);
          }
          
          if (event && event.type === 'OutOfStock') {
            await this.rabbit.publish('notification.email', {
              orderId: event.data.orderId,
              type: 'email',
              template: 'out-of-stock',
              content: `Order ${event.data.orderId} cancelled - product out of stock`
            });
            console.log(`[NotificationService] ✉️  Out of stock alert sent for ${event.data.orderId}`);
          }
        } catch (err) {
          console.error('[NotificationService] Failed to process message', err);
        }
      }
    });
  }
}
