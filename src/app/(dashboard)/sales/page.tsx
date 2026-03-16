'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Spinner from '@/components/ui/Spinner';
import { formatCurrency, formatNumber, formatDate, getMonthStart, getToday } from '@/lib/utils/formatters';

export default function SalesPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Summary stats
  const totalRevenue = sales.reduce((sum, s) => sum + Number(s.total_amount), 0);
  const totalGst = sales.reduce((sum, s) => sum + Number(s.gst_amount || 0), 0);
  const totalOrders = sales.length;

  useEffect(() => {
    fetch('/api/sales')
      .then(res => res.json())
      .then(data => setSales(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = sales.filter(s =>
    (s.finished_goods?.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.customer_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.invoice_number || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales</h1>
          <p className="text-sm text-gray-500 mt-1">{totalOrders} transactions this period</p>
        </div>
        <Link href="/sales/log">
          <Button>+ Log Sale</Button>
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <p className="text-xs text-gray-500 mb-1">Total Revenue</p>
          <p className="text-2xl font-bold text-gray-900 font-mono">{formatCurrency(totalRevenue)}</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500 mb-1">GST Collected</p>
          <p className="text-2xl font-bold text-primary-600 font-mono">{formatCurrency(totalGst)}</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500 mb-1">Total Orders</p>
          <p className="text-2xl font-bold text-accent-600">{totalOrders}</p>
        </Card>
      </div>

      {/* Sales table */}
      <Card>
        <div className="mb-4">
          <Input placeholder="Search by product, customer or invoice..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {sales.length === 0 ? (
              <div>
                <p className="text-3xl mb-2">🛒</p>
                <p className="mb-4">No sales recorded yet</p>
                <Link href="/sales/log"><Button size="sm">Log Your First Sale</Button></Link>
              </div>
            ) : <p>No sales match your search.</p>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Invoice</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Customer</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Qty</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Unit Price</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Total</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Backflushed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((s: any) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm">{formatDate(s.sale_date)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{s.invoice_number || '—'}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{s.finished_goods?.name || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{s.customer_name || '—'}</td>
                    <td className="px-4 py-3 text-sm text-right font-mono">{formatNumber(s.quantity)}</td>
                    <td className="px-4 py-3 text-sm text-right font-mono">{formatCurrency(s.unit_price)}</td>
                    <td className="px-4 py-3 text-sm text-right font-mono font-medium">{formatCurrency(s.total_amount)}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={s.is_backflushed ? 'success' : 'warning'}>
                        {s.is_backflushed ? 'Yes' : 'No'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
