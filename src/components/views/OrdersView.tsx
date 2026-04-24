import React from 'react';
import { 
  Package, Search, Clock, Trash2, ChevronRight, User, Phone, FileText, Camera, Image as ImageIcon, X, Tag 
} from 'lucide-react';
import { Order, OrderStatus } from '@/types';

interface OrdersViewProps {
  orders: Order[];
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  deleteOrder: (id: string) => void;
  isAdmin: boolean;
  generatePdf: (customConfig?: { customer: any; items: any[]; quoteId: string; isOrder: boolean; isLabel?: boolean; date?: string; deliveryPhotos?: string[] }) => Promise<void>;
  onAddPhoto: (orderId: string, base64: string) => void;
  onRemovePhoto: (orderId: string, index: number) => void;
}

const OrdersView: React.FC<OrdersViewProps> = ({ 
  orders, updateOrderStatus, deleteOrder, isAdmin, generatePdf,
  onAddPhoto, onRemovePhoto
}) => {
  const handlePhotoUpload = (orderId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onAddPhoto(orderId, reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 pb-20">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
          <h2 className="text-2xl font-black italic tracking-tighter uppercase">Tablero de Producción</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Gestión de órdenes en tiempo real</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {(['NUEVA', 'PRODUCCION', 'TERMINADO', 'FINALIZADOS'] as string[]).map(columnStatus => {
          const statusList = columnStatus === 'FINALIZADOS' 
            ? ['ENTREGADO', 'RECIBIDO', 'ENVIADO'] as OrderStatus[]
            : [columnStatus as OrderStatus];
            
          const columnOrders = orders.filter(o => statusList.includes(o.status));
          
          return (
            <div key={columnStatus} className="flex flex-col gap-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {columnStatus === 'PRODUCCION' ? 'En Producción' : 
                   columnStatus === 'TERMINADO' ? 'Terminado' : 
                   columnStatus === 'FINALIZADOS' ? 'Finalizados' : 
                   columnStatus}
                </h3>
                <span className="text-[8px] bg-slate-100 text-slate-500 font-black px-2 py-0.5 rounded-full">
                  {columnOrders.length}
                </span>
              </div>
              
              <div className="space-y-4">
                {columnOrders.map(order => (
                  <div key={order.id} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:scale-[1.02] transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-[9px] font-black brand-text uppercase">{order.id}</span>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => generatePdf({ 
                            customer: { 
                              id: '', 
                              name: order.customerName, 
                              phone: order.customerPhone, 
                              email: order.customerEmail || '', 
                              address: order.customerAddress || '', 
                              taxId: '' 
                            }, 
                            items: order.items, 
                            quoteId: order.id,
                            isOrder: true,
                            date: order.createdAt,
                            deliveryPhotos: order.deliveryPhotos
                          })}
                          className="text-slate-300 hover:text-blue-500 transition-colors"
                          title="Descargar Orden de Pedido"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => generatePdf({ 
                            customer: { 
                              id: '', 
                              name: order.customerName, 
                              phone: order.customerPhone, 
                              email: order.customerEmail || '', 
                              address: order.customerAddress || '', 
                              taxId: '' 
                            }, 
                            items: order.items, 
                            quoteId: order.id,
                            isOrder: true,
                            isLabel: true,
                            date: order.createdAt,
                            deliveryPhotos: order.deliveryPhotos
                          })}
                          className="text-slate-300 hover:text-amber-500 transition-colors"
                          title="Imprimir Etiqueta para Taller"
                        >
                          <Tag className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => deleteOrder(order.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <User className="w-3 h-3 text-slate-400" />
                        <p className="text-xs font-black uppercase text-slate-900 truncate">{order.customerName}</p>
                      </div>
                      
                      <div className="pt-2 pb-1 border-t border-slate-50 space-y-2">
                        {order.items.map((item, i) => (
                          <div key={i} className="flex flex-col bg-slate-50/50 p-2 rounded-xl">
                             <div className="flex justify-between items-start gap-2">
                               <span className="text-[9px] font-black text-slate-800 uppercase leading-tight line-clamp-1 flex-1">{item.job_description}</span>
                               <span className="text-[8px] font-black text-slate-400 uppercase italic">x{item.quantity}</span>
                             </div>
                             {item.detailed_description && (
                               <span className="text-[7px] text-slate-400 font-bold truncate italic mt-0.5">{item.detailed_description}</span>
                             )}
                             <span className="text-[7px] text-slate-300 font-black uppercase tracking-widest mt-0.5">
                               {item.use_manual_meters ? `${item.manual_meters}m` : `${item.width}x${item.height}cm`}
                             </span>
                          </div>
                        ))}
                      </div>

                      {order.customerPhone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <p className="text-[10px] font-bold text-slate-500 uppercase">{order.customerPhone}</p>
                        </div>
                      )}

                      {/* Photo Section */}
                      <div className="pt-2 border-t border-slate-50 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Evidencias ({order.deliveryPhotos?.length || 0})</span>
                          <label className="cursor-pointer group/upload">
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={(e) => handlePhotoUpload(order.id, e)}
                            />
                            <div className="flex items-center gap-1 text-slate-400 group-hover/upload:brand-text transition-colors">
                              <Camera className="w-3 h-3" />
                              <span className="text-[8px] font-black uppercase">Añadir</span>
                            </div>
                          </label>
                        </div>

                        {order.deliveryPhotos && order.deliveryPhotos.length > 0 && (
                          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                            {order.deliveryPhotos.map((photo, idx) => (
                              <div key={idx} className="relative shrink-0 w-12 h-12 rounded-lg bg-slate-100 overflow-hidden border border-slate-100 group/photo shadow-sm">
                                <img 
                                  src={photo} 
                                  alt={`Delivery ${idx}`} 
                                  className="w-full h-full object-cover cursor-pointer"
                                  onClick={() => window.open(photo, '_blank')}
                                  referrerPolicy="no-referrer"
                                />
                                <button 
                                  onClick={() => onRemovePhoto(order.id, idx)}
                                  className="absolute top-0.5 right-0.5 bg-red-500/80 text-white rounded-full p-0.5 opacity-0 group-hover/photo:opacity-100 transition-opacity"
                                >
                                  <X className="w-2 h-2" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
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
                        <option value="PRODUCCION">PRODUCCIÓN</option>
                        <option value="TERMINADO">TERMINADO</option>
                        <option value="ENTREGADO">ENTREGADO</option>
                        <option value="RECIBIDO">RECIBIDO</option>
                        <option value="ENVIADO">ENVIADO</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrdersView;
