// ============================================================
// Database Types (matching Supabase tables)
// ============================================================

export interface Organization {
  id: string;
  user_id: string;
  business_name: string;
  business_type: string | null;
  gst_registration_number: string | null;
  gst_rate_default: number;
  currency: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface RawMaterial {
  id: string;
  org_id: string;
  name: string;
  sku: string | null;
  unit_of_measurement: string;
  current_quantity: number;
  weighted_avg_cost: number;
  reorder_level: number | null;
  reorder_quantity: number | null;
  gst_rate: number | null;
  supplier_name: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FinishedGood {
  id: string;
  org_id: string;
  name: string;
  sku: string | null;
  selling_price: number;
  gst_rate: number | null;
  cost_price: number | null;
  unit_of_measurement: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BillOfMaterial {
  id: string;
  org_id: string;
  finished_good_id: string;
  raw_material_id: string;
  quantity_per_unit: number;
  waste_percentage: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  raw_material?: RawMaterial;
}

export interface StockPurchase {
  id: string;
  org_id: string;
  raw_material_id: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  gst_amount: number | null;
  purchase_date: string;
  invoice_number: string | null;
  supplier_name: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  raw_material?: RawMaterial;
}

export interface Sale {
  id: string;
  org_id: string;
  finished_good_id: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  gst_amount: number | null;
  sale_date: string;
  invoice_number: string | null;
  customer_name: string | null;
  notes: string | null;
  is_backflushed: boolean;
  created_at: string;
  updated_at: string;
  // Joined
  finished_good?: FinishedGood;
}

export interface InventoryTransaction {
  id: string;
  org_id: string;
  raw_material_id: string;
  transaction_type: 'PURCHASE' | 'SALE_DEDUCTION' | 'MANUAL_ADJUSTMENT' | 'WASTE_WRITE_OFF';
  quantity_change: number;
  transaction_date: string;
  reference_type: string | null;
  reference_id: string | null;
  notes: string | null;
  created_at: string;
  // Joined
  raw_material?: RawMaterial;
}

export interface FixedExpense {
  id: string;
  org_id: string;
  expense_name: string;
  category: 'RENT' | 'SALARY' | 'UTILITIES' | 'INSURANCE' | 'OTHER';
  monthly_amount: number;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface GstSettings {
  id: string;
  org_id: string;
  gst_number: string | null;
  monthly_filing_date: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Dashboard / Report Types
// ============================================================

export interface DashboardSummary {
  netProfit: number;
  totalRevenue: number;
  totalCogs: number;
  gstLiability: number;
  lowStockCount: number;
  revenueChange: number; // % change from prev period
  profitMargin: number;
}

export interface ProfitLossReport {
  period: { startDate: string; endDate: string; daysCount: number };
  revenue: { gross: number; gstAmount: number; netRevenue: number };
  cogs: { totalCogs: number };
  grossProfit: number;
  expenses: { fixedExpenses: number; details: Array<{ name: string; amount: number }> };
  netProfit: number;
  profitMargin: number;
}

export interface GstLiabilityReport {
  period: { startDate: string; endDate: string };
  outputGst: { totalSales: number; gstCollected: number };
  inputGst: { totalPurchases: number; gstPaid: number };
  netGstPayable: number;
}

export interface LowStockAlert {
  materialId: string;
  materialName: string;
  currentQty: number;
  reorderLevel: number;
  unit: string;
  status: 'OUT_OF_STOCK' | 'CRITICAL' | 'LOW_STOCK';
}

export interface RevenueDataPoint {
  date: string;
  revenue: number;
  cogs: number;
  profit: number;
}

// ============================================================
// Form Input Types
// ============================================================

export interface LogSaleInput {
  finished_good_id: string;
  quantity: number;
  unit_price: number;
  sale_date: string;
  customer_name?: string;
  invoice_number?: string;
  notes?: string;
}

export interface AddStockInput {
  raw_material_id: string;
  quantity: number;
  unit_cost: number;
  purchase_date: string;
  invoice_number?: string;
  supplier_name?: string;
  notes?: string;
}

export interface MaterialInput {
  name: string;
  sku?: string;
  unit_of_measurement: string;
  reorder_level?: number;
  reorder_quantity?: number;
  gst_rate?: number;
  supplier_name?: string;
  notes?: string;
}

export interface ProductInput {
  name: string;
  sku?: string;
  selling_price: number;
  gst_rate?: number;
  unit_of_measurement?: string;
  description?: string;
}

export interface BOMLineInput {
  raw_material_id: string;
  quantity_per_unit: number;
  waste_percentage: number;
  notes?: string;
}

export interface ExpenseInput {
  expense_name: string;
  category: 'RENT' | 'SALARY' | 'UTILITIES' | 'INSURANCE' | 'OTHER';
  monthly_amount: number;
  start_date?: string;
  end_date?: string;
  notes?: string;
}
