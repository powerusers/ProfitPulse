import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireOrganization } from '@/lib/supabase/auth';

// GET /api/products/:id/bom — get BOM lines for a product
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const org = await requireOrganization();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('bill_of_materials')
      .select(`
        *,
        raw_materials (id, name, unit_of_measurement, current_quantity, weighted_avg_cost)
      `)
      .eq('finished_good_id', params.id)
      .eq('org_id', org.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

// POST /api/products/:id/bom — replace entire BOM for a product
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const org = await requireOrganization();
    const supabase = await createClient();
    const body = await req.json();
    const lines: Array<{
      raw_material_id: string;
      quantity_per_unit: number;
      waste_percentage: number;
      notes?: string;
    }> = body.lines || [];

    // Delete existing BOM lines for this product
    await supabase
      .from('bill_of_materials')
      .delete()
      .eq('finished_good_id', params.id)
      .eq('org_id', org.id);

    if (lines.length === 0) {
      return NextResponse.json({ success: true, lines: [] });
    }

    // Insert new BOM lines
    const inserts = lines.map((line) => ({
      org_id: org.id,
      finished_good_id: params.id,
      raw_material_id: line.raw_material_id,
      quantity_per_unit: line.quantity_per_unit,
      waste_percentage: line.waste_percentage || 0,
      notes: line.notes || null,
    }));

    const { data, error } = await supabase
      .from('bill_of_materials')
      .insert(inserts)
      .select(`
        *,
        raw_materials (id, name, unit_of_measurement)
      `);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true, lines: data });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
