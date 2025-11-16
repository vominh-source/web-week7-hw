import { Injectable } from '@nestjs/common';
import * as grpc from '@grpc/grpc-js';
import { loadSync } from '@grpc/proto-loader';
import { join } from 'path';

@Injectable()
export class ProductClient {
  productService: any;
  constructor(){
    const protoDef = loadSync(join(__dirname,'../../product-grpc/src/proto/product.proto'));
    // loadPackageDefinition returns a namespace object; cast to any to satisfy TS
    const pkg: any = grpc.loadPackageDefinition(protoDef).product;
    // Some generated/proto-loaded clients may be constructors or objects — cast to any
    const ServiceCtor: any = pkg && pkg.ProductService ? pkg.ProductService : pkg;
    this.productService = new ServiceCtor('localhost:50051', grpc.credentials.createInsecure());
  }
}
