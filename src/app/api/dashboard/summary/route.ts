import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireOrganization } from '@/lib/supabase/auth';
import { calculateProfitLoss } from '@/lib/business-logic/profit-loss';
import { calculateGstLiability } from '@/lib/business-logic/gst-liability';
import { getLowStockAlerts } from '@/lib/business-logic/low-stock-alerts';

export async function GET() {
  try {
    const org = await requireOrganization();
    const supabase = await createClient();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    const today = now.toISOString().split('T')[0];

    // Current month P&L
    const pnl = await calculateProfitLoss(supabase, org.id, startOfMonth, today);

    // Previous month for comparison
    const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
    const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
    const prevPnl = await calculateProfitLoss(supabase, org.id, prevStart, prevEnd);

    // GST
    const gst = await calculateGstLiability(supabase, org.id, startOfMonth, today);

    // Low stock
    const alerts = await getLowStockAlerts(supabase, org.id);

    // Revenue change %
    const currentRevenue = pnl?.revenue.gross || 0;
    const prevRevenue = prevPnl?.revenue.gross || 0;
    const revenueChange = prevRevenue > 0
      ? ((currentRevenue - prevRevenue) / prevRevenue) * 100
      : 0;

    // 7-day revenue trend
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const { data: recentSales } = await supabase
      .from('sales')
      .select('sale_date, total_amount, gst_amount')
      .eq('org_id', org.id)
      .gte('sale_date', sevenDaysAgo.toISOString().split('T')[0])
      .lte('sale_date', today)
      .order('sale_date');

    // Group by date
    const revenueByDate: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      revenueByDate[d.toISOString().split('T')[0]] = 0;
    }
    for (const s of recentSales || []) {
      if (revenueByDate[s.sale_date] !== undefined) {
        revenueByDate[s.sale_date] += s.total_amount || 0;
      }
    }
    const revenueTrend = Object.entries(revenueByDate).map(([date, revenue]) => ({
      date,
      revenue,
      cogs: 0,
      profit: 0,
    }));

    return NextResponse.json({
      summary: {
        netProfit: pnl?.netProfit || 0,
        totalRevenue: currentRevenue,
        totalCogs: pnl?.cogs.totalCogs || 0,
        gstLiability: gst?.netGstPayable || 0,
        lowStockCount: alerts.length,
        revenueChange,
        profitMargin: pnl?.profitMargin || 0,
      },
      revenueTrend,
      lowStockAlerts: alerts,
      period: { startDate: startOfMonth, endDate: today },
    });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
