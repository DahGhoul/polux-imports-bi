import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Compass, ChevronLeft, ChevronRight, X, Play, CreditCard, 
  ExternalLink, Sparkles, CheckCircle2, Bot, Truck, ShieldCheck, HeartHandshake, Eye
} from 'lucide-react';
import PaymentGatewayModal from './PaymentGatewayModal';

export const TOUR_STEPS = [
  {
    id: 1,
    stage: 'BUYERS',
    title: 'Paso 1: Landing & Captación Inbound',
    route: '/landing',
    desc: 'Visita la tienda oficial de importación. El cliente trujillano explora el catálogo Apple (iPhone 16 Pro, MacBook M4) y solicita cotización.',
    actionLabel: 'Ver Landing / Tienda',
    icon: Compass,
    color: '#3b82f6',
  },
  {
    id: 2,
    stage: 'LEADS',
    title: 'Paso 2: Calificación Comercial & Cotización',
    route: '/leads',
    desc: 'El Agente Negociador evalúa el expediente 360°, probabilidad de cierre y genera 3 propuestas comerciales estructuradas con guardrails.',
    actionLabel: 'Ver Leads en Negociación',
    icon: Bot,
    color: '#8b5cf6',
  },
  {
    id: 3,
    stage: 'PAYERS',
    title: 'Paso 3: Pasarela de Pagos PoluxPay',
    route: '/leads',
    desc: 'Prueba la pasarela con Yape (QR oficial, monto de prueba S/ 0.10, 50% adelanto, sonido chime de confirmación y emisión de Boleta Electrónica SUNAT B001-XXXX).',
    actionLabel: 'Probar Pasarela Yape Ahora',
    isGatewayTrigger: true,
    icon: CreditCard,
    color: '#10b981',
  },
  {
    id: 4,
    stage: 'PAYERS',
    title: 'Paso 4: Logística Miami → Trujillo',
    route: '/payers',
    desc: 'Monitorea el envío courier en 5 hitos (Miami -> Vuelo -> Aduanas SUNAT -> Tienda Trujillo) y dispara alertas de impulso de cobranza.',
    actionLabel: 'Ver Tracking Logístico',
    icon: Truck,
    color: '#10b981',
  },
  {
    id: 5,
    stage: 'CUSTOMERS',
    title: 'Paso 5: Entrega Física & Garantía Apple',
    route: '/customers',
    desc: 'Registra la entrega (tienda Av. Larco o delivery), valida el serial Apple oficial de 12 dígitos y emite la póliza Polux Care por 365 días.',
    actionLabel: 'Ver Módulo de Clientes',
    icon: ShieldCheck,
    color: '#06b6d4',
  },
  {
    id: 6,
    stage: 'CUSTOMERS',
    title: 'Paso 6: Encuesta NPS & Apple Club',
    route: '/customers',
    desc: 'Evalúa la satisfacción (0 a 10). Al calificar 10/10, se activa el beneficio "Apple Club" (15% OFF de por vida) y transita a cliente embajador TURNED.',
    actionLabel: 'Ver Fidelización y Tickets',
    icon: HeartHandshake,
    color: '#ec4899',
  },
];

export default function DemoTourBar({ onClose }: { onClose?: () => void }) {
  const nav = useNavigate();
  const location = useLocation();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showDirectGateway, setShowDirectGateway] = useState(false);

  const step = TOUR_STEPS[currentStepIndex];

  const handleNext = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      nav(TOUR_STEPS[nextIndex].route);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      setCurrentStepIndex(prevIndex);
      nav(TOUR_STEPS[prevIndex].route);
    }
  };

  const handleActionClick = () => {
    if (step.isGatewayTrigger) {
      setShowDirectGateway(true);
    } else {
      nav(step.route);
    }
  };

  // Mock person for direct gateway test in tour
  const demoPerson: any = {
    id: 1,
    firstName: 'Valeria',
    lastName: 'Mendoza García',
    email: 'valeria.mendoza@unitru.edu.pe',
    phone: '+51 944 620 118',
    district: 'Víctor Larco Herrera',
    documentType: 'DNI',
    documentNumber: '72819034',
    mainProduct: 'iPhone 16 Pro 256 GB',
    quotes: [{ amount: 6599, code: 'POLUX-DEMO-2026', product: 'iPhone 16 Pro 256 GB' }],
  };

  if (isMinimized) {
    return (
      <div className="demo-tour-minimized">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => setIsMinimized(false)}>
          <div className="dtm-dot" />
          <Compass size={16} />
          <span><strong>Guía Demo:</strong> Paso {step.id}/6 ({step.stage})</span>
          <button type="button" className="dtm-expand-btn">Expandir</button>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} style={{ marginLeft: '12px', color: '#94a3b8', cursor: 'pointer' }} title="Cerrar guía">
            <X size={14} />
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      {showDirectGateway && (
        <PaymentGatewayModal
          person={demoPerson}
          onClose={() => setShowDirectGateway(false)}
          onSuccess={(upd) => {
            setShowDirectGateway(false);
            nav('/payers');
          }}
        />
      )}

      <div className="demo-tour-floating-bar">
        <div className="dt-left">
          <div className="dt-step-badge" style={{ backgroundColor: `${step.color}22`, color: step.color, borderColor: `${step.color}55` }}>
            <step.icon size={15} />
            <span>PASO {step.id} DE 6 · {step.stage}</span>
          </div>
          <div className="dt-info">
            <h4>{step.title}</h4>
            <p>{step.desc}</p>
          </div>
        </div>

        <div className="dt-actions">
          <button 
            className="dt-main-action-btn"
            onClick={handleActionClick}
            style={{ borderColor: step.color }}
          >
            {step.isGatewayTrigger ? <CreditCard size={15} /> : <ExternalLink size={15} />}
            <span>{step.actionLabel}</span>
          </button>

          <div className="dt-nav-btns">
            <button 
              className="dt-nav-btn" 
              onClick={handlePrev} 
              disabled={currentStepIndex === 0}
              title="Paso anterior"
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              className="dt-nav-btn" 
              onClick={handleNext} 
              disabled={currentStepIndex === TOUR_STEPS.length - 1}
              title="Paso siguiente"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <button 
            className="dt-close-btn" 
            onClick={onClose ? onClose : () => setIsMinimized(true)}
            title="Cerrar guía demostrativa"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    </>
  );
}
