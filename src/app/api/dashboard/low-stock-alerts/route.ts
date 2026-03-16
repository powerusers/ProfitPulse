import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireOrganization } from '@/lib/supabase/auth';
import { getLowStockAlerts } from '@/lib/business-logic/low-stock-alerts';

export async function GET() {
  try {
    const org = await requireOrganization();
    const supabase = await createClient();
    const alerts = await getLowStockAlerts(supabase, org.id);
    return NextResponse.json(alerts);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
