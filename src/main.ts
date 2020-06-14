import { NestFactory } from '@nestjs/core';
import { AppModule } from '@app/app.module';
import { Transport } from '@nestjs/microservices';
import { createConnection } from 'typeorm';
import { migrationsConfig, appConfig } from '@config';
import { Logger } from '@nestjs/common';
import { join } from 'path';

async function bootstrap() {
  const connection = await createConnection(migrationsConfig);

  await connection.runMigrations();
  await connection.close();

  const app = await NestFactory.create(AppModule);
  const logger = app.get(Logger);
  const { appUrl: url } = appConfig;

  app.connectMicroservice({
    transport: Transport.GRPC,
    options: {
      url,
      package: 'foo',
      protoPath: join(__dirname, '../foo-service.proto'),
      loader: {
        defaults: false,
      },
    },
  });

  await app.startAllMicroservices();

  logger.log(`Listening on ${url}`, 'NestApplication');
}

bootstrap();
