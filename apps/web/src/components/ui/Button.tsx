import { cn } from '@/lib/utils';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  onClick?: () => void;
  loading?: boolean;
  variant?: 'primary' | 'ghost' | 'danger';
  type?: 'button' | 'submit';
  disabled?: boolean;
  className?: string;
}

export function Button({ label, onPress, onClick, loading, variant = 'primary', type = 'button', disabled, className }: ButtonProps) {
  const base = 'w-full py-3 px-6 rounded-xl font-semibold text-sm transition-opacity disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-primary text-white hover:opacity-90',
    ghost:   'bg-transparent text-primary border border-primary hover:bg-primary hover:text-white',
    danger:  'bg-danger text-white hover:opacity-90',
  };

  return (
    <button
      type={type}
      onClick={onPress ?? onClick}
      disabled={disabled ?? loading}
      className={cn(base, variants[variant], className)}
    >
      {loading ? 'Loading…' : label}
    </button>
  );
}
