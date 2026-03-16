import { SupabaseClient } from '@supabase/supabase-js';

// ============================================================
// Production Feasibility & Optimization Engine
// ============================================================

export interface ProductFeasibility {
  productId: string;
  productName: string;
  sellingPrice: number;
  costPrice: number;
  profitPerUnit: number;
  maxProducible: number;                    // Max units producible from current stock
  bottleneckMaterial: string | null;        // The material limiting production
  bottleneckAvailable: number;
  bottleneckRequired: number;
  bottleneckUnit: string;
  bomLines: Array<{
    materialId: string;
    materialName: string;
    requiredPerUnit: number;               // Including waste
    availableQty: number;
    unit: string;
    maxUnitsFromThisMaterial: number;
    isSufficient: boolean;
  }>;
  canProduce: boolean;                     // Can at least 1 unit be made?
}

export interface OptimizedProductionPlan {
  /** Per-product allocation in the optimized plan */
  allocations: Array<{
    productId: string;
    productName: string;
    unitsToMake: number;
    revenueFromThis: number;
    profitFromThis: number;
    materialsUsed: Array<{
      materialId: string;
      materialName: string;
      qtyUsed: number;
      unit: string;
    }>;
  }>;
  totalRevenue: number;
  totalProfit: number;
  totalCost: number;
  /** Materials remaining after the optimized plan */
  remainingMaterials: Array<{
    materialId: string;
    materialName: string;
    remainingQty: number;
    unit: string;
  }>;
  /** Summary stats */
  productsWithProduction: number;
  totalUnitsPlanned: number;
}

export interface FeasibilityReport {
  perProduct: ProductFeasibility[];
  optimizedPlan: OptimizedProductionPlan;
  totalMaterialsValue: number;             // Current inventory value
  totalPotentialRevenue: number;           // If everything producible is sold
}

/**
 * Calculate per-product feasibility based on current raw material stock and BOM.
 */
export async function calculateProductionFeasibility(
  supabase: SupabaseClient,
  orgId: string
): Promise<FeasibilityReport> {
  // 1. Fetch all active finished goods with BOM
  const { data: products } = await supabase
    .from('finished_goods')
    .select(`
      id, name, selling_price, cost_price,
      bill_of_materials (
        id, raw_material_id, quantity_per_unit, waste_percentage,
        raw_materials (id, name, current_quantity, unit_of_measurement, weighted_avg_cost)
      )
    `)
    .eq('org_id', orgId)
    .eq('is_active', true)
    .order('name');

  // 2. Fetch all raw materials for inventory value
  const { data: allMaterials } = await supabase
    .from('raw_materials')
    .select('id, name, current_quantity, weighted_avg_cost, unit_of_measurement')
    .eq('org_id', orgId)
    .eq('is_active', true);

  const totalMaterialsValue = (allMaterials || []).reduce(
    (sum, m) => sum + m.current_quantity * m.weighted_avg_cost, 0
  );

  // 3. Per-product feasibility
  const perProduct: ProductFeasibility[] = [];

  for (const product of products || []) {
    const bomLines = (product as any).bill_of_materials || [];

    if (bomLines.length === 0) {
      perProduct.push({
        productId: product.id,
        productName: product.name,
        sellingPrice: product.selling_price,
        costPrice: product.cost_price || 0,
        profitPerUnit: product.selling_price - (product.cost_price || 0),
        maxProducible: 0,
        bottleneckMaterial: null,
        bottleneckAvailable: 0,
        bottleneckRequired: 0,
        bottleneckUnit: '',
        bomLines: [],
        canProduce: false,
      });
      continue;
    }

    let minProducible = Infinity;
    let bottleneck = { name: '', available: 0, required: 0, unit: '' };
    const materialDetails: ProductFeasibility['bomLines'] = [];

    for (const bom of bomLines) {
      const material = (bom as any).raw_materials;
      if (!material) continue;

      const requiredPerUnit = bom.quantity_per_unit * (1 + bom.waste_percentage / 100);
      const availableQty = material.current_quantity;
      const maxFromThis = requiredPerUnit > 0 ? Math.floor(availableQty / requiredPerUnit) : 0;

      materialDetails.push({
        materialId: material.id,
        materialName: material.name,
        requiredPerUnit,
        availableQty,
        unit: material.unit_of_measurement,
        maxUnitsFromThisMaterial: maxFromThis,
        isSufficient: maxFromThis > 0,
      });

      if (maxFromThis < minProducible) {
        minProducible = maxFromThis;
        bottleneck = {
          name: material.name,
          available: availableQty,
          required: requiredPerUnit,
          unit: material.unit_of_measurement,
        };
      }
    }

    const maxProducible = minProducible === Infinity ? 0 : minProducible;

    perProduct.push({
      productId: product.id,
      productName: product.name,
      sellingPrice: product.selling_price,
      costPrice: product.cost_price || 0,
      profitPerUnit: product.selling_price - (product.cost_price || 0),
      maxProducible,
      bottleneckMaterial: bottleneck.name || null,
      bottleneckAvailable: bottleneck.available,
      bottleneckRequired: bottleneck.required,
      bottleneckUnit: bottleneck.unit,
      bomLines: materialDetails,
      canProduce: maxProducible > 0,
    });
  }

  // 4. Optimized production plan (greedy: maximize profit)
  const optimizedPlan = calculateOptimizedPlan(perProduct, allMaterials || []);

  const totalPotentialRevenue = perProduct.reduce(
    (sum, p) => sum + p.maxProducible * p.sellingPrice, 0
  );

  return {
    perProduct,
    optimizedPlan,
    totalMaterialsValue,
    totalPotentialRevenue,
  };
}

/**
 * Greedy optimization: allocate production to maximize total profit.
 *
 * Strategy:
 * 1. Sort products by profit-per-unit descending
 * 2. For each product, allocate as many units as possible given remaining materials
 * 3. Deduct materials from the working pool
 * 4. Repeat until no more production is possible
 */
function calculateOptimizedPlan(
  feasibility: ProductFeasibility[],
  materials: Array<{ id: string; name: string; current_quantity: number; weighted_avg_cost: number; unit_of_measurement: string }>
): OptimizedProductionPlan {
  // Create a mutable material pool
  const materialPool: Record<string, { name: string; qty: number; unit: string }> = {};
  for (const m of materials) {
    materialPool[m.id] = { name: m.name, qty: m.current_quantity, unit: m.unit_of_measurement };
  }

  // Sort by profit per unit descending (greedy heuristic)
  const sorted = [...feasibility]
    .filter(p => p.bomLines.length > 0)
    .sort((a, b) => b.profitPerUnit - a.profitPerUnit);

  const allocations: OptimizedProductionPlan['allocations'] = [];
  let totalRevenue = 0;
  let totalProfit = 0;
  let totalCost = 0;
  let totalUnitsPlanned = 0;

  for (const product of sorted) {
    // Determine max producible from current pool
    let maxFromPool = Infinity;

    for (const bom of product.bomLines) {
      const available = materialPool[bom.materialId]?.qty || 0;
      const maxUnits = bom.requiredPerUnit > 0
        ? Math.floor(available / bom.requiredPerUnit)
        : 0;
      maxFromPool = Math.min(maxFromPool, maxUnits);
    }

    if (maxFromPool === Infinity || maxFromPool <= 0) continue;

    // Allocate this product
    const unitsToMake = maxFromPool;
    const materialsUsed: Array<{ materialId: string; materialName: string; qtyUsed: number; unit: string }> = [];

    for (const bom of product.bomLines) {
      const qtyUsed = unitsToMake * bom.requiredPerUnit;
      materialPool[bom.materialId].qty -= qtyUsed;
      materialsUsed.push({
        materialId: bom.materialId,
        materialName: bom.materialName,
        qtyUsed,
        unit: bom.unit,
      });
    }

    const revenue = unitsToMake * product.sellingPrice;
    const cost = unitsToMake * product.costPrice;
    const profit = revenue - cost;

    allocations.push({
      productId: product.productId,
      productName: product.productName,
      unitsToMake,
      revenueFromThis: revenue,
      profitFromThis: profit,
      materialsUsed,
    });

    totalRevenue += revenue;
    totalProfit += profit;
    totalCost += cost;
    totalUnitsPlanned += unitsToMake;
  }

  const remainingMaterials = Object.entries(materialPool)
    .filter(([, v]) => v.qty > 0)
    .map(([id, v]) => ({
      materialId: id,
      materialName: v.name,
      remainingQty: v.qty,
      unit: v.unit,
    }));

  return {
    allocations,
    totalRevenue,
    totalProfit,
    totalCost,
    remainingMaterials,
    productsWithProduction: allocations.length,
    totalUnitsPlanned,
  };
}
