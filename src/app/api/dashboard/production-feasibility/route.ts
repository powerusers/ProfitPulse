import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireOrganization } from '@/lib/supabase/auth';
import { calculateProductionFeasibility } from '@/lib/business-logic/production-feasibility';

export async function GET() {
  try {
    const org = await requireOrganization();
    const supabase = await createClient();
    const report = await calculateProductionFeasibility(supabase, org.id);
    return NextResponse.json(report);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
