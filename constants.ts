
export const DEFAULT_PARAMS = {
  hourly_rate: 8500,
  cost_per_cm2: 0.75,
  acrilico_cost_per_m2: 11250, 
  impresion_cost_per_cm2: 28,
  design_fixed_cost: 15000,
  iva: 0.19,
  waste: 0.2,
  profit_margin_final: 0.35,
  profit_margin_publisher: 0.20,
  min_operative: 20000,
  tube_cost_factor: 1200,
  ojal_cost: 400,
  stick_cost: 5000,
  tapon_cost: 800,
  power_supply_cost: 80000, // Añadido costo de fuente (asumido 80.000 COP)
  roll_widths: [75, 102, 122, 152],
  // Materiales de Acrílico específicos basados en la imagen del usuario
  acrylic_materials: [
    { id: 'negro-3mm', name: 'Acrílico negro 3 mm', cost_per_cm2: 0.06 },
    { id: 'opal-3mm', name: 'Acrílico blanco opal 3 mm', cost_per_cm2: 0.04 },
    { id: 'dorado-3mm', name: 'Acrílico dorado 3 mm', cost_per_cm2: 0.08 },
    { id: 'pvc-100', name: 'PVC calibre 100 (contraletra)', cost_per_cm2: 0.22 }
  ],
  // Precios de bases por metro cuadrado
  base_prices: {
    estructura_acrilico: 48000,
    estructura_lona: 32000,
    mdf: 18000,
    sin_estructura: 0
  },
  lighting_extra: 45000 
};

export const PRODUCT_DESIGN_TIMES: Record<string, number> = {
  "BANNER IMPRESIÓN GRAN FORMATO EN LONA BANNER DE ALTA CALIDAD": 30,
  "PANAFLEX": 45,
  "IMPRESIÓN EN VINILO": 45,
  "IMPRESIÓN EN VINILO + LAMINADO": 45,
  "VINILO TRANSPARENTE INTERNO": 45,
  "VINILO MICROPERFORADO": 45,
  "VINILO+BASE EN PVC": 45,
  "floorgraphic": 45,
  "PENDONES": 30,
  "PASACALLES": 30,
  "CARTON + VINILO": 30,
  "ESMERILADO": 45,
  "LONA+LAMINADO": 45,
  "IMANTADOS LAMINA GRUESA": 30,
  "IMANTADOS LAMINA DELGADA": 25,
  "VINILO+MDF": 30,
  "IMPRESIÓN EN VINILO REFLECTIVO": 45,
  "LETRERO EN ACRÍLICO": 60
};

export const DESIGN_COST_BY_MINUTES: Record<number, number> = {
  15: 13750, 25: 13750, 30: 13750, 45: 13750, 60: 13750, 75: 13750
};

export const PRODUCT_PRICES_FINAL: Record<string, number> = {
  "BANNER IMPRESIÓN GRAN FORMATO EN LONA BANNER DE ALTA CALIDAD": 1.3,
  "PANAFLEX": 1.7,
  "IMPRESIÓN EN VINILO": 1.7,
  "IMPRESIÓN EN VINILO + LAMINADO": 2.4,
  "VINILO MICROPERFORADO": 1.8,
  "VINILO+BASE EN PVC": 5.7,
  "floorgraphic": 3.2,
  "PENDONES": 2.0,
  "PASACALLES": 1.3,
  "CARTON + VINILO": 2.5,
  "ESMERILADO": 1.8,
  "LONA+LAMINADO": 2.0,
  "IMANTADOS LAMINA GRUESA": 23.8,
  "IMANTADOS LAMINA DELGADA": 4.4,
  "VINILO+MDF": 13.0,
  "IMPRESIÓN EN VINILO REFLECTIVO": 2.5,
  "LETRERO EN ACRÍLICO": 1.5
};

export const PRODUCT_PRICES_PUBLISHER: Record<string, number> = {
  "BANNER IMPRESIÓN GRAN FORMATO EN LONA BANNER DE ALTA CALIDAD": 1.36,
  "PANAFLEX": 1.70,
  "IMPRESIÓN EN VINILO": 1.70,
  "IMPRESIÓN EN VINILO + LAMINADO": 2.4,
  "VINILO MICROPERFORADO": 1.8,
  "VINILO+BASE EN PVC": 5.7,
  "floorgraphic": 3.2,
  "PENDONES": 1.36,
  "PASACALLES": 1.36,
  "CARTON + VINILO": 2.5,
  "ESMERILADO": 1.8,
  "LONA+LAMINADO": 2.3,
  "IMANTADOS LAMINA GRUESA": 23.8,
  "IMANTADOS LAMINA DELGADA": 4.4,
  "VINILO+MDF": 13.0,
  "IMPRESIÓN EN VINILO REFLECTIVO": 2.5,
  "LETRERO EN ACRÍLICO": 1.3
};
