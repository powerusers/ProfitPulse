import { SupabaseClient } from '@supabase/supabase-js';
import type { GstLiabilityReport } from '@/lib/types';

export async function calculateGstLiability(
  supabase: SupabaseClient,
  orgId: string,
  startDate: string,
  endDate: string
): Promise<GstLiabilityReport | null> {
  try {
    // Output GST from sales
    const { data: sales } = await supabase
      .from('sales')
      .select('total_amount, gst_amount')
      .eq('org_id', orgId)
      .gte('sale_date', startDate)
      .lte('sale_date', endDate);

    const totalSales = sales?.reduce((s, r) => s + (r.total_amount || 0), 0) || 0;
    const gstCollected = sales?.reduce((s, r) => s + (r.gst_amount || 0), 0) || 0;

    // Input GST from purchases
    const { data: purchases } = await supabase
      .from('stock_purchases')
      .select('total_cost, gst_amount')
      .eq('org_id', orgId)
      .gte('purchase_date', startDate)
      .lte('purchase_date', endDate);

    const totalPurchases = purchases?.reduce((s, r) => s + (r.total_cost || 0), 0) || 0;
    const gstPaid = purchases?.reduce((s, r) => s + (r.gst_amount || 0), 0) || 0;

    return {
      period: { startDate, endDate },
      outputGst: { totalSales, gstCollected },
      inputGst: { totalPurchases, gstPaid },
      netGstPayable: gstCollected - gstPaid,
    };
  } catch (error) {
    console.error('GST calculation error:', error);
    return null;
  }
}
