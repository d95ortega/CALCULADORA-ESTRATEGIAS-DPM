
export type CustomerType = 'final' | 'publicista';
export type AcrylicType = 'luminoso' | 'sin_luz';
export type BaseType = 'estructura_acrilico' | 'estructura_lona' | 'mdf' | 'sin_estructura';

export interface AcrylicMaterial {
  id: string;
  name: string;
  cost_per_cm2: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  createdAt: string;
  quotesCount: number;
}

export interface Product {
  name: string;
  priceFinal: number;
  pricePublisher: number;
  designTime: number;
}

export interface FormData {
  customer_type: CustomerType;
  job_description: string;
  width: number;
  height: number;
  quantity: number;
  production_time: number;
  cutting_hours: number;
  laminate_speed: string;
  installation: number;
  urgency_percentage: number;
  transport: number;
  include_design: boolean;
  include_printing?: boolean;
  ojalete_quantity: number;
  include_tubes: boolean;
  include_sticks: boolean;
  sticks_quantity: number;
  job_image?: string;
  // Campos DPM Avanzados
  acrylic_type?: AcrylicType;
  base_type?: BaseType;
  laser_minutes?: number;
  assembly_hours?: number;
  installation_hours?: number;
  manual_meters?: number;
  use_manual_meters?: boolean;
  selected_acrylic_material_id?: string;
  manual_structure_cost?: number;
  // Nuevas medidas detalladas DPM
  calado_w?: number;
  calado_h?: number;
  letras3d_w?: number;
  letras3d_h?: number;
  letras3d_grosor?: number;
  vinilo_w?: number;
  vinilo_h?: number;
  lona_w?: number;
  lona_h?: number;
  led_cm?: number;
  fondo_w?: number;
  fondo_h?: number;
  include_power_supply?: boolean;
}

export interface QuoteResult {
  areaCm2: number;
  totalAreaCm2: number;
  totalAreaM2: number;
  rollWidth: number;
  rollAreaCm2: number;
  wasteAreaCm2: number;
  materialCost: number;
  wasteCostFromRoll: number;
  productionCost: number;
  designCost: number;
  cuttingCost: number;
  laminateTotal: number;
  taponCost: number;
  tubeCost: number;
  ojalesCost: number;
  sticksCost: number;
  subtotalBeforeWaste: number;
  wasteCost: number;
  totalBeforeMargin: number;
  urgencyCost: number;
  totalCostsWithUrgency: number;
  costWithMargin: number;
  ivaAmount: number;
  finalPrice: number;
  installation: number;
  transport: number;
  adjustedWidth: number;
  adjustedHeight: number;
  // Desglose DPM
  laserCost?: number;
  assemblyCost?: number;
  structureCost?: number;
  detailedCosts?: {
    calado?: number;
    letras3d?: number;
    vinilo?: number;
    lona?: number;
    led?: number;
    fondo?: number;
    fuente?: number;
  };
}

export interface SavedJob extends FormData {
  id: string;
  finalPrice: number;
  createdAt: string;
  quoteResult: QuoteResult;
}

export interface FormalQuote {
  customerName: string;
  customerPhone: string;
  date: string;
  items: SavedJob[];
}

export type OrderStatus = 'NUEVA' | 'CORTE_LASER' | 'PLOTTER_CORTE' | 'BODEGA_FABRICA' | 'BODEGA_PUNTO_VENTA' | 'ENTREGADO' | 'DESCARGADOS';

export interface Order {
  id: string;
  quoteId: string;
  customerName: string;
  customerPhone: string;
  items: SavedJob[];
  total: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface QuoteHistoryEntry extends FormalQuote {
  id: string;
  total: number;
  orderId?: string;
}
