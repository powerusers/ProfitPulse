import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireOrganization } from '@/lib/supabase/auth';

export async function GET() {
  try {
    const org = await requireOrganization();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('fixed_expenses')
      .select('*')
      .eq('org_id', org.id)
      .order('expense_name');

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const org = await requireOrganization();
    const supabase = await createClient();
    const body = await req.json();

    const { data, error } = await supabase
      .from('fixed_expenses')
      .insert({
        org_id: org.id,
        expense_name: body.expense_name,
        category: body.category,
        monthly_amount: body.monthly_amount,
        start_date: body.start_date || null,
        end_date: body.end_date || null,
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
