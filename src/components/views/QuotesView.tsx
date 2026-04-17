import React from 'react';
import { 
  Search, RefreshCcw, Settings, MessageCircle, Trash2, FileText 
} from 'lucide-react';
import { QuoteHistoryEntry, QuoteStatus } from '@/types';

interface QuotesViewProps {
  history: QuoteHistoryEntry[];
  historySearch: string;
  setHistorySearch: (search: string) => void;
  historyFilter: QuoteStatus | 'TODAS';
  setHistoryFilter: (filter: QuoteStatus | 'TODAS') => void;
  updateQuoteStatus: (id: string, status: QuoteStatus) => void;
  handleDeleteQuote: (id: string) => void;
  sendWhatsAppFromHistory: (h: QuoteHistoryEntry) => void;
  loadQuoteToCalculator: (h: QuoteHistoryEntry) => void;
  generatePdf: (customConfig?: { customer: any; items: any[]; quoteId: string; isOrder: boolean; date?: string }) => Promise<void>;
}

const QuotesView: React.FC<QuotesViewProps> = ({
  history, historySearch, setHistorySearch, historyFilter, setHistoryFilter,
  updateQuoteStatus, handleDeleteQuote, sendWhatsAppFromHistory, loadQuoteToCalculator,
  generatePdf
}) => {
  return (
    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 pb-20">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-black italic tracking-tighter uppercase">Historial de Cotizaciones</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Gestión y seguimiento comercial</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filtrar por:</span>
          <select 
            value={historyFilter} 
            onChange={(e) => setHistoryFilter(e.target.value as any)}
            className="bg-slate-50 border-none ring-1 ring-slate-200 rounded-xl px-4 py-2 text-[11px] font-bold text-slate-700 outline-none focus:ring-red-500 transition-all"
          >
            <option value="TODAS">Todas las cotizaciones</option>
            <option value="PENDIENTE">Pendientes</option>
            <option value="ENVIADA">Enviadas</option>
            <option value="APROBADA">Aprobadas</option>
            <option value="PAGADA">Pagadas</option>
            <option value="RECHAZADA">Rechazadas</option>
          </select>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por cliente o descripción..." 
            value={historySearch}
            onChange={(e) => setHistorySearch(e.target.value)}
            className="w-full bg-slate-50 border-none ring-1 ring-slate-200 rounded-xl pl-10 pr-4 py-2 text-[11px] font-bold text-slate-700 outline-none focus:ring-red-500 transition-all"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Número</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Creada el</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Precio total</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Estado</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {history
                .filter(h => {
                  const matchesSearch = h.customerName.toLowerCase().includes(historySearch.toLowerCase()) || 
                                      h.items.some(i => 
                                        i.job_description.toLowerCase().includes(historySearch.toLowerCase()) ||
                                        (i.detailed_description && i.detailed_description.toLowerCase().includes(historySearch.toLowerCase()))
                                      );
                  const matchesFilter = historyFilter === 'TODAS' || h.status === historyFilter;
                  return matchesSearch && matchesFilter;
                })
                .map((h, idx) => (
                  <tr key={h.id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="p-4">
                      <span className="text-[11px] font-black text-slate-400 tracking-tighter">#{String(history.length - idx).padStart(6, '0')}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight">{h.customerName}</span>
                          {h.isDraft && (
                            <span className="bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-widest">Borrador</span>
                          )}
                        </div>
                        <span className="text-[9px] text-slate-400 font-bold uppercase truncate max-w-[200px]">
                          {h.items.map(i => i.detailed_description ? `${i.job_description} (${i.detailed_description})` : i.job_description).join(', ')}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">{new Date(h.date).toLocaleDateString()}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-[11px] font-black text-slate-900 italic tracking-tighter">${Math.round(h.total).toLocaleString()}</span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                          h.status === 'PAGADA' ? 'bg-green-100 text-green-600' : 
                          h.status === 'APROBADA' ? 'bg-blue-100 text-blue-600' :
                          h.status === 'ENVIADA' ? 'bg-amber-100 text-amber-600' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {h.status || 'PENDIENTE'}
                        </div>
                        {h.orderId && (
                          <span className="text-[7px] font-black text-blue-500 uppercase tracking-widest">Pedido: {h.orderId}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2 text-right">
                        <button 
                          onClick={() => generatePdf({ 
                            customer: { 
                              id: '', 
                              name: h.customerName, 
                              phone: h.customerPhone, 
                              email: h.customerEmail || '', 
                              address: h.customerAddress || '', 
                              taxId: '' 
                            }, 
                            items: h.items, 
                            quoteId: String(history.length - idx).padStart(6, '0'),
                            isOrder: !!h.orderId,
                            date: h.date
                          })}
                          title="Descargar PDF"
                          className="p-2 bg-white rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all shadow-sm border border-slate-100"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => loadQuoteToCalculator(h)}
                          title="Cargar Cotización"
                          className="p-2 bg-white rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all shadow-sm border border-slate-100"
                        >
                          <RefreshCcw className="w-3.5 h-3.5" />
                        </button>
                        <div className="relative group/actions">
                          <button className="p-2 bg-white rounded-lg text-slate-400 hover:text-slate-600 transition-all shadow-sm border border-slate-100 focus:outline-none">
                            <Settings className="w-3.5 h-3.5" />
                          </button>
                          <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-2xl border border-slate-100 p-2 hidden group-hover/actions:block z-50 min-w-[180px]">
                            <button 
                              onClick={() => sendWhatsAppFromHistory(h)}
                              className="w-full text-left px-3 py-2 rounded-lg text-[9px] font-black uppercase hover:bg-green-50 text-green-600 transition-all flex items-center gap-2"
                            >
                              <MessageCircle className="w-3.5 h-3.5" /> Reenviar por WhatsApp
                            </button>
                            <div className="h-px bg-slate-100 my-2" />
                            {(['PENDIENTE', 'ENVIADA', 'APROBADA', 'PAGADA', 'RECHAZADA'] as QuoteStatus[]).map(status => (
                              <button
                                key={status}
                                onClick={() => updateQuoteStatus(h.id, status)}
                                className="w-full text-left px-3 py-2 rounded-lg text-[9px] font-black uppercase hover:bg-slate-50 transition-all flex items-center gap-2"
                              >
                                <div className={`w-2 h-2 rounded-full ${
                                  status === 'PAGADA' ? 'bg-green-500' : 
                                  status === 'APROBADA' ? 'bg-blue-500' :
                                  status === 'ENVIADA' ? 'bg-amber-500' :
                                  status === 'RECHAZADA' ? 'bg-red-500' :
                                  'bg-slate-400'
                                }`} />
                                Marcar como {status}
                              </button>
                            ))}
                            <div className="h-px bg-slate-100 my-2" />
                            <button 
                              onClick={() => handleDeleteQuote(h.id)}
                              className="w-full text-left px-3 py-2 rounded-lg text-[9px] font-black uppercase text-red-500 hover:bg-red-50 transition-all flex items-center gap-2"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Eliminar
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {history.length === 0 && (
          <div className="text-center py-20 opacity-30">
            <FileText className="w-12 h-12 mx-auto mb-3" />
            <p className="text-[10px] font-black uppercase tracking-widest italic">No hay historial disponible</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuotesView;
