import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireOrganization } from '@/lib/supabase/auth';

// GET /api/production-runs — list production runs
export async function GET(req: NextRequest) {
  try {
    const org = await requireOrganization();
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('product_id');

    let query = supabase
      .from('production_runs')
      .select(`*, finished_goods (id, name, sku, unit_of_measurement)`)
      .eq('org_id', org.id)
      .order('production_date', { ascending: false })
      .limit(50);

    if (productId) query = query.eq('finished_good_id', productId);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

// POST /api/production-runs — record a production run
export async function POST(req: NextRequest) {
  try {
    const org = await requireOrganization();
    const supabase = await createClient();
    const body = await req.json();

    const quantityProduced = Number(body.quantity_produced);

    // Insert production run record
    // The database trigger will handle deducting raw materials and adding to finished goods stock
    const { data: run, error } = await supabase
      .from('production_runs')
      .insert({
        org_id: org.id,
        finished_good_id: body.finished_good_id,
        quantity_produced: quantityProduced,
        production_date: body.production_date,
        notes: body.notes || null,
      })
      .select(`*, finished_goods (id, name)`)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json(run, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
