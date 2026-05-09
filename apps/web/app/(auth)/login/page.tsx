'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { authApi } from '@/services/api/auth';
import { useAuthStore } from '@/store/auth.store';
import { useToastStore } from '@/store/toast.store';
import { getApiError, getLoginErrorDetail } from '@/lib/api-error';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [attemptInfo, setAttemptInfo] = useState<{ attempts: number; maxAttempts: number } | null>(null);
  const { setUser } = useAuthStore();
  const toast = useToastStore();
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      const { user } = await authApi.login({ email, password });
      setAttemptInfo(null);
      setUser(user);
      toast.success(`Welcome back, ${user.name}!`);
      router.replace('/dashboard');
    } catch (err) {
      const detail = getLoginErrorDetail(err);
      if (detail) {
        setAttemptInfo({ attempts: detail.attempts, maxAttempts: detail.maxAttempts });
      } else {
        setAttemptInfo(null);
        toast.error(getApiError(err, 'Login failed. Check your email and password.'));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-text-primary">Welcome back</h1>
          <p className="text-text-secondary mt-1.5">Log in to your SpendWise account</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <Input
            label="Email"
            value={email}
            onChange={setEmail}
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
          />
          <div className="flex flex-col gap-1.5">
            <Input
              label="Password"
              value={password}
              onChange={setPassword}
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
            />
            {attemptInfo && (
              <p className="text-sm text-danger font-medium">
                Incorrect password — {attemptInfo.attempts} of {attemptInfo.maxAttempts} attempts used.
                {attemptInfo.attempts >= attemptInfo.maxAttempts - 1 && ' Account will be locked on next failure.'}
              </p>
            )}
          </div>

          <Button label="Log in" type="submit" loading={loading} />
          <Link href="/register">
            <Button label="Create account" variant="ghost" />
          </Link>
          <Link href="/forgot-password" className="text-center text-sm text-text-secondary hover:text-primary transition-colors">
            Forgot password?
          </Link>
        </form>
      </div>
    </div>
  );
}
