import axios from 'axios';
import { Kafka } from 'kafkajs';

const ORDER_API = 'http://localhost:3000/orders';

interface Order {
  id: string;
  userId: string;
  productId: number;
  quantity: number;
}

async function testKafkaEventPipeline() {
  console.log('\n=== Bài 3: Testing Kafka Event-Driven Pipeline ===\n');

  // Setup Kafka consumer to monitor events
  const kafka = new Kafka({ brokers: ['localhost:9092'], clientId: 'test-client' });
  const consumer = kafka.consumer({ groupId: 'test-monitor-group' });

  const events: any[] = [];

  try {
    // Connect consumer to monitor all events
    console.log('1. Setting up Kafka event monitor...');
    await consumer.connect();
    await consumer.subscribe({ topic: 'orders', fromBeginning: false });
    
    consumer.run({
      eachMessage: async ({ message }: any) => {
        if (!message.value) return;
        const event = JSON.parse(message.value.toString());
        events.push(event);
        
        const timestamp = new Date().toLocaleTimeString();
        console.log(`   [${timestamp}] Event: ${event.type}`);
        console.log(`      Data: ${JSON.stringify(event.data)}`);
      }
    });
    console.log('   ✓ Kafka monitor ready\n');

    // Test 1: Create Orders (Producer)
    console.log('2. Creating Orders (Producer - Order Service):');
    const orders: Order[] = [
      { id: 'TEST-001', userId: 'user1', productId: 1, quantity: 2 },
      { id: 'TEST-002', userId: 'user2', productId: 2, quantity: 1 },
      { id: 'TEST-003', userId: 'user3', productId: 1, quantity: 5 },
    ];

    for (const order of orders) {
      const response = await axios.post(ORDER_API, order);
      console.log(`   ✓ Order ${order.id} created: ${response.data.ok ? 'Success' : 'Failed'}`);
    }

    // Wait for events to propagate through the pipeline
    console.log('\n3. Waiting for events to propagate through pipeline...');
    console.log('   Expected flow:');
    console.log('   - OrderCreated → Payment Service');
    console.log('   - PaymentCompleted → Inventory Service');
    console.log('   - StockReserved → Notification Service');
    console.log('   - Notifications → RabbitMQ Workers\n');

    await new Promise(resolve => setTimeout(resolve, 8000));

    // Test 2: Analyze Event Flow
    console.log('\n4. Event Flow Analysis:');
    const eventsByType = events.reduce((acc: any, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {});

    console.log('   Event Statistics:');
    Object.entries(eventsByType).forEach(([type, count]) => {
      console.log(`   - ${type}: ${count} events`);
    });

    // Test 3: Verify Pipeline Stages
    console.log('\n5. Pipeline Stage Verification:');
    const hasOrderCreated = events.some(e => e.type === 'OrderCreated');
    const hasPaymentCompleted = events.some(e => e.type === 'PaymentCompleted');
    const hasStockReserved = events.some(e => e.type === 'StockReserved');

    console.log(`   ✓ Order Service (Producer): ${hasOrderCreated ? '✅' : '❌'}`);
    console.log(`   ✓ Payment Service (Consumer): ${hasPaymentCompleted ? '✅' : '❌'}`);
    console.log(`   ✓ Inventory Service (Consumer): ${hasStockReserved ? '✅' : '❌'}`);
    console.log('   ✓ Notification Service: Check terminal logs');

    // Test 4: Event Replay Demonstration
    console.log('\n6. Event Replay Capability:');
    console.log('   To replay events from beginning, consumers can use:');
    console.log('   - fromBeginning: true in subscribe()');
    console.log('   - This allows recovery from failures');
    console.log('   - Current test consumed from latest offset\n');

    // Test 5: Show complete event chain for one order
    console.log('7. Complete Event Chain for Order TEST-001:');
    const order001Events = events.filter(e => 
      e.data.id === 'TEST-001' || e.data.orderId === 'TEST-001'
    );
    
    if (order001Events.length > 0) {
      order001Events.forEach((event, index) => {
        console.log(`   ${index + 1}. ${event.type}`);
        console.log(`      Service: ${getServiceName(event.type)}`);
        console.log(`      Data: ${JSON.stringify(event.data)}`);
      });
    } else {
      console.log('   (Events may still be processing, check service logs)');
    }

    console.log('\n✅ Kafka Event Pipeline test completed!');
    console.log('\n📊 Summary:');
    console.log(`   - Orders created: ${orders.length}`);
    console.log(`   - Total events captured: ${events.length}`);
    console.log(`   - Event types: ${Object.keys(eventsByType).join(', ')}`);
    console.log('\n📌 Check individual service terminals for detailed logs:');
    console.log('   - Order Service (port 3000)');
    console.log('   - Payment Service');
    console.log('   - Inventory Service');
    console.log('   - Notification Service\n');

    await consumer.disconnect();
    process.exit(0);

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error('Make sure all services are running:');
    console.error('   - Order Service (port 3000)');
    console.error('   - Kafka (port 9092)');
    console.error('   - Payment, Inventory, Notification Services\n');
    process.exit(1);
  }
}

function getServiceName(eventType: string): string {
  const mapping: any = {
    'OrderCreated': 'Order Service',
    'PaymentCompleted': 'Payment Service',
    'PaymentFailed': 'Payment Service',
    'StockReserved': 'Inventory Service',
    'OutOfStock': 'Inventory Service',
  };
  return mapping[eventType] || 'Unknown';
}

testKafkaEventPipeline();
