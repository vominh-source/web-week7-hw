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
const MAX_RETRIES = 3;
const FAILURE_RATE = 0.2;

let processedCount = 0;
let failedCount = 0;
let retriedCount = 0;

// Worker với retry mechanism
async function startWorker(workerId: number) {
  const conn = await amqp.connect('amqp://localhost');
  const channel = await conn.createChannel();
  
  await channel.assertQueue('notification.email', { durable: true });
  await channel.assertQueue('notification.email.retry', { durable: true });
  await channel.assertQueue('notification.email.dlq', { durable: true });
  
  // Set prefetch để mỗi worker chỉ nhận 1 message 1 lúc
  channel.prefetch(1);
  
  console.log(`[Worker ${workerId}] Started consuming...`);
  
  channel.consume('notification.email', async (msg) => {
    if (!msg) return;
    
    const task: Task = JSON.parse(msg.content.toString());
    const retryCount = task.retryCount || 0;
    
    console.log(`[Worker ${workerId}] Processing ${task.type} for order ${task.orderId} (Retry: ${retryCount})`);
    
    // Simulate processing time
    await new Promise(res => setTimeout(res, 100));
    
    try {
      // Simulate random failure
      if (Math.random() < FAILURE_RATE) {
        throw new Error('Simulated failure');
      }
      
      console.log(`   ✓ Successfully sent ${task.type} for order ${task.orderId}`);
      channel.ack(msg);
      processedCount++;
      
    } catch (err) {
      if (retryCount < MAX_RETRIES) {
        console.log(`   ⚠️  Failed, retrying... (Attempt ${retryCount + 1}/${MAX_RETRIES})`);
        
        // Send to retry queue with increased retry count
        task.retryCount = retryCount + 1;
        channel.sendToQueue('notification.email.retry', Buffer.from(JSON.stringify(task)), { persistent: true });
        channel.ack(msg); // Remove from main queue
        retriedCount++;
        
      } else {
        console.log(`   ❌ Failed after ${MAX_RETRIES} retries, moving to DLQ`);
        
        // Send to Dead Letter Queue
        channel.sendToQueue('notification.email.dlq', Buffer.from(JSON.stringify(task)), { persistent: true });
        channel.ack(msg);
        failedCount++;
      }
    }
  });
  
  // Consume from retry queue and send back to main queue
  channel.consume('notification.email.retry', async (msg) => {
    if (!msg) return;
    
    // Add delay before retry
    await new Promise(res => setTimeout(res, 500));
    
    const task: Task = JSON.parse(msg.content.toString());
    channel.sendToQueue('notification.email', Buffer.from(JSON.stringify(task)), { persistent: true });
    channel.ack(msg);
  });
}

// Publisher
async function publishMessages() {
  const conn = await amqp.connect('amqp://localhost');
  const channel = await conn.createChannel();
  
  await channel.assertQueue('notification.email', { durable: true });
  
  console.log('\n📤 Publishing messages...\n');
  
  for (let i = 1; i <= NUM_MESSAGES; i++) {
    const task: Task = {
      orderId: `ORDER-${i}`,
      userId: `USER-${i}`,
      type: i % 2 === 0 ? 'email' : 'sms',
      content: `Order ORDER-${i} notification`,
      retryCount: 0,
    };
    
    channel.sendToQueue('notification.email', Buffer.from(JSON.stringify(task)), { persistent: true });
    console.log(`   ✓ Queued ${task.type} for order ${task.orderId}`);
  }
  
  console.log(`\n📊 Published ${NUM_MESSAGES} messages\n`);
  
  await channel.close();
  await conn.close();
}

// Main test
async function test() {
  console.log('\n=== Bài 2: Testing RabbitMQ with Multiple Workers & Retry ===\n');
  
  // Start multiple workers
  console.log(`🚀 Starting ${NUM_WORKERS} workers...\n`);
  for (let i = 1; i <= NUM_WORKERS; i++) {
    startWorker(i);
  }
  
  // Wait for workers to initialize
  await new Promise(res => setTimeout(res, 1000));
  
  // Publish messages
  await publishMessages();
  
  // Wait for processing
  console.log('⏳ Processing messages...\n');
  await new Promise(res => setTimeout(res, 8000));
  
  // Show stats
  console.log('\n📈 Final Statistics:');
  console.log(`   - Processed successfully: ${processedCount}`);
  console.log(`   - Retried: ${retriedCount}`);
  console.log(`   - Failed (DLQ): ${failedCount}`);
  console.log(`   - Total messages: ${NUM_MESSAGES}`);
  
  console.log('\n✅ Test completed!\n');
  process.exit(0);
}

test().catch(console.error);
