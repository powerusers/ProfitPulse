'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Spinner from '@/components/ui/Spinner';
import { UNITS_OF_MEASUREMENT, GST_RATES } from '@/lib/utils/constants';
import type { RawMaterial } from '@/lib/types';

interface BOMLine {
  raw_material_id: string;
  quantity_per_unit: string;
  waste_percentage: string;
  notes: string;
}

export default function CreateProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [materialsLoading, setMaterialsLoading] = useState(true);

  const [form, setForm] = useState({
    name: '',
    sku: '',
    selling_price: '',
    gst_rate: '',
    unit_of_measurement: '',
    description: '',
  });

  const [bomLines, setBomLines] = useState<BOMLine[]>([]);

  useEffect(() => {
    fetch('/api/materials')
      .then(res => res.json())
      .then(data => setMaterials(data))
      .catch(() => toast.error('Failed to load raw materials'))
      .finally(() => setMaterialsLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const addBOMLine = () => {
    setBomLines(prev => [...prev, { raw_material_id: '', quantity_per_unit: '', waste_percentage: '0', notes: '' }]);
  };

  const removeBOMLine = (idx: number) => {
    setBomLines(prev => prev.filter((_, i) => i !== idx));
  };

  const updateBOMLine = (idx: number, field: keyof BOMLine, value: string) => {
    setBomLines(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Product name is required');
    if (!form.selling_price || Number(form.selling_price) <= 0) return toast.error('Valid selling price is required');

    setLoading(true);
    try {
      const productBody = {
        name: form.name.trim(),
        sku: form.sku || undefined,
        selling_price: Number(form.selling_price),
        gst_rate: form.gst_rate ? Number(form.gst_rate) : undefined,
        unit_of_measurement: form.unit_of_measurement || undefined,
        description: form.description || undefined,
      };

      const prodRes = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productBody),
      });

      if (!prodRes.ok) {
        const err = await prodRes.json();
        throw new Error(err.error || 'Failed to create product');
      }

      const created = await prodRes.json();

      const validLines = bomLines.filter(l => l.raw_material_id && Number(l.quantity_per_unit) > 0);
      if (validLines.length > 0) {
        const bomBody = {
          lines: validLines.map(l => ({
            raw_material_id: l.raw_material_id,
            quantity_per_unit: Number(l.quantity_per_unit),
            waste_percentage: Number(l.waste_percentage) || 0,
            notes: l.notes || undefined,
          })),
        };

        const bomRes = await fetch(`/api/products/${created.id}/bom`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bomBody),
        });

        if (!bomRes.ok) toast.error('Product created but BOM failed to save');
      }

      toast.success('Product created successfully');
      router.push('/products');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const unitOptions = UNITS_OF_MEASUREMENT.map(u => ({ value: u.value, label: u.label }));
  const gstOptions = GST_RATES.map(r => ({ value: String(r.value), label: r.label }));
  const materialOptions = materials.map(m => ({ value: m.id, label: `${m.name} (${m.unit_of_measurement})` }));

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create Product</h1>
        <p className="text-sm text-gray-500 mt-1">Add a new finished good with its bill of materials</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <h2 className="text-base font-semibold text-gray-800 mb-4">Product Information</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Product Name" name="name" required placeholder="e.g., Widget A" value={form.name} onChange={handleChange} />
              <Input label="SKU" name="sku" placeholder="e.g., SKU-001" value={form.sku} onChange={handleChange} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input label="Selling Price (INR)" name="selling_price" type="number" step="0.01" min="0" required placeholder="0.00" value={form.selling_price} onChange={handleChange} />
              <Select label="GST Rate" name="gst_rate" options={gstOptions} placeholder="Select GST" value={form.gst_rate} onChange={handleChange} />
              <Select label="Unit" name="unit_of_measurement" options={unitOptions} placeholder="Select unit" value={form.unit_of_measurement} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
              <textarea name="description" rows={3} placeholder="Product description..." value={form.description} onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800">Bill of Materials (BOM)</h2>
            <Button type="button" size="sm" variant="outline" onClick={addBOMLine} disabled={materialsLoading || materials.length === 0}>
              + Add Material
            </Button>
          </div>

          {materialsLoading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : materials.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">No raw materials available. Create materials first.</p>
          ) : bomLines.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">No materials added. Click &quot;Add Material&quot; to build the BOM.</p>
          ) : (
            <div className="space-y-3">
              {bomLines.map((line, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-3 items-end p-3 border border-gray-200 rounded-xl bg-gray-50">
                  <div className="col-span-4">
                    <Select label="Material" options={materialOptions} placeholder="Select material" value={line.raw_material_id}
                      onChange={e => updateBOMLine(idx, 'raw_material_id', e.target.value)} />
                  </div>
                  <div className="col-span-3">
                    <Input label="Qty/Unit" type="number" step="0.01" min="0" placeholder="0.00" value={line.quantity_per_unit}
                      onChange={e => updateBOMLine(idx, 'quantity_per_unit', e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <Input label="Waste %" type="number" step="0.1" min="0" max="100" placeholder="0" value={line.waste_percentage}
                      onChange={e => updateBOMLine(idx, 'waste_percentage', e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <Input label="Notes" placeholder="—" value={line.notes}
                      onChange={e => updateBOMLine(idx, 'notes', e.target.value)} />
                  </div>
                  <div className="col-span-1 flex justify-center pb-1">
                    <button type="button" onClick={() => removeBOMLine(idx)} className="text-danger-500 hover:text-danger-700 text-sm font-medium">
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div className="flex gap-3">
          <Button type="submit" loading={loading}>Create Product</Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
