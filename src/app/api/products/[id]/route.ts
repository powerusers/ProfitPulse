import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireOrganization } from '@/lib/supabase/auth';

// GET /api/products/:id — single product with BOM
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
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
      .eq('id', params.id)
      .eq('org_id', org.id)
      .single();

    if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

// PUT /api/products/:id
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const org = await requireOrganization();
    const supabase = await createClient();
    const body = await req.json();

    const { data, error } = await supabase
      .from('finished_goods')
      .update({
        name: body.name,
        sku: body.sku || null,
        selling_price: body.selling_price,
        gst_rate: body.gst_rate ?? null,
        unit_of_measurement: body.unit_of_measurement || null,
        description: body.description || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .eq('org_id', org.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

// DELETE /api/products/:id (soft delete)
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const org = await requireOrganization();
    const supabase = await createClient();

    const { error } = await supabase
      .from('finished_goods')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .eq('org_id', org.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
