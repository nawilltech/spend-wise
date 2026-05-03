'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { authApi } from '@/services/api/auth';
import { useAuthStore } from '@/store/auth.store';
import { useToastStore } from '@/store/toast.store';
import { getApiError } from '@/lib/api-error';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuthStore();
  const toast = useToastStore();
  const router = useRouter();

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email || !password) return;
    setLoading(true);
    try {
      const { user } = await authApi.register({ name, email, password, baseCurrency: 'NGN', location: '' });
      setUser(user);
      toast.success('Account created! Welcome to SpendWise.');
      router.replace('/dashboard');
    } catch (err) {
      toast.error(getApiError(err, 'Registration failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-text-primary mb-8">Create account</h1>

        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <Input label="Full name" value={name} onChange={setName} placeholder="John Doe" />
          <Input
            label="Email"
            value={email}
            onChange={setEmail}
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
          />
          <Input
            label="Password"
            value={password}
            onChange={setPassword}
            type="password"
            placeholder="Min. 8 characters"
            autoComplete="new-password"
          />

          <Button label="Create account" type="submit" loading={loading} />
          <Link href="/login">
            <Button label="Already have an account? Log in" variant="ghost" />
          </Link>
        </form>
      </div>
    </div>
  );
}
