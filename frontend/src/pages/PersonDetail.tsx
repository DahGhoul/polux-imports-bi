import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Bot, CheckCircle2, Clock3, CreditCard, FileText, HeartHandshake, Mail, MapPin, MessageCircle, MousePointerClick, PackageCheck, Phone, RefreshCw, ShieldCheck, Sparkles, Star, Truck, UserRoundCheck, WalletCards, Send } from 'lucide-react';
import { api, fmtDate, initials, money, Person } from '../lib/api';
import { PriorityBadge, ScoreRing, StageBadge } from '../components/Ui';
import PaymentGatewayModal from '../components/PaymentGatewayModal';

export default function PersonDetail(){
  const {id}=useParams(); const nav=useNavigate(); const [p,setP]=useState<Person>(); const [busy,setBusy]=useState(''); const [proposal,setProposal]=useState<any>(); const [toast,setToast]=useState(''); const [question,setQuestion]=useState(''); const [chat,setChat]=useState<{role:'user'|'agent';text:string}[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const load=()=>id&&api.person(Number(id)).then(setP);
  useEffect(()=>{load()},[id]);
  const act=async(label:string,fn:()=>Promise<any>)=>{setBusy(label);try{const r=await fn(); if(r?.proposals){setProposal(r); await load()} else setP(r); setToast(label); setTimeout(()=>setToast(''),2500)}finally{setBusy('')}};
  const ask=async()=>{const q=question.trim(); if(!q||!p)return; setQuestion(''); setChat(c=>[...c,{role:'user',text:q}]); const r=await api.askAgent(p.id,q); setChat(c=>[...c,{role:'agent',text:r.answer}]);};
  const behavior=useMemo(()=>{if(!p)return null; const ints=p.interactions||[]; const count=(k:string)=>ints.filter(i=>i.kind===k).length; return {views:p.productViews?.length||0, interactions:ints.length, price:count('PRICE_FINAL'),stock:count('STOCK_QUERY'),pay:count('PAYMENT_QUERY'),delivery:count('DELIVERY_QUERY'),quotes:p.quotes?.length||0}},[p]);
  if(!p) return <div className="skeleton-page">Abriendo perfil 360°…</div>;
  const isBuyer=p.stage==='BUYER'; const isLead=p.stage==='LEAD'; const isPayer=p.stage==='PAYER'; const isCustomer=['CUSTOMER','TURNED'].includes(p.stage);
  const backRoute = isBuyer ? '/buyers' : isLead ? '/leads' : isPayer ? '/payers' : '/customers';
  const backLabel = isBuyer ? 'BUYERS' : isLead ? 'LEADS' : isPayer ? 'PAYERS' : 'CUSTOMERS';

  return <div className="page-layout">
    {toast&&<div className="toast"><CheckCircle2 size={17}/>{toast}</div>}
    {showPaymentModal && <PaymentGatewayModal person={p} onClose={()=>setShowPaymentModal(false)} onSuccess={(upd)=>{setP(upd); setShowPaymentModal(false); setToast('¡Pago validado con éxito!'); setTimeout(()=>setToast(''),2500);}}/>}
    <button className="back-btn" onClick={()=>nav(backRoute)}><ArrowLeft size={16}/> Volver a {backLabel}</button>
    <section className="profile-hero panel">
      <div className="profile-main"><div className="avatar xl">{initials(p)}</div><div><div className="profile-tags"><StageBadge stage={p.stage}/><PriorityBadge priority={p.priority}/>{p.humanInterventionRequired&&<span className="human-chip"><AlertTriangle size={13}/> Requiere humano</span>}</div><h2>{p.firstName} {p.lastName}</h2><p>{p.occupation||'Sin ocupación registrada'} · {p.district || p.city}, Trujillo</p><div className="contact-row"><span><Mail size={14}/>{p.email}</span><span><Phone size={14}/>{p.phone}</span><span><MessageCircle size={14}/>{p.preferredChannel}</span><span><MapPin size={14}/>{p.documentType||'DNI'}: {p.documentNumber||'—'}</span></div></div></div>
      <div className="hero-scores"><ScoreRing value={p.score} label="score"/><ScoreRing value={p.conversionProbability} label="cierre %"/></div>
    </section>

    <section className="profile-layout">
      <div className="profile-left">
        <div className="panel"><div className="panel-title"><div><span>PERFIL DEMOGRÁFICO Y UBICACIÓN</span><h3>Identidad y Capacidad de Pago</h3></div></div><div className="info-grid">
          <Info label="Edad" value={`${p.age} años`}/><Info label="Género" value={p.gender || 'Hombre'}/><Info label="Doc. Identidad" value={`${p.documentType || 'DNI'}: ${p.documentNumber || '—'}`}/><Info label="Rol Decisión" value={p.decisionRole || 'Comprador directo'}/><Info label="Provincia" value={p.province || 'Trujillo'}/><Info label="Distrito" value={p.district || 'Trujillo Centro'}/><Info label="Dirección Trujillo" value={p.address || '—'}/><Info label="NSE" value={p.socioeconomicLevel}/><Info label="Ocupación" value={p.occupation||'—'}/><Info label="Empresa" value={p.company||'—'}/><Info label="Universidad" value={p.university||'—'}/><Info label="Ingreso Estimado" value={`${money(p.monthlyIncomeMin)} – ${money(p.monthlyIncomeMax)}`}/>
        </div></div>

        {/* Panel Logístico para PAYER y CUSTOMER */}
        {(isPayer || isCustomer) && (
          <div className="panel logistics-panel-box">
            <div className="panel-title"><div><span>OPERACIONES & LOGÍSTICA INTERNACIONAL</span><h3>Estado de Importación y Comprobante</h3></div></div>
            <div className="info-grid">
              <Info label="Comprobante Fiscal" value={p.receiptNumber || 'B001-PENDIENTE'}/><Info label="Monto Pagado" value={money(Number(p.paidAmount || 0))}/><Info label="Medio de Pago" value={p.paymentMethod || 'YAPE'}/><Info label="Guía Courier Internacional" value={p.courierTrackingCode || 'POLUX-US-PE-PEND'}/><Info label="Hito Logístico" value={p.shippingStage || 'MIAMI_WAREHOUSE'}/><Info label="Fecha de Pago" value={fmtDate(p.paidAt)}/>
            </div>
          </div>
        )}

        {/* Panel Postventa para CUSTOMER */}
        {isCustomer && (
          <div className="panel crm-panel-box">
            <div className="panel-title"><div><span>CRM POSTVENTA Y FIDELIZACIÓN APPLE</span><h3>Garantía Apple y Satisfacción NPS</h3></div></div>
            <div className="info-grid">
              <Info label="Serial Oficial Apple" value={p.appleSerialNumber || 'F2LWR-PEND'}/><Info label="Modalidad Entrega" value={p.deliveryType === 'STORE_PICKUP' ? 'Tienda Larco' : 'Delivery Verificado'}/><Info label="Póliza de Garantía (1 Año)" value={p.warrantyCode || 'POLUX-GAR-ACTIVA'}/><Info label="Vigencia Garantía" value={fmtDate(p.warrantyExpiresAt)}/><Info label="Calificación NPS" value={p.npsScore !== null && p.npsScore !== undefined ? `${p.npsScore}/10 (${p.npsScore>=9?'Promotor':'Pasivo'})` : 'Pendiente'}/><Info label="Programa Apple Club" value={p.loyaltyRewardActive ? 'ACTIVADO (15% OFF)' : 'Disponible'}/>
            </div>
            {p.npsFeedback && <div className="nps-feedback-box"><strong>Comentario del Cliente:</strong><p>"{p.npsFeedback}"</p></div>}
          </div>
        )}

        <div className="panel"><div className="panel-title"><div><span>NECESIDAD & DISPOSITIVOS</span><h3>Interés Comercial y Equipo Actual</h3></div></div>
          <div className="product-focus"><div className="product-icon"><Sparkles size={22}/></div><div><span>Producto principal a importar</span><strong>{p.mainProduct}</strong><small>{p.secondaryProducts?.join(' · ') || 'Accesorios originales Apple'}</small></div></div>
          <div className="info-grid"><Info label="Dispositivo Actual" value={p.currentDevice || 'iPhone 11'}/><Info label="Presupuesto" value={`${money(p.budgetMin)} – ${money(p.budgetMax)}`}/><Info label="Modalidad Preferida" value={p.paymentPreference}/><Info label="Sensibilidad al Precio" value={p.priceSensitivity}/><Info label="Fuente de Adquisición" value={p.acquisitionSource}/><Info label="Campaña" value={p.campaignName || 'General'}/></div>
          <div className="tag-cloud">{p.interests?.map(x=><span key={x}>{x}</span>)}</div>
        </div>
        <div className="panel"><div className="panel-title"><div><span>COMPORTAMIENTO OBSERVABLE</span><h3>Señales para Algoritmo de Scoring</h3></div><small>Métricas calculadas por interacciones</small></div>
          <div className="behavior-grid"><Signal icon={MousePointerClick} label="Vistas de producto" value={behavior?.views||0}/><Signal icon={MessageCircle} label="Interacciones" value={behavior?.interactions||0}/><Signal icon={WalletCards} label="Consultas precio/pago" value={(behavior?.price||0)+(behavior?.pay||0)}/><Signal icon={FileText} label="Cotizaciones" value={behavior?.quotes||0}/></div>
          <div className="signal-bars"><BarSignal label="Precio final" value={behavior?.price||0} max={4}/><BarSignal label="Disponibilidad" value={behavior?.stock||0} max={4}/><BarSignal label="Modalidades de pago" value={behavior?.pay||0} max={4}/><BarSignal label="Entrega" value={behavior?.delivery||0} max={4}/></div>
        </div>
        <div className="panel"><div className="panel-title"><div><span>TRAZABILIDAD AUDITABLE</span><h3>Historial de Interacciones y Eventos</h3></div></div><div className="timeline">{(p.interactions||[]).slice(0,16).map(i=><div className="timeline-item" key={i.id}><div className="timeline-dot"/><div><div><strong>{humanKind(i.kind)}</strong><span>{i.channel}</span></div><p>{i.content}</p><small>{fmtDate(i.createdAt)} · +{i.intentPoints} pts de intención</small></div></div>)}</div></div>
      </div>

      <aside className="profile-right">
        <div className="agent-card sticky"><div className="agent-header"><div className="agent-icon"><Bot size={23}/></div><div><span>{isBuyer?'MARKETING AGENT':isLead?'NEGOTIATION AGENT':isPayer?'PROCESSING AGENT':'LOYALTY AGENT'}</span><strong>Polux Engine</strong></div><div className="live-chip"><i/> ACTIVO</div></div>
          <div className="agent-analysis"><span>Diagnóstico del Sistema</span><p>{p.agentSummary||'Pendiente de evaluación.'}</p></div>
          <div className="next-action"><span>Siguiente Mejor Acción</span><p>{p.nextBestAction||'Ejecutar evaluación del motor.'}</p></div>
          {p.humanInterventionRequired&&<div className="human-alert"><AlertTriangle size={18}/><div><strong>Escalamiento humano requerido</strong><span>El caso excede las reglas automáticas y requiere aprobación gerencial.</span></div></div>}
          <div className="agent-explain"><span>Fundamento de Negocio</span><ul>{explain(p,behavior).map((x,i)=><li key={i}>{x}</li>)}</ul></div>
          <div className="copilot-box">
            <div className="copilot-title"><Sparkles size={14}/><span>Asistente Comercial</span></div>
            <div className="copilot-messages">{chat.length===0?<div className="copilot-hint">Prueba: “¿Cómo lo abordo?”, “¿Por qué tiene esta prioridad?” o “Genera un mensaje de WhatsApp”.</div>:chat.slice(-5).map((m,i)=><div key={i} className={`chat-bubble ${m.role}`}>{m.text}</div>)}</div>
            <div className="copilot-input"><input value={question} onChange={e=>setQuestion(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')ask()}} placeholder="Consultar contexto comercial…"/><button onClick={ask}><Send size={14}/></button></div>
          </div>
          <div className="agent-actions">
            {isBuyer&&<>
              <button className="btn primary" disabled={!!busy} onClick={()=>act('Evaluación de Marketing actualizada',()=>api.marketingEvaluate(p.id))}><RefreshCw size={16}/> Evaluar Buyer</button>
              <button className="btn" disabled={!!busy} onClick={()=>act('Consulta de precio simulada',()=>api.simulate(p.id,'PRICE_FINAL'))}><WalletCards size={16}/> Simular precio final</button>
              <button className="btn" disabled={!!busy} onClick={()=>act('Cotización preferencial generada',()=>api.simulate(p.id,'QUOTE_REQUEST'))}><FileText size={16}/> Solicitar cotización</button>
            </>}
            {isLead&&<>
              <button className="btn primary" disabled={!!busy} onClick={()=>act('Evaluación de Negociación actualizada',()=>api.negotiationEvaluate(p.id))}><RefreshCw size={16}/> Evaluar Lead</button>
              <button className="btn" disabled={!!busy} onClick={()=>act('Propuesta generada',()=>api.proposal(p.id))}><Sparkles size={16}/> Generar 3 alternativas</button>
              <button className="btn success" disabled={!!busy} onClick={()=>setShowPaymentModal(true)}><CreditCard size={16}/> Pagar con Pasarela (Yape/Plin)</button>
              <button className="btn" disabled={!!busy} onClick={()=>act('Alerta de cobranza enviada',()=>api.collectionAlert(p.id))}><Clock3 size={16}/> Alerta de Cobranza</button>
            </>}
            {isPayer&&<>
              <button className="btn primary" disabled={!!busy} onClick={()=>act('Hito logístico avanzado',()=>api.shippingAdvance(p.id))}><Truck size={16}/> Avanzar Hito Logístico</button>
              <button className="btn" disabled={!!busy} onClick={()=>act('Alerta de cobranza transmitida',()=>api.collectionAlert(p.id))}><Clock3 size={16}/> Alerta de Impulso</button>
              <button className="btn success" onClick={()=>nav(`/customers?deliverId=${p.id}`)}><PackageCheck size={16}/> Registrar Entrega (CUSTOMER)</button>
            </>}
            {isCustomer&&<>
              <button className="btn primary" onClick={()=>nav('/customers')}><HeartHandshake size={16}/> Ver en Módulo CRM</button>
              <button className="btn" disabled={!!busy} onClick={()=>act('Encuesta NPS registrada',()=>api.submitNps(p.id,{score:10,feedback:'Excelente servicio y asesoría técnica.'}))}><Star size={16}/> Calificar NPS 10/10</button>
            </>}
          </div>
        </div>
        <div className="panel quote-card"><div className="panel-title"><div><span>COTIZACIÓN FORMAL</span><h3>{p.quoteActive?'Activa':'No activa'}</h3></div></div>{p.quotes?.[0]?<><strong className="quote-code">{p.quotes[0].code}</strong><div className="quote-value">{money(Number(p.quotes[0].amount))}</div><p>{p.quotes[0].product}</p><div className="quote-meta"><span><Clock3 size={14}/> vence {fmtDate(p.quotes[0].expiresAt)}</span><span><ShieldCheck size={14}/> {p.quotes[0].paymentPlan}</span></div></>:<p className="muted">Aún no existe una cotización vigente.</p>}</div>
        {proposal&&<div className="panel proposal-card"><div className="panel-title"><div><span>PROPUESTA COMERCIAL</span><h3>3 alternativas</h3></div></div>{proposal.proposals.map((x:any)=><div className="proposal-option" key={x.label}><strong>{x.label}</strong><span>{money(x.amount)} · {x.payment}</span><p>{x.note}</p></div>)}</div>}
      </aside>
    </section>
  </div>
}
function Info({label,value}:{label:string;value:string}){return <div className="info-item"><span>{label}</span><strong>{value}</strong></div>}
function Signal({icon:Icon,label,value}:any){return <div className="signal-card"><Icon size={17}/><div><strong>{value}</strong><span>{label}</span></div></div>}
function BarSignal({label,value,max}:any){return <div className="bar-signal"><div><span>{label}</span><strong>{value}</strong></div><div className="bar-track"><i style={{width:`${Math.min(100,value/max*100)}%`}}/></div></div>}
function humanKind(k:string){return ({FORM_SUBMIT:'Formulario completado',CONTENT_INTERACTION:'Interacción con contenido',GUARANTEE_QUERY:'Consulta de garantía',PRODUCT_VIEW:'Vista de producto',PRICE_FINAL:'Consulta de precio final',PAYMENT_QUERY:'Consulta de pago',STOCK_QUERY:'Consulta de stock',DELIVERY_QUERY:'Consulta de entrega',QUOTE_REQUEST:'Solicitud de cotización',SPECIAL_DISCOUNT:'Descuento especial',COMPLAINT:'Reclamo',PAYMENT_CONFIRMED:'Pago confirmado en pasarela',LOGISTICS_UPDATE:'Actualización courier internacional',COLLECTION_ALERT:'Alerta impulsora de cobranza',SERVICE_DELIVERED:'Entrega y activación de garantía',NPS_SURVEY:'Encuesta NPS registrada',SUPPORT_TICKET:'Ticket CRM postventa'} as any)[k]||k.replace(/_/g,' ')}
function explain(p:Person,b:any){const xs=[]; if((b?.views||0)>=6)xs.push(`${b.views} vistas de producto muestran recurrencia.`); if((b?.price||0)>0)xs.push(`${b.price} consulta(s) de precio final.`); if((b?.pay||0)>0)xs.push(`${b.pay} consulta(s) sobre pago.`); if(p.quoteActive)xs.push('Mantiene una cotización vigente.'); if(p.stage==='LEAD')xs.push(`Probabilidad estimada: ${p.conversionProbability}%.`); if(p.stage==='PAYER')xs.push(`Pago validado. Guía courier: ${p.courierTrackingCode || 'Asignada'}.`); if(p.stage==='CUSTOMER')xs.push(`Garantía oficial activa: ${p.warrantyCode || 'Vigente'}.`); if(!xs.length)xs.push('Actividad todavía limitada; mantener nutrición.'); return xs.slice(0,4)}

