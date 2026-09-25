import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  BarChart3, Bot, ChevronRight, CreditCard, HeartHandshake, 
  LayoutDashboard, Megaphone, ShieldCheck, Target, UsersRound, 
  Sparkles, ExternalLink, Compass, Truck, UserCheck
} from 'lucide-react';
import DemoTourBar from './DemoTourBar';
import PaymentGatewayModal from './PaymentGatewayModal';

const nav = [
  { to:'/', label:'Tablero General & BI', icon:LayoutDashboard, end:true },
  
  { section:'EMBUDO COMERCIAL (IMPULSE)' },
  { to:'/buyers', label:'Buyers (Captación)', stage:'Fase 1', icon:UsersRound },
  { to:'/leads', label:'Leads (Negociación)', stage:'Fase 2', icon:Target },
  { to:'/negotiation-profile', label:'Perfil de Negociación', stage:'360°', icon:UserCheck },
  { to:'/payers', label:'Payers (Finanzas & Courier)', stage:'Fase 3', icon:CreditCard },
  { to:'/customers', label:'Customers (Fidelización & CRM)', stage:'Fase 4', icon:HeartHandshake },
  
  { section:'AGENTES INTELIGENTES' },
  { to:'/agents', label:'Command Center Multi-Agente', icon:Sparkles, end:true },
  { to:'/agents/marketing', label:'Agente de Marketing', icon:Megaphone },
  { to:'/agents/negotiation', label:'Agente Negociador', icon:Bot },
  { to:'/agents/processing', label:'Financiero & Logística', icon:Truck },
  { to:'/agents/loyalty', label:'Fidelización & Soporte', icon:HeartHandshake },
  
  { section:'INTELIGENCIA DE NEGOCIOS' },
  { to:'/analytics', label:'BI Analytics & ETL', icon:BarChart3 },

  { section:'CANALES PÚBLICOS' },
  { to:'/landing', label:'Tienda / Landing Oficial', icon:ExternalLink },
];

export default function Layout(){
  const location = useLocation();
  const navTo = useNavigate();
  const [showGlobalPaymentModal, setShowGlobalPaymentModal] = useState(false);
  const [showDemoTour, setShowDemoTour] = useState(false);

  const title = location.pathname.startsWith('/negotiation-profile')
    ? 'Perfil de Negociación 360° · Expediente Integral del Lead'
    : location.pathname.startsWith('/buyers')
    ? 'BUYERS · Captación e Intención Comercial (Fase 1)'
    : location.pathname.startsWith('/leads')
    ? 'LEADS · Negociación y Propuestas Comerciales (Fase 2)'
    : location.pathname.startsWith('/payers')
    ? 'PAYERS · Procesamiento Financiero y Logística (Fase 3)'
    : location.pathname.startsWith('/customers')
    ? 'CUSTOMERS · Entrega, Garantía Apple y CRM Postventa (Fase 4)'
    : location.pathname === '/agents'
    ? 'Command Center Multi-Agente · Orquestación Integral IMPULSE'
    : location.pathname.includes('marketing')
    ? 'Agente de Marketing · Detección de Señales de Compra'
    : location.pathname.includes('negotiation')
    ? 'Agente Negociador · Cierre y Guardrails Éticos'
    : location.pathname.includes('processing')
    ? 'Agente Financiero y Logística · Pasarela PoluxPay y Courier'
    : location.pathname.includes('loyalty')
    ? 'Agente de Fidelización y Soporte · Póliza Apple y Retención'
    : location.pathname.includes('analytics')
    ? 'Inteligencia de Negocios · Indicadores y Modelo Dimensional DW'
    : 'Centro de Inteligencia Comercial y Operaciones';

  // Mock person for quick gateway testing in topbar
  const testPerson: any = {
    id: 1,
    firstName: 'Valeria',
    lastName: 'Mendoza García',
    email: 'valeria.mendoza@unitru.edu.pe',
    phone: '+51 944 620 118',
    district: 'Víctor Larco Herrera',
    documentType: 'DNI',
    documentNumber: '72819034',
    mainProduct: 'iPhone 16 Pro 256 GB',
    quotes: [{ amount: 6599, code: 'POLUX-TOP-2026', product: 'iPhone 16 Pro 256 GB' }],
  };

  return (
    <div className="app-shell">
      {/* Global Payment Gateway Modal */}
      {showGlobalPaymentModal && (
        <PaymentGatewayModal
          person={testPerson}
          onClose={() => setShowGlobalPaymentModal(false)}
          onSuccess={(upd) => {
            setShowGlobalPaymentModal(false);
            navTo('/payers');
          }}
        />
      )}

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand" onClick={() => navTo('/')} style={{ cursor: 'pointer' }}>
          <div className="brand-mark"><ShieldCheck size={20}/></div>
          <div><strong>POLUX IMPORTS</strong><span>ERP & CRM COMERCIAL</span></div>
        </div>
        
        <div className="env-pill">
          <span className="pulse-dot"/> ENTORNO OPERACIONAL · TRUJILLO
        </div>

        <nav className="nav-list">
          {nav.map((item:any, i) => item.section ? (
            <div key={i} className="nav-section">{item.section}</div>
          ) : (
            <NavLink 
              key={item.to} 
              to={item.to} 
              end={item.end} 
              className={({isActive})=>`nav-item ${isActive?'active':''}`}
            >
              <item.icon size={17}/>
              <span style={{ flexGrow: 1 }}>{item.label}</span>
              {item.stage && <span className="nav-stage-badge">{item.stage}</span>}
              <ChevronRight size={13} className="nav-arrow"/>
            </NavLink>
          ))}
        </nav>

        <div className="system-footer-card">
          <div>
            <strong>Polux Imports S.A.C.</strong>
            <span>Sede Av. Larco 840 · Trujillo</span>
          </div>
          <small className="r-label">RUC: 20608912401 · Apple Importer</small>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-area">
        <header className="topbar">
          <div>
            <div className="eyebrow">POLUX IMPORTS · METODOLOGÍA IMPULSE</div>
            <h1>{title}</h1>
          </div>
          
          <div className="topbar-right-actions">
            <button 
              type="button"
              className={`btn-topbar-tour ${showDemoTour ? 'active' : ''}`}
              onClick={() => setShowDemoTour(prev => !prev)}
              title="Activar o cerrar la guía demostrativa de 6 pasos para la sustentación"
            >
              <Compass size={14} /> {showDemoTour ? 'Ocultar Guía' : 'Guía Demostrativa'}
            </button>
            <button 
              className="btn-topbar-landing" 
              onClick={() => navTo('/landing')}
              title="Abrir tienda / landing de cara al cliente"
            >
              <ExternalLink size={14} /> Ver Tienda / Landing
            </button>
            <button 
              className="btn-topbar-gateway" 
              onClick={() => setShowGlobalPaymentModal(true)}
              title="Probar pasarela con Yape (S/ 0.10) y audio chime"
            >
              <CreditCard size={14} /> Pasarela Yape (Demo)
            </button>
            <div className="top-status">
              <span className="status-dot"/>
              <div>
                <strong>Plataforma Activa</strong>
                <span>SQL Server 2022</span>
              </div>
            </div>
          </div>
        </header>

        <div className="content">
          <Outlet/>
        </div>

        {/* Guided Interactive Demo Tour for Evaluation (Opcional, no intrusivo) */}
        {showDemoTour && <DemoTourBar onClose={() => setShowDemoTour(false)} />}
      </main>
    </div>
  );
}
