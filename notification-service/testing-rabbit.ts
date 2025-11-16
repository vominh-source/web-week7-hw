import * as amqp from 'amqplib';

interface Task {
  orderId: string;
  userId: string;
  type: 'email' | 'sms';
  content: string;
}

// Số lượng message muốn test
const NUM_MESSAGES = 10;

// Function simulate worker processing
async function workerConsume() {
  const conn = await amqp.connect('amqp://localhost');
  const channel = await conn.createChannel();
  await channel.assertQueue('notification.email', { durable: true });

  console.log('[Worker] Started consuming...');
  channel.consume('notification.email', async (msg) => {
    if (!msg) return;
    const task: Task = JSON.parse(msg.content.toString());
    console.log(`[Worker] Processing ${task.type} for order ${task.orderId}`);

    try {
      // Simulate random failure 20%
      if (Math.random() < 0.2) throw new Error('Simulated fail');

      console.log(`[Worker] Successfully sent ${task.type} for order ${task.orderId}`);
      channel.ack(msg);
    } catch (err) {
      console.log(`[Worker] Failed ${task.type} for order ${task.orderId}, requeueing...`);
      channel.nack(msg, false, true); // retry
    }
  });
}

// Function publish message
async function publishMessages() {
  const conn = await amqp.connect('amqp://localhost');
  const channel = await conn.createChannel();
  await channel.assertQueue('notification.email', { durable: true });

  for (let i = 1; i <= NUM_MESSAGES; i++) {
    const task: Task = {
      orderId: `o${i}`,
      userId: `u${i}`,
      type: Math.random() < 0.5 ? 'email' : 'sms',
      content: `Order o${i} created!`,
    };
    channel.sendToQueue('notification.email', Buffer.from(JSON.stringify(task)), { persistent: true });
    console.log(`[Publisher] Sent ${task.type} for order ${task.orderId}`);
  }

  await channel.close();
  await conn.close();
}

// Run test
async function test() {
  console.log('--- Starting RabbitMQ test ---');
  // Start worker
  workerConsume();

  // Give worker a bit to start
  await new Promise(res => setTimeout(res, 1000));

  // Publish test messages
  await publishMessages();
}

test().catch(console.error);
