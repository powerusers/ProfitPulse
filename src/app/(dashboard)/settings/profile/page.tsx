'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Spinner from '@/components/ui/Spinner';
import { createClient } from '@/lib/supabase/client';

export default function SettingsProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [org, setOrg] = useState<any>(null);

  const [form, setForm] = useState({
    business_name: '',
    business_type: '',
    gst_registration_number: '',
  });

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: orgData } = await supabase
          .from('organizations')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (orgData) {
          setOrg(orgData);
          setForm({
            business_name: orgData.business_name || '',
            business_type: orgData.business_type || '',
            gst_registration_number: orgData.gst_registration_number || '',
          });
        }
      }
      setLoading(false);
    }

    load();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    if (!org) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('organizations')
        .update({
          business_name: form.business_name.trim(),
          business_type: form.business_type.trim() || null,
          gst_registration_number: form.gst_registration_number.trim() || null,
        })
        .eq('id', org.id);

      if (error) throw error;
      toast.success('Settings saved');
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Spinner /></div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your business profile</p>
      </div>

      {/* Account info */}
      <Card>
        <h2 className="text-base font-semibold text-gray-800 mb-4">Account</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <p className="text-sm text-gray-600">Email</p>
            <p className="text-sm font-medium text-gray-900">{user?.email || '—'}</p>
          </div>
          <div className="flex items-center justify-between py-2">
            <p className="text-sm text-gray-600">Organization ID</p>
            <p className="text-xs font-mono text-gray-400">{org?.id || '—'}</p>
          </div>
          <div className="flex items-center justify-between py-2">
            <p className="text-sm text-gray-600">Currency</p>
            <p className="text-sm font-medium text-gray-900">{org?.currency || 'INR'}</p>
          </div>
          <div className="flex items-center justify-between py-2">
            <p className="text-sm text-gray-600">Timezone</p>
            <p className="text-sm font-medium text-gray-900">{org?.timezone || 'Asia/Kolkata'}</p>
          </div>
        </div>
      </Card>

      {/* Business profile */}
      <Card>
        <h2 className="text-base font-semibold text-gray-800 mb-4">Business Profile</h2>
        <div className="space-y-4">
          <Input label="Business Name" name="business_name" required placeholder="Your business name" value={form.business_name} onChange={handleChange} />
          <Input label="Business Type" name="business_type" placeholder="e.g., Food Manufacturing" value={form.business_type} onChange={handleChange} />
          <Input label="GST Registration Number" name="gst_registration_number" placeholder="e.g., 27AAPCS1234F1Z5" value={form.gst_registration_number} onChange={handleChange} />
        </div>
        <div className="mt-6 pt-4 border-t border-gray-100">
          <Button onClick={handleSave} loading={saving}>Save Changes</Button>
        </div>
      </Card>
    </div>
  );
}
