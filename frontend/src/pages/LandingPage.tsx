import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck, Smartphone, Laptop, Watch, Headphones, Tablet,
  CheckCircle2, ChevronRight, CreditCard, MapPin, Star, Truck,
  Sparkles, Receipt, LayoutDashboard, Send, Lock,
} from 'lucide-react';
import { api, money } from '../lib/api';
import PaymentGatewayModal from '../components/PaymentGatewayModal';
import './landing-apple.css';

type Product = {
  id: string; name: string; short: string; category: string; tagline: string;
  price: number; originalPrice: number; icon: any; color: string; tone: string; specs: string[];
};

const PRODUCTS: Product[] = [
  { id: 'iphone-16-pro-max', name: 'iPhone 16 Pro Max 256 GB', short: 'iPhone 16 Pro', category: 'iPhone',
    tagline: 'Titanio. Chip A18 Pro. Control de Cámara.', price: 6599, originalPrice: 7299, icon: Smartphone,
    color: 'Titanio Natural', tone: 'dark',
    specs: ['Pantalla Super Retina XDR de 6.9"', 'Cámara Fusion de 48 MP y zoom 5x', 'Hasta 33 horas de video', 'Sellado de fábrica Apple USA'] },
  { id: 'iphone-16', name: 'iPhone 16 128 GB', short: 'iPhone 16', category: 'iPhone',
    tagline: 'Botón de Acción. Chip A18. Colores intensos.', price: 4299, originalPrice: 4799, icon: Smartphone,
    color: 'Azul Ultramarino', tone: 'light',
    specs: ['Pantalla OLED de 6.1"', 'Cámara dual de 48 MP', 'Audio Espacial', 'Garantía oficial de 1 año'] },
  { id: 'macbook-air-m4', name: 'MacBook Air 13" Chip M4', short: 'MacBook Air', category: 'Mac',
    tagline: 'Ligera. Potente. Con chip M4.', price: 5499, originalPrice: 6199, icon: Laptop,
    color: 'Medianoche', tone: 'light',
    specs: ['Pantalla Liquid Retina 13.6"', 'Hasta 18 horas de batería', '16 GB de memoria unificada', 'MagSafe 3 incluido'] },
  { id: 'ipad-air-m3', name: 'iPad Air 11" Chip M3 128 GB', short: 'iPad Air', category: 'iPad',
    tagline: 'Para estudiar, diseñar y crear.', price: 3199, originalPrice: 3599, icon: Tablet,
    color: 'Gris Espacial', tone: 'light',
    specs: ['Pantalla Liquid Retina', 'Cámara frontal horizontal 12 MP', 'Compatible con Apple Pencil Pro', 'Wi-Fi 6E'] },
  { id: 'apple-watch-s10', name: 'Apple Watch Series 10 46 mm', short: 'Apple Watch', category: 'Watch',
    tagline: 'El más delgado. Pantalla más grande.', price: 2199, originalPrice: 2499, icon: Watch,
    color: 'Negro Azabache', tone: 'dark',
    specs: ['Pantalla OLED gran angular', 'ECG y detección de apnea', 'Carga al 80% en 30 min', 'Resistente al agua 50 m'] },
  { id: 'airpods-pro-2', name: 'AirPods Pro 2 (USB-C)', short: 'AirPods Pro', category: 'AirPods',
    tagline: 'Cancelación de ruido 2x. Audio Adaptativo.', price: 1099, originalPrice: 1299, icon: Headphones,
    color: 'Blanco', tone: 'light',
    specs: ['Chip H2', 'Estuche MagSafe con altavoz', 'Modo Ambiente inteligente', 'Hasta 30 horas con estuche'] },
];

const CATEGORIES = [
  { label: 'iPhone', icon: Smartphone }, { label: 'Mac', icon: Laptop }, { label: 'iPad', icon: Tablet },
  { label: 'Watch', icon: Watch }, { label: 'AirPods', icon: Headphones },
];

const REVIEWS = [
  { name: 'Valeria M.', district: 'Víctor Larco Herrera', device: 'iPhone 16 Pro Max',
    comment: 'Recogí en Av. Larco con la caja sellada y validamos el número de serie de Apple en el momento.' },
  { name: 'Mateo B.', district: 'Huanchaco', device: 'MacBook Air M4',
    comment: 'La importación desde Miami tardó los 6 días prometidos. La boleta SUNAT llegó al instante.' },
  { name: 'Camila P.', district: 'Trujillo Centro', device: 'Apple Watch Series 10',
    comment: 'Atención impecable y me activaron Apple Club con 15% en mi siguiente accesorio.' },
];

const EMPTY_FORM = {
  firstName: '', lastName: '', phone: '', district: 'Víctor Larco Herrera',
  documentNumber: '', preferredChannel: 'WhatsApp', paymentPreference: 'Yape / Plin',
};

export default function LandingPage() {
  const nav = useNavigate();
  const [selected, setSelected] = useState<Product>(PRODUCTS[0]);
  const [filter, setFilter] = useState<string>('Todos');
  const [modalPerson, setModalPerson] = useState<any>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successLead, setSuccessLead] = useState<any>(null);
  const [scrolled, setScrolled] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const chooseForQuote = (p: Product) => { setSelected(p); setSuccessLead(null); scrollTo('cotizar'); };

  const buyNow = (p: Product) => setModalPerson({
    id: 9999, firstName: 'Comprador', lastName: 'Trujillo', email: 'comprador.demo@polux.pe',
    mainProduct: p.name, quotes: [{ amount: p.price, code: 'POLUX-WEB-2026', product: p.name }],
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.firstName.trim() || !form.phone.trim()) { setError('Ingresa tu nombre y tu número de WhatsApp.'); return; }
    if (form.documentNumber && !/^\d{8}$/.test(form.documentNumber)) { setError('El DNI debe tener 8 dígitos.'); return; }
    setSubmitting(true);
    try {
      const created = await api.createPerson({
        firstName: form.firstName.trim(), lastName: form.lastName.trim() || 'Trujillo', phone: form.phone.trim(),
        district: form.district, documentNumber: form.documentNumber || undefined, mainProduct: selected.name,
        budgetMin: Math.round(selected.price * 0.9), budgetMax: Math.round(selected.price * 1.1),
        paymentPreference: form.paymentPreference, preferredChannel: form.preferredChannel,
        acquisitionSource: 'Landing page oficial', stage: 'BUYER',
      });
      setSuccessLead(created);
    } catch (err: any) {
      setError('No pudimos registrar tu solicitud. Verifica tu conexión e inténtalo nuevamente.');
      console.error(err);
    } finally { setSubmitting(false); }
  };

  const visible = filter === 'Todos' ? PRODUCTS : PRODUCTS.filter(p => p.category === filter);
  const HeroIcon = PRODUCTS[0].icon;

  return (
    <div className="apl">
      {modalPerson && (
        <PaymentGatewayModal
          person={modalPerson}
          onClose={() => setModalPerson(null)}
          onSuccess={() => { setModalPerson(null); setToast('Pago validado. Se emitió tu comprobante electrónico.'); setTimeout(() => setToast(''), 4000); }}
        />
      )}
      {toast && <div className="apl-toast"><CheckCircle2 size={16} /> {toast}</div>}

      {/* Global nav */}
      <header className={`apl-nav ${scrolled ? 'is-scrolled' : ''}`}>
        <div className="apl-nav-inner">
          <button className="apl-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Inicio">
            <ShieldCheck size={16} /> Polux
          </button>
          <nav className="apl-nav-links">
            <button onClick={() => scrollTo('tienda')}>Tienda</button>
            {CATEGORIES.map(c => <button key={c.label} onClick={() => { setFilter(c.label); scrollTo('tienda'); }}>{c.label}</button>)}
            <button onClick={() => scrollTo('por-que')}>Garantía</button>
            <button onClick={() => scrollTo('visitanos')}>Visítanos</button>
          </nav>
          <button className="apl-nav-erp" onClick={() => nav('/')} title="Ir a la plataforma de gestión">
            <LayoutDashboard size={14} /> Plataforma
          </button>
        </div>
      </header>

      {/* Ribbon */}
      <div className="apl-ribbon">
        Importación directa desde Apple USA con boleta SUNAT y garantía de 1 año.{' '}
        <button onClick={() => scrollTo('cotizar')}>Cotiza ahora <ChevronRight size={12} /></button>
      </div>

      {/* Hero */}
      <section className="apl-hero">
        <p className="apl-eyebrow">Nuevo</p>
        <h1>iPhone 16 Pro</h1>
        <p className="apl-hero-sub">Hello, Apple Intelligence. Ahora en Trujillo.</p>
        <p className="apl-hero-price">Desde {money(PRODUCTS[0].price)} o en cuotas sin intereses.</p>
        <div className="apl-cta-row">
          <button className="apl-btn" onClick={() => chooseForQuote(PRODUCTS[0])}>Cotizar</button>
          <button className="apl-btn apl-btn-ghost" onClick={() => buyNow(PRODUCTS[0])}>Comprar <ChevronRight size={15} /></button>
        </div>
        <div className="apl-hero-visual" aria-hidden>
          <div className="apl-device"><HeroIcon size={120} strokeWidth={0.9} /></div>
        </div>
      </section>

      {/* Category strip */}
      <section className="apl-cats">
        {CATEGORIES.map(c => (
          <button key={c.label} className="apl-cat" onClick={() => { setFilter(c.label); scrollTo('tienda'); }}>
            <c.icon size={34} strokeWidth={1.2} />
            <span>{c.label}</span>
          </button>
        ))}
      </section>

      {/* Two feature tiles */}
      <section className="apl-tiles">
        {[PRODUCTS[2], PRODUCTS[4]].map(p => (
          <article key={p.id} className={`apl-tile tone-${p.tone}`}>
            <h2>{p.short}</h2>
            <p>{p.tagline}</p>
            <div className="apl-cta-row">
              <button className="apl-btn apl-btn-sm" onClick={() => chooseForQuote(p)}>Cotizar</button>
              <button className="apl-btn apl-btn-ghost apl-btn-sm" onClick={() => buyNow(p)}>Comprar <ChevronRight size={14} /></button>
            </div>
            <div className="apl-tile-visual"><p.icon size={96} strokeWidth={0.9} /></div>
          </article>
        ))}
      </section>

      {/* Store */}
      <section id="tienda" className="apl-section">
        <div className="apl-section-head">
          <h2>Tienda. <span>La mejor forma de comprar tu Apple en Trujillo.</span></h2>
          <div className="apl-filters" role="tablist">
            {['Todos', ...CATEGORIES.map(c => c.label)].map(f => (
              <button key={f} role="tab" aria-selected={filter === f} className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>{f}</button>
            ))}
          </div>
        </div>
        <div className="apl-grid">
          {visible.length === 0 && <p className="apl-empty">No hay modelos disponibles en esta categoría por ahora.</p>}
          {visible.map(p => (
            <article key={p.id} className={`apl-card ${selected.id === p.id ? 'is-selected' : ''}`}>
              <span className="apl-card-kicker">{p.color}</span>
              <h3>{p.name}</h3>
              <p className="apl-card-tag">{p.tagline}</p>
              <div className="apl-card-visual"><p.icon size={72} strokeWidth={1} /></div>
              <ul>{p.specs.slice(0, 3).map(s => <li key={s}>{s}</li>)}</ul>
              <div className="apl-card-foot">
                <div>
                  <s>{money(p.originalPrice)}</s>
                  <strong>{money(p.price)}</strong>
                </div>
                <div className="apl-card-actions">
                  <button className="apl-btn apl-btn-sm" onClick={() => buyNow(p)}>Comprar</button>
                  <button className="apl-link" onClick={() => chooseForQuote(p)}>Cotizar <ChevronRight size={13} /></button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Why Polux */}
      <section id="por-que" className="apl-section apl-gray">
        <div className="apl-section-head"><h2>¿Por qué Polux? <span>Comprar Apple con total confianza.</span></h2></div>
        <div className="apl-why">
          {[
            { icon: ShieldCheck, t: 'Garantía oficial de 1 año', d: 'Número de serie verificable en checkcoverage.apple.com y póliza Polux Care.' },
            { icon: Receipt, t: 'Boleta o factura SUNAT', d: 'Comprobante electrónico emitido al validar tu pago.' },
            { icon: CreditCard, t: 'Paga como prefieras', d: 'Yape, Plin, transferencia BCP/BBVA o tarjeta en cuotas.' },
            { icon: Truck, t: 'De Miami a Trujillo en 5–7 días', d: 'Seguimiento en tiempo real hasta nuestra tienda o tu puerta.' },
            { icon: Sparkles, t: 'Apple Club Polux', d: '15% de descuento permanente en accesorios originales.' },
            { icon: MapPin, t: 'Tienda física', d: 'Av. Larco 840, Víctor Larco. Lunes a sábado, 9:00 a 20:00.' },
          ].map(w => (
            <div key={w.t} className="apl-why-card">
              <w.icon size={28} strokeWidth={1.4} />
              <h3>{w.t}</h3>
              <p>{w.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Quote form */}
      <section id="cotizar" className="apl-section">
        <div className="apl-quote">
          <div className="apl-quote-info">
            <p className="apl-eyebrow">Cotización personalizada</p>
            <h2>Cotiza tu {selected.short}.</h2>
            <p className="apl-muted">Te enviamos tu precio final en soles, puesto en Trujillo, por WhatsApp en minutos.</p>
            <div className="apl-summary">
              <div className="apl-summary-icon"><selected.icon size={30} strokeWidth={1.2} /></div>
              <div>
                <strong>{selected.name}</strong>
                <span>{selected.color} · {money(selected.price)}</span>
              </div>
            </div>
            <label className="apl-field">
              <span>Cambiar modelo</span>
              <select value={selected.id} onChange={e => setSelected(PRODUCTS.find(p => p.id === e.target.value) || PRODUCTS[0])}>
                {PRODUCTS.map(p => <option key={p.id} value={p.id}>{p.name} — {money(p.price)}</option>)}
              </select>
            </label>
          </div>

          <div className="apl-quote-card">
            {successLead ? (
              <div className="apl-success">
                <CheckCircle2 size={44} strokeWidth={1.4} />
                <h3>Solicitud recibida.</h3>
                <p>Gracias, {successLead.firstName}. Un asesor te escribirá por {form.preferredChannel} sobre tu {successLead.mainProduct}.</p>
                <dl>
                  <div><dt>Expediente</dt><dd>POLUX-{successLead.id}</dd></div>
                  <div><dt>Distrito</dt><dd>{successLead.district}</dd></div>
                  <div><dt>Estado</dt><dd>{successLead.stage}</dd></div>
                </dl>
                <button className="apl-btn apl-btn-block" onClick={() => setModalPerson(successLead)}>Pagar ahora</button>
                <button className="apl-link" onClick={() => nav(`/buyers/${successLead.id}`)}>Ver expediente en la plataforma <ChevronRight size={13} /></button>
                <button className="apl-link" onClick={() => { setSuccessLead(null); setForm(EMPTY_FORM); }}>Hacer otra consulta</button>
              </div>
            ) : (
              <form onSubmit={submit} noValidate>
                <div className="apl-row">
                  <label className="apl-field"><span>Nombres *</span>
                    <input value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} placeholder="Valeria" autoComplete="given-name" /></label>
                  <label className="apl-field"><span>Apellidos</span>
                    <input value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} placeholder="Mendoza García" autoComplete="family-name" /></label>
                </div>
                <div className="apl-row">
                  <label className="apl-field"><span>WhatsApp *</span>
                    <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+51 944 620 118" autoComplete="tel" /></label>
                  <label className="apl-field"><span>DNI</span>
                    <input inputMode="numeric" maxLength={8} value={form.documentNumber} onChange={e => setForm({ ...form, documentNumber: e.target.value.replace(/\D/g, '') })} placeholder="8 dígitos" /></label>
                </div>
                <div className="apl-row">
                  <label className="apl-field"><span>Distrito</span>
                    <select value={form.district} onChange={e => setForm({ ...form, district: e.target.value })}>
                      {['Víctor Larco Herrera', 'Trujillo Centro', 'Huanchaco', 'El Porvenir', 'La Esperanza', 'Moche', 'Laredo'].map(d => <option key={d}>{d}</option>)}
                    </select></label>
                  <label className="apl-field"><span>Forma de pago</span>
                    <select value={form.paymentPreference} onChange={e => setForm({ ...form, paymentPreference: e.target.value })}>
                      {['Yape / Plin', 'Tarjeta de Crédito (Cuotas)', 'Transferencia BCP', 'Contado contra entrega'].map(d => <option key={d}>{d}</option>)}
                    </select></label>
                </div>
                <div className="apl-field"><span>¿Cómo te contactamos?</span>
                  <div className="apl-seg">
                    {['WhatsApp', 'Llamada', 'Email'].map(ch => (
                      <button type="button" key={ch} className={form.preferredChannel === ch ? 'active' : ''} onClick={() => setForm({ ...form, preferredChannel: ch })}>{ch}</button>
                    ))}
                  </div>
                </div>
                {error && <p className="apl-error" role="alert">{error}</p>}
                <button type="submit" className="apl-btn apl-btn-block" disabled={submitting}>
                  <Send size={15} /> {submitting ? 'Enviando…' : 'Solicitar cotización'}
                </button>
                <p className="apl-fine"><Lock size={11} /> Tus datos se usan únicamente para atender tu solicitud.</p>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="apl-section apl-gray">
        <div className="apl-section-head"><h2>Lo que dicen en Trujillo.</h2></div>
        <div className="apl-reviews">
          {REVIEWS.map(r => (
            <figure key={r.name} className="apl-review">
              <div className="apl-stars">{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={14} fill="currentColor" />)}</div>
              <blockquote>“{r.comment}”</blockquote>
              <figcaption><strong>{r.name}</strong> · {r.district} · {r.device}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer id="visitanos" className="apl-footer">
        <div className="apl-footer-inner">
          <p className="apl-footer-note">Precios en soles (PEN) incluyen IGV. Equipos nuevos, sellados e importados directamente de Apple USA. Apple, iPhone, Mac, iPad, Apple Watch y AirPods son marcas de Apple Inc.</p>
          <div className="apl-footer-cols">
            <div><h4>Comprar</h4>{CATEGORIES.map(c => <button key={c.label} onClick={() => { setFilter(c.label); scrollTo('tienda'); }}>{c.label}</button>)}</div>
            <div><h4>Servicios</h4><span>Polux Care 365</span><span>Boletas y facturas SUNAT</span><span>Apple Club Polux</span><span>Soporte postventa</span></div>
            <div><h4>Visítanos</h4><span>Av. Larco 840, Víctor Larco Herrera</span><span>Trujillo, La Libertad</span><span>Lun–Sáb · 9:00–20:00</span></div>
            <div><h4>Equipo interno</h4><button onClick={() => nav('/')}>Plataforma de gestión</button><button onClick={() => nav('/analytics')}>BI Analytics</button></div>
          </div>
          <div className="apl-footer-bottom">
            <span>Copyright © 2026 Polux Imports S.A.C. · RUC 20608912401</span>
            <span>Universidad Nacional de Trujillo · Inteligencia de Negocios</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
