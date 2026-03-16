import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireOrganization } from '@/lib/supabase/auth';

// GET /api/products — list all finished goods with their BOM
export async function GET() {
  try {
    const org = await requireOrganization();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('finished_goods')
      .select(`
        *,
        bill_of_materials (
          id,
          raw_material_id,
          quantity_per_unit,
          waste_percentage,
          notes,
          raw_materials (id, name, unit_of_measurement, current_quantity, weighted_avg_cost)
        )
      `)
      .eq('org_id', org.id)
      .eq('is_active', true)
      .order('name');

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

// POST /api/products — create a finished good
export async function POST(req: NextRequest) {
  try {
    const org = await requireOrganization();
    const supabase = await createClient();
    const body = await req.json();

    const { data, error } = await supabase
      .from('finished_goods')
      .insert({
        org_id: org.id,
        name: body.name,
        sku: body.sku || null,
        selling_price: body.selling_price,
        gst_rate: body.gst_rate ?? null,
        unit_of_measurement: body.unit_of_measurement || null,
        description: body.description || null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
