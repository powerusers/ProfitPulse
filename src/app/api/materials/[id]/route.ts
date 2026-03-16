import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireOrganization } from '@/lib/supabase/auth';

// GET /api/materials/:id
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const org = await requireOrganization();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('raw_materials')
      .select('*')
      .eq('id', params.id)
      .eq('org_id', org.id)
      .single();

    if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

// PUT /api/materials/:id
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const org = await requireOrganization();
    const supabase = await createClient();
    const body = await req.json();

    const { data, error } = await supabase
      .from('raw_materials')
      .update({
        name: body.name,
        sku: body.sku || null,
        unit_of_measurement: body.unit_of_measurement,
        reorder_level: body.reorder_level ?? null,
        reorder_quantity: body.reorder_quantity ?? null,
        gst_rate: body.gst_rate ?? null,
        supplier_name: body.supplier_name || null,
        notes: body.notes || null,
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

// DELETE /api/materials/:id (soft delete)
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const org = await requireOrganization();
    const supabase = await createClient();

    const { error } = await supabase
      .from('raw_materials')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .eq('org_id', org.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
