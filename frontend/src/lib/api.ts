export type Person = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  age: number;
  city: string;
  province?: string;
  district?: string;
  address?: string;
  region: string;
  documentType?: string;
  documentNumber?: string;
  gender?: string;
  decisionRole?: string;
  currentDevice?: string;
  occupation?: string;
  company?: string;
  university?: string;
  career?: string;
  socioeconomicLevel: string;
  monthlyIncomeMin: number;
  monthlyIncomeMax: number;
  stage: 'BUYER' | 'LEAD' | 'PAYER' | 'CUSTOMER' | 'TURNED' | string;
  preferredChannel: string;
  acquisitionSource: string;
  campaignName?: string;
  mainProduct: string;
  secondaryProducts?: string[];
  interests?: string[];
  budgetMin: number;
  budgetMax: number;
  paymentPreference: string;
  priceSensitivity: string;
  score: number;
  priority: string;
  conversionProbability: number;
  quoteActive: boolean;
  quoteStartDate?: string;
  quoteEndDate?: string;
  lastActivityAt?: string;
  agentSummary?: string;
  nextBestAction?: string;
  humanInterventionRequired: boolean;

  // Fase 3: PAYERS & Logística (Diego - 5.5)
  paymentMethod?: string;
  paidAmount?: number;
  receiptNumber?: string;
  paidAt?: string;
  courierTrackingCode?: string;
  shippingStage?: 'MIAMI_WAREHOUSE' | 'AIR_TRANSIT' | 'SUNAT_CUSTOMS' | 'TRUJILLO_STORE' | 'DELIVERED' | string;

  // Fase 4: CUSTOMERS & Fidelización Postventa CRM (Diego - 6.5)
  deliveryType?: 'STORE_PICKUP' | 'VERIFIED_DELIVERY' | string;
  deliveredAt?: string;
  appleSerialNumber?: string;
  warrantyCode?: string;
  warrantyExpiresAt?: string;
  npsScore?: number;
  npsFeedback?: string;
  npsSubmittedAt?: string;
  loyaltyRewardActive?: boolean;

  interactions?: Interaction[];
  productViews?: ProductView[];
  quotes?: Quote[];
  transitions?: FunnelTransition[];
  agentActions?: AgentAction[];
};

export type Interaction = { id:number; kind:string; channel:string; topic:string; content:string; intentPoints:number; createdAt:string };
export type ProductView = { id:number; product:string; secondsViewed:number; createdAt:string };
export type Quote = { id:number; code:string; product:string; amount:number; status:string; paymentPlan:string; expiresAt:string; createdAt:string };
export type FunnelTransition = { id:number; fromStage:string; toStage:string; reason:string; source:string; createdAt:string };
export type AgentAction = { id:number; agentType:string; actionType:string; title:string; detail:string; reasoning?:string; status:string; createdAt:string; person?:Person };

const request = async <T>(url:string, init?:RequestInit): Promise<T> => {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) }, ...init });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const api = {
  dashboard: () => request<any>('/proyectobi/dashboard'),
  people: (stage?: string, search?: string) => request<Person[]>(`/proyectobi/people?${new URLSearchParams({ ...(stage ? {stage}:{}), ...(search ? {search}: {}) }).toString()}`),
  createPerson: (data: Partial<Person>) => request<Person>('/proyectobi/people', { method: 'POST', body: JSON.stringify(data) }),
  person: (id:number) => request<Person>(`/proyectobi/people/${id}`),
  activity: (type?:string) => request<AgentAction[]>(`/proyectobi/agents/activity${type ? `?type=${type}` : ''}`),
  campaigns: () => request<any[]>('/proyectobi/campaigns'),
  simulate: (id:number, eventType:string) => request<Person>(`/proyectobi/people/${id}/simulate`, { method:'POST', body:JSON.stringify({eventType}) }),
  marketingEvaluate: (id:number) => request<Person>(`/proyectobi/people/${id}/marketing-evaluate`, {method:'POST'}),
  negotiationEvaluate: (id:number) => request<Person>(`/proyectobi/people/${id}/negotiation-evaluate`, {method:'POST'}),
  promote: (id:number) => request<Person>(`/proyectobi/people/${id}/promote-lead`, {method:'POST', body:JSON.stringify({reason:'Promoción manual validada por el agente'})}),
  proposal: (id:number) => request<any>(`/proyectobi/people/${id}/proposal`, {method:'POST'}),
  confirmPayment: (id:number) => request<Person>(`/proyectobi/people/${id}/confirm-payment`, {method:'POST'}),
  
  // Fase 3: Pasarela de Pagos y Logística (Diego - 5.5)
  payWithGateway: (id:number, body: { paymentMethod: string; amount: number; operationCode?: string; cardLast4?: string; deliveryAddress?: string }) =>
    request<Person>(`/proyectobi/people/${id}/pay`, { method: 'POST', body: JSON.stringify(body) }),
  shippingAdvance: (id:number) => request<Person>(`/proyectobi/people/${id}/shipping-advance`, { method: 'POST' }),
  collectionAlert: (id:number, body?: { alertType?: string; customMessage?: string }) => 
    request<Person>(`/proyectobi/people/${id}/collection-alert`, { method: 'POST', body: JSON.stringify(body || {}) }),

  // Fase 4: Entrega, Garantía y Fidelización CRM (Diego - 6.5)
  deliverService: (id:number, body: { deliveryType: string; appleSerialNumber?: string; notes?: string }) =>
    request<Person>(`/proyectobi/people/${id}/deliver`, { method: 'POST', body: JSON.stringify(body) }),
  submitNps: (id:number, body: { score: number; feedback?: string }) =>
    request<Person>(`/proyectobi/people/${id}/nps`, { method: 'POST', body: JSON.stringify(body) }),
  supportTicket: (id:number, body: { topic: string; detail: string }) =>
    request<Person>(`/proyectobi/people/${id}/support-ticket`, { method: 'POST', body: JSON.stringify(body) }),

  askAgent: (id:number, question:string) => request<{answer:string;stage:string;personId:number}>(`/proyectobi/people/${id}/ask-agent`, {method:'POST', body:JSON.stringify({question})}),
  reset: () => request<{ok:boolean}>('/proyectobi/demo/reset', {method:'POST'}),
};

export const money = (n:number) => new Intl.NumberFormat('es-PE', { style:'currency', currency:'PEN', maximumFractionDigits:0 }).format(Number(n || 0));
export const fmtDate = (s?:string) => s ? new Intl.DateTimeFormat('es-PE',{dateStyle:'medium',timeStyle:'short'}).format(new Date(s)) : '—';
export const initials = (p:Pick<Person,'firstName'|'lastName'>) => `${p.firstName?.[0] || ''}${p.lastName?.[0] || ''}`.toUpperCase();
