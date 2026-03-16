import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireOrganization } from '@/lib/supabase/auth';
import { calculateProfitLoss } from '@/lib/business-logic/profit-loss';

export async function GET(req: NextRequest) {
  try {
    const org = await requireOrganization();
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);

    const now = new Date();
    const startDate = searchParams.get('start_date') ||
      new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endDate = searchParams.get('end_date') ||
      now.toISOString().split('T')[0];

    const report = await calculateProfitLoss(supabase, org.id, startDate, endDate);
    if (!report) return NextResponse.json({ error: 'Calculation failed' }, { status: 500 });
    return NextResponse.json(report);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
