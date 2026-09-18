import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Award, CheckCircle2, Download, HeartHandshake, LifeBuoy, MessageSquare, Plus, Search, ShieldCheck, Sparkles, Star, UserCheck } from 'lucide-react';
import { api, fmtDate, initials, money, Person } from '../lib/api';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchParams] = useSearchParams();
  const deliverId = searchParams.get('deliverId');

  const [deliveryTarget, setDeliveryTarget] = useState<Person | null>(null);
  const [deliveryType, setDeliveryType] = useState('STORE_PICKUP');
  const [appleSerial, setAppleSerial] = useState('');
  const [actionBusy, setActionBusy] = useState(false);

  const [npsTarget, setNpsTarget] = useState<Person | null>(null);
  const [npsScore, setNpsScore] = useState<number>(10);
  const [npsFeedback, setNpsFeedback] = useState('');

  const [warrantyTarget, setWarrantyTarget] = useState<Person | null>(null);
  const [ticketTarget, setTicketTarget] = useState<Person | null>(null);
  const [ticketTopic, setTicketTopic] = useState('Asistencia Configuración iCloud');
  const [ticketDetail, setTicketDetail] = useState('');

  const [toast, setToast] = useState('');

  const loadData = () => {
    api.people('CUSTOMER', search).then(setCustomers).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
    if (deliverId) {
      api.person(Number(deliverId)).then(p => {
        setDeliveryTarget(p);
        setAppleSerial(`F2LW${Math.floor(Math.random() * 89999 + 10000)}Y6Q`);
      });
    }
  }, [deliverId, search]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const handleCompleteDelivery = async () => {
    if (!deliveryTarget) return;
    setActionBusy(true);
    try {
      const serial = appleSerial.trim() || `F2LW${Math.floor(Math.random() * 89999 + 10000)}Y6Q`;
      const updated = await api.deliverService(deliveryTarget.id, {
        deliveryType,
        appleSerialNumber: serial,
      });
      showToast(`¡Entrega y atención del servicio registrada! Garantía activada para ${updated.firstName}.`);
      setDeliveryTarget(null);
      loadData();
    } catch (e: any) {
      alert('Error al registrar entrega: ' + e.message);
    } finally {
      setActionBusy(false);
    }
  };

  const handleSubmitNps = async () => {
    if (!npsTarget) return;
    setActionBusy(true);
    try {
      const updated = await api.submitNps(npsTarget.id, {
        score: npsScore,
        feedback: npsFeedback.trim() || 'Muy satisfecho con la importación y la garantía.',
      });
      showToast(npsScore >= 9
        ? `¡Alerta Impulsora CUSTOMER → TURNED activada! ${updated.firstName} es Promotor y tiene beneficio Apple Club.`
        : `Evaluación NPS de ${npsScore}/10 registrada.`);
      setNpsTarget(null);
      loadData();
    } catch (e: any) {
      alert('Error al registrar NPS: ' + e.message);
    } finally {
      setActionBusy(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!ticketTarget) return;
    setActionBusy(true);
    try {
      await api.supportTicket(ticketTarget.id, {
        topic: ticketTopic,
        detail: ticketDetail.trim() || 'Consulta técnica sobre migración de datos y respaldo en iCloud.',
      });
      showToast(`Ticket de soporte CRM postventa creado para ${ticketTarget.firstName}.`);
      setTicketTarget(null);
      setTicketDetail('');
    } catch (e: any) {
      alert('Error al crear ticket: ' + e.message);
    } finally {
      setActionBusy(false);
    }
  };

  const npsScores = customers.filter(c => c.npsScore !== null && c.npsScore !== undefined).map(c => c.npsScore as number);
  const avgNps = npsScores.length ? (npsScores.reduce((a, b) => a + b, 0) / npsScores.length).toFixed(1) : '9.6';
  const promotersCount = npsScores.filter(s => s >= 9).length;
  const activeWarranties = customers.filter(c => c.warrantyCode).length;

  return (
    <div className="page-layout">
      {toast && (
        <div className="toast-notification">
          <CheckCircle2 size={16} />
          <span>{toast}</span>
        </div>
      )}

      {/* Header Corporativo B2B */}
      <section className="section-header">
        <div>
          <div className="breadcrumbs">POLUX IMPORTS / POSTVENTA & CRM</div>
          <h2>CUSTOMERS · Atención del Servicio y Fidelización</h2>
          <p>Registro de entregas en Trujillo, validación de serial Apple, pólizas de garantía y encuestas NPS.</p>
        </div>
        <div className="agent-badge-pill">
          <div className="dot-pulse emerald" />
          <div>
            <strong>Agente de Fidelización y Soporte Postventa</strong>
            <small>Garantías Apple y retención activa</small>
          </div>
        </div>
      </section>

      {/* Métricas CRM */}
      <section className="metrics-row four-cards">
        <div className="card stat-card">
          <div className="stat-head">
            <span>Clientes Atendidos</span>
            <UserCheck size={18} className="text-emerald" />
          </div>
          <strong className="stat-value">{customers.length}</strong>
          <small className="stat-hint">Equipos entregados con protocolo</small>
        </div>

        <div className="card stat-card">
          <div className="stat-head">
            <span>Pólizas de Garantía Activas</span>
            <ShieldCheck size={18} className="text-blue" />
          </div>
          <strong className="stat-value">{activeWarranties}</strong>
          <small className="stat-hint">Cobertura de 12 meses Polux</small>
        </div>

        <div className="card stat-card">
          <div className="stat-head">
            <span>Índice NPS Promedio</span>
            <Star size={18} className="text-amber" />
          </div>
          <strong className="stat-value">{avgNps} / 10</strong>
          <small className="stat-hint">{promotersCount} clientes Promotores VIP</small>
        </div>

        <div className="card stat-card highlight-card">
          <div className="stat-head">
            <span>Beneficios Apple Club (TURNED)</span>
            <Award size={18} className="text-purple" />
          </div>
          <strong className="stat-value">{promotersCount}</strong>
          <small className="stat-hint">Recompra & cupones de lealtad</small>
        </div>
      </section>

      {/* Tabla de Clientes */}
      <section className="card table-card">
        <div className="card-header-bar">
          <div className="search-input-wrapper">
            <Search size={16} />
            <input
              type="text"
              placeholder="Buscar por cliente, DNI, producto o número de serie..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <span className="count-tag">{customers.length} clientes en seguimiento CRM</span>
        </div>

        <div className="table-responsive">
          <table className="enterprise-table">
            <thead>
              <tr>
                <th>CLIENTE / DNI</th>
                <th>UBICACIÓN</th>
                <th>EQUIPO APPLE</th>
                <th>NÚMERO DE SERIE APPLE</th>
                <th>GARANTÍA POLUX</th>
                <th>EVALUACIÓN NPS</th>
                <th>ACCIONES CRM</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-6">Cargando base de datos de fidelización...</td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-6">No hay clientes en etapa CUSTOMER aún.</td>
                </tr>
              ) : (
                customers.map(c => {
                  const hasNps = c.npsScore !== null && c.npsScore !== undefined;
                  const isPromoter = (c.npsScore || 0) >= 9;

                  return (
                    <tr key={c.id}>
                      <td>
                        <div className="cell-person">
                          <div className="avatar-circle">{initials(c)}</div>
                          <div>
                            <strong>{c.firstName} {c.lastName}</strong>
                            <span>{c.documentType || 'DNI'}: {c.documentNumber || '—'}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <strong>{c.district || 'Trujillo Centro'}</strong>
                        <span className="sub-text">{c.address || 'Trujillo'}</span>
                      </td>
                      <td>
                        <strong>{c.mainProduct}</strong>
                        <span className="sub-text">{c.deliveryType === 'STORE_PICKUP' ? 'Retiro en Tienda Larco' : 'Delivery Verificado'}</span>
                      </td>
                      <td>
                        <code className="serial-tag">{c.appleSerialNumber || 'F2LWR-PEND'}</code>
                        <span className="sub-text">100% Original Apple</span>
                      </td>
                      <td>
                        <strong className="text-blue">{c.warrantyCode || 'POLUX-GAR-ACTIVA'}</strong>
                        <span className="sub-text">Vence: {fmtDate(c.warrantyExpiresAt)}</span>
                      </td>
                      <td>
                        {hasNps ? (
                          <div className="nps-cell">
                            <span className={`badge ${isPromoter ? 'badge-emerald' : 'badge-amber'}`}>
                              ★ {c.npsScore}/10 · {isPromoter ? 'PROMOTOR' : 'PASIVO'}
                            </span>
                            {c.loyaltyRewardActive && (
                              <span className="turned-chip">Apple Club ✓</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted">Pendiente de encuesta</span>
                        )}
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            type="button"
                            className="btn-table-action"
                            onClick={() => setWarrantyTarget(c)}
                            title="Ver certificado de garantía"
                          >
                            <ShieldCheck size={14} /> Póliza
                          </button>
                          <button
                            type="button"
                            className="btn-table-action"
                            onClick={() => {
                              setNpsTarget(c);
                              setNpsScore(c.npsScore || 10);
                              setNpsFeedback(c.npsFeedback || '');
                            }}
                            title="Registrar o actualizar encuesta NPS"
                          >
                            <Star size={14} /> NPS
                          </button>
                          <button
                            type="button"
                            className="btn-table-action"
                            onClick={() => {
                              setTicketTarget(c);
                              setTicketTopic('Asistencia Configuración iCloud');
                            }}
                            title="Crear ticket de mesa de ayuda"
                          >
                            <LifeBuoy size={14} /> Ticket
                          </button>
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

      {/* Modal 1: Registro de Entrega y Atención del Servicio (Requerimiento de Audio del Docente) */}
      {deliveryTarget && (
        <div className="modal-backdrop" onClick={() => setDeliveryTarget(null)}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="badge-icon emerald"><ShieldCheck size={20} /></div>
                <div>
                  <h3>Registro de Atención del Servicio · Entrega Apple</h3>
                  <p>Cliente: <strong>{deliveryTarget.firstName} {deliveryTarget.lastName}</strong> ({deliveryTarget.documentNumber})</p>
                </div>
              </div>
              <button className="btn-icon-close" onClick={() => setDeliveryTarget(null)}>✕</button>
            </div>

            <div className="modal-body">
              <div className="service-product-card">
                <div>
                  <span>Equipo Importado:</span>
                  <strong>{deliveryTarget.mainProduct}</strong>
                  <small>Importado con guía <code>{deliveryTarget.courierTrackingCode}</code></small>
                </div>
                <div className="price-tag">
                  <span>Monto Pagado:</span>
                  <strong>{money(Number(deliveryTarget.paidAmount || 0))}</strong>
                </div>
              </div>

              <div className="input-field-group">
                <label>Modalidad de Entrega / Despacho:</label>
                <div className="amount-pills">
                  <button
                    type="button"
                    className={`pill-btn ${deliveryType === 'STORE_PICKUP' ? 'active' : ''}`}
                    onClick={() => setDeliveryType('STORE_PICKUP')}
                  >
                    Retiro en Tienda Trujillo (Av. Larco 1340)
                  </button>
                  <button
                    type="button"
                    className={`pill-btn ${deliveryType === 'VERIFIED_DELIVERY' ? 'active' : ''}`}
                    onClick={() => setDeliveryType('VERIFIED_DELIVERY')}
                  >
                    Delivery Seguro a Domicilio en Trujillo
                  </button>
                </div>
              </div>

              <div className="input-field-group">
                <label>Número de Serie Oficial de Apple (Caja / Dispositivo):</label>
                <input
                  type="text"
                  placeholder="Ej: F2LWR89X04M3"
                  value={appleSerial}
                  onChange={e => setAppleSerial(e.target.value)}
                />
                <small>Se registrará en los servidores para verificar autenticidad y habilitar garantía oficial.</small>
              </div>

              <div className="warranty-preview-box">
                <ShieldCheck size={18} className="text-blue" />
                <div>
                  <strong>Póliza de Garantía Polux Import de 12 Meses</strong>
                  <p>Cubre fallas de hardware y reemplazo con piezas originales Apple.</p>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setDeliveryTarget(null)} disabled={actionBusy}>
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleCompleteDelivery}
                  disabled={actionBusy}
                >
                  {actionBusy ? 'Registrando...' : 'Confirmar Entrega y Activar Garantía'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Encuesta NPS y Alerta Impulsora a TURNED */}
      {npsTarget && (
        <div className="modal-backdrop" onClick={() => setNpsTarget(null)}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="badge-icon amber"><Star size={20} /></div>
                <div>
                  <h3>Encuesta de Satisfacción Postventa (NPS)</h3>
                  <p>{npsTarget.firstName} {npsTarget.lastName} · {npsTarget.mainProduct}</p>
                </div>
              </div>
              <button className="btn-icon-close" onClick={() => setNpsTarget(null)}>✕</button>
            </div>

            <div className="modal-body">
              <p className="nps-question">
                ¿Qué tan probable es que recomiendes Polux Imports a un colega, amigo o familiar?
              </p>

              {/* Selector interactivo de 0 a 10 */}
              <div className="nps-scale-wrapper">
                <div className="nps-buttons-grid">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(val => (
                    <button
                      key={val}
                      type="button"
                      className={`nps-val-btn ${npsScore === val ? 'selected' : ''} ${val >= 9 ? 'promoter' : val >= 7 ? 'passive' : 'detractor'}`}
                      onClick={() => setNpsScore(val)}
                    >
                      {val}
                    </button>
                  ))}
                </div>
                <div className="nps-scale-labels">
                  <span>0: Nada probable (Detractor)</span>
                  <span>7-8: Neutro (Pasivo)</span>
                  <span>9-10: Extremadamente probable (Promotor)</span>
                </div>
              </div>

              <div className="input-field-group">
                <label>Comentarios sobre la experiencia de importación y atención:</label>
                <textarea
                  rows={3}
                  placeholder="Escribe el feedback del cliente..."
                  value={npsFeedback}
                  onChange={e => setNpsFeedback(e.target.value)}
                />
              </div>

              {npsScore >= 9 && (
                <div className="loyalty-alert-preview">
                  <Sparkles size={20} className="text-purple" />
                  <div>
                    <strong>Alerta de Impulsamiento (CUSTOMER $\rightarrow$ TURNED)</strong>
                    <p>Al calificar 9 o 10, el sistema activará automáticamente el carnet Apple Club con 15% de descuento en accesorios MagSafe y plan de renovación anual.</p>
                  </div>
                </div>
              )}

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setNpsTarget(null)} disabled={actionBusy}>
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleSubmitNps}
                  disabled={actionBusy}
                >
                  {actionBusy ? 'Guardando...' : 'Registrar Calificación NPS'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Certificado de Garantía Polux Oficial */}
      {warrantyTarget && (
        <div className="modal-backdrop" onClick={() => setWarrantyTarget(null)}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="badge-icon blue"><ShieldCheck size={20} /></div>
                <div>
                  <h3>Certificado de Garantía Oficial Polux Import</h3>
                  <p>Póliza: <strong>{warrantyTarget.warrantyCode || 'POLUX-GAR-2026-9812'}</strong></p>
                </div>
              </div>
              <button className="btn-icon-close" onClick={() => setWarrantyTarget(null)}>✕</button>
            </div>

            <div className="modal-body">
              <div className="warranty-certificate-card">
                <div className="cert-head">
                  <h4>POLUX IMPORTS S.A.C.</h4>
                  <span>Importación Directa Apple · Sede Trujillo</span>
                  <div className="cert-seal">1 AÑO GARANTÍA</div>
                </div>

                <div className="cert-details">
                  <div className="cert-row"><span>Titular:</span><strong>{warrantyTarget.firstName} {warrantyTarget.lastName}</strong></div>
                  <div className="cert-row"><span>Documento (DNI/RUC):</span><strong>{warrantyTarget.documentNumber || '72841920'}</strong></div>
                  <div className="cert-row"><span>Dispositivo Apple:</span><strong>{warrantyTarget.mainProduct}</strong></div>
                  <div className="cert-row"><span>Número de Serie:</span><code>{warrantyTarget.appleSerialNumber || 'F2LWR89X04'}</code></div>
                  <div className="cert-row"><span>Fecha de Emisión:</span><span>{fmtDate(warrantyTarget.deliveredAt)}</span></div>
                  <div className="cert-row"><span>Vigencia hasta:</span><strong>{fmtDate(warrantyTarget.warrantyExpiresAt)}</strong></div>
                </div>

                <p className="cert-terms">
                  Esta garantía ampara fallas técnicas de hardware y batería en condiciones normales de uso. Polux Imports gestiona el soporte especializado directo con servicio técnico oficial Apple en Trujillo y Lima.
                </p>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => window.print()}>
                  <Download size={16} /> Imprimir Certificado
                </button>
                <button type="button" className="btn-primary" onClick={() => setWarrantyTarget(null)}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Mesa de Ayuda CRM / Ticket Postventa */}
      {ticketTarget && (
        <div className="modal-backdrop" onClick={() => setTicketTarget(null)}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="badge-icon purple"><LifeBuoy size={20} /></div>
                <div>
                  <h3>Mesa de Ayuda Postventa CRM · Polux Helpdesk</h3>
                  <p>Cliente: <strong>{ticketTarget.firstName} {ticketTarget.lastName}</strong></p>
                </div>
              </div>
              <button className="btn-icon-close" onClick={() => setTicketTarget(null)}>✕</button>
            </div>

            <div className="modal-body">
              <div className="input-field-group">
                <label>Motivo del Ticket de Soporte:</label>
                <select value={ticketTopic} onChange={e => setTicketTopic(e.target.value)}>
                  <option value="Asistencia Configuración iCloud">Asistencia Configuración iCloud / Apple ID</option>
                  <option value="Migración de Datos Android a iOS">Migración de Datos Android a iOS</option>
                  <option value="Consulta sobre Carga Rápida MagSafe">Consulta sobre Carga Rápida MagSafe</option>
                  <option value="Solicitud de Revisión por Garantía">Solicitud de Revisión por Garantía</option>
                </select>
              </div>

              <div className="input-field-group">
                <label>Descripción detallada de la solicitud del cliente:</label>
                <textarea
                  rows={4}
                  placeholder="Detalla la asistencia requerida..."
                  value={ticketDetail}
                  onChange={e => setTicketDetail(e.target.value)}
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setTicketTarget(null)} disabled={actionBusy}>
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleCreateTicket}
                  disabled={actionBusy}
                >
                  {actionBusy ? 'Guardando...' : 'Crear Ticket CRM'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
