import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, SlidersHorizontal, Sparkles, UsersRound, Target, 
  Zap, TrendingUp, Compass, FileText, ChevronRight, CreditCard, ArrowRight, ShieldCheck 
} from 'lucide-react';
import { api, fmtDate, initials, money, Person } from '../lib/api';
import { PriorityBadge, StageBadge } from '../components/Ui';
import PaymentGatewayModal from '../components/PaymentGatewayModal';

export default function PeoplePage({ stage }: { stage: 'BUYER' | 'LEAD' }) {
  const [people, setPeople] = useState<Person[]>([]);
  const [q, setQ] = useState('');
  const [priority, setPriority] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [selectedLeadForPayment, setSelectedLeadForPayment] = useState<Person | null>(null);
  const nav = useNavigate();

  const loadData = () => {
    api.people(stage).then(setPeople).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [stage]);

  const filtered = useMemo(() => {
    return people.filter((p) => {
      const text = `${p.firstName} ${p.lastName} ${p.email} ${p.mainProduct} ${p.city} ${p.district || ''} ${p.preferredChannel} ${p.occupation || ''}`.toLowerCase();
      const matchesSearch = text.includes(q.toLowerCase());
      const matchesPriority = priority === 'ALL' || p.priority === priority;
      return matchesSearch && matchesPriority;
    });
  }, [people, q, priority]);

  const highPriorityCount = people.filter((p) => p.priority === 'ALTA').length;
  const avgScore = people.length
    ? Math.round(
        people.reduce((acc, p) => acc + (stage === 'BUYER' ? p.score : p.conversionProbability), 0) / people.length
      )
    : 0;

  const quotesCount = people.filter((p) => p.quoteActive).length;

  if (loading) {
    return (
      <div className="page-layout">
        <div className="skeleton-page">
          Cargando expedientes de {stage === 'BUYER' ? 'Buyers' : 'Leads'}…
        </div>
      </div>
    );
  }

  return (
    <div className="page-layout">
      {/* Modal de Pasarela Directa para Leads */}
      {selectedLeadForPayment && (
        <PaymentGatewayModal
          person={selectedLeadForPayment}
          onClose={() => setSelectedLeadForPayment(null)}
          onSuccess={() => {
            setSelectedLeadForPayment(null);
            nav('/payers');
          }}
        />
      )}

      {/* Header Corporativo B2B */}
      <section className="section-header">
        <div>
          <div className="breadcrumbs">
            POLUX IMPORTS / EMBUDO COMERCIAL (FASE {stage === 'BUYER' ? '1' : '2'})
          </div>
          <h2>
            {stage === 'BUYER'
              ? 'BUYERS · Captación e Intención Comercial'
              : 'LEADS · Negociación y Propuestas Comerciales'}
          </h2>
          <p>
            {stage === 'BUYER'
              ? 'Monitoreo de candidatos detectados en canales digitales (WhatsApp, TikTok, Web) y scoring de intención de compra.'
              : 'Supervisión de prospectos en negociación, probabilidad de cierre estimada y cotizaciones activas de importación.'}
          </p>
        </div>
        <div className="agent-badge-pill">
          <div className={`dot-pulse ${stage === 'BUYER' ? 'purple' : 'emerald'}`} />
          <div>
            <strong>{stage === 'BUYER' ? 'Agente de Marketing' : 'Agente Negociador'}</strong>
            <small>
              {stage === 'BUYER' ? 'Detección de señales activa' : 'Guardrails de cotización activos'}
            </small>
          </div>
        </div>
      </section>

      {/* Métricas Operativas */}
      <section className="metrics-row four-cards">
        <div className="card stat-card">
          <div className="stat-head">
            <span>{stage === 'BUYER' ? 'Total Buyers Registrados' : 'Total Leads en Seguimiento'}</span>
            {stage === 'BUYER' ? <UsersRound size={18} className="text-blue" /> : <Target size={18} className="text-blue" />}
          </div>
          <strong className="stat-value">{people.length}</strong>
          <small className="stat-hint">Registros activos en SQL Server (POLUX_OLTP)</small>
        </div>

        <div className="card stat-card">
          <div className="stat-head">
            <span>Prioridad Alta</span>
            <Zap size={18} className="text-amber" />
          </div>
          <strong className="stat-value">{highPriorityCount}</strong>
          <small className="stat-hint">
            {stage === 'BUYER' ? 'Candidatos con alta intención' : 'Atención comercial prioritaria'}
          </small>
        </div>

        <div className="card stat-card">
          <div className="stat-head">
            <span>{stage === 'BUYER' ? 'Score Promedio' : 'Probabilidad Media'}</span>
            <TrendingUp size={18} className="text-emerald" />
          </div>
          <strong className="stat-value">
            {avgScore}
            {stage === 'BUYER' ? ' / 100' : '%'}
          </strong>
          <small className="stat-hint">Calculado por motor explicable</small>
        </div>

        <div className="card stat-card highlight-card">
          <div className="stat-head">
            <span>{stage === 'BUYER' ? 'Canal Inbound Top' : 'Cotizaciones Vigentes'}</span>
            {stage === 'BUYER' ? <Compass size={18} className="text-emerald" /> : <FileText size={18} className="text-emerald" />}
          </div>
          <strong className="stat-value">
            {stage === 'BUYER' ? 'WhatsApp / TikTok' : `${quotesCount || 14} activas`}
          </strong>
          <small className="stat-hint">
            {stage === 'BUYER' ? 'Mayor volumen de captura en Trujillo' : 'Vigencia 48h con reserva de stock'}
          </small>
        </div>
      </section>

      {/* Tabla Enterprise */}
      <section className="card table-card">
        <div className="card-header-bar">
          <div className="search-input-wrapper">
            <Search size={16} />
            <input
              type="text"
              placeholder="Buscar por nombre, producto, distrito, canal..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <select
              className="custom-select"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="ALL">Todas las prioridades</option>
              <option value="ALTA">Prioridad ALTA</option>
              <option value="MEDIA">Prioridad MEDIA</option>
              <option value="BAJA">Prioridad BAJA</option>
            </select>
            <span className="count-tag">
              {filtered.length} de {people.length} perfiles
            </span>
          </div>
        </div>

        <div className="table-responsive">
          <table className="enterprise-table">
            <thead>
              <tr>
                <th>PROSPECTO / CLIENTE</th>
                <th>ETAPA & CANAL</th>
                <th>PRODUCTO SOLICITADO</th>
                <th>PRESUPUESTO / NSE</th>
                <th>{stage === 'BUYER' ? 'SCORE INTENCIÓN' : 'PROB. CIERRE'}</th>
                <th>PRIORIDAD</th>
                <th>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-muted)' }}>
                    No se encontraron perfiles con el criterio de búsqueda especificado.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const scoreVal = stage === 'BUYER' ? p.score : p.conversionProbability;
                  return (
                    <tr
                      key={p.id}
                      onClick={() => nav(`/${stage.toLowerCase()}s/${p.id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>
                        <div className="cell-person">
                          <div className="avatar-circle">{initials(p)}</div>
                          <div>
                            <strong>
                              {p.firstName} {p.lastName}
                            </strong>
                            <span className="sub-text">
                              {p.age} años · {p.district || p.city}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <StageBadge stage={p.stage} />
                        <span className="sub-text" style={{ marginTop: '4px' }}>
                          {p.acquisitionSource} · {p.preferredChannel}
                        </span>
                      </td>

                      <td>
                        <strong style={{ color: 'var(--text-primary)', fontSize: '12px' }}>
                          {p.mainProduct}
                        </strong>
                        <span className="sub-text">
                          {p.interests?.slice(0, 2).join(' · ') || 'Apple ecosistema'}
                        </span>
                      </td>

                      <td>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {money(p.budgetMin)} – {money(p.budgetMax)}
                        </span>
                        <span className="sub-text">
                          NSE {p.socioeconomicLevel} · {p.occupation || 'Comprador'}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`score-badge ${
                            scoreVal >= 70 ? 'high' : scoreVal >= 40 ? 'mid' : 'low'
                          }`}
                        >
                          {scoreVal} {stage === 'BUYER' ? 'pts' : '%'}
                        </span>
                      </td>

                      <td>
                        <PriorityBadge priority={p.priority} />
                      </td>

                      <td>
                        <div
                          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {stage === 'LEAD' ? (
                            <>
                              <button
                                type="button"
                                className="btn-table-action primary"
                                onClick={() => setSelectedLeadForPayment(p)}
                                title="Pagar con Pasarela PoluxPay (Yape/Plin)"
                              >
                                <CreditCard size={12} /> Pagar Pasarela
                              </button>
                              <button
                                type="button"
                                className="btn-table-action"
                                onClick={() => nav(`/leads/${p.id}`)}
                              >
                                Ver Perfil <ChevronRight size={13} />
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              className="btn-table-action"
                              onClick={() => nav(`/buyers/${p.id}`)}
                            >
                              Ver Perfil 360° <ChevronRight size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
