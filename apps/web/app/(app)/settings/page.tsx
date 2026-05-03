'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '@/services/api/auth';
import { useToastStore } from '@/store/toast.store';
import { useCategories } from '@/hooks/useCategories';
import { useBudgets } from '@/hooks/useBudgets';
import { useGoals } from '@/hooks/useGoals';
import { POPULAR_CURRENCIES } from '@/constants/currencies';
import { getApiError } from '@/lib/api-error';
import type { CategoryCreate, BudgetCreate, GoalCreate, GoalType, BudgetPeriod, CategoryType } from '@/types';

type Tab = 'profile' | 'categories' | 'budgets' | 'goals' | 'currency';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'profile',    label: 'Profile',     icon: '👤' },
  { id: 'categories', label: 'Categories',  icon: '💰' },
  { id: 'budgets',    label: 'Budgets',     icon: '📊' },
  { id: 'goals',      label: 'Goals',       icon: '🎯' },
  { id: 'currency',   label: 'Currency',    icon: '💱' },
];

// ── Profile tab ──────────────────────────────────────────────────────────────

function ProfileTab() {
  const { user, setUser } = useAuthStore();
  const toast = useToastStore();
  const [name, setName] = useState(user?.name ?? '');
  const [location, setLocation] = useState(user?.location ?? '');
  const [risk, setRisk] = useState(user?.riskTolerance ?? 'low');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await authApi.updateProfile({ name, location, riskTolerance: risk });
      setUser(updated);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(getApiError(err, 'Failed to update profile'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 max-w-sm">
      <Input label="Name" value={name} onChange={setName} />
      <Input label="Location" value={location} onChange={setLocation} />
      <div>
        <label className="block text-xs font-medium text-text-secondary uppercase tracking-wide mb-2">
          Risk Tolerance
        </label>
        <div className="flex gap-2">
          {(['low', 'medium', 'high'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRisk(r)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors capitalize ${
                risk === r
                  ? 'bg-primary text-white border-primary'
                  : 'text-text-secondary border-divider hover:border-primary/50'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <Button label="Save Changes" onClick={handleSave} loading={saving} />
    </div>
  );
}

// ── Categories tab ───────────────────────────────────────────────────────────

function CategoriesTab() {
  const { categories, create, remove, loading } = useCategories();
  const toast = useToastStore();
  const [name, setName] = useState('');
  const [type, setType] = useState<CategoryType>('expense');
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!name.trim()) return;
    setSaving(true);
    const payload: CategoryCreate = { name: name.trim(), type };
    const ok = await create(payload);
    setSaving(false);
    if (ok) setName('');
    else toast.error('Failed to create category');
  }

  async function handleDelete(id: string, catName: string) {
    if (!confirm(`Remove "${catName}"?`)) return;
    const ok = await remove(id);
    if (!ok) toast.error('Failed to delete category');
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(['expense', 'income', 'both'] as CategoryType[]).map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border capitalize transition-colors ${
              type === t ? 'bg-primary text-white border-primary' : 'text-text-secondary border-divider hover:border-primary/50'
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 px-3 py-2 rounded-lg bg-surface border border-divider text-text-primary text-sm focus:outline-none focus:border-primary"
          placeholder="Category name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <Button label="Add" onClick={handleAdd} loading={saving} />
      </div>
      {loading && <p className="text-sm text-text-muted">Loading…</p>}
      <div className="space-y-1">
        {categories.map((c) => (
          <div key={c.id} className="flex items-center gap-3 py-2.5 border-b border-divider last:border-0">
            <span className="text-xl">{c.icon || '📂'}</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-text-primary">{c.name}</p>
              <p className="text-xs text-text-muted capitalize">{c.type}</p>
            </div>
            {!c.isDefault && (
              <button
                onClick={() => handleDelete(c.id, c.name)}
                className="text-danger text-sm hover:opacity-70"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Budgets tab ──────────────────────────────────────────────────────────────

function BudgetsTab() {
  const { budgets, create, remove, loading } = useBudgets();
  const { categories } = useCategories();
  const { user } = useAuthStore();
  const toast = useToastStore();
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState<BudgetPeriod>('monthly');
  const [categoryId, setCategoryId] = useState('');
  const [saving, setSaving] = useState(false);

  const expenseCategories = categories.filter((c) => c.type === 'expense' || c.type === 'both');

  async function handleAdd() {
    if (!amount || !categoryId) {
      toast.error('Select a category and enter an amount');
      return;
    }
    setSaving(true);
    const payload: BudgetCreate = {
      categoryId,
      amount: parseFloat(amount),
      currency: user?.baseCurrency ?? 'NGN',
      period,
    };
    const ok = await create(payload);
    setSaving(false);
    if (ok) { setAmount(''); setCategoryId(''); }
    else toast.error('Failed to create budget');
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this budget?')) return;
    const ok = await remove(id);
    if (!ok) toast.error('Failed to delete budget');
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-text-muted uppercase tracking-wide mb-2">Period</p>
        <div className="flex flex-wrap gap-2">
          {(['daily', 'weekly', 'monthly', 'quarterly', 'annual'] as BudgetPeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border capitalize transition-colors ${
                period === p ? 'bg-primary text-white border-primary' : 'text-text-secondary border-divider hover:border-primary/50'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs text-text-muted uppercase tracking-wide mb-2">Category</p>
        <div className="flex flex-wrap gap-2">
          {expenseCategories.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategoryId(c.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                categoryId === c.id ? 'bg-primary text-white border-primary' : 'text-text-secondary border-divider hover:border-primary/50'
              }`}
            >
              {c.icon} {c.name}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 px-3 py-2 rounded-lg bg-surface border border-divider text-text-primary text-sm focus:outline-none focus:border-primary"
          placeholder={`Amount (${user?.baseCurrency ?? 'NGN'})`}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          type="number"
        />
        <Button label="Add" onClick={handleAdd} loading={saving} />
      </div>
      {loading && <p className="text-sm text-text-muted">Loading…</p>}
      <div className="space-y-1">
        {budgets.map((b) => (
          <div key={b.id} className="flex items-center gap-3 py-2.5 border-b border-divider last:border-0">
            <span className="text-xl">{b.category?.icon || '💰'}</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-text-primary">{b.category?.name}</p>
              <p className="text-xs text-text-muted capitalize">
                {b.period} · {b.currency} {b.amount.toLocaleString()}
                {b.spent > 0 && ` · ${Math.round(b.percentUsed)}% used`}
              </p>
            </div>
            <button onClick={() => handleDelete(b.id)} className="text-danger text-sm hover:opacity-70">✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Goals tab ────────────────────────────────────────────────────────────────

function GoalsTab() {
  const { goals, create, remove, loading } = useGoals();
  const { user } = useAuthStore();
  const toast = useToastStore();
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [goalType, setGoalType] = useState<GoalType>('savings');
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!name.trim() || !targetAmount) return;
    setSaving(true);
    const payload: GoalCreate = {
      name: name.trim(),
      targetAmount: parseFloat(targetAmount),
      currency: user?.baseCurrency ?? 'NGN',
      type: goalType,
    };
    const ok = await create(payload);
    setSaving(false);
    if (ok) { setName(''); setTargetAmount(''); }
    else toast.error('Failed to create goal');
  }

  async function handleDelete(id: string, goalName: string) {
    if (!confirm(`Remove "${goalName}"?`)) return;
    const ok = await remove(id);
    if (!ok) toast.error('Failed to delete goal');
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-text-muted uppercase tracking-wide mb-2">Goal Type</p>
        <div className="flex flex-wrap gap-2">
          {(['savings', 'debt', 'emergency', 'investment', 'custom'] as GoalType[]).map((t) => (
            <button
              key={t}
              onClick={() => setGoalType(t)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border capitalize transition-colors ${
                goalType === t ? 'bg-primary text-white border-primary' : 'text-text-secondary border-divider hover:border-primary/50'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 px-3 py-2 rounded-lg bg-surface border border-divider text-text-primary text-sm focus:outline-none focus:border-primary"
          placeholder="Goal name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 px-3 py-2 rounded-lg bg-surface border border-divider text-text-primary text-sm focus:outline-none focus:border-primary"
          placeholder={`Target amount (${user?.baseCurrency ?? 'NGN'})`}
          value={targetAmount}
          onChange={(e) => setTargetAmount(e.target.value)}
          type="number"
        />
        <Button label="Add" onClick={handleAdd} loading={saving} />
      </div>
      {loading && <p className="text-sm text-text-muted">Loading…</p>}
      <div className="space-y-1">
        {goals.map((g) => (
          <div key={g.id} className="flex items-center gap-3 py-2.5 border-b border-divider last:border-0">
            <span className="text-xl">🎯</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-text-primary">{g.name}</p>
              <p className="text-xs text-text-muted capitalize">
                {g.currency} {g.currentAmount.toLocaleString()} / {g.targetAmount.toLocaleString()} · {g.type}
              </p>
              <div className="mt-1 h-1.5 bg-surface rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${Math.min((g.currentAmount / g.targetAmount) * 100, 100)}%` }}
                />
              </div>
            </div>
            <button onClick={() => handleDelete(g.id, g.name)} className="text-danger text-sm hover:opacity-70">✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Currency tab ─────────────────────────────────────────────────────────────

function CurrencyTab() {
  const { user, setUser } = useAuthStore();
  const toast = useToastStore();
  const [saving, setSaving] = useState<string | null>(null);

  async function select(code: string) {
    if (code === user?.baseCurrency) return;
    setSaving(code);
    try {
      const updated = await authApi.updateProfile({ baseCurrency: code });
      setUser(updated);
      toast.success(`Currency set to ${code}`);
    } catch (err) {
      toast.error(getApiError(err, 'Failed to update currency'));
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-1">
      {POPULAR_CURRENCIES.map((c) => (
        <button
          key={c.code}
          onClick={() => select(c.code)}
          disabled={saving === c.code}
          className={`w-full flex items-center gap-3 py-3 px-3 rounded-lg transition-colors text-left ${
            user?.baseCurrency === c.code
              ? 'bg-primary/10 border border-primary/30'
              : 'hover:bg-surface border border-transparent'
          }`}
        >
          <span className="text-2xl">{c.flag}</span>
          <div className="flex-1">
            <p className="text-sm font-medium text-text-primary">{c.name}</p>
            <p className="text-xs text-text-muted">{c.code} · {c.symbol}</p>
          </div>
          {user?.baseCurrency === c.code && (
            <span className="text-primary text-lg">✓</span>
          )}
          {saving === c.code && (
            <span className="text-xs text-text-muted">Saving…</span>
          )}
        </button>
      ))}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();
  const toast = useToastStore();
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  async function handleLogout() {
    if (!confirm('Are you sure you want to log out?')) return;
    await authApi.logout();
    clearAuth();
    toast.success('Logged out successfully');
    router.replace('/login');
  }

  return (
    <div className="p-5 md:p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-text-primary mb-6">Settings</h1>

      {/* Profile summary */}
      <Card className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-2xl flex-shrink-0">
          👤
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-text-primary">{user?.name}</p>
          <p className="text-sm text-text-secondary">{user?.email}</p>
          <p className="text-xs text-text-muted mt-0.5">{user?.baseCurrency} · {user?.riskTolerance} risk</p>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-danger font-medium hover:opacity-70 flex-shrink-0"
        >
          Log out
        </button>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto mb-5 pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === t.id
                ? 'bg-primary text-white'
                : 'text-text-secondary hover:bg-surface'
            }`}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <Card>
        {activeTab === 'profile'    && <ProfileTab />}
        {activeTab === 'categories' && <CategoriesTab />}
        {activeTab === 'budgets'    && <BudgetsTab />}
        {activeTab === 'goals'      && <GoalsTab />}
        {activeTab === 'currency'   && <CurrencyTab />}
      </Card>
    </div>
  );
}
