'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/dashboard',    icon: '🏠', label: 'Home'    },
  { href: '/transactions', icon: '↕️',  label: 'Txns'   },
  { href: '/budget',       icon: '🥧', label: 'Budget'  },
  { href: '/insights',     icon: '💡', label: 'Insights'},
  { href: '/settings',     icon: '⚙️',  label: 'Settings'},
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-30 flex">
      {NAV.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + '/');
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex-1 flex flex-col items-center justify-center py-2 gap-0.5',
              active ? 'text-primary' : 'text-text-muted'
            )}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
