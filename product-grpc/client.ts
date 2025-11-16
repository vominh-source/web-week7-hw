const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const packageDef = protoLoader.loadSync('./src/proto/product.proto', {});
const grpcObj = grpc.loadPackageDefinition(packageDef);
const product = grpcObj.product;
const client = new product.ProductService('localhost:50051', grpc.credentials.createInsecure());

// Create
client.CreateProduct({ name: 'Phone', price: 999 }, (err, res) => {
  if (err) return console.error(err);
  console.log('Created:', res);

  // Get
  client.GetProduct({ id: res.id }, (e, r) => {
    console.log('Get:', r);
  });
});
