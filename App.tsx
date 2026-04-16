
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
  Archive, FileCheck, FileEdit, Sliders
} from 'lucide-react';
// import { jsPDF } from 'jspdf';
// import html2canvas from 'html2canvas';
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

// Lazy Views
const DashboardView = lazy(() => import('./components/views/DashboardView'));
const SettingsView = lazy(() => import('./components/views/SettingsView'));
const CalculatorView = lazy(() => import('./components/views/CalculatorView'));
const QuotesView = lazy(() => import('./components/views/QuotesView'));
const OrdersView = lazy(() => import('./components/views/OrdersView'));
const CustomersView = lazy(() => import('./components/views/CustomersView'));

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
  const [customerInfo, setCustomerInfo] = useState({ id: '', name: '', phone: '', taxId: '', address: '', email: '' });
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('dpm_customers');
    return saved ? JSON.parse(saved) : [];
  });
  const [history, setHistory] = useState<QuoteHistoryEntry[]>(() => {
    const saved = localStorage.getItem('dpm_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('dpm_orders');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeSettingsTab, setActiveSettingsTab] = useState<'products' | 'costs' | 'params' | 'brand' | 'users'>('products');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [initialStatus, setInitialStatus] = useState<QuoteStatus>('PENDIENTE');
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authorizedUsers, setAuthorizedUsers] = useState<any[]>([]);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [historySearch, setHistorySearch] = useState('');
  const [historyFilter, setHistoryFilter] = useState<QuoteStatus | 'TODAS'>('TODAS');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeView, setActiveView] = useState<'dashboard' | 'calculator' | 'quotes' | 'orders' | 'customers' | 'settings'>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const OWNER_EMAIL = 'estrategiaslaunion@gmail.com';

  // Effect to force-push factory defaults to Firestore if version is new and user is admin
  useEffect(() => {
    if (isAuthReady && user && isAuthorized && isAdmin) {
      const versionPushed = localStorage.getItem('dpm_version_pushed_to_cloud');
      if (versionPushed !== STORAGE_VERSION) {
        const resetSettings = async () => {
          const path = 'company_data/dpm/settings/current';
          try {
            // Force use the constants instead of current state which might be stale from Firestore sync
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
            localStorage.setItem('dpm_version_pushed_to_cloud', STORAGE_VERSION);
            console.log("Factory defaults pushed to cloud successfully");
            window.location.reload(); // Reload to ensure all states are fresh
          } catch (error) {
            console.error("Error pushing factory defaults:", error);
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
        // Fallback for owner if Firestore is blocked or rules are not deployed
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

  // Sync Shared Orders
  useEffect(() => {
    if (!user || !isAuthorized) return;
    const path = 'company_data/dpm/orders';
    const q = query(collection(db, path));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      setOrders(data.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
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
    localStorage.setItem('dpm_orders', JSON.stringify(orders));
    document.documentElement.style.setProperty('--primary-color', brand.primaryColor);
  }, [params, products, brand, customers, history, orders]);

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

  const saveCustomer = async (data: Omit<Customer, 'id'>) => {
    if (user && isAuthorized) {
      const path = 'company_data/dpm/customers';
      try {
        const existing = customers.find(c => c.name.toLowerCase() === data.name.toLowerCase());
        if (existing) {
          await updateDoc(doc(db, path, existing.id), { ...data, quotesCount: existing.quotesCount });
        } else {
          await addDoc(collection(db, path), data);
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
      date: date,
      items: [job],
      total: total,
      status: 'PENDIENTE',
      isDraft: false
    };

    try {
      if (user && isAuthorized) {
        const path = 'company_data/dpm/quotes';
        await addDoc(collection(db, path), newEntry);
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
      date: date,
      items: [...quoteJobs],
      total: total,
      status: status,
      isDraft: false
    };

    try {
      if (user && isAuthorized) {
        const path = 'company_data/dpm/quotes';
        const docRef = await addDoc(collection(db, path), newEntry);
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
      console.error("Login error", error);
      if (error.code === 'auth/popup-blocked') {
        setLoginError("El navegador bloqueó la ventana emergente. Por favor, permite las ventanas emergentes.");
      } else {
        setLoginError("Error al iniciar sesión: " + (error.message || "Inténtalo de nuevo"));
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
      items: quote.items,
      total: quote.total,
      status: 'NUEVA',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (user && isAuthorized) {
      const orderPath = 'company_data/dpm/orders';
      const quotePath = `company_data/dpm/quotes`;
      try {
        await setDoc(doc(db, orderPath, orderId), newOrder);
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

  const generatePdf = async () => {
    if (!quoteJobs.length) return;
    setIsGeneratingPdf(true);
    try {
      const element = document.getElementById('quote-document');
      if (!element) throw new Error();
      
      // Dynamic import for performance
      const [html2canvasModule, jsPDFModule] = await Promise.all([
        import('html2canvas'),
        import('jspdf')
      ]);
      
      const html2canvas = html2canvasModule.default;
      const jsPDF = jsPDFModule.jsPDF;

      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'px', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${brand.companyName}_Cotizacion.pdf`);
    } catch (e) { 
      console.error("Error al crear PDF:", e);
      alert("Error al crear PDF. Por favor intenta de nuevo."); 
    } finally { 
      setIsGeneratingPdf(false); 
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

  return (
    <>
      <div className="min-h-screen bg-slate-50 text-slate-900 flex overflow-hidden" style={{ '--primary-color': brand.primaryColor } as React.CSSProperties}>

      {/* SIDEBAR PERSISTENTE */}
      <aside className={`bg-slate-900 text-white transition-all duration-300 flex flex-col ${sidebarCollapsed ? 'w-20' : 'w-72'} h-screen z-[100] shrink-0 border-r border-slate-800`}>
        <div className="p-6 flex items-center gap-4 border-b border-slate-800/50">
          <div className="brand-bg p-2 rounded-xl shadow-lg shadow-red-500/20 overflow-hidden flex items-center justify-center w-10 h-10 shrink-0">
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
              />
            )}

            {activeView === 'orders' && (
              <OrdersView 
                orders={orders}
                updateOrderStatus={updateOrderStatus}
                deleteOrder={deleteOrder}
                isAdmin={isAdmin}
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
                handleAddAuthorizedUser={handleAddAuthorizedUser}
                handleDeleteAuthorizedUser={handleDeleteAuthorizedUser}
                resetAllData={resetAllData}
                saveLogoLocal={saveLogoLocal}
                fileInputRef={fileInputRef}
              />
            )}
          </Suspense>
        </div>
      </motion.div>

          {activeView === 'settings' && (
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

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase">Costo Fijo Diseño ($)</label>
                          <HelpCircle className="w-3 h-3 text-slate-300 cursor-help" title="Tarifa única por el trabajo de diseño gráfico y preparación de archivos." />
                        </div>
                        <span className="text-[8px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-bold uppercase">Servicio</span>
                      </div>
                      <input type="number" value={params.design_fixed_cost} onChange={e => setParams({...params, design_fixed_cost: parseFloat(e.target.value)||0})} className="w-full p-4 bg-slate-50 rounded-2xl text-xs font-bold border-none ring-1 ring-slate-200" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase">Mínimo Operativo ($)</label>
                          <HelpCircle className="w-3 h-3 text-slate-300 cursor-help" title="Monto mínimo que se cobra por cualquier trabajo para cubrir gastos base." />
                        </div>
                        <span className="text-[8px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-bold uppercase">Base</span>
                      </div>
                      <input type="number" value={params.min_operative} onChange={e => setParams({...params, min_operative: parseFloat(e.target.value)||0})} className="w-full p-4 bg-slate-50 rounded-2xl text-xs font-bold border-none ring-1 ring-slate-200" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase">Factor Desperdicio (0.20)</label>
                          <HelpCircle className="w-3 h-3 text-slate-300 cursor-help" title="Porcentaje de material adicional contemplado para cubrir errores o recortes." />
                        </div>
                        <span className="text-[8px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-bold uppercase">Seguridad</span>
                      </div>
                      <input type="number" step="0.01" value={params.waste} onChange={e => setParams({...params, waste: parseFloat(e.target.value)||0})} className="w-full p-4 bg-slate-50 rounded-2xl text-xs font-bold border-none ring-1 ring-slate-200" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase">Costo Impresión por cm² ($)</label>
                          <HelpCircle className="w-3 h-3 text-slate-300 cursor-help" title="Costo base de impresión por centímetro cuadrado para productos no acrílicos." />
                        </div>
                        <span className="text-[8px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-bold uppercase">Material</span>
                      </div>
                      <input type="number" step="0.01" value={params.impresion_cost_per_cm2 || 0} onChange={e => setParams({...params, impresion_cost_per_cm2: parseFloat(e.target.value)||0})} className="w-full p-4 bg-slate-50 rounded-2xl text-xs font-bold border-none ring-1 ring-slate-200" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-widest border-b pb-2 flex items-center gap-2">
                      <PlusCircle className="w-4 h-4" /> Factores Adicionales Personalizados
                    </h4>
                    <div className="bg-slate-50 p-6 rounded-3xl space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <input type="text" id="new-factor-name" placeholder="Nombre (ej: Seguro)" className="bg-white p-3 rounded-xl text-xs font-bold ring-1 ring-slate-200 outline-none" />
                        <input type="number" id="new-factor-value" placeholder="Valor (0.05 o 5000)" className="bg-white p-3 rounded-xl text-xs font-bold ring-1 ring-slate-200 outline-none" />
                        <select id="new-factor-type" className="bg-white p-3 rounded-xl text-xs font-bold ring-1 ring-slate-200 outline-none">
                          <option value="multiplier">Multiplicador (%)</option>
                          <option value="fixed">Costo Fijo ($)</option>
                        </select>
                      </div>
                      <button onClick={() => {
                        const name = (document.getElementById('new-factor-name') as HTMLInputElement).value;
                        const value = parseFloat((document.getElementById('new-factor-value') as HTMLInputElement).value);
                        const type = (document.getElementById('new-factor-type') as HTMLSelectElement).value as 'multiplier' | 'fixed';
                        if (name && !isNaN(value)) {
                          setParams({
                            ...params,
                            custom_factors: [...(params.custom_factors || []), { id: Math.random().toString(36).substr(2, 9), name, value, type }]
                          });
                          (document.getElementById('new-factor-name') as HTMLInputElement).value = '';
                          (document.getElementById('new-factor-value') as HTMLInputElement).value = '';
                        }
                      }} className="w-full brand-bg text-white py-3 rounded-xl text-[10px] font-black uppercase">Añadir Factor</button>
                    </div>
                    <div className="space-y-2">
                      {(params.custom_factors || []).map((f: any, idx: number) => (
                        <div key={f.id} className="bg-white p-4 rounded-2xl border flex justify-between items-center group">
                          <div>
                            <p className="text-xs font-black uppercase tracking-tight">{f.name}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                              {f.type === 'multiplier' ? `+${(f.value * 100).toFixed(1)}% al total` : `+$${f.value.toLocaleString()} fijo`}
                            </p>
                          </div>
                          <button onClick={() => {
                            const updated = params.custom_factors.filter((_: any, i: number) => i !== idx);
                            setParams({...params, custom_factors: updated});
                          }} className="text-slate-300 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-900 p-6 rounded-3xl space-y-4">
                    <h4 className="text-[11px] font-black uppercase brand-text flex items-center gap-2">
                      <PieChart className="w-4 h-4" /> Desglose de Costos (1 Unidad)
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-400 uppercase font-bold">Material Base:</span>
                        <span className="text-white font-black">${Math.round(quote.materialCost / formData.quantity).toLocaleString()}</span>
                      </div>
                      {quote.structureCost > 0 && (
                        <div className="flex justify-between text-[10px]">
                          <span className="text-slate-400 uppercase font-bold">Estructura:</span>
                          <span className="text-white font-black">${Math.round(quote.structureCost / formData.quantity).toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-400 uppercase font-bold">Mano de Obra:</span>
                        <span className="text-white font-black">${Math.round(quote.productionCost / formData.quantity).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-400 uppercase font-bold">Desperdicio ({Math.round((params.waste || 0.1) * 100)}%):</span>
                        <span className="text-white font-black">${Math.round(quote.wasteCost / formData.quantity).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-[10px] border-t border-slate-800 pt-1">
                        <span className="text-slate-400 uppercase font-bold">Subtotal Costo:</span>
                        <span className="text-white font-black">${Math.round(quote.totalBeforeMargin / formData.quantity).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-400 uppercase font-bold">Utilidad ({Math.round((formData.customer_type === 'final' ? params.profit_margin_final : params.profit_margin_publisher) * 100)}%):</span>
                        <span className="text-red-400 font-black">${Math.round((quote.costWithMargin - quote.totalBeforeMargin) / formData.quantity).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-400 uppercase font-bold">IVA ({Math.round(params.iva * 100)}%):</span>
                        <span className="text-slate-300 font-black">${Math.round(quote.ivaAmount / formData.quantity).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
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
                  
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Registrar Nuevo Cliente:</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input 
                        type="text" 
                        placeholder="Nombre Completo" 
                        id="new_cust_name"
                        className="bg-white p-3 rounded-xl text-[11px] font-bold ring-1 ring-slate-200 outline-none focus:ring-red-200"
                      />
                      <input 
                        type="text" 
                        placeholder="Teléfono" 
                        id="new_cust_phone"
                        className="bg-white p-3 rounded-xl text-[11px] font-bold ring-1 ring-slate-200 outline-none focus:ring-red-200"
                      />
                      <input 
                        type="text" 
                        placeholder="Cédula o NIT" 
                        id="new_cust_taxid"
                        className="bg-white p-3 rounded-xl text-[11px] font-bold ring-1 ring-slate-200 outline-none focus:ring-red-200"
                      />
                    </div>
                    <button 
                      onClick={() => {
                        const name = (document.getElementById('new_cust_name') as HTMLInputElement).value;
                        const phone = (document.getElementById('new_cust_phone') as HTMLInputElement).value;
                        const taxId = (document.getElementById('new_cust_taxid') as HTMLInputElement).value;
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
                          (document.getElementById('new_cust_name') as HTMLInputElement).value = '';
                          (document.getElementById('new_cust_phone') as HTMLInputElement).value = '';
                          (document.getElementById('new_cust_taxid') as HTMLInputElement).value = '';
                        }
                      }}
                      className="w-full brand-bg text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-500/10 active:scale-95 transition-all"
                    >
                      Registrar Cliente
                    </button>
                  </div>

                  <div className="space-y-2">
                    {customers.map(c => (
                      <div key={c.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-between items-center group hover:border-red-200 transition-all">
                        <div>
                          <p className="text-xs font-black uppercase tracking-tight">{c.name}</p>
                          <div className="flex gap-3 mt-1">
                            <p className="text-[10px] text-slate-500 font-bold flex items-center gap-1"><Phone className="w-2 h-2"/> {c.phone}</p>
                            {c.taxId && <p className="text-[10px] text-slate-500 font-bold flex items-center gap-1"><Fingerprint className="w-2 h-2"/> {c.taxId}</p>}
                            <p className="text-[10px] text-slate-500 font-bold flex items-center gap-1"><FileText className="w-2 h-2"/> {c.quotesCount} Cotizaciones</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => {
                            setCustomerInfo({ id: c.id, name: c.name, phone: c.phone, taxId: c.taxId || '', address: c.address || '', email: c.email || '' });
                            setActiveView('calculator');
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
                <div className="space-y-6">
                  {/* SUMMARY CARDS (Wix Style) */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Enviada(s)</span>
                      <span className="text-2xl font-black text-amber-500 italic tracking-tighter">{history.filter(h => h.status === 'ENVIADA').length}</span>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Aceptada(s)</span>
                      <span className="text-2xl font-black text-blue-500 italic tracking-tighter">{history.filter(h => h.status === 'APROBADA').length}</span>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pagada(s)</span>
                      <span className="text-2xl font-black text-green-500 italic tracking-tighter">{history.filter(h => h.status === 'PAGADA').length}</span>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pendiente(s)</span>
                      <span className="text-2xl font-black text-slate-400 italic tracking-tighter">{history.filter(h => h.status === 'PENDIENTE' || !h.status).length}</span>
                    </div>
                  </div>

                  {/* FILTERS & SEARCH */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
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

                  {/* TABLE (Wix Style) */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
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
                                                  h.items.some(i => i.job_description.toLowerCase().includes(historySearch.toLowerCase()));
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
                                    <span className="text-[9px] text-slate-400 font-bold uppercase truncate max-w-[200px]">{h.items.map(i => i.job_description).join(', ')}</span>
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
                                  <div className="flex items-center justify-end gap-2">
                                    <button 
                                      onClick={() => {
                                        setQuoteJobs(h.items);
                                        setCustomerInfo({ id: '', name: h.customerName, phone: h.customerPhone, taxId: '', address: '', email: '' });
                                        setActiveView('dashboard');
                                      }}
                                      title="Cargar Cotización"
                                      className="p-2 bg-white rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all shadow-sm border border-slate-100"
                                    >
                                      <RefreshCcw className="w-3.5 h-3.5" />
                                    </button>
                                    <div className="relative group/actions">
                                      <button className="p-2 bg-white rounded-lg text-slate-400 hover:text-slate-600 transition-all shadow-sm border border-slate-100">
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
                                        {(['PENDIENTE', 'ENVIADA', 'APROBADA', 'PAGADA'] as QuoteStatus[]).map(status => (
                                          <button
                                            key={status}
                                            onClick={() => updateQuoteStatus(h.id, status)}
                                            className="w-full text-left px-3 py-2 rounded-lg text-[9px] font-black uppercase hover:bg-slate-50 transition-all flex items-center gap-2"
                                          >
                                            <div className={`w-2 h-2 rounded-full ${
                                              status === 'PAGADA' ? 'bg-green-500' : 
                                              status === 'APROBADA' ? 'bg-blue-500' :
                                              status === 'ENVIADA' ? 'bg-amber-500' :
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
              )}
              {activeSettingsTab === 'orders' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <h4 className="text-sm font-black uppercase italic tracking-tighter flex items-center gap-2">
                      <Package className="w-4 h-4 brand-text" /> Seguimiento de Pedidos Activos
                    </h4>
                    <span className="bg-slate-100 px-3 py-1 rounded-full text-[10px] font-bold text-slate-500 uppercase">{orders.length} En Producción</span>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50/50 border-b border-slate-100">
                            <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID Pedido</th>
                            <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</th>
                            <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actualizado</th>
                            <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Estado</th>
                            <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {orders.map(order => (
                            <tr key={order.id} className="hover:bg-slate-50/50 transition-all group">
                              <td className="p-4">
                                <span className="text-[11px] font-black text-blue-600 tracking-tighter">{order.id}</span>
                              </td>
                              <td className="p-4">
                                <div className="flex flex-col">
                                  <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight">{order.customerName}</span>
                                  <span className="text-[9px] text-slate-400 font-bold uppercase truncate max-w-[200px]">{order.items.map(i => i.job_description).join(', ')}</span>
                                </div>
                              </td>
                              <td className="p-4">
                                <span className="text-[10px] text-slate-500 font-bold uppercase">{new Date(order.updatedAt).toLocaleString()}</span>
                              </td>
                              <td className="p-4 text-center">
                                <div className="relative group/status inline-block">
                                  <button className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${
                                    order.status === 'ENTREGADO' ? 'bg-green-100 text-green-600' : 
                                    order.status === 'DESCARGADOS' ? 'bg-slate-100 text-slate-600' :
                                    'bg-blue-100 text-blue-600'
                                  }`}>
                                    {order.status.replace('_', ' ')}
                                  </button>
                                  <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 bg-white rounded-xl shadow-2xl border border-slate-100 p-2 hidden group-hover/status:block z-50 min-w-[150px]">
                                    {(['NUEVA', 'CORTE_LASER', 'PLOTTER_CORTE', 'BODEGA_FABRICA', 'BODEGA_PUNTO_VENTA', 'DESCARGADOS', 'ENTREGADO'] as OrderStatus[]).map(status => (
                                      <button
                                        key={status}
                                        onClick={() => updateOrderStatus(order.id, status)}
                                        className="w-full text-left px-3 py-2 rounded-lg text-[9px] font-black uppercase hover:bg-slate-50 transition-all flex items-center gap-2"
                                      >
                                        <div className={`w-2 h-2 rounded-full ${
                                          status === 'ENTREGADO' ? 'bg-green-500' : 
                                          status === 'NUEVA' ? 'bg-blue-500' :
                                          'bg-amber-500'
                                        }`} />
                                        {status.replace('_', ' ')}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center justify-end gap-2">
                                  <button 
                                    onClick={() => deleteOrder(order.id)}
                                    className="p-2 bg-white rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all shadow-sm border border-slate-100"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {orders.length === 0 && (
                      <div className="text-center py-20 opacity-30">
                        <Package className="w-12 h-12 mx-auto mb-3" />
                        <p className="text-[10px] font-black uppercase tracking-widest italic">No hay pedidos activos</p>
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
                  
                  <div className="pt-6 border-t border-slate-100">
                    <button 
                      onClick={() => {
                        if (window.confirm("¿Estás seguro de restablecer todos los precios y parámetros a los valores de fábrica? Se borrarán los cambios locales.")) {
                          localStorage.removeItem('dpm_params');
                          localStorage.removeItem('dpm_products');
                          window.location.reload();
                        }
                      }}
                      className="w-full bg-red-50 text-red-600 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                    >
                      <RefreshCcw className="w-4 h-4" /> Restablecer Valores de Fábrica
                    </button>
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
                <button onClick={() => setActiveView('dashboard')} className="brand-bg text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-red-500/10 active:scale-95 transition-all">Cerrar</button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeView === 'quotes' && (
        <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4">
          {/* SUMMARY CARDS (Wix Style) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Enviada(s)</span>
              <span className="text-2xl font-black text-amber-500 italic tracking-tighter">{history.filter(h => h.status === 'ENVIADA').length}</span>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Aceptada(s)</span>
              <span className="text-2xl font-black text-blue-500 italic tracking-tighter">{history.filter(h => h.status === 'APROBADA').length}</span>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pagada(s)</span>
              <span className="text-2xl font-black text-green-500 italic tracking-tighter">{history.filter(h => h.status === 'PAGADA').length}</span>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pendiente(s)</span>
              <span className="text-2xl font-black text-slate-400 italic tracking-tighter">{history.filter(h => h.status === 'PENDIENTE' || !h.status).length}</span>
            </div>
          </div>

          {/* FILTERS & SEARCH */}
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

          {/* TABLE (Wix Style) */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
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
                                          h.items.some(i => i.job_description.toLowerCase().includes(historySearch.toLowerCase()));
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
                            <span className="text-[9px] text-slate-400 font-bold uppercase truncate max-w-[200px]">{h.items.map(i => i.job_description).join(', ')}</span>
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
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => {
                                setQuoteJobs(h.items);
                                setCustomerInfo({ id: '', name: h.customerName, phone: h.customerPhone, taxId: '', address: '', email: '' });
                                setActiveView('calculator');
                              }}
                              title="Cargar Cotización"
                              className="p-2 bg-white rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all shadow-sm border border-slate-100"
                            >
                              <RefreshCcw className="w-3.5 h-3.5" />
                            </button>
                            <div className="relative group/actions">
                              <button className="p-2 bg-white rounded-lg text-slate-400 hover:text-slate-600 transition-all shadow-sm border border-slate-100">
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
                                {(['PENDIENTE', 'ENVIADA', 'APROBADA', 'PAGADA'] as QuoteStatus[]).map(status => (
                                  <button
                                    key={status}
                                    onClick={() => updateQuoteStatus(h.id, status)}
                                    className="w-full text-left px-3 py-2 rounded-lg text-[9px] font-black uppercase hover:bg-slate-50 transition-all flex items-center gap-2"
                                  >
                                    <div className={`w-2 h-2 rounded-full ${
                                      status === 'PAGADA' ? 'bg-green-500' : 
                                      status === 'APROBADA' ? 'bg-blue-500' :
                                      status === 'ENVIADA' ? 'bg-amber-500' :
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
      )}

      {activeView === 'orders' && (
        <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4">
          <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-sm mb-8">
            <h4 className="text-sm font-black uppercase italic tracking-tighter flex items-center gap-2">
              <Package className="w-4 h-4 brand-text" /> Seguimiento de Pedidos Activos
            </h4>
            <span className="bg-slate-100 px-3 py-1 rounded-full text-[10px] font-bold text-slate-500 uppercase">{orders.length} En Producción</span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID Pedido</th>
                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</th>
                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actualizado</th>
                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Estado</th>
                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {orders.map(order => (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition-all group">
                      <td className="p-4">
                        <span className="text-[11px] font-black text-blue-600 tracking-tighter">{order.id}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight">{order.customerName}</span>
                          <span className="text-[9px] text-slate-400 font-bold uppercase truncate max-w-[200px]">{order.items.map(i => i.job_description).join(', ')}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-[10px] text-slate-500 font-bold uppercase">{new Date(order.updatedAt).toLocaleString()}</span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="relative group/status inline-block">
                          <button className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${
                            order.status === 'ENTREGADO' ? 'bg-green-100 text-green-600' : 
                            order.status === 'DESCARGADOS' ? 'bg-slate-100 text-slate-600' :
                            'bg-blue-100 text-blue-600'
                          }`}>
                            {order.status.replace('_', ' ')}
                          </button>
                          <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 bg-white rounded-xl shadow-2xl border border-slate-100 p-2 hidden group-hover/status:block z-50 min-w-[150px]">
                            {(['NUEVA', 'CORTE_LASER', 'PLOTTER_CORTE', 'BODEGA_FABRICA', 'BODEGA_PUNTO_VENTA', 'DESCARGADOS', 'ENTREGADO'] as OrderStatus[]).map(status => (
                              <button
                                key={status}
                                onClick={() => updateOrderStatus(order.id, status)}
                                className="w-full text-left px-3 py-2 rounded-lg text-[9px] font-black uppercase hover:bg-slate-50 transition-all flex items-center gap-2"
                              >
                                <div className={`w-2 h-2 rounded-full ${
                                  status === 'ENTREGADO' ? 'bg-green-500' : 
                                  status === 'NUEVA' ? 'bg-blue-500' :
                                  'bg-amber-500'
                                }`} />
                                {status.replace('_', ' ')}
                              </button>
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => deleteOrder(order.id)}
                            className="p-2 bg-white rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all shadow-sm border border-slate-100"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {orders.length === 0 && (
              <div className="text-center py-20 opacity-30">
                <Package className="w-12 h-12 mx-auto mb-3" />
                <p className="text-[10px] font-black uppercase tracking-widest italic">No hay pedidos activos</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeView === 'customers' && (
        <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4">
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
                      <button onClick={() => {
                        setCustomerInfo({ id: c.id, name: c.name, phone: c.phone, taxId: c.taxId || '', address: c.address || '', email: c.email || '' });
                        setActiveView('calculator');
                      }} className="p-2 bg-slate-50 rounded-lg text-slate-400 hover:text-blue-500 transition-all shadow-sm"><UserCheck className="w-4 h-4"/></button>
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
      )}

      {activeView === 'calculator' && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8"
        >
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

        {/* ACRILICO DPM */}
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
                    <FontIcon className="w-5 h-5 brand-text" />
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
                   <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] flex items-center gap-2"><ShieldCheck className="w-3 h-3"/> IVA ({params.iva*100}%)</p>
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
                    <span className="flex items-center gap-2 text-[10px]"><CheckCircle2 className="w-4 h-4 brand-text"/> IVA 19%</span>
                    <span className="flex items-center gap-2 text-[10px]"><CheckCircle2 className="w-4 h-4 brand-text"/> Margen DPM</span>
                  </div>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-[400px] h-[400px] brand-bg/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-[120px]"></div>
              <div className="absolute bottom-0 left-0 w-[300px] h-[300px] blue-600/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-[100px]"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/5 to-transparent opacity-20 pointer-events-none"></div>
            </motion.section>
          )}

          <section className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-100 flex flex-col overflow-hidden h-full">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100">
                  <History className="brand-text w-5 h-5" />
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
                          {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
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
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />}
                  {saveSuccess ? "¡Guardado con éxito!" : "Solo Guardar"}
                </button>
                
                <button 
                  onClick={() => { saveToHistory(initialStatus); generatePdf(); }} 
                  disabled={quoteJobs.length === 0 || isSaving} 
                  className="w-full brand-bg text-white font-black py-4 rounded-2xl text-[10px] tracking-[0.2em] uppercase flex items-center justify-center gap-3 active:scale-95 hover:scale-[1.02] transition-all shadow-2xl shadow-red-500/30 disabled:grayscale disabled:opacity-50 group"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 group-hover:-translate-y-1 transition-transform" />}
                  Guardar & Exportar PDF
                </button>
                
                <button 
                  onClick={() => { saveToHistory(initialStatus); sendWhatsApp(); }} 
                  disabled={quoteJobs.length === 0 || isSaving} 
                  className="w-full whatsapp-btn text-white font-black py-4 rounded-2xl text-[10px] tracking-[0.2em] uppercase flex items-center justify-center gap-3 active:scale-95 hover:scale-[1.02] transition-all shadow-2xl shadow-green-500/30 disabled:grayscale disabled:opacity-50 group"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <WhatsAppIcon className="w-4 h-4 group-hover:rotate-12 transition-transform" />}
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
    )}
    </div>
  </div>
</div>

      <Suspense fallback={null}>
        <PDFTemplate 
          brand={brand}
          customerInfo={customerInfo}
          quoteJobs={quoteJobs}
        />
      </Suspense>
    </>
  );
};

export default App;
