'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import { formatCurrency, formatNumber, formatDate, getToday } from '@/lib/utils/formatters';
import type { FinishedGood } from '@/lib/types';

interface BackflushResult {
  success: boolean;
  deductions: Array<{
    materialId: string;
    materialName: string;
    qtyDeducted: number;
    remainingQty: number;
  }>;
  warnings: string[];
}

export default function LogSalePage() {
  const [products, setProducts] = useState<FinishedGood[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [sales, setSales] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [backflushResult, setBackflushResult] = useState<BackflushResult | null>(null);

  const [form, setForm] = useState({
    finished_good_id: '',
    quantity: '',
    unit_price: '',
    sale_date: getToday(),
    customer_name: '',
    invoice_number: '',
    notes: '',
  });

  const selectedProduct = products.find(p => p.id === form.finished_good_id);
  const gstRate = selectedProduct?.gst_rate ?? 0;
  const totalAmount = (Number(form.quantity) || 0) * (Number(form.unit_price) || 0);
  const gstAmount = totalAmount * (gstRate / (100 + gstRate));

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(() => toast.error('Failed to load products'))
      .finally(() => setLoadingProducts(false));

    fetch('/api/sales')
      .then(res => res.json())
      .then(data => setSales(data?.slice(0, 10) || []))
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === 'finished_good_id') {
      const product = products.find(p => p.id === value);
      setForm(prev => ({
        ...prev,
        finished_good_id: value,
        unit_price: product ? String(product.selling_price) : prev.unit_price,
      }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.finished_good_id) return toast.error('Select a product');
    if (!form.quantity || Number(form.quantity) <= 0) return toast.error('Enter a valid quantity');
    if (!form.unit_price || Number(form.unit_price) <= 0) return toast.error('Enter a valid price');

    setLoadingSubmit(true);
    setBackflushResult(null);

    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          finished_good_id: form.finished_good_id,
          quantity: Number(form.quantity),
          unit_price: Number(form.unit_price),
          sale_date: form.sale_date,
          customer_name: form.customer_name || undefined,
          invoice_number: form.invoice_number || undefined,
          notes: form.notes || undefined,
          gst_rate: gstRate,
        }),
      });

      if (!res.ok) throw new Error('Failed to log sale');

      const data = await res.json();
      setBackflushResult(data.backflush);
      toast.success('Sale recorded successfully!');

      setForm({ finished_good_id: '', quantity: '', unit_price: '', sale_date: getToday(), customer_name: '', invoice_number: '', notes: '' });

      const updated = await fetch('/api/sales');
      if (updated.ok) {
        const salesData = await updated.json();
        setSales(salesData?.slice(0, 10) || []);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoadingSubmit(false);
    }
  };

  const productOptions = products.map(p => ({ value: p.id, label: `${p.name} — ${formatCurrency(p.selling_price)}` }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Log Sale</h1>
        <p className="text-sm text-gray-500 mt-1">Record a new sale — materials will be auto-deducted via BOM backflushing</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select label="Product" name="finished_good_id" required options={productOptions} placeholder="Select product" value={form.finished_good_id} onChange={handleChange} />
            <Input label="Quantity" name="quantity" type="number" step="1" min="1" required placeholder="0" value={form.quantity} onChange={handleChange} />
            <Input label="Unit Price (INR)" name="unit_price" type="number" step="0.01" min="0" required placeholder="0.00" value={form.unit_price} onChange={handleChange}
              helperText={selectedProduct ? `Default: ${formatCurrency(selectedProduct.selling_price)}` : undefined} />
            <Input label="Sale Date" name="sale_date" type="date" value={form.sale_date} onChange={handleChange} />
            <Input label="Customer Name" name="customer_name" placeholder="Customer name" value={form.customer_name} onChange={handleChange} />
            <Input label="Invoice Number" name="invoice_number" placeholder="INV-001" value={form.invoice_number} onChange={handleChange} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
            <textarea name="notes" rows={2} placeholder="Additional notes..." value={form.notes} onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent" />
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Total Amount</p>
                <p className="text-lg font-bold text-gray-900 font-mono">{formatCurrency(totalAmount)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">GST ({formatNumber(gstRate)}%)</p>
                <p className="text-lg font-bold text-primary-600 font-mono">{formatCurrency(gstAmount)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Net Revenue</p>
                <p className="text-lg font-bold text-accent-600 font-mono">{formatCurrency(totalAmount - gstAmount)}</p>
              </div>
            </div>
          </div>

          <Button type="submit" fullWidth loading={loadingSubmit} disabled={loadingProducts}>
            Log Sale
          </Button>
        </form>
      </Card>

      {backflushResult && (
        <Card className={backflushResult.warnings.length > 0 ? 'border-amber-300 bg-amber-50/50' : 'border-accent-300 bg-accent-50/50'}>
          <div className="flex items-center gap-2 mb-4">
            <Badge variant={backflushResult.warnings.length > 0 ? 'warning' : 'success'}>
              {backflushResult.warnings.length > 0 ? 'Completed with Warnings' : 'Backflush Complete'}
            </Badge>
          </div>

          {backflushResult.warnings.length > 0 && (
            <div className="bg-amber-100 border border-amber-200 rounded-lg p-3 mb-4">
              <p className="text-xs font-semibold text-amber-800 mb-1">Warnings</p>
              {backflushResult.warnings.map((w, i) => (
                <p key={i} className="text-sm text-amber-700">⚠ {w}</p>
              ))}
            </div>
          )}

          {backflushResult.deductions.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Material Deductions</p>
              <div className="space-y-2">
                {backflushResult.deductions.map(d => (
                  <div key={d.materialId} className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{d.materialName}</p>
                      <p className="text-xs text-gray-500">Deducted: {formatNumber(d.qtyDeducted)} units</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono font-medium">{formatNumber(d.remainingQty)}</p>
                      <p className="text-[10px] text-gray-400">remaining</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Recent Sales</h2>
        {loadingHistory ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : sales.length === 0 ? (
          <Card><p className="text-center text-sm text-gray-500 py-6">No sales yet</p></Card>
        ) : (
          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Product</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Qty</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Unit Price</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Total</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Customer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sales.map((s: any) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{formatDate(s.sale_date)}</td>
                      <td className="px-4 py-3 text-sm font-medium">{s.finished_goods?.name || '—'}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono">{formatNumber(s.quantity)}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono">{formatCurrency(s.unit_price)}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono font-medium">{formatCurrency(s.total_amount)}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{s.customer_name || '—'}</td>
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
