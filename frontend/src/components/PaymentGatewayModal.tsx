import React, { useState } from 'react';
import { CheckCircle2, Copy, CreditCard, Download, QrCode, ShieldCheck, Smartphone, Volume2, X } from 'lucide-react';
import { api, money, Person } from '../lib/api';

interface Props {
  person: Person;
  onClose: () => void;
  onSuccess: (updated: Person) => void;
}

export default function PaymentGatewayModal({ person, onClose, onSuccess }: Props) {
  const quote = person.quotes?.find(q => q.status === 'ACTIVE') || person.quotes?.[0];
  const fullAmount = Number(quote?.amount || Math.round((person.budgetMin + person.budgetMax) / 2));

  const [method, setMethod] = useState<'YAPE' | 'PLIN' | 'CARD' | 'TRANSFER'>('YAPE');
  const [testAmount, setTestAmount] = useState<number>(fullAmount);
  const [operationCode, setOperationCode] = useState<string>('');
  const [cardNum, setCardNum] = useState('');
  const [cardExp, setCardExp] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [receipt, setReceipt] = useState<any>(null);

  // Sintetizador Web Audio API: reproduce el sonido de confirmación bancaria / Yape
  const playPaymentChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // Primer tono (agudo)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      gain1.gain.setValueAtTime(0.15, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.35);

      // Segundo tono (campana de éxito)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5
      gain2.gain.setValueAtTime(0.2, ctx.currentTime + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.12);
      osc2.stop(ctx.currentTime + 0.7);
    } catch (e) {
      console.warn('Audio no soportado o bloqueado por navegador:', e);
    }
  };

  const handlePay = async () => {
    setIsProcessing(true);
    try {
      const op = operationCode.trim() || `${method}-${Math.floor(Math.random() * 899999 + 100000)}`;
      const updated = await api.payWithGateway(person.id, {
        paymentMethod: method,
        amount: testAmount,
        operationCode: op,
        deliveryAddress: person.address || `${person.district || 'Víctor Larco'}, Trujillo`,
      });

      playPaymentChime();

      setReceipt({
        number: updated.receiptNumber || `B001-${Math.floor(Math.random() * 90000 + 10000)}`,
        date: new Date().toLocaleString('es-PE'),
        amount: testAmount,
        method,
        operationCode: op,
        customer: `${person.firstName} ${person.lastName}`,
        docNumber: person.documentNumber || '72841920',
        product: person.mainProduct,
        tracking: updated.courierTrackingCode,
      });

      onSuccess(updated);
    } catch (err: any) {
      alert('Error al procesar el pago: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-container">
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="badge-icon emerald">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3>Pasarela de Pagos · PoluxPay</h3>
              <p>Procesamiento Seguro de Importación Apple (SSL 256-bit)</p>
            </div>
          </div>
          <button className="btn-icon-close" onClick={onClose}><X size={18} /></button>
        </div>

        {receipt ? (
          <div className="receipt-view">
            <div className="receipt-banner">
              <CheckCircle2 size={38} className="text-emerald" />
              <h4>¡Transacción Exitosa!</h4>
              <p>El pago fue validado y el pedido entró a procesamiento logístico internacional.</p>
            </div>

            <div className="receipt-ticket">
              <div className="ticket-head">
                <strong>POLUX IMPORTS S.A.C.</strong>
                <span>RUC: 20608912401</span>
                <span>Av. Larco 1340, Urb. California, Trujillo</span>
                <div className="ticket-divider" />
                <h5 className="receipt-code">BOLETA DE VENTA ELECTRÓNICA</h5>
                <strong className="receipt-num">{receipt.number}</strong>
              </div>

              <div className="ticket-body">
                <div className="ticket-row"><span>Fecha / Hora:</span><strong>{receipt.date}</strong></div>
                <div className="ticket-row"><span>Cliente:</span><strong>{receipt.customer}</strong></div>
                <div className="ticket-row"><span>DNI / Doc:</span><strong>{receipt.docNumber}</strong></div>
                <div className="ticket-row"><span>Medio de pago:</span><strong>{receipt.method}</strong></div>
                <div className="ticket-row"><span>Código de Op.:</span><strong>{receipt.operationCode}</strong></div>
                <div className="ticket-divider" />
                <div className="ticket-row product-row">
                  <div>
                    <strong>{receipt.product}</strong>
                    <small>Importación directa Apple USA sellado en caja</small>
                  </div>
                  <strong>{money(receipt.amount)}</strong>
                </div>
                <div className="ticket-divider" />
                <div className="ticket-row"><span>Subtotal:</span><span>{money(receipt.amount / 1.18)}</span></div>
                <div className="ticket-row"><span>IGV (18%):</span><span>{money(receipt.amount - (receipt.amount / 1.18))}</span></div>
                <div className="ticket-row total"><span>TOTAL PAGADO:</span><strong>{money(receipt.amount)}</strong></div>
                <div className="ticket-divider" />
                <div className="ticket-meta">
                  <span>Guía Aérea USA → Perú: <b>{receipt.tracking}</b></span>
                  <small>Autorizado mediante resolución SUNAT 034-005-000481</small>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => window.print()}>
                <Download size={16} /> Imprimir Comprobante
              </button>
              <button className="btn-primary" onClick={onClose}>
                Ver Expediente en PAYERS
              </button>
            </div>
          </div>
        ) : (
          <div className="modal-body">
            <div className="payment-summary-bar">
              <div>
                <span>Producto a importar:</span>
                <strong>{person.mainProduct}</strong>
              </div>
              <div className="summary-price">
                <span>Total a pagar:</span>
                <strong>{money(testAmount)}</strong>
              </div>
            </div>

            <div className="test-amount-selector">
              <span className="field-label">Modalidad y Monto a Procesar:</span>
              <div className="amount-pills">
                <button
                  type="button"
                  className={`pill-btn ${testAmount === 0.1 ? 'active' : ''}`}
                  onClick={() => setTestAmount(0.1)}
                >
                  S/ 0.10 (Prueba Rápida)
                </button>
                <button
                  type="button"
                  className={`pill-btn ${testAmount === Math.round(fullAmount * 0.5) ? 'active' : ''}`}
                  onClick={() => setTestAmount(Math.round(fullAmount * 0.5))}
                >
                  {money(Math.round(fullAmount * 0.5))} (50% Adelanto Importación)
                </button>
                <button
                  type="button"
                  className={`pill-btn ${testAmount === fullAmount ? 'active' : ''}`}
                  onClick={() => setTestAmount(fullAmount)}
                >
                  {money(fullAmount)} (100% Pago Total)
                </button>
              </div>
              <small style={{display:'block', color:'#94a3b8', fontSize:'11px', marginTop:'6px'}}>
                ℹ️ Según política Polux (Sección 5.3): El 50% de adelanto digital habilita el despacho Miami-Trujillo; el 50% restante puede abonarse contra entrega en efectivo o tarjeta.
              </small>
            </div>

            <div className="payment-tabs">
              <button
                type="button"
                className={`tab-btn ${method === 'YAPE' ? 'active yape' : ''}`}
                onClick={() => setMethod('YAPE')}
              >
                <Smartphone size={16} /> Yape
              </button>
              <button
                type="button"
                className={`tab-btn ${method === 'PLIN' ? 'active plin' : ''}`}
                onClick={() => setMethod('PLIN')}
              >
                <Smartphone size={16} /> Plin
              </button>
              <button
                type="button"
                className={`tab-btn ${method === 'CARD' ? 'active card' : ''}`}
                onClick={() => setMethod('CARD')}
              >
                <CreditCard size={16} /> Tarjeta Débito/Crédito
              </button>
              <button
                type="button"
                className={`tab-btn ${method === 'TRANSFER' ? 'active transfer' : ''}`}
                onClick={() => setMethod('TRANSFER')}
              >
                <QrCode size={16} /> Transferencia Bancaria
              </button>
            </div>

            {method === 'YAPE' && (
              <div className="tab-content qr-layout">
                <div className="qr-box">
                  <svg viewBox="0 0 160 160" width="140" height="140" className="qr-svg">
                    <rect width="160" height="160" fill="#ffffff" rx="8" />
                    <rect x="14" y="14" width="42" height="42" fill="#742284" rx="4" />
                    <rect x="22" y="22" width="26" height="26" fill="#ffffff" />
                    <rect x="28" y="28" width="14" height="14" fill="#742284" />

                    <rect x="104" y="14" width="42" height="42" fill="#742284" rx="4" />
                    <rect x="112" y="22" width="26" height="26" fill="#ffffff" />
                    <rect x="118" y="28" width="14" height="14" fill="#742284" />

                    <rect x="14" y="104" width="42" height="42" fill="#742284" rx="4" />
                    <rect x="22" y="112" width="26" height="26" fill="#ffffff" />
                    <rect x="28" y="118" width="14" height="14" fill="#742284" />

                    <rect x="66" y="20" width="10" height="10" fill="#00d1b2" />
                    <rect x="82" y="20" width="10" height="10" fill="#742284" />
                    <rect x="66" y="38" width="26" height="10" fill="#742284" />
                    <rect x="66" y="58" width="10" height="20" fill="#00d1b2" />
                    <rect x="84" y="58" width="10" height="10" fill="#742284" />
                    <rect x="20" y="66" width="36" height="10" fill="#742284" />
                    <rect x="104" y="66" width="42" height="10" fill="#00d1b2" />
                    <rect x="66" y="90" width="26" height="10" fill="#742284" />
                    <rect x="104" y="86" width="16" height="20" fill="#742284" />
                    <rect x="128" y="86" width="18" height="10" fill="#00d1b2" />
                    <rect x="66" y="110" width="12" height="36" fill="#742284" />
                    <rect x="86" y="110" width="14" height="16" fill="#00d1b2" />
                    <rect x="110" y="116" width="36" height="12" fill="#742284" />
                    <rect x="126" y="136" width="20" height="10" fill="#00d1b2" />
                  </svg>
                  <span className="yape-tag">Yape Oficial Interoperable</span>
                </div>

                <div className="payment-instructions">
                  <div className="phone-card">
                    <div>
                      <span>Número de Yape Polux Imports:</span>
                      <strong>+51 944 620 118</strong>
                      <small>Titular: Polux Imports S.A.C. · RUC 20608912401</small>
                    </div>
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => navigator.clipboard.writeText('944620118')}
                      title="Copiar número"
                    >
                      <Copy size={16} />
                    </button>
                  </div>

                  <div className="input-field-group">
                    <label>Código de Aprobación / Operación (6 dígitos):</label>
                    <input
                      type="text"
                      placeholder="Ej: 849102 (opcional para demo)"
                      value={operationCode}
                      onChange={e => setOperationCode(e.target.value)}
                    />
                    <small>En la demo se auto-genera si lo dejas en blanco.</small>
                  </div>
                </div>
              </div>
            )}

            {method === 'PLIN' && (
              <div className="tab-content qr-layout">
                <div className="qr-box plin-theme">
                  <div className="plin-circle">PLIN</div>
                  <span>Escanea con BBVA, Interbank o Scotiabank</span>
                </div>
                <div className="payment-instructions">
                  <div className="phone-card">
                    <div>
                      <span>Número Plin Celular:</span>
                      <strong>+51 944 620 118</strong>
                      <small>Polux Imports SAC</small>
                    </div>
                  </div>
                  <div className="input-field-group">
                    <label>Código de Referencia:</label>
                    <input
                      type="text"
                      placeholder="Ej: PLN-481902"
                      value={operationCode}
                      onChange={e => setOperationCode(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {method === 'CARD' && (
              <div className="tab-content card-form">
                <div className="input-field-group">
                  <label>Número de Tarjeta (Visa / Mastercard):</label>
                  <input
                    type="text"
                    maxLength={19}
                    placeholder="4557 •••• •••• 9812"
                    value={cardNum}
                    onChange={e => setCardNum(e.target.value)}
                  />
                </div>
                <div className="form-row-2">
                  <div className="input-field-group">
                    <label>Expiración (MM/AA):</label>
                    <input
                      type="text"
                      maxLength={5}
                      placeholder="09/28"
                      value={cardExp}
                      onChange={e => setCardExp(e.target.value)}
                    />
                  </div>
                  <div className="input-field-group">
                    <label>CVV / CVC:</label>
                    <input
                      type="password"
                      maxLength={4}
                      placeholder="•••"
                      value={cardCvv}
                      onChange={e => setCardCvv(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {method === 'TRANSFER' && (
              <div className="tab-content bank-transfer">
                <div className="bank-account-item">
                  <strong>BCP Soles (Cuenta Corriente):</strong>
                  <span>305-98214012-0-44</span>
                  <small>CCI: 002-3050098214012044-18</small>
                </div>
                <div className="bank-account-item">
                  <strong>BBVA Continental:</strong>
                  <span>0011-0245-0100489124</span>
                  <small>CCI: 011-245-000100489124-32</small>
                </div>
              </div>
            )}

            <div className="modal-footer">
              <div className="audio-notice">
                <Volume2 size={15} className="text-emerald" />
                <span>Incluye aviso de confirmación sonora interactivo al pagar</span>
              </div>
              <div className="footer-btns">
                <button type="button" className="btn-secondary" onClick={onClose} disabled={isProcessing}>
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn-pay-confirm"
                  onClick={handlePay}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Validando con pasarela...' : `Confirmar y Pagar ${money(testAmount)}`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
