'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import { formatCurrency } from '@/lib/utils/formatters';
import type { FinishedGood } from '@/lib/types';

interface ProductWithBOM extends FinishedGood {
  bill_of_materials: Array<{ id: string }>;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductWithBOM[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.sku?.toLowerCase().includes(search.toLowerCase()) ?? false)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products (Finished Goods)</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your finished goods and their bill of materials</p>
        </div>
        <Link href="/products/create">
          <Button>+ Add Product</Button>
        </Link>
      </div>

      <Card>
        <div className="mb-4">
          <Input placeholder="Search by name or SKU..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {products.length === 0 ? (
              <div>
                <p className="text-3xl mb-2">📋</p>
                <p className="mb-4">No products yet. Create your first product!</p>
                <Link href="/products/create"><Button size="sm">Create Product</Button></Link>
              </div>
            ) : <p>No products match your search.</p>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">SKU</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Selling Price</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Cost Price</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">GST</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">BOM Items</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 text-sm font-medium text-gray-900">{p.name}</td>
                    <td className="px-4 py-4 text-sm text-gray-500">{p.sku || '—'}</td>
                    <td className="px-4 py-4 text-sm text-right font-mono">{formatCurrency(p.selling_price)}</td>
                    <td className="px-4 py-4 text-sm text-right font-mono">{p.cost_price ? formatCurrency(p.cost_price) : '—'}</td>
                    <td className="px-4 py-4 text-center text-sm">{p.gst_rate != null ? `${p.gst_rate}%` : '—'}</td>
                    <td className="px-4 py-4 text-center">
                      <Badge variant={p.bill_of_materials?.length > 0 ? 'info' : 'neutral'}>
                        {p.bill_of_materials?.length ?? 0} items
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
