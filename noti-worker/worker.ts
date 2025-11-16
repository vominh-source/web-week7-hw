import * as amqp from 'amqplib';

interface Task {
  orderId: string;
  userId: string;
  type: 'email' | 'sms';
  content: string;
  retryCount?: number;
}

const NUM_MESSAGES = 10;
const NUM_WORKERS = 3;

// Function simulate worker
async function startWorker(workerId: number) {
  const conn = await amqp.connect('amqp://localhost');
  const channel = await conn.createChannel();
  await channel.assertQueue('notification.email', { durable: true });

  console.log(`[Worker ${workerId}] Started, waiting for messages...`);

  channel.consume('notification.email', async (msg: amqp.ConsumeMessage | null) => {
    if (!msg) return;
    const task: Task = JSON.parse(msg.content.toString());
    task.retryCount = task.retryCount || 0;

    console.log(
      `[Worker ${workerId}] Processing ${task.type} for order ${task.orderId} (Retry: ${task.retryCount})`
    );

    try {
      // Simulate random fail 20%
      if (Math.random() < 0.2) throw new Error('Simulated fail');

      console.log(
        `[Worker ${workerId}] Successfully sent ${task.type} for order ${task.orderId}`
      );
      channel.ack(msg);

    } catch (err) {
      console.log(
        `[Worker ${workerId}] Failed ${task.type} for order ${task.orderId}, requeueing...`
      );
      task.retryCount += 1;

      if (task.retryCount > 5) {
        console.log(`[Worker ${workerId}] Max retries reached for order ${task.orderId}, discarding message`);
        channel.ack(msg);
      } else {
        channel.sendToQueue('notification.email', Buffer.from(JSON.stringify(task)), { persistent: true });
        channel.ack(msg);
      }
    }
  });
}

// Function publish messages
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
  console.log('--- Starting RabbitMQ multi-worker test ---');

  // Start multiple workers
  for (let i = 1; i <= NUM_WORKERS; i++) {
    startWorker(i);
  }

  // Give workers a bit of time to start
  await new Promise(res => setTimeout(res, 1000));

  // Publish test messages
  await publishMessages();
}

test().catch(console.error);
