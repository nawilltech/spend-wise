'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

const FEATURES = [
  {
    icon: '📊',
    title: 'Plan your budget',
    description: 'Set spending limits by category and stay on track every month.',
  },
  {
    icon: '💳',
    title: 'Track your spending',
    description: 'Log transactions instantly and see exactly where your money goes.',
  },
  {
    icon: '🤖',
    title: 'Get smart insights',
    description: 'AI-powered analysis helps you spot patterns and save more.',
  },
];

export default function LandingPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) router.replace('/dashboard');
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        <span className="text-7xl mb-4">💰</span>
        <h1 className="text-5xl font-extrabold text-primary tracking-tight mb-2">SpendWise</h1>
        <p className="text-xl font-semibold text-text-secondary mb-4">Save more. Stress less.</p>
        <p className="max-w-md text-text-secondary text-base leading-relaxed mb-12">
          SpendWise helps you take control of your finances — plan your budget,
          document every purchase, and get AI-powered advice tailored to your goals.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl w-full mb-14">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-surface border border-border rounded-2xl p-6 text-left shadow-sm">
              <span className="text-3xl mb-3 block">{f.icon}</span>
              <h3 className="font-bold text-text-primary mb-1">{f.title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs sm:max-w-sm">
          <Link href="/register" className="flex-1">
            <button className="w-full bg-primary text-white font-semibold py-3 px-6 rounded-xl hover:bg-primary/90 transition-colors">
              Get started
            </button>
          </Link>
          <Link href="/login" className="flex-1">
            <button className="w-full bg-surface border border-border text-text-primary font-semibold py-3 px-6 rounded-xl hover:bg-divider transition-colors">
              Log in
            </button>
          </Link>
        </div>
      </main>

      <footer className="text-center py-6 text-text-muted text-sm border-t border-border">
        <span>Powered by </span>
        <a
          href="https://nawill.ng"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary font-medium hover:underline"
        >
          Nawill
        </a>
      </footer>
    </div>
  );
}
