'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { UNITS_OF_MEASUREMENT, GST_RATES } from '@/lib/utils/constants';

export default function CreateMaterialPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    sku: '',
    unit_of_measurement: '',
    reorder_level: '',
    reorder_quantity: '',
    gst_rate: '',
    supplier_name: '',
    notes: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Material name is required');
    if (!form.unit_of_measurement) return toast.error('Unit of measurement is required');

    setLoading(true);
    try {
      const body = {
        name: form.name.trim(),
        sku: form.sku || undefined,
        unit_of_measurement: form.unit_of_measurement,
        reorder_level: form.reorder_level ? Number(form.reorder_level) : undefined,
        reorder_quantity: form.reorder_quantity ? Number(form.reorder_quantity) : undefined,
        gst_rate: form.gst_rate ? Number(form.gst_rate) : undefined,
        supplier_name: form.supplier_name || undefined,
        notes: form.notes || undefined,
      };

      const res = await fetch('/api/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create material');
      }

      toast.success('Material created successfully');
      router.push('/materials');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const unitOptions = UNITS_OF_MEASUREMENT.map(u => ({ value: u.value, label: u.label }));
  const gstOptions = GST_RATES.map(r => ({ value: String(r.value), label: r.label }));

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Add Raw Material</h1>
        <p className="text-sm text-gray-500 mt-1">Create a new raw material for your inventory</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input label="Material Name" name="name" required placeholder="e.g., Aluminum Sheet" value={form.name} onChange={handleChange} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="SKU" name="sku" placeholder="e.g., ALU-001" value={form.sku} onChange={handleChange} />
            <Select label="Unit of Measurement" name="unit_of_measurement" required options={unitOptions} placeholder="Select unit" value={form.unit_of_measurement} onChange={handleChange} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Reorder Level" name="reorder_level" type="number" min="0" placeholder="e.g., 100" value={form.reorder_level} onChange={handleChange} />
            <Input label="Reorder Quantity" name="reorder_quantity" type="number" min="0" placeholder="e.g., 500" value={form.reorder_quantity} onChange={handleChange} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select label="GST Rate" name="gst_rate" options={gstOptions} placeholder="Select GST rate" value={form.gst_rate} onChange={handleChange} />
            <Input label="Supplier Name" name="supplier_name" placeholder="e.g., ABC Suppliers" value={form.supplier_name} onChange={handleChange} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
            <textarea
              name="notes"
              rows={3}
              placeholder="Additional notes..."
              value={form.notes}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <Button type="submit" loading={loading}>Create Material</Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
