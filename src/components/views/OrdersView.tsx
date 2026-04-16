import React from 'react';
import { 
  Package, Search, Clock, Trash2, ChevronRight, User, Phone 
} from 'lucide-react';
import { Order, OrderStatus } from '../../types';

interface OrdersViewProps {
  orders: Order[];
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  deleteOrder: (id: string) => void;
  isAdmin: boolean;
}

const OrdersView: React.FC<OrdersViewProps> = ({ orders, updateOrderStatus, deleteOrder, isAdmin }) => {
  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 pb-20">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
          <h2 className="text-2xl font-black italic tracking-tighter uppercase">Tablero de Producción</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Gestión de órdenes en tiempo real</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(['NUEVA', 'EN_PRODUCCION', 'LISTO_PARA_ENTREGA'] as OrderStatus[]).map(status => (
          <div key={status} className="flex flex-col gap-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {status.replace(/_/g, ' ')}
              </h3>
              <span className="text-[8px] bg-slate-100 text-slate-500 font-black px-2 py-0.5 rounded-full">
                {orders.filter(o => o.status === status).length}
              </span>
            </div>
            
            <div className="space-y-4">
              {orders.filter(o => o.status === status).map(order => (
                <div key={order.id} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:scale-[1.02] transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[9px] font-black brand-text uppercase">{order.id}</span>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {isAdmin && (
                        <button onClick={() => deleteOrder(order.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <User className="w-3 h-3 text-slate-400" />
                      <p className="text-xs font-black uppercase text-slate-900 truncate">{order.customerName}</p>
                    </div>
                    {order.customerPhone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <p className="text-[10px] font-bold text-slate-500 uppercase">{order.customerPhone}</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase">
                      <Clock className="w-3 h-3" />
                      {new Date(order.updatedAt).toLocaleDateString()}
                    </div>
                    <select 
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                      className="bg-slate-50 border-none text-[8px] font-black uppercase tracking-wider rounded-lg px-2 py-1 outline-none ring-1 ring-slate-100 focus:ring-red-500 transition-all"
                    >
                      <option value="NUEVA">NUEVA</option>
                      <option value="EN_PRODUCCION">PRODUCCIÓN</option>
                      <option value="LISTO_PARA_ENTREGA">LISTO</option>
                      <option value="ENTREGADO">ENTREGADO</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrdersView;
