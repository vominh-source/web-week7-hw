import { Injectable, OnModuleInit } from '@nestjs/common';
import { Kafka } from 'kafkajs';

@Injectable()
export class KafkaProducerService implements OnModuleInit {
  kafka = new Kafka({ brokers: ['localhost:9092'], clientId: 'payment-service-producer' });
  producer = this.kafka.producer();

  async onModuleInit() {
    await this.producer.connect();
    console.log('[PaymentService] Kafka producer connected');
  }

  async emit(topic: string, value: any) {
    await this.producer.send({
      topic,
      messages: [{ value: JSON.stringify(value) }],
    });
  }
}
