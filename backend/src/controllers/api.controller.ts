import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { AgentService } from '../services/agent.service';
import { DashboardService } from '../services/dashboard.service';
import { PeopleService } from '../services/people.service';
import { SeedService } from '../services/seed.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Campaign } from '../entities';
import { Repository } from 'typeorm';

@Controller()
export class ApiController {
  constructor(
    private readonly people: PeopleService,
    private readonly agents: AgentService,
    private readonly dashboard: DashboardService,
    private readonly seed: SeedService,
    @InjectRepository(Campaign) private readonly campaigns: Repository<Campaign>,
  ) {}

  @Get('health') health() { return { ok: true, service: 'polux-ai-api', prefix: 'proyectobi', at: new Date() }; }
  @Get('dashboard') dashboardData() { return this.dashboard.get(); }
  @Get('people') list(@Query('stage') stage?: string, @Query('search') search?: string) { return this.people.list(stage, search); }
  @Get('people/:id') get(@Param('id', ParseIntPipe) id: number) { return this.people.get(id); }
  @Post('people') create(@Body() body: any) { return this.people.create(body); }
  @Post('people/:id/simulate') simulate(@Param('id', ParseIntPipe) id: number, @Body() body: { eventType: string }) { return this.agents.simulate(id, body.eventType); }
  @Post('people/:id/marketing-evaluate') marketing(@Param('id', ParseIntPipe) id: number) { return this.agents.evaluateMarketing(id); }
  @Post('people/:id/promote-lead') promote(@Param('id', ParseIntPipe) id: number, @Body() body: { reason?: string }) { return this.agents.promoteToLead(id, body?.reason); }
  @Post('people/:id/negotiation-evaluate') negotiate(@Param('id', ParseIntPipe) id: number) { return this.agents.evaluateNegotiation(id); }
  @Post('people/:id/proposal') proposal(@Param('id', ParseIntPipe) id: number) { return this.agents.generateProposal(id); }
  @Post('people/:id/confirm-payment') payLegacy(@Param('id', ParseIntPipe) id: number) { return this.agents.confirmPayment(id); }
  @Post('people/:id/pay') processPay(@Param('id', ParseIntPipe) id: number, @Body() body: { paymentMethod?: string; amount?: number; operationCode?: string; cardLast4?: string; deliveryAddress?: string }) { return this.agents.processPaymentWithGateway(id, body); }
  @Post('people/:id/shipping-advance') advanceShipping(@Param('id', ParseIntPipe) id: number) { return this.agents.advanceShippingStage(id); }
  @Post('people/:id/collection-alert') collectionAlert(@Param('id', ParseIntPipe) id: number, @Body() body?: { alertType?: string; customMessage?: string }) { return this.agents.triggerCollectionAlert(id, body); }
  @Post('people/:id/deliver') deliverService(@Param('id', ParseIntPipe) id: number, @Body() body: { deliveryType?: string; appleSerialNumber?: string; notes?: string }) { return this.agents.deliverService(id, body); }
  @Post('people/:id/nps') submitNps(@Param('id', ParseIntPipe) id: number, @Body() body: { score: number; feedback?: string }) { return this.agents.submitNps(id, body); }
  @Post('people/:id/support-ticket') supportTicket(@Param('id', ParseIntPipe) id: number, @Body() body: { topic: string; detail: string }) { return this.agents.createSupportTicket(id, body); }
  @Post('people/:id/ask-agent') askAgent(@Param('id', ParseIntPipe) id: number, @Body() body: { question: string }) { return this.agents.askAgent(id, body?.question || ''); }
  @Get('agents/activity') activity(@Query('type') type?: string) { return this.agents.recent(type); }
  @Get('campaigns') campaignList() { return this.campaigns.find({ order: { reach: 'DESC' } }); }
  @Post('demo/reset') reset() { return this.seed.reset(); }
}
