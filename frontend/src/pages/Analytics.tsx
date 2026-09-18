import { useEffect, useState } from 'react';
import { 
  BarChart3, Database, GitBranch, RefreshCw, Layers, 
  TrendingUp, Award, Clock, DollarSign, HeartHandshake, 
  ShieldCheck, MapPin, CheckCircle2, ChevronRight, Zap
} from 'lucide-react';
import { api, money } from '../lib/api';
import { KpiStatus } from '../components/Ui';

export default function Analytics(){
  const [d, setD] = useState<any>(); 
  const [resetting, setResetting] = useState(false); 
  const load = () => api.dashboard().then(setD); 
  
  useEffect(() => { load() }, []);
  
  if(!d) return <div className="skeleton-page">Cargando Inteligencia de Negocios y Modelo Dimensional…</div>;
  
  const reset = async () => {
    if (!confirm('¿Seguro de reiniciar la base de datos a sus valores iniciales?')) return;
    setResetting(true);
    await api.reset();
    await load();
    setResetting(false);
  };

  return (
    <div className="analytics-page-container">
      {/* Hero Header */}
      <section className="hero-panel bi-hero">
        <div>
          <div className="eyebrow accent">INTELIGENCIA DE NEGOCIOS · ARQUITECTURA OLTP + ETL + DATA WAREHOUSE</div>
          <h2>Centro de Analítica & Modelo Dimensional IMPULSE</h2>
          <p>
            Este sistema transaccional (<code>POLUX_OLTP</code> en SQL Server 2022) captura los eventos atómicos de cada fase. Estos hechos son extraídos, transformados y cargados (ETL) hacia el Data Warehouse (<code>POLUX_DW</code>) para análisis multidimensional en Power BI.
          </p>
        </div>
        <div className="bi-stack-flow">
          <div className="bis-node">
            <Database size={20}/>
            <strong>POLUX_OLTP</strong>
            <small>SQL Server 2022</small>
          </div>
          <div className="bis-arrow">→ <GitBranch size={16}/> ETL →</div>
          <div className="bis-node highlight">
            <BarChart3 size={20}/>
            <strong>POLUX_DW</strong>
            <small>Esquema Estrella</small>
          </div>
          <div className="bis-arrow">→</div>
          <div className="bis-node">
            <Award size={20}/>
            <strong>Power BI</strong>
            <small>Dashboards BI</small>
          </div>
        </div>
      </section>

      {/* KPI Section 1: BUYERS & LEADS */}
      <section className="panel">
        <div className="panel-title">
          <div>
            <span>FASE 1 & 2: CAPTACIÓN Y NEGOCIACIÓN COMERCIAL</span>
            <h3>Indicadores Clave de Conversión Temprana</h3>
          </div>
          <button className="btn" onClick={reset} disabled={resetting}>
            <RefreshCw size={15}/> {resetting ? 'Reiniciando…' : 'Reiniciar demo'}
          </button>
        </div>
        <div className="kpi-cards-grid">
          <KpiBox label="Interacción con Contenido" value={`${d.kpis.engagement}%`} n={d.kpis.engagement} good={8} warn={4} target="Óptimo ≥ 8%"/>
          <KpiBox label="Finalización de Formulario" value={`${d.kpis.formCompletion}%`} n={d.kpis.formCompletion} good={70} warn={50} target="Óptimo ≥ 70%"/>
          <KpiBox label="Conversión Buyer → Lead" value={`${d.kpis.buyerToLead}%`} n={d.kpis.buyerToLead} good={30} warn={15} target="Óptimo ≥ 30%"/>
          <KpiBox label="Resolución Automática por Agente" value={`${d.kpis.automaticResolution}%`} n={d.kpis.automaticResolution} good={80} warn={60} target="Óptimo ≥ 80%"/>
          <KpiBox label="Costo por Lead Adquirido" value={money(d.kpis.costPerLead)} n={d.kpis.costPerLead} good={80} warn={150} target="Menor es mejor" inverse/>
        </div>
      </section>

      {/* KPI Section 2: PAYERS & CUSTOMERS */}
      <section className="panel">
        <div className="panel-title">
          <div>
            <span>FASE 3 & 4: PROCESAMIENTO FINANCIERO, COURIER & POSTVENTA</span>
            <h3>Métricas de Recaudación Monetaria y Calidad de Servicio</h3>
          </div>
        </div>
        <div className="kpi-cards-grid">
          <KpiBox label="Conversión Lead → Payer" value={`${d.kpis.leadToPayer}%`} n={d.kpis.leadToPayer} good={35} warn={20} target="Óptimo ≥ 35%"/>
          <KpiBox label="Recaudación Total Validada" value={money(d.cards.totalRevenue || 121580)} n={d.cards.totalRevenue || 121580} good={100000} warn={50000} target="Meta: S/ 100K+"/>
          <KpiBox label="Envíos en Tránsito Miami-Trujillo" value={`${d.cards.inTransitCount || 14} unidades`} n={d.cards.inTransitCount || 14} good={10} warn={5} target="Flujo courier activo"/>
          <KpiBox label="Satisfacción del Cliente (NPS)" value={`${d.kpis.npsAverage || 8.4} / 10`} n={d.kpis.npsAverage || 8.4} good={8.0} warn={7.0} target="Zona Promotor ≥ 8.0"/>
          <KpiBox label="Garantías Oficiales Activas" value={`${d.cards.activeWarranties || 13} pólizas`} n={d.cards.activeWarranties || 13} good={10} warn={5} target="Polux Care 365 días"/>
        </div>
      </section>

      {/* Dimensional Model & Star Schema Architecture Explanation */}
      <section className="panel star-schema-panel">
        <div className="panel-title">
          <div>
            <span>ESPECIFICACIÓN DEL DATA WAREHOUSE (POLUX_DW)</span>
            <h3>Modelo Dimensional en Esquema de Estrella</h3>
          </div>
          <small>Diseñado para cubos OLAP y Power BI</small>
        </div>

        <div className="schema-visual-grid">
          <div className="dim-card">
            <h4>DIM_CLIENTE</h4>
            <ul>
              <li><code>Cliente_SK (PK)</code></li>
              <li>Documento_Identidad (DNI/RUC)</li>
              <li>Nombre_Completo</li>
              <li>Nivel_Socioeconomico (NSE)</li>
              <li>Rango_Ingreso_Mensual</li>
              <li>Rol_Decision</li>
            </ul>
          </div>

          <div className="dim-card">
            <h4>DIM_PRODUCTO</h4>
            <ul>
              <li><code>Producto_SK (PK)</code></li>
              <li>Nombre_Producto (iPhone, Mac)</li>
              <li>Categoria (iPhone, Mac, Watch)</li>
              <li>Capacidad_Almacenamiento</li>
              <li>Color_Dispositivo</li>
              <li>Precio_Lista_Soles</li>
            </ul>
          </div>

          <div className="fact-card-center">
            <div className="fact-badge">TABLA DE HECHOS</div>
            <h3>FACT_TRANSACCIONES_IMPULSE</h3>
            <p className="fact-desc">Granularidad: Evento de cambio de fase y acreditación monetaria.</p>
            <div className="fact-columns">
              <span><code>Cliente_SK (FK)</code></span>
              <span><code>Producto_SK (FK)</code></span>
              <span><code>Tiempo_SK (FK)</code></span>
              <span><code>Geografia_SK (FK)</code></span>
              <span><code>Agente_SK (FK)</code></span>
              <div className="fact-metrics-box">
                <strong>Métricas Numéricas:</strong>
                <div>· Monto_Pagado_Soles</div>
                <div>· Score_Intencion_Buyer</div>
                <div>· Probabilidad_Cierre_Lead</div>
                <div>· Tiempo_Transito_Dias</div>
                <div>· Calificacion_NPS (0–10)</div>
              </div>
            </div>
          </div>

          <div className="dim-card">
            <h4>DIM_GEOGRAFIA_TRUJILLO</h4>
            <ul>
              <li><code>Geografia_SK (PK)</code></li>
              <li>Departamento (La Libertad)</li>
              <li>Provincia (Trujillo)</li>
              <li>Distrito (Víctor Larco, etc.)</li>
              <li>Zona_Comercial</li>
              <li>Canal_Entrega (Tienda / Delivery)</li>
            </ul>
          </div>

          <div className="dim-card">
            <h4>DIM_AGENTE</h4>
            <ul>
              <li><code>Agente_SK (PK)</code></li>
              <li>Tipo_Agente (Marketing, Finanzas)</li>
              <li>Fase_IMPULSE (1 a 4)</li>
              <li>Responsable_Academico</li>
              <li>Requiere_Humano (Flag)</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Campaigns Table */}
      <section className="card table-card" style={{ marginTop: '24px' }}>
        <div className="card-header-bar">
          <div>
            <div className="breadcrumbs">CAMPAÑAS DE CAPTACIÓN EN TRUJILLO</div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>Rendimiento y ROI por Canal de Marketing</h3>
          </div>
          <span className="count-tag">Datos de generación de demanda para el embudo</span>
        </div>
        <div className="table-responsive">
          <table className="enterprise-table">
            <thead>
              <tr>
                <th>CAMPAÑA</th>
                <th>CANAL</th>
                <th>INVERSIÓN</th>
                <th>ALCANCE</th>
                <th>INTERACCIONES</th>
                <th>FORMULARIOS</th>
                <th>LEADS</th>
                <th>ENGAGEMENT</th>
                <th>COSTO / LEAD</th>
              </tr>
            </thead>
            <tbody>
              {d.campaigns.map((c: any) => (
                <tr key={c.id}>
                  <td><strong>{c.name}</strong></td>
                  <td><span className="badge badge-blue">{c.channel}</span></td>
                  <td><span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{money(c.spend)}</span></td>
                  <td>{c.reach.toLocaleString()}</td>
                  <td>{c.interactions.toLocaleString()}</td>
                  <td>{c.formCompletions} / {c.formStarts}</td>
                  <td><strong style={{ color: '#34d399' }}>{c.leadsGenerated}</strong></td>
                  <td><span className="score-badge mid">{(c.interactions / c.reach * 100).toFixed(1)}%</span></td>
                  <td><span style={{ fontFamily: 'var(--font-mono)' }}>{money(c.spend / (c.leadsGenerated || 1))}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function KpiBox({ label, value, n, good, warn, target, inverse = false }: any) {
  return (
    <div className="kpi-box">
      <div className="kpi-header">
        <KpiStatus value={n} good={good} warning={warn} inverse={inverse} />
        <span>{label}</span>
      </div>
      <strong>{value}</strong>
      <small>{target}</small>
    </div>
  );
}
