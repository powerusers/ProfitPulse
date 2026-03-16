'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { formatCurrency, formatNumber } from '@/lib/utils/formatters';

interface BOMLine {
  materialId: string;
  materialName: string;
  requiredPerUnit: number;
  availableQty: number;
  unit: string;
  maxUnitsFromThisMaterial: number;
  isSufficient: boolean;
}

interface ProductFeasibility {
  productId: string;
  productName: string;
  sellingPrice: number;
  costPrice: number;
  profitPerUnit: number;
  maxProducible: number;
  bottleneckMaterial: string | null;
  bottleneckAvailable: number;
  bottleneckRequired: number;
  bottleneckUnit: string;
  bomLines: BOMLine[];
  canProduce: boolean;
}

interface Allocation {
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
}

interface OptimizedPlan {
  allocations: Allocation[];
  totalRevenue: number;
  totalProfit: number;
  totalCost: number;
  remainingMaterials: Array<{
    materialId: string;
    materialName: string;
    remainingQty: number;
    unit: string;
  }>;
  productsWithProduction: number;
  totalUnitsPlanned: number;
}

interface FeasibilityReport {
  perProduct: ProductFeasibility[];
  optimizedPlan: OptimizedPlan;
  totalMaterialsValue: number;
  totalPotentialRevenue: number;
}

interface Props {
  data: FeasibilityReport | null;
  loading: boolean;
}

export default function ProductionFeasibility({ data, loading }: Props) {
  const [activeTab, setActiveTab] = useState<'overview' | 'optimized' | 'details'>('overview');
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);

  if (loading) {
    return (
      <Card>
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Production Feasibility</h3>
        <div className="h-48 flex items-center justify-center">
          <div className="animate-pulse text-gray-400 text-sm">Calculating production capacity...</div>
        </div>
      </Card>
    );
  }

  if (!data || data.perProduct.length === 0) {
    return (
      <Card>
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Production Feasibility</h3>
        <div className="text-center py-8">
          <p className="text-3xl mb-2">🏭</p>
          <p className="text-sm text-gray-500">Add products with BOM to see production feasibility</p>
        </div>
      </Card>
    );
  }

  const producible = data.perProduct.filter(p => p.canProduce);
  const notProducible = data.perProduct.filter(p => !p.canProduce);

  return (
    <Card padding="none">
      {/* Header */}
      <div className="p-6 pb-0">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-gray-900">Production Feasibility</h3>
          <div className="flex items-center gap-2">
            <Badge variant="success">{producible.length} can produce</Badge>
            {notProducible.length > 0 && (
              <Badge variant="danger">{notProducible.length} blocked</Badge>
            )}
          </div>
        </div>

        {/* Summary row */}
        <div className="grid grid-cols-3 gap-4 py-4 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Inventory Value</p>
            <p className="text-lg font-bold text-gray-900 font-mono">{formatCurrency(data.totalMaterialsValue)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Potential Revenue</p>
            <p className="text-lg font-bold text-primary-600 font-mono">{formatCurrency(data.totalPotentialRevenue)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Optimized Profit</p>
            <p className="text-lg font-bold text-accent-600 font-mono">{formatCurrency(data.optimizedPlan.totalProfit)}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-4">
          {(['overview', 'optimized', 'details'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === tab
                  ? 'bg-primary-50 text-primary-700 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab === 'overview' ? 'Per Product' : tab === 'optimized' ? 'Optimized Plan' : 'Material Details'}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="p-6 pt-4">
        {activeTab === 'overview' && (
          <OverviewTab products={data.perProduct} expandedProduct={expandedProduct} setExpandedProduct={setExpandedProduct} />
        )}
        {activeTab === 'optimized' && (
          <OptimizedTab plan={data.optimizedPlan} />
        )}
        {activeTab === 'details' && (
          <DetailsTab products={data.perProduct} />
        )}
      </div>
    </Card>
  );
}

// ─── Per Product Overview ─────────────────────────────────────
function OverviewTab({
  products,
  expandedProduct,
  setExpandedProduct,
}: {
  products: ProductFeasibility[];
  expandedProduct: string | null;
  setExpandedProduct: (id: string | null) => void;
}) {
  const sorted = [...products].sort((a, b) => b.maxProducible - a.maxProducible);

  return (
    <div className="space-y-3">
      {sorted.map(product => {
        const isExpanded = expandedProduct === product.productId;
        return (
          <div
            key={product.productId}
            className={`border rounded-xl overflow-hidden transition-all duration-200 ${
              product.canProduce ? 'border-gray-200' : 'border-danger-200 bg-danger-50/30'
            }`}
          >
            {/* Product row */}
            <button
              onClick={() => setExpandedProduct(isExpanded ? null : product.productId)}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold ${
                  product.canProduce ? 'bg-accent-100 text-accent-700' : 'bg-danger-100 text-danger-700'
                }`}>
                  {product.maxProducible}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{product.productName}</p>
                  <p className="text-xs text-gray-500">
                    {product.canProduce
                      ? `Max ${product.maxProducible} units • ${formatCurrency(product.profitPerUnit)} profit/unit`
                      : product.bottleneckMaterial
                        ? `Blocked by ${product.bottleneckMaterial}`
                        : 'No BOM defined'
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {product.canProduce && (
                  <div className="text-right">
                    <p className="text-sm font-bold text-accent-600 font-mono">
                      {formatCurrency(product.maxProducible * product.sellingPrice)}
                    </p>
                    <p className="text-[10px] text-gray-400">potential revenue</p>
                  </div>
                )}
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {/* Expanded BOM details */}
            {isExpanded && product.bomLines.length > 0 && (
              <div className="px-4 pb-4 pt-1 border-t border-gray-100 bg-gray-50/50">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Material Requirements (per unit)</p>
                <div className="space-y-2">
                  {product.bomLines.map(line => {
                    const utilizationPct = line.requiredPerUnit > 0
                      ? Math.min((line.availableQty / (line.requiredPerUnit * product.maxProducible || 1)) * 100, 100)
                      : 0;
                    const isBottleneck = line.materialName === product.bottleneckMaterial;

                    return (
                      <div key={line.materialId} className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs font-medium text-gray-700 truncate">
                              {line.materialName}
                              {isBottleneck && <span className="ml-1 text-danger-500">⚠ bottleneck</span>}
                            </p>
                            <p className="text-xs text-gray-500 ml-2">
                              {formatNumber(line.requiredPerUnit)} {line.unit}/unit
                            </p>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full transition-all ${
                                line.isSufficient ? 'bg-accent-500' : 'bg-danger-500'
                              }`}
                              style={{ width: `${utilizationPct}%` }}
                            />
                          </div>
                          <div className="flex justify-between mt-0.5">
                            <span className="text-[10px] text-gray-400">
                              Stock: {formatNumber(line.availableQty)} {line.unit}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              Makes {line.maxUnitsFromThisMaterial} units
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Optimized Production Plan ─────────────────────────────────
function OptimizedTab({ plan }: { plan: OptimizedPlan }) {
  if (plan.allocations.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-3xl mb-2">📊</p>
        <p className="text-sm text-gray-500">No production possible with current stock levels</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Optimization summary */}
      <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Optimized Production Plan</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500">Products</p>
            <p className="text-xl font-bold text-gray-900">{plan.productsWithProduction}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Units</p>
            <p className="text-xl font-bold text-gray-900">{formatNumber(plan.totalUnitsPlanned, 0)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Revenue</p>
            <p className="text-xl font-bold text-primary-600 font-mono">{formatCurrency(plan.totalRevenue)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Profit</p>
            <p className="text-xl font-bold text-accent-600 font-mono">{formatCurrency(plan.totalProfit)}</p>
          </div>
        </div>
      </div>

      {/* Allocation breakdown */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Production Allocation</p>
        <div className="space-y-3">
          {plan.allocations.map((alloc, i) => {
            const profitMargin = alloc.revenueFromThis > 0
              ? (alloc.profitFromThis / alloc.revenueFromThis) * 100
              : 0;

            return (
              <div key={alloc.productId} className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-sm font-bold">
                      #{i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{alloc.productName}</p>
                      <p className="text-xs text-gray-500">Produce {alloc.unitsToMake} units</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-accent-600 font-mono">{formatCurrency(alloc.profitFromThis)}</p>
                    <p className="text-[10px] text-gray-400">{profitMargin.toFixed(1)}% margin</p>
                  </div>
                </div>

                {/* Materials consumed */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase mb-2">Materials consumed</p>
                  <div className="grid grid-cols-2 gap-2">
                    {alloc.materialsUsed.map(mat => (
                      <div key={mat.materialId} className="text-xs text-gray-600">
                        {mat.materialName}: <span className="font-medium">{formatNumber(mat.qtyUsed)} {mat.unit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Remaining materials */}
      {plan.remainingMaterials.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Remaining After Production</p>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {plan.remainingMaterials.map(mat => (
                <div key={mat.materialId} className="text-xs">
                  <p className="font-medium text-gray-700">{mat.materialName}</p>
                  <p className="text-amber-700">{formatNumber(mat.remainingQty)} {mat.unit} left</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Material Details View ────────────────────────────────────
function DetailsTab({ products }: { products: ProductFeasibility[] }) {
  // Gather unique materials across all products
  const materialMap = new Map<string, {
    name: string;
    availableQty: number;
    unit: string;
    usedBy: Array<{ productName: string; requiredPerUnit: number }>;
  }>();

  for (const product of products) {
    for (const line of product.bomLines) {
      const existing = materialMap.get(line.materialId);
      if (existing) {
        existing.usedBy.push({ productName: product.productName, requiredPerUnit: line.requiredPerUnit });
      } else {
        materialMap.set(line.materialId, {
          name: line.materialName,
          availableQty: line.availableQty,
          unit: line.unit,
          usedBy: [{ productName: product.productName, requiredPerUnit: line.requiredPerUnit }],
        });
      }
    }
  }

  const materials = Array.from(materialMap.entries()).sort((a, b) => a[1].name.localeCompare(b[1].name));

  if (materials.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-gray-500">
        No BOM data available. Add BOM to your products first.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {materials.map(([id, mat]) => (
        <div key={id} className="border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-gray-900">{mat.name}</p>
            <p className="text-sm font-mono font-bold text-gray-700">
              {formatNumber(mat.availableQty)} {mat.unit}
            </p>
          </div>
          <p className="text-xs text-gray-500 mb-2">
            Used by {mat.usedBy.length} product{mat.usedBy.length !== 1 ? 's' : ''}:
          </p>
          <div className="space-y-1">
            {mat.usedBy.map((usage, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-gray-600">{usage.productName}</span>
                <span className="text-gray-500">{formatNumber(usage.requiredPerUnit)} {mat.unit}/unit</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
