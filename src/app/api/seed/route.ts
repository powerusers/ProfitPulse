import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireOrganization } from '@/lib/supabase/auth';

// POST /api/seed — populate demo data for the current user
export async function POST() {
  try {
    const org = await requireOrganization();
    const supabase = await createClient();

    // ─── Check if data already exists ──────────────────────────
    const { data: existingMaterials } = await supabase
      .from('raw_materials')
      .select('id')
      .eq('org_id', org.id)
      .limit(1);

    if (existingMaterials && existingMaterials.length > 0) {
      return NextResponse.json(
        { error: 'Demo data already exists. Delete existing data first or use a fresh account.' },
        { status: 400 }
      );
    }

    // ─── 1. Create Raw Materials ───────────────────────────────
    const materialsData = [
      { name: 'Wheat Flour',     sku: 'RM-001', unit_of_measurement: 'kg',  reorder_level: 50,  reorder_quantity: 200, gst_rate: 5,   supplier_name: 'Agro Supplies Ltd' },
      { name: 'Sugar',           sku: 'RM-002', unit_of_measurement: 'kg',  reorder_level: 30,  reorder_quantity: 100, gst_rate: 5,   supplier_name: 'Agro Supplies Ltd' },
      { name: 'Butter',          sku: 'RM-003', unit_of_measurement: 'kg',  reorder_level: 10,  reorder_quantity: 50,  gst_rate: 12,  supplier_name: 'Fresh Dairy Co' },
      { name: 'Eggs',            sku: 'RM-004', unit_of_measurement: 'pcs', reorder_level: 60,  reorder_quantity: 180, gst_rate: 0,   supplier_name: 'Farm Fresh Poultry' },
      { name: 'Cocoa Powder',    sku: 'RM-005', unit_of_measurement: 'kg',  reorder_level: 5,   reorder_quantity: 25,  gst_rate: 18,  supplier_name: 'Choco Imports' },
      { name: 'Milk',            sku: 'RM-006', unit_of_measurement: 'l',   reorder_level: 20,  reorder_quantity: 80,  gst_rate: 0,   supplier_name: 'Fresh Dairy Co' },
      { name: 'Vanilla Extract', sku: 'RM-007', unit_of_measurement: 'ml',  reorder_level: 100, reorder_quantity: 500, gst_rate: 18,  supplier_name: 'Spice World' },
      { name: 'Packaging Boxes', sku: 'RM-008', unit_of_measurement: 'pcs', reorder_level: 100, reorder_quantity: 500, gst_rate: 12,  supplier_name: 'PackPro India' },
    ];

    const { data: materials, error: matError } = await supabase
      .from('raw_materials')
      .insert(materialsData.map(m => ({ ...m, org_id: org.id })))
      .select();

    if (matError || !materials) {
      return NextResponse.json({ error: 'Failed to create materials: ' + matError?.message }, { status: 500 });
    }

    // Build a lookup map by SKU
    const matMap: Record<string, string> = {};
    materials.forEach(m => { matMap[m.sku] = m.id; });

    // ─── 2. Create Stock Purchases (adds inventory) ────────────
    // The DB trigger will auto-update current_quantity and weighted_avg_cost
    const today = new Date();
    const daysAgo = (n: number) => {
      const d = new Date(today);
      d.setDate(d.getDate() - n);
      return d.toISOString().split('T')[0];
    };

    const purchasesData = [
      { raw_material_id: matMap['RM-001'], quantity: 200, unit_cost: 40,   purchase_date: daysAgo(30), invoice_number: 'PUR-001', supplier_name: 'Agro Supplies Ltd' },
      { raw_material_id: matMap['RM-001'], quantity: 150, unit_cost: 42,   purchase_date: daysAgo(10), invoice_number: 'PUR-008', supplier_name: 'Agro Supplies Ltd' },
      { raw_material_id: matMap['RM-002'], quantity: 100, unit_cost: 45,   purchase_date: daysAgo(28), invoice_number: 'PUR-002', supplier_name: 'Agro Supplies Ltd' },
      { raw_material_id: matMap['RM-003'], quantity: 50,  unit_cost: 480,  purchase_date: daysAgo(25), invoice_number: 'PUR-003', supplier_name: 'Fresh Dairy Co' },
      { raw_material_id: matMap['RM-004'], quantity: 360, unit_cost: 6,    purchase_date: daysAgo(20), invoice_number: 'PUR-004', supplier_name: 'Farm Fresh Poultry' },
      { raw_material_id: matMap['RM-005'], quantity: 25,  unit_cost: 600,  purchase_date: daysAgo(22), invoice_number: 'PUR-005', supplier_name: 'Choco Imports' },
      { raw_material_id: matMap['RM-006'], quantity: 80,  unit_cost: 55,   purchase_date: daysAgo(18), invoice_number: 'PUR-006', supplier_name: 'Fresh Dairy Co' },
      { raw_material_id: matMap['RM-007'], quantity: 500, unit_cost: 3.5,  purchase_date: daysAgo(15), invoice_number: 'PUR-007', supplier_name: 'Spice World' },
      { raw_material_id: matMap['RM-008'], quantity: 500, unit_cost: 15,   purchase_date: daysAgo(12), invoice_number: 'PUR-009', supplier_name: 'PackPro India' },
    ];

    // Insert purchases one by one so DB trigger fires for each
    for (const p of purchasesData) {
      const totalCost = p.quantity * p.unit_cost;
      const material = materialsData.find(m => matMap[m.sku] === p.raw_material_id);
      const gstAmt = material ? totalCost * (material.gst_rate / 100) : 0;

      await supabase.from('stock_purchases').insert({
        org_id: org.id,
        raw_material_id: p.raw_material_id,
        quantity: p.quantity,
        unit_cost: p.unit_cost,
        total_cost: totalCost,
        gst_amount: gstAmt,
        purchase_date: p.purchase_date,
        invoice_number: p.invoice_number,
        supplier_name: p.supplier_name,
      });
    }

    // ─── 3. Create Finished Goods ──────────────────────────────
    const productsData = [
      { name: 'Butter Cookies (250g)',     sku: 'FG-001', selling_price: 180,  gst_rate: 12, unit_of_measurement: 'box', description: 'Premium butter cookies, 250g gift box' },
      { name: 'Chocolate Cake (1kg)',      sku: 'FG-002', selling_price: 650,  gst_rate: 18, unit_of_measurement: 'pcs', description: 'Rich chocolate cake with ganache' },
      { name: 'Vanilla Cupcakes (6 pack)', sku: 'FG-003', selling_price: 320,  gst_rate: 12, unit_of_measurement: 'box', description: 'Box of 6 vanilla cupcakes with frosting' },
      { name: 'Whole Wheat Bread',         sku: 'FG-004', selling_price: 55,   gst_rate: 0,  unit_of_measurement: 'pcs', description: 'Fresh baked whole wheat loaf (400g)' },
      { name: 'Brownie Box (4 pcs)',       sku: 'FG-005', selling_price: 280,  gst_rate: 12, unit_of_measurement: 'box', description: 'Rich chocolate brownies, box of 4' },
    ];

    const { data: products, error: prodError } = await supabase
      .from('finished_goods')
      .insert(productsData.map(p => ({ ...p, org_id: org.id })))
      .select();

    if (prodError || !products) {
      return NextResponse.json({ error: 'Failed to create products: ' + prodError?.message }, { status: 500 });
    }

    const prodMap: Record<string, string> = {};
    products.forEach(p => { prodMap[p.sku] = p.id; });

    // ─── 4. Create Bill of Materials ───────────────────────────
    const bomData = [
      // Butter Cookies (250g) — FG-001
      { finished_good_id: prodMap['FG-001'], raw_material_id: matMap['RM-001'], quantity_per_unit: 0.15,  waste_percentage: 3, notes: 'Maida base' },
      { finished_good_id: prodMap['FG-001'], raw_material_id: matMap['RM-002'], quantity_per_unit: 0.06,  waste_percentage: 2 },
      { finished_good_id: prodMap['FG-001'], raw_material_id: matMap['RM-003'], quantity_per_unit: 0.10,  waste_percentage: 2, notes: 'Unsalted butter' },
      { finished_good_id: prodMap['FG-001'], raw_material_id: matMap['RM-004'], quantity_per_unit: 2,     waste_percentage: 5 },
      { finished_good_id: prodMap['FG-001'], raw_material_id: matMap['RM-007'], quantity_per_unit: 5,     waste_percentage: 0 },
      { finished_good_id: prodMap['FG-001'], raw_material_id: matMap['RM-008'], quantity_per_unit: 1,     waste_percentage: 2 },

      // Chocolate Cake (1kg) — FG-002
      { finished_good_id: prodMap['FG-002'], raw_material_id: matMap['RM-001'], quantity_per_unit: 0.30,  waste_percentage: 3 },
      { finished_good_id: prodMap['FG-002'], raw_material_id: matMap['RM-002'], quantity_per_unit: 0.20,  waste_percentage: 2 },
      { finished_good_id: prodMap['FG-002'], raw_material_id: matMap['RM-003'], quantity_per_unit: 0.15,  waste_percentage: 3 },
      { finished_good_id: prodMap['FG-002'], raw_material_id: matMap['RM-004'], quantity_per_unit: 4,     waste_percentage: 5 },
      { finished_good_id: prodMap['FG-002'], raw_material_id: matMap['RM-005'], quantity_per_unit: 0.08,  waste_percentage: 5, notes: 'Premium cocoa' },
      { finished_good_id: prodMap['FG-002'], raw_material_id: matMap['RM-006'], quantity_per_unit: 0.25,  waste_percentage: 2 },
      { finished_good_id: prodMap['FG-002'], raw_material_id: matMap['RM-007'], quantity_per_unit: 10,    waste_percentage: 0 },
      { finished_good_id: prodMap['FG-002'], raw_material_id: matMap['RM-008'], quantity_per_unit: 1,     waste_percentage: 2 },

      // Vanilla Cupcakes (6 pack) — FG-003
      { finished_good_id: prodMap['FG-003'], raw_material_id: matMap['RM-001'], quantity_per_unit: 0.18,  waste_percentage: 3 },
      { finished_good_id: prodMap['FG-003'], raw_material_id: matMap['RM-002'], quantity_per_unit: 0.12,  waste_percentage: 2 },
      { finished_good_id: prodMap['FG-003'], raw_material_id: matMap['RM-003'], quantity_per_unit: 0.08,  waste_percentage: 2 },
      { finished_good_id: prodMap['FG-003'], raw_material_id: matMap['RM-004'], quantity_per_unit: 3,     waste_percentage: 5 },
      { finished_good_id: prodMap['FG-003'], raw_material_id: matMap['RM-006'], quantity_per_unit: 0.15,  waste_percentage: 2 },
      { finished_good_id: prodMap['FG-003'], raw_material_id: matMap['RM-007'], quantity_per_unit: 8,     waste_percentage: 0 },
      { finished_good_id: prodMap['FG-003'], raw_material_id: matMap['RM-008'], quantity_per_unit: 1,     waste_percentage: 2 },

      // Whole Wheat Bread — FG-004
      { finished_good_id: prodMap['FG-004'], raw_material_id: matMap['RM-001'], quantity_per_unit: 0.40,  waste_percentage: 5 },
      { finished_good_id: prodMap['FG-004'], raw_material_id: matMap['RM-002'], quantity_per_unit: 0.02,  waste_percentage: 0 },
      { finished_good_id: prodMap['FG-004'], raw_material_id: matMap['RM-003'], quantity_per_unit: 0.03,  waste_percentage: 2 },
      { finished_good_id: prodMap['FG-004'], raw_material_id: matMap['RM-006'], quantity_per_unit: 0.20,  waste_percentage: 3 },

      // Brownie Box (4 pcs) — FG-005
      { finished_good_id: prodMap['FG-005'], raw_material_id: matMap['RM-001'], quantity_per_unit: 0.12,  waste_percentage: 3 },
      { finished_good_id: prodMap['FG-005'], raw_material_id: matMap['RM-002'], quantity_per_unit: 0.10,  waste_percentage: 2 },
      { finished_good_id: prodMap['FG-005'], raw_material_id: matMap['RM-003'], quantity_per_unit: 0.12,  waste_percentage: 3 },
      { finished_good_id: prodMap['FG-005'], raw_material_id: matMap['RM-004'], quantity_per_unit: 3,     waste_percentage: 5 },
      { finished_good_id: prodMap['FG-005'], raw_material_id: matMap['RM-005'], quantity_per_unit: 0.06,  waste_percentage: 5, notes: 'For intense chocolate flavor' },
      { finished_good_id: prodMap['FG-005'], raw_material_id: matMap['RM-008'], quantity_per_unit: 1,     waste_percentage: 2 },
    ];

    const { error: bomError } = await supabase
      .from('bill_of_materials')
      .insert(bomData.map(b => ({ ...b, org_id: org.id })));

    if (bomError) {
      return NextResponse.json({ error: 'Failed to create BOM: ' + bomError.message }, { status: 500 });
    }

    // ─── 5. Create some Sales (triggers auto-backflush) ────────
    const salesData = [
      { finished_good_id: prodMap['FG-001'], quantity: 15, unit_price: 180, sale_date: daysAgo(14), customer_name: 'Mehta Stores',     invoice_number: 'INV-001' },
      { finished_good_id: prodMap['FG-002'], quantity: 5,  unit_price: 650, sale_date: daysAgo(12), customer_name: 'Birthday Palace',   invoice_number: 'INV-002' },
      { finished_good_id: prodMap['FG-004'], quantity: 40, unit_price: 55,  sale_date: daysAgo(10), customer_name: 'Green Grocers',     invoice_number: 'INV-003' },
      { finished_good_id: prodMap['FG-003'], quantity: 8,  unit_price: 320, sale_date: daysAgo(8),  customer_name: 'Café Mocha',        invoice_number: 'INV-004' },
      { finished_good_id: prodMap['FG-005'], quantity: 10, unit_price: 280, sale_date: daysAgo(6),  customer_name: 'Sweet Tooth Shop',  invoice_number: 'INV-005' },
      { finished_good_id: prodMap['FG-001'], quantity: 20, unit_price: 175, sale_date: daysAgo(4),  customer_name: 'Mehta Stores',      invoice_number: 'INV-006' },
      { finished_good_id: prodMap['FG-002'], quantity: 3,  unit_price: 650, sale_date: daysAgo(2),  customer_name: 'Celebration Events', invoice_number: 'INV-007' },
      { finished_good_id: prodMap['FG-004'], quantity: 25, unit_price: 55,  sale_date: daysAgo(1),  customer_name: 'Daily Needs Mart',  invoice_number: 'INV-008' },
    ];

    // Insert sales one by one so backflush trigger fires
    for (const s of salesData) {
      const totalAmount = s.quantity * s.unit_price;
      const product = productsData.find(p => prodMap[p.sku] === s.finished_good_id);
      const gstAmt = product ? totalAmount * (product.gst_rate / (100 + product.gst_rate)) : 0;

      await supabase.from('sales').insert({
        org_id: org.id,
        finished_good_id: s.finished_good_id,
        quantity: s.quantity,
        unit_price: s.unit_price,
        total_amount: totalAmount,
        gst_amount: gstAmt,
        sale_date: s.sale_date,
        customer_name: s.customer_name,
        invoice_number: s.invoice_number,
      });
    }

    // ─── 6. Create Fixed Expenses ──────────────────────────────
    const expensesData = [
      { expense_name: 'Shop Rent',        category: 'RENT',      monthly_amount: 25000, start_date: daysAgo(365) },
      { expense_name: 'Baker Salary (2)', category: 'SALARY',    monthly_amount: 40000, start_date: daysAgo(365) },
      { expense_name: 'Electricity Bill',  category: 'UTILITIES', monthly_amount: 8000,  start_date: daysAgo(365) },
      { expense_name: 'Shop Insurance',   category: 'INSURANCE', monthly_amount: 2500,  start_date: daysAgo(365) },
    ];

    await supabase
      .from('fixed_expenses')
      .insert(expensesData.map(e => ({ ...e, org_id: org.id })));

    // ─── Done ──────────────────────────────────────────────────
    return NextResponse.json({
      success: true,
      message: 'Demo data created successfully!',
      summary: {
        materials: materials.length,
        products: products.length,
        bomLines: bomData.length,
        purchases: purchasesData.length,
        sales: salesData.length,
        expenses: expensesData.length,
      },
    });
  } catch (err) {
    console.error('Seed error:', err);
    return NextResponse.json({ error: 'Unauthorized or server error' }, { status: 401 });
  }
}
