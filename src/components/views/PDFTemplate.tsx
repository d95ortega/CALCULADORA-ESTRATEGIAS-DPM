import React from 'react';
import { Smartphone, Phone } from 'lucide-react';
import { BrandSettings, Customer, SavedJob } from '../../types';

interface PDFTemplateProps {
  brand: BrandSettings;
  customerInfo: Customer;
  quoteJobs: SavedJob[];
}

const PDFTemplate: React.FC<PDFTemplateProps> = ({ brand, customerInfo, quoteJobs }) => {
  return (
    <div className="pdf-capture-container" style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
      <div id="quote-document" className="bg-white p-12 w-[800px]">
        <div className="flex justify-between items-start mb-10 border-b-8 border-slate-900 pb-8">
          <div className="flex items-center gap-6">
            <div className="bg-white p-2 rounded-2xl shadow-xl border border-slate-100 flex items-center justify-center w-24 h-24 overflow-hidden">
              {brand.logo ? (
                <img src={brand.logo} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
              ) : (
                <Smartphone className="brand-text w-12 h-12" />
              )}
            </div>
            <div>
              <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none">{brand.companyName}</h1>
              <p className="text-lg font-bold text-slate-400 uppercase tracking-[0.4em] mt-2">{brand.slogan}</p>
            </div>
          </div>
          <div className="text-right flex flex-col items-end gap-1">
            <div className="bg-slate-900 text-white px-6 py-2 rounded-2xl flex items-center gap-3 shadow-xl mb-2">
               <Phone className="w-5 h-5 text-red-500" />
               <span className="font-black text-xl tracking-tighter">{brand.phone}</span>
            </div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{brand.address}</p>
            <p className="text-slate-400 text-[9px] font-bold uppercase">{brand.email}</p>
          </div>
        </div>
        
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-5xl font-black uppercase italic tracking-tighter text-slate-900 border-l-[20px] border-red-600 pl-8">Cotización</h2>
            <p className="text-slate-400 font-bold uppercase mt-2 ml-8 tracking-[0.3em] text-[10px]">Propuesta Comercial y Técnica</p>
          </div>
          <div className="text-right space-y-0.5">
            <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest">Documento Expedido el:</p>
            <p className="text-slate-900 text-xl font-black italic">{new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>

        <div className="bg-slate-50 p-8 rounded-3xl border-4 border-slate-100 mb-10 flex justify-between items-center shadow-inner">
           <div className="space-y-1">
              <span className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">Cliente:</span>
              <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">{customerInfo.name || "CLIENTE GENERAL"}</h3>
           </div>
           <div className="text-right space-y-1">
              <span className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">Referencia</span>
              <p className="text-xl font-black text-slate-900 italic">#DPM-{Math.floor(Math.random()*9000)+1000}</p>
           </div>
        </div>

        <table className="w-full mb-10">
          <thead>
            <tr className="bg-slate-900 text-white text-[12px] font-black uppercase tracking-[0.3em]">
              <th className="p-6 text-left rounded-l-2xl">Descripción Detallada</th>
              <th className="p-6 text-center">Cant.</th>
              <th className="p-6 text-right rounded-r-2xl">Total Item</th>
            </tr>
          </thead>
          <tbody className="divide-y-[8px] divide-white">
            {quoteJobs.map((j, i) => (
              <tr key={i} className="bg-slate-50">
                <td className="p-8 rounded-l-2xl">
                  <p className="font-black text-slate-900 uppercase text-2xl mb-2 tracking-tighter italic">{j.job_description}</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-white px-4 py-1.5 rounded-xl text-[11px] font-black text-slate-600 uppercase border-2 border-slate-100">
                      DIM: {j.use_manual_meters ? `${j.manual_meters}m` : `${j.width}x${j.height}cm`}
                    </span>
                    {j.include_design && <span className="bg-red-50 px-4 py-1.5 rounded-xl text-[11px] font-black text-red-600 uppercase border-2 border-red-100 italic">Diseño Incluido</span>}
                  </div>
                </td>
                <td className="p-8 text-center font-black text-slate-900 text-3xl italic">{j.quantity}</td>
                <td className="p-8 text-right font-black brand-text text-3xl rounded-r-2xl italic">${Math.round(j.finalPrice).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2} className="p-10 text-right font-black uppercase text-xl text-slate-400 italic">Inversión Final (IVA Incluido)</td>
              <td className="p-10 text-right text-5xl font-black text-slate-900 italic tracking-tighter leading-none">${Math.round(quoteJobs.reduce((s, j) => s + j.finalPrice, 0)).toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>

        <div className="grid grid-cols-2 gap-12 mt-20">
          <div className="border-t-[4px] border-slate-100 pt-6">
            <p className="text-slate-300 text-[10px] font-black uppercase tracking-[0.3em] mb-6">Aceptación y Firma Cliente</p>
            <div className="h-12"></div>
            <p className="text-slate-400 font-bold uppercase text-[11px]">{customerInfo.name || "____________________"}</p>
          </div>
          <div className="border-t-[4px] border-slate-900 pt-6">
            <p className="text-slate-900 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Estrategias DPM SAS</p>
            <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest leading-relaxed">Software de Gestión y Liquidación de Proyectos Publicitarios.</p>
          </div>
        </div>
        
        <div className="mt-16 text-center border-t border-slate-100 pt-6">
           <p className="text-slate-300 text-[8px] font-bold uppercase tracking-[0.5em]">La Unión, Nariño • Colombia</p>
        </div>
      </div>
    </div>
  );
};

export default PDFTemplate;
