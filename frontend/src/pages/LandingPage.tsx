import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, Smartphone, Laptop, Watch, Headphones, Tablet, 
  CheckCircle2, ArrowRight, CreditCard, Sparkles, MapPin, 
  Star, Clock, Truck, ShieldAlert, Award, ChevronRight, Send, Check
} from 'lucide-react';
import { api, money } from '../lib/api';
import PaymentGatewayModal from '../components/PaymentGatewayModal';

const PRODUCTS = [
  {
    id: 'iphone-16-pro-max',
    name: 'iPhone 16 Pro Max 256 GB',
    category: 'iPhone',
    tagline: 'Titanio del Desierto · Chip A18 Pro · Control de Cámara',
    price: 6599,
    originalPrice: 7299,
    image: '📱',
    color: 'Titanio Natural',
    specs: ['Pantalla Super Retina XDR 6.9”', 'Cámara Fusion de 48 MP con Zoom 5x', 'Batería hasta 33 horas de video', 'Sellado de Fábrica Apple USA'],
  },
  {
    id: 'iphone-16',
    name: 'iPhone 16 128 GB',
    category: 'iPhone',
    tagline: 'Colores vibrantes · Botón de Acción · Chip A18',
    price: 4299,
    originalPrice: 4799,
    image: '📱',
    color: 'Azul Ultramarino',
    specs: ['Pantalla OLED 6.1”', 'Cámara dual avanzada de 48 MP', 'Grabación de Audio Espacial', 'Garantía oficial Apple de 1 año'],
  },
  {
    id: 'macbook-air-m4',
    name: 'MacBook Air 13” Chip M4',
    category: 'MacBook',
    tagline: 'Ultraligera · 16 GB RAM Unificada · 256 GB SSD',
    price: 5499,
    originalPrice: 6199,
    image: '💻',
    color: 'Medianoche',
    specs: ['Pantalla Liquid Retina 13.6”', 'Hasta 18 horas de autonomía', 'Teclado Magic Keyboard retroiluminado', 'Cargador MagSafe 3 incluido'],
  },
  {
    id: 'apple-watch-s10',
    name: 'Apple Watch Series 10 46mm',
    category: 'Watch',
    tagline: 'Caja de Aluminio Negro Azabache · Sensor ECG y Apnea',
    price: 2199,
    originalPrice: 2499,
    image: '⌚',
    color: 'Negro Azabache',
    specs: ['Pantalla OLED con ángulo amplio', 'Sensor de temperatura y ciclo', 'Carga rápida al 80% en 30 min', 'Resistencia al agua 50m'],
  },
  {
    id: 'airpods-pro-2',
    name: 'AirPods Pro 2da Gen (USB-C)',
    category: 'Audio',
    tagline: 'Cancelación Activa de Ruido 2x · Audio Adaptativo',
    price: 1099,
    originalPrice: 1299,
    image: '🎧',
    color: 'Blanco',
    specs: ['Chip H2 de Apple', 'Estuche MagSafe con altavoz y correa', 'Modo Ambiente Inteligente', 'Hasta 30 horas con estuche'],
  },
  {
    id: 'ipad-air-m3',
    name: 'iPad Air 11” Chip M3 128 GB',
    category: 'iPad',
    tagline: 'Potencia extrema para diseño, universidad y productividad',
    price: 3199,
    originalPrice: 3599,
    image: '📟',
    color: 'Gris Espacial',
    specs: ['Pantalla Liquid Retina antirreflejo', 'Cámara frontal horizontal de 12 MP', 'Compatible con Apple Pencil Pro', 'Conectividad Wi-Fi 6E'],
  },
];

const REVIEWS = [
  {
    name: 'Valeria Mendoza G.',
    district: 'Víctor Larco Herrera',
    device: 'iPhone 16 Pro Max 256 GB',
    rating: 5,
    comment: 'Compré con Yape pagando primero un adelanto de prueba. Me entregaron en la tienda de Av. Larco con la caja sellada y validamos el serial de Apple en el momento. Servicio 10/10.',
  },
  {
    name: 'Mateo Benites S.',
    district: 'Huanchaco',
    device: 'MacBook Air M4',
    rating: 5,
    comment: 'La importación desde Miami demoró exactamente 6 días como prometieron. La boleta electrónica SUNAT llegó a mi correo de inmediato.',
  },
  {
    name: 'Camila Paredes C.',
    district: 'Trujillo Centro',
    device: 'Apple Watch Series 10',
    rating: 5,
    comment: 'Excelente atención. Además me activaron el beneficio del Apple Club con 15% de descuento para mi siguiente compra de accesorios.',
  },
];

export default function LandingPage() {
  const nav = useNavigate();
  const [selectedProduct, setSelectedProduct] = useState(PRODUCTS[0]);
  const [modalPerson, setModalPerson] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  // Quote form state
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    district: 'Víctor Larco Herrera',
    documentNumber: '',
    preferredChannel: 'WhatsApp',
    paymentPreference: 'Yape / Plin',
  });
  const [submitting, setSubmitting] = useState(false);
  const [successLead, setSuccessLead] = useState<any>(null);

  const handleSelectProduct = (prod: typeof PRODUCTS[0]) => {
    setSelectedProduct(prod);
    const elem = document.getElementById('quote-section');
    if (elem) elem.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDirectCheckout = (prod: typeof PRODUCTS[0]) => {
    // Create a temporary mock person for direct payment gateway testing
    setModalPerson({
      id: 9999,
      firstName: 'Comprador',
      lastName: 'Trujillo',
      email: 'comprador.demo@polux.pe',
      mainProduct: prod.name,
      quotes: [{ amount: prod.price, code: 'POLUX-WEB-2026', product: prod.name }],
    });
    setShowPaymentModal(true);
  };

  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.phone.trim()) {
      alert('Por favor completa al menos tu nombre y teléfono/WhatsApp');
      return;
    }

    setSubmitting(true);
    try {
      const created = await api.createPerson({
        firstName: form.firstName,
        lastName: form.lastName || 'Trujillo',
        phone: form.phone,
        district: form.district,
        documentNumber: form.documentNumber || undefined,
        mainProduct: selectedProduct.name,
        budgetMin: selectedProduct.price * 0.9,
        budgetMax: selectedProduct.price * 1.1,
        paymentPreference: form.paymentPreference,
        preferredChannel: form.preferredChannel,
        acquisitionSource: 'Landing page oficial',
        stage: 'BUYER',
      });
      setSuccessLead(created);
    } catch (err: any) {
      console.error(err);
      alert('Error al registrar cotización: ' + (err.message || 'Error de conexión'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="landing-page-root">
      {/* Modals */}
      {showPaymentModal && modalPerson && (
        <PaymentGatewayModal
          person={modalPerson}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={(upd) => {
            setShowPaymentModal(false);
            alert('¡Pago validado con éxito! Se emitió el comprobante fiscal y se actualizó el sistema.');
          }}
        />
      )}

      {/* Top Announcement Bar */}
      <div className="landing-top-bar">
        <span>📍 Tienda física en <strong>Av. Larco 840, Víctor Larco, Trujillo</strong> · Envíos con custodia a toda La Libertad · Importación directa Apple USA</span>
        <button className="erp-switch-btn" onClick={() => nav('/')}>
          <Sparkles size={14} /> Ir a Plataforma de Gestión (ERP/CRM) <ChevronRight size={14} />
        </button>
      </div>

      {/* Header */}
      <header className="landing-header">
        <div className="landing-header-container">
          <div className="landing-logo" onClick={() => nav('/landing')}>
            <div className="landing-logo-icon"><ShieldCheck size={22} /></div>
            <div>
              <strong>POLUX IMPORTS</strong>
              <span>APPLE IMPORTER TRUJILLO</span>
            </div>
          </div>

          <nav className="landing-nav">
            <a href="#catalogo">Catálogo Apple</a>
            <a href="#garantia">Garantía Polux Care</a>
            <a href="#testimonios">Opiniones Trujillo</a>
            <a href="#contacto">Sede Av. Larco</a>
          </nav>

          <div className="landing-header-actions">
            <button 
              className="btn-landing-secondary" 
              onClick={() => handleDirectCheckout(selectedProduct)}
              title="Prueba inmediata de pasarela con Yape/Plin (S/ 0.10)"
            >
              <CreditCard size={15} /> Probar Pasarela (Yape / Plin)
            </button>
            <a href="#quote-section" className="btn-landing-primary">
              Cotizar mi Apple <ArrowRight size={15} />
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="landing-hero-content">
          <div className="hero-badge">
            <Award size={15} />
            <span>IMPORTACIÓN DIRECTA CERTIFICADA · 100% ORIGINAL APPLE</span>
          </div>
          <h1>
            Tu Próximo Dispositivo Apple en Trujillo. <br />
            <span className="gradient-text">Sellado, con Garantía y Boleta SUNAT.</span>
          </h1>
          <p>
            Accede a los últimos lanzamientos de Apple (iPhone 16 Pro Max, MacBook Air M4, Apple Watch Series 10) traídos directamente desde Miami con entrega en nuestra tienda de Av. Larco o delivery verificado en Trujillo.
          </p>

          <div className="hero-cta-group">
            <a href="#catalogo" className="btn-hero-main">
              Ver Modelos Disponibles <ArrowRight size={17} />
            </a>
            <button 
              className="btn-hero-ghost"
              onClick={() => handleDirectCheckout(PRODUCTS[0])}
            >
              <CreditCard size={17} /> Demo Pasarela Yape (S/ 0.10)
            </button>
          </div>

          {/* Quick value badges */}
          <div className="hero-badges-strip">
            <div className="badge-item">
              <CheckCircle2 size={18} className="text-emerald" />
              <span>Garantía Oficial de 1 Año</span>
            </div>
            <div className="badge-item">
              <CheckCircle2 size={18} className="text-emerald" />
              <span>Boleta o Factura SUNAT</span>
            </div>
            <div className="badge-item">
              <CheckCircle2 size={18} className="text-emerald" />
              <span>Paga con Yape, Plin o Tarjetas</span>
            </div>
            <div className="badge-item">
              <CheckCircle2 size={18} className="text-emerald" />
              <span>Retiro en Tienda Av. Larco 840</span>
            </div>
          </div>
        </div>

        {/* Featured Hero Product Card */}
        <div className="landing-hero-preview">
          <div className="hero-product-card">
            <div className="hpc-badge">MÁS SOLICITADO EN TRUJILLO</div>
            <div className="hpc-image-wrap">
              <div className="apple-device-symbol">{PRODUCTS[0].image}</div>
              <div className="hpc-color-chip">{PRODUCTS[0].color}</div>
            </div>
            <h3>{PRODUCTS[0].name}</h3>
            <p className="hpc-desc">{PRODUCTS[0].tagline}</p>
            <div className="hpc-pricing">
              <span className="hpc-old">{money(PRODUCTS[0].originalPrice)}</span>
              <strong className="hpc-price">{money(PRODUCTS[0].price)}</strong>
              <small>o hasta 6 cuotas sin interés</small>
            </div>
            <div className="hpc-features">
              {PRODUCTS[0].specs.map((s, idx) => (
                <div key={idx}><Check size={14} className="text-emerald" /> {s}</div>
              ))}
            </div>
            <div className="hpc-actions">
              <button 
                className="btn-buy-now" 
                onClick={() => handleDirectCheckout(PRODUCTS[0])}
              >
                <CreditCard size={16} /> Comprar con Pasarela Yape / Plin
              </button>
              <button 
                className="btn-quote-now" 
                onClick={() => handleSelectProduct(PRODUCTS[0])}
              >
                Solicitar Cotización Personalizada
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Guarantee Section */}
      <section id="garantia" className="landing-trust-section">
        <div className="section-header-centered">
          <span className="section-eyebrow">POLUX CARE WARRANTY</span>
          <h2>¿Por qué comprar tu Apple en Polux Imports?</h2>
          <p>Ofrecemos seguridad jurídica, respaldo fiscal y servicio técnico local en la ciudad de Trujillo.</p>
        </div>

        <div className="trust-grid">
          <div className="trust-card">
            <div className="trust-icon"><ShieldCheck size={28} /></div>
            <h3>Garantía Oficial de Fábrica (1 Año)</h3>
            <p>Cada equipo cuenta con número de serie validable directamente en checkcoverage.apple.com. Emisión de póliza digital Polux Care.</p>
          </div>
          <div className="trust-card">
            <div className="trust-icon"><CreditCard size={28} /></div>
            <h3>Pasarela Multicanal Segura</h3>
            <p>Aceptamos Yape, Plin, Transferencias BCP/BBVA y tarjetas Visa/Mastercard con confirmación bancaria inmediata y boleta SUNAT.</p>
          </div>
          <div className="trust-card">
            <div className="trust-icon"><Truck size={28} /></div>
            <h3>Courier USA $\rightarrow$ Perú en 5-7 Días</h3>
            <p>Despacho directo desde Miami hasta nuestro almacén de Trujillo con declaración aduanera y tracking en tiempo real.</p>
          </div>
          <div className="trust-card">
            <div className="trust-icon"><Sparkles size={28} /></div>
            <h3>Programa "Apple Club" Trujillo</h3>
            <p>15% de descuento permanente en accesorios originales y prioridad para renovación anual al calificar como cliente promotor.</p>
          </div>
        </div>
      </section>

      {/* Catalog Section */}
      <section id="catalogo" className="landing-catalog-section">
        <div className="section-header-centered">
          <span className="section-eyebrow">CATÁLOGO OFICIAL APPLE 2026</span>
          <h2>Equipos Nuevos y Sellados Disponibles</h2>
          <p>Selecciona tu dispositivo favorito para solicitar tu cotización o probar la pasarela de pagos al instante.</p>
        </div>

        <div className="catalog-grid">
          {PRODUCTS.map((prod) => (
            <div 
              key={prod.id} 
              className={`catalog-card ${selectedProduct.id === prod.id ? 'selected' : ''}`}
            >
              <div className="catalog-top">
                <span className="catalog-category">{prod.category}</span>
                <span className="catalog-color">{prod.color}</span>
              </div>
              <div className="catalog-icon-box">{prod.image}</div>
              <h4>{prod.name}</h4>
              <p className="catalog-tagline">{prod.tagline}</p>
              
              <div className="catalog-specs">
                {prod.specs.slice(0, 3).map((sp, i) => (
                  <span key={i}><Check size={13} className="text-emerald" /> {sp}</span>
                ))}
              </div>

              <div className="catalog-footer">
                <div>
                  <small className="old-price">{money(prod.originalPrice)}</small>
                  <strong className="current-price">{money(prod.price)}</strong>
                </div>
                <div className="catalog-btns">
                  <button 
                    className="btn-icon-pay" 
                    onClick={() => handleDirectCheckout(prod)}
                    title="Pagar con Pasarela (Yape / Plin)"
                  >
                    <CreditCard size={15} /> Pagar
                  </button>
                  <button 
                    className="btn-select-quote"
                    onClick={() => handleSelectProduct(prod)}
                  >
                    Cotizar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quote & Lead Capture Form Section */}
      <section id="quote-section" className="landing-form-section">
        <div className="form-container-box">
          <div className="form-left-info">
            <span className="section-eyebrow">SOLICITUD FORMAL DE IMPORTACIÓN</span>
            <h2>Cotiza tu {selectedProduct.name}</h2>
            <p>
              Completa tus datos para recibir tu cotización formal con descuento preferencial por WhatsApp o correo. El sistema integrará tu solicitud al motor inteligente IMPULSE.
            </p>

            <div className="selected-summary-card">
              <div className="ssc-icon">{selectedProduct.image}</div>
              <div>
                <strong>{selectedProduct.name}</strong>
                <span>{selectedProduct.color} · Precio base: {money(selectedProduct.price)}</span>
                <small className="text-emerald"><CheckCircle2 size={13} /> Stock disponible en bodega Miami para despacho a Trujillo</small>
              </div>
            </div>

            <div className="pickup-notice">
              <MapPin size={18} className="text-primary" />
              <div>
                <strong>Retiro presencial o Delivery en Trujillo</strong>
                <p>Tienda Av. Larco 840, Víctor Larco Herrera. Atendemos de lunes a sábado de 9:00 am a 8:00 pm.</p>
              </div>
            </div>
          </div>

          <div className="form-right-card">
            {successLead ? (
              <div className="success-quote-screen">
                <div className="success-icon-badge"><CheckCircle2 size={42} /></div>
                <h3>¡Cotización Registrada con Éxito!</h3>
                <p>
                  Hola <strong>{successLead.firstName}</strong>, hemos registrado tu solicitud para el <strong>{successLead.mainProduct}</strong>.
                </p>
                <div className="lead-tracking-box">
                  <div><span>Código de Expediente:</span> <strong>POLUX-{successLead.id}</strong></div>
                  <div><span>Distrito de Entrega:</span> <strong>{successLead.district}</strong></div>
                  <div><span>Etapa en Plataforma:</span> <span className="tag-stage">{successLead.stage}</span></div>
                </div>

                <div className="success-actions">
                  <button 
                    className="btn-pay-now-full"
                    onClick={() => {
                      setModalPerson(successLead);
                      setShowPaymentModal(true);
                    }}
                  >
                    <CreditCard size={18} /> Proceder al Pago con Pasarela (Yape/Plin)
                  </button>
                  <button 
                    className="btn-view-erp"
                    onClick={() => nav(`/buyers/${successLead.id}`)}
                  >
                    Ver mi Expediente 360° en la Plataforma <ArrowRight size={15} />
                  </button>
                  <button 
                    className="btn-new-quote"
                    onClick={() => {
                      setSuccessLead(null);
                      setForm({
                        firstName: '',
                        lastName: '',
                        phone: '',
                        district: 'Víctor Larco Herrera',
                        documentNumber: '',
                        preferredChannel: 'WhatsApp',
                        paymentPreference: 'Yape / Plin',
                      });
                    }}
                  >
                    Hacer otra consulta
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitQuote}>
                <h3>Ingresa tus datos para la cotización</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Nombres *</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="Ej. Valeria" 
                      value={form.firstName} 
                      onChange={(e) => setForm({ ...form, firstName: e.target.value })} 
                    />
                  </div>
                  <div className="form-group">
                    <label>Apellidos</label>
                    <input 
                      type="text" 
                      placeholder="Ej. Mendoza García" 
                      value={form.lastName} 
                      onChange={(e) => setForm({ ...form, lastName: e.target.value })} 
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Teléfono / WhatsApp *</label>
                    <input 
                      type="tel" 
                      required 
                      placeholder="+51 944 620 118" 
                      value={form.phone} 
                      onChange={(e) => setForm({ ...form, phone: e.target.value })} 
                    />
                  </div>
                  <div className="form-group">
                    <label>DNI / Documento</label>
                    <input 
                      type="text" 
                      placeholder="8 dígitos" 
                      maxLength={8}
                      value={form.documentNumber} 
                      onChange={(e) => setForm({ ...form, documentNumber: e.target.value })} 
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Distrito en Trujillo *</label>
                    <select 
                      value={form.district} 
                      onChange={(e) => setForm({ ...form, district: e.target.value })}
                    >
                      <option>Víctor Larco Herrera</option>
                      <option>Trujillo Centro</option>
                      <option>Huanchaco</option>
                      <option>El Porvenir</option>
                      <option>La Esperanza</option>
                      <option>Moche</option>
                      <option>Laredo</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Modalidad de Pago Preferida</label>
                    <select 
                      value={form.paymentPreference} 
                      onChange={(e) => setForm({ ...form, paymentPreference: e.target.value })}
                    >
                      <option>Yape / Plin</option>
                      <option>Tarjeta de Crédito (Cuotas)</option>
                      <option>Transferencia BCP</option>
                      <option>Contado contra entrega</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Canal Preferido de Contacto</label>
                  <div className="radio-strip">
                    {['WhatsApp', 'Llamada telefónica', 'Email'].map((ch) => (
                      <label key={ch} className="radio-label">
                        <input 
                          type="radio" 
                          name="channel" 
                          checked={form.preferredChannel === ch} 
                          onChange={() => setForm({ ...form, preferredChannel: ch })} 
                        />
                        <span>{ch}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <button type="submit" className="btn-submit-quote" disabled={submitting}>
                  <Send size={16} /> {submitting ? 'Registrando en Plataforma…' : 'Solicitar Cotización y Descuento'}
                </button>
                <small className="privacy-note">
                  🔒 Tus datos están protegidos. Genera un expediente auditable en el modelo transaccional de Polux Imports.
                </small>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonios" className="landing-reviews-section">
        <div className="section-header-centered">
          <span className="section-eyebrow">CLIENTES SATISFECHOS EN TRUJILLO</span>
          <h2>Opiniones de Compradores Reales</h2>
          <p>Nuestra reputación se apoya en equipos 100% legítimos y cumplimiento estricto de los tiempos de entrega.</p>
        </div>

        <div className="reviews-grid">
          {REVIEWS.map((rev, i) => (
            <div key={i} className="review-card">
              <div className="review-stars">
                {Array.from({ length: rev.rating }).map((_, idx) => (
                  <Star key={idx} size={16} fill="#f59e0b" color="#f59e0b" />
                ))}
              </div>
              <p className="review-comment">"{rev.comment}"</p>
              <div className="review-author">
                <div className="author-avatar">{rev.name.charAt(0)}</div>
                <div>
                  <strong>{rev.name}</strong>
                  <span>{rev.district}, Trujillo · {rev.device}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer id="contacto" className="landing-footer">
        <div className="landing-footer-container">
          <div className="footer-col brand-col">
            <div className="landing-logo">
              <div className="landing-logo-icon"><ShieldCheck size={20} /></div>
              <div>
                <strong>POLUX IMPORTS S.A.C.</strong>
                <span>RUC: 20608912401</span>
              </div>
            </div>
            <p>
              Importación especializada de tecnología Apple para profesionales, universitarios y empresas de Trujillo y el norte peruano.
            </p>
            <div className="footer-address">
              <MapPin size={16} /> Av. Larco 840, Víctor Larco Herrera, Trujillo, La Libertad
            </div>
          </div>

          <div className="footer-col">
            <h4>Líneas de Producto</h4>
            <ul>
              <li>iPhone 16 Pro & Pro Max</li>
              <li>MacBook Air & Pro con Apple Silicon</li>
              <li>iPad Pro & iPad Air M3</li>
              <li>Apple Watch Ultra 2 & Series 10</li>
              <li>AirPods Max & AirPods Pro 2</li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Seguridad & Pagos</h4>
            <ul>
              <li>Pasarela Yape & Plin acreditada</li>
              <li>Boletas y Facturas Electrónicas SUNAT</li>
              <li>Póliza Polux Care 365 días</li>
              <li>Protocolo de entrega con serie oficial</li>
              <li>Mesa de ayuda postventa</li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Acceso a Plataforma</h4>
            <p>¿Eres parte del equipo comercial o de Inteligencia de Negocios?</p>
            <button className="btn-footer-erp" onClick={() => nav('/')}>
              Ingresar al Tablero de Gestión <ArrowRight size={15} />
            </button>
          </div>
        </div>

        <div className="footer-bottom-bar">
          <span>© 2026 Polux Imports S.A.C. — Universidad Nacional de Trujillo (Inteligencia de Negocios)</span>
          <span>Desarrollado para el ciclo de vida del cliente IMPULSE</span>
        </div>
      </footer>
    </div>
  );
}
