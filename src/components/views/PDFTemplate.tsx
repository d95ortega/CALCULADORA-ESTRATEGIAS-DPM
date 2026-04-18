import React from 'react';
import { Smartphone, Phone } from 'lucide-react';
import { BrandSettings, Customer, SavedJob } from '@/types';

interface PDFTemplateProps {
  brand: BrandSettings;
  customerInfo: Customer;
  quoteJobs: SavedJob[];
  quoteNumber?: string;
  isOrder?: boolean;
  date?: string;
}

const PDFTemplate: React.FC<PDFTemplateProps> = ({ brand, customerInfo, quoteJobs, quoteNumber, isOrder, date }) => {
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
        width: '794px', // A4/Letter roughly
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
        padding: '30px', /* p-12 equivalent */
        width: '794px',
        boxSizing: 'border-box',
        minHeight: '1123px',
        display: 'flex',
        flexDirection: 'column'
      }}>
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
              width: '128px', 
              height: '80px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              padding: '8px', 
              borderRadius: '4px', 
              border: '1px solid #f9fafb', 
              backgroundColor: 'rgba(249, 250, 251, 0.3)' 
            }}>
              {brand.logo ? (
                <img src={brand.logo} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} referrerPolicy="no-referrer" />
              ) : (
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#d1d5db' }}>DPM</div>
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
      </div>
    </div>
  );
};

export default PDFTemplate;
