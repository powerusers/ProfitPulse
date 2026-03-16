-- ============================================================
-- Production Run Schema & Inventory Logic Update
-- ============================================================

-- 1. Add current_quantity to finished_goods
ALTER TABLE finished_goods 
ADD COLUMN IF NOT EXISTS current_quantity NUMERIC(12,3) DEFAULT 0;

-- 2. Create production_runs table
CREATE TABLE IF NOT EXISTS production_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  finished_good_id UUID NOT NULL REFERENCES finished_goods(id) ON DELETE CASCADE,
  quantity_produced NUMERIC(12,3) NOT NULL,
  production_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for production runs
CREATE INDEX IF NOT EXISTS idx_production_runs_org ON production_runs(org_id);
CREATE INDEX IF NOT EXISTS idx_production_runs_product ON production_runs(finished_good_id);
CREATE INDEX IF NOT EXISTS idx_production_runs_date ON production_runs(production_date);

-- Enable RLS on production_runs
ALTER TABLE production_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own production runs"
  ON production_runs FOR SELECT
  USING (org_id = get_user_org_id());

CREATE POLICY "Users can insert own production runs"
  ON production_runs FOR INSERT
  WITH CHECK (org_id = get_user_org_id());

CREATE POLICY "Users can update own production runs"
  ON production_runs FOR UPDATE
  USING (org_id = get_user_org_id());

-- 3. Trigger Function: Process Production Run (Deduct Raw Materials, Add Finished Goods)
CREATE OR REPLACE FUNCTION fn_process_production_run()
RETURNS TRIGGER AS $$
DECLARE
  v_bom RECORD;
  v_qty_to_deduct NUMERIC;
BEGIN
  -- 1. Loop through BOM for this finished good
  FOR v_bom IN
    SELECT bm.raw_material_id, bm.quantity_per_unit, bm.waste_percentage
    FROM bill_of_materials bm
    WHERE bm.finished_good_id = NEW.finished_good_id
  LOOP
    -- Calculate qty to deduct: produced_qty x qty_per_unit x (1 + waste%)
    v_qty_to_deduct := NEW.quantity_produced * v_bom.quantity_per_unit * (1 + v_bom.waste_percentage / 100);

    -- Deduct from raw materials inventory
    UPDATE raw_materials
    SET current_quantity = current_quantity - v_qty_to_deduct,
        updated_at = NOW()
    WHERE id = v_bom.raw_material_id;

    -- Log inventory transaction
    INSERT INTO inventory_transactions (org_id, raw_material_id, transaction_type, quantity_change, transaction_date, reference_type, reference_id, notes)
    VALUES (NEW.org_id, v_bom.raw_material_id, 'PRODUCTION_CONSUMPTION', -v_qty_to_deduct, NEW.production_date, 'production_runs', NEW.id,
            'Consumption for: ' || NEW.quantity_produced || ' units of product');
  END LOOP;

  -- 2. Increase Finished Goods inventory
  UPDATE finished_goods
  SET current_quantity = current_quantity + NEW.quantity_produced,
      updated_at = NOW()
  WHERE id = NEW.finished_good_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_process_production_run ON production_runs;
CREATE TRIGGER trg_process_production_run
AFTER INSERT ON production_runs
FOR EACH ROW
EXECUTE FUNCTION fn_process_production_run();

-- 4. Update Sales Trigger: Deduct from Finished Goods instead of Raw Materials
-- We modify fn_process_bom_backflush to deduct from finished_goods.current_quantity
-- and we remove the raw material deduction loop from it.

CREATE OR REPLACE FUNCTION fn_process_bom_backflush()
RETURNS TRIGGER AS $$
BEGIN
  -- Deduct from finished goods inventory
  UPDATE finished_goods
  SET current_quantity = current_quantity - NEW.quantity,
      updated_at = NOW()
  WHERE id = NEW.finished_good_id;

  -- Mark sale as backflushed (though it's now a finished good deduction)
  UPDATE sales SET is_backflushed = TRUE WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
