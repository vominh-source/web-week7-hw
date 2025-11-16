import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding products...');
  
  await prisma.product.createMany({
    data: [
      { id: 1, name: 'Laptop', stock: 10 },
      { id: 2, name: 'Phone', stock: 20 },
      { id: 3, name: 'Tablet', stock: 5 },
    ],
    skipDuplicates: true,
  });

  console.log('Products seeded successfully!');
  const products = await prisma.product.findMany();
  console.table(products);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
