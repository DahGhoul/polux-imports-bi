import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, BellRing, CheckCircle2, ChevronRight, DollarSign, FileText, PackageCheck, Plane, Search, ShieldCheck, Truck } from 'lucide-react';
import { api, fmtDate, initials, money, Person } from '../lib/api';

export default function PayersPage() {
  const [payers, setPayers] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPayer, setSelectedPayer] = useState<Person | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [toast, setToast] = useState('');
  const nav = useNavigate();

  const loadData = () => {
    api.people('PAYER', search).then(setPayers).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [search]);

  const [deliverTarget, setDeliverTarget] = useState<Person | null>(null);
  const [deliveryType, setDeliveryType] = useState('STORE_PICKUP');
  const [appleSerial, setAppleSerial] = useState('');
  const [delivering, setDelivering] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleStartDelivery = (p: Person) => {
    setDeliverTarget(p);
    setAppleSerial(`F2LW${Math.floor(Math.random() * 89999 + 10000)}Y6Q`);
  };

  const handleConfirmDelivery = async () => {
    if (!deliverTarget) return;
    setDelivering(true);
    try {
      const serial = appleSerial.trim() || `F2LW${Math.floor(Math.random() * 89999 + 10000)}Y6Q`;
      const updated = await api.deliverService(deliverTarget.id, {
        deliveryType,
        appleSerialNumber: serial,
      });
      showToast(`¡Entrega confirmada y garantía AppleCare activada para ${updated.firstName}!`);
      setDeliverTarget(null);
      if (selectedPayer?.id === deliverTarget.id) {
        setSelectedPayer(null);
      }
      loadData();
    } catch (e: any) {
      alert('Error al registrar entrega: ' + e.message);
    } finally {
      setDelivering(false);
    }
  };

  const handleAdvanceShipping = async (p: Person) => {
    setActionBusy(true);
    try {
      const updated = await api.shippingAdvance(p.id);
      showToast(`Hito logístico actualizado para ${p.firstName}`);
      setSelectedPayer(updated);
      loadData();
    } finally {
      setActionBusy(false);
    }
  };

  const handleCollectionAlert = async (p: Person, alertType: string = 'COLLECTION_REMINDER') => {
    setActionBusy(true);
    try {
      await api.collectionAlert(p.id, { alertType });
      const labels: Record<string, string> = {
        PAYMENT_INCONSISTENCY: `Alerta: Comprobante observado notificado a Cobranza para ${p.firstName}`,
        CUSTOMS_UPDATE: `Alerta aduanera (ingreso a Perú) enviada a ${p.firstName}`,
        ARRIVAL_TRUJILLO: `Alerta: Arribo a Trujillo y coordinación de saldo enviada a ${p.firstName}`,
        COLLECTION_REMINDER: `Recordatorio de cobranza y stock enviado a ${p.firstName}`,
      };
      showToast(labels[alertType] || `Alerta impulsora enviada a ${p.firstName}`);
      loadData();
    } finally {
      setActionBusy(false);
    }
  };

  const totalCollected = payers.reduce((acc, p) => acc + Number(p.paidAmount || 0), 0);
  const inTrujillo = payers.filter(p => p.shippingStage === 'TRUJILLO_STORE').length;
  const inTransit = payers.filter(p => p.shippingStage !== 'TRUJILLO_STORE' && p.shippingStage !== 'DELIVERED').length;

  const stageLabels: Record<string, { label: string; badge: string; step: number }> = {
    MIAMI_WAREHOUSE: { label: 'Almacén Miami (USA)', badge: 'badge-blue', step: 1 },
    AIR_TRANSIT: { label: 'Vuelo Internacional', badge: 'badge-purple', step: 2 },
    SUNAT_CUSTOMS: { label: 'Aduanas SUNAT (Lima)', badge: 'badge-amber', step: 3 },
    TRUJILLO_STORE: { label: 'En Sede Trujillo', badge: 'badge-emerald', step: 4 },
  };

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
          <div className="breadcrumbs">POLUX IMPORTS / OPERACIONES & FINANZAS</div>
          <h2>PAYERS · Procesamiento Financiero y Logística</h2>
          <p>Supervisión de pagos validados, órdenes en Miami, aduanas SUNAT y arribo a sede Trujillo.</p>
        </div>
        <div className="agent-badge-pill">
          <div className="dot-pulse emerald" />
          <div>
            <strong>Agente Financiero y Logística</strong>
            <small>Auditoría contable y courier activa</small>
          </div>
        </div>
      </section>

      {/* Métricas Financieras y Operacionales */}
      <section className="metrics-row four-cards">
        <div className="card stat-card">
          <div className="stat-head">
            <span>Total Recaudado (Pasarela)</span>
            <DollarSign size={18} className="text-emerald" />
          </div>
          <strong className="stat-value">{money(totalCollected)}</strong>
          <small className="stat-hint">Validado vía Yape, Plin y Tarjetas</small>
        </div>

        <div className="card stat-card">
          <div className="stat-head">
            <span>Pagantes Confirmados</span>
            <FileText size={18} className="text-blue" />
          </div>
          <strong className="stat-value">{payers.length}</strong>
          <small className="stat-hint">Boletas de venta SUNAT emitidas</small>
        </div>

        <div className="card stat-card">
          <div className="stat-head">
            <span>En Tránsito USA → Perú</span>
            <Plane size={18} className="text-purple" />
          </div>
          <strong className="stat-value">{inTransit}</strong>
          <small className="stat-hint">Guías aéreas internacionales</small>
        </div>

        <div className="card stat-card highlight-card">
          <div className="stat-head">
            <span>En Sede Trujillo (Inspección OK)</span>
            <PackageCheck size={18} className="text-emerald" />
          </div>
          <strong className="stat-value">{inTrujillo}</strong>
          <small className="stat-hint">Listos para entrega → Pasar a CUSTOMER</small>
        </div>
      </section>

      {/* Tabla Operacional de Payers */}
      <section className="card table-card">
        <div className="card-header-bar">
          <div className="search-input-wrapper">
            <Search size={16} />
            <input
              type="text"
              placeholder="Buscar por nombre, DNI, guía o producto..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <span className="count-tag">{payers.length} registros en base de datos</span>
        </div>

        <div className="table-responsive">
          <table className="enterprise-table">
            <thead>
              <tr>
                <th>CLIENTE / DNI</th>
                <th>UBICACIÓN (TRUJILLO)</th>
                <th>PRODUCTO APPLE</th>
                <th>PAGO / COMPROBANTE</th>
                <th>GUÍA COURIER</th>
                <th>ESTADO LOGÍSTICO</th>
                <th>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-6">Cargando pagos y guías logísticas...</td>
                </tr>
              ) : payers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-6">No se encontraron pagos registrados en esta etapa.</td>
                </tr>
              ) : (
                payers.map(p => {
                  const stageInfo = stageLabels[p.shippingStage || 'MIAMI_WAREHOUSE'] || stageLabels.MIAMI_WAREHOUSE;
                  const isReadyForCustomer = p.shippingStage === 'TRUJILLO_STORE';

                  return (
                    <tr key={p.id} className={selectedPayer?.id === p.id ? 'row-selected' : ''}>
                      <td>
                        <div className="cell-person">
                          <div className="avatar-circle">{initials(p)}</div>
                          <div>
                            <strong>{p.firstName} {p.lastName}</strong>
                            <span>{p.documentType || 'DNI'}: {p.documentNumber || '—'}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <strong>{p.district || 'Trujillo Centro'}</strong>
                        <span className="sub-text">{p.province || 'Trujillo'}</span>
                      </td>
                      <td>
                        <strong>{p.mainProduct}</strong>
                        <span className="sub-text">{p.paymentPreference}</span>
                      </td>
                      <td>
                        <strong className="text-emerald">{money(Number(p.paidAmount || 0))}</strong>
                        <span className="sub-text">{p.paymentMethod || 'YAPE'} · {p.receiptNumber || 'B001-PEND'}</span>
                      </td>
                      <td>
                        <code className="tracking-code">{p.courierTrackingCode || 'POLUX-US-PE-PEND'}</code>
                      </td>
                      <td>
                        <span className={`badge ${stageInfo.badge}`}>
                          {stageInfo.label}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            type="button"
                            className="btn-table-action"
                            onClick={() => setSelectedPayer(p)}
                            title="Ver seguimiento logístico"
                          >
                            Ver Logística
                          </button>
                          {isReadyForCustomer ? (
                            <button
                              type="button"
                              className="btn-table-action primary"
                              onClick={() => handleStartDelivery(p)}
                            >
                              Entregar <ArrowRight size={13} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn-table-action"
                              onClick={() => handleAdvanceShipping(p)}
                              disabled={actionBusy}
                              title="Avanzar al siguiente hito de importación"
                            >
                              Avanzar Hito
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

      {/* Drawer / Panel Detallado de Logística */}
      {selectedPayer && (
        <div className="modal-backdrop" onClick={() => setSelectedPayer(null)}>
          <div className="modal-container large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="badge-icon purple"><Truck size={20} /></div>
                <div>
                  <h3>Expediente de Importación · {selectedPayer.firstName} {selectedPayer.lastName}</h3>
                  <p>Guía de Carga Internacional: <code>{selectedPayer.courierTrackingCode}</code></p>
                </div>
              </div>
              <button className="btn-icon-close" onClick={() => setSelectedPayer(null)}>✕</button>
            </div>

            <div className="modal-body">
              {/* Resumen del Cliente y Pago */}
              <div className="info-summary-grid">
                <div className="info-card-item">
                  <span>Comprobante Emitido</span>
                  <strong>{selectedPayer.receiptNumber || 'B001-0004812'}</strong>
                  <small>Boleta de Venta Electrónica SUNAT</small>
                </div>
                <div className="info-card-item">
                  <span>Monto Validado</span>
                  <strong className="text-emerald">{money(Number(selectedPayer.paidAmount || 0))}</strong>
                  <small>Vía {selectedPayer.paymentMethod || 'Yape'}</small>
                </div>
                <div className="info-card-item">
                  <span>Dirección en Trujillo</span>
                  <strong>{selectedPayer.address || 'Av. Larco 1340'}</strong>
                  <small>{selectedPayer.district || 'Víctor Larco'}</small>
                </div>
                <div className="info-card-item">
                  <span>Equipo Apple</span>
                  <strong>{selectedPayer.mainProduct}</strong>
                  <small>Garantía de origen Apple Store</small>
                </div>
              </div>

              {/* Línea de Tiempo Logística (Miami -> Trujillo) */}
              <div className="logistics-timeline-card">
                <h4>Itinerario de Importación Directa USA → Trujillo</h4>
                <div className="timeline-steps">
                  <div className={`step-item ${selectedPayer.shippingStage ? 'active' : ''}`}>
                    <div className="step-circle">1</div>
                    <div className="step-content">
                       <strong>Almacén Miami, Florida (USA)</strong>
                      <p>Recepción del producto, verificación de precinto y consolidación en pallet aéreo.</p>
                    </div>
                  </div>

                  <div className={`step-item ${['AIR_TRANSIT', 'SUNAT_CUSTOMS', 'TRUJILLO_STORE', 'DELIVERED'].includes(selectedPayer.shippingStage || '') ? 'active' : ''}`}>
                    <div className="step-circle">2</div>
                    <div className="step-content">
                      <strong>Tránsito Aéreo Internacional</strong>
                      <p>Vuelo de carga Miami (MIA) → Lima (LIM). Manifiesto de aduanas transmitido.</p>
                    </div>
                  </div>

                  <div className={`step-item ${['SUNAT_CUSTOMS', 'TRUJILLO_STORE', 'DELIVERED'].includes(selectedPayer.shippingStage || '') ? 'active' : ''}`}>
                    <div className="step-circle">3</div>
                    <div className="step-content">
                      <strong>Aduanas SUNAT (Aeropuerto Jorge Chávez, Lima)</strong>
                      <p>Inspección aduanera, pago de aranceles e internamiento legal en territorio peruano.</p>
                    </div>
                  </div>

                  <div className={`step-item ${['TRUJILLO_STORE', 'DELIVERED'].includes(selectedPayer.shippingStage || '') ? 'active' : ''}`}>
                    <div className="step-circle">4</div>
                    <div className="step-content">
                      <strong>Oficina Principal Trujillo (Superó Inspección Física)</strong>
                      <p>Desempaque verificado en sede Larco. Listo para entrega presencial o delivery.</p>
                    </div>
                  </div>
                </div>

                {selectedPayer.shippingStage === 'TRUJILLO_STORE' && (
                  <div className="arrival-alert-box">
                    <AlertCircle size={20} className="text-emerald" />
                    <div>
                      <strong>¡Alerta Impulsora Activada (PAYER → CUSTOMER)!</strong>
                      <p>El equipo ya está en la sede de Trujillo. Procede a registrar la entrega, validar el número de serie oficial de Apple y activar la garantía.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Alertas Impulsoras de la Fase PAYERS (Tabla 8 del Informe) */}
              <div style={{ marginTop: '16px', padding: '14px', background: '#090e1a', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
                  ⚡ ALERTAS IMPULSORAS OPERACIONALES (TABLA 8 DEL INFORME)
                </span>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn-table-action"
                    onClick={() => handleCollectionAlert(selectedPayer, 'CUSTOMS_UPDATE')}
                    disabled={actionBusy}
                    title="Informar preventivamente sobre trámite aduanero e ingreso al país"
                  >
                    <Plane size={13} /> Alerta Aduanas SUNAT
                  </button>
                  <button
                    type="button"
                    className="btn-table-action"
                    onClick={() => handleCollectionAlert(selectedPayer, 'ARRIVAL_TRUJILLO')}
                    disabled={actionBusy}
                    title="Notificar arribo a Trujillo, inspección OK y coordinar saldo pendiente"
                  >
                    <PackageCheck size={13} /> Alerta Arribo Trujillo & Saldo (50%)
                  </button>
                  <button
                    type="button"
                    className="btn-table-action"
                    onClick={() => handleCollectionAlert(selectedPayer, 'PAYMENT_INCONSISTENCY')}
                    disabled={actionBusy}
                    title="Alerta automática si el comprobante presenta diferencia o es ilegible"
                  >
                    <AlertCircle size={13} /> Observar Comprobante (Inconsistencia)
                  </button>
                  <button
                    type="button"
                    className="btn-table-action"
                    onClick={() => handleCollectionAlert(selectedPayer, 'COLLECTION_REMINDER')}
                    disabled={actionBusy}
                    title="Recordatorio de vigencia y reserva de stock"
                  >
                    <BellRing size={13} /> Recordatorio de Pago / Urgencia
                  </button>
                </div>
              </div>

              {/* Botones de acción del Agente */}
              <div className="modal-footer" style={{ marginTop: '16px' }}>

                {selectedPayer.shippingStage === 'TRUJILLO_STORE' ? (
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => handleStartDelivery(selectedPayer)}
                  >
                    Proceder a Entrega del Servicio (Fase CUSTOMERS) <ArrowRight size={16} />
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => handleAdvanceShipping(selectedPayer)}
                    disabled={actionBusy}
                  >
                    Avanzar al Siguiente Hito Logístico <ChevronRight size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Entrega y Activación de Garantía */}
      {deliverTarget && (
        <div className="modal-backdrop" onClick={() => !delivering && setDeliverTarget(null)}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="badge-icon emerald"><PackageCheck size={20} /></div>
                <div>
                  <h3>Registrar Entrega del Servicio (Fase CUSTOMERS)</h3>
                  <p>Cliente: <strong>{deliverTarget.firstName} {deliverTarget.lastName}</strong> · DNI: {deliverTarget.documentNumber}</p>
                </div>
              </div>
              <button 
                type="button" 
                className="btn-icon-close" 
                onClick={() => setDeliverTarget(null)}
                disabled={delivering}
              >✕</button>
            </div>

            <div className="modal-body">
              <div className="info-card-item" style={{ marginBottom: '14px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                <span>Producto a Entregar:</span>
                <strong style={{ fontSize: '15px' }}>{deliverTarget.mainProduct}</strong>
                <small>Importación verificada en Sede Central Av. Larco 840, Trujillo</small>
              </div>

              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '5px' }}>
                  Modalidad de Entrega:
                </label>
                <select 
                  className="consult-select"
                  value={deliveryType}
                  onChange={e => setDeliveryType(e.target.value)}
                >
                  <option value="STORE_PICKUP">Retiro Presencial en Tienda (Av. Larco 840, Trujillo)</option>
                  <option value="HOME_DELIVERY">Envío Courier / Delivery a Domicilio en Trujillo</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '5px' }}>
                  Número de Serie Oficial Apple (12 dígitos de fábrica):
                </label>
                <input 
                  type="text"
                  className="input-search-negotiation"
                  style={{ padding: '10px 12px', fontSize: '14px', fontFamily: 'var(--font-mono)' }}
                  value={appleSerial}
                  onChange={e => setAppleSerial(e.target.value.toUpperCase())}
                  placeholder="Ej. F2LW84920Y6Q"
                />
                <small style={{ fontSize: '11px', color: '#60a5fa', display: 'block', marginTop: '4px' }}>
                  * Este serial activará automáticamente la póliza Polux Care de 365 días en la base de datos de Apple.
                </small>
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button 
                type="button" 
                className="btn" 
                onClick={() => setDeliverTarget(null)}
                disabled={delivering}
              >
                Cancelar
              </button>
              <button 
                type="button" 
                className="btn-primary" 
                style={{ background: '#10b981' }}
                onClick={handleConfirmDelivery}
                disabled={delivering}
              >
                <CheckCircle2 size={16} /> {delivering ? 'Registrando Entrega…' : 'Confirmar Entrega y Activar Garantía'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
