'use client';

const CRITERIA = [
  { label: 'At least 8 characters',     test: (pw: string) => pw.length >= 8 },
  { label: 'One uppercase letter (A–Z)', test: (pw: string) => /[A-Z]/.test(pw) },
  { label: 'One lowercase letter (a–z)', test: (pw: string) => /[a-z]/.test(pw) },
  { label: 'One number (0–9)',           test: (pw: string) => /\d/.test(pw) },
  { label: 'One special character',      test: (pw: string) => /[!@#$%^&*()\-_=+\[\]{};:'",.<>?/\\|`~]/.test(pw) },
];

interface Props { password: string }

export function PasswordStrengthHints({ password }: Props) {
  if (!password) return null;
  return (
    <ul className="mt-2.5 space-y-1.5">
      {CRITERIA.map((c) => {
        const met = c.test(password);
        return (
          <li key={c.label} className="flex items-center gap-2">
            {met ? (
              <svg className="w-3.5 h-3.5 text-green-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5 text-text-muted flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 110-12 6 6 0 010 12z" clipRule="evenodd" />
              </svg>
            )}
            <span className={`text-xs ${met ? 'text-green-500' : 'text-text-muted'}`}>{c.label}</span>
          </li>
        );
      })}
    </ul>
  );
}
