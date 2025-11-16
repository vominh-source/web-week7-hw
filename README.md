# Week 7 - Microservices Architecture

## 🏗️ Architecture Overview

```
┌─────────────────┐
│  Order Service  │ (HTTP: 3000)
└────────┬────────┘
         │ Kafka: OrderCreated
         ↓
┌─────────────────┐
│ Payment Service │ (Kafka Consumer)
└────────┬────────┘
         │ Kafka: PaymentCompleted/Failed (90%/10%)
         ↓
┌──────────────────┐
│ Inventory Service│ (Kafka Consumer)
└────────┬─────────┘
         │ gRPC → Product Service (50051)
         │ Kafka: StockReserved/OutOfStock
         ↓
┌─────────────────────┐
│ Notification Service│ (Kafka Consumer)
└────────┬────────────┘
         │ RabbitMQ → notification.email/sms
         ↓
┌──────────────┐
│ Noti Workers │ (RabbitMQ Consumers with Retry)
└──────────────┘
```

## 📋 Prerequisites

- Node.js 18+ and npm
- Docker Desktop (running)
- PostgreSQL (or use Docker)

## 🚀 Quick Start

### 1. Clone and Install

```powershell
cd C:\Users\ACER\Desktop\week7

# Install dependencies for all services (will run automatically via start-all.ps1)
```

### 2. Setup Product Service Database

```powershell
# Navigate to product-grpc service
cd product-grpc

# Install dependencies
npm install

# Run Prisma migrations
npx prisma migrate dev

# Seed initial products
npx prisma db seed
```

**Note:** Check `product-grpc/package.json` for seed script. If missing, add:

```json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

And create `product-grpc/prisma/seed.ts`:

```typescript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  await prisma.product.createMany({
    data: [
      { name: "MacBook Pro M3", price: 2499 },
      { name: "iPhone 15 Pro", price: 1199 },
      { name: "iPad Air", price: 599 },
      { name: "AirPods Pro", price: 249 },
      { name: "Apple Watch", price: 399 },
    ],
    skipDuplicates: true,
  });

  console.log("✓ Seed completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### 3. Start Docker Services

```powershell
# Start Kafka, Zookeeper, RabbitMQ
docker compose up -d

# Verify containers are running
docker ps
```

Expected containers:

- `week7-kafka-1`
- `week7-zookeeper-1`
- `week7-rabbitmq-1`

### 4. Start All Microservices

```powershell
# From project root
.\start-all.ps1
```

This will open 6 PowerShell windows:

1. Product Service (gRPC: 50051)
2. Order Service (HTTP: 3000)
3. Payment Service (Kafka consumer)
4. Inventory Service (Kafka consumer)
5. Notification Service (Kafka consumer)
6. Noti Worker (RabbitMQ consumer)

**Wait 15-20 seconds** for all services to initialize.

### 5. Run Tests

```powershell
cd test-script

# Run all tests
npm run test-all

# Or test individually:
npm run test-grpc              # Test gRPC CRUD
npm run test-rabbitmq-simple   # Test RabbitMQ with multiple workers
npm run test-kafka             # Test Kafka event pipeline
```

## 🧪 Testing

### Bài 1: gRPC Product Service

```powershell
npm run test-grpc
```

Tests:

- ✅ Create products
- ✅ List all products (streaming)
- ✅ Get single product
- ✅ Update product
- ✅ Delete product

### Bài 2: RabbitMQ Task Queue with Retry

```powershell
npm run test-rabbitmq-simple
```

Features:

- 🔄 3 workers processing in parallel
- 🔁 Retry mechanism (max 3 attempts)
- 💀 Dead Letter Queue for failed messages
- 📊 20% simulated failure rate

### Bài 3: Kafka Event-Driven Architecture

```powershell
npm run test-kafka
```

Flow:

1. Create order → OrderCreated event
2. Payment processing → PaymentCompleted/Failed
3. Stock reservation → StockReserved
4. Notifications via RabbitMQ

## 🎯 Assignment Checklist

### Bài 1: gRPC ✅

- [x] Product Service với CRUD operations
- [x] Proto file định nghĩa service
- [x] Prisma ORM với PostgreSQL
- [x] Test script với full CRUD

### Bài 2: RabbitMQ ✅

- [x] Task queue với durable queues
- [x] Multiple workers (3 workers)
- [x] Retry mechanism (max 3 retries)
- [x] Dead Letter Queue
- [x] Prefetch cho load balancing

### Bài 3: Kafka Event-Driven ✅

- [x] Order → Payment → Inventory → Notification
- [x] Event types: OrderCreated, PaymentCompleted, StockReserved
- [x] Kafka topics và consumer groups
- [x] Integration với RabbitMQ cho notifications
- [x] Error handling (PaymentFailed events)

## 🔑 Key Ports

| Service              | Port  | Type |
| -------------------- | ----- | ---- |
| Order Service        | 3000  | HTTP |
| Notification Service | 3002  | HTTP |
| Product gRPC         | 50051 | gRPC |
| Kafka                | 9092  | TCP  |
| RabbitMQ             | 5672  | AMQP |
| RabbitMQ Management  | 15672 | HTTP |
| Prisma Studio        | 5555  | HTTP |

## 📝 Environment Variables

Most services use default values. Check `.env` files if needed:

### product-grpc/.env

```env
DATABASE_URL="postgresql://user:password@localhost:5432/products"
GRPC_PORT=50051
```

### Other services

No `.env` required - use hardcoded defaults for localhost development.

## 🛑 Stopping Services

```powershell
# Stop Docker containers
docker compose down

# Close all PowerShell windows opened by start-all.ps1
# Or use Task Manager to kill node.exe processes
```

## 📚 Technologies Used

- **NestJS** - Microservice framework
- **Kafka** (KafkaJS) - Event streaming
- **RabbitMQ** (amqplib) - Task queue
- **gRPC** (@grpc/grpc-js) - RPC communication
- **Prisma** - Database ORM
- **PostgreSQL** - Database
- **TypeScript** - Programming language
- **Docker** - Container orchestration

## 💡 Tips

1. **Always start Docker first** before running services
2. **Wait for Kafka** to be ready (~10 seconds after docker compose up)
3. **Check logs** in individual service terminals for debugging
4. **Use Prisma Studio** to verify database changes
5. **Monitor RabbitMQ UI** to see message flow
6. **Test incrementally** - test each service individually first

## 🐛 Common Issues

### "ECONNREFUSED localhost:9092"

→ Kafka not ready. Wait 10 more seconds.

### "EADDRINUSE :::3000"

→ Port already in use. Kill existing process or use different port.

### "Internal server error" from gRPC

→ Product service not running or Prisma client not generated.

### Messages stuck in RabbitMQ

→ Workers not running. Check noti-worker terminal.

### No events in Kafka

→ Check docker logs: `docker logs week7-kafka-1`

## 📞 Support

For issues, check:

1. Service terminal logs
2. Docker container logs: `docker logs <container-name>`
3. RabbitMQ Management UI queues
4. Database via Prisma Studio

---

**Happy Testing! 🚀**
