import React from 'react';
import { 
  Package, DollarSign, Sliders, Smartphone, ShieldCheck, 
  PlusCircle, Trash2, Info, HelpCircle
} from 'lucide-react';
import { Product, User } from '@/types';

interface SettingsViewProps {
  activeSettingsTab: 'products' | 'costs' | 'params' | 'brand' | 'users';
  setActiveSettingsTab: (tab: 'products' | 'costs' | 'params' | 'brand' | 'users') => void;
  newProduct: Product;
  setNewProduct: React.Dispatch<React.SetStateAction<Product>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  params: any;
  setParams: (params: any) => void;
  handleProductUpdate: (idx: number, field: keyof Product, value: any) => void;
  brand: any;
  setBrand: React.Dispatch<React.SetStateAction<any>>;
  authorizedUsers: User[];
  newUser: { email: string; role: string };
  setNewUser: React.Dispatch<React.SetStateAction<{ email: string; role: string }>>;
  handleAddAuthorizedUser: (e: React.FormEvent) => void;
  handleDeleteAuthorizedUser: (id: string, email: string) => void;
  resetAllData: () => void;
  saveLogoLocal: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  isAdmin: boolean;
  onSaveGlobalSettings: () => Promise<void>;
}

const SettingsView: React.FC<SettingsViewProps> = ({
  activeSettingsTab, setActiveSettingsTab,
  newProduct, setNewProduct, products, setProducts,
  params, setParams, handleProductUpdate,
  brand, setBrand,
  authorizedUsers, newUser, setNewUser, 
  handleAddAuthorizedUser, handleDeleteAuthorizedUser,
  resetAllData, saveLogoLocal, fileInputRef, isAdmin,
  onSaveGlobalSettings
}) => {
  const [testStatus, setTestStatus] = React.useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = React.useState('');
  const [isSavingLocal, setIsSavingLocal] = React.useState(false);
  const [saveLocalSuccess, setSaveLocalSuccess] = React.useState(false);

  const handleGlobalSave = async () => {
    setIsSavingLocal(true);
    try {
      await onSaveGlobalSettings();
      setSaveLocalSuccess(true);
      setTimeout(() => setSaveLocalSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingLocal(false);
    }
  };

  const runDiagnostic = async () => {
    setTestStatus('testing');
    try {
       const result = await (window as any).testFirestoreConnection?.();
       if (result?.success) {
         setTestStatus('success');
         setTestMessage('Conexión exitosa y permisos verificados.');
       } else {
         throw new Error(result?.error || 'Error de permisos o configuración.');
       }
    } catch (error) {
      setTestStatus('error');
      setTestMessage(error instanceof Error ? error.message : 'Error de permisos o conexión.');
    }
  };
  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 pb-20">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="flex border-b overflow-x-auto no-scrollbar bg-slate-50/50">
          {[
            { id: 'products', label: 'Productos', icon: Package },
            { id: 'costs', label: 'Costos', icon: DollarSign },
            { id: 'params', label: 'Parámetros', icon: Sliders },
            { id: 'brand', label: 'Marca', icon: Smartphone },
            { id: 'users', label: 'Usuarios', icon: ShieldCheck }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSettingsTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${
                activeSettingsTab === tab.id 
                  ? 'border-red-600 brand-text bg-white' 
                  : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-100/50'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
        
        <div className="p-8">
          {isAdmin && (
            <div className="mb-8 p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase text-red-900 tracking-tight">Cambios Pendientes</p>
                <p className="text-[8px] text-red-700 font-bold uppercase mt-0.5">Guarda para que todos los usuarios vean los cambios</p>
              </div>
              <button 
                onClick={handleGlobalSave} 
                disabled={isSavingLocal}
                className="px-6 py-3 brand-bg text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-red-500/20 active:scale-95 transition-all flex items-center gap-2"
              >
                {isSavingLocal ? 'Guardando...' : saveLocalSuccess ? '¡Guardado!' : 'Guardar Globalmente'}
              </button>
            </div>
          )}

          {activeSettingsTab === 'products' && (
            <div className="space-y-6">
              <div className="bg-slate-900 p-6 rounded-3xl space-y-4">
                <h4 className="text-[10px] font-black uppercase brand-text flex items-center gap-2"><PlusCircle className="w-3 h-3"/> Nuevo Producto</h4>
                <input type="text" placeholder="Nombre..." value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full bg-slate-800 p-3 rounded-xl text-white text-xs font-bold border-none ring-1 ring-slate-700 outline-none" />
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" placeholder="P. Final $" value={newProduct.priceFinal || ''} onChange={e => setNewProduct({...newProduct, priceFinal: parseFloat(e.target.value) || 0})} className="w-full bg-slate-800 p-3 rounded-xl text-white text-xs font-bold border-none ring-1 ring-slate-700 outline-none" />
                  <input type="number" placeholder="P. Publi $" value={newProduct.pricePublisher || ''} onChange={e => setNewProduct({...newProduct, pricePublisher: parseFloat(e.target.value) || 0})} className="w-full bg-slate-800 p-3 rounded-xl text-white text-xs font-bold border-none ring-1 ring-slate-700 outline-none" />
                </div>
                <button onClick={() => { if(newProduct.name) { setProducts(p => [newProduct, ...p]); setNewProduct({name:'', priceFinal:0, pricePublisher:0, designTime:30}); } }} className="w-full brand-bg text-white py-4 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-red-500/20 active:scale-95 transition-all">Crear Producto</button>
              </div>
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 no-scrollbar">
                {products.map((p, idx) => (
                    <div key={idx} className="bg-slate-50 p-4 rounded-2xl border flex flex-col gap-3 group">
                    <div className="flex justify-between items-center"><span className="text-[10px] font-black uppercase group-hover:brand-text">{p.name}</span><button onClick={() => setProducts(pr => pr.filter((_, i) => i !== idx))} className="text-slate-300 hover:text-red-500"><Trash2 className="w-4 h-4"/></button></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="relative"><span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-black">$</span><input type="number" step="0.01" value={p.priceFinal} onChange={e => handleProductUpdate(idx, 'priceFinal', parseFloat(e.target.value) || 0)} className="w-full p-2 pl-5 bg-white rounded-lg ring-1 ring-slate-100 text-xs font-bold" /></div>
                        <div className="relative"><span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-black">$</span><input type="number" step="0.01" value={p.pricePublisher} onChange={e => handleProductUpdate(idx, 'pricePublisher', parseFloat(e.target.value) || 0)} className="w-full p-2 pl-5 bg-white rounded-lg ring-1 ring-slate-100 text-xs font-bold" /></div>
                    </div>
                    </div>
                ))}
              </div>
            </div>
          )}
          
          {activeSettingsTab === 'costs' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-widest border-b pb-2">Materiales Acrílico DPM (cm²)</h4>
                {params.acrylic_materials.map((m: any, idx: number) => (
                  <div key={m.id} className="bg-slate-50 p-4 rounded-2xl border flex gap-4 items-center">
                    <input type="text" value={m.name} onChange={e => { const updated = [...params.acrylic_materials]; updated[idx].name = e.target.value; setParams({...params, acrylic_materials: updated}); }} className="flex-1 bg-white p-3 rounded-xl text-xs font-bold ring-1 ring-slate-100" />
                    <div className="relative w-32"><span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">$</span><input type="number" step="0.001" value={m.cost_per_cm2} onChange={e => { const updated = [...params.acrylic_materials]; updated[idx].cost_per_cm2 = parseFloat(e.target.value) || 0; setParams({...params, acrylic_materials: updated}); }} className="w-full p-3 pl-5 bg-white rounded-xl text-xs font-bold ring-1 ring-slate-100" /></div>
                  </div>
                ))}
              </div>
              
              <div className="space-y-4">
                <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-widest border-b pb-2">Precios de Bases (m²)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Estructura Acrílico</label>
                    <input type="number" value={params.base_prices.estructura_acrilico} onChange={e => setParams({...params, base_prices: {...params.base_prices, estructura_acrilico: parseFloat(e.target.value)||0}})} className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold ring-1 ring-slate-100" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Estructura Lona</label>
                    <input type="number" value={params.base_prices.estructura_lona} onChange={e => setParams({...params, base_prices: {...params.base_prices, estructura_lona: parseFloat(e.target.value)||0}})} className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold ring-1 ring-slate-100" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">MDF</label>
                    <input type="number" value={params.base_prices.mdf} onChange={e => setParams({...params, base_prices: {...params.base_prices, mdf: parseFloat(e.target.value)||0}})} className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold ring-1 ring-slate-100" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Extra Iluminación</label>
                    <input type="number" value={params.lighting_extra} onChange={e => setParams({...params, lighting_extra: parseFloat(e.target.value)||0})} className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold ring-1 ring-slate-100" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSettingsTab === 'params' && (
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex gap-3 items-start">
                <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] font-black text-blue-900 uppercase tracking-tight">Guía de Parámetros</p>
                  <p className="text-[10px] text-blue-700 font-medium leading-relaxed mt-1">
                    Estos valores afectan directamente el cálculo de todas las cotizaciones. Los márgenes de utilidad se aplican después de sumar todos los costos base.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase">Tarifa Hora Laboral ($)</label>
                        <HelpCircle className="w-3 h-3 text-slate-300 cursor-help" title="Costo por hora de mano de obra del personal técnico." />
                    </div>
                    <span className="text-[8px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-bold uppercase">Mano de Obra</span>
                    </div>
                    <input type="number" value={params.hourly_rate} onChange={e => setParams({...params, hourly_rate: parseFloat(e.target.value)||0})} className="w-full p-4 bg-slate-50 rounded-2xl text-xs font-bold border-none ring-1 ring-slate-200" />
                </div>
                
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase">Porcentaje IVA (0.19)</label>
                        <HelpCircle className="w-3 h-3 text-slate-300 cursor-help" title="Impuesto al Valor Agregado aplicado al precio final (ej: 0.19 para 19%)." />
                    </div>
                    <span className="text-[8px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-bold uppercase">Impuestos</span>
                    </div>
                    <input type="number" step="0.01" value={params.iva} onChange={e => setParams({...params, iva: parseFloat(e.target.value)||0})} className="w-full p-4 bg-slate-50 rounded-2xl text-xs font-bold border-none ring-1 ring-slate-200" />
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase">Margen Utilidad Final (0.35)</label>
                        <HelpCircle className="w-3 h-3 text-slate-300 cursor-help" title="Porcentaje de ganancia esperado para clientes particulares." />
                    </div>
                    <span className="text-[8px] bg-green-50 px-1.5 py-0.5 rounded text-green-600 font-bold uppercase">Ganancia</span>
                    </div>
                    <input type="number" step="0.01" value={params.profit_margin_final} onChange={e => setParams({...params, profit_margin_final: parseFloat(e.target.value)||0})} className="w-full p-4 bg-slate-50 rounded-2xl text-xs font-bold border-none ring-1 ring-slate-200" />
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase">Margen Utilidad Publi (0.20)</label>
                        <HelpCircle className="w-3 h-3 text-slate-300 cursor-help" title="Porcentaje de ganancia reducido para agencias o revendedores." />
                    </div>
                    <span className="text-[8px] bg-green-50 px-1.5 py-0.5 rounded text-green-600 font-bold uppercase">Ganancia</span>
                    </div>
                    <input type="number" step="0.01" value={params.profit_margin_publisher} onChange={e => setParams({...params, profit_margin_publisher: parseFloat(e.target.value)||0})} className="w-full p-4 bg-slate-50 rounded-2xl text-xs font-bold border-none ring-1 ring-slate-200" />
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase">Factor Vinilo (Acrílico)</label>
                        <HelpCircle className="w-3 h-3 text-slate-300 cursor-help" title="Multiplicador aplicado al costo base del vinilo para cubrir instalación y adhesivos." />
                    </div>
                    <span className="text-[8px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-bold uppercase">Multiplicador</span>
                    </div>
                    <input type="number" step="0.1" value={params.vinilo_factor || 2.4} onChange={e => setParams({...params, vinilo_factor: parseFloat(e.target.value)||0})} className="w-full p-4 bg-slate-50 rounded-2xl text-xs font-bold border-none ring-1 ring-slate-200" />
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase">Factor Lona (Acrílico)</label>
                        <HelpCircle className="w-3 h-3 text-slate-300 cursor-help" title="Multiplicador aplicado al costo base de la lona para cubrir refuerzos y ojales." />
                    </div>
                    <span className="text-[8px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-bold uppercase">Multiplicador</span>
                    </div>
                    <input type="number" step="0.1" value={params.lona_factor || 2.3} onChange={e => setParams({...params, lona_factor: parseFloat(e.target.value)||0})} className="w-full p-4 bg-slate-50 rounded-2xl text-xs font-bold border-none ring-1 ring-slate-200" />
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase">Costo LED por cm ($)</label>
                        <HelpCircle className="w-3 h-3 text-slate-300 cursor-help" title="Precio de venta por cada centímetro de cinta LED instalada." />
                    </div>
                    <span className="text-[8px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-bold uppercase">Material</span>
                    </div>
                    <input type="number" value={params.led_cost_per_cm || 130} onChange={e => setParams({...params, led_cost_per_cm: parseFloat(e.target.value)||0})} className="w-full p-4 bg-slate-50 rounded-2xl text-xs font-bold border-none ring-1 ring-slate-200" />
                </div>
              </div>
            </div>
          )}

          {activeSettingsTab === 'brand' && (
            <div className="space-y-6">
              <div className="bg-slate-100 p-8 rounded-3xl border-2 border-dashed border-slate-200 text-center space-y-4">
                <div className={`${brand.logo ? 'bg-white' : 'bg-white'} mx-auto w-24 h-24 rounded-3xl shadow-xl flex items-center justify-center overflow-hidden border border-slate-200 p-0`}>
                  {brand.logo ? <img src={brand.logo} alt="Logo preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <Smartphone className="w-10 h-10 text-slate-200" />}
                </div>
                <div>
                  <input type="file" ref={fileInputRef} onChange={saveLogoLocal} accept="image/*" className="hidden" />
                  <button onClick={() => fileInputRef.current?.click()} className="px-6 py-3 brand-bg text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-500/20 active:scale-95 transition-all">Cambiar Logo</button>
                  <p className="text-[8px] text-slate-400 uppercase font-bold mt-3">Recomendado: PNG Transparente 512x512px</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Nombre Empresa</label>
                  <input type="text" value={brand.companyName} onChange={e => setBrand({...brand, companyName: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Color Principal</label>
                  <input type="color" value={brand.primaryColor} onChange={e => setBrand({...brand, primaryColor: e.target.value})} className="w-full h-10 p-1 bg-slate-50 rounded-xl border-none cursor-pointer" />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Eslogan</label>
                  <input type="text" value={brand.slogan} onChange={e => setBrand({...brand, slogan: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold" />
                </div>
              </div>
              
              <div className="pt-6 border-t space-y-4">
                 <div className="bg-slate-50 p-4 rounded-2xl border flex items-center justify-between">
                   <div className="flex items-center gap-3">
                     <div className={`w-3 h-3 rounded-full ${testStatus === 'success' ? 'bg-green-500' : testStatus === 'error' ? 'bg-red-500' : 'bg-slate-300'}`} />
                     <div>
                       <p className="text-[10px] font-black uppercase">Estado Base de Datos</p>
                       <p className="text-[8px] text-slate-500 font-bold uppercase">{testMessage || 'Sin diagnóstico'}</p>
                     </div>
                   </div>
                   <button 
                    onClick={runDiagnostic} 
                    disabled={testStatus === 'testing'}
                    className="px-4 py-2 bg-white text-slate-600 border rounded-xl text-[9px] font-black uppercase hover:bg-slate-50 transition-all disabled:opacity-50"
                   >
                     {testStatus === 'testing' ? 'Probando...' : 'Re-verificar'}
                   </button>
                 </div>
                 <button onClick={resetAllData} className="w-full bg-slate-100 text-slate-400 hover:text-red-500 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">Restablecer Configuración de Fábrica</button>
              </div>
            </div>
          )}

          {activeSettingsTab === 'users' && (
            <div className="space-y-8">
              <div className="bg-slate-900 p-8 rounded-[2rem] space-y-6">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="brand-text w-6 h-6" />
                  <h4 className="text-[12px] font-black text-white uppercase tracking-[0.2em]">Gestión de Personal</h4>
                </div>
                <form onSubmit={handleAddAuthorizedUser} className="flex gap-3">
                  <input 
                    type="email" 
                    placeholder="Correo de Google..." 
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="flex-1 bg-slate-800 border border-slate-700 p-4 rounded-xl text-white text-xs font-bold outline-none focus:border-red-500 transition-all"
                    required
                  />
                  <select 
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                    className="bg-slate-800 border border-slate-700 p-4 rounded-xl text-white text-[10px] font-black uppercase outline-none"
                  >
                    <option value="user">DISEÑO</option>
                    <option value="admin">ADMIN</option>
                  </select>
                  <button type="submit" className="brand-bg text-white px-8 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-500/20 active:scale-95 transition-all">Añadir</button>
                </form>
              </div>

              <div className="space-y-3">
                {authorizedUsers.map(u => (
                  <div key={u.id} className="bg-white p-4 rounded-2xl border flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className={`w-2 h-2 rounded-full ${u.role === 'ADMIN' ? 'bg-red-500' : 'bg-blue-500'}`} />
                      <div>
                        <p className="text-xs font-black uppercase">{u.email}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{u.role}</p>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteAuthorizedUser(u.id, u.email)} className="text-slate-200 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
