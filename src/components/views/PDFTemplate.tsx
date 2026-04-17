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
        width: '850px',
        zIndex: -100, 
        visibility: 'hidden', 
        pointerEvents: 'none',
        backgroundColor: 'white'
      }}
    >
      <style>
        {`
          #quote-document {
            font-family: 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
            color: #1a1a1a !important;
          }
          
          .pdf-label {
            font-size: 10px !important;
            font-weight: 800 !important;
            color: #666 !important;
            text-transform: uppercase !important;
            letter-spacing: 0.05em !important;
          }

          .pdf-value {
            font-size: 12px !important;
            font-weight: 500 !important;
            color: #1a1a1a !important;
          }

          .pdf-table th {
            font-size: 11px !important;
            font-weight: 800 !important;
            text-transform: uppercase !important;
            color: #334155 !important;
            border-bottom: 1px solid #e2e8f0 !important;
            padding: 12px 8px !important;
          }

          .pdf-table td {
            font-size: 12px !important;
            padding: 16px 8px !important;
            border-bottom: 1px solid #f1f5f9 !important;
            vertical-align: top !important;
          }
        `}
      </style>
      <div id="quote-document" className="bg-white p-16 w-[800px]" style={{ visibility: 'visible' }}>
        {/* Header Section */}
        <div className="flex justify-between items-start mb-12">
          <div className="space-y-4">
            <div className="w-48 h-24 flex items-center mb-4">
              {brand.logo ? (
                <img src={brand.logo} alt="Logo" className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-16 h-16 brand-bg rounded-xl flex items-center justify-center text-white font-black text-2xl tracking-tighter italic">DPM</div>
              )}
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-black uppercase text-slate-800 tracking-tight">{brand.companyName}</p>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                {brand.address}<br />
                La Unión, Nariño<br />
                Colombia<br />
                {brand.email}<br />
                Teléfono: {brand.phone}<br />
                ID de la compañía: {brand.taxId}
              </p>
            </div>
          </div>

          <div className="text-right pt-2">
            <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 mb-4">
              {isOrder ? 'ORDEN DE PEDIDO' : 'COTIZACIÓN'} n.º {quoteNumber || '000000'}
            </h2>
            <div className="space-y-1">
              <p className="text-[11px] text-slate-500 font-medium">
                Fecha de emisión: {emissionDate.toLocaleDateString('es-CO')}
              </p>
              <p className="text-[11px] text-slate-500 font-medium">
                Fecha de vencimiento: {expirationDate.toLocaleDateString('es-CO')}
              </p>
            </div>
          </div>
        </div>

        {/* Client Info Section */}
        <div className="mb-12">
          <p className="pdf-label mb-2">Información del cliente:</p>
          <div className="space-y-0.5">
            <p className="text-sm font-black uppercase text-slate-800">{customerInfo.name || "CLIENTE GENERAL"}</p>
            <p className="text-[11px] text-slate-500 font-medium">{customerInfo.email || "No registrado"}</p>
            <p className="text-[11px] text-slate-500 font-medium">Teléfono: {customerInfo.phone || "No registrado"}</p>
          </div>
        </div>

        {/* Products Title */}
        <div className="mb-2 border-b-2 border-slate-100 pb-2">
          <h3 className="text-lg font-black uppercase text-slate-900 tracking-tight">
            {customerInfo.name ? `${customerInfo.name.toUpperCase()} ` : ''}PRODUCTOS {isOrder ? 'A ENTREGAR' : 'COTIZADOS'}
          </h3>
        </div>

        {/* Main Table */}
        <table className="w-full pdf-table mb-8">
          <thead>
            <tr>
              <th className="text-left w-2/3">Producto o servicio</th>
              <th className="text-center">Cantidad</th>
              <th className="text-right">Precio</th>
              <th className="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {quoteJobs.map((j, i) => (
              <tr key={i}>
                <td>
                  <p className="font-bold text-slate-900 uppercase mb-1 leading-tight">{j.job_description}</p>
                  <p className="text-[10px] text-slate-500 uppercase font-medium leading-relaxed">
                    DE {j.use_manual_meters ? `${j.manual_meters}M` : `${j.width}X${j.height} CM`}
                    {j.detailed_description && <><br />{j.detailed_description.toUpperCase()}</>}
                  </p>
                </td>
                <td className="text-center font-bold text-slate-900">{j.quantity}</td>
                <td className="text-right text-slate-700 font-medium">{formatCurrency(j.finalPrice / j.quantity)}</td>
                <td className="text-right font-bold text-slate-900">{formatCurrency(j.finalPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals Section */}
        <div className="flex justify-end mb-16 px-2">
          <div className="w-64 space-y-3">
             <div className="flex justify-between items-center border-t-2 border-slate-900 pt-4">
               <span className="text-sm font-black uppercase text-slate-900 tracking-tight">TOTAL FINAL</span>
               <span className="text-lg font-black text-slate-900 italic">
                 {formatCurrency(quoteJobs.reduce((s, j) => s + j.finalPrice, 0))}
               </span>
             </div>
             <p className="text-[9px] text-slate-400 font-bold uppercase text-right italic">
               * Valores incluyen IVA del 19%
             </p>
          </div>
        </div>

        {/* Terms or Footer if any, matching the clean image style */}
        <div className="mt-auto pt-12 border-t border-slate-100 text-center">
          <p className="text-[9px] text-slate-300 font-black uppercase tracking-[0.4em] italic mb-2">
            {brand.companyName} • LA UNIÓN, NARIÑO • COLOMBIA
          </p>
          <p className="text-[8px] text-slate-200 uppercase font-bold">
            Documento generado electrónicamente por Software Estrategias DPM
          </p>
        </div>
      </div>
    </div>
  );
};

export default PDFTemplate;
