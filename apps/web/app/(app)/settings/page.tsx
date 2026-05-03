'use client';

import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '@/services/api/auth';
import { useToastStore } from '@/store/toast.store';

interface SettingRowProps {
  icon: string;
  label: string;
  onClick: () => void;
  danger?: boolean;
}

function SettingRow({ icon, label, onClick, danger }: SettingRowProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 py-3.5 border-b border-divider last:border-0 hover:bg-background transition-colors text-left ${danger ? 'text-danger' : 'text-text-primary'}`}
    >
      <span className="text-xl">{icon}</span>
      <span className="flex-1 text-sm font-medium">{label}</span>
      <span className="text-text-muted text-xs">›</span>
    </button>
  );
}

export default function SettingsPage() {
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();
  const toast = useToastStore();

  async function handleLogout() {
    if (!confirm('Are you sure you want to log out?')) return;
    await authApi.logout();
    clearAuth();
    toast.success('Logged out successfully');
    router.replace('/login');
  }

  return (
    <div className="p-5 md:p-8 space-y-5 max-w-xl">
      <h1 className="text-2xl font-bold text-text-primary">Settings</h1>

      {/* Profile */}
      <Card className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-3xl">
          👤
        </div>
        <div>
          <p className="text-base font-semibold text-text-primary">{user?.name}</p>
          <p className="text-sm text-text-secondary">{user?.email}</p>
        </div>
      </Card>

      {/* Preferences */}
      <Card className="p-0 px-4">
        <SettingRow icon="💰" label="Spending Categories"  onClick={() => {}} />
        <SettingRow icon="🎯" label="Financial Goals"      onClick={() => {}} />
        <SettingRow icon="💱" label="Currency Settings"    onClick={() => {}} />
        <SettingRow icon="🔔" label="Notifications"        onClick={() => {}} />
        <SettingRow icon="📊" label="Risk Tolerance"       onClick={() => {}} />
      </Card>

      {/* Data */}
      <Card className="p-0 px-4">
        <SettingRow icon="📤" label="Export Data"          onClick={() => {}} />
        <SettingRow icon="🔒" label="Security"             onClick={() => {}} />
      </Card>

      {/* Logout */}
      <Card className="p-0 px-4">
        <SettingRow icon="🚪" label="Log out" onClick={handleLogout} danger />
      </Card>
    </div>
  );
}
