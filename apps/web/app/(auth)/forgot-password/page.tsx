'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { authApi } from '@/services/api/auth';
import { useToastStore } from '@/store/toast.store';
import { getApiError } from '@/lib/api-error';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToastStore();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const { session } = await authApi.forgotPassword({ email });
      toast.success('Reset code sent! Check your email.');
      router.push(`/reset-password?email=${encodeURIComponent(email)}&session=${encodeURIComponent(session)}`);
    } catch (err) {
      toast.error(getApiError(err, 'Something went wrong. Please try again.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="text-6xl mb-3">💰</div>
          <h1 className="text-3xl font-bold text-text-primary">Forgot Password</h1>
          <p className="text-text-secondary mt-1.5">
            Enter your email and we&apos;ll send you a 6-digit reset code.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Email"
            value={email}
            onChange={setEmail}
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
          />

          <Button label="Send Reset Code" type="submit" loading={loading} />
          <Link href="/login">
            <Button label="Back to Login" variant="ghost" />
          </Link>
        </form>
      </div>
    </div>
  );
}
