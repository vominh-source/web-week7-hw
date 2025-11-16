import axios from 'axios';

const BASE_URL = 'http://localhost:3000'; // port OrderService
const ENDPOINT = `${BASE_URL}/orders`;

const orders = [
  { id: 'o1', userId: 'u1', productId: 1, quantity: 1 },
  { id: 'o2', userId: 'u2', productId: 2, quantity: 1 },
  { id: 'o3', userId: 'u3', productId: 3, quantity: 10 }, // stock < 10 → Out of stock
];

async function sendOrder(order: any) {
  try {
    const res = await axios.post(ENDPOINT, order);
    console.log(`[Test] Order ${order.id} response:`, res.data);
  } catch (err: any) {
    console.error(`[Test] Order ${order.id} failed:`, err.message);
  }
}

async function runTest() {
  for (const order of orders) {
    await sendOrder(order);
  }
}

runTest();
