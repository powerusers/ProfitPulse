-- ============================================================
-- ProfitPulse Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. Organizations Table
-- ============================================================
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name VARCHAR(255) NOT NULL,
  business_type VARCHAR(100),
  gst_registration_number VARCHAR(50),
  gst_rate_default NUMERIC(5,2) DEFAULT 18.00,
  currency VARCHAR(3) DEFAULT 'INR',
  timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. Raw Materials Table
-- ============================================================
CREATE TABLE IF NOT EXISTS raw_materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100),
  unit_of_measurement VARCHAR(20) NOT NULL DEFAULT 'kg',
  current_quantity NUMERIC(12,3) DEFAULT 0,
  weighted_avg_cost NUMERIC(12,4) DEFAULT 0,
  reorder_level NUMERIC(12,3) DEFAULT 0,
  reorder_quantity NUMERIC(12,3) DEFAULT 0,
  gst_rate NUMERIC(5,2) DEFAULT 18.00,
  supplier_name VARCHAR(255),
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. Finished Goods Table
-- ============================================================
CREATE TABLE IF NOT EXISTS finished_goods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100),
  selling_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  gst_rate NUMERIC(5,2) DEFAULT 18.00,
  cost_price NUMERIC(12,4) DEFAULT 0,
  unit_of_measurement VARCHAR(20) DEFAULT 'pcs',
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. Bill of Materials (BOM / Recipes)
-- ============================================================
CREATE TABLE IF NOT EXISTS bill_of_materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  finished_good_id UUID NOT NULL REFERENCES finished_goods(id) ON DELETE CASCADE,
  raw_material_id UUID NOT NULL REFERENCES raw_materials(id) ON DELETE RESTRICT,
  quantity_per_unit NUMERIC(12,4) NOT NULL DEFAULT 0,
  waste_percentage NUMERIC(5,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(finished_good_id, raw_material_id)
);

-- ============================================================
-- 5. Stock Purchases Table
-- ============================================================
CREATE TABLE IF NOT EXISTS stock_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  raw_material_id UUID NOT NULL REFERENCES raw_materials(id) ON DELETE RESTRICT,
  quantity NUMERIC(12,3) NOT NULL,
  unit_cost NUMERIC(12,4) NOT NULL,
  total_cost NUMERIC(14,2) NOT NULL,
  gst_amount NUMERIC(14,2) DEFAULT 0,
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  invoice_number VARCHAR(100),
  supplier_name VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. Sales Table
-- ============================================================
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  finished_good_id UUID NOT NULL REFERENCES finished_goods(id) ON DELETE RESTRICT,
  quantity NUMERIC(12,3) NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL,
  total_amount NUMERIC(14,2) NOT NULL,
  gst_amount NUMERIC(14,2) DEFAULT 0,
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  invoice_number VARCHAR(100),
  customer_name VARCHAR(255),
  notes TEXT,
  is_backflushed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. Inventory Transactions Table (Audit Trail)
-- ============================================================
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  raw_material_id UUID NOT NULL REFERENCES raw_materials(id) ON DELETE RESTRICT,
  transaction_type VARCHAR(50) NOT NULL,
  quantity_change NUMERIC(12,3) NOT NULL,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reference_type VARCHAR(50),
  reference_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 8. Fixed Expenses Table
-- ============================================================
CREATE TABLE IF NOT EXISTS fixed_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  expense_name VARCHAR(255) NOT NULL,
  category VARCHAR(100) DEFAULT 'OTHER',
  monthly_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  start_date DATE,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 9. GST Settings Table
-- ============================================================
CREATE TABLE IF NOT EXISTS gst_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
  gst_number VARCHAR(50),
  monthly_filing_date INT DEFAULT 20,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES for Performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_raw_materials_org ON raw_materials(org_id);
CREATE INDEX IF NOT EXISTS idx_finished_goods_org ON finished_goods(org_id);
CREATE INDEX IF NOT EXISTS idx_bom_finished_good ON bill_of_materials(finished_good_id);
CREATE INDEX IF NOT EXISTS idx_bom_raw_material ON bill_of_materials(raw_material_id);
CREATE INDEX IF NOT EXISTS idx_stock_purchases_org ON stock_purchases(org_id);
CREATE INDEX IF NOT EXISTS idx_stock_purchases_material ON stock_purchases(raw_material_id);
CREATE INDEX IF NOT EXISTS idx_stock_purchases_date ON stock_purchases(purchase_date);
CREATE INDEX IF NOT EXISTS idx_sales_org ON sales(org_id);
CREATE INDEX IF NOT EXISTS idx_sales_product ON sales(finished_good_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_inventory_tx_org ON inventory_transactions(org_id);
CREATE INDEX IF NOT EXISTS idx_inventory_tx_material ON inventory_transactions(raw_material_id);
CREATE INDEX IF NOT EXISTS idx_inventory_tx_date ON inventory_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_fixed_expenses_org ON fixed_expenses(org_id);

-- ============================================================
-- TRIGGER: Update Weighted Average Cost on Stock Purchase
-- ============================================================
CREATE OR REPLACE FUNCTION fn_update_weighted_avg_cost()
RETURNS TRIGGER AS $$
DECLARE
  v_old_qty NUMERIC;
  v_old_cost NUMERIC;
  v_new_total_qty NUMERIC;
  v_new_avg_cost NUMERIC;
BEGIN
  -- Get current material state
  SELECT current_quantity, weighted_avg_cost
  INTO v_old_qty, v_old_cost
  FROM raw_materials
  WHERE id = NEW.raw_material_id;

  -- Calculate new weighted average cost
  v_new_total_qty := v_old_qty + NEW.quantity;

  IF v_new_total_qty > 0 THEN
    v_new_avg_cost := ((v_old_qty * v_old_cost) + (NEW.quantity * NEW.unit_cost)) / v_new_total_qty;
  ELSE
    v_new_avg_cost := NEW.unit_cost;
  END IF;

  -- Update raw material
  UPDATE raw_materials
  SET current_quantity = v_new_total_qty,
      weighted_avg_cost = v_new_avg_cost,
      updated_at = NOW()
  WHERE id = NEW.raw_material_id;

  -- Log inventory transaction
  INSERT INTO inventory_transactions (org_id, raw_material_id, transaction_type, quantity_change, transaction_date, reference_type, reference_id, notes)
  VALUES (NEW.org_id, NEW.raw_material_id, 'PURCHASE', NEW.quantity, NEW.purchase_date, 'stock_purchases', NEW.id, 'Stock purchase recorded');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_weighted_avg_cost ON stock_purchases;
CREATE TRIGGER trg_update_weighted_avg_cost
AFTER INSERT ON stock_purchases
FOR EACH ROW
EXECUTE FUNCTION fn_update_weighted_avg_cost();

-- ============================================================
-- TRIGGER: BOM Backflushing on Sale
-- ============================================================
CREATE OR REPLACE FUNCTION fn_process_bom_backflush()
RETURNS TRIGGER AS $$
DECLARE
  v_bom RECORD;
  v_qty_to_deduct NUMERIC;
BEGIN
  -- Only process if not already backflushed
  IF NEW.is_backflushed = FALSE THEN
    -- Loop through BOM for this finished good
    FOR v_bom IN
      SELECT bm.raw_material_id, bm.quantity_per_unit, bm.waste_percentage
      FROM bill_of_materials bm
      WHERE bm.finished_good_id = NEW.finished_good_id
    LOOP
      -- Calculate qty to deduct: sold_qty x qty_per_unit x (1 + waste%)
      v_qty_to_deduct := NEW.quantity * v_bom.quantity_per_unit * (1 + v_bom.waste_percentage / 100);

      -- Deduct from raw materials inventory
      UPDATE raw_materials
      SET current_quantity = GREATEST(current_quantity - v_qty_to_deduct, 0),
          updated_at = NOW()
      WHERE id = v_bom.raw_material_id;

      -- Log inventory transaction
      INSERT INTO inventory_transactions (org_id, raw_material_id, transaction_type, quantity_change, transaction_date, reference_type, reference_id, notes)
      VALUES (NEW.org_id, v_bom.raw_material_id, 'SALE_DEDUCTION', -v_qty_to_deduct, NEW.sale_date, 'sales', NEW.id,
              'Auto-deducted: ' || NEW.quantity || ' units sold');
    END LOOP;

    -- Mark sale as backflushed
    UPDATE sales SET is_backflushed = TRUE WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_process_bom_backflush ON sales;
CREATE TRIGGER trg_process_bom_backflush
AFTER INSERT ON sales
FOR EACH ROW
EXECUTE FUNCTION fn_process_bom_backflush();

-- ============================================================
-- TRIGGER: Auto-calculate Finished Good cost_price from BOM
-- ============================================================
CREATE OR REPLACE FUNCTION fn_update_finished_good_cost()
RETURNS TRIGGER AS $$
DECLARE
  v_total_cost NUMERIC;
BEGIN
  SELECT COALESCE(SUM(
    bm.quantity_per_unit * (1 + bm.waste_percentage / 100) * rm.weighted_avg_cost
  ), 0)
  INTO v_total_cost
  FROM bill_of_materials bm
  JOIN raw_materials rm ON rm.id = bm.raw_material_id
  WHERE bm.finished_good_id = COALESCE(NEW.finished_good_id, OLD.finished_good_id);

  UPDATE finished_goods
  SET cost_price = v_total_cost,
      updated_at = NOW()
  WHERE id = COALESCE(NEW.finished_good_id, OLD.finished_good_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_fg_cost_on_bom_change ON bill_of_materials;
CREATE TRIGGER trg_update_fg_cost_on_bom_change
AFTER INSERT OR UPDATE OR DELETE ON bill_of_materials
FOR EACH ROW
EXECUTE FUNCTION fn_update_finished_good_cost();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE finished_goods ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_of_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE gst_settings ENABLE ROW LEVEL SECURITY;

-- Organizations: users can only access their own org
CREATE POLICY "Users can view own organization"
  ON organizations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own organization"
  ON organizations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own organization"
  ON organizations FOR UPDATE
  USING (auth.uid() = user_id);

-- Helper function to get user's org_id
CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS UUID AS $$
  SELECT id FROM organizations WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Raw Materials: users can only access materials in their org
CREATE POLICY "Users can view own materials"
  ON raw_materials FOR SELECT
  USING (org_id = get_user_org_id());

CREATE POLICY "Users can insert own materials"
  ON raw_materials FOR INSERT
  WITH CHECK (org_id = get_user_org_id());

CREATE POLICY "Users can update own materials"
  ON raw_materials FOR UPDATE
  USING (org_id = get_user_org_id());

CREATE POLICY "Users can delete own materials"
  ON raw_materials FOR DELETE
  USING (org_id = get_user_org_id());

-- Finished Goods
CREATE POLICY "Users can view own products"
  ON finished_goods FOR SELECT
  USING (org_id = get_user_org_id());

CREATE POLICY "Users can insert own products"
  ON finished_goods FOR INSERT
  WITH CHECK (org_id = get_user_org_id());

CREATE POLICY "Users can update own products"
  ON finished_goods FOR UPDATE
  USING (org_id = get_user_org_id());

CREATE POLICY "Users can delete own products"
  ON finished_goods FOR DELETE
  USING (org_id = get_user_org_id());

-- Bill of Materials
CREATE POLICY "Users can view own bom"
  ON bill_of_materials FOR SELECT
  USING (org_id = get_user_org_id());

CREATE POLICY "Users can insert own bom"
  ON bill_of_materials FOR INSERT
  WITH CHECK (org_id = get_user_org_id());

CREATE POLICY "Users can update own bom"
  ON bill_of_materials FOR UPDATE
  USING (org_id = get_user_org_id());

CREATE POLICY "Users can delete own bom"
  ON bill_of_materials FOR DELETE
  USING (org_id = get_user_org_id());

-- Stock Purchases
CREATE POLICY "Users can view own purchases"
  ON stock_purchases FOR SELECT
  USING (org_id = get_user_org_id());

CREATE POLICY "Users can insert own purchases"
  ON stock_purchases FOR INSERT
  WITH CHECK (org_id = get_user_org_id());

CREATE POLICY "Users can update own purchases"
  ON stock_purchases FOR UPDATE
  USING (org_id = get_user_org_id());

CREATE POLICY "Users can delete own purchases"
  ON stock_purchases FOR DELETE
  USING (org_id = get_user_org_id());

-- Sales
CREATE POLICY "Users can view own sales"
  ON sales FOR SELECT
  USING (org_id = get_user_org_id());

CREATE POLICY "Users can insert own sales"
  ON sales FOR INSERT
  WITH CHECK (org_id = get_user_org_id());

CREATE POLICY "Users can update own sales"
  ON sales FOR UPDATE
  USING (org_id = get_user_org_id());

CREATE POLICY "Users can delete own sales"
  ON sales FOR DELETE
  USING (org_id = get_user_org_id());

-- Inventory Transactions
CREATE POLICY "Users can view own transactions"
  ON inventory_transactions FOR SELECT
  USING (org_id = get_user_org_id());

CREATE POLICY "Users can insert own transactions"
  ON inventory_transactions FOR INSERT
  WITH CHECK (org_id = get_user_org_id());

-- Fixed Expenses
CREATE POLICY "Users can view own expenses"
  ON fixed_expenses FOR SELECT
  USING (org_id = get_user_org_id());

CREATE POLICY "Users can insert own expenses"
  ON fixed_expenses FOR INSERT
  WITH CHECK (org_id = get_user_org_id());

CREATE POLICY "Users can update own expenses"
  ON fixed_expenses FOR UPDATE
  USING (org_id = get_user_org_id());

CREATE POLICY "Users can delete own expenses"
  ON fixed_expenses FOR DELETE
  USING (org_id = get_user_org_id());

-- GST Settings
CREATE POLICY "Users can view own gst settings"
  ON gst_settings FOR SELECT
  USING (org_id = get_user_org_id());

CREATE POLICY "Users can insert own gst settings"
  ON gst_settings FOR INSERT
  WITH CHECK (org_id = get_user_org_id());

CREATE POLICY "Users can update own gst settings"
  ON gst_settings FOR UPDATE
  USING (org_id = get_user_org_id());

-- ============================================================
-- DONE! Your ProfitPulse database is ready.
-- ============================================================
