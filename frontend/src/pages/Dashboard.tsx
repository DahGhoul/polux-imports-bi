import { useEffect, useState } from 'react';
import { Activity, DollarSign, HeartHandshake, MapPin, PackageCheck, ShieldCheck, Target, UsersRound, Zap, Sparkles, ExternalLink, ArrowRight } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { api, money } from '../lib/api';
import { KpiStatus, MetricCard } from '../components/Ui';

export default function Dashboard(){
  const [d,setD]=useState<any>(); const [loading,setLoading]=useState(true);
  const nav = useNavigate();
  useEffect(()=>{api.dashboard().then(setD).finally(()=>setLoading(false))},[]);
  if(loading) return <div className="skeleton-page">Cargando inteligencia comercial y operacional…</div>;

  const funnel=[
    {name:'BUYERS',value:d.funnel.buyers, desc:'Potenciales', color:'#3b82f6', route:'/buyers'},
    {name:'LEADS',value:d.funnel.leads, desc:'En Negociación', color:'#8b5cf6', route:'/leads'},
    {name:'PAYERS',value:d.funnel.payers, desc:'Logística USA', color:'#10b981', route:'/payers'},
    {name:'CUSTOMERS',value:d.funnel.customers || 0, desc:'Garantía & NPS', color:'#06b6d4', route:'/customers'},
  ];

  return <div className="page-grid">
    <section className="hero-panel">
      <div>
        <div className="eyebrow accent">METODOLOGÍA IMPULSE · POLUX IMPORTS TRUJILLO</div>
        <h2>Control Integral: De la Captación a la Fidelización Apple</h2>
        <p>Plataforma comercial y operacional con trazabilidad 360°: detección de intención comercial, pasarela de pago (Yape/Plin), itinerario courier USA → Perú y servicio postventa.</p>
        <div style={{display:'flex', gap:'10px', marginTop:'14px'}}>
          <button className="btn primary" onClick={()=>nav('/landing')} style={{display:'inline-flex', alignItems:'center', gap:'6px'}}>
            <ExternalLink size={14}/> Ver Tienda / Landing Pública
          </button>
          <button className="btn" onClick={()=>nav('/agents')} style={{display:'inline-flex', alignItems:'center', gap:'6px'}}>
            <Sparkles size={14}/> Command Center Multi-Agente
          </button>
        </div>
      </div>
      <div className="hero-agent">
        <div className="agent-big-icon"><ShieldCheck size={28}/></div>
        <div>
          <span>OPERACIÓN COMERCIAL</span>
          <strong>{money(d.cards.totalRevenue || 0)}</strong>
          <small>Recaudación total confirmada</small>
        </div>
      </div>
    </section>

    <section className="metrics-grid four">
      <div onClick={()=>nav('/buyers')} style={{cursor:'pointer'}} title="Ver Buyers">
        <MetricCard label="Buyers Activos" value={d.cards.buyers} sub={`${d.cards.highIntent} con alta intención`} icon={UsersRound}/>
      </div>
      <div onClick={()=>nav('/leads')} style={{cursor:'pointer'}} title="Ver Leads">
        <MetricCard label="Leads en Negociación" value={d.cards.leads} sub={`${d.cards.highPriorityLeads} prioridad alta`} icon={Target}/>
      </div>
      <div onClick={()=>nav('/payers')} style={{cursor:'pointer'}} title="Ver Payers">
        <MetricCard label="Payers & Envíos USA" value={d.cards.payers} sub={`${d.cards.inTransitCount || 0} en tránsito aduanero`} icon={PackageCheck}/>
      </div>
      <div onClick={()=>nav('/customers')} style={{cursor:'pointer'}} title="Ver Customers">
        <MetricCard label="Satisfacción NPS Promedio" value={`${d.cards.avgNps || 9.4} / 10`} sub={`${d.cards.activeWarranties || 0} garantías de 1 año`} icon={HeartHandshake}/>
      </div>
    </section>

    <section className="two-col">
      <div className="panel chart-panel">
        <div className="panel-title">
          <div><span>EMBUDO OPERACIONAL IMPULSE</span><h3>Flujo de Conversión de Clientes</h3></div>
          <small>Click en cualquier fase para explorar</small>
        </div>
        <div className="funnel-visual">
          {funnel.map((f:any,i:number)=>(
            <div 
              className={`funnel-step step-${i}`} 
              key={f.name}
              onClick={()=>nav(f.route)}
              style={{cursor:'pointer'}}
              title={`Ver expedientes de ${f.name}`}
            >
              <span>{f.name}</span>
              <strong>{f.value}</strong>
              <small>{f.desc} <ArrowRight size={11} style={{display:'inline'}}/></small>
            </div>
          ))}
        </div>
        <div className="conversion-strip four-metrics">
          <div><span>BUYER → LEAD</span><strong>{d.kpis.buyerToLead}%</strong></div>
          <div><span>LEAD → PAYER</span><strong>{d.kpis.leadToPayer}%</strong></div>
          <div><span>PAYER → CUSTOMER</span><strong>{d.kpis.payerToCustomer || 100}%</strong></div>
          <div><span>NPS PROMOTORES</span><strong>{Math.round((d.kpis.npsAverage || 9) * 10)}%</strong></div>
        </div>
      </div>

      <div className="panel chart-panel">
        <div className="panel-title">
          <div><span>DISTRIBUCIÓN GEOGRÁFICA</span><h3>Clientes por Distrito en Trujillo</h3></div>
          <small>Segmentación territorial</small>
        </div>
        <ResponsiveContainer width="100%" height={245}>
          <BarChart data={d.districts || []} margin={{left:0,right:10,bottom:10}}>
            <CartesianGrid strokeDasharray="3 3" stroke="#222534"/>
            <XAxis dataKey="name" stroke="#8f96aa" tick={{fontSize:10}} interval={0}/>
            <YAxis stroke="#8f96aa" tick={{fontSize:10}}/>
            <Tooltip contentStyle={{background:'#11131d',border:'1px solid #2a2d3d',borderRadius:8}}/>
            <Bar dataKey="value" fill="#2563eb" radius={[6,6,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>

    <section className="two-col wide-left">
      <div className="panel chart-panel">
        <div className="panel-title">
          <div><span>CATÁLOGO APPLE</span><h3>Productos más Consultados</h3></div>
          <small>{d.interactionCount} interacciones registradas</small>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={d.topProducts} layout="vertical" margin={{left:10,right:20}}>
            <CartesianGrid strokeDasharray="3 3" stroke="#222534"/>
            <XAxis type="number" stroke="#72778a"/>
            <YAxis dataKey="name" type="category" width={160} stroke="#aeb2c2" tick={{fontSize:11}}/>
            <Tooltip contentStyle={{background:'#11131d',border:'1px solid #2a2d3d',borderRadius:8}}/>
            <Bar dataKey="value" fill="#10b981" radius={[0,6,6,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="panel">
        <div className="panel-title"><div><span>INDICADORES CLAVE (KPI)</span><h3>Semáforo de Operaciones</h3></div></div>
        <div className="kpi-list">
          <KpiRow name="Interacción con contenido" value={`${d.kpis.engagement}%`} number={d.kpis.engagement} good={8} warning={4}/>
          <KpiRow name="Finalización de formulario" value={`${d.kpis.formCompletion}%`} number={d.kpis.formCompletion} good={70} warning={50}/>
          <KpiRow name="Conversión Buyer → Lead" value={`${d.kpis.buyerToLead}%`} number={d.kpis.buyerToLead} good={30} warning={15}/>
          <KpiRow name="Resolución automática del agente" value={`${d.kpis.automaticResolution}%`} number={d.kpis.automaticResolution} good={80} warning={60}/>
          <KpiRow name="Costo por lead adquirido" value={`S/ ${d.kpis.costPerLead}`} number={d.kpis.costPerLead} good={80} warning={150} inverse/>
        </div>
      </div>
    </section>
  </div>
}
function KpiRow({name,value,number,good,warning,inverse=false}:any){return <div className="kpi-row"><div><KpiStatus value={number} good={good} warning={warning} inverse={inverse}/><span>{name}</span></div><strong>{value}</strong></div>}

