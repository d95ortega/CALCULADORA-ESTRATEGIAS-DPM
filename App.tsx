
import React, { useState, useMemo, useEffect, useRef, Component, ErrorInfo, ReactNode, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FormData, SavedJob, Product, Customer, AcrylicType, BaseType, AcrylicMaterial, QuoteHistoryEntry, Order, OrderStatus, QuoteStatus } from './types';
import { calculateQuote } from './utils/calculator';
import { PRODUCT_PRICES_FINAL, PRODUCT_PRICES_PUBLISHER, PRODUCT_DESIGN_TIMES, DEFAULT_PARAMS } from './constants';
import { 
  Calculator, Settings, Sparkles, Plus, FileText, X, Download, MessageCircle,
  Loader2, Image as ImageIcon, Layers, Info, Trash2, Edit2, Save, CheckCircle2,
  PlusCircle, MessageSquare, UserCheck, Palette, Building2, UploadCloud, Smartphone, HelpCircle, User as UserIcon,
  DollarSign, Percent, Clock, Box, MapPin, Mail, Phone, Fingerprint, Users, Search, Ruler, Disc, Droplets, Zap, Wrench, Scissors, Layout, RefreshCcw, PieChart, Activity,
  Maximize2, Type as FontIcon, MoveHorizontal, ChevronRight, Tags, Power, TrendingUp, ShieldCheck, PenTool, Hash, LogIn, LogOut, Package, Printer, Warehouse, Store, Truck, ClipboardList,
  Archive, FileCheck, FileEdit, Sliders, Tag
} from 'lucide-react';
// import { jsPDF } from 'jspdf';
// import html2canvas from 'html2canvas';
import { 
  auth, db, googleProvider, signInWithPopup, signOut, onAuthStateChanged, 
  collection, query, where, onSnapshot, doc, setDoc, addDoc, updateDoc, deleteDoc, 
  handleFirestoreError, OperationType, User, getDocFromServer, getDocs,
  limit, orderBy 
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

// Lazy Views
const DashboardView = lazy(() => import('./src/components/views/DashboardView'));
const SettingsView = lazy(() => import('./src/components/views/SettingsView'));
const CalculatorView = lazy(() => import('./src/components/views/CalculatorView'));
const QuotesView = lazy(() => import('./src/components/views/QuotesView'));
const OrdersView = lazy(() => import('./src/components/views/OrdersView'));
const CustomersView = lazy(() => import('./src/components/views/CustomersView'));
import PDFTemplate from './src/components/views/PDFTemplate';

// Helper to remove undefined values for Firestore
const sanitize = (obj: any): any => {
  if (Array.isArray(obj)) return obj.map(sanitize);
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => [k, sanitize(v)])
    );
  }
  return obj;
};

const App: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [brand, setBrand] = useState(() => {
    const saved = localStorage.getItem('dpm_brand');
    return saved ? JSON.parse(saved) : DEFAULT_BRAND;
  });

  // Versioning system to force reset if needed
  const STORAGE_VERSION = '4.1.0-force-factory-reset';
  
  useEffect(() => {
    const currentVersion = localStorage.getItem('dpm_storage_version');
    if (currentVersion !== STORAGE_VERSION) {
      // Clear local
      localStorage.removeItem('dpm_params');
      localStorage.removeItem('dpm_products');
      localStorage.setItem('dpm_storage_version', STORAGE_VERSION);
      
      // If admin is logged in, we will also overwrite Firestore in the next render cycle
      // by triggering a reload which will then hit the "saveSharedSettings" if we force it
      window.location.reload();
    }
  }, []);

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
  const [newProduct, setNewProduct] = useState<Product>({ name: '', priceFinal: 0, pricePublisher: 0, designTime: 30, isFixedPrice: false });
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
    include_power_supply: false,
    overridePrice: 0
  });
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [quoteJobs, setQuoteJobs] = useState<SavedJob[]>([]);
  const [customerInfo, setCustomerInfo] = useState({ id: '', name: '', phone: '', taxId: '', address: '', email: '' });
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('dpm_customers');
    return saved ? JSON.parse(saved) : [];
  });
  const [history, setHistory] = useState<QuoteHistoryEntry[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'products' | 'costs' | 'params' | 'brand' | 'users' | 'backup'>('products');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [initialStatus, setInitialStatus] = useState<QuoteStatus>('PENDIENTE');
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pdfConfig, setPdfConfig] = useState<{
    customer: Customer;
    items: SavedJob[];
    quoteId: string;
    isOrder: boolean;
    isLabel?: boolean;
    date?: string;
    deliveryPhotos?: string[];
  } | null>(null);

  useEffect(() => {
    (window as any).testFirestoreConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'company_data', 'dpm'));
        return { success: true };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : String(error) };
      }
    };
  }, []);

  const [authorizedUsers, setAuthorizedUsers] = useState<any[]>([]);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [authTimeout, setAuthTimeout] = useState(false);

  useEffect(() => {
    if (user && isAuthorized === null) {
      const timer = setTimeout(() => {
        setAuthTimeout(true);
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      setAuthTimeout(false);
    }
  }, [user, isAuthorized]);

  const [historySearch, setHistorySearch] = useState('');
  const [historyFilter, setHistoryFilter] = useState<QuoteStatus | 'TODAS'>('TODAS');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeView, setActiveView] = useState<'dashboard' | 'calculator' | 'quotes' | 'orders' | 'customers' | 'settings'>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', role: 'user' as const });

  const handleAddAuthorizedUser = (email: string) => addAuthorizedUser(email);
  const handleDeleteAuthorizedUser = (email: string) => removeAuthorizedUser(email);

  const OWNER_EMAIL = 'estrategiaslaunion@gmail.com';

  // Effect to force-push factory defaults to Firestore if version is new and user is admin
  useEffect(() => {
    if (isAuthReady && user && isAuthorized && isAdmin) {
      const versionPushed = localStorage.getItem('dpm_version_pushed_to_cloud');
      if (versionPushed !== STORAGE_VERSION) {
        const resetSettings = async () => {
          const path = 'company_data/dpm/settings/current';
          try {
            // First mark as pushed in local to prevent loop if write fails/takes long
            localStorage.setItem('dpm_version_pushed_to_cloud', STORAGE_VERSION);
            
            await setDoc(doc(db, path), { 
              brand: DEFAULT_BRAND, 
              params: DEFAULT_PARAMS, 
              products: Object.keys(PRODUCT_PRICES_FINAL).map(name => ({
                name,
                priceFinal: PRODUCT_PRICES_FINAL[name],
                pricePublisher: PRODUCT_PRICES_PUBLISHER[name] || PRODUCT_PRICES_FINAL[name],
                designTime: PRODUCT_DESIGN_TIMES[name] || 0
              }))
            });
            
            console.log("Factory defaults pushed to cloud successfully");
            window.location.reload(); // Final reload to ensure all states are fresh
          } catch (error) {
            console.error("Error pushing factory defaults:", error);
            // If failed, we already set the version in local storage to prevent loop, 
            // but we might want to try again later if it was a transient error.
            // For now, let's keep it simple to fix the "cannot enter" issue.
          }
        };
        resetSettings();
      }
    }
  }, [isAuthReady, user, isAuthorized, isAdmin]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setIsAuthorized(null);
      setIsAdmin(false);
      return;
    }

    const checkAuth = async () => {
      const isOwner = user.email === OWNER_EMAIL;
      
      if (isOwner) {
        setIsAuthorized(true);
        setIsAdmin(true);
      }

      const authDocRef = doc(db, 'authorized_users', user.email || '');
      
      try {
        const authSnap = await getDocFromServer(authDocRef);
        if (authSnap.exists()) {
          const role = authSnap.data()?.role;
          setIsAuthorized(true);
          setIsAdmin(isOwner || role === 'admin');
        } else {
          setIsAuthorized(isOwner);
          setIsAdmin(isOwner);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setIsAuthorized(isOwner);
        setIsAdmin(isOwner);
      }
    };

    checkAuth();
  }, [user]);

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

  // Optimized fetch: Limit to recent 100 quotes
  useEffect(() => {
    if (!user || !isAuthorized) return;
    const path = 'company_data/dpm/quotes';
    const q = query(
      collection(db, path), 
      orderBy('date', 'desc'),
      limit(100)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QuoteHistoryEntry));
      setHistory(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
    return () => unsubscribe();
  }, [user, isAuthorized]);

  // Optimized fetch: Limit to recent 100 orders
  useEffect(() => {
    if (!user || !isAuthorized) return;
    const path = 'company_data/dpm/orders';
    const q = query(
      collection(db, path), 
      orderBy('updatedAt', 'desc'),
      limit(100)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      setOrders(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
    return () => unsubscribe();
  }, [user, isAuthorized]);

  const saveSharedSettings = async () => {
    if (!isAdmin) return;
    const path = 'company_data/dpm/settings/current';
    try {
      await setDoc(doc(db, path), sanitize({ brand, params, products }));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  useEffect(() => {
    localStorage.setItem('dpm_params', JSON.stringify(params));
    localStorage.setItem('dpm_products', JSON.stringify(products));
    localStorage.setItem('dpm_brand', JSON.stringify(brand));
    localStorage.setItem('dpm_customers', JSON.stringify(customers));
    document.documentElement.style.setProperty('--primary-color', brand.primaryColor);
  }, [params, products, brand, customers]);

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
    // Optionally reset overridePrice after saving
    setFormData(prev => ({ ...prev, overridePrice: 0 }));
  };

  const saveCustomer = async (data: Omit<Customer, 'id'>) => {
    if (user && isAuthorized) {
      const path = 'company_data/dpm/customers';
      try {
        const sanitized = sanitize(data);
        const existing = customers.find(c => c.name.toLowerCase() === data.name.toLowerCase());
        if (existing) {
          await updateDoc(doc(db, path, existing.id), { ...sanitized, quotesCount: existing.quotesCount });
        } else {
          await addDoc(collection(db, path), sanitized);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    } else {
      setCustomers(prev => {
        const existing = prev.find(c => c.name.toLowerCase() === data.name.toLowerCase());
        if (existing) {
          return prev.map(c => c.id === existing.id ? { ...c, ...data } : c);
        } else {
          return [{ ...data, id: Math.random().toString(36).substr(2, 9) } as Customer, ...prev];
        }
      });
    }
  };

  const saveToHistoryFromDraft = async (job: SavedJob) => {
    setIsSaving(true);
    const total = job.finalPrice;
    const date = new Date().toISOString();
    const newEntry: Omit<QuoteHistoryEntry, 'id'> = {
      customerName: customerInfo.name || "CLIENTE GENERAL",
      customerPhone: customerInfo.phone || "",
      customerEmail: customerInfo.email || "",
      customerAddress: customerInfo.address || "",
      date: date,
      items: [job],
      total: total,
      status: 'PENDIENTE',
      isDraft: false
    };

    try {
      if (user && isAuthorized) {
        const path = 'company_data/dpm/quotes';
        await addDoc(collection(db, path), sanitize(newEntry));
      } else {
        const id = Math.random().toString(36).substr(2, 9);
        const entry = { ...newEntry, id } as QuoteHistoryEntry;
        setHistory(prev => [entry, ...prev]);
      }
      setSavedJobs(prev => prev.filter(j => j.id !== job.id));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      if (user && isAuthorized) handleFirestoreError(error, OperationType.CREATE, 'company_data/dpm/quotes');
      else console.error("Local save error", error);
    } finally {
      setIsSaving(false);
    }
  };

  const saveToHistory = async (status: QuoteStatus = 'PENDIENTE') => {
    if (!quoteJobs.length) return;
    setIsSaving(true);
    const total = quoteJobs.reduce((s, j) => s + j.finalPrice, 0);
    const date = new Date().toISOString();
    const newEntry: Omit<QuoteHistoryEntry, 'id'> = {
      customerName: customerInfo.name || "CLIENTE GENERAL",
      customerPhone: customerInfo.phone || "",
      customerEmail: customerInfo.email || "",
      customerAddress: customerInfo.address || "",
      date: date,
      items: [...quoteJobs],
      total: total,
      status: status,
      isDraft: false
    };

    try {
      if (user && isAuthorized) {
        const path = 'company_data/dpm/quotes';
        const docRef = await addDoc(collection(db, path), sanitize(newEntry));
        if (status === 'PAGADA') {
          await convertToOrder({ ...newEntry, id: docRef.id } as QuoteHistoryEntry);
        }
      } else {
        const id = Math.random().toString(36).substr(2, 9);
        const entry = { ...newEntry, id } as QuoteHistoryEntry;
        setHistory(prev => [entry, ...prev]);
        if (status === 'PAGADA') {
          setTimeout(() => convertToOrder(entry), 0);
        }
      }
      
      if (customerInfo.name) {
        const customerData: Omit<Customer, 'id'> = {
          name: customerInfo.name,
          phone: customerInfo.phone,
          taxId: customerInfo.taxId,
          email: customerInfo.email,
          address: customerInfo.address,
          createdAt: new Date().toISOString(),
          quotesCount: 1
        };

        if (user && isAuthorized) {
          const path = 'company_data/dpm/customers';
          const existing = customers.find(c => c.name.toLowerCase() === customerInfo.name.toLowerCase());
          if (existing) {
            await updateDoc(doc(db, path, existing.id), { quotesCount: existing.quotesCount + 1 });
          } else {
            await addDoc(collection(db, path), customerData);
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
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      if (user && isAuthorized) handleFirestoreError(error, OperationType.CREATE, 'company_data/dpm/quotes');
      else console.error("Local save error", error);
    } finally {
      setIsSaving(false);
    }
  };

  const login = async () => {
    setLoginError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Login error detail:", error);
      const errorCode = error.code || "";
      const errorMessage = error.message || "";
      const isUnauthorizedDomain = 
        errorCode === 'auth/unauthorized-domain' || 
        errorMessage.toLowerCase().includes('unauthorized-domain') ||
        errorMessage.toLowerCase().includes('unauthorized domain');

      if (errorCode === 'auth/popup-blocked') {
        setLoginError("El navegador bloqueó la ventana emergente. Por favor, permite las ventanas emergentes.");
      } else if (isUnauthorizedDomain) {
        const domain = window.location.hostname;
        setLoginError(
          `DOMINIO NO AUTORIZADO: Para solucionar esto, ve a tu Consola de Firebase > Authentication > Settings > Authorized Domains y agrega "${domain}". Sin esto, no podrás iniciar sesión desde este link.`
        );
      } else {
        setLoginError(`Error de Inicio (${errorCode}): ` + errorMessage);
      }
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

  const convertToOrder = async (quote: QuoteHistoryEntry) => {
    if (quote.orderId) return;
    
    const orderId = `DPM-ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder: Omit<Order, 'id'> = {
      quoteId: quote.id,
      customerName: quote.customerName,
      customerPhone: quote.customerPhone,
      customerEmail: quote.customerEmail,
      customerAddress: quote.customerAddress,
      items: quote.items,
      total: quote.total,
      status: 'NUEVA',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deliveryPhotos: quote.deliveryPhotos || []
    };

    if (user && isAuthorized) {
      const orderPath = 'company_data/dpm/orders';
      const quotePath = `company_data/dpm/quotes`;
      try {
        await setDoc(doc(db, orderPath, orderId), sanitize(newOrder));
        await updateDoc(doc(db, quotePath, quote.id), { orderId });
        setActiveSettingsTab('orders');
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, orderPath);
      }
    } else {
      const finalOrder = { ...newOrder, id: orderId };
      setOrders(prev => [finalOrder, ...prev]);
      setHistory(prev => prev.map(h => h.id === quote.id ? { ...h, orderId } : h));
      setActiveSettingsTab('orders');
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    if (user && isAuthorized) {
      const path = `company_data/dpm/orders`;
      try {
        await updateDoc(doc(db, path, orderId), { status, updatedAt: new Date().toISOString() });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    } else {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status, updatedAt: new Date().toISOString() } : o));
    }
  };

  const deleteOrder = async (id: string) => {
    if (user && isAuthorized) {
      const path = `company_data/dpm/orders`;
      try {
        await deleteDoc(doc(db, path, id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    } else {
      setOrders(prev => prev.filter(o => o.id !== id));
    }
  };

  const updateQuoteStatus = async (quoteId: string, status: QuoteStatus) => {
    if (user && isAuthorized) {
      const path = `company_data/dpm/quotes`;
      try {
        await updateDoc(doc(db, path, quoteId), { status });
        if (status === 'PAGADA') {
          // Use the latest quote data from history state
          const quote = history.find(h => h.id === quoteId);
          if (quote && !quote.orderId) {
            await convertToOrder(quote);
          } else {
            setActiveSettingsTab('orders');
          }
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    } else {
      setHistory(prev => {
        const updated = prev.map(h => h.id === quoteId ? { ...h, status } : h);
        if (status === 'PAGADA') {
          const quote = updated.find(h => h.id === quoteId);
          if (quote && !quote.orderId) {
            setTimeout(() => convertToOrder(quote), 0);
          } else {
            setActiveSettingsTab('orders');
          }
        }
        return updated;
      });
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

  const generatePdf = async (customConfig?: { 
    customer: Customer; 
    items: SavedJob[]; 
    quoteId: string; 
    isOrder: boolean; 
    isLabel?: boolean;
    date?: string;
    deliveryPhotos?: string[];
  }) => {
    const targetItems = customConfig ? customConfig.items : quoteJobs;
    const targetCustomer = customConfig ? customConfig.customer : customerInfo;
    const targetId = customConfig ? customConfig.quoteId : 'NUEVA';

    if (!targetItems.length) {
      alert("No hay ítems para generar el PDF.");
      return;
    }
    
    // Set the config so the template renders the correct data
    setPdfConfig(customConfig || { 
      customer: customerInfo as Customer, 
      items: quoteJobs, 
      quoteId: 'PROPUESTA', 
      isOrder: false,
      isLabel: false,
      date: new Date().toISOString(),
      deliveryPhotos: []
    });

    setIsGeneratingPdf(true);
    try {
      // Wait for React to update the PDFTemplate in the DOM with the new pdfConfig
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const element = document.getElementById('quote-document');
      if (!element) return;

      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const canvas = await html2canvas(element, { 
        scale: 1.5, 
        useCORS: true, 
        backgroundColor: '#ffffff',
        logging: true,
        allowTaint: true,
        scrollX: 0,
        scrollY: 0,
        windowWidth: customConfig?.isLabel ? 400 : 800,
        windowHeight: element.scrollHeight || 1123
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = customConfig?.isLabel 
        ? new jsPDF('p', 'px', [400, 400]) 
        : new jsPDF('p', 'px', 'a4');
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * pageWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;

      if (!customConfig?.isLabel) {
        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
          heightLeft -= pageHeight;
        }
      }

      const fileName = customConfig?.isLabel 
        ? `Etiqueta_${targetId}.pdf`
        : `${customConfig?.isOrder ? 'Orden' : 'Cotizacion'}_${targetCustomer.name || 'Cliente'}_${targetId}.pdf`;
        
      pdf.save(fileName);
    } catch (e: any) { 
      console.error("Error al crear PDF:", e);
      alert(`Error al crear PDF: ${e.message || "Por favor intenta de nuevo."}`); 
    } finally { 
      setIsGeneratingPdf(false); 
    }
  };
  const compressImage = (base64: string, maxWidth = 800, quality = 0.6): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
    });
  };

  const addOrderPhoto = async (orderId: string, base64: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    // Compress before saving
    const compressed = await compressImage(base64);
    const photos = [...(order.deliveryPhotos || []), compressed];
    
    if (user && isAuthorized) {
      await updateDoc(doc(db, 'company_data/dpm/orders', orderId), { deliveryPhotos: photos, updatedAt: new Date().toISOString() });
    } else {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, deliveryPhotos: photos, updatedAt: new Date().toISOString() } : o));
    }
  };

  const removeOrderPhoto = async (orderId: string, index: number) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    const photos = (order.deliveryPhotos || []).filter((_, i) => i !== index);
    if (user && isAuthorized) {
      await updateDoc(doc(db, 'company_data/dpm/orders', orderId), { deliveryPhotos: photos, updatedAt: new Date().toISOString() });
    } else {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, deliveryPhotos: photos, updatedAt: new Date().toISOString() } : o));
    }
  };

  const addQuotePhoto = async (quoteId: string, base64: string) => {
    const quote = history.find(q => q.id === quoteId);
    if (!quote) return;
    
    // Compress before saving
    const compressed = await compressImage(base64);
    const photos = [...(quote.deliveryPhotos || []), compressed];
    
    if (user && isAuthorized) {
      await updateDoc(doc(db, 'company_data/dpm/quotes', quoteId), { deliveryPhotos: photos });
    } else {
      setHistory(prev => prev.map(q => q.id === quoteId ? { ...q, deliveryPhotos: photos } : q));
    }
  };

  const removeQuotePhoto = async (quoteId: string, index: number) => {
    const quote = history.find(q => q.id === quoteId);
    if (!quote) return;
    const photos = (quote.deliveryPhotos || []).filter((_, i) => i !== index);
    if (user && isAuthorized) {
      await updateDoc(doc(db, 'company_data/dpm/quotes', quoteId), { deliveryPhotos: photos });
    } else {
      setHistory(prev => prev.map(q => q.id === quoteId ? { ...q, deliveryPhotos: photos } : q));
    }
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

  const sendWhatsAppFromHistory = (h: QuoteHistoryEntry) => {
    const total = h.total;
    const clientName = h.customerName || "Cliente";
    let message = `*COTIZACIÓN PROFESIONAL - ${brand.companyName}*\n\nHola *${clientName}*:\n\n`;
    h.items.forEach((j, i) => { 
      message += `*${i + 1}. ${j.job_description}*\n   Cant: ${j.quantity}\n   Inversión: $${Math.round(j.finalPrice).toLocaleString()}\n\n`; 
    });
    message += `*TOTAL INVERSIÓN: $${Math.round(total).toLocaleString()}*\n\n_Revisa el PDF para ver el detalle de materiales e IVA._`;
    const phone = h.customerPhone ? h.customerPhone.replace(/\D/g, '') : '';
    const url = phone 
      ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
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

  const loadQuoteToCalculator = (quote: QuoteHistoryEntry) => {
    setQuoteJobs(quote.items);
    setCustomerInfo({
      id: '',
      name: quote.customerName,
      phone: quote.customerPhone,
      taxId: '',
      address: '',
      email: ''
    });
    setActiveView('calculator');
  };

  const loadCustomerToCalculator = (customer: Customer) => {
    setCustomerInfo({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      taxId: customer.taxId || '',
      address: customer.address || '',
      email: customer.email || ''
    });
    setActiveView('calculator');
  };

  const resetAllData = async () => {
    if (!isAdmin) return;
    const path = 'company_data/dpm/settings/current';
    try {
      await setDoc(doc(db, path), {
        brand: DEFAULT_BRAND,
        params: DEFAULT_PARAMS,
        products: Object.keys(PRODUCT_PRICES_FINAL).map(name => ({
          name,
          priceFinal: PRODUCT_PRICES_FINAL[name],
          pricePublisher: PRODUCT_PRICES_PUBLISHER[name] || PRODUCT_PRICES_FINAL[name],
          designTime: PRODUCT_DESIGN_TIMES[name] || 0
        }))
      });
      window.location.reload();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const exportData = async () => {
    try {
      const data: any = {
        exportDate: new Date().toISOString(),
        brand,
        params,
        products,
        customers: [] as any[],
        quotes: [] as any[],
        orders: [] as any[],
      };

      if (user) {
        // Fetch current snapshot of data from Firestore
        const custSnap = await getDocs(query(collection(db, 'company_data', 'dpm', 'customers')));
        data.customers = custSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const quoteSnap = await getDocs(query(collection(db, 'company_data', 'dpm', 'quotes')));
        data.quotes = quoteSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const orderSnap = await getDocs(query(collection(db, 'company_data', 'dpm', 'orders')));
        data.orders = orderSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Copia_Seguridad_DPM_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export error:", error);
      alert("Error al exportar los datos. Por favor, intenta de nuevo.");
    }
  };

  const saveLogoLocal = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleLogoUpload(e);
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
          <div className={`w-24 h-24 ${brand.logo ? 'bg-white p-2' : 'brand-bg rotate-3 shadow-red-500/20'} rounded-3xl mx-auto flex items-center justify-center shadow-2xl`}>
            {brand.logo ? (
              <img src={brand.logo} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
            ) : (
              <Calculator className="w-12 h-12 text-white" />
            )}
          </div>
          <div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">Calculadora DPM</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-3">Acceso Restringido Personal</p>
          </div>
          {loginError && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-[10px] font-bold uppercase border border-red-100 animate-in fade-in slide-in-from-top-2">
              {loginError}
            </div>
          )}
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

  if (authTimeout) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden p-10 text-center space-y-6">
          <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl mx-auto flex items-center justify-center">
            <HelpCircle className="w-8 h-8 animate-bounce" />
          </div>
          <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">Verificando Conexión...</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase leading-relaxed">
            La verificación de autorización está tardando más de lo esperado. Por favor verifica que:
          </p>
          <ul className="text-left text-[9px] font-bold text-slate-600 space-y-2 list-none uppercase tracking-tighter">
            <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full brand-bg" /> Tienes conexión a internet estable.</li>
            <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full brand-bg" /> Firestore está activo en tu consola Firebase.</li>
            <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full brand-bg" /> Las reglas de seguridad están desplegadas.</li>
          </ul>
          <div className="pt-4 flex flex-col gap-3">
             {user?.email === OWNER_EMAIL && (
               <button 
                onClick={() => setIsAuthorized(true)} 
                className="w-full bg-green-500 text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all"
               >
                 Omitir Verificación (Dueño)
               </button>
             )}
             <button onClick={() => window.location.reload()} className="w-full brand-bg text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">Reintentar</button>
             <button onClick={logout} className="w-full bg-slate-100 text-slate-400 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest">Cerrar Sesión</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-slate-50 text-slate-900 flex overflow-hidden" style={{ '--primary-color': brand.primaryColor } as React.CSSProperties}>

      {/* SIDEBAR PERSISTENTE */}
      <aside className={`bg-slate-900 text-white transition-all duration-300 flex flex-col ${sidebarCollapsed ? 'w-20' : 'w-72'} h-screen z-[100] shrink-0 border-r border-slate-800`}>
        <div className="p-6 flex items-center gap-4 border-b border-slate-800/50">
          <div className={`${brand.logo ? 'bg-white p-1' : 'brand-bg p-2'} rounded-xl shadow-lg shadow-black/20 overflow-hidden flex items-center justify-center w-10 h-10 shrink-0`}>
            {brand.logo ? (
              <img src={brand.logo} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
            ) : (
              <Smartphone className="text-white w-6 h-6" />
            )}
          </div>
          {!sidebarCollapsed && (
            <div className="animate-in fade-in slide-in-from-left-2">
              <h1 className="text-sm font-black tracking-tighter uppercase leading-none">{brand.companyName}</h1>
              <p className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1 truncate max-w-[150px]">{brand.slogan}</p>
            </div>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto no-scrollbar">
          <button 
            onClick={() => setActiveView('dashboard')}
            className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all group ${activeView === 'dashboard' ? 'sidebar-item-active' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Activity className={`w-5 h-5 ${activeView === 'dashboard' ? 'text-white' : 'group-hover:text-white'}`} />
            {!sidebarCollapsed && <span className="text-[11px] font-black uppercase tracking-widest">Dashboard</span>}
          </button>

          <button 
            onClick={() => setActiveView('calculator')}
            className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all group ${activeView === 'calculator' ? 'sidebar-item-active' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Calculator className={`w-5 h-5 ${activeView === 'calculator' ? 'text-white' : 'group-hover:text-white'}`} />
            {!sidebarCollapsed && <span className="text-[11px] font-black uppercase tracking-widest">Cotizador</span>}
          </button>

          <button 
            onClick={() => setActiveView('quotes')}
            className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all group ${activeView === 'quotes' ? 'sidebar-item-active' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <FileText className={`w-5 h-5 ${activeView === 'quotes' ? 'text-white' : 'group-hover:text-white'}`} />
            {!sidebarCollapsed && <span className="text-[11px] font-black uppercase tracking-widest">Historial</span>}
          </button>

          <button 
            onClick={() => setActiveView('orders')}
            className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all group ${activeView === 'orders' ? 'sidebar-item-active' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Package className={`w-5 h-5 ${activeView === 'orders' ? 'text-white' : 'group-hover:text-white'}`} />
            {!sidebarCollapsed && <span className="text-[11px] font-black uppercase tracking-widest">Pedidos</span>}
          </button>

          <button 
            onClick={() => setActiveView('customers')}
            className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all group ${activeView === 'customers' ? 'sidebar-item-active' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Users className={`w-5 h-5 ${activeView === 'customers' ? 'text-white' : 'group-hover:text-white'}`} />
            {!sidebarCollapsed && <span className="text-[11px] font-black uppercase tracking-widest">Clientes</span>}
          </button>

          <div className="pt-4 mt-4 border-t border-slate-800/50">
            <button 
              onClick={() => setActiveView('settings')}
              className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all group ${activeView === 'settings' ? 'sidebar-item-active' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <Settings className={`w-5 h-5 ${activeView === 'settings' ? 'text-white' : 'group-hover:text-white'}`} />
              {!sidebarCollapsed && <span className="text-[11px] font-black uppercase tracking-widest">Configuración</span>}
            </button>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800/50">
          {user ? (
            <div className={`flex items-center gap-3 p-2 bg-slate-800/50 rounded-2xl ${sidebarCollapsed ? 'justify-center' : ''}`}>
              <img src={user.photoURL || ''} alt={user.displayName || ''} className="w-8 h-8 rounded-xl border border-slate-700 shadow-sm shrink-0" referrerPolicy="no-referrer" />
              {!sidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-tighter leading-none truncate">{user.displayName}</p>
                  <button onClick={logout} className="text-[8px] font-bold text-slate-500 uppercase hover:text-red-500 transition-all mt-1">Salir</button>
                </div>
              )}
            </div>
          ) : (
            <button onClick={login} className={`w-full flex items-center gap-3 p-3 bg-slate-800 rounded-2xl text-slate-400 hover:brand-bg hover:text-white transition-all ${sidebarCollapsed ? 'justify-center' : ''}`}>
              <LogIn className="w-5 h-5" />
              {!sidebarCollapsed && <span className="text-[11px] font-black uppercase tracking-widest">Entrar</span>}
            </button>
          )}
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full mt-4 flex items-center justify-center p-2 text-slate-500 hover:text-white transition-all"
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest opacity-50"><X className="w-3 h-3"/> Colapsar</div>}
          </button>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {isGeneratingPdf && (
          <div className="fixed inset-0 bg-white/95 backdrop-blur-sm z-[300] flex flex-col items-center justify-center">
            <Loader2 className="w-16 h-16 brand-text animate-spin mb-6" />
            <h2 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900">Preparando Cotización...</h2>
          </div>
        )}

        {/* TOP BAR */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shrink-0 z-50">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-black italic uppercase tracking-tighter flex items-center gap-3">
              {activeView === 'dashboard' && <><Activity className="brand-text w-5 h-5" /> Dashboard General</>}
              {activeView === 'calculator' && <><Calculator className="brand-text w-5 h-5" /> Cotizador Maestro</>}
              {activeView === 'quotes' && <><FileText className="brand-text w-5 h-5" /> Historial de Cotizaciones</>}
              {activeView === 'orders' && <><Package className="brand-text w-5 h-5" /> Seguimiento de Pedidos</>}
              {activeView === 'customers' && <><Users className="brand-text w-5 h-5" /> Base de Clientes</>}
              {activeView === 'settings' && <><Settings className="brand-text w-5 h-5" /> Configuración del Sistema</>}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-slate-100 px-4 py-2 rounded-xl flex items-center gap-3">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Estado Sistema:</span>
              <span className="flex items-center gap-1.5 text-[8px] font-black text-green-600 uppercase">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Online
              </span>
            </div>
            <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="p-2 text-slate-400 hover:text-red-500 transition-all" title="Limpiar Caché">
              <RefreshCcw className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* ÁREA DE SCROLL DE CONTENIDO */}
        <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
          <Suspense fallback={
            <div className="flex flex-col items-center justify-center h-full gap-4 animate-pulse">
              <Loader2 className="w-12 h-12 brand-text animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">Optimizando Interfaz...</p>
            </div>
          }>
            {activeView === 'dashboard' && (
              <DashboardView 
                orders={orders} 
                history={history} 
                customers={customers} 
              />
            )}

            {activeView === 'calculator' && (
              <CalculatorView 
                formData={formData}
                setFormData={setFormData}
                products={products}
                params={params}
                quote={quote}
                handleInputChange={handleInputChange}
                handleSaveJob={handleSaveJob}
                isAcrilicoJob={isAcrilicoJob}
                isAnyPendon={isAnyPendon}
                savedJobs={savedJobs}
                setSavedJobs={setSavedJobs}
                saveToHistoryFromDraft={saveToHistoryFromDraft}
                quoteJobs={quoteJobs}
                setQuoteJobs={setQuoteJobs}
                customerInfo={customerInfo}
                setCustomerInfo={setCustomerInfo}
                initialStatus={initialStatus}
                setInitialStatus={setInitialStatus}
                isSaving={isSaving}
                saveSuccess={saveSuccess}
                saveToHistory={saveToHistory}
                generatePdf={generatePdf}
                sendWhatsApp={sendWhatsApp}
                saveCustomer={saveCustomer}
                setActiveView={setActiveView}
              />
            )}

            {activeView === 'quotes' && (
              <QuotesView 
                history={history}
                historySearch={historySearch}
                setHistorySearch={setHistorySearch}
                historyFilter={historyFilter}
                setHistoryFilter={setHistoryFilter}
                updateQuoteStatus={updateQuoteStatus}
                handleDeleteQuote={handleDeleteQuote}
                sendWhatsAppFromHistory={sendWhatsAppFromHistory}
                loadQuoteToCalculator={loadQuoteToCalculator}
                generatePdf={generatePdf}
                onAddPhoto={addQuotePhoto}
                onRemovePhoto={removeQuotePhoto}
              />
            )}

            {activeView === 'orders' && (
              <OrdersView 
                orders={orders}
                updateOrderStatus={updateOrderStatus}
                deleteOrder={deleteOrder}
                isAdmin={isAdmin}
                generatePdf={(config) => generatePdf({ 
                  ...config, 
                  deliveryPhotos: orders.find(o => o.id === config?.quoteId)?.deliveryPhotos || [] 
                })}
                onAddPhoto={addOrderPhoto}
                onRemovePhoto={removeOrderPhoto}
              />
            )}

            {activeView === 'customers' && (
              <CustomersView 
                customers={customers}
                saveCustomer={saveCustomer}
                handleDeleteCustomer={handleDeleteCustomer}
                loadCustomerToCalculator={loadCustomerToCalculator}
              />
            )}

          {activeView === 'settings' && (
            <SettingsView 
              activeSettingsTab={activeSettingsTab}
              setActiveSettingsTab={setActiveSettingsTab}
              newProduct={newProduct}
              setNewProduct={setNewProduct}
              products={products}
              setProducts={setProducts}
              params={params}
              setParams={setParams}
              handleProductUpdate={handleProductUpdate}
              brand={brand}
              setBrand={setBrand}
              authorizedUsers={authorizedUsers}
              newUser={newUser}
              setNewUser={setNewUser}
              handleAddAuthorizedUser={() => handleAddAuthorizedUser(newUser.email)}
              handleDeleteAuthorizedUser={(id, email) => handleDeleteAuthorizedUser(email)}
              resetAllData={() => { localStorage.clear(); window.location.reload(); }}
              saveLogoLocal={saveLogoLocal}
              fileInputRef={fileInputRef}
              isAdmin={isAdmin}
              onSaveGlobalSettings={saveSharedSettings}
              onExportData={exportData}
            />
          )}
          </Suspense>
        </div>
      </div>
    </div>

      <Suspense fallback={null}>
        <PDFTemplate 
          brand={brand}
          customerInfo={pdfConfig?.customer || customerInfo as Customer}
          quoteJobs={pdfConfig?.items || quoteJobs}
          quoteNumber={pdfConfig?.quoteId}
          isOrder={pdfConfig?.isOrder}
          date={pdfConfig?.date}
        />
      </Suspense>
    </>
  );
};

export default App;
