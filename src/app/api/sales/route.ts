import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireOrganization } from '@/lib/supabase/auth';


// GET /api/sales — list sales
export async function GET(req: NextRequest) {
  try {
    const org = await requireOrganization();
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get('limit') || 50);

    const { data, error } = await supabase
      .from('sales')
      .select(`*, finished_goods (id, name, sku, selling_price)`)
      .eq('org_id', org.id)
      .order('sale_date', { ascending: false })
      .limit(limit);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

// POST /api/sales — log a sale with finished goods deduction
export async function POST(req: NextRequest) {
  try {
    const org = await requireOrganization();
    const supabase = await createClient();
    const body = await req.json();

    const quantity = Number(body.quantity);
    const unitPrice = Number(body.unit_price);
    const totalAmount = quantity * unitPrice;

    // Calculate GST
    let gstAmount = 0;
    if (body.gst_rate) {
      gstAmount = totalAmount * (Number(body.gst_rate) / (100 + Number(body.gst_rate)));
    }

    // Insert sale
    const { data: sale, error } = await supabase
      .from('sales')
      .insert({
        org_id: org.id,
        finished_good_id: body.finished_good_id,
        quantity,
        unit_price: unitPrice,
        total_amount: totalAmount,
        gst_amount: gstAmount || null,
        sale_date: body.sale_date,
        invoice_number: body.invoice_number || null,
        customer_name: body.customer_name || null,
        notes: body.notes || null,
        is_backflushed: false,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({
      sale,
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
