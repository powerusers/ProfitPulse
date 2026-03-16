'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import MetricCard from '@/components/dashboard/MetricCard';
import NetProfitCard from '@/components/dashboard/NetProfitCard';
import TaxLiabilityCard from '@/components/dashboard/TaxLiabilityCard';
import QuickActionButtons from '@/components/dashboard/QuickActionButtons';
import LowStockAlerts from '@/components/dashboard/LowStockAlerts';
import RevenueChart from '@/components/dashboard/RevenueChart';
import ProductionFeasibility from '@/components/dashboard/ProductionFeasibility';
import type { DashboardSummary, LowStockAlert, RevenueDataPoint } from '@/lib/types';

interface DashboardData {
  summary: DashboardSummary;
  revenueTrend: RevenueDataPoint[];
  lowStockAlerts: LowStockAlert[];
  period: { startDate: string; endDate: string };
}

interface FeasibilityData {
  perProduct: any[];
  optimizedPlan: any;
  totalMaterialsValue: number;
  totalPotentialRevenue: number;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [feasibility, setFeasibility] = useState<FeasibilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [feasibilityLoading, setFeasibilityLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [hasData, setHasData] = useState(true);

  const fetchAll = useCallback(() => {
    setLoading(true);
    setFeasibilityLoading(true);

    fetch('/api/dashboard/summary')
      .then(res => res.ok ? res.json() : null)
      .then(json => {
        setData(json);
        // Check if there's any real data
        if (json && json.summary.totalRevenue === 0 && json.lowStockAlerts.length === 0) {
          setHasData(false);
        } else {
          setHasData(true);
        }
      })
      .catch(err => console.error('Dashboard fetch error:', err))
      .finally(() => setLoading(false));

    fetch('/api/dashboard/production-feasibility')
      .then(res => res.ok ? res.json() : null)
      .then(json => setFeasibility(json))
      .catch(err => console.error('Feasibility fetch error:', err))
      .finally(() => setFeasibilityLoading(false));
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSeedData = async () => {
    setSeeding(true);
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      const json = await res.json();
      if (res.ok) {
        toast.success(`Demo data loaded! ${json.summary.materials} materials, ${json.summary.products} products, ${json.summary.sales} sales.`);
        // Refresh everything
        fetchAll();
      } else {
        toast.error(json.error || 'Failed to load demo data');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setSeeding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  const summary = data?.summary || {
    netProfit: 0,
    totalRevenue: 0,
    totalCogs: 0,
    gstLiability: 0,
    lowStockCount: 0,
    revenueChange: 0,
    profitMargin: 0,
  };

  const periodLabel = data?.period
    ? `${new Date(data.period.startDate).toLocaleDateString('en-IN', { month: 'short' })} ${new Date(data.period.startDate).getFullYear()}`
    : 'This Month';

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Your business at a glance — {periodLabel}</p>
      </div>

      {/* Empty state: offer to load demo data */}
      {!hasData && (
        <Card className="border-primary-200 bg-gradient-to-r from-primary-50 to-accent-50">
          <div className="text-center py-4">
            <p className="text-3xl mb-3">🏭</p>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Welcome to ProfitPulse!</h2>
            <p className="text-sm text-gray-600 mb-4">
              Your dashboard is empty. Load demo data for a bakery business to explore all features instantly.
            </p>
            <Button onClick={handleSeedData} loading={seeding} size="lg">
              Load Demo Data (Bakery)
            </Button>
          </div>
        </Card>
      )}

      {/* Net profit hero + Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <NetProfitCard
            netProfit={summary.netProfit}
            profitMargin={summary.profitMargin}
            periodLabel={periodLabel}
          />
        </div>
        <QuickActionButtons />
      </div>

      {/* Metric cards row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Revenue"
          value={summary.totalRevenue}
          format="currency"
          change={summary.revenueChange}
          icon="💰"
          color="blue"
        />
        <MetricCard
          title="COGS"
          value={summary.totalCogs}
          format="currency"
          icon="📦"
          color="amber"
        />
        <MetricCard
          title="GST Payable"
          value={Math.abs(summary.gstLiability)}
          format="currency"
          icon="🧾"
          color={summary.gstLiability >= 0 ? 'red' : 'green'}
        />
        <MetricCard
          title="Low Stock Items"
          value={summary.lowStockCount}
          format="number"
          icon="⚠️"
          color={summary.lowStockCount > 0 ? 'red' : 'green'}
        />
      </div>

      {/* Production Feasibility — the core feature */}
      <ProductionFeasibility data={feasibility} loading={feasibilityLoading} />

      {/* Charts + Alerts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RevenueChart data={data?.revenueTrend || []} />
        <div className="space-y-4">
          <TaxLiabilityCard
            outputGst={0}
            inputGst={0}
            netPayable={summary.gstLiability}
          />
          <LowStockAlerts alerts={data?.lowStockAlerts || []} />
        </div>
      </div>
    </div>
  );
}
