'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Spinner from '@/components/ui/Spinner';
import { formatCurrency, formatNumber, formatPercentage, getMonthStart, getToday } from '@/lib/utils/formatters';

interface ProfitLossReport {
  grossRevenue: number;
  gstOnSales: number;
  netRevenue: number;
  cogs: number;
  grossProfit: number;
  grossMargin: number;
  fixedExpenses: number;
  netProfit: number;
  profitMargin: number;
  totalSales: number;
  totalPurchases: number;
}

interface GstReport {
  outputGst: number;
  inputGst: number;
  netPayable: number;
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'pnl' | 'gst'>('pnl');
  const [startDate, setStartDate] = useState(getMonthStart());
  const [endDate, setEndDate] = useState(getToday());
  const [pnl, setPnl] = useState<ProfitLossReport | null>(null);
  const [gst, setGst] = useState<GstReport | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      if (activeTab === 'pnl') {
        const res = await fetch(`/api/reports/profit-loss?start_date=${startDate}&end_date=${endDate}`);
        if (res.ok) setPnl(await res.json());
        else toast.error('Failed to load P&L report');
      } else {
        const res = await fetch(`/api/reports/tax?start_date=${startDate}&end_date=${endDate}`);
        if (res.ok) setGst(await res.json());
        else toast.error('Failed to load GST report');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500 mt-1">Financial reports and analysis</p>
      </div>

      {/* Tabs + date range */}
      <Card>
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('pnl')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'pnl' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Profit & Loss
            </button>
            <button
              onClick={() => setActiveTab('gst')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'gst' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              GST Liability
            </button>
          </div>

          <div className="flex gap-3 flex-1 md:justify-end items-end">
            <Input label="From" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            <Input label="To" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            <Button onClick={fetchReport} loading={loading}>Generate</Button>
          </div>
        </div>
      </Card>

      {loading && (
        <div className="flex justify-center py-12"><Spinner /></div>
      )}

      {/* P&L Report */}
      {activeTab === 'pnl' && pnl && !loading && (
        <div className="space-y-4">
          {/* Hero profit card */}
          <Card className={`${pnl.netProfit >= 0 ? 'bg-gradient-to-r from-accent-50 to-accent-100 border-accent-200' : 'bg-gradient-to-r from-danger-50 to-danger-100 border-danger-200'}`}>
            <div className="text-center py-4">
              <p className="text-xs font-semibold uppercase text-gray-500 mb-1">Net Profit</p>
              <p className={`text-4xl font-bold font-mono ${pnl.netProfit >= 0 ? 'text-accent-700' : 'text-danger-700'}`}>
                {formatCurrency(pnl.netProfit)}
              </p>
              <p className="text-sm text-gray-500 mt-1">Profit Margin: {pnl.profitMargin.toFixed(1)}%</p>
            </div>
          </Card>

          {/* Line items */}
          <Card>
            <h2 className="text-base font-semibold text-gray-800 mb-4">Profit & Loss Statement</h2>
            <div className="space-y-3">
              <LineItem label="Gross Revenue (Sales)" value={pnl.grossRevenue} />
              <LineItem label="Less: GST on Sales" value={-pnl.gstOnSales} negative />
              <LineItem label="Net Revenue" value={pnl.netRevenue} bold />
              <div className="border-t border-gray-200 my-2" />
              <LineItem label="Less: Cost of Goods Sold (COGS)" value={-pnl.cogs} negative />
              <LineItem label="Gross Profit" value={pnl.grossProfit} bold />
              <p className="text-xs text-gray-400 ml-2">Gross Margin: {pnl.grossMargin.toFixed(1)}%</p>
              <div className="border-t border-gray-200 my-2" />
              <LineItem label="Less: Fixed Expenses" value={-pnl.fixedExpenses} negative />
              <div className="border-t-2 border-gray-300 my-2" />
              <LineItem label="Net Profit" value={pnl.netProfit} bold highlight={pnl.netProfit >= 0 ? 'green' : 'red'} />
            </div>
          </Card>
        </div>
      )}

      {/* GST Report */}
      {activeTab === 'gst' && gst && !loading && (
        <div className="space-y-4">
          <Card className={`${gst.netPayable >= 0 ? 'bg-gradient-to-r from-danger-50 to-danger-100 border-danger-200' : 'bg-gradient-to-r from-accent-50 to-accent-100 border-accent-200'}`}>
            <div className="text-center py-4">
              <p className="text-xs font-semibold uppercase text-gray-500 mb-1">
                {gst.netPayable >= 0 ? 'GST Payable' : 'GST Refund'}
              </p>
              <p className={`text-4xl font-bold font-mono ${gst.netPayable >= 0 ? 'text-danger-700' : 'text-accent-700'}`}>
                {formatCurrency(Math.abs(gst.netPayable))}
              </p>
            </div>
          </Card>

          <Card>
            <h2 className="text-base font-semibold text-gray-800 mb-4">GST Breakdown</h2>
            <div className="space-y-3">
              <LineItem label="Output GST (Collected on Sales)" value={gst.outputGst} />
              <LineItem label="Input GST (Paid on Purchases)" value={gst.inputGst} />
              <div className="border-t-2 border-gray-300 my-2" />
              <LineItem
                label={gst.netPayable >= 0 ? 'Net GST Payable' : 'Net GST Refund'}
                value={Math.abs(gst.netPayable)}
                bold
                highlight={gst.netPayable >= 0 ? 'red' : 'green'}
              />
            </div>
          </Card>
        </div>
      )}

      {/* Initial state */}
      {!loading && !pnl && !gst && (
        <Card>
          <div className="text-center py-12">
            <p className="text-3xl mb-2">📈</p>
            <p className="text-gray-500 mb-2">Select a date range and click Generate to view your report</p>
          </div>
        </Card>
      )}
    </div>
  );
}

// Helper component for P&L line items
function LineItem({
  label,
  value,
  bold,
  negative,
  highlight,
}: {
  label: string;
  value: number;
  bold?: boolean;
  negative?: boolean;
  highlight?: 'green' | 'red';
}) {
  const colorClass = highlight === 'green'
    ? 'text-accent-700'
    : highlight === 'red'
      ? 'text-danger-700'
      : negative
        ? 'text-danger-600'
        : 'text-gray-900';

  return (
    <div className="flex items-center justify-between">
      <p className={`text-sm ${bold ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>{label}</p>
      <p className={`text-sm font-mono ${bold ? 'font-bold text-base' : ''} ${colorClass}`}>
        {formatCurrency(Math.abs(value))}
      </p>
    </div>
  );
}
