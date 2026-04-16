import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calculator, Package, PenTool, MoveHorizontal, Hash, Wrench, Type, Zap, Save, RefreshCcw,
  Trash2, Plus, FileText, Search, UserCheck, DollarSign, Download, PlusCircle, Box, TrendingUp, ShieldCheck,
  ChevronRight, Phone, MessageCircle, X, Power, Building2, Smartphone
} from 'lucide-react';
import { Product, FormData, SavedJob, Customer, QuoteStatus } from '@/types';
const WhatsAppIcon = MessageCircle; // Simple alias if not available

interface CalculatorViewProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  products: Product[];
  params: any;
  quote: any;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handleSaveJob: () => void;
  isAcrilicoJob: boolean;
  isAnyPendon: boolean;
  savedJobs: SavedJob[];
  setSavedJobs: React.Dispatch<React.SetStateAction<SavedJob[]>>;
  saveToHistoryFromDraft: (job: SavedJob) => void;
  
  // Sidebar / Final Quote Props
  quoteJobs: SavedJob[];
  setQuoteJobs: React.Dispatch<React.SetStateAction<SavedJob[]>>;
  customerInfo: Customer;
  setCustomerInfo: React.Dispatch<React.SetStateAction<Customer>>;
  initialStatus: QuoteStatus;
  setInitialStatus: (status: QuoteStatus) => void;
  isSaving: boolean;
  saveSuccess: boolean;
  saveToHistory: (status: QuoteStatus) => Promise<void>;
  generatePdf: () => void;
  sendWhatsApp: () => void;
  saveCustomer: (c: Omit<Customer, 'id'>) => void;
  setActiveView: (view: any) => void;
}

const CalculatorView: React.FC<CalculatorViewProps> = ({
  formData, setFormData, products, params, quote,
  handleInputChange, handleSaveJob, isAcrilicoJob, isAnyPendon,
  savedJobs, setSavedJobs, saveToHistoryFromDraft,
  quoteJobs, setQuoteJobs, customerInfo, setCustomerInfo,
  initialStatus, setInitialStatus, isSaving, saveSuccess,
  saveToHistory, generatePdf, sendWhatsApp, saveCustomer, setActiveView
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 pb-20"
    >
      {/* SECCION 1: COTIZADOR (Inputs) */}
      <section className="lg:col-span-4 bg-white p-8 rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-100 flex flex-col h-full relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-50"></div>
        
        <div className="flex items-center justify-between mb-8 relative z-10">
          <div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3 italic">
              <div className="p-2 brand-bg rounded-xl shadow-lg shadow-red-500/20">
                <Calculator className="text-white w-6 h-6" />
              </div>
              Cotizador
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 ml-12">Configuración de Proyecto</p>
          </div>
          <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            <button 
              onClick={() => setFormData({...formData, customer_type: 'final'})} 
              className={`px-5 py-2.5 text-[10px] font-black uppercase rounded-xl transition-all duration-300 ${formData.customer_type === 'final' ? 'bg-white shadow-xl brand-text scale-105' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Final
            </button>
            <button 
              onClick={() => setFormData({...formData, customer_type: 'publicista'})} 
              className={`px-5 py-2.5 text-[10px] font-black uppercase rounded-xl transition-all duration-300 ${formData.customer_type === 'publicista' ? 'bg-white shadow-xl brand-text scale-105' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Publi
            </button>
          </div>
        </div>

        <div className="space-y-6 flex-1 relative z-10">
          <div className="space-y-2.5">
            <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
              <Package className="w-3 h-3 brand-text" /> Producto o Servicio Base
            </label>
            <select 
              id="job_description" 
              value={formData.job_description} 
              onChange={handleInputChange} 
              className="w-full bg-slate-50 border-2 border-transparent ring-1 ring-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-4 focus:ring-red-500/10 focus:border-red-500 focus:bg-white transition-all shadow-sm outline-none appearance-none"
            >
              <option value="">Seleccionar Producto...</option>
              {products.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
            </select>
          </div>

          {!isAcrilicoJob && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="grid grid-cols-2 gap-5"
            >
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Ancho (cm)</label>
                <div className="relative">
                  <input type="number" id="width" value={formData.width} onChange={handleInputChange} className="w-full bg-slate-50 p-4 rounded-2xl ring-1 ring-slate-200 text-base font-black focus:ring-4 focus:ring-red-500/10 focus:bg-white transition-all outline-none" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase">cm</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Alto (cm)</label>
                <div className="relative">
                  <input type="number" id="height" value={formData.height} onChange={handleInputChange} className="w-full bg-slate-50 p-4 rounded-2xl ring-1 ring-slate-200 text-base font-black focus:ring-4 focus:ring-red-500/10 focus:bg-white transition-all outline-none" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase">cm</span>
                </div>
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Cantidad</label>
              <div className="relative">
                <input type="number" id="quantity" value={formData.quantity} onChange={handleInputChange} className="w-full bg-slate-50 p-4 rounded-2xl ring-1 ring-slate-200 text-base font-black focus:ring-4 focus:ring-red-500/10 focus:bg-white transition-all outline-none" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase">und</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Serv. Diseño</label>
              <button 
                onClick={() => setFormData(f => ({...f, include_design: !f.include_design}))}
                className={`h-[56px] w-full rounded-2xl border-2 flex items-center justify-center gap-3 cursor-pointer transition-all duration-300 ${formData.include_design ? 'bg-red-50 border-red-500 shadow-lg shadow-red-500/5' : 'bg-slate-50 border-slate-100 hover:border-slate-200'}`}
              >
                <PenTool className={`w-5 h-5 ${formData.include_design ? 'brand-text' : 'text-slate-300'}`} />
                <span className={`text-[11px] font-black uppercase tracking-widest ${formData.include_design ? 'brand-text' : 'text-slate-400'}`}>{formData.include_design ? "Incluido" : "Omitir"}</span>
              </button>
            </div>
          </div>

          {isAnyPendon && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200 space-y-5 shadow-inner"
            >
              <h4 className="text-[11px] font-black text-slate-600 uppercase tracking-[0.3em] flex items-center gap-2">
                <div className="w-2 h-2 rounded-full brand-bg animate-pulse"></div>
                Opciones de Pendón
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Acabado</label>
                  <button 
                    onClick={() => setFormData(f => ({...f, include_tubes: !f.include_tubes}))} 
                    className={`w-full py-4 rounded-xl text-[10px] font-black uppercase transition-all duration-300 flex items-center justify-center gap-2 border-2 ${formData.include_tubes ? 'bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-900/20' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}
                  >
                    <MoveHorizontal className="w-4 h-4" /> {formData.include_tubes ? "Con Tubos" : "Sin Tubos"}
                  </button>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Cant. Ojales</label>
                  <div className="relative">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input type="number" id="ojalete_quantity" value={formData.ojalete_quantity} onChange={handleInputChange} className="w-full bg-white p-4 pl-11 rounded-xl text-xs font-black ring-1 ring-slate-200 focus:ring-4 focus:ring-red-500/10 outline-none transition-all" placeholder="0" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <div className="pt-6">
            <button 
              onClick={handleSaveJob} 
              className="w-full brand-bg text-white font-black py-5 rounded-[1.5rem] shadow-2xl shadow-red-500/30 uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-4 active:scale-95 hover:scale-[1.02] transition-all duration-300 group"
            >
              <Save className="w-6 h-6 group-hover:rotate-12 transition-transform" /> 
              Agregar a Cotización
            </button>
          </div>
        </div>
      </section>

      {/* SECCION 2: DETALLES (Acrilico / Resumen) & BORRADORES */}
      <div className="lg:col-span-5 space-y-8">
        {isAcrilicoJob ? (
          <motion.section 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 p-8 rounded-[2.5rem] shadow-3xl shadow-slate-900/40 space-y-8 relative overflow-hidden border border-slate-800"
          >
            <div className="absolute top-0 left-0 w-full h-1 brand-bg"></div>
            <div className="absolute -top-24 -right-24 w-64 h-64 brand-bg/10 rounded-full blur-3xl"></div>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800 pb-8 relative z-10">
              <div>
                <div className="flex items-center gap-4 mb-2">
                  <div className="p-3 bg-slate-800 rounded-2xl border border-slate-700">
                    <Wrench className="brand-text w-8 h-8" />
                  </div>
                  <h3 className="text-3xl font-black text-white uppercase tracking-tighter italic">Detalle Acrílico</h3>
                </div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-16">Ingeniería & Configuración Técnica</p>
              </div>
              <div className="min-w-[240px]">
                <label className="text-[9px] font-black text-slate-500 uppercase block mb-2 tracking-[0.2em] ml-1">Material Base</label>
                <select 
                  id="selected_acrylic_material_id" 
                  value={formData.selected_acrylic_material_id} 
                  onChange={handleInputChange} 
                  className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl px-5 py-3 text-[11px] font-black text-white uppercase outline-none focus:border-red-500 transition-all shadow-xl"
                >
                  <option value="">Elegir Acrílico...</option>
                  {params.acrylic_materials.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
              <div className="bg-slate-800/40 p-6 rounded-3xl border border-slate-800 space-y-5">
                <div className="flex items-center gap-3 mb-2">
                  <Type className="w-5 h-5 brand-text" />
                  <h4 className="text-[12px] font-black text-white uppercase tracking-[0.2em]">Corte & Volumen</h4>
                </div>
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase flex justify-between px-1">Letras Caladas (cm) <span className="text-slate-600">W x H</span></label>
                    <div className="flex gap-3">
                      <input type="number" id="calado_w" value={formData.calado_w} onChange={handleInputChange} className="w-full bg-slate-900 border border-slate-700 p-4 rounded-xl text-white text-sm font-black focus:border-red-500 outline-none transition-all" placeholder="Ancho" />
                      <input type="number" id="calado_h" value={formData.calado_h} onChange={handleInputChange} className="w-full bg-slate-900 border border-slate-700 p-4 rounded-xl text-white text-sm font-black focus:border-red-500 outline-none transition-all" placeholder="Alto" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase flex justify-between px-1">Letras 3D (cm) <span className="text-slate-600">W x H</span></label>
                    <div className="flex gap-3">
                      <input type="number" id="letras3d_w" value={formData.letras3d_w} onChange={handleInputChange} className="w-full bg-slate-900 border border-slate-700 p-4 rounded-xl text-white text-sm font-black focus:border-red-500 outline-none transition-all" placeholder="Ancho" />
                      <input type="number" id="letras3d_h" value={formData.letras3d_h} onChange={handleInputChange} className="w-full bg-slate-900 border border-slate-700 p-4 rounded-xl text-white text-sm font-black focus:border-red-500 outline-none transition-all" placeholder="Alto" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase px-1">Grosor / Profundidad 3D</label>
                    <div className="relative">
                      <input type="number" id="letras3d_grosor" value={formData.letras3d_grosor} onChange={handleInputChange} className="w-full bg-slate-900 border border-slate-700 p-4 rounded-xl text-white text-sm font-black focus:border-red-500 outline-none transition-all" />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-600 uppercase">cm</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/40 p-6 rounded-3xl border border-slate-800 space-y-5">
                <div className="flex items-center gap-3 mb-2">
                  <Zap className="w-5 h-5 brand-text" />
                  <h4 className="text-[12px] font-black text-white uppercase tracking-[0.2em]">Iluminación & Vinilos</h4>
                </div>
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase flex justify-between px-1">Vinilo (cm) <span className="text-red-500/50 font-black">F 2.4</span></label>
                    <div className="flex gap-3">
                      <input type="number" id="vinilo_w" value={formData.vinilo_w} onChange={handleInputChange} className="w-full bg-slate-900 border border-slate-700 p-4 rounded-xl text-white text-sm font-black focus:border-red-500 outline-none transition-all" placeholder="W" />
                      <input type="number" id="vinilo_h" value={formData.vinilo_h} onChange={handleInputChange} className="w-full bg-slate-900 border border-slate-700 p-4 rounded-xl text-white text-sm font-black focus:border-red-500 outline-none transition-all" placeholder="H" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase flex justify-between px-1">Lona (cm) <span className="text-orange-500/50 font-black">F 2.3</span></label>
                    <div className="flex gap-3">
                      <input type="number" id="lona_w" value={formData.lona_w} onChange={handleInputChange} className="w-full bg-slate-900 border border-slate-700 p-4 rounded-xl text-white text-sm font-black focus:border-red-500 outline-none transition-all" placeholder="W" />
                      <input type="number" id="lona_h" value={formData.lona_h} onChange={handleInputChange} className="w-full bg-slate-900 border border-slate-700 p-4 rounded-xl text-white text-sm font-black focus:border-red-500 outline-none transition-all" placeholder="H" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-500 uppercase px-1">LED (cm)</label>
                      <input type="number" id="led_cm" value={formData.led_cm} onChange={handleInputChange} className="w-full bg-slate-900 border border-slate-700 p-4 rounded-xl text-white text-sm font-black focus:border-red-500 outline-none transition-all" placeholder="cm" />
                    </div>
                    <div className="space-y-2 flex flex-col justify-end">
                      <button 
                        onClick={() => setFormData(f => ({...f, include_power_supply: !f.include_power_supply}))} 
                        className={`w-full py-4 rounded-xl text-[10px] font-black uppercase transition-all duration-300 flex items-center justify-center gap-2 border-2 ${formData.include_power_supply ? 'bg-orange-600 border-orange-600 text-white shadow-xl shadow-orange-600/20' : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-600'}`}
                      >
                        <Power className="w-4 h-4" /> Fuente
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/40 p-8 rounded-[2rem] space-y-8 md:col-span-2 border border-slate-800 shadow-inner">
                <div className="flex items-center gap-4 mb-2">
                  <div className="p-2 bg-slate-700 rounded-xl">
                    <Building2 className="w-6 h-6 brand-text" />
                  </div>
                  <h4 className="text-[14px] font-black text-white uppercase tracking-[0.3em]">Fondo & Estructura</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase px-1 tracking-widest">Fondo Acrílico (cm)</label>
                    <div className="flex gap-3">
                      <input type="number" id="fondo_w" value={formData.fondo_w} onChange={handleInputChange} className="w-full bg-slate-900 border border-slate-700 p-4 rounded-xl text-white text-base font-black focus:border-red-500 outline-none transition-all" placeholder="W" />
                      <input type="number" id="fondo_h" value={formData.fondo_h} onChange={handleInputChange} className="w-full bg-slate-900 border border-slate-700 p-4 rounded-xl text-white text-base font-black focus:border-red-500 outline-none transition-all" placeholder="H" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase px-1 tracking-widest">Costo Estructura</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 font-black">$</span>
                      <input type="number" id="manual_structure_cost" value={formData.manual_structure_cost} onChange={handleInputChange} className="w-full bg-slate-900 border border-slate-700 p-4 pl-8 rounded-xl text-white text-base font-black focus:border-red-500 outline-none transition-all" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase px-1 tracking-widest">Mano de Obra (Horas)</label>
                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <input type="number" id="installation_hours" value={formData.installation_hours} onChange={handleInputChange} className="w-full bg-slate-900 border border-slate-700 p-4 rounded-xl text-white text-base font-black focus:border-red-500 outline-none transition-all" placeholder="Inst." />
                        <span className="absolute -top-6 left-1 text-[8px] font-black text-slate-600 uppercase tracking-widest">Instal.</span>
                      </div>
                      <div className="relative flex-1">
                        <input type="number" id="assembly_hours" value={formData.assembly_hours} onChange={handleInputChange} className="w-full bg-slate-900 border border-slate-700 p-4 rounded-xl text-white text-base font-black focus:border-red-500 outline-none transition-all" placeholder="Arm." />
                        <span className="absolute -top-6 left-1 text-[8px] font-black text-slate-600 uppercase tracking-widest">Armado</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* BARRA DE RESULTADOS RAPIDOS (Solo Acrilico) */}
            <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 backdrop-blur-2xl grid grid-cols-2 md:grid-cols-4 gap-6 shadow-2xl">
                <div className="space-y-2">
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] flex items-center gap-2"><Box className="w-3 h-3"/> Materiales</p>
                  <p className="text-2xl font-black text-white italic tracking-tighter">${Math.round(quote.materialCost).toLocaleString()}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] flex items-center gap-2"><TrendingUp className="w-3 h-3"/> Utilidad</p>
                  <p className="text-2xl font-black text-red-500 italic tracking-tighter">${Math.round(quote.costWithMargin - quote.totalBeforeMargin).toLocaleString()}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] flex items-center gap-2"><ShieldCheck className="w-3 h-3"/> IVA ({Math.round(params.iva*100)}%)</p>
                  <p className="text-2xl font-black text-slate-400 italic tracking-tighter">${Math.round(quote.ivaAmount).toLocaleString()}</p>
                </div>
                <div className="bg-white/10 rounded-2xl p-5 border border-white/20 shadow-inner flex flex-col justify-center">
                  <p className="text-[10px] text-white font-black uppercase tracking-[0.3em] mb-1 opacity-60">Inversión Final</p>
                  <p className="text-3xl font-black text-white italic tracking-tighter leading-none">${Math.round(quote.finalPrice).toLocaleString()}</p>
                </div>
            </div>
          </motion.section>
        ) : (
          <motion.section 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 p-10 rounded-[3rem] shadow-3xl shadow-slate-900/40 relative overflow-hidden flex flex-col items-center justify-center text-center min-h-[400px] border border-slate-800"
          >
            <div className="absolute top-0 left-0 w-full h-1 brand-bg"></div>
            <div className="relative z-10 space-y-8">
              <div className="inline-flex items-center gap-3 bg-red-600/10 px-6 py-2.5 rounded-full border border-red-600/20 backdrop-blur-md">
                <Smartphone className="brand-text w-4 h-4" />
                <span className="text-[11px] font-black brand-text uppercase tracking-[0.3em]">Inversión Estimada</span>
              </div>
              
              <div className="space-y-2">
                <h2 className="text-7xl font-black text-white tracking-tighter leading-none italic">
                  <span className="text-3xl align-top mr-1 opacity-50">$</span>
                  {Math.round(quote.finalPrice).toLocaleString()}
                </h2>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em]">Valor Total con IVA</p>
              </div>

              <div className="flex flex-col gap-4 text-slate-400 text-[11px] font-bold uppercase tracking-widest">
                <div className="bg-white/5 px-6 py-3 rounded-2xl border border-white/5">
                  <p>{quote.totalAreaM2.toFixed(3)} m² de Producción • x{formData.quantity} Unidades</p>
                </div>
                <div className="flex items-center justify-center gap-6 pt-2">
                  <span className="flex items-center gap-2 text-[10px]"><Box className="w-4 h-4 brand-text"/> IVA 19%</span>
                  <span className="flex items-center gap-2 text-[10px]"><TrendingUp className="w-4 h-4 brand-text"/> Margen DPM</span>
                </div>
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] brand-bg/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-[120px]"></div>
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] blue-600/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-[100px]"></div>
          </motion.section>
        )}

        {/* BORRADORES */}
        <section className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-100 flex flex-col overflow-hidden h-full">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100">
                <RefreshCcw className="brand-text w-5 h-5" />
              </div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest italic">Borradores</h3>
            </div>
            <span className="brand-bg text-white px-3 py-1 rounded-full text-[10px] font-black shadow-lg shadow-red-500/20">{savedJobs.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[400px] divide-y divide-slate-50 no-scrollbar">
            {savedJobs.length === 0 ? (
              <div className="p-16 text-center flex flex-col items-center gap-4">
                 <div className="p-5 bg-slate-50 rounded-full border border-slate-100"><Box className="w-12 h-12 text-slate-200" /></div>
                 <p className="text-[10px] font-black text-slate-300 uppercase italic tracking-[0.2em]">Lista de borradores vacía</p>
              </div>
            ) : (
              savedJobs.map(job => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={job.id} 
                  className="p-5 flex items-center justify-between hover:bg-slate-50/80 transition-all group relative"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-slate-100 rounded-xl group-hover:bg-red-500 group-hover:text-white transition-all duration-300">
                      <PenTool className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col space-y-0.5">
                      <span className="font-black text-xs uppercase text-slate-800 group-hover:brand-text transition-colors tracking-tight">{job.job_description}</span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">x{job.quantity} • {job.use_manual_meters ? `${job.manual_meters}m` : `${job.width}x${job.height}cm`}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-black text-slate-900 italic tracking-tighter">${Math.round(job.finalPrice).toLocaleString()}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                      <button 
                        onClick={() => saveToHistoryFromDraft(job)} 
                        disabled={isSaving}
                        title="Guardar en Historial" 
                        className="p-2.5 bg-white text-slate-400 rounded-xl shadow-sm border border-slate-100 hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all active:scale-90"
                      >
                        {isSaving ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      </button>
                      <button 
                        onClick={() => setQuoteJobs(prev => [...prev, job])} 
                        className="p-2.5 brand-bg text-white rounded-xl shadow-lg shadow-red-500/20 active:scale-90 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => setSavedJobs(prev => prev.filter(j => j.id !== job.id))} 
                        className="p-2.5 text-slate-300 hover:text-red-500 transition-all active:scale-90"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* SECCION 3: SIDEBAR (Documento Final) */}
      <div className="lg:col-span-3 space-y-6">
        <section className="bg-white p-6 rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-100 h-full flex flex-col sticky top-24">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-50 pb-4">
            <div className="p-2 bg-red-50 rounded-xl">
              <FileText className="brand-text w-5 h-5" />
            </div>
            <h2 className="text-sm font-black text-slate-800 italic uppercase tracking-widest">Documento Final</h2>
          </div>
          
          <div className="space-y-4 mb-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Atención a:</label>
                <div className="flex gap-3">
                  <button onClick={() => { setActiveView('customers'); }} className="text-[9px] font-black brand-text uppercase hover:underline flex items-center gap-1.5 transition-all"><Search className="w-3 h-3"/> Buscar</button>
                  {customerInfo.name && (
                    <button 
                      onClick={() => saveCustomer({
                        name: customerInfo.name,
                        phone: customerInfo.phone,
                        taxId: customerInfo.taxId,
                        email: customerInfo.email,
                        address: customerInfo.address,
                        createdAt: new Date().toISOString(),
                        quotesCount: 0
                      })} 
                      className="text-[9px] font-black text-blue-500 uppercase hover:underline flex items-center gap-1.5 transition-all"
                    >
                      <UserCheck className="w-3 h-3"/> Guardar
                    </button>
                  )}
                </div>
              </div>
              <input 
                type="text" 
                placeholder="Nombre del Cliente..." 
                value={customerInfo.name} 
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))} 
                className="w-full bg-slate-50 p-4 rounded-2xl ring-1 ring-slate-100 text-[11px] font-black focus:ring-4 focus:ring-red-500/10 focus:bg-white outline-none transition-all shadow-sm" 
              />
            </div>
            
            <AnimatePresence>
              {customerInfo.name && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid grid-cols-1 gap-3 overflow-hidden"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" placeholder="Teléfono..." value={customerInfo.phone} onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))} className="w-full bg-slate-50 p-3 rounded-xl ring-1 ring-slate-100 text-[10px] font-bold outline-none focus:ring-4 focus:ring-red-500/5 transition-all" />
                    <input type="text" placeholder="Cédula / NIT..." value={customerInfo.taxId} onChange={(e) => setCustomerInfo(prev => ({ ...prev, taxId: e.target.value }))} className="w-full bg-slate-50 p-3 rounded-xl ring-1 ring-slate-100 text-[10px] font-bold outline-none focus:ring-4 focus:ring-red-500/5 transition-all" />
                  </div>
                  <input type="text" placeholder="Email..." value={customerInfo.email} onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))} className="w-full bg-slate-50 p-3 rounded-xl ring-1 ring-slate-100 text-[10px] font-bold outline-none focus:ring-4 focus:ring-red-500/5 transition-all" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex-1 space-y-3 mb-6 overflow-y-auto no-scrollbar max-h-[250px]">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Contenido ({quoteJobs.length})</h4>
              {quoteJobs.length > 0 && <button onClick={() => setQuoteJobs([])} className="text-[9px] font-black text-slate-400 hover:text-red-600 uppercase transition-colors">Limpiar</button>}
            </div>
            {quoteJobs.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-100 rounded-[1.5rem] flex flex-col items-center gap-3 bg-slate-50/30">
                <div className="p-2 bg-white rounded-full shadow-sm"><PlusCircle className="w-6 h-6 text-slate-200" /></div>
                <p className="text-[9px] font-black text-slate-300 uppercase italic tracking-widest leading-relaxed">Añade items desde<br/>tus borradores</p>
              </div>
            ) : (
              <div className="space-y-2">
                {quoteJobs.map((job, idx) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    key={idx} 
                    className="bg-slate-50 p-3 rounded-xl flex justify-between items-center border border-slate-100 group hover:border-red-200 transition-all"
                  >
                    <div className="truncate pr-3 space-y-0.5">
                      <span className="text-[10px] font-black uppercase truncate block text-slate-700">{job.job_description}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase italic tracking-tighter">${Math.round(job.finalPrice).toLocaleString()}</span>
                    </div>
                    <button onClick={() => setQuoteJobs(prev => prev.filter((_, i) => i !== idx))} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all active:scale-90"><X className="w-4 h-4"/></button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-slate-900 p-6 rounded-[1.5rem] mb-6 shadow-2xl shadow-slate-900/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 brand-bg/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
            <div className="flex items-center gap-2 mb-2 relative z-10">
              <DollarSign className="w-4 h-4 brand-text" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Inversión Total</span>
            </div>
            <div className="relative z-10">
              <span className="text-3xl font-black text-white italic tracking-tighter leading-none">
                <span className="text-lg opacity-50 mr-1">$</span>
                {Math.round(quoteJobs.reduce((s, j) => s + j.finalPrice, 0)).toLocaleString()}
              </span>
              <div className="mt-3 pt-3 border-t border-slate-800">
                <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest italic leading-relaxed">Incluye IVA (19%) y materiales detallados DPM.</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex flex-col gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100 shadow-inner">
              <p className="text-[9px] font-black text-slate-500 uppercase ml-1 tracking-widest">Estado Inicial:</p>
              <div className="flex gap-1.5">
                {(['PENDIENTE', 'ENVIADA', 'APROBADA', 'PAGADA'] as QuoteStatus[]).map(status => (
                  <button
                    key={status}
                    onClick={() => setInitialStatus(status)}
                    className={`flex-1 py-2 rounded-xl text-[8px] font-black uppercase transition-all duration-300 border-2 ${
                      initialStatus === status 
                        ? (status === 'PAGADA' ? 'bg-green-600 text-white border-green-600 shadow-lg shadow-green-600/20' : 
                           status === 'APROBADA' ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20' :
                           status === 'ENVIADA' ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20' :
                           'bg-slate-700 text-white border-slate-700 shadow-lg shadow-slate-700/20')
                        : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-2 pt-2">
              <button 
                onClick={() => saveToHistory(initialStatus)} 
                disabled={quoteJobs.length === 0 || isSaving} 
                className="w-full bg-slate-800 text-white font-black py-4 rounded-2xl text-[10px] tracking-[0.2em] uppercase flex items-center justify-center gap-3 active:scale-95 hover:bg-slate-900 transition-all shadow-xl disabled:grayscale disabled:opacity-50 group"
              >
                {isSaving ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />}
                {saveSuccess ? "¡Guardado con éxito!" : "Solo Guardar"}
              </button>
              
              <button 
                onClick={() => { saveToHistory(initialStatus); generatePdf(); }} 
                disabled={quoteJobs.length === 0 || isSaving} 
                className="w-full brand-bg text-white font-black py-4 rounded-2xl text-[10px] tracking-[0.2em] uppercase flex items-center justify-center gap-3 active:scale-95 hover:scale-[1.02] transition-all shadow-2xl shadow-red-500/30 disabled:grayscale disabled:opacity-50 group"
              >
                {isSaving ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 group-hover:-translate-y-1 transition-transform" />}
                Guardar & Exportar PDF
              </button>
              
              <button 
                onClick={() => { saveToHistory(initialStatus); sendWhatsApp(); }} 
                disabled={quoteJobs.length === 0 || isSaving} 
                className="w-full whatsapp-btn text-white font-black py-4 rounded-2xl text-[10px] tracking-[0.2em] uppercase flex items-center justify-center gap-3 active:scale-95 hover:scale-[1.02] transition-all shadow-2xl shadow-green-500/30 disabled:grayscale disabled:opacity-50 group"
              >
                {isSaving ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <WhatsAppIcon className="w-4 h-4 group-hover:rotate-12 transition-transform" />}
                Enviar por WhatsApp
              </button>
            </div>
          </div>
          
          <div className="mt-6 flex items-center justify-center gap-3 opacity-30 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-700">
            <div className="h-px w-8 bg-slate-300"></div>
            <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.4em] italic">Estrategias DPM • v4.0</p>
            <div className="h-px w-8 bg-slate-300"></div>
          </div>
        </section>
      </div>
    </motion.div>
  );
};

export default CalculatorView;
