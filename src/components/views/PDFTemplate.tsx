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
      <div id="quote-document" className="p-12 w-[794px]" style={{ backgroundColor: '#ffffff', visibility: 'visible' }}>
        {/* Header Section */}
        <div className="flex justify-between items-start mb-10 pb-8" style={{ borderBottom: '1px solid #f3f4f6' }}>
          <div className="flex gap-6 items-start">
            <div className="w-32 h-20 flex items-center justify-center p-2 rounded" style={{ border: '1px solid #f9fafb', backgroundColor: 'rgba(249, 250, 251, 0.3)' }}>
              {brand.logo ? (
                <img src={brand.logo} alt="Logo" className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
              ) : (
                <div className="text-xl font-bold" style={{ color: '#d1d5db' }}>DPM</div>
              )}
            </div>
            <div className="space-y-1">
              <p className="company-name">{brand.companyName}</p>
              <p className="text-[10px] font-normal leading-relaxed" style={{ color: '#6b7280' }}>
                {brand.address}<br />
                La Unión, Nariño, Colombia<br />
                {brand.email}<br />
                Tel: {brand.phone}<br />
                NIT: {brand.taxId}
              </p>
            </div>
          </div>

          <div className="text-right">
            <h2 className="document-title mb-2">
              {isOrder ? 'ORDEN DE PEDIDO' : 'COTIZACIÓN'}
            </h2>
            <p className="text-[11px] font-bold" style={{ color: '#1f2937' }}>N.º {quoteNumber || '000000'}</p>
            <div className="mt-4 space-y-0.5">
              <p className="text-[9px]" style={{ color: '#6b7280' }}>
                Emisión: <span className="font-medium" style={{ color: '#1f2937' }}>{emissionDate.toLocaleDateString('es-CO')}</span>
              </p>
              {!isOrder && (
                <p className="text-[9px]" style={{ color: '#6b7280' }}>
                  Vence: <span className="font-medium" style={{ color: '#1f2937' }}>{expirationDate.toLocaleDateString('es-CO')}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Client Info Section */}
        <div className="grid grid-cols-2 gap-8 mb-10">
          <div>
            <p className="pdf-label">Cliente:</p>
            <p className="text-[11px] font-bold uppercase" style={{ color: '#111827' }}>{customerInfo.name || "CLIENTE GENERAL"}</p>
            <p className="text-[10px] font-normal mt-1" style={{ color: '#4b5563' }}>{customerInfo.email}</p>
            <p className="text-[10px] font-normal" style={{ color: '#4b5563' }}>{customerInfo.phone}</p>
          </div>
          <div className="text-right">
            <p className="pdf-label">Lugar de servicio:</p>
            <p className="text-[10px] font-normal" style={{ color: '#4b5563' }}>La Unión, Nariño, Colombia</p>
          </div>
        </div>

        {/* Main Table */}
        <table className="w-full pdf-table mb-8">
          <thead>
            <tr>
              <th className="text-left">Descripción detallada del producto o servicio</th>
              <th className="text-center w-24">Cant.</th>
              <th className="text-right w-32">Vr. Unitario</th>
              <th className="text-right w-32">Total Item</th>
            </tr>
          </thead>
          <tbody>
            {quoteJobs.map((j, i) => (
              <tr key={i}>
                <td>
                  <p className="font-bold uppercase mb-0.5" style={{ color: '#1f2937' }}>{j.job_description}</p>
                  <p className="text-[9px] uppercase font-normal leading-normal" style={{ color: '#6b7280' }}>
                    Medidas: {j.use_manual_meters ? `${j.manual_meters}M` : `${j.width}X${j.height} CM`}
                    {j.detailed_description && <><br />{j.detailed_description.toUpperCase()}</>}
                  </p>
                </td>
                <td className="text-center" style={{ color: '#1f2937' }}>{j.quantity}</td>
                <td className="text-right font-normal" style={{ color: '#4b5563' }}>{formatCurrency(j.finalPrice / j.quantity)}</td>
                <td className="text-right font-bold" style={{ color: '#111827' }}>{formatCurrency(j.finalPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals Section */}
        <div className="flex justify-end mb-20">
          <div className="w-72 space-y-2 pt-4" style={{ borderTop: '1px solid #e5e7eb' }}>
             <div className="flex justify-between items-center px-1">
               <span className="text-[11px] font-bold" style={{ color: '#374151' }}>INVERSIÓN TOTAL (IVA INCL.)</span>
               <span className="text-[13px] font-bold italic" style={{ color: '#000000' }}>
                 {formatCurrency(quoteJobs.reduce((s, j) => s + j.finalPrice, 0))}
               </span>
             </div>
             <p className="text-[8px] font-medium text-right mt-2 uppercase tracking-tight" style={{ color: '#9ca3af' }}>
               * Valores expresados en pesos colombianos (COP)
             </p>
          </div>
        </div>

        {/* Acceptance Section - Cleaner */}
        <div className="grid grid-cols-2 gap-12 mt-auto pt-16 opacity-60">
          <div className="pt-3" style={{ borderTop: '1px solid #d1d5db' }}>
            <p className="text-[8px] font-bold uppercase mb-8" style={{ color: '#9ca3af' }}>Aceptación y firma cliente</p>
            <p className="text-[9px] uppercase font-black" style={{ color: '#9ca3af' }}>{customerInfo.name || 'Firma autorizada'}</p>
          </div>
          <div className="pt-3 text-right" style={{ borderTop: '1px solid #d1d5db' }}>
            <p className="text-[8px] font-bold uppercase mb-8" style={{ color: '#9ca3af' }}>Estrategias DPM SAS</p>
            <p className="text-[7px] uppercase leading-loose" style={{ color: '#d1d5db' }}>Software de gestión y liquidación de proyectos publicitarios</p>
          </div>
        </div>

        {/* Global Footer */}
        <div className="text-center mt-12 pt-8" style={{ borderTop: '1px solid #f9fafb' }}>
          <p className="text-[8px] uppercase font-bold tracking-[0.2em]" style={{ color: '#d1d5db' }}>
            La Unión, Nariño • Colombia
          </p>
        </div>
      </div>
    </div>
  );
};

export default PDFTemplate;
