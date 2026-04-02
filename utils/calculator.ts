
import { FormData, QuoteResult, Product, AcrylicMaterial } from '../types';
import { 
  DESIGN_COST_BY_MINUTES
} from '../constants';

export const calculateQuote = (data: FormData, params: any, products: Product[]): QuoteResult => {
  const {
    customer_type, job_description, width, height, quantity,
    production_time, cutting_hours, laminate_speed, installation,
    urgency_percentage, transport, include_design, include_printing, ojalete_quantity,
    include_tubes, include_sticks, sticks_quantity,
    acrylic_type, base_type, laser_minutes, assembly_hours, installation_hours,
    manual_meters, use_manual_meters, selected_acrylic_material_id, manual_structure_cost,
    calado_w, calado_h, letras3d_w, letras3d_h, letras3d_grosor, vinilo_w, vinilo_h, lona_w, lona_h, led_cm, fondo_w, fondo_h, include_power_supply
  } = data;

  const productData = products.find(p => p.name === job_description);
  const designTimeMinutes = productData?.designTime || 0;
  
  const isAcrilico = (job_description || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().includes('ACRILICO');
  const isAnyPendon = job_description.includes('PENDON') || job_description === 'PENDONES' || job_description.includes('BANNER');
  
  const areaCm2Unitary = width * height; 
  const areaM2FromDims = areaCm2Unitary / 10000;
  
  const effectiveAreaM2Unitary = (isAcrilico && use_manual_meters) ? (manual_meters || 0) : areaM2FromDims;
  const effectiveAreaCm2Unitary = effectiveAreaM2Unitary * 10000;

  let materialCost = 0;
  let designCost = 0;
  let productionCost = 0;
  let laserCost = 0;
  let assemblyCost = 0;
  let installCostCalculated = installation || 0;
  let structureCostTotal = 0;

  // Costos detallados DPM
  let costCalado = 0;
  let cost3D = 0;
  let costVinilo = 0;
  let costLona = 0;
  let costLED = 0;
  let costFondo = 0;
  let costFuente = 0;

  if (isAcrilico) {
    const materials: AcrylicMaterial[] = params.acrylic_materials || [];
    const selectedMaterial = materials.find(m => m.id === selected_acrylic_material_id);
    const materialPriceCm2 = selectedMaterial ? selectedMaterial.cost_per_cm2 : (params.acrilico_cost_per_m2 / 10000 || 1.125);
    
    // Cálculo de componentes detallados
    costCalado = ((calado_w || 0) * (calado_h || 0)) * materialPriceCm2;
    cost3D = ((letras3d_w || 0) * (letras3d_h || 0)) * materialPriceCm2;
    if ((letras3d_grosor || 0) > 0) {
      const perimetroAprox = ((letras3d_w || 0) * 2) + ((letras3d_h || 0) * 2);
      cost3D += (perimetroAprox * (letras3d_grosor || 0)) * materialPriceCm2;
    }

    costVinilo = ((vinilo_w || 0) * (vinilo_h || 0)) * (params.vinilo_factor || 2.4);
    costLona = ((lona_w || 0) * (lona_h || 0)) * (params.lona_factor || 2.3);
    costLED = (led_cm || 0) * (params.led_cost_per_cm || 130);
    costFondo = ((fondo_w || 0) * (fondo_h || 0)) * materialPriceCm2;
    costFuente = include_power_supply ? (params.power_supply_cost || 80000) : 0;

    const detailedTotalUnitary = costCalado + cost3D + costVinilo + costLona + costLED + costFondo + costFuente;
    
    const baseMaterialCostUnitary = selectedMaterial 
      ? (effectiveAreaCm2Unitary * selectedMaterial.cost_per_cm2)
      : (effectiveAreaM2Unitary * (params.acrilico_cost_per_m2 || 11250));
    
    const lightingCost = acrylic_type === 'luminoso' ? (params.lighting_extra || 45000) * effectiveAreaM2Unitary : 0;
    
    const baseExtraPerUnit = manual_structure_cost && manual_structure_cost > 0 
      ? manual_structure_cost 
      : (base_type ? (params.base_prices?.[base_type] || 0) * effectiveAreaM2Unitary : 0);
    
    structureCostTotal = baseExtraPerUnit * quantity;
    
    materialCost = (baseMaterialCostUnitary + lightingCost + detailedTotalUnitary) * quantity;
    
    laserCost = ((laser_minutes || 0) / 60) * params.hourly_rate;
    assemblyCost = (assembly_hours || 0) * params.hourly_rate;
    installCostCalculated = (installation_hours || 0) * params.hourly_rate;

    designCost = include_design ? (params.design_fixed_cost || 15000) : 0;
    productionCost = laserCost + assemblyCost;
  } else {
    const realAreaCm2Total = effectiveAreaCm2Unitary * quantity;
    const baseCostPerCm2 = customer_type === 'final' ? (productData?.priceFinal || 0.75) : (productData?.pricePublisher || 0.75);
    
    materialCost = realAreaCm2Total * baseCostPerCm2;
    designCost = include_design && customer_type === 'final' ? (DESIGN_COST_BY_MINUTES[designTimeMinutes] || 0) : 0;
    productionCost = (production_time / 60) * params.hourly_rate;
    installCostCalculated = installation || 0;
  }

  const taponCost = (isAnyPendon && include_tubes) ? (params.tapon_cost || 800) * 2 * quantity : 0;
  const tubeCost = (isAnyPendon && include_tubes) ? (width / 100) * (params.tube_cost_factor || 1200) * 2 * quantity : 0;
  const ojalesCost = (ojalete_quantity > 0) ? (ojalete_quantity * params.ojal_cost) : 0;

  const subtotalBeforeWaste = materialCost + productionCost + designCost + taponCost + tubeCost + ojalesCost + structureCostTotal;
  
  const wasteCost = !isAcrilico ? materialCost * (params.waste || 0.1) : 0;
  const totalBeforeMargin = subtotalBeforeWaste + wasteCost + installCostCalculated + (transport || 0);
  
  const margin = customer_type === 'final' ? params.profit_margin_final : params.profit_margin_publisher;
  let costWithMargin = totalBeforeMargin * (1 + margin);
  
  // Apply custom factors
  (params.custom_factors || []).forEach((f: any) => {
    if (f.type === 'multiplier') {
      costWithMargin *= (1 + f.value);
    } else if (f.type === 'fixed') {
      costWithMargin += f.value;
    }
  });
  
  const ivaAmount = customer_type === 'final' ? costWithMargin * params.iva : 0;
  const finalPrice = Math.ceil((costWithMargin + ivaAmount) / 100) * 100;

  const totalAreaCm2 = effectiveAreaCm2Unitary * quantity;
  const totalAreaM2 = totalAreaCm2 / 10000;

  return {
    areaCm2: effectiveAreaCm2Unitary, 
    totalAreaCm2: totalAreaCm2, 
    totalAreaM2: totalAreaM2, 
    rollWidth: 0, 
    rollAreaCm2: totalAreaCm2, 
    wasteAreaCm2: 0,
    materialCost, 
    wasteCostFromRoll: 0, 
    productionCost, 
    designCost, 
    cuttingCost: laserCost,
    laminateTotal: 0, 
    taponCost, 
    tubeCost, 
    ojalesCost, 
    sticksCost: 0, 
    subtotalBeforeWaste,
    wasteCost, 
    totalBeforeMargin, 
    urgencyCost: 0, 
    totalCostsWithUrgency: totalBeforeMargin,
    costWithMargin, 
    ivaAmount, 
    finalPrice, 
    installation: installCostCalculated, 
    transport,
    adjustedWidth: width, 
    adjustedHeight: height,
    laserCost, 
    assemblyCost,
    structureCost: structureCostTotal,
    detailedCosts: {
      calado: costCalado * quantity,
      letras3d: cost3D * quantity,
      vinilo: costVinilo * quantity,
      lona: costLona * quantity,
      led: costLED * quantity,
      fondo: costFondo * quantity,
      fuente: costFuente * quantity
    }
  };
};
