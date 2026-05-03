'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '@/services/api/auth';

function VerificationBanner() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleResend() {
    setLoading(true);
    try {
      await authApi.resendVerification();
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 flex items-center justify-between gap-4">
      <div>
        <span className="text-sm font-semibold text-amber-800">Verify your email</span>
        <span className="text-sm text-amber-700 ml-2">
          {sent ? 'Verification email sent! Check your inbox.' : 'Check your inbox to unlock all features.'}
        </span>
      </div>
      {!sent && (
        <button
          onClick={handleResend}
          disabled={loading}
          className="text-sm font-semibold text-amber-800 border border-amber-400 bg-amber-100 hover:bg-amber-200 px-3 py-1 rounded-lg disabled:opacity-50 transition-colors whitespace-nowrap"
        >
          {loading ? 'Sending…' : 'Resend email'}
        </button>
      )}
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, setUser, clearAuth } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    authApi.me().then(setUser).catch(() => {
      clearAuth();
      router.replace('/login');
    });
  }, [isAuthenticated, router, setUser, clearAuth]);

  if (!isAuthenticated) return null;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 md:ml-60 flex flex-col">
        {user && !user.emailVerified && <VerificationBanner />}
        <main className="flex-1 pb-20 md:pb-0">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
