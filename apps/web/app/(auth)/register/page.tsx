'use client';

import { useState, useMemo } from 'react';

const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+\[\]{};:'",.<>?/\\|`~]).{8,}$/;

function passwordError(pw: string): string | null {
  if (pw.length < 8)           return 'At least 8 characters required';
  if (!/[A-Z]/.test(pw))      return 'At least one uppercase letter required';
  if (!/[a-z]/.test(pw))      return 'At least one lowercase letter required';
  if (!/\d/.test(pw))         return 'At least one number required';
  if (!/[!@#$%^&*()\-_=+\[\]{};:'",.<>?/\\|`~]/.test(pw)) return 'At least one special character required';
  return null;
}
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
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuthStore();
  const toast = useToastStore();
  const router = useRouter();

  const pwErr = useMemo(() => (password ? passwordError(password) : null), [password]);
  const confirmErr = confirmPassword && password !== confirmPassword ? 'Passwords do not match' : null;

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) return;
    if (pwErr) { toast.error(pwErr); return; }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const { user } = await authApi.register({ name, email, password, confirmPassword, baseCurrency: 'NGN', location: '' });
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
          <div>
            <Input
              label="Password"
              value={password}
              onChange={setPassword}
              type="password"
              placeholder="Min. 8 characters"
              autoComplete="new-password"
            />
            {pwErr && <p className="mt-1.5 text-xs text-danger">{pwErr}</p>}
          </div>
          <div>
            <Input
              label="Confirm Password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              type="password"
              placeholder="Re-enter your password"
              autoComplete="new-password"
            />
            {confirmErr && <p className="mt-1.5 text-xs text-danger">{confirmErr}</p>}
          </div>

          <Button label="Create account" type="submit" loading={loading} />
          <Link href="/login">
            <Button label="Already have an account? Log in" variant="ghost" />
          </Link>
        </form>
      </div>
    </div>
  );
}
