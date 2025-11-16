import { Injectable, OnModuleInit } from '@nestjs/common';
import { Kafka } from 'kafkajs';

@Injectable()
export class KafkaProducerService implements OnModuleInit {
  kafka = new Kafka({ brokers: ['localhost:9092'], clientId: 'inventory-service-producer' });
  producer = this.kafka.producer();

  async onModuleInit() {
    try {
      console.log('[InventoryService] Connecting producer to Kafka...');
      await this.producer.connect();
      console.log('[InventoryService] Kafka producer connected successfully');
    } catch (err) {
      console.error('[InventoryService] Failed to connect producer:', err);
      throw err;
    }
  }

  async emit(topic: string, value: any) {
    await this.producer.send({
      topic,
      messages: [{ value: JSON.stringify(value) }],
    });
  }
}
