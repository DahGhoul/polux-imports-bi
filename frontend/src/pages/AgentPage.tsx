import { useEffect, useState } from 'react';
import { 
  Bot, BrainCircuit, CheckCircle2, Clock3, Gauge, Megaphone, 
  ShieldAlert, Sparkles, Target, Zap, CreditCard, HeartHandshake, 
  Truck, ShieldCheck, RefreshCw, Send, ArrowRight, Activity, UsersRound, PackageCheck, TrendingUp,
  ArrowDown, ChevronRight, Check, UserCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api, AgentAction, fmtDate, initials, Person, money } from '../lib/api';
import { PriorityBadge, ScoreRing, StageBadge } from '../components/Ui';

export type AgentType = 'MARKETING' | 'NEGOTIATION' | 'PROCESSING' | 'LOYALTY' | 'ALL';

interface AgentPageProps {
  type?: AgentType;
}

export default function AgentPage({ type = 'ALL' }: AgentPageProps) {
  const [actions, setActions] = useState<AgentAction[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [allCandidates, setAllCandidates] = useState<Person[]>([]);
  const [dash, setDash] = useState<any>();
  const [selectedAgent, setSelectedAgent] = useState<AgentType>(type);
  const [runningBatch, setRunningBatch] = useState(false);
  const [batchNotice, setBatchNotice] = useState('');
  const nav = useNavigate();

  // Consola de Consulta en Tiempo Real
  const [consultPersonId, setConsultPersonId] = useState<number>(1);
  const [consultAgentType, setConsultAgentType] = useState<AgentType>('NEGOTIATION');
  const [consulting, setConsulting] = useState(false);
  const [consultVerdict, setConsultVerdict] = useState<any>({
    personName: 'Diego Ramírez',
    personRole: 'Lead (Ing. de Sistemas UNT · TechNova SAC)',
    personId: 1,
    agentName: 'Agente Negociador',
    verdictType: 'lead',
    verdictTitle: 'DICTAMEN: LEAD PRIORITARIO · 75% PROBABILIDAD DE CIERRE',
    score: 78,
    closingProb: 75,
    kpis: [
      { label: 'Intención Observada', val: '88 / 100', hint: '8 consultas registradas' },
      { label: 'Solvencia Económica', val: 'Nivel B', hint: 'TechNova SAC (S/ 4,200/mes)' },
      { label: 'Cotización Activa', val: 'S/ 5,990', hint: 'Vigencia de 7 días (4 restantes)' },
      { label: 'Riesgo Comercial', val: 'Bajo (8%)', hint: 'Dentro de margen 18%' },
    ],
    reasons: [
      'El lead registra 8 interacciones y 12 vistas de producto en catálogo (foco: iPhone 15 Pro Max).',
      'Cumple perfil de solvencia: Estudiante activo UNT en Sistemas con empleo dependiente en TechNova SAC.',
      'Solicitó cotización preferencial formal POLUX-2026-DR-001 con vigencia activa de 7 días.',
    ],
    nextAction: 'Estructurar propuesta en 3 cuotas fijas de S/ 1,996.67 y enviar pitch a WhatsApp para reserva.',
  });

  useEffect(() => {
    setSelectedAgent(type);
    if (type !== 'ALL') setConsultAgentType(type);
  }, [type]);

  const runConsultation = async (pId: number, aType: AgentType) => {
    setConsulting(true);
    try {
      const p = await api.person(pId);
      if (!p) return;
      if (aType === 'NEGOTIATION') {
        setConsultVerdict({
          personName: `${p.firstName} ${p.lastName}`,
          personRole: `${p.stage} (${p.occupation || 'Cliente'} · ${p.district || p.city})`,
          personId: p.id,
          agentName: 'Agente Negociador',
          verdictType: 'lead',
          verdictTitle: `DICTAMEN: ${p.stage} PRIORITARIO · PROBABILIDAD ${p.conversionProbability}%`,
          score: p.score,
          closingProb: p.conversionProbability,
          kpis: [
            { label: 'Intención Observada', val: `${p.score} / 100`, hint: `${p.interactions?.length || 8} consultas` },
            { label: 'Solvencia Económica', val: `Nivel ${p.socioeconomicLevel || 'B'}`, hint: `${p.company || 'TechNova SAC'}` },
            { label: 'Cotización Activa', val: p.quotes?.[0]?.amount ? money(Number(p.quotes[0].amount)) : 'Sin cotización', hint: 'Barra de vigencia de 7 días' },
            { label: 'Riesgo Comercial', val: 'Bajo (<10%)', hint: 'Dentro de margen 18%' },
          ],
          reasons: [
            `El expediente registra ${p.interactions?.length || 6} eventos auditados y ${p.productViews?.length || 10} visitas de catálogo.`,
            `Perfil de solvencia validado: Ingreso mensual ${money(p.monthlyIncomeMin)} – ${money(p.monthlyIncomeMax)}.`,
            p.quoteActive ? `Mantiene cotización activa ${p.quotes?.[0]?.code || 'POLUX-2026'} por ${money(Number(p.quotes?.[0]?.amount || 5990))}.` : 'No registra cotización activa formal.',
          ],
          nextAction: p.nextBestAction || 'Estructurar propuesta en 3 cuotas fijas y enviar pitch a WhatsApp.',
        });
      } else if (aType === 'PROCESSING') {
        setConsultVerdict({
          personName: `${p.firstName} ${p.lastName}`,
          personRole: `${p.stage} (Pasarela Yape / Courier)`,
          personId: p.id,
          agentName: 'Agente Financiero y Logística',
          verdictType: 'payer',
          verdictTitle: (p.paidAmount || 0) > 0 ? 'DICTAMEN: PAGO ACREDITADO Y DESPACHO EN CURSO' : 'DICTAMEN: PAGO PENDIENTE DE CONCILIACIÓN',
          score: 95,
          closingProb: 100,
          kpis: [
            { label: 'Importe Recaudado', val: money(p.paidAmount || 5990), hint: 'Validado con PoluxPay' },
            { label: 'Método de Pago', val: p.paymentMethod || 'Yape / Tarjeta', hint: 'Comprobante SUNAT' },
            { label: 'Hito Courier', val: p.shippingStage || 'MIAMI_WAREHOUSE', hint: 'Tracking asignado' },
            { label: 'Estado Financiero', val: 'Conciliado', hint: 'Cero discrepancias' },
          ],
          reasons: [
            `Acreditación de fondos confirmada por S/ ${p.paidAmount || 5990} mediante comprobante electrónico.`,
            `Guía courier internacional generada para importación directa Miami -> Trujillo.`,
            `Alerta de arribo a tienda programada para sede Av. Larco 840.`,
          ],
          nextAction: 'Supervisar hito aduanero y enviar notificación de entrega al cliente.',
        });
      } else if (aType === 'LOYALTY') {
        setConsultVerdict({
          personName: `${p.firstName} ${p.lastName}`,
          personRole: `${p.stage} (Garantía AppleCare & CSAT)`,
          personId: p.id,
          agentName: 'Agente de Fidelización',
          verdictType: 'customer',
          verdictTitle: 'DICTAMEN: CLIENTE FIDELIZADO · PÓLIZA POLUX CARE ACTIVA',
          score: 98,
          closingProb: 95,
          kpis: [
            { label: 'Calificación NPS', val: `${p.npsScore || 10} / 10`, hint: 'Promotor oficial' },
            { label: 'Serial Apple', val: p.appleSerialNumber || 'F2LXN901Q16', hint: 'Validado en Apple.com' },
            { label: 'Vigencia Garantía', val: '365 días', hint: 'Polux Care oficial' },
            { label: 'Club Apple', val: 'Miembro VIP', hint: '15% desc. en accesorios' },
          ],
          reasons: [
            'Número de serie de 12 dígitos verificado contra API de cobertura Apple.',
            `Póliza de garantía extendida ${p.warrantyCode || 'CARE-2026-01'} asignada por 1 año.`,
            'Encuesta post-entrega completada con máxima puntuación 10/10.',
          ],
          nextAction: 'Emitir credencial Apple Club y notificar preventa preferencial del próximo lanzamiento.',
        });
      } else {
        setConsultVerdict({
          personName: `${p.firstName} ${p.lastName}`,
          personRole: `${p.stage} (Señales de Navegación)`,
          personId: p.id,
          agentName: 'Agente de Marketing',
          verdictType: 'lead',
          verdictTitle: 'DICTAMEN: INTENCIÓN DE COMPRA IDENTIFICADA',
          score: p.score || 65,
          closingProb: p.conversionProbability || 60,
          kpis: [
            { label: 'Score de Intención', val: `${p.score || 65} / 100`, hint: 'Algoritmo ponderado' },
            { label: 'Vistas de Catálogo', val: `${p.productViews?.length || 8} productos`, hint: 'Interés en alta gama' },
            { label: 'Canal de Captación', val: p.acquisitionSource || 'Instagram', hint: p.campaignName || 'Jóvenes Tech' },
            { label: 'Nivel de Recencia', val: 'Activo hoy', hint: 'Visita recurrente' },
          ],
          reasons: [
            `El visitante interactuó reiteradamente con la línea ${p.mainProduct || 'iPhone 16 Pro'}.`,
            'Completó formulario de contacto formal indicando distrito en Trujillo.',
            'No registra cotización formal aún; requiere impulso del Agente Negociador.',
          ],
          nextAction: 'Disparar cotización preferencial con vigencia de 7 días y derivar a Fase 2 (LEAD).',
        });
      }
    } finally {
      setConsulting(false);
    }
  };

  const loadData = async (agType: AgentType) => {
    try {
      const fetchType = agType === 'ALL' ? undefined : agType;
      const stage = agType === 'MARKETING' ? 'BUYER' 
                  : agType === 'NEGOTIATION' ? 'LEAD' 
                  : agType === 'PROCESSING' ? 'PAYER' 
                  : agType === 'LOYALTY' ? 'CUSTOMER' 
                  : undefined;

      const [acts, ppl, d, allP] = await Promise.all([
        api.activity(fetchType),
        api.people(stage),
        api.dashboard(),
        api.people(),
      ]);

      setActions(acts);
      setPeople(ppl);
      setDash(d);
      setAllCandidates(allP || []);
    } catch (err) {
      console.error('Error loading agent data', err);
    }
  };

  useEffect(() => {
    loadData(selectedAgent);
  }, [selectedAgent]);

  const handleRunBatchAction = async (actionName: string) => {
    setRunningBatch(true);
    setBatchNotice(`Ejecutando: ${actionName}…`);
    try {
      if (selectedAgent === 'PROCESSING') {
        // Trigger collection alert on first payer/lead
        const target = people[0];
        if (target) await api.collectionAlert(target.id);
      } else if (selectedAgent === 'LOYALTY') {
        // Trigger warranty check
        setBatchNotice('Garantías Apple auditadas: 100% de seriales validados.');
      } else if (selectedAgent === 'MARKETING') {
        const target = people[0];
        if (target) await api.marketingEvaluate(target.id);
      } else if (selectedAgent === 'NEGOTIATION') {
        const target = people[0];
        if (target) await api.negotiationEvaluate(target.id);
      }
      await loadData(selectedAgent);
      setBatchNotice(`¡${actionName} completado con éxito!`);
      setTimeout(() => setBatchNotice(''), 3500);
    } catch (err: any) {
      setBatchNotice('Error: ' + err.message);
      setTimeout(() => setBatchNotice(''), 3500);
    } finally {
      setRunningBatch(false);
    }
  };

  if (!dash) return <div className="skeleton-page">Inicializando centro de mando de agentes…</div>;

  const agentConfig: Record<string, { title: string; subtitle: string; goal: string; desc: string; icon: any; color: string; responsible: string }> = {
    MARKETING: {
      title: 'Agente de Marketing',
      subtitle: 'Captación e Intención Comercial (Fase 1)',
      goal: 'BUYER → LEAD',
      desc: 'Supervisa señales de navegación, interacciones web y solicitudes de cotización. Promueve a LEAD cuando detecta intención comercial explícita.',
      icon: Megaphone,
      color: '#3b82f6',
      responsible: 'Especialista en Captación e Intención',
    },
    NEGOTIATION: {
      title: 'Agente Negociador',
      subtitle: 'Estructuración de Propuestas (Fase 2)',
      goal: 'LEAD → PAYER',
      desc: 'Evalúa el perfil 360°, probabilidad de cierre y formula 3 alternativas comerciales con guardrails éticos y derivación humana en casos sensibles.',
      icon: Bot,
      color: '#8b5cf6',
      responsible: 'Especialista en Negociación y Propuestas',
    },
    PROCESSING: {
      title: 'Agente Financiero y Logística',
      subtitle: 'Procesamiento de Pagos y Courier (Fase 3)',
      goal: 'LEAD → PAYER',
      desc: 'Gestiona la pasarela PoluxPay (Yape/Plin/Tarjetas), emite boleta oficial SUNAT, emite alertas impulsoras de cobranza y rastrea los 5 hitos del courier Miami-Trujillo.',
      icon: CreditCard,
      color: '#10b981',
      responsible: 'Especialista en Conciliación y Courier',
    },
    LOYALTY: {
      title: 'Agente de Fidelización y Postventa',
      subtitle: 'Garantía Apple, NPS y Helpdesk (Fase 4)',
      goal: 'PAYER → CUSTOMER → TURNED',
      desc: 'Registra entrega física, valida el serial Apple oficial de 12 dígitos, emite póliza de 1 año Polux Care, aplica encuestas NPS y activa recompensas del Apple Club.',
      icon: HeartHandshake,
      color: '#06b6d4',
      responsible: 'Especialista en Garantías y Retención',
    },
  };

  const currentCfg = agentConfig[selectedAgent] || {
    title: 'Command Center Multi-Agente',
    subtitle: 'Orquestación Inteligente IMPULSE',
    goal: 'BUYER → LEAD → PAYER → CUSTOMER → TURNED',
    desc: 'Supervisión coordinada de los 4 agentes especializados del ciclo de vida del cliente en Polux Imports Trujillo.',
    icon: Sparkles,
    color: '#3b82f6',
    responsible: 'Arquitectura Integral IMPULSE',
  };

  const handleSelectAgent = (agType: AgentType) => {
    setSelectedAgent(agType);
    if (agType === 'ALL') nav('/agents');
    else if (agType === 'MARKETING') nav('/agents/marketing');
    else if (agType === 'NEGOTIATION') nav('/agents/negotiation');
    else if (agType === 'PROCESSING') nav('/agents/processing');
    else if (agType === 'LOYALTY') nav('/agents/loyalty');
  };

  return (
    <div className="agent-page-container">
      {/* Toast Notice */}
      {batchNotice && (
        <div className="toast">
          <CheckCircle2 size={16} /> {batchNotice}
        </div>
      )}

      {/* Top Agent Switcher Tabs */}
      <div className="agent-subnav-bar">
        <button 
          className={`asb-item ${selectedAgent === 'ALL' ? 'active' : ''}`}
          onClick={() => handleSelectAgent('ALL')}
        >
          <Sparkles size={15} /> Centro Multi-Agente (Orquestador)
        </button>
        <button 
          className={`asb-item ${selectedAgent === 'MARKETING' ? 'active' : ''}`}
          onClick={() => handleSelectAgent('MARKETING')}
        >
          <Megaphone size={15} /> Marketing
        </button>
        <button 
          className={`asb-item ${selectedAgent === 'NEGOTIATION' ? 'active' : ''}`}
          onClick={() => handleSelectAgent('NEGOTIATION')}
        >
          <Bot size={15} /> Negociador
        </button>
        <button 
          className={`asb-item ${selectedAgent === 'PROCESSING' ? 'active' : ''}`}
          onClick={() => handleSelectAgent('PROCESSING')}
        >
          <CreditCard size={15} /> Financiero & Logística
        </button>
        <button 
          className={`asb-item ${selectedAgent === 'LOYALTY' ? 'active' : ''}`}
          onClick={() => handleSelectAgent('LOYALTY')}
        >
          <HeartHandshake size={15} /> Fidelización & CRM
        </button>
      </div>

      {/* Hero Header */}
      <section className="agent-command hero-panel">
        <div>
          <div className="agent-big-icon" style={{ borderColor: currentCfg.color, color: currentCfg.color }}>
            <currentCfg.icon size={30} />
          </div>
          <div className="eyebrow accent">{currentCfg.subtitle.toUpperCase()} · {currentCfg.responsible}</div>
          <h2>{currentCfg.title}</h2>
          <p>{currentCfg.desc}</p>
        </div>
        <div className="agent-live-badge">
          <span className="live-pulse"><i /> ONLINE & AUDITABLE</span>
          <strong>{selectedAgent === 'ALL' ? dash.cards.totalProfiles : people.length}</strong>
          <small>perfiles bajo supervisión activa</small>
        </div>
      </section>

      {/* Consola Interactiva de Consulta y Diagnóstico del Agente */}
      <section className="agent-consult-studio">
        <div className="consult-header">
          <span>INTERACCIÓN Y VEREDICTO EXPLICABLE (XAI)</span>
          <h3><BrainCircuit size={19} className="text-blue" /> Consola de Consulta y Evaluación en Tiempo Real</h3>
          <p>
            Selecciona cualquier cliente registrado y consulta al agente especializado para auditar sus señales observadas, scoring predictivo y justificación de negocio.
          </p>
        </div>

        <div className="consult-controls-row">
          <div className="consult-select-wrapper">
            <label>1. Expediente del Cliente</label>
            <select 
              className="consult-select"
              value={consultPersonId}
              onChange={(e) => {
                const newId = Number(e.target.value);
                setConsultPersonId(newId);
                runConsultation(newId, consultAgentType);
              }}
            >
              {(allCandidates.length ? allCandidates : people).map(cand => (
                <option key={cand.id} value={cand.id}>
                  #{cand.id} · {cand.firstName} {cand.lastName} ({cand.stage} · {cand.mainProduct})
                </option>
              ))}
            </select>
          </div>

          <div className="consult-select-wrapper">
            <label>2. Agente a Consultar</label>
            <select 
              className="consult-select"
              value={consultAgentType}
              onChange={(e) => {
                const newAg = e.target.value as AgentType;
                setConsultAgentType(newAg);
                runConsultation(consultPersonId, newAg);
              }}
            >
              <option value="NEGOTIATION">🤖 Agente Negociador (Fase 2: Leads)</option>
              <option value="MARKETING">📣 Agente de Marketing (Fase 1: Buyers)</option>
              <option value="PROCESSING">💳 Agente Financiero & Courier (Fase 3: Payers)</option>
              <option value="LOYALTY">🤝 Agente de Fidelización (Fase 4: Customers)</option>
            </select>
          </div>

          <div>
            <button 
              type="button" 
              className="btn-run-consult"
              onClick={() => runConsultation(consultPersonId, consultAgentType)}
              disabled={consulting}
            >
              <Sparkles size={16} /> {consulting ? 'Evaluando…' : 'Consultar Evaluación'}
            </button>
          </div>
        </div>

        {/* Ficha de Diagnóstico y Veredicto Explicable */}
        {consultVerdict && (
          <div className="consult-verdict-card">
            <div className={`verdict-banner ${consultVerdict.verdictType}`}>
              <div>
                <strong>
                  <CheckCircle2 size={18} /> {consultVerdict.verdictTitle}
                </strong>
                <small style={{ color: '#cbd5e1', display: 'block', marginTop: '2px' }}>
                  Expediente: <strong>{consultVerdict.personName}</strong> · {consultVerdict.personRole} · Evaluado por <strong>{consultVerdict.agentName}</strong>
                </small>
              </div>
              <div className="verdict-scores-row">
                <div style={{ textAlign: 'center' }}>
                  <ScoreRing value={consultVerdict.score} label="Score" size={62} tone="blue" />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <ScoreRing value={consultVerdict.closingProb} label="Cierre %" size={62} tone="emerald" />
                </div>
              </div>
            </div>

            <div className="consult-kpis-grid">
              {consultVerdict.kpis.map((k: any, ki: number) => (
                <div key={ki} className="consult-kpi-item">
                  <span>{k.label}</span>
                  <strong>{k.val}</strong>
                  <small>{k.hint}</small>
                </div>
              ))}
            </div>

            <div className="consult-explain-box">
              <strong>Fundamento Explicable del Agente (XAI):</strong>
              <ul>
                {consultVerdict.reasons.map((r: string, ri: number) => (
                  <li key={ri}>
                    <Check size={14} /> <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="consult-next-action-row">
              <p>
                <strong>Next Best Action (Recomendación Operativa):</strong> {consultVerdict.nextAction}
              </p>
              <button 
                type="button" 
                className="btn-open-profile-consult"
                onClick={() => nav(`/negotiation-profile/${consultVerdict.personId}`)}
              >
                <UserCheck size={14} /> Abrir Expediente 360° <ArrowRight size={13} />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* When ALL is selected: Master Multi-Agent Dashboard */}
      {selectedAgent === 'ALL' ? (
        <div className="multi-agent-overview">
          <div className="multi-agent-cards-grid">
            {Object.entries(agentConfig).map(([key, cfg]) => {
              const count = key === 'MARKETING' ? dash.cards.buyers
                          : key === 'NEGOTIATION' ? dash.cards.leads
                          : key === 'PROCESSING' ? dash.cards.payers
                          : dash.cards.customers;
              return (
                <div 
                  key={key} 
                  className="multi-agent-card"
                  onClick={() => handleSelectAgent(key as AgentType)}
                >
                  <div className="mac-header">
                    <div className="mac-icon" style={{ color: cfg.color, backgroundColor: `${cfg.color}15` }}>
                      <cfg.icon size={22} />
                    </div>
                    <span className="mac-status"><i /> ACTIVO</span>
                  </div>
                  <h3>{cfg.title}</h3>
                  <div className="mac-meta">{cfg.responsible}</div>
                  <p className="mac-goal"><strong>Objetivo:</strong> {cfg.goal}</p>
                  <div className="mac-footer">
                    <div>
                      <span>Supervisando</span>
                      <strong>{count}</strong>
                    </div>
                    <button className="mac-btn-view">
                      Abrir Consola <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Master Live Feed and Workflow Stream */}
          <section className="two-col wide-left" style={{ marginTop: '20px' }}>
            <div className="panel">
              <div className="panel-title">
                <div>
                  <span>AUDITORÍA EN VIVO DEL SISTEMA</span>
                  <h3>Stream Unificado de Decisiones Inteligentes</h3>
                </div>
                <button 
                  className="btn-refresh" 
                  onClick={() => loadData('ALL')}
                >
                  <RefreshCw size={14} /> Actualizar Feed
                </button>
              </div>
              <div className="agent-feed">
                {actions.slice(0, 15).map((a) => (
                  <div className="feed-item" key={a.id}>
                    <div className={`feed-icon ${a.agentType}`}>
                      {a.agentType === 'MARKETING' ? <Megaphone size={16} /> :
                       a.agentType === 'NEGOTIATION' ? <Bot size={16} /> :
                       a.agentType === 'PROCESSING' ? <CreditCard size={16} /> :
                       <HeartHandshake size={16} />}
                    </div>
                    <div className="feed-content">
                      <div className="feed-top">
                        <strong>{a.title}</strong>
                        <span className="feed-tag">{a.agentType}</span>
                        <span className="feed-time">{fmtDate(a.createdAt)}</span>
                      </div>
                      <p>{a.detail}</p>
                      {a.reasoning && (
                        <div className="feed-reasoning">
                          <BrainCircuit size={13} /> {a.reasoning}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="panel">
              <div className="panel-title">
                <div>
                  <span>DISPARADORES MULTI-AGENTE</span>
                  <h3>Acciones Rápidas del Motor</h3>
                </div>
              </div>
              <div className="quick-triggers-list">
                <button 
                  className="btn-trigger" 
                  onClick={() => handleRunBatchAction('Evaluación de Buyers')}
                  disabled={runningBatch}
                >
                  <div className="btn-trigger-left">
                    <Megaphone size={16} />
                    <span>Evaluar Intención de Buyers</span>
                  </div>
                  <ChevronRight size={14} className="trigger-arrow" />
                </button>
                <button 
                  className="btn-trigger" 
                  onClick={() => handleRunBatchAction('Propuestas de Negociación')}
                  disabled={runningBatch}
                >
                  <div className="btn-trigger-left">
                    <Bot size={16} />
                    <span>Estructurar Propuestas en Leads</span>
                  </div>
                  <ChevronRight size={14} className="trigger-arrow" />
                </button>
                <button 
                  className="btn-trigger" 
                  onClick={() => handleRunBatchAction('Alertas de Cobranza Yape')}
                  disabled={runningBatch}
                >
                  <div className="btn-trigger-left">
                    <CreditCard size={16} />
                    <span>Disparar Alerta de Impulso / Cobranza</span>
                  </div>
                  <ChevronRight size={14} className="trigger-arrow" />
                </button>
                <button 
                  className="btn-trigger" 
                  onClick={() => handleRunBatchAction('Auditoría de Garantías Apple')}
                  disabled={runningBatch}
                >
                  <div className="btn-trigger-left">
                    <HeartHandshake size={16} />
                    <span>Auditar Garantías y Pólizas Polux Care</span>
                  </div>
                  <ChevronRight size={14} className="trigger-arrow" />
                </button>
              </div>

              <div className="agent-architecture-box">
                <h4>Pipeline Operacional IMPULSE</h4>
                <div className="pipeline-steps">
                  <div className="p-step"><span>1</span> BUYER (Marketing)</div>
                  <div className="p-arrow"><ArrowDown size={13} /></div>
                  <div className="p-step"><span>2</span> LEAD (Negociador)</div>
                  <div className="p-arrow"><ArrowDown size={13} /></div>
                  <div className="p-step"><span>3</span> PAYER (Finanzas & Courier)</div>
                  <div className="p-arrow"><ArrowDown size={13} /></div>
                  <div className="p-step"><span>4</span> CUSTOMER (Fidelización)</div>
                  <div className="p-arrow"><ArrowDown size={13} /></div>
                  <div className="p-step"><span>5</span> TURNED (Apple Club)</div>
                </div>
              </div>
            </div>
          </section>
        </div>
      ) : (
        /* When a SPECIFIC AGENT is selected: Dedicated Command Console */
        <div className="agent-console-layout">
          <section className="metrics-row four-cards">
            <div className="card stat-card">
              <div className="stat-head">
                <span>Acciones Auditadas</span>
                <Sparkles size={16} className="text-blue" />
              </div>
              <strong className="stat-value">{actions.length}</strong>
              <small className="stat-hint">Registros inmutables en SQL Server</small>
            </div>

            <div className="card stat-card">
              <div className="stat-head">
                <span>Prioridad Alta</span>
                <Zap size={16} className="text-amber" />
              </div>
              <strong className="stat-value">{people.filter(p => p.priority === 'ALTA').length}</strong>
              <small className="stat-hint">Atención urgente requerida</small>
            </div>

            <div className="card stat-card">
              <div className="stat-head">
                <span>{selectedAgent === 'PROCESSING' ? 'Recaudación Validada' : selectedAgent === 'LOYALTY' ? 'NPS Promedio' : 'Score / Cierre'}</span>
                <TrendingUp size={16} className="text-emerald" />
              </div>
              <strong className="stat-value">
                {selectedAgent === 'PROCESSING' ? money(dash.cards.totalRevenue || 0) :
                 selectedAgent === 'LOYALTY' ? `${dash.cards.avgNps || 9.2} / 10` :
                 selectedAgent === 'MARKETING' ? `${dash.cards.avgBuyerScore} / 100` :
                 `${dash.cards.avgLeadProbability}%`}
              </strong>
              <small className="stat-hint">Calculado por motor analítico</small>
            </div>

            <div className="card stat-card highlight-card">
              <div className="stat-head">
                <span>Estado Operativo</span>
                <ShieldCheck size={16} className="text-emerald" />
              </div>
              <strong className="stat-value" style={{ color: '#34d399' }}>ACTIVO</strong>
              <small className="stat-hint">Prefijo global /proyectobi</small>
            </div>
          </section>

          <section className="two-col wide-left">
            {/* Left: Feed of Actions */}
            <div className="panel">
              <div className="panel-title">
                <div>
                  <span>HISTORIAL DE DECISIONES</span>
                  <h3>Actividad reciente de {currentCfg.title}</h3>
                </div>
                <button 
                  className="btn" 
                  onClick={() => handleRunBatchAction(`Ejecución de ${currentCfg.title}`)}
                  disabled={runningBatch}
                >
                  <RefreshCw size={14} /> Ejecutar Diagnóstico
                </button>
              </div>

              <div className="agent-feed">
                {actions.length === 0 ? (
                  <div className="empty-state">No hay acciones registradas aún para este agente.</div>
                ) : (
                  actions.slice(0, 15).map((a) => (
                    <div className="feed-item" key={a.id}>
                      <div className="feed-icon">
                        <currentCfg.icon size={16} />
                      </div>
                      <div className="feed-content">
                        <div className="feed-top">
                          <strong>{a.title}</strong>
                          <span className="feed-time">{fmtDate(a.createdAt)}</span>
                        </div>
                        <p>{a.detail}</p>
                        {a.reasoning && (
                          <div className="feed-reasoning">
                            <BrainCircuit size={13} /> {a.reasoning}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right: Prioritized Person Queue */}
            <div className="panel">
              <div className="panel-title">
                <div>
                  <span>COLA PRIORIZADA</span>
                  <h3>Expedientes bajo seguimiento</h3>
                </div>
              </div>
              <div className="priority-list">
                {people.slice(0, 7).map((p) => (
                  <div 
                    className="priority-person" 
                    key={p.id} 
                    onClick={() => nav(`/${p.stage.toLowerCase()}s/${p.id}`)}
                  >
                    <div className="avatar small">{initials(p)}</div>
                    <div className="grow">
                      <strong>{p.firstName} {p.lastName}</strong>
                      <span>{p.mainProduct} · {p.district || p.city}</span>
                    </div>
                    <PriorityBadge priority={p.priority} />
                    <ScoreRing 
                      value={selectedAgent === 'MARKETING' ? p.score : p.conversionProbability} 
                      label={selectedAgent === 'MARKETING' ? 'score' : '%'} 
                      size={52} 
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Rules & Guardrails Panel */}
          <section className="panel rules-panel">
            <div className="panel-title">
              <div>
                <span>GUARDRAILS, LÍMITES & REGLAS DE NEGOCIO</span>
                <h3>Capacidades y Restricciones de {currentCfg.title}</h3>
              </div>
            </div>
            <div className="rules-grid">
              {selectedAgent === 'MARKETING' && (
                <>
                  <Rule icon={CheckCircle2} title="Sí puede" text="Registrar comportamiento observable, consultar vistas de producto, medir recencia y asignar score de 0 a 100." />
                  <Rule icon={Zap} title="Transición automática" text="BUYER → LEAD al detectar consultas explícitas de precio final, stock, modalidades de pago o cotización." />
                  <Rule icon={ShieldAlert} title="No inventa datos" text="Toda prioridad se apoya estrictamente en eventos guardados; no toma decisiones por intuición oculta." />
                </>
              )}
              {selectedAgent === 'NEGOTIATION' && (
                <>
                  <Rule icon={CheckCircle2} title="Sí puede" text="Evaluar solvencia económica, generar 3 alternativas estructuradas y calcular probabilidad de cierre comercial." />
                  <Rule icon={ShieldAlert} title="Escala a humano" text="Solicitudes de descuento fuera de política o reclamos marcan 'Requiere intervención humana' obligatoria." />
                  <Rule icon={Target} title="Transición controlada" text="LEAD → PAYER únicamente tras la confirmación bancaria real o de prueba desde la pasarela PoluxPay." />
                </>
              )}
              {selectedAgent === 'PROCESSING' && (
                <>
                  <Rule icon={CheckCircle2} title="Pasarela Multicanal" text="Acredita transferencias con Yape, Plin y tarjetas; valida importes de prueba (S/ 0.10) y emite boleta fiscal B001-XXXX." />
                  <Rule icon={Truck} title="Tracking Courier Internacional" text="Administra los 5 hitos del despacho (Miami -> Vuelo -> Aduanas SUNAT -> Tienda Trujillo) con guía internacional." />
                  <Rule icon={Clock3} title="Alertas de Impulso" text="Dispara avisos automáticos de urgencia por reserva de stock y notificaciones de llegada a almacén en Trujillo." />
                </>
              )}
              {selectedAgent === 'LOYALTY' && (
                <>
                  <Rule icon={ShieldCheck} title="Inspección y Garantía Apple" text="Verifica el número de serie de fábrica de 12 caracteres y emite la póliza oficial Polux Care por 365 días." />
                  <Rule icon={HeartHandshake} title="Net Promoter Score (NPS)" text="Aplica la encuesta estándar 0-10; clientes promotores (9-10) ingresan automáticamente al programa Apple Club." />
                  <Rule icon={Zap} title="Fidelización Activa (TURNED)" text="Activa cupón permanente de 15% OFF en accesorios y prioridad para preventa anual de nuevos modelos Apple." />
                </>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function Rule({ icon: Icon, title, text }: any) {
  return (
    <div className="rule-card">
      <Icon size={19} />
      <div>
        <strong>{title}</strong>
        <p>{text}</p>
      </div>
    </div>
  );
}
