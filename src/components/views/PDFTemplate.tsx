import React from 'react';
import { Smartphone, Phone } from 'lucide-react';
import { BrandSettings, Customer, SavedJob } from '@/types';
import Barcode from 'react-barcode';

interface PDFTemplateProps {
  brand: BrandSettings;
  customerInfo: Customer;
  quoteJobs: SavedJob[];
  quoteNumber?: string;
  isOrder?: boolean;
  date?: string;
  deliveryPhotos?: string[];
  isLabel?: boolean;
  isWarehouseLabel?: boolean;
}

const PDFTemplate: React.FC<PDFTemplateProps> = ({ 
  brand, customerInfo, quoteJobs, quoteNumber, isOrder, date, deliveryPhotos, isLabel 
}) => {
  const emissionDate = date ? new Date(date) : new Date();
  const expirationDate = new Date();
  expirationDate.setDate(emissionDate.getDate() + 30);

  const formatCurrency = (val: number) => {
    return `${Math.round(val).toLocaleString('es-CO')} COP`;
  };

  return (
    <div 
      className="pdf-capture-container" 
      style={{ 
        position: 'fixed', 
        left: 0, 
        top: 0, 
        width: (isLabel || isWarehouseLabel) ? '400px' : '794px', // A4/Letter roughly
        zIndex: -100, 
        visibility: 'hidden', 
        pointerEvents: 'none',
        backgroundColor: '#ffffff'
      }}
    >
      <style>
        {`
          #quote-document {
            font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif !important;
            color: #333333 !important;
            line-height: 1.4 !important;
            /* Anti-Tailwind v4 Reset */
            --tw-ring-color: transparent !important;
            --tw-shadow: 0 0 #0000 !important;
            --tw-shadow-colored: 0 0 #0000 !important;
            --tw-ring-offset-shadow: 0 0 #0000 !important;
            --tw-ring-shadow: 0 0 #0000 !important;
            --tw-inset-shadow: 0 0 #0000 !important;
            --tw-inset-shadow-colored: 0 0 #0000 !important;
            --tw-ring-inset: !important;
            border-color: #f3f4f6 !important;
          }

          /* Purge all possible oklch sources from Tailwind variables */
          #quote-document, #quote-document * {
            --tw-ring-color: transparent !important;
            --tw-shadow: 0 0 #0000 !important;
            --tw-ring-shadow: 0 0 #0000 !important;
            --tw-inset-shadow: 0 0 #0000 !important;
            --color-white: #ffffff !important;
            --color-black: #000000 !important;
            outline-color: transparent !important;
          }

          #quote-document table {
            display: table !important;
          }
          #quote-document tr {
            display: table-row !important;
          }
          #quote-document th, #quote-document td {
            display: table-cell !important;
          }
          #quote-document span {
            display: inline !important;
          }
          
          .pdf-label {
            font-size: 9px !important;
            font-weight: bold !important;
            color: #666666 !important;
            text-transform: uppercase !important;
            margin-bottom: 2px !important;
          }

          .pdf-value {
            font-size: 10px !important;
            color: #000000 !important;
          }

          .pdf-table th {
            font-size: 9px !important;
            font-weight: bold !important;
            text-transform: uppercase !important;
            color: #444444 !important;
            border-bottom: 1px solid #cccccc !important;
            padding: 8px 4px !important;
          }

          .pdf-table td {
            font-size: 10px !important;
            padding: 10px 4px !important;
            border-bottom: 1px solid #eeeeee !important;
            vertical-align: top !important;
            color: #333333 !important;
          }

          .company-name {
            font-size: 14px !important;
            font-weight: bold !important;
            color: #000000 !important;
            text-transform: uppercase !important;
          }

          .document-title {
            font-size: 16px !important;
            font-weight: bold !important;
            color: #000000 !important;
            text-transform: uppercase !important;
          }
        `}
      </style>
      <div id="quote-document" style={{ 
        backgroundColor: '#ffffff', 
        visibility: 'visible',
        padding: (isLabel || isWarehouseLabel) ? '20px' : '30px', /* p-12 equivalent */
        width: (isLabel || isWarehouseLabel) ? '400px' : '794px',
        boxSizing: 'border-box',
        minHeight: (isLabel || isWarehouseLabel) ? '400px' : '1123px',
        display: 'flex',
        flexDirection: 'column',
        border: (isLabel || isWarehouseLabel) ? '4px solid #000' : 'none'
      }}>
        {isWarehouseLabel ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {/* Header Bodega */}
            <div style={{ borderBottom: '4px solid #000', paddingBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '900', margin: 0, textTransform: 'uppercase' }}>ETIQUETA DE BODEGA</h2>
                <p style={{ fontSize: '12px', fontWeight: 'bold', margin: 0 }}>{brand.companyName || 'DPM'}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                 <p style={{ fontSize: '10px', margin: 0 }}>Fecha: {new Date().toLocaleDateString()}</p>
                 <p style={{ fontSize: '12px', fontWeight: 'bold', margin: 0 }}>ID: {quoteNumber}</p>
              </div>
            </div>

            {/* Código de Barras Scannable */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0', backgroundColor: '#fff' }}>
              <Barcode 
                value={quoteNumber || '000000'} 
                width={2} 
                height={60} 
                fontSize={14}
                background="#ffffff"
              />
            </div>

            {/* Información del Cliente */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '8px', border: '2px solid #000', width: '30%', backgroundColor: '#eee' }}>
                    <span style={{ fontSize: '10px', fontWeight: 'black', textTransform: 'uppercase' }}>CLIENTE</span>
                  </td>
                  <td style={{ padding: '8px', border: '2px solid #000' }}>
                    <span style={{ fontSize: '14px', fontWeight: '900', textTransform: 'uppercase' }}>{customerInfo.name}</span>
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '8px', border: '2px solid #000', backgroundColor: '#eee' }}>
                    <span style={{ fontSize: '10px', fontWeight: 'black', textTransform: 'uppercase' }}>TELÉFONO</span>
                  </td>
                  <td style={{ padding: '8px', border: '2px solid #000' }}>
                    <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{customerInfo.phone}</span>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Detalle del Trabajo */}
            <div style={{ border: '2px solid #000', padding: '10px' }}>
              <p style={{ fontSize: '10px', fontWeight: 'black', margin: '0 0 5px 0', textTransform: 'uppercase', borderBottom: '1px solid #000' }}>DESCRIPCIÓN DEL PEDIDO:</p>
              {quoteJobs.map((j, idx) => (
                <div key={idx} style={{ marginBottom: '4px' }}>
                  <p style={{ fontSize: '12px', fontWeight: 'bold', margin: 0 }}>• {j.job_description.toUpperCase()} x{j.quantity}</p>
                </div>
              ))}
            </div>

            {/* Area de Evidencia (10x14cm approx in pixels at 96dpi is roughly 378x529 but here we adapt to label width) */}
            <div style={{ marginTop: '10px' }}>
               <p style={{ fontSize: '10px', fontWeight: 'black', margin: '0 0 5px 0', textTransform: 'uppercase' }}>EVIDENCIA DEL TRABAJO:</p>
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                 {(deliveryPhotos || []).slice(0, 2).map((photo, i) => (
                    <div key={i} style={{ height: '140px', border: '1px solid #000', borderRadius: '4px', overflow: 'hidden' }}>
                       <img src={photo} alt="evidencia" style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
                    </div>
                 ))}
                 {(deliveryPhotos || []).length === 0 && (
                   <div style={{ height: '140px', border: '2px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', gridColumn: 'span 2' }}>
                      <p style={{ fontSize: '10px', color: '#999' }}>Sin fotos de evidencia cargadas</p>
                   </div>
                 )}
               </div>
            </div>

            <div style={{ marginTop: 'auto', borderTop: '2px solid #000', paddingTop: '10px', textAlign: 'center' }}>
               <p style={{ fontSize: '8px', margin: 0, fontWeight: 'bold' }}>SISTEMA DE GESTIÓN ESTRATEGIAS DPM - USO INTERNO BODEGA</p>
            </div>
          </div>
        ) : isLabel ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {/* Header Etiqueta */}
            <div style={{ borderBottom: '2px solid #000', pb: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{brand.companyName || 'DPM'}</span>
              <span style={{ fontSize: '10px' }}>{new Date().toLocaleDateString()}</span>
            </div>
            
            {/* Numero de Pedido Grande */}
            <div style={{ textAlign: 'center', padding: '15px 0', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
              <p style={{ fontSize: '10px', fontWeight: 'bold', margin: '0 0 5px 0', textTransform: 'uppercase' }}>Número de Pedido:</p>
              <h1 style={{ fontSize: '32px', fontWeight: '900', margin: 0, letterSpacing: '-1px' }}>{quoteNumber}</h1>
            </div>

            {/* Datos Cliente */}
            <div>
               <p style={{ fontSize: '10px', fontWeight: 'bold', color: '#666', borderBottom: '1px solid #eee', mb: '5px' }}>CLIENTE:</p>
               <p style={{ fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase' }}>{customerInfo.name}</p>
            </div>

            {/* Items */}
            <div>
               <p style={{ fontSize: '10px', fontWeight: 'bold', color: '#666', borderBottom: '1px solid #eee', mb: '5px' }}>DETALLE DEL TRABAJO:</p>
               {quoteJobs.map((j, idx) => (
                 <div key={idx} style={{ marginBottom: '8px' }}>
                   <p style={{ fontSize: '11px', fontWeight: 'bold', margin: 0 }}>{j.job_description} (x{j.quantity})</p>
                   <p style={{ fontSize: '9px', margin: 0, textTransform: 'uppercase' }}>{j.use_manual_meters ? `${j.manual_meters}m` : `${j.width}x${j.height}cm`}</p>
                 </div>
               ))}
            </div>

            <div style={{ marginTop: 'auto', textAlign: 'center', borderTop: '1px dashed #ccc', pt: '10px' }}>
              <p style={{ fontSize: '9px', fontStyle: 'italic', color: '#999' }}>Generado por Calculadora DPM v4</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header Section */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start', 
              marginBottom: '25px', 
              paddingBottom: '20px', 
              borderBottom: '1px solid #f3f4f6' 
            }}>
              <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
                <div style={{ 
                  height: '80px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'flex-start'
                }}>
                  {brand.logo ? (
                    <img src={brand.logo} alt="Logo" style={{ maxHeight: '80px', maxWidth: '240px', objectFit: 'contain' }} referrerPolicy="no-referrer" />
                  ) : (
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#111111', textTransform: 'uppercase', letterSpacing: '-0.025em' }}>
                      {brand.companyName || 'DPM'}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <p className="company-name" style={{ margin: 0 }}>{brand.companyName}</p>
                  <p style={{ 
                    fontSize: '10px', 
                    fontWeight: 'normal', 
                    lineHeight: '1.4', 
                    color: '#6b7280',
                    margin: 0
                  }}>
                    {brand.address}<br />
                    La Unión, Nariño, Colombia<br />
                    {brand.email}<br />
                    Tel: {brand.phone}<br />
                    NIT: {brand.taxId}
                  </p>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <h2 className="document-title" style={{ marginBottom: '8px', margin: 0 }}>
                  {isOrder ? 'ORDEN DE PEDIDO' : 'COTIZACIÓN'}
                </h2>
                <p style={{ fontSize: '11px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>N.º {quoteNumber || '000000'}</p>
                <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <p style={{ fontSize: '9px', color: '#6b7280', margin: 0 }}>
                    Emisión: <span style={{ fontWeight: 500, color: '#1f2937' }}>{emissionDate.toLocaleDateString('es-CO')}</span>
                  </p>
                  {!isOrder && (
                    <p style={{ fontSize: '9px', color: '#6b7280', margin: 0 }}>
                      Vence: <span style={{ fontWeight: 500, color: '#1f2937' }}>{expirationDate.toLocaleDateString('es-CO')}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Client Info Section */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '32px', 
              marginBottom: '40px' 
            }}>
              <div>
                <p className="pdf-label">Cliente:</p>
                <p style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: '#111827', margin: 0 }}>{customerInfo.name || "CLIENTE GENERAL"}</p>
                <p style={{ fontSize: '10px', fontWeight: 'normal', marginTop: '4px', color: '#4b5563', margin: 0 }}>{customerInfo.email}</p>
                <p style={{ fontSize: '10px', fontWeight: 'normal', color: '#4b5563', margin: 0 }}>{customerInfo.phone}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p className="pdf-label">Lugar de servicio:</p>
                <p style={{ fontSize: '10px', fontWeight: 'normal', color: '#4b5563', margin: 0 }}>La Unión, Nariño, Colombia</p>
              </div>
            </div>

            {/* Main Table */}
            <table className="pdf-table" style={{ width: '100%', marginBottom: '32px', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Descripción detallada del producto o servicio</th>
                  <th style={{ textAlign: 'center', width: '96px' }}>Cant.</th>
                  <th style={{ textAlign: 'right', width: '128px' }}>Vr. Unitario</th>
                  <th style={{ textAlign: 'right', width: '128px' }}>Total Item</th>
                </tr>
              </thead>
              <tbody>
                {quoteJobs.map((j, i) => (
                  <tr key={i}>
                    <td>
                      <p style={{ fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '2px', color: '#1f2937', margin: 0 }}>{j.job_description}</p>
                      <p style={{ fontSize: '9px', textTransform: 'uppercase', fontWeight: 'normal', lineHeight: '1.4', color: '#6b7280', margin: 0 }}>
                        Medidas: {j.use_manual_meters ? `${j.manual_meters}M` : `${j.width}X${j.height} CM`}
                        {j.detailed_description && <><br />{j.detailed_description.toUpperCase()}</>}
                      </p>
                    </td>
                    <td style={{ textAlign: 'center', color: '#1f2937' }}>{j.quantity}</td>
                    <td style={{ textAlign: 'right', fontWeight: 'normal', color: '#4b5563' }}>{formatCurrency(j.finalPrice / j.quantity)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#111827' }}>{formatCurrency(j.finalPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals Section */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '80px' }}>
              <div style={{ width: '288px', display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#374151' }}>INVERSIÓN TOTAL (IVA INCL.)</span>
                  <span style={{ fontSize: '13px', fontStyle: 'italic', fontWeight: 'bold', color: '#000000' }}>
                    {formatCurrency(quoteJobs.reduce((s, j) => s + j.finalPrice, 0))}
                  </span>
                </div>
                <p style={{ fontSize: '8px', fontWeight: 500, textAlign: 'right', marginTop: '8px', textTransform: 'uppercase', color: '#9ca3af', margin: 0 }}>
                  * Valores expresados en pesos colombianos (COP)
                </p>
              </div>
            </div>

            {/* Evidence Photos Section */}
            {deliveryPhotos && deliveryPhotos.length > 0 && (
              <div style={{ marginTop: '20px', marginBottom: '40px' }}>
                <p className="pdf-label" style={{ marginBottom: '12px', borderBottom: '1px solid #f3f4f6', paddingBottom: '4px' }}>Evidencias del trabajo / pruebas de entrega:</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  {deliveryPhotos.map((photo, i) => (
                    <div key={i} style={{ 
                      height: '140px', 
                      borderRadius: '12px', 
                      backgroundColor: '#f9fafb', 
                      overflow: 'hidden',
                      border: '1px solid #f3f4f6'
                    }}>
                      <img 
                        src={photo} 
                        alt={`Evidencia ${i}`} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Acceptance Section - Cleaner */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '48px', 
              marginTop: 'auto', 
              paddingTop: '64px', 
              opacity: 0.6 
            }}>
              <div style={{ paddingTop: '12px', borderTop: '1px solid #d1d5db' }}>
                <p style={{ fontSize: '8px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '32px', color: '#9ca3af', margin: 0 }}>Aceptación y firma cliente</p>
                <p style={{ fontSize: '9px', textTransform: 'uppercase', fontWeight: 900, color: '#9ca3af', margin: 0 }}>{customerInfo.name || 'Firma autorizada'}</p>
              </div>
              <div style={{ paddingTop: '12px', textAlign: 'right', borderTop: '1px solid #d1d5db' }}>
                <p style={{ fontSize: '8px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '32px', color: '#9ca3af', margin: 0 }}>Estrategias DPM SAS</p>
                <p style={{ fontSize: '7px', textTransform: 'uppercase', lineHeight: '2', color: '#d1d5db', margin: 0 }}>Software de gestión y liquidación de proyectos publicitarios</p>
              </div>
            </div>

            {/* Global Footer */}
            <div style={{ textAlign: 'center', marginTop: '48px', paddingTop: '32px', borderTop: '1px solid #f9fafb' }}>
              <p style={{ fontSize: '8px', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.2em', color: '#d1d5db', margin: 0 }}>
                La Unión, Nariño • Colombia
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PDFTemplate;
