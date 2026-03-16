'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Spinner from '@/components/ui/Spinner';
import { formatCurrency, formatNumber, formatDate, getToday } from '@/lib/utils/formatters';
import type { RawMaterial } from '@/lib/types';

export default function AddStockPage() {
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(true);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const [form, setForm] = useState({
    raw_material_id: '',
    quantity: '',
    unit_cost: '',
    purchase_date: getToday(),
    invoice_number: '',
    supplier_name: '',
    notes: '',
  });

  const selectedMaterial = materials.find(m => m.id === form.raw_material_id);
  const gstRate = selectedMaterial?.gst_rate ?? 0;
  const totalCost = (Number(form.quantity) || 0) * (Number(form.unit_cost) || 0);
  const gstAmount = totalCost * (gstRate / 100);

  useEffect(() => {
    fetch('/api/materials')
      .then(res => res.json())
      .then(data => setMaterials(data))
      .catch(() => toast.error('Failed to load materials'))
      .finally(() => setLoadingMaterials(false));

    fetch('/api/stock-purchases')
      .then(res => res.json())
      .then(data => setPurchases(data?.slice(0, 10) || []))
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.raw_material_id) return toast.error('Select a material');
    if (!form.quantity || Number(form.quantity) <= 0) return toast.error('Enter a valid quantity');
    if (!form.unit_cost || Number(form.unit_cost) <= 0) return toast.error('Enter a valid unit cost');

    setLoadingSubmit(true);
    try {
      const res = await fetch('/api/stock-purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raw_material_id: form.raw_material_id,
          quantity: Number(form.quantity),
          unit_cost: Number(form.unit_cost),
          purchase_date: form.purchase_date,
          invoice_number: form.invoice_number || undefined,
          supplier_name: form.supplier_name || undefined,
          notes: form.notes || undefined,
          gst_rate: gstRate,
        }),
      });

      if (!res.ok) throw new Error('Failed to record purchase');

      toast.success('Stock purchase recorded!');
      setForm({ raw_material_id: '', quantity: '', unit_cost: '', purchase_date: getToday(), invoice_number: '', supplier_name: '', notes: '' });

      // Refresh purchases
      const updated = await fetch('/api/stock-purchases');
      if (updated.ok) {
        const data = await updated.json();
        setPurchases(data?.slice(0, 10) || []);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoadingSubmit(false);
    }
  };

  const materialOptions = materials.map(m => ({ value: m.id, label: `${m.name} (${m.unit_of_measurement})` }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Add Stock</h1>
        <p className="text-sm text-gray-500 mt-1">Record a new stock purchase</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select label="Material" name="raw_material_id" required options={materialOptions} placeholder="Select material" value={form.raw_material_id} onChange={handleChange} />
            <Input label="Quantity" name="quantity" type="number" step="0.01" min="0" required placeholder="0" value={form.quantity} onChange={handleChange} />
            <Input label="Unit Cost (INR)" name="unit_cost" type="number" step="0.01" min="0" required placeholder="0.00" value={form.unit_cost} onChange={handleChange} />
            <Input label="Purchase Date" name="purchase_date" type="date" value={form.purchase_date} onChange={handleChange} />
            <Input label="Invoice Number" name="invoice_number" placeholder="INV-001" value={form.invoice_number} onChange={handleChange} />
            <Input label="Supplier Name" name="supplier_name" placeholder="Supplier name" value={form.supplier_name} onChange={handleChange} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
            <textarea name="notes" rows={2} placeholder="Additional notes..." value={form.notes} onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent" />
          </div>

          {/* Computed amounts */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Total Cost</p>
                <p className="text-lg font-bold text-gray-900 font-mono">{formatCurrency(totalCost)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">GST ({formatNumber(gstRate)}%)</p>
                <p className="text-lg font-bold text-primary-600 font-mono">{formatCurrency(gstAmount)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Grand Total</p>
                <p className="text-lg font-bold text-accent-600 font-mono">{formatCurrency(totalCost + gstAmount)}</p>
              </div>
            </div>
          </div>

          <Button type="submit" fullWidth loading={loadingSubmit} disabled={loadingMaterials}>
            Record Stock Purchase
          </Button>
        </form>
      </Card>

      {/* Recent Purchases */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Recent Purchases</h2>
        {loadingHistory ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : purchases.length === 0 ? (
          <Card><p className="text-center text-sm text-gray-500 py-6">No purchases yet</p></Card>
        ) : (
          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Material</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Qty</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Unit Cost</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Total</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {purchases.map((p: any) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{formatDate(p.purchase_date)}</td>
                      <td className="px-4 py-3 text-sm font-medium">{p.raw_materials?.name || '—'}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono">{formatNumber(p.quantity)}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono">{formatCurrency(p.unit_cost)}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono font-medium">{formatCurrency(p.total_cost)}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{p.invoice_number || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
