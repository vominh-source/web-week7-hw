import { Injectable } from '@nestjs/common';
import * as grpc from '@grpc/grpc-js';
import { loadSync } from '@grpc/proto-loader';
import { join } from 'path';

@Injectable()
export class ProductClient {
  productService: any;
  
  constructor() {
    const protoDef = loadSync(join(__dirname, '../../product-grpc/src/proto/product.proto'));
    const pkg: any = grpc.loadPackageDefinition(protoDef).product;
    const ServiceCtor: any = pkg && pkg.ProductService ? pkg.ProductService : pkg;
    this.productService = new ServiceCtor('localhost:50051', grpc.credentials.createInsecure());
  }

  async getProduct(id: number): Promise<any> {
    return new Promise((resolve, reject) => {
      this.productService.GetProduct({ id }, (err: any, data: any) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
  }

  async updateStock(id: number, stock: number): Promise<any> {
    return new Promise((resolve, reject) => {
      this.productService.UpdateProduct({ id, stock }, (err: any, data: any) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
  }
}
