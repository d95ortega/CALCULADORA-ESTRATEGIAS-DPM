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
      <div id="quote-document" className="bg-white p-12 w-[794px]" style={{ visibility: 'visible' }}>
        {/* Header Section */}
        <div className="flex justify-between items-start mb-10 border-b border-gray-100 pb-8">
          <div className="flex gap-6 items-start">
            <div className="w-32 h-20 flex items-center justify-center p-2 border border-gray-50 rounded bg-gray-50/30">
              {brand.logo ? (
                <img src={brand.logo} alt="Logo" className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
              ) : (
                <div className="text-xl font-bold text-gray-300">DPM</div>
              )}
            </div>
            <div className="space-y-1">
              <p className="company-name">{brand.companyName}</p>
              <p className="text-[10px] text-gray-500 font-normal leading-relaxed">
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
            <p className="text-[11px] font-bold text-gray-800">N.º {quoteNumber || '000000'}</p>
            <div className="mt-4 space-y-0.5">
              <p className="text-[9px] text-gray-500">
                Emisión: <span className="text-gray-800 font-medium">{emissionDate.toLocaleDateString('es-CO')}</span>
              </p>
              {!isOrder && (
                <p className="text-[9px] text-gray-500">
                  Vence: <span className="text-gray-800 font-medium">{expirationDate.toLocaleDateString('es-CO')}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Client Info Section */}
        <div className="grid grid-cols-2 gap-8 mb-10">
          <div>
            <p className="pdf-label">Cliente:</p>
            <p className="text-[11px] font-bold text-gray-900 uppercase">{customerInfo.name || "CLIENTE GENERAL"}</p>
            <p className="text-[10px] text-gray-600 font-normal mt-1">{customerInfo.email}</p>
            <p className="text-[10px] text-gray-600 font-normal">{customerInfo.phone}</p>
          </div>
          <div className="text-right">
            <p className="pdf-label">Lugar de servicio:</p>
            <p className="text-[10px] text-gray-600 font-normal">La Unión, Nariño, Colombia</p>
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
                  <p className="font-bold text-gray-800 uppercase mb-0.5">{j.job_description}</p>
                  <p className="text-[9px] text-gray-500 uppercase font-normal leading-normal">
                    Medidas: {j.use_manual_meters ? `${j.manual_meters}M` : `${j.width}X${j.height} CM`}
                    {j.detailed_description && <><br />{j.detailed_description.toUpperCase()}</>}
                  </p>
                </td>
                <td className="text-center text-gray-800">{j.quantity}</td>
                <td className="text-right text-gray-600 font-normal">{formatCurrency(j.finalPrice / j.quantity)}</td>
                <td className="text-right font-bold text-gray-900">{formatCurrency(j.finalPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals Section */}
        <div className="flex justify-end mb-20">
          <div className="w-72 space-y-2 border-t border-gray-200 pt-4">
             <div className="flex justify-between items-center px-1">
               <span className="text-[11px] font-bold text-gray-700">INVERSIÓN TOTAL (IVA INCL.)</span>
               <span className="text-[13px] font-bold text-black italic">
                 {formatCurrency(quoteJobs.reduce((s, j) => s + j.finalPrice, 0))}
               </span>
             </div>
             <p className="text-[8px] text-gray-400 font-medium text-right mt-2 uppercase tracking-tight">
               * Valores expresados en pesos colombianos (COP)
             </p>
          </div>
        </div>

        {/* Acceptance Section - Cleaner */}
        <div className="grid grid-cols-2 gap-12 mt-auto pt-16 opacity-60">
          <div className="border-t border-gray-300 pt-3">
            <p className="text-[8px] font-bold text-gray-400 uppercase mb-8">Aceptación y firma cliente</p>
            <p className="text-[9px] text-gray-400 uppercase font-black">{customerInfo.name || 'Firma autorizada'}</p>
          </div>
          <div className="border-t border-gray-300 pt-3 text-right">
            <p className="text-[8px] font-bold text-gray-400 uppercase mb-8">Estrategias DPM SAS</p>
            <p className="text-[7px] text-gray-300 uppercase leading-loose">Software de gestión y liquidación de proyectos publicitarios</p>
          </div>
        </div>

        {/* Global Footer */}
        <div className="text-center mt-12 pt-8 border-t border-gray-50">
          <p className="text-[8px] text-gray-300 uppercase font-bold tracking-[0.2em]">
            La Unión, Nariño • Colombia
          </p>
        </div>
      </div>
    </div>
  );
};

export default PDFTemplate;
