import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function Card({ children, className, style }: CardProps) {
  return (
    <div
      className={cn('bg-surface rounded-2xl shadow-sm border border-border p-4', className)}
      style={style}
    >
      {children}
    </div>
  );
}
