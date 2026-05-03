'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '@/services/api/auth';
import { categoriesApi } from '@/services/api/categories';
import { useToastStore } from '@/store/toast.store';
import { useCategories } from '@/hooks/useCategories';
import { useBudgets } from '@/hooks/useBudgets';
import { useGoals } from '@/hooks/useGoals';
import { POPULAR_CURRENCIES } from '@/constants/currencies';
import { getApiError } from '@/lib/api-error';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import type {
  Category, CategoryCreate, CategoryType,
  BudgetCreate, BudgetPeriod, BudgetType,
  Goal, GoalCreate, GoalType,
} from '@/types';

type Tab = 'profile' | 'categories' | 'budgets' | 'goals' | 'currency';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'profile',    label: 'Profile',    icon: '👤' },
  { id: 'categories', label: 'Categories', icon: '💰' },
  { id: 'budgets',    label: 'Budgets',    icon: '📊' },
  { id: 'goals',      label: 'Goals',      icon: '🎯' },
  { id: 'currency',   label: 'Currency',   icon: '💱' },
];

// ── shared chip picker ───────────────────────────────────────────────────────

function ChipPicker<T extends string>({ options, value, onChange }: { options: T[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border capitalize transition-colors ${
            value === o ? 'bg-primary text-white border-primary' : 'text-text-secondary border-divider hover:border-primary/50'
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

// ── edit modal ───────────────────────────────────────────────────────────────

function Modal({ open, title, onClose, onSave, saving, children }: {
  open: boolean; title: string; onClose: () => void; onSave: () => void; saving: boolean; children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-surface rounded-2xl p-6 w-full max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-text-primary">{title}</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary text-xl leading-none">×</button>
        </div>
        <div className="space-y-4">{children}</div>
        <div className="mt-5 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-divider text-sm text-text-secondary hover:bg-background">Cancel</button>
          <button
            onClick={onSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── category combobox ────────────────────────────────────────────────────────

function CategoryCombobox({
  categories,
  value,
  onChange,
}: {
  categories: Category[];
  value: { id: string; name: string } | null;
  onChange: (v: { id: string; name: string }) => void;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = query.trim()
    ? categories.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()))
    : categories;

  const showCreate = query.trim() && !categories.some(
    (c) => c.name.toLowerCase() === query.trim().toLowerCase(),
  );

  function pick(c: Category) { onChange({ id: c.id, name: c.name }); setQuery(''); setOpen(false); }
  function pickNew() { onChange({ id: '', name: query.trim() }); setQuery(''); setOpen(false); }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-surface border border-divider text-sm text-left hover:border-primary/50"
      >
        <span className={value ? 'text-text-primary' : 'text-text-muted'}>
          {value ? value.name : 'Select or type a category…'}
        </span>
        <span className="text-text-muted">▾</span>
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full bg-surface border border-divider rounded-xl shadow-lg max-h-56 overflow-y-auto">
          <div className="p-2 border-b border-divider">
            <input
              autoFocus
              className="w-full px-3 py-1.5 rounded-lg bg-background text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
              placeholder="Search or type new category…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          {showCreate && (
            <button onClick={pickNew} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-primary hover:bg-background text-left">
              <span>＋</span> Create "{query.trim()}"
            </button>
          )}
          {filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => pick(c)}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-text-primary hover:bg-background text-left border-t border-divider first:border-0"
            >
              <span>{c.icon}</span>
              <span className="flex-1">{c.name}</span>
              <span className="text-xs text-text-muted capitalize">{c.type}</span>
            </button>
          ))}
          {filtered.length === 0 && !showCreate && (
            <p className="px-3 py-3 text-sm text-text-muted">No categories found</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── profile tab ──────────────────────────────────────────────────────────────

function ProfileTab() {
  const { user, setUser } = useAuthStore();
  const toast = useToastStore();
  const [name, setName] = useState(user?.name ?? '');
  const [location, setLocation] = useState(user?.location ?? '');
  const [risk, setRisk] = useState<'low' | 'medium' | 'high'>(user?.riskTolerance ?? 'low');
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
        <p className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-2">Risk Tolerance</p>
        <ChipPicker options={['low', 'medium', 'high']} value={risk} onChange={setRisk} />
      </div>
      <Button label="Save Changes" onClick={handleSave} loading={saving} />
    </div>
  );
}

// ── categories tab ───────────────────────────────────────────────────────────

function CategoriesTab() {
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { categories, create, update, remove } = useCategories(filterType === 'all' ? undefined : filterType, searchTerm);
  const toast = useToastStore();
  const [name, setName] = useState('');
  const [type, setType] = useState<CategoryType>('expense');
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<CategoryType>('expense');
  const [editSaving, setEditSaving] = useState(false);
  const [deletingCat, setDeletingCat] = useState<Category | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  function openEdit(c: Category) { setEditing(c); setEditName(c.name); setEditType(c.type as CategoryType); }

  async function handleAdd() {
    if (!name.trim()) return;
    setSaving(true);
    const ok = await create({ name: name.trim(), type } as CategoryCreate);
    setSaving(false);
    if (ok) setName('');
    else toast.error('Failed to create category');
  }

  async function handleSaveEdit() {
    if (!editing) return;
    setEditSaving(true);
    const ok = await update(editing.id, { name: editName.trim(), type: editType });
    setEditSaving(false);
    if (ok) setEditing(null);
    else toast.error('Failed to update category');
  }

  function requestDelete(c: Category) {
    if (c.isDefault) { toast.error('Default categories cannot be deleted'); return; }
    setDeletingCat(c);
  }

  async function handleDelete() {
    if (!deletingCat) return;
    setDeleteLoading(true);
    const ok = await remove(deletingCat.id);
    setDeleteLoading(false);
    if (ok) setDeletingCat(null);
    else toast.error('Failed to delete category');
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-text-muted uppercase tracking-wide mb-2">Show</p>
        <ChipPicker options={['all', 'expense', 'income']} value={filterType} onChange={setFilterType} />
      </div>
      <input
        className="w-full px-3 py-2 rounded-lg bg-background border border-divider text-text-primary text-sm focus:outline-none focus:border-primary"
        placeholder="Search categories…"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <div>
        <p className="text-xs text-text-muted uppercase tracking-wide mb-2">New Category Type</p>
        <ChipPicker options={['expense', 'income', 'both'] as CategoryType[]} value={type} onChange={setType} />
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 px-3 py-2 rounded-lg bg-background border border-divider text-text-primary text-sm focus:outline-none focus:border-primary"
          placeholder="Category name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <Button label="Add" onClick={handleAdd} loading={saving} className="w-auto px-5" />
      </div>
      <div className="divide-y divide-divider">
        {categories.length === 0 && searchTerm.trim() && (
          <p className="py-4 text-sm text-text-muted text-center">No categories match "{searchTerm}"</p>
        )}
        {categories.map((c) => (
          <div key={c.id} className="flex items-center gap-3 py-2.5">
            <span className="text-xl">{c.icon || '📂'}</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-text-primary">{c.name}</p>
              <p className="text-xs text-text-muted capitalize">{c.type}{c.isDefault ? ' · default' : ''}</p>
            </div>
            <div className="flex gap-1">
              <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-background text-primary" title="Edit">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button
                onClick={() => requestDelete(c)}
                className={`p-1.5 rounded-lg hover:bg-background ${c.isDefault ? 'text-text-muted opacity-40 cursor-not-allowed' : 'text-danger'}`}
                title={c.isDefault ? 'Default categories cannot be deleted' : 'Delete'}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={!!editing} title="Edit Category" onClose={() => setEditing(null)} onSave={handleSaveEdit} saving={editSaving}>
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wide mb-1.5">Name</p>
          <input
            className="w-full px-3 py-2 rounded-lg bg-background border border-divider text-text-primary text-sm focus:outline-none focus:border-primary"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />
        </div>
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wide mb-1.5">Type</p>
          <ChipPicker options={['expense', 'income', 'both'] as CategoryType[]} value={editType} onChange={setEditType} />
        </div>
      </Modal>

      <ConfirmModal
        open={!!deletingCat}
        title="Delete category?"
        message={`Remove "${deletingCat?.name}"? This cannot be undone.`}
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeletingCat(null)}
      />
    </div>
  );
}

// ── budgets tab ──────────────────────────────────────────────────────────────

function BudgetsTab() {
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all');
  const { budgets, create, update, remove } = useBudgets(filterType === 'all' ? undefined : filterType);
  const { categories, create: createCategory } = useCategories();
  const { user } = useAuthStore();
  const toast = useToastStore();

  const [catSelection, setCatSelection] = useState<{ id: string; name: string } | null>(null);
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState<BudgetPeriod>('monthly');
  const [budgetType, setBudgetType] = useState<BudgetType>('expense');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editPeriod, setEditPeriod] = useState<BudgetPeriod>('monthly');
  const [editType, setEditType] = useState<BudgetType>('expense');
  const [editDescription, setEditDescription] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [deletingBudgetId, setDeletingBudgetId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  function openEdit(b: { id: string; amount: number; period: BudgetPeriod; type: BudgetType; description?: string }) {
    setEditingId(b.id);
    setEditAmount(String(b.amount));
    setEditPeriod(b.period);
    setEditType(b.type);
    setEditDescription(b.description ?? '');
  }

  async function handleAdd() {
    if (!catSelection || !amount) { toast.error('Select a category and enter an amount'); return; }
    setSaving(true);
    try {
      let categoryId = catSelection.id;
      if (!categoryId) {
        const newCat = await categoriesApi.create({ name: catSelection.name, type: 'expense' } as CategoryCreate);
        categoryId = newCat.id;
      }
      const payload: BudgetCreate = {
        categoryId,
        amount: parseFloat(amount),
        currency: user?.baseCurrency ?? 'NGN',
        period,
        type: budgetType,
        description: description.trim() || undefined,
      };
      const ok = await create(payload);
      if (ok) { setCatSelection(null); setAmount(''); setDescription(''); }
      else toast.error('Failed to create budget');
    } catch (err) {
      toast.error(getApiError(err, 'Failed to create budget'));
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveEdit() {
    if (!editingId) return;
    setEditSaving(true);
    const ok = await update(editingId, {
      amount: parseFloat(editAmount),
      period: editPeriod,
      type: editType,
      description: editDescription.trim() || undefined,
    });
    setEditSaving(false);
    if (ok) setEditingId(null);
    else toast.error('Failed to update budget');
  }

  async function handleDeleteBudget() {
    if (!deletingBudgetId) return;
    setDeleteLoading(true);
    const ok = await remove(deletingBudgetId);
    setDeleteLoading(false);
    if (ok) setDeletingBudgetId(null);
    else toast.error('Failed to delete budget');
  }

  const allCats = categories.filter((c) => c.type === 'expense' || c.type === 'both');

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-text-muted uppercase tracking-wide mb-2">Show</p>
        <ChipPicker options={['all', 'expense', 'income']} value={filterType} onChange={setFilterType} />
      </div>
      <div>
        <p className="text-xs text-text-muted uppercase tracking-wide mb-2">Budget Type</p>
        <ChipPicker options={['expense', 'income'] as BudgetType[]} value={budgetType} onChange={setBudgetType} />
      </div>
      <div>
        <p className="text-xs text-text-muted uppercase tracking-wide mb-2">Period</p>
        <ChipPicker options={['daily', 'weekly', 'monthly', 'quarterly', 'annual'] as BudgetPeriod[]} value={period} onChange={setPeriod} />
      </div>
      <div>
        <p className="text-xs text-text-muted uppercase tracking-wide mb-2">Category</p>
        <CategoryCombobox categories={allCats} value={catSelection} onChange={setCatSelection} />
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 px-3 py-2 rounded-lg bg-background border border-divider text-text-primary text-sm focus:outline-none focus:border-primary"
          placeholder={`Amount (${user?.baseCurrency ?? 'NGN'})`}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          type="number"
        />
      </div>
      <input
        className="w-full px-3 py-2 rounded-lg bg-background border border-divider text-text-primary text-sm focus:outline-none focus:border-primary"
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <Button label="Add Budget" onClick={handleAdd} loading={saving} />
      <div className="divide-y divide-divider">
        {budgets.map((b) => (
          <div key={b.id} className="flex items-center gap-3 py-2.5">
            <span className="text-xl">{b.category?.icon || '💰'}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary">{b.category?.name}</p>
              <p className="text-xs text-text-muted capitalize">
                {b.type} · {b.period} · {b.currency} {b.amount.toLocaleString()}
                {b.spent > 0 && ` · ${Math.round(b.percentUsed)}% used`}
              </p>
              {b.description && <p className="text-xs text-text-muted truncate">{b.description}</p>}
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <button onClick={() => openEdit({ id: b.id, amount: b.amount, period: b.period, type: b.type, description: b.description })} className="p-1.5 rounded-lg hover:bg-background text-primary">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button onClick={() => setDeletingBudgetId(b.id)} className="p-1.5 rounded-lg hover:bg-background text-danger" title="Delete">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={!!editingId} title="Edit Budget" onClose={() => setEditingId(null)} onSave={handleSaveEdit} saving={editSaving}>
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wide mb-1.5">Amount</p>
          <input
            className="w-full px-3 py-2 rounded-lg bg-background border border-divider text-text-primary text-sm focus:outline-none focus:border-primary"
            type="number"
            value={editAmount}
            onChange={(e) => setEditAmount(e.target.value)}
          />
        </div>
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wide mb-1.5">Budget Type</p>
          <ChipPicker options={['expense', 'income'] as BudgetType[]} value={editType} onChange={setEditType} />
        </div>
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wide mb-1.5">Period</p>
          <ChipPicker options={['daily', 'weekly', 'monthly', 'quarterly', 'annual'] as BudgetPeriod[]} value={editPeriod} onChange={setEditPeriod} />
        </div>
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wide mb-1.5">Description</p>
          <input
            className="w-full px-3 py-2 rounded-lg bg-background border border-divider text-text-primary text-sm focus:outline-none focus:border-primary"
            placeholder="Optional"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
          />
        </div>
      </Modal>

      <ConfirmModal
        open={!!deletingBudgetId}
        title="Delete budget?"
        message="Remove this budget? This cannot be undone."
        loading={deleteLoading}
        onConfirm={handleDeleteBudget}
        onCancel={() => setDeletingBudgetId(null)}
      />
    </div>
  );
}

// ── goals tab ────────────────────────────────────────────────────────────────

function GoalsTab() {
  const { goals, create, update, remove } = useGoals();
  const { user } = useAuthStore();
  const toast = useToastStore();
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [goalType, setGoalType] = useState<GoalType>('savings');
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [editName, setEditName] = useState('');
  const [editTarget, setEditTarget] = useState('');
  const [editType, setEditType] = useState<GoalType>('savings');
  const [editSaving, setEditSaving] = useState(false);
  const [deletingGoal, setDeletingGoal] = useState<Goal | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  function openEdit(g: Goal) { setEditing(g); setEditName(g.name); setEditTarget(String(g.targetAmount)); setEditType(g.type); }

  async function handleAdd() {
    if (!name.trim() || !targetAmount) return;
    setSaving(true);
    const ok = await create({ name: name.trim(), targetAmount: parseFloat(targetAmount), currency: user?.baseCurrency ?? 'NGN', type: goalType } as GoalCreate);
    setSaving(false);
    if (ok) { setName(''); setTargetAmount(''); }
    else toast.error('Failed to create goal');
  }

  async function handleSaveEdit() {
    if (!editing) return;
    setEditSaving(true);
    const ok = await update(editing.id, { name: editName.trim(), targetAmount: parseFloat(editTarget), type: editType });
    setEditSaving(false);
    if (ok) setEditing(null);
    else toast.error('Failed to update goal');
  }

  async function handleDeleteGoal() {
    if (!deletingGoal) return;
    setDeleteLoading(true);
    const ok = await remove(deletingGoal.id);
    setDeleteLoading(false);
    if (ok) setDeletingGoal(null);
    else toast.error('Failed to delete goal');
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-text-muted uppercase tracking-wide mb-2">Goal Type</p>
        <ChipPicker options={['savings', 'debt', 'emergency', 'investment', 'custom'] as GoalType[]} value={goalType} onChange={setGoalType} />
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 px-3 py-2 rounded-lg bg-background border border-divider text-text-primary text-sm focus:outline-none focus:border-primary"
          placeholder="Goal name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 px-3 py-2 rounded-lg bg-background border border-divider text-text-primary text-sm focus:outline-none focus:border-primary"
          placeholder={`Target amount (${user?.baseCurrency ?? 'NGN'})`}
          value={targetAmount}
          onChange={(e) => setTargetAmount(e.target.value)}
          type="number"
        />
        <Button label="Add" onClick={handleAdd} loading={saving} className="w-auto px-5" />
      </div>
      <div className="divide-y divide-divider">
        {goals.map((g) => {
          const pct = g.targetAmount > 0 ? Math.min((g.currentAmount / g.targetAmount) * 100, 100) : 0;
          return (
            <div key={g.id} className="py-2.5">
              <div className="flex items-center gap-3">
                <span className="text-xl">🎯</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary">{g.name}</p>
                  <p className="text-xs text-text-muted capitalize">
                    {g.currency} {g.currentAmount.toLocaleString()} / {g.targetAmount.toLocaleString()} · {g.type}
                  </p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => openEdit(g)} className="p-1.5 rounded-lg hover:bg-background text-primary">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button onClick={() => setDeletingGoal(g)} className="p-1.5 rounded-lg hover:bg-background text-danger" title="Delete">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                  </button>
                </div>
              </div>
              <div className="mt-2 ml-9 h-1.5 bg-background rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={!!editing} title="Edit Goal" onClose={() => setEditing(null)} onSave={handleSaveEdit} saving={editSaving}>
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wide mb-1.5">Name</p>
          <input
            className="w-full px-3 py-2 rounded-lg bg-background border border-divider text-text-primary text-sm focus:outline-none focus:border-primary"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />
        </div>
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wide mb-1.5">Target Amount</p>
          <input
            className="w-full px-3 py-2 rounded-lg bg-background border border-divider text-text-primary text-sm focus:outline-none focus:border-primary"
            type="number"
            value={editTarget}
            onChange={(e) => setEditTarget(e.target.value)}
          />
        </div>
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wide mb-1.5">Type</p>
          <ChipPicker options={['savings', 'debt', 'emergency', 'investment', 'custom'] as GoalType[]} value={editType} onChange={setEditType} />
        </div>
      </Modal>

      <ConfirmModal
        open={!!deletingGoal}
        title="Delete goal?"
        message={`Remove "${deletingGoal?.name}"? This cannot be undone.`}
        loading={deleteLoading}
        onConfirm={handleDeleteGoal}
        onCancel={() => setDeletingGoal(null)}
      />
    </div>
  );
}

// ── currency tab ─────────────────────────────────────────────────────────────

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
              : 'hover:bg-background border border-transparent'
          }`}
        >
          <span className="text-2xl">{c.flag}</span>
          <div className="flex-1">
            <p className="text-sm font-medium text-text-primary">{c.name}</p>
            <p className="text-xs text-text-muted">{c.code} · {c.symbol}</p>
          </div>
          {user?.baseCurrency === c.code && <span className="text-primary font-bold">✓</span>}
          {saving === c.code && <span className="text-xs text-text-muted">Saving…</span>}
        </button>
      ))}
    </div>
  );
}

// ── page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();
  const toast = useToastStore();
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  const [logoutConfirm, setLogoutConfirm] = useState(false);

  async function handleLogout() {
    await authApi.logout();
    clearAuth();
    toast.success('Logged out successfully');
    router.replace('/login');
  }

  return (
    <div className="p-5 md:p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-text-primary mb-6">Settings</h1>

      <Card className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-2xl flex-shrink-0">👤</div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-text-primary">{user?.name}</p>
          <p className="text-sm text-text-secondary">{user?.email}</p>
          <p className="text-xs text-text-muted mt-0.5">{user?.baseCurrency} · {user?.riskTolerance} risk</p>
        </div>
        <button onClick={() => setLogoutConfirm(true)} className="text-sm text-danger font-medium hover:opacity-70 flex-shrink-0">Log out</button>
      </Card>

      <div className="flex gap-1 overflow-x-auto mb-5 pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === t.id ? 'bg-primary text-white' : 'text-text-secondary hover:bg-surface'
            }`}
          >
            <span>{t.icon}</span><span>{t.label}</span>
          </button>
        ))}
      </div>

      <Card>
        {activeTab === 'profile'    && <ProfileTab />}
        {activeTab === 'categories' && <CategoriesTab />}
        {activeTab === 'budgets'    && <BudgetsTab />}
        {activeTab === 'goals'      && <GoalsTab />}
        {activeTab === 'currency'   && <CurrencyTab />}
      </Card>

      <ConfirmModal
        open={logoutConfirm}
        title="Log out?"
        message="Are you sure you want to log out?"
        confirmLabel="Log out"
        onConfirm={handleLogout}
        onCancel={() => setLogoutConfirm(false)}
      />
    </div>
  );
}
