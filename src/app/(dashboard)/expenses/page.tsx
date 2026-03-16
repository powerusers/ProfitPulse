'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Spinner from '@/components/ui/Spinner';
import Badge from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils/formatters';
import { EXPENSE_CATEGORIES } from '@/lib/utils/constants';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    expense_name: '',
    category: '',
    monthly_amount: '',
    start_date: '',
    notes: '',
  });

  const totalMonthly = expenses.reduce((sum, e) => sum + Number(e.monthly_amount), 0);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = () => {
    fetch('/api/expenses')
      .then(res => res.json())
      .then(data => setExpenses(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.expense_name.trim()) return toast.error('Expense name is required');
    if (!form.monthly_amount || Number(form.monthly_amount) <= 0) return toast.error('Enter a valid amount');

    setSubmitting(true);
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expense_name: form.expense_name.trim(),
          category: form.category || 'OTHER',
          monthly_amount: Number(form.monthly_amount),
          start_date: form.start_date || undefined,
          notes: form.notes || undefined,
        }),
      });

      if (!res.ok) throw new Error('Failed to add expense');

      toast.success('Expense added');
      setForm({ expense_name: '', category: '', monthly_amount: '', start_date: '', notes: '' });
      setShowForm(false);
      fetchExpenses();
    } catch {
      toast.error('Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const categoryOptions = EXPENSE_CATEGORIES.map(c => ({ value: c.value, label: c.label }));

  const getCategoryBadge = (cat: string) => {
    const map: Record<string, 'info' | 'warning' | 'danger' | 'success' | 'neutral'> = {
      RENT: 'info', SALARY: 'success', UTILITIES: 'warning', INSURANCE: 'neutral', OTHER: 'neutral',
    };
    return map[cat] || 'neutral';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fixed Expenses</h1>
          <p className="text-sm text-gray-500 mt-1">Recurring monthly business expenses</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Expense'}
        </Button>
      </div>

      {/* Monthly total */}
      <Card className="bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-amber-700 font-semibold uppercase">Total Monthly Expenses</p>
            <p className="text-3xl font-bold text-amber-900 font-mono mt-1">{formatCurrency(totalMonthly)}</p>
          </div>
          <p className="text-xs text-amber-600">{expenses.length} recurring expense{expenses.length !== 1 ? 's' : ''}</p>
        </div>
      </Card>

      {/* Add form */}
      {showForm && (
        <Card>
          <h2 className="text-base font-semibold text-gray-800 mb-4">New Expense</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Expense Name" name="expense_name" required placeholder="e.g., Shop Rent" value={form.expense_name} onChange={handleChange} />
              <Select label="Category" name="category" options={categoryOptions} placeholder="Select category" value={form.category} onChange={handleChange} />
              <Input label="Monthly Amount (INR)" name="monthly_amount" type="number" step="0.01" min="0" required placeholder="0.00" value={form.monthly_amount} onChange={handleChange} />
              <Input label="Start Date" name="start_date" type="date" value={form.start_date} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
              <textarea name="notes" rows={2} placeholder="Additional notes..." value={form.notes} onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent" />
            </div>
            <Button type="submit" loading={submitting}>Add Expense</Button>
          </form>
        </Card>
      )}

      {/* Expenses list */}
      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : expenses.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-3xl mb-2">💰</p>
            <p className="text-gray-500 mb-4">No expenses recorded yet</p>
            <Button size="sm" onClick={() => setShowForm(true)}>Add Your First Expense</Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {expenses.map((exp: any) => (
            <Card key={exp.id} hover>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{exp.expense_name}</p>
                  <Badge variant={getCategoryBadge(exp.category)}>{exp.category}</Badge>
                </div>
                <p className="text-lg font-bold text-gray-900 font-mono">{formatCurrency(exp.monthly_amount)}</p>
              </div>
              {exp.notes && <p className="text-xs text-gray-500 mt-2">{exp.notes}</p>}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
