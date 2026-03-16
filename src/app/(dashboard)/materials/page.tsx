'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import { formatCurrency, formatNumber } from '@/lib/utils/formatters';
import type { RawMaterial } from '@/lib/types';

function getStockStatus(qty: number, reorderLevel: number | null) {
  if (qty === 0) return { label: 'Out of Stock', variant: 'danger' as const };
  if (reorderLevel === null) return { label: 'In Stock', variant: 'success' as const };
  if (qty <= reorderLevel * 0.25) return { label: 'Critical', variant: 'danger' as const };
  if (qty <= reorderLevel) return { label: 'Low Stock', variant: 'warning' as const };
  return { label: 'In Stock', variant: 'success' as const };
}

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/materials')
      .then(res => res.json())
      .then(data => setMaterials(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = materials.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Raw Materials</h1>
          <p className="text-sm text-gray-500 mt-1">{materials.length} materials in inventory</p>
        </div>
        <Link href="/materials/create">
          <Button>+ Add Material</Button>
        </Link>
      </div>

      <Card>
        <div className="mb-4">
          <Input placeholder="Search materials..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {materials.length === 0 ? (
              <div>
                <p className="text-3xl mb-2">🧱</p>
                <p className="mb-4">No materials yet. Add your first raw material!</p>
                <Link href="/materials/create"><Button size="sm">Add Material</Button></Link>
              </div>
            ) : <p>No materials match your search.</p>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">SKU</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Stock Qty</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Unit</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Avg Cost</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Reorder Level</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Supplier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(m => {
                  const status = getStockStatus(m.current_quantity, m.reorder_level);
                  return (
                    <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 text-sm font-medium text-gray-900">{m.name}</td>
                      <td className="px-4 py-4 text-sm text-gray-500">{m.sku || '—'}</td>
                      <td className="px-4 py-4 text-sm text-right font-mono">{formatNumber(m.current_quantity)}</td>
                      <td className="px-4 py-4 text-sm text-gray-500">{m.unit_of_measurement}</td>
                      <td className="px-4 py-4 text-sm text-right font-mono">{formatCurrency(m.weighted_avg_cost)}</td>
                      <td className="px-4 py-4 text-sm text-right">{m.reorder_level != null ? formatNumber(m.reorder_level) : '—'}</td>
                      <td className="px-4 py-4 text-center"><Badge variant={status.variant}>{status.label}</Badge></td>
                      <td className="px-4 py-4 text-sm text-gray-500">{m.supplier_name || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
