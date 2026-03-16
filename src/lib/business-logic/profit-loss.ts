import { SupabaseClient } from '@supabase/supabase-js';
import type { ProfitLossReport } from '@/lib/types';

export async function calculateProfitLoss(
  supabase: SupabaseClient,
  orgId: string,
  startDate: string,
  endDate: string
): Promise<ProfitLossReport | null> {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysCount = Math.ceil((end.getTime() - start.getTime()) / (86400000)) + 1;

    // 1. Revenue from sales
    const { data: salesData } = await supabase
      .from('sales')
      .select('id, finished_good_id, quantity, total_amount, gst_amount')
      .eq('org_id', orgId)
      .gte('sale_date', startDate)
      .lte('sale_date', endDate);

    const grossRevenue = salesData?.reduce((sum, s) => sum + (s.total_amount || 0), 0) || 0;
    const totalOutputGst = salesData?.reduce((sum, s) => sum + (s.gst_amount || 0), 0) || 0;
    const netRevenue = grossRevenue - totalOutputGst;

    // 2. Calculate COGS from inventory transactions
    const { data: deductions } = await supabase
      .from('inventory_transactions')
      .select('raw_material_id, quantity_change, raw_materials(weighted_avg_cost)')
      .eq('org_id', orgId)
      .eq('transaction_type', 'SALE_DEDUCTION')
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate);

    let totalCogs = 0;
    for (const d of deductions || []) {
      const cost = (d as any).raw_materials?.weighted_avg_cost || 0;
      totalCogs += Math.abs(d.quantity_change) * cost;
    }

    const grossProfit = netRevenue - totalCogs;

    // 3. Pro-rated fixed expenses
    const { data: expenses } = await supabase
      .from('fixed_expenses')
      .select('expense_name, category, monthly_amount, start_date, end_date')
      .eq('org_id', orgId);

    let totalFixedExpenses = 0;
    const expenseDetails: Array<{ name: string; amount: number }> = [];

    for (const exp of expenses || []) {
      const expStart = exp.start_date ? new Date(exp.start_date) : start;
      const expEnd = exp.end_date ? new Date(exp.end_date) : end;

      if (expEnd >= start && expStart <= end) {
        const effectiveStart = new Date(Math.max(expStart.getTime(), start.getTime()));
        const effectiveEnd = new Date(Math.min(expEnd.getTime(), end.getTime()));
        const daysApplicable = Math.ceil((effectiveEnd.getTime() - effectiveStart.getTime()) / 86400000) + 1;
        const dailyAmount = exp.monthly_amount / 30;
        const proratedAmount = dailyAmount * daysApplicable;

        totalFixedExpenses += proratedAmount;
        expenseDetails.push({ name: exp.expense_name, amount: proratedAmount });
      }
    }

    const netProfit = grossProfit - totalFixedExpenses;
    const profitMargin = netRevenue > 0 ? (netProfit / netRevenue) * 100 : 0;

    return {
      period: { startDate, endDate, daysCount },
      revenue: { gross: grossRevenue, gstAmount: totalOutputGst, netRevenue },
      cogs: { totalCogs },
      grossProfit,
      expenses: { fixedExpenses: totalFixedExpenses, details: expenseDetails },
      netProfit,
      profitMargin,
    };
  } catch (error) {
    console.error('P&L calculation error:', error);
    return null;
  }
}
