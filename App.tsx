
import React, { useState, useMemo, useEffect, useRef, Component, ErrorInfo, ReactNode } from 'react';
import { FormData, SavedJob, Product, Customer, AcrylicType, BaseType, AcrylicMaterial, QuoteHistoryEntry } from './types';
import { calculateQuote } from './utils/calculator';
import { PRODUCT_PRICES_FINAL, PRODUCT_PRICES_PUBLISHER, PRODUCT_DESIGN_TIMES, DEFAULT_PARAMS } from './constants';
import { 
  Calculator, Settings, Sparkles, Plus, FileText, X, Download, MessageCircle,
  Loader2, Image as ImageIcon, Layers, Info, Trash2, Edit2, Save, CheckCircle2,
  PlusCircle, MessageSquare, UserCheck, Palette, Building2, UploadCloud, Smartphone,
  DollarSign, Percent, Clock, Box, MapPin, Mail, Phone, Fingerprint, Users, Search, Ruler, Disc, Droplets, Zap, Wrench, Scissors, Layout, RefreshCcw, PieChart, Activity,
  Maximize2, Type as FontIcon, MoveHorizontal, ChevronRight, Tags, Power, TrendingUp, ShieldCheck, PenTool, Hash, LogIn, LogOut
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  auth, db, googleProvider, signInWithPopup, signOut, onAuthStateChanged, 
  collection, query, where, onSnapshot, doc, setDoc, addDoc, updateDoc, deleteDoc, 
  handleFirestoreError, OperationType, User, getDocFromServer 
} from './firebase';

// Firebase integration
const DEFAULT_BRAND = {
  primaryColor: '#ec3237',
  companyName: 'ESTRATEGIAS DPM',
  slogan: 'Diseño y Publicidad',
  address: '11-62 Carrera 2ª, La Unión, Nariño 525001, Colombia',
  email: 'estrategiasdpmsas@gmail.com',
  phone: '3122495803',
  taxId: '1085251887-2',
  logo: null as string | null
};

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const App: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [brand, setBrand] = useState(() => {
    const saved = localStorage.getItem('dpm_brand');
    return saved ? JSON.parse(saved) : DEFAULT_BRAND;
  });
  const [params, setParams] = useState(() => {
    const saved = localStorage.getItem('dpm_params');
    return saved ? JSON.parse(saved) : DEFAULT_PARAMS;
  });
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('dpm_products');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    return Object.keys(PRODUCT_PRICES_FINAL).map(name => ({
      name,
      priceFinal: PRODUCT_PRICES_FINAL[name],
      pricePublisher: PRODUCT_PRICES_PUBLISHER[name] || PRODUCT_PRICES_FINAL[name],
      designTime: PRODUCT_DESIGN_TIMES[name] || 0
    }));
  });
  const [newProduct, setNewProduct] = useState<Product>({ name: '', priceFinal: 0, pricePublisher: 0, designTime: 30 });
  const [formData, setFormData] = useState<FormData>({
    customer_type: 'final', job_description: '', width: 100, height: 100, quantity: 1,
    production_time: 30, cutting_hours: 0, laminate_speed: '0', installation: 0,
    urgency_percentage: 0, transport: 0, include_design: false, include_printing: true, ojalete_quantity: 0,
    include_tubes: true, include_sticks: false, sticks_quantity: 2,
    job_image: undefined,
    acrylic_type: 'sin_luz',
    base_type: 'sin_estructura',
    laser_minutes: 0,
    assembly_hours: 0,
    installation_hours: 0,
    manual_meters: 0,
    use_manual_meters: false,
    selected_acrylic_material_id: '',
    manual_structure_cost: 0,
    calado_w: 0, calado_h: 0, letras3d_w: 0, letras3d_h: 0, letras3d_grosor: 0, vinilo_w: 0, vinilo_h: 0, lona_w: 0, lona_h: 0, led_cm: 0, fondo_w: 0, fondo_h: 0,
    include_power_supply: false
  });
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [quoteJobs, setQuoteJobs] = useState<SavedJob[]>([]);
  const [customerInfo, setCustomerInfo] = useState({ id: '', name: '', phone: '', address: '', email: '' });
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('dpm_customers');
    return saved ? JSON.parse(saved) : [];
  });
  const [history, setHistory] = useState<QuoteHistoryEntry[]>(() => {
    const saved = localStorage.getItem('dpm_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [showSettings, setShowSettings] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'products' | 'brand' | 'costs' | 'params' | 'customers' | 'history' | 'users'>('products');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authorizedUsers, setAuthorizedUsers] = useState<any[]>([]);

  const OWNER_EMAIL = 'estrategiaslaunion@gmail.com';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Check authorization
        const isOwner = u.email === OWNER_EMAIL;
        const authDocRef = doc(db, 'authorized_users', u.email || '');
        
        try {
          const authSnap = await getDocFromServer(authDocRef);
          const isWhitelisted = authSnap.exists();
          const role = authSnap.data()?.role;
          
          if (isOwner || isWhitelisted) {
            setIsAuthorized(true);
            setIsAdmin(isOwner || role === 'admin');
          } else {
            setIsAuthorized(false);
            setIsAdmin(false);
          }
        } catch (error) {
          console.error("Auth check error:", error);
          if (isOwner) {
            setIsAuthorized(true);
            setIsAdmin(true);
          } else {
            setIsAuthorized(false);
          }
        }
      } else {
        setIsAuthorized(null);
        setIsAdmin(false);
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Sync Authorized Users (Admin only)
  useEffect(() => {
    if (!user || !isAuthorized || !isAdmin) return;
    const path = 'authorized_users';
    const q = query(collection(db, path));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAuthorizedUsers(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
    return () => unsubscribe();
  }, [user, isAuthorized, isAdmin]);

  // Sync Shared Settings
  useEffect(() => {
    if (!user || !isAuthorized) return;
    const path = 'company_data/dpm/settings/current';
    const unsubscribe = onSnapshot(doc(db, path), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.brand) setBrand(data.brand);
        if (data.params) setParams(data.params);
        if (data.products) setProducts(data.products);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
    return () => unsubscribe();
  }, [user, isAuthorized]);

  // Sync Shared Customers
  useEffect(() => {
    if (!user || !isAuthorized) return;
    const path = 'company_data/dpm/customers';
    const q = query(collection(db, path));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
      setCustomers(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
    return () => unsubscribe();
  }, [user, isAuthorized]);

  // Sync Shared History
  useEffect(() => {
    if (!user || !isAuthorized) return;
    const path = 'company_data/dpm/quotes';
    const q = query(collection(db, path));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QuoteHistoryEntry));
      setHistory(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
    return () => unsubscribe();
  }, [user, isAuthorized]);

  const saveSharedSettings = async () => {
    if (!isAdmin) return;
    const path = 'company_data/dpm/settings/current';
    try {
      await setDoc(doc(db, path), { brand, params, products });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  useEffect(() => {
    localStorage.setItem('dpm_params', JSON.stringify(params));
    localStorage.setItem('dpm_products', JSON.stringify(products));
    localStorage.setItem('dpm_brand', JSON.stringify(brand));
    localStorage.setItem('dpm_customers', JSON.stringify(customers));
    localStorage.setItem('dpm_history', JSON.stringify(history));
    document.documentElement.style.setProperty('--primary-color', brand.primaryColor);
  }, [params, products, brand, customers, history]);

  const quote = useMemo(() => calculateQuote(formData, params, products), [formData, params, products]);
  
  const isAcrilicoJob = useMemo(() => {
    const desc = (formData.job_description || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
    return desc.includes('ACRILICO');
  }, [formData.job_description]);

  const isAnyPendon = useMemo(() => {
    const desc = (formData.job_description || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
    return desc.includes('PENDON') || desc.includes('BANNER') || desc.includes('PANAFLEX');
  }, [formData.job_description]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value, type } = e.target as HTMLInputElement;
    setFormData(prev => ({ ...prev, [id]: type === 'number' ? parseFloat(value) || 0 : value }));
  };

  const handleProductUpdate = (index: number, field: keyof Product, value: any) => {
    const updated = [...products];
    updated[index] = { ...updated[index], [field]: value };
    setProducts(updated);
  };

  const handleSaveJob = () => {
    if (!formData.job_description) return;
    const newJob: SavedJob = { ...formData, id: Math.random().toString(36).substr(2, 9), finalPrice: quote.finalPrice, createdAt: new Date().toLocaleString(), quoteResult: quote };
    setSavedJobs(prev => [newJob, ...prev]);
  };

  const saveToHistory = async () => {
    if (!quoteJobs.length) return;
    const total = quoteJobs.reduce((s, j) => s + j.finalPrice, 0);
    const date = new Date().toISOString();
    const newEntry: Omit<QuoteHistoryEntry, 'id'> = {
      customerName: customerInfo.name || "CLIENTE GENERAL",
      customerPhone: customerInfo.phone || "",
      date: date,
      items: [...quoteJobs],
      total: total
    };

    if (user && isAuthorized) {
      const path = 'company_data/dpm/quotes';
      try {
        await addDoc(collection(db, path), newEntry);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
      }
    } else {
      setHistory(prev => [{ ...newEntry, id: Math.random().toString(36).substr(2, 9) } as QuoteHistoryEntry, ...prev]);
    }
    
    if (customerInfo.name) {
      const customerData: Omit<Customer, 'id'> = {
        name: customerInfo.name,
        phone: customerInfo.phone,
        email: customerInfo.email,
        address: customerInfo.address,
        createdAt: new Date().toISOString(),
        quotesCount: 1
      };

      if (user && isAuthorized) {
        const path = 'company_data/dpm/customers';
        try {
          const existing = customers.find(c => c.name.toLowerCase() === customerInfo.name.toLowerCase());
          if (existing) {
            await updateDoc(doc(db, path, existing.id), { quotesCount: existing.quotesCount + 1 });
          } else {
            await addDoc(collection(db, path), customerData);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, path);
        }
      } else {
        setCustomers(prev => {
          const existing = prev.find(c => c.name.toLowerCase() === customerInfo.name.toLowerCase());
          if (existing) {
            return prev.map(c => c.id === existing.id ? { ...c, quotesCount: c.quotesCount + 1 } : c);
          } else {
            return [{ ...customerData, id: Math.random().toString(36).substr(2, 9) } as Customer, ...prev];
          }
        });
      }
    }
    setQuoteJobs([]);
  };

  const login = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login error", error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error", error);
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    if (user && isAuthorized) {
      const path = `company_data/dpm/customers`;
      try {
        await deleteDoc(doc(db, path, id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    } else {
      setCustomers(prev => prev.filter(c => c.id !== id));
    }
  };

  const handleDeleteQuote = async (id: string) => {
    if (user && isAuthorized) {
      const path = `company_data/dpm/quotes`;
      try {
        await deleteDoc(doc(db, path, id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    } else {
      setHistory(prev => prev.filter(h => h.id !== id));
    }
  };

  const addAuthorizedUser = async (email: string) => {
    if (!isAdmin || !email) return;
    const path = 'authorized_users';
    try {
      await setDoc(doc(db, path, email.toLowerCase()), {
        email: email.toLowerCase(),
        role: 'user',
        addedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const removeAuthorizedUser = async (email: string) => {
    if (!isAdmin || email === OWNER_EMAIL) return;
    const path = 'authorized_users';
    try {
      await deleteDoc(doc(db, path, email));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const toggleUserRole = async (email: string, currentRole: string) => {
    if (!isAdmin || email === OWNER_EMAIL) return;
    const path = 'authorized_users';
    try {
      await updateDoc(doc(db, path, email), {
        role: currentRole === 'admin' ? 'user' : 'admin'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const generatePdf = async () => {
    if (!quoteJobs.length) return;
    setIsGeneratingPdf(true);
    try {
      const element = document.getElementById('quote-document');
      if (!element) throw new Error();
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'px', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${brand.companyName}_Cotizacion.pdf`);
    } catch (e) { alert("Error al crear PDF"); } finally { setIsGeneratingPdf(false); }
  };

  const sendWhatsApp = () => {
    if (!quoteJobs.length) return;
    const total = quoteJobs.reduce((s, j) => s + j.finalPrice, 0);
    const clientName = customerInfo.name || "Cliente";
    let message = `*COTIZACIÓN PROFESIONAL - ${brand.companyName}*\n\nHola *${clientName}*:\n\n`;
    quoteJobs.forEach((j, i) => { message += `*${i + 1}. ${j.job_description}*\n   Cant: ${j.quantity}\n   Inversión: $${Math.round(j.finalPrice).toLocaleString()}\n\n`; });
    message += `*TOTAL INVERSIÓN: $${Math.round(total).toLocaleString()}*\n\n_Revisa el PDF para ver el detalle de materiales e IVA._`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBrand((prev: any) => ({ ...prev, logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setBrand((prev: any) => ({ ...prev, logo: null }));
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <Loader2 className="w-12 h-12 brand-text animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden p-10 text-center space-y-8 animate-in zoom-in-95">
          <div className="w-24 h-24 brand-bg rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-red-500/20 rotate-3">
            <Calculator className="w-12 h-12 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">Calculadora DPM</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-3">Acceso Restringido Personal</p>
          </div>
          <button 
            onClick={login}
            className="w-full bg-slate-900 text-white py-5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-3 active:scale-95"
          >
            <LogIn className="w-5 h-5" /> Iniciar con Google
          </button>
          <p className="text-[9px] text-slate-400 font-bold uppercase leading-relaxed">
            Solo personal autorizado de <span className="brand-text">Estrategias DPM</span> tiene acceso a esta herramienta.
          </p>
        </div>
      </div>
    );
  }

  if (isAuthorized === false) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden p-10 text-center space-y-8 animate-in zoom-in-95">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl mx-auto flex items-center justify-center">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">Acceso Denegado</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-3">Usuario No Autorizado</p>
          </div>
          <div className="bg-slate-50 p-6 rounded-2xl text-left space-y-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tu correo:</p>
            <p className="text-xs font-bold text-slate-900">{user.email}</p>
          </div>
          <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
            Tu cuenta no está en la lista de personal autorizado. Por favor, contacta al administrador para solicitar acceso.
          </p>
          <button 
            onClick={logout}
            className="w-full bg-slate-100 text-slate-600 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-3"
          >
            <LogOut className="w-5 h-5" /> Salir
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-10">
      <style>{`
        :root { --primary-color: ${brand.primaryColor}; }
        .brand-text { color: var(--primary-color); }
        .brand-bg { background-color: var(--primary-color); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .whatsapp-btn { background-color: #25D366; }
        .acrylic-card { 
          background: linear-gradient(165deg, #0f172a 0%, #1e293b 100%); 
          border: 1px solid #334155; 
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }
        .acrylic-section { 
          background: rgba(255, 255, 255, 0.03); 
          border: 1px solid rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(8px);
        }
      `}</style>

      {isGeneratingPdf && (
        <div className="fixed inset-0 bg-white/95 backdrop-blur-sm z-[300] flex flex-col items-center justify-center">
          <Loader2 className="w-16 h-16 brand-text animate-spin mb-6" />
          <h2 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900">Preparando Cotización...</h2>
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="bg-slate-900 text-white p-6 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black uppercase italic tracking-tighter">Panel de Control</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Configuración Maestra DPM</p>
              </div>
              <button onClick={() => setShowSettings(false)} className="bg-white/10 p-3 rounded-full hover:bg-white/20 transition-all"><X /></button>
            </div>
            <div className="flex bg-slate-100 p-1">
              <button onClick={() => setActiveSettingsTab('products')} className={`flex-1 py-3 text-[9px] font-black uppercase rounded-xl transition-all ${activeSettingsTab === 'products' ? 'bg-white shadow-sm brand-text' : 'text-slate-400'}`}>Productos</button>
              <button onClick={() => setActiveSettingsTab('costs')} className={`flex-1 py-3 text-[9px] font-black uppercase rounded-xl transition-all ${activeSettingsTab === 'costs' ? 'bg-white shadow-sm brand-text' : 'text-slate-400'}`}>Acrílico</button>
              <button onClick={() => setActiveSettingsTab('params')} className={`flex-1 py-3 text-[9px] font-black uppercase rounded-xl transition-all ${activeSettingsTab === 'params' ? 'bg-white shadow-sm brand-text' : 'text-slate-400'}`}>Parámetros</button>
              <button onClick={() => setActiveSettingsTab('brand')} className={`flex-1 py-3 text-[9px] font-black uppercase rounded-xl transition-all ${activeSettingsTab === 'brand' ? 'bg-white shadow-sm brand-text' : 'text-slate-400'}`}>Empresa</button>
              <button onClick={() => setActiveSettingsTab('customers')} className={`flex-1 py-3 text-[9px] font-black uppercase rounded-xl transition-all ${activeSettingsTab === 'customers' ? 'bg-white shadow-sm brand-text' : 'text-slate-400'}`}>Clientes</button>
              <button onClick={() => setActiveSettingsTab('history')} className={`flex-1 py-3 text-[9px] font-black uppercase rounded-xl transition-all ${activeSettingsTab === 'history' ? 'bg-white shadow-sm brand-text' : 'text-slate-400'}`}>Historial</button>
              {isAdmin && (
                <button onClick={() => setActiveSettingsTab('users')} className={`flex-1 py-3 text-[9px] font-black uppercase rounded-xl transition-all ${activeSettingsTab === 'users' ? 'bg-white shadow-sm brand-text' : 'text-slate-400'}`}>Accesos</button>
              )}
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto no-scrollbar space-y-6">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase">Tarifa Hora Laboral ($)</label><input type="number" value={params.hourly_rate} onChange={e => setParams({...params, hourly_rate: parseFloat(e.target.value)||0})} className="w-full p-4 bg-slate-50 rounded-2xl text-xs font-bold border-none ring-1 ring-slate-200" /></div>
                  <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase">Porcentaje IVA (0.19)</label><input type="number" step="0.01" value={params.iva} onChange={e => setParams({...params, iva: parseFloat(e.target.value)||0})} className="w-full p-4 bg-slate-50 rounded-2xl text-xs font-bold border-none ring-1 ring-slate-200" /></div>
                  <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase">Margen Utilidad Final (0.35)</label><input type="number" step="0.01" value={params.profit_margin_final} onChange={e => setParams({...params, profit_margin_final: parseFloat(e.target.value)||0})} className="w-full p-4 bg-slate-50 rounded-2xl text-xs font-bold border-none ring-1 ring-slate-200" /></div>
                  <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase">Margen Utilidad Publi (0.20)</label><input type="number" step="0.01" value={params.profit_margin_publisher} onChange={e => setParams({...params, profit_margin_publisher: parseFloat(e.target.value)||0})} className="w-full p-4 bg-slate-50 rounded-2xl text-xs font-bold border-none ring-1 ring-slate-200" /></div>
                  <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase">Costo Fijo Diseño ($)</label><input type="number" value={params.design_fixed_cost} onChange={e => setParams({...params, design_fixed_cost: parseFloat(e.target.value)||0})} className="w-full p-4 bg-slate-50 rounded-2xl text-xs font-bold border-none ring-1 ring-slate-200" /></div>
                  <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase">Mínimo Operativo ($)</label><input type="number" value={params.min_operative} onChange={e => setParams({...params, min_operative: parseFloat(e.target.value)||0})} className="w-full p-4 bg-slate-50 rounded-2xl text-xs font-bold border-none ring-1 ring-slate-200" /></div>
                  <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase">Factor Desperdicio (0.20)</label><input type="number" step="0.01" value={params.waste} onChange={e => setParams({...params, waste: parseFloat(e.target.value)||0})} className="w-full p-4 bg-slate-50 rounded-2xl text-xs font-bold border-none ring-1 ring-slate-200" /></div>
                  <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase">Costo Fuente LED ($)</label><input type="number" value={params.power_supply_cost} onChange={e => setParams({...params, power_supply_cost: parseFloat(e.target.value)||0})} className="w-full p-4 bg-slate-50 rounded-2xl text-xs font-bold border-none ring-1 ring-slate-200" /></div>
                  <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase">Costo Ojal ($)</label><input type="number" value={params.ojal_cost} onChange={e => setParams({...params, ojal_cost: parseFloat(e.target.value)||0})} className="w-full p-4 bg-slate-50 rounded-2xl text-xs font-bold border-none ring-1 ring-slate-200" /></div>
                  <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase">Costo Tubo (Factor)</label><input type="number" value={params.tube_cost_factor} onChange={e => setParams({...params, tube_cost_factor: parseFloat(e.target.value)||0})} className="w-full p-4 bg-slate-50 rounded-2xl text-xs font-bold border-none ring-1 ring-slate-200" /></div>
                </div>
              )}
              {activeSettingsTab === 'brand' && (
                <div className="space-y-4">
                  <div className="flex flex-col items-center gap-4 p-6 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                    {brand.logo ? (
                      <div className="relative group">
                        <img src={brand.logo} alt="Logo Empresa" className="w-32 h-32 object-contain rounded-xl bg-white p-2 shadow-md" referrerPolicy="no-referrer" />
                        <button onClick={removeLogo} className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center"><ImageIcon className="w-8 h-8 text-slate-400" /></div>
                        <p className="text-[10px] font-black text-slate-400 uppercase">Sin Logo Cargado</p>
                      </div>
                    )}
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" id="logo-upload" />
                    <label htmlFor="logo-upload" className="brand-bg text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase cursor-pointer hover:opacity-90 transition-all flex items-center gap-2">
                      <UploadCloud className="w-4 h-4" /> {brand.logo ? "Cambiar Logo" : "Subir Logo"}
                    </label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase">Nombre Empresa</label><input type="text" placeholder="Empresa" value={brand.companyName} onChange={e => setBrand({...brand, companyName: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl text-xs font-bold border-none ring-1 ring-slate-200" /></div>
                    <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase">Eslogan</label><input type="text" placeholder="Eslogan" value={brand.slogan} onChange={e => setBrand({...brand, slogan: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl text-xs font-bold border-none ring-1 ring-slate-200" /></div>
                    <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase">WhatsApp</label><input type="text" placeholder="WhatsApp" value={brand.phone} onChange={e => setBrand({...brand, phone: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl text-xs font-bold border-none ring-1 ring-slate-200" /></div>
                    <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase">Email</label><input type="text" placeholder="Email" value={brand.email} onChange={e => setBrand({...brand, email: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl text-xs font-bold border-none ring-1 ring-slate-200" /></div>
                    <div className="space-y-2 md:col-span-2"><label className="text-[10px] font-black text-slate-400 uppercase">Dirección</label><input type="text" placeholder="Dirección" value={brand.address} onChange={e => setBrand({...brand, address: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl text-xs font-bold border-none ring-1 ring-slate-200" /></div>
                    <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase">NIT / Identificación</label><input type="text" placeholder="NIT" value={brand.taxId} onChange={e => setBrand({...brand, taxId: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl text-xs font-bold border-none ring-1 ring-slate-200" /></div>
                  </div>
                </div>
              )}
              {activeSettingsTab === 'customers' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-black uppercase italic tracking-tighter">Base de Datos de Clientes</h4>
                    <span className="bg-slate-100 px-3 py-1 rounded-full text-[10px] font-bold text-slate-500 uppercase">{customers.length} Registrados</span>
                  </div>
                  <div className="space-y-2">
                    {customers.map(c => (
                      <div key={c.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-between items-center group hover:border-red-200 transition-all">
                        <div>
                          <p className="text-xs font-black uppercase tracking-tight">{c.name}</p>
                          <div className="flex gap-3 mt-1">
                            <p className="text-[10px] text-slate-500 font-bold flex items-center gap-1"><Phone className="w-2 h-2"/> {c.phone}</p>
                            <p className="text-[10px] text-slate-500 font-bold flex items-center gap-1"><FileText className="w-2 h-2"/> {c.quotesCount} Cotizaciones</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => {
                            setCustomerInfo({ id: c.id, name: c.name, phone: c.phone, address: c.address || '', email: c.email || '' });
                            setShowSettings(false);
                          }} className="bg-white p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all shadow-sm"><UserCheck className="w-4 h-4"/></button>
                          <button onClick={() => handleDeleteCustomer(c.id)} className="bg-white p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all shadow-sm"><Trash2 className="w-4 h-4"/></button>
                        </div>
                      </div>
                    ))}
                    {customers.length === 0 && (
                      <div className="text-center py-10 opacity-30">
                        <Users className="w-10 h-10 mx-auto mb-2" />
                        <p className="text-xs font-bold uppercase tracking-widest">No hay clientes registrados</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {activeSettingsTab === 'history' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-black uppercase italic tracking-tighter">Historial de Cotizaciones</h4>
                    <span className="bg-slate-100 px-3 py-1 rounded-full text-[10px] font-bold text-slate-500 uppercase">{history.length} Guardadas</span>
                  </div>
                  <div className="space-y-3">
                    {history.map(h => (
                      <div key={h.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3 group hover:border-red-200 transition-all">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-xs font-black uppercase tracking-tight">{h.customerName}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">{h.date}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black brand-text italic tracking-tighter">${Math.round(h.total).toLocaleString()}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{h.items.length} Items</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => {
                            setQuoteJobs(h.items);
                            setCustomerInfo({ id: '', name: h.customerName, phone: h.customerPhone, address: '', email: '' });
                            setShowSettings(false);
                          }} className="flex-1 bg-white py-2 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-600 hover:bg-red-50 hover:text-red-500 transition-all shadow-sm border border-slate-100">Cargar Cotización</button>
                          <button onClick={() => handleDeleteQuote(h.id)} className="bg-white p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all shadow-sm border border-slate-100"><Trash2 className="w-3 h-3"/></button>
                        </div>
                      </div>
                    ))}
                    {history.length === 0 && (
                      <div className="text-center py-10 opacity-30">
                        <FileText className="w-10 h-10 mx-auto mb-2" />
                        <p className="text-xs font-bold uppercase tracking-widest">No hay historial disponible</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {activeSettingsTab === 'users' && isAdmin && (
                <div className="space-y-6">
                  <div className="bg-slate-900 p-6 rounded-3xl space-y-4">
                    <h4 className="text-[10px] font-black uppercase brand-text flex items-center gap-2"><PlusCircle className="w-3 h-3"/> Autorizar Personal</h4>
                    <div className="flex gap-2">
                      <input type="email" id="new-user-email" placeholder="email@gmail.com" className="flex-1 bg-slate-800 p-3 rounded-xl text-white text-xs font-bold border-none ring-1 ring-slate-700 outline-none" />
                      <button onClick={() => {
                        const input = document.getElementById('new-user-email') as HTMLInputElement;
                        if (input.value) {
                          addAuthorizedUser(input.value);
                          input.value = '';
                        }
                      }} className="brand-bg text-white px-6 rounded-xl text-[10px] font-black uppercase">Añadir</button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {authorizedUsers.map(u => (
                      <div key={u.id} className="bg-slate-50 p-4 rounded-2xl border flex justify-between items-center group">
                        <div>
                          <p className="text-xs font-black uppercase tracking-tight flex items-center gap-2">
                            {u.email}
                            {u.email === OWNER_EMAIL && <span className="text-[8px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded uppercase">Propietario</span>}
                          </p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Rol: {u.role}</p>
                        </div>
                        <div className="flex gap-2">
                          {u.email !== OWNER_EMAIL && (
                            <>
                              <button onClick={() => toggleUserRole(u.email, u.role)} className="bg-white p-2 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-all shadow-sm"><ShieldCheck className="w-4 h-4"/></button>
                              <button onClick={() => removeAuthorizedUser(u.email)} className="bg-white p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all shadow-sm"><Trash2 className="w-4 h-4"/></button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {isAdmin && (
              <div className="p-6 bg-slate-50 border-t flex justify-between items-center">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Sincronización en la nube activa</p>
                <button onClick={saveSharedSettings} className="brand-bg text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-red-500/20 active:scale-95 transition-all flex items-center gap-2">
                  <Save className="w-4 h-4" /> Guardar Cambios Cloud
                </button>
              </div>
            )}
            {!isAdmin && (
              <div className="p-6 bg-slate-50 border-t flex justify-end">
                <button onClick={() => setShowSettings(false)} className="brand-bg text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-red-500/10 active:scale-95 transition-all">Cerrar</button>
              </div>
            )}
          </div>
        </div>
      )}

      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-50 shadow-sm backdrop-blur-md bg-white/90">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="brand-bg p-2 rounded-xl shadow-lg shadow-red-500/20 overflow-hidden flex items-center justify-center w-10 h-10">
              {brand.logo ? (
                <img src={brand.logo} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
              ) : (
                <Smartphone className="text-white w-6 h-6" />
              )}
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter uppercase leading-none">{brand.companyName}</h1>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.4em] mt-1">{brand.slogan}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl pr-3">
                <img src={user.photoURL || ''} alt={user.displayName || ''} className="w-8 h-8 rounded-lg border border-white shadow-sm" referrerPolicy="no-referrer" />
                <div className="hidden md:block">
                  <p className="text-[9px] font-black uppercase tracking-tighter leading-none">{user.displayName}</p>
                  <button onClick={logout} className="text-[7px] font-bold text-slate-400 uppercase hover:text-red-500 transition-all">Cerrar Sesión</button>
                </div>
              </div>
            ) : (
              <button onClick={login} className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:brand-bg transition-all active:scale-95 shadow-xl shadow-slate-900/10">
                <LogIn className="w-4 h-4" /> Entrar
              </button>
            )}
            <button onClick={() => setShowSettings(true)} className="p-3 bg-slate-900 text-white rounded-xl shadow-xl hover:brand-bg transition-all active:scale-90"><Settings className="w-5 h-5"/></button>
          </div>
        </div>
      </header>

      <main className="max-w-[1440px] mx-auto p-2 md:p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 mt-2">
        
        {/* CALCULADORA BASE */}
        <div className="lg:col-span-4 space-y-4">
          <section className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100 flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                <Calculator className="brand-text w-6 h-6" /> Cotizador
              </h2>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button onClick={() => setFormData({...formData, customer_type: 'final'})} className={`px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${formData.customer_type === 'final' ? 'bg-white shadow-md brand-text' : 'text-slate-400'}`}>Final</button>
                <button onClick={() => setFormData({...formData, customer_type: 'publicista'})} className={`px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${formData.customer_type === 'publicista' ? 'bg-white shadow-md brand-text' : 'text-slate-400'}`}>Publi</button>
              </div>
            </div>

            <div className="space-y-4 flex-1">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Producto o Servicio Base</label>
                <select id="job_description" value={formData.job_description} onChange={handleInputChange} className="w-full bg-slate-50 border-none ring-1 ring-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-[var(--primary-color)] transition-all shadow-sm">
                  <option value="">Seleccionar Producto...</option>
                  {products.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                </select>
              </div>

              {!isAcrilicoJob && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Ancho (cm)</label>
                    <input type="number" id="width" value={formData.width} onChange={handleInputChange} className="w-full bg-slate-50 p-4 rounded-xl ring-1 ring-slate-200 text-base font-bold" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Alto (cm)</label>
                    <input type="number" id="height" value={formData.height} onChange={handleInputChange} className="w-full bg-slate-50 p-4 rounded-xl ring-1 ring-slate-200 text-base font-bold" />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Cantidad</label>
                  <input type="number" id="quantity" value={formData.quantity} onChange={handleInputChange} className="w-full bg-slate-50 p-4 rounded-xl ring-1 ring-slate-200 text-base font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Diseño</label>
                  <div className={`h-[56px] rounded-xl border-2 flex items-center justify-center gap-3 cursor-pointer transition-all ${formData.include_design ? 'bg-[var(--primary-color)]/5 border-[var(--primary-color)] shadow-inner' : 'bg-slate-50 border-slate-100'}`} onClick={() => setFormData(f => ({...f, include_design: !f.include_design}))}>
                    <PenTool className={`w-5 h-5 ${formData.include_design ? 'brand-text' : 'text-slate-300'}`} />
                    <span className={`text-[11px] font-black uppercase ${formData.include_design ? 'brand-text' : 'text-slate-400'}`}>{formData.include_design ? "Incluido" : "Omitir"}</span>
                  </div>
                </div>
              </div>

              {/* OPCIONES PARA PENDONES */}
              {isAnyPendon && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4 animate-in slide-in-from-top-4">
                  <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Layers className="w-4 h-4" /> Opciones de Pendón
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Tubos</label>
                      <button onClick={() => setFormData(f => ({...f, include_tubes: !f.include_tubes}))} className={`w-full py-3 rounded-lg text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 border-2 ${formData.include_tubes ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-400'}`}>
                        <MoveHorizontal className="w-4 h-4" /> {formData.include_tubes ? "Con Tubos" : "Sin Tubos"}
                      </button>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Cant. Ojales</label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                        <input type="number" id="ojalete_quantity" value={formData.ojalete_quantity} onChange={handleInputChange} className="w-full bg-white p-3 pl-9 rounded-lg text-xs font-bold ring-1 ring-slate-200" placeholder="0" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4">
                <button onClick={handleSaveJob} className="w-full brand-bg text-white font-black py-4 rounded-2xl shadow-2xl uppercase text-xs tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all">
                  <PlusCircle className="w-6 h-6" /> Agregar a Cotización
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* ACRILICO DPM */}
        <div className="lg:col-span-5 space-y-8">
          {isAcrilicoJob ? (
            <section className="acrylic-card p-6 md:p-8 rounded-3xl shadow-2xl space-y-6 animate-in zoom-in-95 duration-500">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-700/50 pb-6">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <Wrench className="brand-text w-8 h-8" />
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Detalle Acrílico</h3>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Configuración técnica Estrategias DPM</p>
                </div>
                <div className="min-w-[200px]">
                  <label className="text-[9px] font-black text-slate-500 uppercase block mb-1 tracking-widest">Material Base Seleccionado</label>
                  <select id="selected_acrylic_material_id" value={formData.selected_acrylic_material_id} onChange={handleInputChange} className="w-full bg-slate-800 border-none ring-1 ring-slate-700 rounded-xl px-4 py-2 text-[11px] font-black text-white uppercase outline-none focus:ring-red-500 transition-all">
                    <option value="">Elegir Acrílico...</option>
                    {params.acrylic_materials.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="acrylic-section p-6 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <FontIcon className="w-5 h-5 brand-text" />
                    <h4 className="text-[12px] font-black text-white uppercase tracking-[0.2em]">Corte & Volumen</h4>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase flex justify-between">Letras Caladas (cm) <span>Ancho x Alto</span></label>
                      <div className="flex gap-2">
                        <input type="number" id="calado_w" value={formData.calado_w} onChange={handleInputChange} className="w-full bg-slate-900/50 p-3 rounded-xl text-white text-sm font-bold ring-1 ring-slate-700" placeholder="Ancho" />
                        <input type="number" id="calado_h" value={formData.calado_h} onChange={handleInputChange} className="w-full bg-slate-900/50 p-3 rounded-xl text-white text-sm font-bold ring-1 ring-slate-700" placeholder="Alto" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase flex justify-between">Letras 3D (cm) <span>Ancho x Alto</span></label>
                      <div className="flex gap-2">
                        <input type="number" id="letras3d_w" value={formData.letras3d_w} onChange={handleInputChange} className="w-full bg-slate-900/50 p-3 rounded-xl text-white text-sm font-bold ring-1 ring-slate-700" placeholder="Ancho" />
                        <input type="number" id="letras3d_h" value={formData.letras3d_h} onChange={handleInputChange} className="w-full bg-slate-900/50 p-3 rounded-xl text-white text-sm font-bold ring-1 ring-slate-700" placeholder="Alto" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase">Grosor / Profundidad 3D (cm)</label>
                      <div className="relative">
                        <input type="number" id="letras3d_grosor" value={formData.letras3d_grosor} onChange={handleInputChange} className="w-full bg-slate-900/50 p-3 rounded-xl text-white text-sm font-bold ring-1 ring-slate-700" />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-600">cm</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="acrylic-section p-6 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-5 h-5 brand-text" />
                    <h4 className="text-[12px] font-black text-white uppercase tracking-[0.2em]">Iluminación & Vinilos</h4>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase flex justify-between">Vinilo (cm) <span className="text-red-400">Factor 2.4</span></label>
                      <div className="flex gap-2">
                        <input type="number" id="vinilo_w" value={formData.vinilo_w} onChange={handleInputChange} className="w-full bg-slate-900/50 p-3 rounded-xl text-white text-sm font-bold ring-1 ring-slate-700" placeholder="W" />
                        <input type="number" id="vinilo_h" value={formData.vinilo_h} onChange={handleInputChange} className="w-full bg-slate-900/50 p-3 rounded-xl text-white text-sm font-bold ring-1 ring-slate-700" placeholder="H" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase flex justify-between">Lona (cm) <span className="text-orange-400">Factor 2.3</span></label>
                      <div className="flex gap-2">
                        <input type="number" id="lona_w" value={formData.lona_w} onChange={handleInputChange} className="w-full bg-slate-900/50 p-3 rounded-xl text-white text-sm font-bold ring-1 ring-slate-700" placeholder="W" />
                        <input type="number" id="lona_h" value={formData.lona_h} onChange={handleInputChange} className="w-full bg-slate-900/50 p-3 rounded-xl text-white text-sm font-bold ring-1 ring-slate-700" placeholder="H" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase">LED (cm lineal)</label>
                        <input type="number" id="led_cm" value={formData.led_cm} onChange={handleInputChange} className="w-full bg-slate-900/50 p-3 rounded-xl text-white text-sm font-bold ring-1 ring-slate-700" placeholder="cm" />
                      </div>
                      <div className="space-y-1 flex flex-col justify-end">
                        <button onClick={() => setFormData(f => ({...f, include_power_supply: !f.include_power_supply}))} className={`w-full py-3 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 border-2 ${formData.include_power_supply ? 'bg-orange-600 border-orange-500 text-white shadow-lg shadow-orange-900/40' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                          <Power className="w-4 h-4" /> Fuente LED
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="acrylic-section p-6 rounded-2xl space-y-6 md:col-span-2 shadow-inner">
                  <div className="flex items-center gap-3 mb-1">
                    <Building2 className="w-6 h-6 brand-text" />
                    <h4 className="text-[13px] font-black text-white uppercase tracking-[0.2em]">Fondo & Estructura Metálica</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase">Fondo Acrílico (cm)</label>
                      <div className="flex gap-2">
                        <input type="number" id="fondo_w" value={formData.fondo_w} onChange={handleInputChange} className="w-full bg-slate-900/50 p-3 rounded-xl text-white text-base font-bold ring-1 ring-slate-700" placeholder="W" />
                        <input type="number" id="fondo_h" value={formData.fondo_h} onChange={handleInputChange} className="w-full bg-slate-900/50 p-3 rounded-xl text-white text-base font-bold ring-1 ring-slate-700" placeholder="H" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase">Costo Estructura ($)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-black">$</span>
                        <input type="number" id="manual_structure_cost" value={formData.manual_structure_cost} onChange={handleInputChange} className="w-full bg-slate-900/50 p-3 pl-6 rounded-xl text-white text-base font-bold ring-1 ring-slate-700" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase">Tiempo Mano de Obra (Horas)</label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input type="number" id="installation_hours" value={formData.installation_hours} onChange={handleInputChange} className="w-full bg-slate-900/50 p-3 rounded-xl text-white text-base font-bold ring-1 ring-slate-700" placeholder="Inst." />
                          <span className="absolute -top-5 left-1 text-[8px] font-black text-slate-600 uppercase">INSTAL.</span>
                        </div>
                        <div className="relative flex-1">
                          <input type="number" id="assembly_hours" value={formData.assembly_hours} onChange={handleInputChange} className="w-full bg-slate-900/50 p-3 rounded-xl text-white text-base font-bold ring-1 ring-slate-700" placeholder="Arm." />
                          <span className="absolute -top-5 left-1 text-[8px] font-black text-slate-600 uppercase">ARMADO</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 p-6 rounded-2xl border border-white/10 backdrop-blur-xl grid grid-cols-2 md:grid-cols-4 gap-4">
                 <div className="space-y-1">
                   <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1"><Box className="w-3 h-3"/> Materiales</p>
                   <p className="text-xl font-black text-white italic tracking-tighter">${Math.round(quote.materialCost).toLocaleString()}</p>
                 </div>
                 <div className="space-y-1">
                   <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1"><TrendingUp className="w-3 h-3"/> Utilidad</p>
                   <p className="text-xl font-black text-red-500 italic tracking-tighter">${Math.round(quote.costWithMargin - quote.totalBeforeMargin).toLocaleString()}</p>
                 </div>
                 <div className="space-y-1">
                   <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1"><ShieldCheck className="w-3 h-3"/> IVA ({params.iva*100}%)</p>
                   <p className="text-xl font-black text-slate-300 italic tracking-tighter">${Math.round(quote.ivaAmount).toLocaleString()}</p>
                 </div>
                 <div className="bg-white/10 rounded-xl p-4 border border-white/20 shadow-2xl">
                   <p className="text-[10px] text-white font-black uppercase tracking-[0.2em] mb-1">Inversión Final</p>
                   <p className="text-2xl font-black text-white italic tracking-tighter leading-none">${Math.round(quote.finalPrice).toLocaleString()}</p>
                 </div>
              </div>
            </section>
          ) : (
            <section className="bg-slate-900 p-8 rounded-3xl shadow-2xl relative overflow-hidden flex flex-col items-center justify-center text-center min-h-[300px]">
              <div className="relative z-10 space-y-6">
                <div className="inline-flex items-center gap-2 bg-red-600/10 px-4 py-1.5 rounded-full border border-red-600/20">
                  <Smartphone className="brand-text w-3 h-3" />
                  <span className="text-[10px] font-black brand-text uppercase tracking-widest">Inversión Estimada</span>
                </div>
                <h2 className="text-5xl font-black text-white tracking-tighter leading-none">${Math.round(quote.finalPrice).toLocaleString()}</h2>
                <div className="flex flex-col gap-3 text-slate-400 text-[11px] font-bold uppercase tracking-widest">
                  <p>{quote.totalAreaM2.toFixed(3)} m² de Producción • x{formData.quantity} Unidades</p>
                  <div className="h-0.5 w-16 bg-slate-800 mx-auto"></div>
                  <div className="flex items-center justify-center gap-4">
                    <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 brand-text"/> IVA Incluido</span>
                    <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 brand-text"/> Margen Aplicado</span>
                  </div>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-[300px] h-[300px] brand-bg/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-[100px]"></div>
              <div className="absolute bottom-0 left-0 w-[200px] h-[200px] blue-600/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-[80px]"></div>
            </section>
          )}

          <section className="bg-white rounded-3xl shadow-xl border border-slate-100 flex flex-col overflow-hidden">
            <div className="p-4 border-b bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layout className="w-5 h-5 text-slate-400" />
                <h3 className="text-xs font-black uppercase text-slate-800 italic tracking-tighter">Borradores de Cotización</h3>
              </div>
              <span className="brand-bg text-white px-4 py-1.5 rounded-xl text-[11px] font-black shadow-lg shadow-red-500/20">{savedJobs.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto max-h-[300px] divide-y divide-slate-100 no-scrollbar">
              {savedJobs.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center gap-4">
                   <div className="p-4 bg-slate-50 rounded-full"><Box className="w-10 h-10 text-slate-200" /></div>
                   <p className="text-[10px] font-black text-slate-300 uppercase italic tracking-widest">No hay items en la lista</p>
                </div>
              ) : (
                savedJobs.map(job => (
                  <div key={job.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-all group">
                    <div className="flex flex-col space-y-0.5">
                      <span className="font-black text-sm uppercase text-slate-800 group-hover:brand-text transition-colors">{job.job_description}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">x{job.quantity} • {job.use_manual_meters ? `${job.manual_meters}m` : `${job.width}x${job.height}cm`}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-base font-black text-slate-900">${Math.round(job.finalPrice).toLocaleString()}</span>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => setQuoteJobs(prev => [...prev, job])} className="p-3 brand-bg text-white rounded-xl active:scale-90 transition-all shadow-lg hover:shadow-red-500/10"><Plus className="w-4 h-4" /></button>
                        <button onClick={() => setSavedJobs(prev => prev.filter(j => j.id !== job.id))} className="p-3 text-slate-300 hover:text-red-500 transition-all"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <div className="lg:col-span-3 space-y-4">
          <section className="bg-white p-4 rounded-2xl shadow-xl border border-slate-100 h-full flex flex-col sticky top-20">
            <div className="flex items-center gap-2 mb-4 border-b pb-3">
              <FileText className="brand-text w-5 h-5" />
              <h2 className="text-base font-black text-slate-800 italic uppercase tracking-tighter">Documento Final</h2>
            </div>
            
            <div className="space-y-3 mb-4">
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Atención a:</label>
                  <button onClick={() => { setShowSettings(true); setActiveSettingsTab('customers'); }} className="text-[8px] font-black brand-text uppercase hover:underline flex items-center gap-1"><Search className="w-2 h-2"/> Buscar</button>
                </div>
                <input type="text" placeholder="Nombre del Cliente..." value={customerInfo.name} onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))} className="w-full bg-slate-50 p-3 rounded-lg ring-1 ring-slate-200 text-[11px] font-bold focus:ring-red-200 outline-none transition-all" />
              </div>
            </div>

            <div className="flex-1 space-y-2 mb-4 overflow-y-auto no-scrollbar max-h-[200px]">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Contenido ({quoteJobs.length})</h4>
                {quoteJobs.length > 0 && <button onClick={() => setQuoteJobs([])} className="text-[8px] font-black text-slate-400 hover:text-red-600 uppercase">Limpiar</button>}
              </div>
              {quoteJobs.length === 0 ? (
                <div className="p-4 text-center border-2 border-dashed border-slate-100 rounded-xl flex flex-col items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-slate-200" />
                  <p className="text-[8px] font-black text-slate-300 uppercase italic">Añade items de la lista central</p>
                </div>
              ) : (
                quoteJobs.map((job, idx) => (
                  <div key={idx} className="bg-slate-50 p-2 rounded-lg flex justify-between items-center border border-slate-100 animate-in slide-in-from-right-4">
                    <div className="truncate pr-2 space-y-0.5">
                      <span className="text-[9px] font-black uppercase truncate block">{job.job_description}</span>
                      <span className="text-[8px] font-bold text-slate-400 uppercase italic">${Math.round(job.finalPrice).toLocaleString()}</span>
                    </div>
                    <button onClick={() => setQuoteJobs(prev => prev.filter((_, i) => i !== idx))} className="p-1.5 text-slate-300 hover:text-red-500 transition-all"><X className="w-3.5 h-3.5"/></button>
                  </div>
                ))
              )}
            </div>

            <div className="bg-slate-900 p-4 rounded-xl mb-4 shadow-inner">
              <div className="flex items-center gap-1 mb-1">
                <DollarSign className="w-3 h-3 brand-text" />
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">Inversión Total</span>
              </div>
              <span className="text-xl font-black text-white italic tracking-tighter leading-none">${Math.round(quoteJobs.reduce((s, j) => s + j.finalPrice, 0)).toLocaleString()}</span>
              <div className="mt-2 pt-2 border-t border-slate-800">
                <p className="text-[7px] text-slate-500 font-bold uppercase tracking-widest italic leading-relaxed">Incluye IVA (19%) y materiales detallados DPM.</p>
              </div>
            </div>

            <div className="space-y-2">
              <button onClick={() => { saveToHistory(); generatePdf(); }} disabled={quoteJobs.length === 0} className="w-full brand-bg text-white font-black py-3 rounded-lg text-[9px] tracking-widest uppercase flex items-center justify-center gap-2 active:scale-95 transition-all shadow-2xl shadow-red-500/20 disabled:grayscale disabled:opacity-50">
                <Download className="w-4 h-4" /> Guardar y Exportar PDF
              </button>
              <button onClick={() => { saveToHistory(); sendWhatsApp(); }} disabled={quoteJobs.length === 0} className="w-full whatsapp-btn text-white font-black py-3 rounded-lg text-[9px] tracking-widest uppercase flex items-center justify-center gap-2 active:scale-95 transition-all shadow-2xl shadow-green-500/20 disabled:grayscale disabled:opacity-50">
                <WhatsAppIcon className="w-4 h-4" /> Guardar y Enviar WhatsApp
              </button>
            </div>
            
            <p className="text-[8px] text-slate-400 font-bold text-center mt-4 uppercase tracking-tighter italic">Estrategias DPM © 2025 • v3.5.0</p>
          </section>
        </div>
      </main>

      <div className="pdf-capture-container">
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
    </div>
  );
};

export default App;
