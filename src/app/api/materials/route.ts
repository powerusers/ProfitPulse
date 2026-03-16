import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireOrganization } from '@/lib/supabase/auth';

// GET /api/materials — list all raw materials for the org
export async function GET() {
  try {
    const org = await requireOrganization();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('raw_materials')
      .select('*')
      .eq('org_id', org.id)
      .eq('is_active', true)
      .order('name');

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

// POST /api/materials — create a new raw material
export async function POST(req: NextRequest) {
  try {
    const org = await requireOrganization();
    const supabase = await createClient();
    const body = await req.json();

    const { data, error } = await supabase
      .from('raw_materials')
      .insert({
        org_id: org.id,
        name: body.name,
        sku: body.sku || null,
        unit_of_measurement: body.unit_of_measurement,
        current_quantity: 0,
        weighted_avg_cost: 0,
        reorder_level: body.reorder_level ?? null,
        reorder_quantity: body.reorder_quantity ?? null,
        gst_rate: body.gst_rate ?? null,
        supplier_name: body.supplier_name || null,
        notes: body.notes || null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
