import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentAction, Campaign, FunnelTransition, Interaction, Person, ProductView, Quote } from './entities';
import { ApiController } from './controllers/api.controller';
import { PeopleService } from './services/people.service';
import { AgentService } from './services/agent.service';
import { DashboardService } from './services/dashboard.service';
import { SeedService } from './services/seed.service';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mssql',
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 1433),
      username: process.env.DB_USER || 'sa',
      password: process.env.DB_PASSWORD || 'PoluxDemo_2026!',
      database: process.env.DB_NAME || 'POLUX_OLTP',
      entities: [Person, Interaction, ProductView, Quote, FunnelTransition, AgentAction, Campaign],
      synchronize: true,
      options: { encrypt: false, trustServerCertificate: true },
      extra: { trustServerCertificate: true },
      retryAttempts: 35,
      retryDelay: 3000,
    }),
    TypeOrmModule.forFeature([Person, Interaction, ProductView, Quote, FunnelTransition, AgentAction, Campaign]),
  ],
  controllers: [ApiController],
  providers: [PeopleService, AgentService, DashboardService, SeedService],
})
export class AppModule {}
