'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { authApi } from '@/services/api/auth';
import { useToastStore } from '@/store/toast.store';
import { getApiError } from '@/lib/api-error';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';
  const session = searchParams.get('session') ?? '';

  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToastStore();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!otp || !newPassword || !confirmNewPassword) return;
    setLoading(true);
    try {
      await authApi.resetPassword({ session, otp, newPassword, confirmNewPassword });
      toast.success('Password updated! Please log in.');
      router.replace('/login');
    } catch (err) {
      toast.error(getApiError(err, 'Invalid or expired code. Please try again.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="text-6xl mb-3">💰</div>
          <h1 className="text-3xl font-bold text-text-primary">Reset Password</h1>
          <p className="text-text-secondary mt-1.5">
            Enter the 6-digit code sent to <span className="font-medium">{email || 'your email'}</span>.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="6-digit Code"
            value={otp}
            onChange={setOtp}
            type="text"
            placeholder="123456"
            autoComplete="one-time-code"
          />
          <Input
            label="New Password"
            value={newPassword}
            onChange={setNewPassword}
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
          />
          <Input
            label="Confirm New Password"
            value={confirmNewPassword}
            onChange={setConfirmNewPassword}
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
          />

          <Button label="Reset Password" type="submit" loading={loading} />
          <Link href="/forgot-password">
            <Button label="Resend Code" variant="ghost" />
          </Link>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
