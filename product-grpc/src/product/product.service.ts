import { Controller } from '@nestjs/common';
import { GrpcMethod, GrpcStreamMethod } from '@nestjs/microservices';
import { PrismaService } from '../prisma/prisma.service';

@Controller()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  @GrpcMethod('ProductService', 'CreateProduct') // map method vs RPC CreateProduct của ProductService trong .proto
  async createProduct(data: { name: string; price: number }) {
    const p = await this.prisma.product.create({
      data: { name: data.name, price: data.price },
    });
    return {
      id: p.id,
      name: p.name,
      price: p.price,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    };
  }

  @GrpcMethod('ProductService', 'GetProduct')
  async getProduct(data: { id: number }) {
    const p = await this.prisma.product.findUnique({ where: { id: data.id } });
    if (!p) return null;
    return {
      id: p.id,
      name: p.name,
      price: p.price,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    };
  }

  @GrpcMethod('ProductService', 'UpdateProduct')
  async updateProduct(data: { id: number; name?: string; price?: number }) {
    const p = await this.prisma.product.update({
      where: { id: data.id },
      data: { name: data.name, price: data.price },
    });
    return {
      id: p.id,
      name: p.name,
      price: p.price,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    };
  }

  @GrpcMethod('ProductService', 'DeleteProduct')
  async deleteProduct(data: { id: number }) {
    try {
      await this.prisma.product.delete({ where: { id: data.id } });
      return { success: true };
    } catch (e) {
      return { success: false };
    }
  }

  // simple stream: list all products by streaming each one
  @GrpcMethod('ProductService', 'ListProducts')
  async listProducts(_: any, __: any) {
    // Not used for streaming response via @GrpcStreamMethod in this simplified example
    const list = await this.prisma.product.findMany();
    // return first item just to satisfy signature (streaming handled differently)
    return list[0] || {};
  }
}
