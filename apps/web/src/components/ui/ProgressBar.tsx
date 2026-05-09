interface ProgressBarProps {
  percent: number;
}

export function ProgressBar({ percent }: ProgressBarProps) {
  const clamped = Math.min(Math.max(percent, 0), 100);
  const color =
    clamped >= 90 ? 'bg-danger' :
    clamped >= 70 ? 'bg-warning' :
    'bg-success';

  return (
    <div className="h-1.5 rounded-full bg-divider overflow-hidden mt-2">
      <div
        className={`h-full rounded-full transition-all ${color}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
