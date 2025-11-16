import { Injectable, OnModuleInit } from '@nestjs/common';
import * as amqp from 'amqplib';

@Injectable()
export class RabbitmqService implements OnModuleInit {
  // Use `any` here to avoid mismatch between runtime object shapes
  // and the TypeScript definitions supplied in different environments.
  conn: any;
  channel: any;

  async onModuleInit() {
    this.conn = await amqp.connect('amqp://localhost');
    this.channel = await this.conn.createChannel();
    await this.channel.assertQueue('notification.email', { durable: true });
  }

  async publish(queue: string, msg: any) {
    this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(msg)), { persistent: true });
  }
}
