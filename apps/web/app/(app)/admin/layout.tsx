'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';

const TABS = [
  { href: '/admin/dashboard',    label: 'Dashboard'    },
  { href: '/admin/users',        label: 'Users'        },
  { href: '/admin/transactions', label: 'Transactions' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (user && user.role !== 'admin') router.replace('/dashboard');
  }, [user, router]);

  if (user?.role !== 'admin') return null;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Admin Panel</h1>
        <p className="text-sm text-text-secondary mt-1">Platform management and oversight</p>
      </div>

      <div className="flex gap-1 mb-6 border-b border-border">
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              pathname === tab.href
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {children}
    </div>
  );
}
