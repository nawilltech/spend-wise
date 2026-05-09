'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/dashboard',    icon: '🏠', label: 'Dashboard'    },
  { href: '/transactions', icon: '↕️',  label: 'Transactions' },
  { href: '/budget',       icon: '🥧', label: 'Budget'       },
  { href: '/insights',     icon: '💡', label: 'Insights'     },
  { href: '/settings',     icon: '⚙️',  label: 'Settings'    },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-60 bg-surface border-r border-border min-h-screen py-6 px-4 gap-1 fixed top-0 left-0 z-30">
      <div className="flex items-center gap-2 px-3 mb-8">
        <span className="text-2xl">💰</span>
        <span className="text-lg font-bold text-primary">SpendWise</span>
      </div>

      {NAV.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + '/');
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
              active
                ? 'bg-primary text-white'
                : 'text-text-secondary hover:bg-background hover:text-text-primary'
            )}
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </aside>
  );
}
