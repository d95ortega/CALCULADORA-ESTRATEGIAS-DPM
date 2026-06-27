import React from 'react';
import { 
  Activity, Clock, Package, ChevronRight 
} from 'lucide-react';
import { HistoryEntry, Order } from '@/types';

interface DashboardViewProps {
  orders: Order[];
  history: HistoryEntry[];
  customers: any[];
}

const DashboardView: React.FC<DashboardViewProps> = ({ orders = [], history = [], customers = [] }) => {
  const safeOrders = Array.isArray(orders) ? orders.filter(Boolean) : [];
  const safeHistory = Array.isArray(history) ? history.filter(Boolean) : [];
  const safeCustomers = Array.isArray(customers) ? customers.filter(Boolean) : [];

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pedidos Activos</p>
          <p className="text-3xl font-black italic tracking-tighter">{safeOrders.length}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cotizaciones Mes</p>
          <p className="text-3xl font-black italic tracking-tighter">{safeHistory.length}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Clientes Totales</p>
          <p className="text-3xl font-black italic tracking-tighter">{safeCustomers.length}</p>
        </div>
        <div className="bg-slate-900 p-6 rounded-3xl shadow-xl">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Ventas Estimadas</p>
          <p className="text-3xl font-black italic tracking-tighter text-white">
            ${Math.round(
              safeHistory
                .filter(h => h && h.status === 'PAGADA')
                .reduce((s, h) => s + (h.total || 0), 0)
            ).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-sm font-black uppercase italic tracking-tighter mb-6 flex items-center gap-2">
            <Clock className="w-4 h-4 brand-text" /> Actividad Reciente
          </h3>
          <div className="space-y-4">
            {safeHistory.slice(0, 5).map(h => {
              const formatDate = (dateStr: any) => {
                if (!dateStr) return 'N/A';
                const d = new Date(dateStr);
                return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString();
              };
              return (
                <div key={h.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-2 rounded-full ${h.status === 'PAGADA' ? 'bg-green-500' : 'bg-amber-500'}`} />
                    <div>
                      <p className="text-xs font-black uppercase">{h.customerName || 'Cliente'}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">{formatDate(h.date)}</p>
                    </div>
                  </div>
                  <p className="text-xs font-black">${Math.round(h.total || 0).toLocaleString()}</p>
                </div>
              );
            })}
          </div>
        </div>
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-sm font-black uppercase italic tracking-tighter mb-6 flex items-center gap-2">
            <Package className="w-4 h-4 brand-text" /> Pedidos en Producción
          </h3>
          <div className="space-y-4">
            {safeOrders.slice(0, 5).map(o => (
              <div key={o.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <div>
                  <p className="text-xs font-black uppercase">{o.customerName || 'Cliente'}</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">{(o.status || '').replace('_', ' ')}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
