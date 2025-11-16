import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');
  
  // Clear existing products
  await prisma.product.deleteMany();
  
  // Create sample products
  const products = await prisma.product.createMany({
    data: [
      { name: 'MacBook Pro M3', price: 2499 },
      { name: 'iPhone 15 Pro', price: 1199 },
      { name: 'iPad Air', price: 599 },
      { name: 'AirPods Pro', price: 249 },
      { name: 'Apple Watch Series 9', price: 399 },
      { name: 'Magic Keyboard', price: 99 },
      { name: 'Magic Mouse', price: 79 },
      { name: 'AirTag 4 Pack', price: 99 },
    ],
  });
  
  console.log(`✓ Created ${products.count} products`);
  
  // Display created products
  const allProducts = await prisma.product.findMany();
  console.log('\n📦 Products in database:');
  allProducts.forEach(p => {
    console.log(`   - ${p.id}. ${p.name} - $${p.price}`);
  });
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
