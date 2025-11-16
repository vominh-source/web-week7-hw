# Test Scripts for Microservices Project

This folder contains test scripts for all three assignments.

## Installation

```powershell
cd C:\Users\ACER\Desktop\week7\test-script
npm install
```

## Test Scripts

### Bài 1: Test gRPC Product Service

Tests CRUD operations on Product Service via gRPC:

```powershell
npm run test-grpc
```

**Prerequisites:**

- Product Service running on `localhost:50051`

**Tests:**

- Create products
- List all products
- Get single product
- Update product
- Delete product
- Verify operations

---

### Bài 2: Test RabbitMQ Task Queue with Retry

Tests notification system with RabbitMQ and retry mechanism:

```powershell
npm run test-rabbitmq
```

**Prerequisites:**

- RabbitMQ running on `localhost:5672`
- Noti Workers running (optional, for full demo)

**Tests:**

- Publish email notifications
- Publish SMS notifications
- Check queue statistics
- Worker processing simulation
- Retry mechanism (20% failure rate)
- Max retry limit (3 attempts)

---

### Bài 3: Test Kafka Event Pipeline

Tests complete event-driven order processing system:

```powershell
npm run test-kafka
```

**Prerequisites:**

- All services running:
  - Order Service (port 3000)
  - Payment Service
  - Inventory Service
  - Notification Service
  - Kafka (port 9092)

**Tests:**

- Create orders via Order Service
- Monitor Kafka events in real-time
- Verify event flow through pipeline:
  - OrderCreated → Payment Service
  - PaymentCompleted → Inventory Service
  - StockReserved → Notification Service
- Event statistics and analysis
- Complete event chain tracking
- Event replay capability demonstration

---

### Test All (Original)

Quick test to create sample orders:

```powershell
npm run test-all
```

## Quick Start

1. **Start all services:**

   ```powershell
   cd C:\Users\ACER\Desktop\week7
   .\start-all.ps1
   ```

2. **Wait 15-20 seconds for services to initialize**

3. **Run tests:**
   ```powershell
   cd test-script
   npm run test-grpc      # Test Bài 1
   npm run test-rabbitmq  # Test Bài 2
   npm run test-kafka     # Test Bài 3
   ```

## Notes

- Check service terminal windows for detailed logs
- RabbitMQ Management UI: http://localhost:15672 (guest/guest)
- Kafka events can be replayed using `fromBeginning: true`
- All tests include proper error handling and clear output
