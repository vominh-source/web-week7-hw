# Microservice Flow Testing Guide

## Current Architecture

```
Order Service (port 3000)
  ↓ Emit: OrderCreated

Payment Service (Kafka consumer)
  ↓ Listen: OrderCreated
  ↓ Emit: PaymentCompleted (90% success) / PaymentFailed (10%)

Inventory Service (Kafka consumer)
  ↓ Listen: PaymentCompleted
  ↓ gRPC → Product Service (port 50051)
  ↓ Update stock
  ↓ Emit: StockReserved / OutOfStock

Notification Service (Kafka consumer)
  ↓ Listen: OrderCreated, PaymentCompleted, StockReserved, etc.
  ↓ Publish to RabbitMQ

Noti Workers (RabbitMQ consumers)
  ↓ Process email/SMS with retry mechanism
```

## Test Commands

### 1. Start all services

```powershell
cd C:\Users\ACER\Desktop\week7
.\start-all.ps1
```

### 2. Wait for services to initialize (15-20 seconds)

### 3. Run test

```powershell
cd test-script
npm run test-all
```

## Expected Logs

### Order Service

- `POST /orders` received
- gRPC call to product-service
- Kafka emit: OrderCreated

### Payment Service

- `[PaymentService] Processing payment for order o1`
- `[PaymentService] ✓ Payment completed for order o1` (90%)
- OR `[PaymentService] ✗ Payment failed for order o1` (10%)

### Inventory Service (only logs after payment)

- `[InventoryService] Reserving stock for order o1`
- `[InventoryService] ✓ Stock reserved for order o1`

### Notification Service

- `[NotificationService] ✉️ Order confirmation sent for o1`
- `[NotificationService] ✉️ Payment success sent for o1`
- `[NotificationService] 📱 Stock reserved SMS sent for o1`

### Noti Worker

- `[Worker 1] Processing email for order o1`
- `[Worker 1] Successfully sent email for order o1`

## Troubleshooting

### Inventory not logging?

- Check Payment Service logs first - it should emit PaymentCompleted
- Inventory only responds to PaymentCompleted events
- If payment fails (10% chance), inventory won't process

### No Kafka events?

- Check docker: `docker ps` (kafka, zookeeper should be running)
- Check Kafka advertised listeners in docker-compose.yml
- Verify services use localhost:9092

### gRPC errors?

- Ensure product-grpc service is running on port 50051
- Check proto file path in product.client.ts

## Manual Verification

### Check Kafka topics

```powershell
docker exec -it week7-kafka-1 kafka-console-consumer --bootstrap-server localhost:9092 --topic orders --from-beginning
```

### Check RabbitMQ queue

Open browser: http://localhost:15672 (guest/guest)
Check queues: notification.email, notification.sms

### Check product stock

```powershell
cd product-grpc
npx prisma studio
```

## Service Ports

- Order Service: 3000
- Notification Service: 3002
- Product gRPC: 50051
- Kafka: 9092
- RabbitMQ: 5672
- RabbitMQ Management: 15672
