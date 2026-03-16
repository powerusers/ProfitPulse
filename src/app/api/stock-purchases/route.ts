import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireOrganization } from '@/lib/supabase/auth';


// GET /api/stock-purchases — list purchases
export async function GET(req: NextRequest) {
  try {
    const org = await requireOrganization();
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const materialId = searchParams.get('material_id');

    let query = supabase
      .from('stock_purchases')
      .select(`*, raw_materials (id, name, unit_of_measurement)`)
      .eq('org_id', org.id)
      .order('purchase_date', { ascending: false })
      .limit(50);

    if (materialId) query = query.eq('raw_material_id', materialId);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

// POST /api/stock-purchases — add stock purchase
export async function POST(req: NextRequest) {
  try {
    const org = await requireOrganization();
    const supabase = await createClient();
    const body = await req.json();

    const quantity = Number(body.quantity);
    const unitCost = Number(body.unit_cost);
    const totalCost = quantity * unitCost;

    // Calculate GST amount if material has a GST rate
    let gstAmount = 0;
    if (body.gst_rate) {
      gstAmount = totalCost * (Number(body.gst_rate) / 100);
    }

    // Insert purchase record
    const { data: purchase, error } = await supabase
      .from('stock_purchases')
      .insert({
        org_id: org.id,
        raw_material_id: body.raw_material_id,
        quantity,
        unit_cost: unitCost,
        total_cost: totalCost,
        gst_amount: gstAmount || null,
        purchase_date: body.purchase_date,
        invoice_number: body.invoice_number || null,
        supplier_name: body.supplier_name || null,
        notes: body.notes || null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json(purchase, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
