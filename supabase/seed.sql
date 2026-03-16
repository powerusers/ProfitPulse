-- ============================================================
-- ProfitPulse: Create Demo User + Sample Data
-- Run this in your Supabase SQL Editor AFTER running migration.sql
-- ============================================================
--
-- DEMO LOGIN CREDENTIALS:
--   Email:    demo@profitpulse.com
--   Password: demo123456
--
-- ============================================================

-- Enable pgcrypto (needed for password hashing)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- Step 1: Clean up any previous demo data (safe to re-run)
-- ============================================================
DO $$
BEGIN
  -- Delete org data first (cascades to all child tables)
  DELETE FROM organizations WHERE user_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
  -- Delete auth records
  DELETE FROM auth.identities WHERE user_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
  DELETE FROM auth.users WHERE id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
END $$;

-- ============================================================
-- Step 2: Create the demo user in Supabase Auth
-- ============================================================
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  aud,
  role,
  is_super_admin
) VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  '00000000-0000-0000-0000-000000000000',
  'demo@profitpulse.com',
  crypt('demo123456', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  '',
  'authenticated',
  'authenticated',
  FALSE
);

-- Insert identity record (required for Supabase Auth to work)
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  jsonb_build_object(
    'sub', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'email', 'demo@profitpulse.com',
    'email_verified', true
  ),
  'email',
  'demo@profitpulse.com',
  NOW(),
  NOW(),
  NOW()
);

-- ============================================================
-- Step 3: Create Organization + all sample data
-- ============================================================
DO $$
DECLARE
  v_user_id UUID := 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
  v_org_id UUID;

  -- Material IDs
  v_wheat UUID;
  v_sugar UUID;
  v_butter UUID;
  v_eggs UUID;
  v_cocoa UUID;
  v_milk UUID;
  v_vanilla UUID;
  v_boxes UUID;

  -- Product IDs
  v_cookies UUID;
  v_cake UUID;
  v_cupcakes UUID;
  v_bread UUID;
  v_brownies UUID;

BEGIN
  -- ─── Organization ────────────────────────────────────────────
  INSERT INTO organizations (user_id, business_name, business_type, gst_registration_number)
  VALUES (v_user_id, 'Sharma''s Bakery', 'Food Manufacturing', '27AAPCS1234F1Z5')
  RETURNING id INTO v_org_id;

  -- ─── Raw Materials ───────────────────────────────────────────
  INSERT INTO raw_materials (org_id, name, sku, unit_of_measurement, reorder_level, reorder_quantity, gst_rate, supplier_name)
  VALUES (v_org_id, 'Wheat Flour',     'RM-001', 'kg',  50,  200, 5,  'Agro Supplies Ltd')   RETURNING id INTO v_wheat;

  INSERT INTO raw_materials (org_id, name, sku, unit_of_measurement, reorder_level, reorder_quantity, gst_rate, supplier_name)
  VALUES (v_org_id, 'Sugar',           'RM-002', 'kg',  30,  100, 5,  'Agro Supplies Ltd')   RETURNING id INTO v_sugar;

  INSERT INTO raw_materials (org_id, name, sku, unit_of_measurement, reorder_level, reorder_quantity, gst_rate, supplier_name)
  VALUES (v_org_id, 'Butter',          'RM-003', 'kg',  10,  50,  12, 'Fresh Dairy Co')      RETURNING id INTO v_butter;

  INSERT INTO raw_materials (org_id, name, sku, unit_of_measurement, reorder_level, reorder_quantity, gst_rate, supplier_name)
  VALUES (v_org_id, 'Eggs',            'RM-004', 'pcs', 60,  180, 0,  'Farm Fresh Poultry')  RETURNING id INTO v_eggs;

  INSERT INTO raw_materials (org_id, name, sku, unit_of_measurement, reorder_level, reorder_quantity, gst_rate, supplier_name)
  VALUES (v_org_id, 'Cocoa Powder',    'RM-005', 'kg',  5,   25,  18, 'Choco Imports')       RETURNING id INTO v_cocoa;

  INSERT INTO raw_materials (org_id, name, sku, unit_of_measurement, reorder_level, reorder_quantity, gst_rate, supplier_name)
  VALUES (v_org_id, 'Milk',            'RM-006', 'l',   20,  80,  0,  'Fresh Dairy Co')      RETURNING id INTO v_milk;

  INSERT INTO raw_materials (org_id, name, sku, unit_of_measurement, reorder_level, reorder_quantity, gst_rate, supplier_name)
  VALUES (v_org_id, 'Vanilla Extract', 'RM-007', 'ml',  100, 500, 18, 'Spice World')         RETURNING id INTO v_vanilla;

  INSERT INTO raw_materials (org_id, name, sku, unit_of_measurement, reorder_level, reorder_quantity, gst_rate, supplier_name)
  VALUES (v_org_id, 'Packaging Boxes', 'RM-008', 'pcs', 100, 500, 12, 'PackPro India')       RETURNING id INTO v_boxes;

  -- ─── Stock Purchases (DB trigger auto-updates qty & avg cost) ─
  -- Insert one at a time so each trigger fires correctly
  INSERT INTO stock_purchases (org_id, raw_material_id, quantity, unit_cost, total_cost, gst_amount, purchase_date, invoice_number, supplier_name)
  VALUES (v_org_id, v_wheat,   200, 40,   8000,  400,    CURRENT_DATE - 30, 'PUR-001', 'Agro Supplies Ltd');

  INSERT INTO stock_purchases (org_id, raw_material_id, quantity, unit_cost, total_cost, gst_amount, purchase_date, invoice_number, supplier_name)
  VALUES (v_org_id, v_wheat,   150, 42,   6300,  315,    CURRENT_DATE - 10, 'PUR-008', 'Agro Supplies Ltd');

  INSERT INTO stock_purchases (org_id, raw_material_id, quantity, unit_cost, total_cost, gst_amount, purchase_date, invoice_number, supplier_name)
  VALUES (v_org_id, v_sugar,   100, 45,   4500,  225,    CURRENT_DATE - 28, 'PUR-002', 'Agro Supplies Ltd');

  INSERT INTO stock_purchases (org_id, raw_material_id, quantity, unit_cost, total_cost, gst_amount, purchase_date, invoice_number, supplier_name)
  VALUES (v_org_id, v_butter,  50,  480,  24000, 2880,   CURRENT_DATE - 25, 'PUR-003', 'Fresh Dairy Co');

  INSERT INTO stock_purchases (org_id, raw_material_id, quantity, unit_cost, total_cost, gst_amount, purchase_date, invoice_number, supplier_name)
  VALUES (v_org_id, v_eggs,    360, 6,    2160,  0,      CURRENT_DATE - 20, 'PUR-004', 'Farm Fresh Poultry');

  INSERT INTO stock_purchases (org_id, raw_material_id, quantity, unit_cost, total_cost, gst_amount, purchase_date, invoice_number, supplier_name)
  VALUES (v_org_id, v_cocoa,   25,  600,  15000, 2700,   CURRENT_DATE - 22, 'PUR-005', 'Choco Imports');

  INSERT INTO stock_purchases (org_id, raw_material_id, quantity, unit_cost, total_cost, gst_amount, purchase_date, invoice_number, supplier_name)
  VALUES (v_org_id, v_milk,    80,  55,   4400,  0,      CURRENT_DATE - 18, 'PUR-006', 'Fresh Dairy Co');

  INSERT INTO stock_purchases (org_id, raw_material_id, quantity, unit_cost, total_cost, gst_amount, purchase_date, invoice_number, supplier_name)
  VALUES (v_org_id, v_vanilla, 500, 3.5,  1750,  315,    CURRENT_DATE - 15, 'PUR-007', 'Spice World');

  INSERT INTO stock_purchases (org_id, raw_material_id, quantity, unit_cost, total_cost, gst_amount, purchase_date, invoice_number, supplier_name)
  VALUES (v_org_id, v_boxes,   500, 15,   7500,  900,    CURRENT_DATE - 12, 'PUR-009', 'PackPro India');

  -- ─── Finished Goods ──────────────────────────────────────────
  INSERT INTO finished_goods (org_id, name, sku, selling_price, gst_rate, unit_of_measurement, description)
  VALUES (v_org_id, 'Butter Cookies (250g)',     'FG-001', 180, 12, 'box', 'Premium butter cookies, 250g gift box')     RETURNING id INTO v_cookies;

  INSERT INTO finished_goods (org_id, name, sku, selling_price, gst_rate, unit_of_measurement, description)
  VALUES (v_org_id, 'Chocolate Cake (1kg)',      'FG-002', 650, 18, 'pcs', 'Rich chocolate cake with ganache')          RETURNING id INTO v_cake;

  INSERT INTO finished_goods (org_id, name, sku, selling_price, gst_rate, unit_of_measurement, description)
  VALUES (v_org_id, 'Vanilla Cupcakes (6 pack)', 'FG-003', 320, 12, 'box', 'Box of 6 vanilla cupcakes with frosting') RETURNING id INTO v_cupcakes;

  INSERT INTO finished_goods (org_id, name, sku, selling_price, gst_rate, unit_of_measurement, description)
  VALUES (v_org_id, 'Whole Wheat Bread',         'FG-004', 55,  0,  'pcs', 'Fresh baked whole wheat loaf (400g)')      RETURNING id INTO v_bread;

  INSERT INTO finished_goods (org_id, name, sku, selling_price, gst_rate, unit_of_measurement, description)
  VALUES (v_org_id, 'Brownie Box (4 pcs)',       'FG-005', 280, 12, 'box', 'Rich chocolate brownies, box of 4')       RETURNING id INTO v_brownies;

  -- ─── Bill of Materials (BOM) ─────────────────────────────────
  INSERT INTO bill_of_materials (org_id, finished_good_id, raw_material_id, quantity_per_unit, waste_percentage, notes) VALUES
    -- Butter Cookies
    (v_org_id, v_cookies,  v_wheat,   0.15, 3, 'Maida base'),
    (v_org_id, v_cookies,  v_sugar,   0.06, 2, NULL),
    (v_org_id, v_cookies,  v_butter,  0.10, 2, 'Unsalted butter'),
    (v_org_id, v_cookies,  v_eggs,    2,    5, NULL),
    (v_org_id, v_cookies,  v_vanilla, 5,    0, NULL),
    (v_org_id, v_cookies,  v_boxes,   1,    2, NULL),

    -- Chocolate Cake
    (v_org_id, v_cake, v_wheat,   0.30, 3, NULL),
    (v_org_id, v_cake, v_sugar,   0.20, 2, NULL),
    (v_org_id, v_cake, v_butter,  0.15, 3, NULL),
    (v_org_id, v_cake, v_eggs,    4,    5, NULL),
    (v_org_id, v_cake, v_cocoa,   0.08, 5, 'Premium cocoa'),
    (v_org_id, v_cake, v_milk,    0.25, 2, NULL),
    (v_org_id, v_cake, v_vanilla, 10,   0, NULL),
    (v_org_id, v_cake, v_boxes,   1,    2, NULL),

    -- Vanilla Cupcakes
    (v_org_id, v_cupcakes, v_wheat,   0.18, 3, NULL),
    (v_org_id, v_cupcakes, v_sugar,   0.12, 2, NULL),
    (v_org_id, v_cupcakes, v_butter,  0.08, 2, NULL),
    (v_org_id, v_cupcakes, v_eggs,    3,    5, NULL),
    (v_org_id, v_cupcakes, v_milk,    0.15, 2, NULL),
    (v_org_id, v_cupcakes, v_vanilla, 8,    0, NULL),
    (v_org_id, v_cupcakes, v_boxes,   1,    2, NULL),

    -- Whole Wheat Bread
    (v_org_id, v_bread, v_wheat,  0.40, 5, NULL),
    (v_org_id, v_bread, v_sugar,  0.02, 0, NULL),
    (v_org_id, v_bread, v_butter, 0.03, 2, NULL),
    (v_org_id, v_bread, v_milk,   0.20, 3, NULL),

    -- Brownie Box
    (v_org_id, v_brownies, v_wheat,  0.12, 3, NULL),
    (v_org_id, v_brownies, v_sugar,  0.10, 2, NULL),
    (v_org_id, v_brownies, v_butter, 0.12, 3, NULL),
    (v_org_id, v_brownies, v_eggs,   3,    5, NULL),
    (v_org_id, v_brownies, v_cocoa,  0.06, 5, 'For intense chocolate flavor'),
    (v_org_id, v_brownies, v_boxes,  1,    2, NULL);

  -- ─── Sales (insert one at a time so backflush trigger fires) ──
  INSERT INTO sales (org_id, finished_good_id, quantity, unit_price, total_amount, gst_amount, sale_date, customer_name, invoice_number)
  VALUES (v_org_id, v_cookies,  15, 180, 2700,  289.29, CURRENT_DATE - 14, 'Mehta Stores',      'INV-001');

  INSERT INTO sales (org_id, finished_good_id, quantity, unit_price, total_amount, gst_amount, sale_date, customer_name, invoice_number)
  VALUES (v_org_id, v_cake,     5,  650, 3250,  495.76, CURRENT_DATE - 12, 'Birthday Palace',    'INV-002');

  INSERT INTO sales (org_id, finished_good_id, quantity, unit_price, total_amount, gst_amount, sale_date, customer_name, invoice_number)
  VALUES (v_org_id, v_bread,    40, 55,  2200,  0,      CURRENT_DATE - 10, 'Green Grocers',      'INV-003');

  INSERT INTO sales (org_id, finished_good_id, quantity, unit_price, total_amount, gst_amount, sale_date, customer_name, invoice_number)
  VALUES (v_org_id, v_cupcakes, 8,  320, 2560,  274.29, CURRENT_DATE - 8,  'Café Mocha',         'INV-004');

  INSERT INTO sales (org_id, finished_good_id, quantity, unit_price, total_amount, gst_amount, sale_date, customer_name, invoice_number)
  VALUES (v_org_id, v_brownies, 10, 280, 2800,  300.00, CURRENT_DATE - 6,  'Sweet Tooth Shop',   'INV-005');

  INSERT INTO sales (org_id, finished_good_id, quantity, unit_price, total_amount, gst_amount, sale_date, customer_name, invoice_number)
  VALUES (v_org_id, v_cookies,  20, 175, 3500,  375.00, CURRENT_DATE - 4,  'Mehta Stores',       'INV-006');

  INSERT INTO sales (org_id, finished_good_id, quantity, unit_price, total_amount, gst_amount, sale_date, customer_name, invoice_number)
  VALUES (v_org_id, v_cake,     3,  650, 1950,  297.46, CURRENT_DATE - 2,  'Celebration Events',  'INV-007');

  INSERT INTO sales (org_id, finished_good_id, quantity, unit_price, total_amount, gst_amount, sale_date, customer_name, invoice_number)
  VALUES (v_org_id, v_bread,    25, 55,  1375,  0,      CURRENT_DATE - 1,  'Daily Needs Mart',   'INV-008');

  -- ─── Fixed Expenses ──────────────────────────────────────────
  INSERT INTO fixed_expenses (org_id, expense_name, category, monthly_amount, start_date) VALUES
    (v_org_id, 'Shop Rent',        'RENT',      25000, CURRENT_DATE - 365),
    (v_org_id, 'Baker Salary (2)', 'SALARY',    40000, CURRENT_DATE - 365),
    (v_org_id, 'Electricity Bill',  'UTILITIES', 8000,  CURRENT_DATE - 365),
    (v_org_id, 'Shop Insurance',   'INSURANCE', 2500,  CURRENT_DATE - 365);

  RAISE NOTICE '✅ Demo data created successfully for org: %', v_org_id;
END $$;

-- ============================================================
-- DONE! You can now log in with:
--   Email:    demo@profitpulse.com
--   Password: demo123456
-- ============================================================
