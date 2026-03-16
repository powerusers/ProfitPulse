'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const supabase = createClient();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      setSent(true);
      toast.success('Password reset link sent!');
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <Card className="text-center">
        <div className="text-4xl mb-4">📧</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Check your email</h2>
        <p className="text-gray-500 text-sm mb-6">We sent a password reset link to <strong>{email}</strong></p>
        <Link href="/login" className="text-primary-600 hover:text-primary-700 font-semibold text-sm">
          Back to Sign In
        </Link>
      </Card>
    );
  }

  return (
    <Card>
      <h1 className="text-xl font-bold text-gray-900 mb-1">Reset your password</h1>
      <p className="text-gray-500 text-sm mb-6">Enter your email and we&apos;ll send you a reset link</p>

      <form onSubmit={handleReset} className="space-y-4">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
        />
        <Button type="submit" fullWidth size="lg" loading={loading}>
          Send Reset Link
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        <Link href="/login" className="text-primary-600 hover:text-primary-700 font-semibold">
          Back to Sign In
        </Link>
      </p>
    </Card>
  );
}
