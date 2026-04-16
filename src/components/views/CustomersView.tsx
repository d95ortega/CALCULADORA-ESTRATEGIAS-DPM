import React from 'react';
import { 
  Users, UserCheck, Trash2, Phone, Fingerprint, FileText, User as UserIcon
} from 'lucide-react';
import { Customer } from '../../types';

interface CustomersViewProps {
  customers: Customer[];
  saveCustomer: (data: Omit<Customer, 'id'>) => void;
  handleDeleteCustomer: (id: string) => void;
  loadCustomerToCalculator: (c: Customer) => void;
}

const CustomersView: React.FC<CustomersViewProps> = ({ customers, saveCustomer, handleDeleteCustomer, loadCustomerToCalculator }) => {
  return (
    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 pb-20">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-sm mb-8">
        <h4 className="text-sm font-black uppercase italic tracking-tighter flex items-center gap-2">
          <Users className="w-4 h-4 brand-text" /> Base de Datos de Clientes
        </h4>
        <span className="bg-slate-100 px-3 py-1 rounded-full text-[10px] font-bold text-slate-500 uppercase">{customers.length} Registrados</span>
      </div>
      
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm mb-8 space-y-4">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Registrar Nuevo Cliente:</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input 
            type="text" 
            placeholder="Nombre Completo" 
            id="view_cust_name"
            className="bg-slate-50 p-4 rounded-xl text-[11px] font-bold ring-1 ring-slate-200 outline-none focus:ring-red-200"
          />
          <input 
            type="text" 
            placeholder="Teléfono" 
            id="view_cust_phone"
            className="bg-slate-50 p-4 rounded-xl text-[11px] font-bold ring-1 ring-slate-200 outline-none focus:ring-red-200"
          />
          <input 
            type="text" 
            placeholder="Cédula o NIT" 
            id="view_cust_taxid"
            className="bg-slate-50 p-4 rounded-xl text-[11px] font-bold ring-1 ring-slate-200 outline-none focus:ring-red-200"
          />
        </div>
        <button 
          onClick={() => {
            const name = (document.getElementById('view_cust_name') as HTMLInputElement).value;
            const phone = (document.getElementById('view_cust_phone') as HTMLInputElement).value;
            const taxId = (document.getElementById('view_cust_taxid') as HTMLInputElement).value;
            if (name) {
              saveCustomer({
                name,
                phone,
                taxId,
                email: '',
                address: '',
                createdAt: new Date().toISOString(),
                quotesCount: 0
              });
              (document.getElementById('view_cust_name') as HTMLInputElement).value = '';
              (document.getElementById('view_cust_phone') as HTMLInputElement).value = '';
              (document.getElementById('view_cust_taxid') as HTMLInputElement).value = '';
            }
          }}
          className="w-full brand-bg text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-500/10 active:scale-95 transition-all"
        >
          Registrar Cliente
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {customers.map(c => (
          <div key={c.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between group hover:border-red-200 transition-all">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:brand-bg group-hover:text-white transition-all">
                  <UserIcon className="w-5 h-5" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => loadCustomerToCalculator(c)} className="p-2 bg-slate-50 rounded-lg text-slate-400 hover:text-blue-500 transition-all shadow-sm"><UserCheck className="w-4 h-4"/></button>
                  <button onClick={() => handleDeleteCustomer(c.id)} className="p-2 bg-slate-50 rounded-lg text-slate-400 hover:text-red-500 transition-all shadow-sm"><Trash2 className="w-4 h-4"/></button>
                </div>
              </div>
              <p className="text-sm font-black uppercase tracking-tight mb-2">{c.name}</p>
              <div className="space-y-1.5">
                <p className="text-[10px] text-slate-500 font-bold flex items-center gap-2"><Phone className="w-3 h-3 text-slate-300"/> {c.phone}</p>
                {c.taxId && <p className="text-[10px] text-slate-500 font-bold flex items-center gap-2"><Fingerprint className="w-3 h-3 text-slate-300"/> {c.taxId}</p>}
                <p className="text-[10px] text-slate-500 font-bold flex items-center gap-2"><FileText className="w-3 h-3 text-slate-300"/> {c.quotesCount} Cotizaciones</p>
              </div>
            </div>
          </div>
        ))}
        {customers.length === 0 && (
          <div className="col-span-full text-center py-20 opacity-30">
            <Users className="w-12 h-12 mx-auto mb-3" />
            <p className="text-[10px] font-black uppercase tracking-widest italic">No hay clientes registrados</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomersView;
