import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { existsSync } from 'fs';
import * as process from 'process';
import { config } from 'dotenv';
config();

async function bootstrap() {
  const protoPath = join(__dirname, 'proto/product.proto');
  // Ensure proto files are present in the runtime location. When running the built
  // JS from `dist` the `dist/src/proto` directory may be missing (build copy step
  // might not run in some start workflows). If the proto is missing in dist but
  // exists in the project `src/proto`, copy it here before Nest loads gRPC.
  const srcProtoDir = join(process.cwd(), 'src', 'proto');
  const destProtoDir = join(__dirname, 'proto');
  async function ensureProto() {
    if (existsSync(protoPath)) return true;
    const srcFile = join(srcProtoDir, 'product.proto');
    if (!existsSync(srcFile)) {
      console.error('[bootstrap] proto file not found at', protoPath, 'and source', srcFile);
      return false;
    }
    try {
      await import('fs').then(fs => fs.promises.mkdir(destProtoDir, { recursive: true }));
      const copyPromises: Promise<void>[] = [];
      const entries = await import('fs').then(fs => fs.promises.readdir(srcProtoDir));
      for (const entry of entries) {
        const s = join(srcProtoDir, entry);
        const d = join(destProtoDir, entry);
        copyPromises.push(import('fs').then(fs => fs.promises.copyFile(s, d)));
      }
      await Promise.all(copyPromises);
      console.log('[bootstrap] copied proto files to', destProtoDir);
      return existsSync(protoPath);
    } catch (err) {
      console.error('[bootstrap] failed copying proto files:', err);
      return false;
    }
  }

  console.log('[bootstrap] resolved protoPath =', protoPath, 'exists=', existsSync(protoPath));
  if (!existsSync(protoPath)) {
    await ensureProto();
  }
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.GRPC,
    options: {
      package: 'product',
      protoPath,
      url: `0.0.0.0:${process.env.GRPC_PORT || 50051}`,
    },
  });
  await app.listen();
  console.log(`gRPC server listening on ${process.env.GRPC_PORT || 50051}`);
}
bootstrap();
