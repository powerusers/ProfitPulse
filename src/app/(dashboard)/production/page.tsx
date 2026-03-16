'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Spinner from '@/components/ui/Spinner';
import Badge from '@/components/ui/Badge';
import { formatNumber, formatDate, getToday } from '@/lib/utils/formatters';
import type { FinishedGood, ProductionRun } from '@/lib/types';

export default function ProductionPage() {
  const [products, setProducts] = useState<FinishedGood[]>([]);
  const [runs, setRuns] = useState<ProductionRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  const [form, setForm] = useState({
    finished_good_id: '',
    quantity_produced: '',
    production_date: getToday(),
    notes: '',
  });

  useEffect(() => {
    Promise.all([
      fetch('/api/products').then(res => res.json()),
      fetch('/api/production-runs').then(res => res.json())
    ])
      .then(([productsData, runsData]) => {
        setProducts(productsData || []);
        setRuns(runsData || []);
      })
      .catch(() => toast.error('Failed to load data'))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.finished_good_id) return toast.error('Select a product');
    if (!form.quantity_produced || Number(form.quantity_produced) <= 0) return toast.error('Enter a valid quantity');

    setLoadingSubmit(true);
    try {
      const res = await fetch('/api/production-runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          finished_good_id: form.finished_good_id,
          quantity_produced: Number(form.quantity_produced),
          production_date: form.production_date,
          notes: form.notes || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to record production run');
      }

      toast.success('Production run recorded!');
      setForm({ finished_good_id: '', quantity_produced: '', production_date: getToday(), notes: '' });

      // Refresh runs
      const updated = await fetch('/api/production-runs');
      if (updated.ok) {
        const data = await updated.json();
        setRuns(data || []);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoadingSubmit(false);
    }
  };

  const productOptions = products.map(p => ({ 
    value: p.id, 
    label: `${p.name} (Current Stock: ${formatNumber(p.current_quantity || 0)})` 
  }));

  if (loading) return <div className="flex justify-center py-12"><Spinner /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Production Management</h1>
        <p className="text-sm text-gray-500 mt-1">Initiate production runs and track finished goods inventory</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Form */}
        <div className="lg:col-span-1">
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">New Production Run</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Select 
                label="Product to Manufacture" 
                name="finished_good_id" 
                required 
                options={productOptions} 
                placeholder="Select product" 
                value={form.finished_good_id} 
                onChange={handleChange} 
              />
              <Input 
                label="Quantity to Produce" 
                name="quantity_produced" 
                type="number" 
                step="0.01" 
                min="0.01" 
                required 
                placeholder="0" 
                value={form.quantity_produced} 
                onChange={handleChange} 
              />
              <Input 
                label="Production Date" 
                name="production_date" 
                type="date" 
                value={form.production_date} 
                onChange={handleChange} 
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                <textarea 
                  name="notes" 
                  rows={2} 
                  placeholder="Batch number, operator, etc." 
                  value={form.notes} 
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent" 
                />
              </div>
              <Button type="submit" fullWidth loading={loadingSubmit}>
                Initiate Production
              </Button>
            </form>
          </Card>
        </div>

        {/* Right: History */}
        <div className="lg:col-span-2">
          <Card padding="none">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Production Runs</h2>
              <Badge variant="info">{runs.length} Runs</Badge>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {runs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">
                        No production runs recorded yet.
                      </td>
                    </tr>
                  ) : (
                    runs.map((run) => (
                      <tr key={run.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(run.production_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {run.finished_goods?.name || 'Unknown Product'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono font-semibold text-primary-700">
                          +{formatNumber(run.quantity_produced)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                          {run.notes || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
