'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import toast from 'react-hot-toast';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      // 1. Sign up user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        toast.error(authError.message);
        return;
      }

      if (!authData.user) {
        toast.error('Signup failed. Please try again.');
        return;
      }

      // If email confirmation is required, session won't exist yet
      if (!authData.session) {
        toast.success('Account created! Please check your email to confirm, then log in.');
        router.push('/login');
        return;
      }

      // 2. Small delay to let the session cookie propagate to the server
      await new Promise(resolve => setTimeout(resolve, 500));

      // 3. Create organization via server-side API (avoids RLS timing issues)
      let orgCreated = false;
      for (let attempt = 0; attempt < 3; attempt++) {
        const orgRes = await fetch('/api/auth/setup-org', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ business_name: businessName }),
        });

        if (orgRes.ok) {
          orgCreated = true;
          break;
        }

        // Wait a bit before retrying (session might need time to propagate)
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      if (!orgCreated) {
        console.error('Org creation failed after retries');
        toast.error('Account created but business setup failed. Please log out and log back in — it will auto-fix.');
      }

      toast.success('Account created! Redirecting to dashboard...');
      router.push('/dashboard');
      router.refresh();
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <h1 className="text-xl font-bold text-gray-900 mb-1">Create your account</h1>
      <p className="text-gray-500 text-sm mb-6">Start tracking your profits in under 5 minutes</p>

      <form onSubmit={handleSignup} className="space-y-4">
        <Input
          label="Business Name"
          type="text"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          placeholder="e.g., Sharma's Bakery"
          required
        />
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          autoComplete="email"
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 6 characters"
          required
          autoComplete="new-password"
        />
        <Input
          label="Confirm Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm your password"
          required
          autoComplete="new-password"
        />

        <Button type="submit" fullWidth size="lg" loading={loading}>
          Create Account
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        Already have an account?{' '}
        <Link href="/login" className="text-primary-600 hover:text-primary-700 font-semibold">
          Sign in
        </Link>
      </p>
    </Card>
  );
}
