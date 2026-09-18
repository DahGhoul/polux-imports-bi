import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as sql from 'mssql';

async function ensureDatabase() {
  const host = process.env.DB_HOST || 'localhost';
  const port = Number(process.env.DB_PORT || 1433);
  const user = process.env.DB_USER || 'sa';
  const password = process.env.DB_PASSWORD || 'PoluxDemo_2026!';
  const dbName = process.env.DB_NAME || 'POLUX_OLTP';
  const cfg: any = {
    server: host, port, user, password, database: 'master',
    options: { encrypt: false, trustServerCertificate: true },
    pool: { min: 0, max: 2, idleTimeoutMillis: 5000 },
  };
  for (let attempt = 1; attempt <= 40; attempt++) {
    try {
      const pool = await sql.connect(cfg);
      await pool.request().query(`IF DB_ID(N'${dbName.replace(/'/g,"''")}') IS NULL CREATE DATABASE [${dbName.replace(/]/g,']]')}]`);
      await pool.close();
      return;
    } catch (e) {
      if (attempt === 40) throw e;
      await new Promise(r => setTimeout(r, 2500));
    }
  }
}

async function bootstrap() {
  await ensureDatabase();
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: true, credentials: true });
  app.setGlobalPrefix('proyectobi');
  const config = new DocumentBuilder()
    .setTitle('Polux Imports BI API')
    .setDescription('API del CRM y Plataforma Operacional BUYERS → LEADS → PAYERS → CUSTOMERS de Polux Imports')
    .setVersion('2.0')
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));
  await app.listen(Number(process.env.PORT || 3000), '0.0.0.0');
}
bootstrap();
