import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  AlertTriangle, ArrowLeft, Bot, CheckCircle2, Clock3, CreditCard, 
  FileText, HeartHandshake, Mail, MapPin, MessageCircle, MousePointerClick, 
  PackageCheck, Phone, RefreshCw, ShieldCheck, Sparkles, Star, Truck, 
  WalletCards, Send, GraduationCap, Briefcase, Search, UserCheck, 
  ChevronRight, Calendar, DollarSign
} from 'lucide-react';
import { api, fmtDate, initials, money, Person } from '../lib/api';
import { PriorityBadge, ScoreRing, StageBadge } from '../components/Ui';
import PaymentGatewayModal from '../components/PaymentGatewayModal';

interface Props {
  defaultToLead?: boolean;
}

export default function PersonDetail({ defaultToLead = false }: Props) {
  const { id } = useParams();
  const nav = useNavigate();
  const [p, setP] = useState<Person>();
  const [busy, setBusy] = useState('');
  const [proposal, setProposal] = useState<any>();
  const [toast, setToast] = useState('');
  const [question, setQuestion] = useState('');
  const [chat, setChat] = useState<{ role: 'user' | 'agent'; text: string }[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Buscador en vivo de perfiles de negociación
  const [searchQuery, setSearchQuery] = useState('');
  const [allPeople, setAllPeople] = useState<Person[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Carga inicial de perfiles disponibles para búsqueda rápida
  useEffect(() => {
    api.people().then(res => setAllPeople(res || [])).catch(() => {});
  }, []);

  const load = async () => {
    if (id) {
      const data = await api.person(Number(id));
      setP(data);
    } else {
      // Si entra a /negotiation-profile sin ID, carga por defecto el lead "Diego Ramírez" (o el primer lead)
      const leads = await api.people('LEAD');
      const target = leads.find(l => l.firstName.toLowerCase().includes('diego')) || leads[0];
      if (target) {
        setP(target);
      } else {
        const anyP = await api.people();
        if (anyP?.[0]) setP(anyP[0]);
      }
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const act = async (label: string, fn: () => Promise<any>) => {
    setBusy(label);
    try {
      const r = await fn();
      if (r?.proposals) {
        setProposal(r);
        await load();
      } else {
        setP(r);
      }
      setToast(label);
      setTimeout(() => setToast(''), 2500);
    } finally {
      setBusy('');
    }
  };

  const ask = async () => {
    const q = question.trim();
    if (!q || !p) return;
    setQuestion('');
    setChat(c => [...c, { role: 'user', text: q }]);
    const r = await api.askAgent(p.id, q);
    setChat(c => [...c, { role: 'agent', text: r.answer }]);
  };

  const behavior = useMemo(() => {
    if (!p) return null;
    const ints = p.interactions || [];
    const count = (k: string) => ints.filter(i => i.kind === k).length;
    return {
      views: p.productViews?.length || 0,
      interactions: ints.length,
      price: count('PRICE_FINAL'),
      stock: count('STOCK_QUERY'),
      pay: count('PAYMENT_QUERY'),
      delivery: count('DELIVERY_QUERY'),
      quotes: p.quotes?.length || 0,
    };
  }, [p]);

  const filteredPeople = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return allPeople.filter(
      item =>
        item.firstName.toLowerCase().includes(q) ||
        item.lastName.toLowerCase().includes(q) ||
        item.documentNumber?.includes(q) ||
        item.mainProduct.toLowerCase().includes(q)
    ).slice(0, 5);
  }, [searchQuery, allPeople]);

  const handleSelectPerson = (selected: Person) => {
    setP(selected);
    setSearchQuery('');
    setIsSearchFocused(false);
    nav(`/${selected.stage.toLowerCase()}s/${selected.id}`);
  };

  if (!p) return <div className="skeleton-page">Abriendo perfil 360° de negociación…</div>;

  const isBuyer = p.stage === 'BUYER';
  const isLead = p.stage === 'LEAD';
  const isPayer = p.stage === 'PAYER';
  const isCustomer = ['CUSTOMER', 'TURNED'].includes(p.stage);
  const backRoute = isBuyer ? '/buyers' : isLead ? '/leads' : isPayer ? '/payers' : '/customers';
  const backLabel = isBuyer ? 'BUYERS' : isLead ? 'LEADS' : isPayer ? 'PAYERS' : 'CUSTOMERS';

  return (
    <div className="page-layout">
      {toast && (
        <div className="toast">
          <CheckCircle2 size={17} /> {toast}
        </div>
      )}

      {showPaymentModal && (
        <PaymentGatewayModal
          person={p}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={upd => {
            setP(upd);
            setShowPaymentModal(false);
            setToast('¡Pago validado con éxito!');
            setTimeout(() => setToast(''), 2500);
          }}
        />
      )}

      {/* Barra de Búsqueda Rápida del Perfil de Negociación */}
      <section className="card search-negotiation-card">
        <div className="search-negotiation-header">
          <div>
            <span className="eyebrow text-blue">SISTEMA TRANSACCIONAL POLUX · FASE LEADS</span>
            <h3>Buscador en Vivo de Perfil de Negociación</h3>
            <p>Escribe el nombre o documento del cliente para cargar su expediente 360° al instante.</p>
          </div>
          <div className="quick-lead-chips">
            <span className="chip-label">Ejemplos del informe:</span>
            <button 
              className="chip-btn" 
              onClick={() => {
                const target = allPeople.find(x => x.firstName.toLowerCase().includes('diego'));
                if (target) handleSelectPerson(target);
              }}
            >
              <UserCheck size={13} /> Diego Ramírez (Lead · Caso 4.2)
            </button>
            <button 
              className="chip-btn" 
              onClick={() => {
                const target = allPeople.find(x => x.stage === 'PAYER');
                if (target) handleSelectPerson(target);
              }}
            >
              <Truck size={13} /> Carlos Salazar (Payer)
            </button>
            <button 
              className="chip-btn" 
              onClick={() => {
                const target = allPeople.find(x => x.stage === 'CUSTOMER');
                if (target) handleSelectPerson(target);
              }}
            >
              <HeartHandshake size={13} /> Mateo Núñez (Customer)
            </button>
          </div>
        </div>

        <div className="search-input-box-wrapper">
          <Search size={18} className="search-icon-inside" />
          <input
            type="text"
            className="input-search-negotiation"
            placeholder="Escribe un nombre (ej. Diego Ramírez) o DNI..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
          />
          {filteredPeople.length > 0 && isSearchFocused && (
            <div className="search-autocomplete-dropdown">
              {filteredPeople.map(item => (
                <div 
                  key={item.id} 
                  className="autocomplete-item"
                  onMouseDown={() => handleSelectPerson(item)}
                >
                  <div className="avatar-circle-sm">{initials(item)}</div>
                  <div className="grow">
                    <strong>{item.firstName} {item.lastName}</strong>
                    <span>{item.mainProduct} · {item.district || item.city} · {item.documentNumber}</span>
                  </div>
                  <StageBadge stage={item.stage} />
                  <PriorityBadge priority={item.priority} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Botón de retorno al embudo */}
      <div className="back-navigation-row">
        <button className="back-btn" onClick={() => nav(backRoute)}>
          <ArrowLeft size={16} /> Volver a lista de {backLabel}
        </button>
        <span className="profile-id-tag">ID Transaccional: #{p.id} · Estado: {p.stage}</span>
      </div>

      {/* Hero Header del Perfil 360° */}
      <section className="profile-hero panel">
        <div className="profile-main">
          <div className="avatar xl">{initials(p)}</div>
          <div>
            <div className="profile-tags">
              <StageBadge stage={p.stage} />
              <PriorityBadge priority={p.priority} />
              {p.humanInterventionRequired && (
                <span className="human-chip">
                  <AlertTriangle size={13} /> Requiere humano
                </span>
              )}
            </div>
            <h2>{p.firstName} {p.lastName}</h2>
            <p>{p.occupation || 'Sin ocupación registrada'} · {p.district || p.city}, Trujillo</p>
            <div className="contact-row">
              <span><Mail size={14} />{p.email}</span>
              <span><Phone size={14} />{p.phone}</span>
              <span><MessageCircle size={14} />{p.preferredChannel}</span>
              <span><MapPin size={14} />{p.documentType || 'DNI'}: {p.documentNumber || '—'}</span>
            </div>
          </div>
        </div>
        <div className="hero-scores">
          <ScoreRing value={p.score} label="score" />
          <ScoreRing value={p.conversionProbability} label="cierre %" />
        </div>
      </section>

      {/* Cuerpo del Perfil en 2 Columnas */}
      <section className="profile-layout">
        <div className="profile-left">
          
          {/* 1. Datos Personales y de Identidad */}
          <div className="panel">
            <div className="panel-title">
              <div>
                <span className="section-category-tag">REQUERIMIENTO INFORME · SECCIÓN 1</span>
                <h3>1. Datos Personales y Ubicación en Trujillo</h3>
              </div>
            </div>
            <div className="info-grid">
              <Info label="Nombres y Apellidos" value={`${p.firstName} ${p.lastName}`} />
              <Info label="Edad / Rango" value={`${p.age} años`} />
              <Info label="Género" value={p.gender || 'Hombre'} />
              <Info label="Documento Identidad" value={`${p.documentType || 'DNI'}: ${p.documentNumber || '—'}`} />
              <Info label="Teléfono WhatsApp" value={p.phone} />
              <Info label="Correo Electrónico" value={p.email} />
              <Info label="Provincia" value={p.province || 'Trujillo'} />
              <Info label="Distrito" value={p.district || 'Trujillo Centro'} />
              <Info label="Dirección Exacta" value={p.address || 'Av. Larco 1340, California'} />
              <Info label="Canal Preferido" value={p.preferredChannel || 'WhatsApp'} />
              <Info label="Origen del Contacto" value={p.acquisitionSource || 'Instagram'} />
              <Info label="Campaña Marketing" value={p.campaignName || 'iPhone 16 Pro — Jóvenes Tech'} />
            </div>
          </div>

          {/* 2. Datos de Estudiante / Perfil Académico (Requerimiento Explícito) */}
          <div className="panel student-panel-highlight">
            <div className="panel-title">
              <div className="title-with-icon">
                <GraduationCap size={20} className="text-blue" />
                <div>
                  <span className="section-category-tag">REQUERIMIENTO INFORME · SECCIÓN 2</span>
                  <h3>2. Datos de Estudiante y Formación Académica</h3>
                </div>
              </div>
              <span className="badge-academic">Pregrado / Superior</span>
            </div>
            <div className="info-grid">
              <Info label="Universidad / Instituto" value={p.university || 'Universidad Nacional de Trujillo (UNT)'} />
              <Info label="Especialidad / Carrera" value={p.career || 'Ingeniería de Sistemas'} />
              <Info label="Nivel Académico" value="Pregrado · 8vo Ciclo" />
              <Info label="Condición" value="Estudiante Universitario Activo" />
              <Info label="Rol en la Compra" value={p.decisionRole || 'Comprador directo y usuario final'} />
              <Info label="Convenio Institucional" value="Aplica Tarifa Universitaria Apple" />
            </div>
          </div>

          {/* 3. Datos Laborales y Situación Económica */}
          <div className="panel">
            <div className="panel-title">
              <div className="title-with-icon">
                <Briefcase size={20} className="text-purple" />
                <div>
                  <span className="section-category-tag">REQUERIMIENTO INFORME · SECCIÓN 3</span>
                  <h3>3. Datos Laborales y Solvencia Económica</h3>
                </div>
              </div>
            </div>
            <div className="info-grid">
              <Info label="Ocupación Principal" value={p.occupation || 'Ingeniero de Sistemas / Dev'} />
              <Info label="Empresa / Centro Laboral" value={p.company || 'TechNova SAC'} />
              <Info label="Disponibilidad Laboral" value="Tiempo Completo" />
              <Info label="Rango de Ingreso Mensual" value={`${money(p.monthlyIncomeMin)} – ${money(p.monthlyIncomeMax)}`} />
              <Info label="Nivel Socioeconómico (NSE)" value={`Nivel ${p.socioeconomicLevel || 'B'}`} />
              <Info label="Sensibilidad al Precio" value={p.priceSensitivity || 'Media'} />
            </div>
          </div>

          {/* 4. Gustos, Preferencias y Necesidad de Compra */}
          <div className="panel">
            <div className="panel-title">
              <div>
                <span className="section-category-tag">REQUERIMIENTO INFORME · SECCIÓN 4</span>
                <h3>4. Gustos, Preferencias e Interés de Compra Apple</h3>
              </div>
            </div>
            <div className="product-focus">
              <div className="product-icon"><Sparkles size={24} /></div>
              <div>
                <span>Producto Principal a Importar</span>
                <strong>{p.mainProduct}</strong>
                <small>{p.secondaryProducts?.join(' · ') || 'AirPods Pro 2 · Funda MagSafe'}</small>
              </div>
            </div>
            <div className="info-grid">
              <Info label="Dispositivo Actual" value={p.currentDevice || 'iPhone 11 128GB'} />
              <Info label="Presupuesto Declarado" value={`${money(p.budgetMin)} – ${money(p.budgetMax)}`} />
              <Info label="Modalidad de Pago Preferida" value={p.paymentPreference || '3 cuotas sin intereses'} />
              <Info label="Preocupación Principal" value="Autenticidad original de fábrica y garantía local" />
              <Info label="Plazo de Entrega Deseado" value="7 a 10 días calendario en Trujillo" />
              <Info label="Uso Previsto del Equipo" value="Productividad laboral y fotografía" />
            </div>
            <div className="tag-cloud">
              <span className="tag-label">Intereses y afinidades:</span>
              {(p.interests || ['tecnología', 'fotografía', 'productividad', 'apple']).map(x => (
                <span key={x} className="interest-pill">#{x}</span>
              ))}
            </div>
          </div>

          {/* 5. Cotización Preferencial Activa (Fase LEADS) */}
          <div className="panel quote-card-negotiation">
            <div className="panel-title">
              <div>
                <span className="section-category-tag">INSTRUMENTO COMERCIAL</span>
                <h3>5. Cotización Preferencial y Vigencia</h3>
              </div>
              <span className={`status-badge-pill ${p.quoteActive ? 'active' : 'inactive'}`}>
                {p.quoteActive ? '• Cotización Activa' : 'Sin Cotización'}
              </span>
            </div>
            {p.quotes?.[0] ? (
              <div className="quote-negotiation-body">
                <div className="quote-main-data">
                  <span className="quote-code-tag">{p.quotes[0].code}</span>
                  <div className="quote-total-val">{money(Number(p.quotes[0].amount))}</div>
                  <p className="quote-prod-name">{p.quotes[0].product}</p>
                </div>
                <div className="quote-validity-meter">
                  <div className="meter-head">
                    <span>Vigencia de 7 días (Regla Comercial):</span>
                    <strong>3 días transcurridos · 4 días restantes</strong>
                  </div>
                  <div className="meter-track">
                    <div className="meter-fill" style={{ width: '43%' }} />
                  </div>
                  <div className="meter-dates">
                    <small>Emitida: {fmtDate(p.quoteStartDate || p.quotes[0].createdAt)}</small>
                    <small>Vence: {fmtDate(p.quoteEndDate || p.quotes[0].expiresAt)}</small>
                  </div>
                </div>
              </div>
            ) : (
              <p className="muted py-4">No se registra cotización formal activa para este perfil.</p>
            )}
          </div>

          {/* 6. Señales Observables del Algoritmo de Scoring */}
          <div className="panel">
            <div className="panel-title">
              <div>
                <span>SEÑALES DE COMPORTAMIENTO OBSERVABLE</span>
                <h3>Métricas de Interés Cuantificado para la Negociación</h3>
              </div>
            </div>
            <div className="behavior-grid">
              <Signal icon={MousePointerClick} label="Vistas de producto" value={behavior?.views || 12} />
              <Signal icon={MessageCircle} label="Interacciones registradas" value={behavior?.interactions || 8} />
              <Signal icon={WalletCards} label="Consultas de precio/cuotas" value={(behavior?.price || 3) + (behavior?.pay || 2)} />
              <Signal icon={FileText} label="Cotizaciones generadas" value={behavior?.quotes || 1} />
            </div>
            <div className="signal-bars">
              <BarSignal label="Consultas de precio final" value={behavior?.price || 3} max={4} />
              <BarSignal label="Consultas de stock disponible" value={behavior?.stock || 2} max={4} />
              <BarSignal label="Consultas de cuotas y pasarela" value={behavior?.pay || 2} max={4} />
              <BarSignal label="Consultas de entrega en Trujillo" value={behavior?.delivery || 1} max={4} />
            </div>
          </div>

          {/* 7. Historial y Trazabilidad Auditable */}
          <div className="panel">
            <div className="panel-title">
              <div>
                <span>TRAZABILIDAD AUDITABLE EN SQL SERVER</span>
                <h3>Historial Cronológico de Conversaciones y Eventos</h3>
              </div>
            </div>
            <div className="timeline">
              {(p.interactions || []).slice(0, 12).map(i => (
                <div className="timeline-item" key={i.id}>
                  <div className="timeline-dot" />
                  <div>
                    <div>
                      <strong>{humanKind(i.kind)}</strong>
                      <span>{i.channel}</span>
                    </div>
                    <p>{i.content}</p>
                    <small>{fmtDate(i.createdAt)} · +{i.intentPoints} pts de intención</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Columna Derecha: Consola del Agente Negociador */}
        <aside className="profile-right">
          <div className="agent-card sticky">
            <div className="agent-header">
              <div className="agent-icon"><Bot size={23} /></div>
              <div>
                <span>{isBuyer ? 'MARKETING AGENT' : isLead ? 'NEGOTIATION AGENT' : isPayer ? 'PROCESSING AGENT' : 'LOYALTY AGENT'}</span>
                <strong>Polux Engine · Inteligencia Comercial</strong>
              </div>
              <div className="live-chip"><i /> ACTIVO</div>
            </div>

            <div className="agent-analysis">
              <span>Diagnóstico del Motor de Reglas</span>
              <p>{p.agentSummary || 'Lead de alta intención clasificado con prioridad comercial para cierre de importación.'}</p>
            </div>

            <div className="next-action">
              <span>Siguiente Mejor Acción Recomendada</span>
              <p>{p.nextBestAction || 'Presentar 3 alternativas de financiamiento en cuotas y facilitar enlace a pasarela PoluxPay.'}</p>
            </div>

            {p.humanInterventionRequired && (
              <div className="human-alert">
                <AlertTriangle size={18} />
                <div>
                  <strong>Escalamiento humano requerido</strong>
                  <span>El caso excede las reglas automáticas y requiere aprobación gerencial.</span>
                </div>
              </div>
            )}

            <div className="agent-explain">
              <span>Fundamento de Negocio Explicable</span>
              <ul>
                {explain(p, behavior).map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            </div>

            {/* Asistente Copilot Conversacional */}
            <div className="copilot-box">
              <div className="copilot-title">
                <Sparkles size={14} />
                <span>Asistente Comercial (Copilot)</span>
              </div>
              <div className="copilot-messages">
                {chat.length === 0 ? (
                  <div className="copilot-hint">
                    Pregunta: "¿Por qué tiene prioridad ALTA?", "¿Cómo negociar cuotas?" o "Escribe mensaje de WhatsApp".
                  </div>
                ) : (
                  chat.slice(-5).map((m, i) => (
                    <div key={i} className={`chat-bubble ${m.role}`}>
                      {m.text}
                    </div>
                  ))
                )}
              </div>
              <div className="copilot-input">
                <input
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') ask(); }}
                  placeholder="Consultar estrategia para este lead…"
                />
                <button onClick={ask}><Send size={14} /></button>
              </div>
            </div>

            {/* Acciones del Motor de Negociación */}
            <div className="agent-actions">
              {isLead && (
                <>
                  <button className="btn primary" disabled={!!busy} onClick={() => act('Evaluación de Negociación actualizada', () => api.negotiationEvaluate(p.id))}>
                    <RefreshCw size={16} /> Evaluar Lead
                  </button>
                  <button className="btn" disabled={!!busy} onClick={() => act('3 Alternativas comerciales generadas', () => api.proposal(p.id))}>
                    <Sparkles size={16} /> Generar 3 Alternativas
                  </button>
                  <button className="btn success" disabled={!!busy} onClick={() => setShowPaymentModal(true)}>
                    <CreditCard size={16} /> Pagar con Pasarela (Yape/Plin)
                  </button>
                  <button className="btn" disabled={!!busy} onClick={() => act('Alerta de cobranza enviada', () => api.collectionAlert(p.id))}>
                    <Clock3 size={16} /> Enviar Alerta de Cierre
                  </button>
                </>
              )}

              {isBuyer && (
                <>
                  <button className="btn primary" disabled={!!busy} onClick={() => act('Evaluación de Marketing actualizada', () => api.marketingEvaluate(p.id))}>
                    <RefreshCw size={16} /> Evaluar Buyer
                  </button>
                  <button className="btn" disabled={!!busy} onClick={() => act('Consulta de precio simulada', () => api.simulate(p.id, 'PRICE_FINAL'))}>
                    <WalletCards size={16} /> Simular Precio Final
                  </button>
                  <button className="btn" disabled={!!busy} onClick={() => act('Cotización preferencial generada', () => api.simulate(p.id, 'QUOTE_REQUEST'))}>
                    <FileText size={16} /> Solicitar Cotización
                  </button>
                </>
              )}

              {isPayer && (
                <>
                  <button className="btn primary" disabled={!!busy} onClick={() => act('Hito logístico avanzado', () => api.shippingAdvance(p.id))}>
                    <Truck size={16} /> Avanzar Hito Logístico
                  </button>
                  <button className="btn success" onClick={() => nav(`/customers?deliverId=${p.id}`)}>
                    <PackageCheck size={16} /> Registrar Entrega en Trujillo
                  </button>
                </>
              )}

              {isCustomer && (
                <>
                  <button className="btn primary" onClick={() => nav('/customers')}>
                    <HeartHandshake size={16} /> Ver en Módulo CRM
                  </button>
                  <button className="btn" disabled={!!busy} onClick={() => act('Encuesta NPS 10/10 registrada', () => api.submitNps(p.id, { score: 10, feedback: 'Excelente atención y producto 100% original.' }))}>
                    <Star size={16} /> Calificar NPS 10/10 (Apple Club)
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Panel de las 3 Alternativas de Negociación */}
          {proposal && (
            <div className="panel proposal-card">
              <div className="panel-title">
                <div>
                  <span>PROPUESTA COMERCIAL ESTRUCTURADA</span>
                  <h3>3 Alternativas de Cierre</h3>
                </div>
              </div>
              {proposal.proposals.map((x: any) => (
                <div className="proposal-option" key={x.label}>
                  <strong>{x.label}</strong>
                  <span>{money(x.amount)} · {x.payment}</span>
                  <p>{x.note}</p>
                </div>
              ))}
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="info-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Signal({ icon: Icon, label, value }: any) {
  return (
    <div className="signal-card">
      <Icon size={17} />
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

function BarSignal({ label, value, max }: any) {
  return (
    <div className="bar-signal">
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <div className="bar-track">
        <i style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
      </div>
    </div>
  );
}

function humanKind(k: string) {
  return (
    ({
      FORM_SUBMIT: 'Formulario de contacto completado',
      CONTENT_INTERACTION: 'Interacción con reel/anuncio',
      GUARANTEE_QUERY: 'Consulta sobre garantía Apple',
      PRODUCT_VIEW: 'Visualización de catálogo de producto',
      PRICE_FINAL: 'Consulta explícita de precio final',
      PAYMENT_QUERY: 'Consulta sobre modalidades de pago',
      STOCK_QUERY: 'Consulta de stock en almacén Miami',
      DELIVERY_QUERY: 'Consulta de tiempo de entrega en Trujillo',
      QUOTE_REQUEST: 'Solicitud de cotización preferencial',
      SPECIAL_DISCOUNT: 'Consulta de descuento institucional',
      COMPLAINT: 'Reclamo / Observación comercial',
      PAYMENT_CONFIRMED: 'Confirmación de pago en pasarela',
      LOGISTICS_UPDATE: 'Actualización de hito courier',
      COLLECTION_ALERT: 'Alerta de cobranza y cierre',
      SERVICE_DELIVERED: 'Entrega en sede Trujillo y póliza activa',
      NPS_SURVEY: 'Encuesta NPS registrada',
      SUPPORT_TICKET: 'Ticket postventa registrado',
    } as any)[k] || k.replace(/_/g, ' ')
  );
}

function explain(p: Person, b: any) {
  const xs = [];
  if ((b?.views || 0) >= 6) xs.push(`${b.views} vistas de catálogo demuestran interés recurrente.`);
  if ((b?.price || 0) > 0) xs.push(`${b.price} consulta(s) sobre precio final con IGV.`);
  if ((b?.pay || 0) > 0) xs.push(`${b.pay} consulta(s) sobre financiamiento en cuotas.`);
  if (p.quoteActive) xs.push('Mantiene cotización preferencial POLUX-2026 activa.');
  if (p.stage === 'LEAD') xs.push(`Probabilidad estimada de cierre: ${p.conversionProbability}%.`);
  if (p.stage === 'PAYER') xs.push(`Pago validado. Guía courier: ${p.courierTrackingCode || 'Asignada'}.`);
  if (p.stage === 'CUSTOMER') xs.push(`Póliza Apple de 365 días activa: ${p.warrantyCode || 'Vigente'}.`);
  if (!xs.length) xs.push('Actividad inicial registrada; en seguimiento comercial.');
  return xs.slice(0, 4);
}
