import * as grpc from '@grpc/grpc-js';
import { loadSync } from '@grpc/proto-loader';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load proto file
const protoDef = loadSync(join(__dirname, '../product-grpc/src/proto/product.proto'));
const pkg: any = grpc.loadPackageDefinition(protoDef).product;
const client = new pkg.ProductService('localhost:50051', grpc.credentials.createInsecure());

// Helper function to promisify gRPC calls
function call(method: string, data: any): Promise<any> {
  return new Promise((resolve, reject) => {
    client[method](data, (err: any, response: any) => {
      if (err) reject(err);
      else resolve(response);
    });
  });
}

// Helper for streaming calls
function streamCall(method: string, data: any): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const results: any[] = [];
    const call = client[method](data);
    
    call.on('data', (item: any) => {
      results.push(item);
    });
    
    call.on('end', () => {
      resolve(results);
    });
    
    call.on('error', (err: any) => {
      reject(err);
    });
  });
}

async function testGrpcOperations() {
  console.log('\n=== Bài 1: Testing gRPC Product Service ===\n');

  try {
    // Test 1: Create Products
    console.log('1. CREATE Products:');
    const products = [
      { name: 'MacBook Pro', price: 2499 },
      { name: 'iPhone 15', price: 999 },
      { name: 'AirPods Pro', price: 249 },
    ];

    for (const product of products) {
      const created = await call('CreateProduct', product);
      console.log(`   ✓ Created: ${created.name} (ID: ${created.id})`);
    }

    // Test 2: List All Products
    console.log('\n2. LIST All Products:');
    const list = await streamCall('ListProducts', {});
    console.log(`   Found ${list.length} products:`);
    list.forEach((p: any) => {
      console.log(`   - ID: ${p.id}, Name: ${p.name}, Price: $${p.price}`);
    });

    // Test 3: Get Single Product
    console.log('\n3. GET Single Product (ID: 4):');
    const product = await call('GetProduct', { id: 4 });
    console.log(`   ✓ Found: ${product.name}`);
    console.log(`     Price: $${product.price}`);

    // Test 4: Update Product
    console.log('\n4. UPDATE Product (ID: 1):');
    const updated = await call('UpdateProduct', {
      id: 1,
      name: 'MacBook Pro M3',
      price: 2799,
    });
    console.log(`   ✓ Updated: ${updated.name}`);
    console.log(`     New Price: $${updated.price}`);

    // Test 5: Delete Product
    console.log('\n5. DELETE Product (ID: 6):');
    await call('DeleteProduct', { id: 6 });
    console.log('   ✓ Deleted successfully');

    // Test 6: Verify deletion
    console.log('\n6. VERIFY Deletion (List after delete):');
    const finalList = await streamCall('ListProducts', {});
    console.log(`   Remaining products: ${finalList.length}`);
    finalList.forEach((p: any) => {
      console.log(`   - ID: ${p.id}, Name: ${p.name}`);
    });

    console.log('\n✅ All gRPC operations completed successfully!\n');
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error('Make sure product-grpc service is running on port 50051\n');
    process.exit(1);
  }
}

testGrpcOperations();
