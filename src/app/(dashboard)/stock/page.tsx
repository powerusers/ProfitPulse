'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Spinner from '@/components/ui/Spinner';
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils/formatters';

export default function StockPage() {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const totalSpent = purchases.reduce((sum, p) => sum + Number(p.total_cost), 0);
  const totalGst = purchases.reduce((sum, p) => sum + Number(p.gst_amount || 0), 0);

  useEffect(() => {
    fetch('/api/stock-purchases')
      .then(res => res.json())
      .then(data => setPurchases(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = purchases.filter(p =>
    (p.raw_materials?.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.supplier_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.invoice_number || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Purchases</h1>
          <p className="text-sm text-gray-500 mt-1">{purchases.length} purchase records</p>
        </div>
        <Link href="/stock/add">
          <Button>+ Add Stock</Button>
        </Link>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <p className="text-xs text-gray-500 mb-1">Total Spent</p>
          <p className="text-2xl font-bold text-gray-900 font-mono">{formatCurrency(totalSpent)}</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500 mb-1">Input GST (Credit)</p>
          <p className="text-2xl font-bold text-accent-600 font-mono">{formatCurrency(totalGst)}</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500 mb-1">Total Purchases</p>
          <p className="text-2xl font-bold text-primary-600">{purchases.length}</p>
        </Card>
      </div>

      <Card>
        <div className="mb-4">
          <Input placeholder="Search by material, supplier or invoice..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {purchases.length === 0 ? (
              <div>
                <p className="text-3xl mb-2">📦</p>
                <p className="mb-4">No stock purchases yet</p>
                <Link href="/stock/add"><Button size="sm">Add Your First Purchase</Button></Link>
              </div>
            ) : <p>No purchases match your search.</p>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Invoice</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Material</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Supplier</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Qty</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Unit Cost</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Total</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">GST</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((p: any) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm">{formatDate(p.purchase_date)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{p.invoice_number || '—'}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.raw_materials?.name || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{p.supplier_name || '—'}</td>
                    <td className="px-4 py-3 text-sm text-right font-mono">{formatNumber(p.quantity)}</td>
                    <td className="px-4 py-3 text-sm text-right font-mono">{formatCurrency(p.unit_cost)}</td>
                    <td className="px-4 py-3 text-sm text-right font-mono font-medium">{formatCurrency(p.total_cost)}</td>
                    <td className="px-4 py-3 text-sm text-right font-mono text-gray-500">{formatCurrency(p.gst_amount || 0)}</td>
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
