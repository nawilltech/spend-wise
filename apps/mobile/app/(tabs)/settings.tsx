import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
  Modal, TextInput, ActivityIndicator, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@constants/colors';
import { POPULAR_CURRENCIES } from '@constants/currencies';
import { Card } from '@components/common/Card';
import { useAuthStore } from '@store/auth.store';
import { authApi } from '@services/api/auth';
import { categoriesApi } from '@services/api/categories';
import { useCategories } from '@hooks/useCategories';
import { useBudgets } from '@hooks/useBudgets';
import { useGoals } from '@hooks/useGoals';
import type {
  Category, CategoryCreate, CategoryType,
  BudgetCreate, BudgetPeriod,
  Goal, GoalCreate, GoalType,
} from '@/types';

// ── tiny shared components ───────────────────────────────────────────────────

function SectionHeader({ title, expanded, onPress }: { title: string; expanded: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.sectionHeader} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.textMuted} />
    </TouchableOpacity>
  );
}

function Chips<T extends string>({ options, selected, onSelect }: { options: T[]; selected: T; onSelect: (v: T) => void }) {
  return (
    <View style={styles.chipRow}>
      {options.map((o) => (
        <TouchableOpacity
          key={o}
          onPress={() => onSelect(o)}
          style={[styles.chip, selected === o && styles.chipActive]}
          activeOpacity={0.7}
        >
          <Text style={[styles.chipText, selected === o && styles.chipTextActive]}>{o}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <View style={styles.rowActions}>
      <TouchableOpacity onPress={onEdit} style={styles.actionBtn}>
        <Ionicons name="pencil-outline" size={16} color={Colors.primary} />
      </TouchableOpacity>
      <TouchableOpacity onPress={onDelete} style={styles.actionBtn}>
        <Ionicons name="trash-outline" size={16} color={Colors.danger} />
      </TouchableOpacity>
    </View>
  );
}

// ── generic edit modal ───────────────────────────────────────────────────────

function EditModal({
  visible, title, onClose, onSave, saving, children,
}: { visible: boolean; title: string; onClose: () => void; onSave: () => void; saving: boolean; children: React.ReactNode }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled">{children}</ScrollView>
          <TouchableOpacity style={styles.saveBtn} onPress={onSave} disabled={saving} activeOpacity={0.8}>
            {saving
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.saveBtnText}>Save</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ── categories section ───────────────────────────────────────────────────────

function CategoriesSection() {
  const { categories, create, update, remove } = useCategories();
  const [name, setName] = useState('');
  const [type, setType] = useState<CategoryType>('expense');
  const [saving, setSaving] = useState(false);
  // edit state
  const [editing, setEditing] = useState<Category | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<CategoryType>('expense');
  const [editSaving, setEditSaving] = useState(false);

  function openEdit(c: Category) {
    setEditing(c);
    setEditName(c.name);
    setEditType(c.type as CategoryType);
  }

  async function handleAdd() {
    if (!name.trim()) return;
    setSaving(true);
    const ok = await create({ name: name.trim(), type } as CategoryCreate);
    setSaving(false);
    if (ok) setName('');
    else Alert.alert('Error', 'Failed to create category');
  }

  async function handleSaveEdit() {
    if (!editing || !editName.trim()) return;
    setEditSaving(true);
    const ok = await update(editing.id, { name: editName.trim(), type: editType });
    setEditSaving(false);
    if (ok) setEditing(null);
    else Alert.alert('Error', 'Failed to update category');
  }

  async function handleDelete(id: string, catName: string) {
    Alert.alert('Delete', `Remove "${catName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        const ok = await remove(id);
        if (!ok) Alert.alert('Error', 'Failed to delete category');
      }},
    ]);
  }

  return (
    <View style={styles.sectionBody}>
      <Text style={styles.fieldLabel}>Type</Text>
      <Chips options={['expense', 'income', 'both'] as CategoryType[]} selected={type} onSelect={setType} />
      <View style={styles.addRow}>
        <TextInput style={[styles.input, { flex: 1 }]} placeholder="Category name" placeholderTextColor={Colors.textMuted} value={name} onChangeText={setName} />
        <TouchableOpacity style={styles.addBtn} onPress={handleAdd} disabled={saving}>
          {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.addBtnText}>Add</Text>}
        </TouchableOpacity>
      </View>
      {categories.map((c) => (
        <View key={c.id} style={styles.listItem}>
          <Text style={styles.itemIcon}>{c.icon || '📂'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemName}>{c.name}</Text>
            <Text style={styles.itemSub}>{c.type}</Text>
          </View>
          {!c.isDefault && (
            <RowActions onEdit={() => openEdit(c)} onDelete={() => handleDelete(c.id, c.name)} />
          )}
        </View>
      ))}

      <EditModal visible={!!editing} title="Edit Category" onClose={() => setEditing(null)} onSave={handleSaveEdit} saving={editSaving}>
        <View style={{ padding: 4, gap: 12 }}>
          <Text style={styles.fieldLabel}>Name</Text>
          <TextInput style={styles.input} value={editName} onChangeText={setEditName} placeholderTextColor={Colors.textMuted} />
          <Text style={styles.fieldLabel}>Type</Text>
          <Chips options={['expense', 'income', 'both'] as CategoryType[]} selected={editType} onSelect={setEditType} />
        </View>
      </EditModal>
    </View>
  );
}

// ── budgets section ──────────────────────────────────────────────────────────

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

  const filtered = query.trim()
    ? categories.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()))
    : categories;

  const showCreateOption = query.trim() && !categories.some(
    (c) => c.name.toLowerCase() === query.trim().toLowerCase(),
  );

  function selectExisting(c: Category) {
    onChange({ id: c.id, name: c.name });
    setQuery('');
    setOpen(false);
  }

  function selectNew() {
    onChange({ id: '', name: query.trim() });
    setQuery('');
    setOpen(false);
  }

  return (
    <View>
      <TouchableOpacity
        style={[styles.input, styles.comboboxTrigger]}
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
      >
        <Text style={value ? styles.itemName : { color: Colors.textMuted, fontSize: 14 }}>
          {value ? value.name : 'Select or type a category…'}
        </Text>
        <Ionicons name="chevron-down" size={16} color={Colors.textMuted} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={[styles.modalCard, { maxHeight: '70%' }]}>
            <TextInput
              style={[styles.input, { margin: 12, marginBottom: 4 }]}
              placeholder="Search or type new category…"
              placeholderTextColor={Colors.textMuted}
              value={query}
              onChangeText={setQuery}
              autoFocus
            />
            <FlatList
              data={filtered}
              keyExtractor={(c) => c.id}
              keyboardShouldPersistTaps="handled"
              ListHeaderComponent={showCreateOption ? (
                <TouchableOpacity style={styles.comboboxItem} onPress={selectNew}>
                  <Ionicons name="add-circle-outline" size={18} color={Colors.primary} />
                  <Text style={[styles.itemName, { color: Colors.primary }]}>Create "{query.trim()}"</Text>
                </TouchableOpacity>
              ) : null}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.comboboxItem} onPress={() => selectExisting(item)}>
                  <Text style={styles.itemIcon}>{item.icon}</Text>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={[styles.itemSub, { marginLeft: 'auto' }]}>{item.type}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

function BudgetsSection() {
  const { budgets, create, update, remove } = useBudgets();
  const { categories, create: createCategory } = useCategories();
  const { user } = useAuthStore();

  const [catSelection, setCatSelection] = useState<{ id: string; name: string } | null>(null);
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState<BudgetPeriod>('monthly');
  const [saving, setSaving] = useState(false);

  // edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editPeriod, setEditPeriod] = useState<BudgetPeriod>('monthly');
  const [editSaving, setEditSaving] = useState(false);

  function openEdit(b: { id: string; amount: number; period: BudgetPeriod }) {
    setEditingId(b.id);
    setEditAmount(String(b.amount));
    setEditPeriod(b.period);
  }

  async function handleAdd() {
    if (!catSelection || !amount) {
      Alert.alert('Missing fields', 'Select a category and enter an amount');
      return;
    }
    setSaving(true);
    try {
      let categoryId = catSelection.id;
      if (!categoryId) {
        // type-to-create: create the category first
        const newCat = await categoriesApi.create({ name: catSelection.name, type: 'expense' } as CategoryCreate);
        categoryId = newCat.id;
      }
      const payload: BudgetCreate = {
        categoryId,
        amount: parseFloat(amount),
        currency: user?.baseCurrency ?? 'NGN',
        period,
      };
      const ok = await create(payload);
      if (ok) { setCatSelection(null); setAmount(''); }
      else Alert.alert('Error', 'Failed to create budget');
    } catch {
      Alert.alert('Error', 'Failed to create budget');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveEdit() {
    if (!editingId) return;
    setEditSaving(true);
    const ok = await update(editingId, { amount: parseFloat(editAmount), period: editPeriod });
    setEditSaving(false);
    if (ok) setEditingId(null);
    else Alert.alert('Error', 'Failed to update budget');
  }

  async function handleDelete(id: string) {
    Alert.alert('Delete', 'Remove this budget?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        const ok = await remove(id);
        if (!ok) Alert.alert('Error', 'Failed to delete budget');
      }},
    ]);
  }

  const allCats = categories.filter((c) => c.type === 'expense' || c.type === 'both');

  return (
    <View style={styles.sectionBody}>
      <Text style={styles.fieldLabel}>Period</Text>
      <Chips options={['daily', 'weekly', 'monthly', 'quarterly', 'annual'] as BudgetPeriod[]} selected={period} onSelect={setPeriod} />
      <Text style={styles.fieldLabel}>Category</Text>
      <CategoryCombobox categories={allCats} value={catSelection} onChange={setCatSelection} />
      <View style={[styles.addRow, { marginTop: 10 }]}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder={`Amount (${user?.baseCurrency ?? 'NGN'})`}
          placeholderTextColor={Colors.textMuted}
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />
        <TouchableOpacity style={styles.addBtn} onPress={handleAdd} disabled={saving}>
          {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.addBtnText}>Add</Text>}
        </TouchableOpacity>
      </View>

      {budgets.map((b) => (
        <View key={b.id} style={styles.listItem}>
          <Text style={styles.itemIcon}>{b.category?.icon || '💰'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemName}>{b.category?.name}</Text>
            <Text style={styles.itemSub}>{b.period} · {b.currency} {b.amount.toLocaleString()}</Text>
          </View>
          <RowActions
            onEdit={() => openEdit({ id: b.id, amount: b.amount, period: b.period })}
            onDelete={() => handleDelete(b.id)}
          />
        </View>
      ))}

      <EditModal visible={!!editingId} title="Edit Budget" onClose={() => setEditingId(null)} onSave={handleSaveEdit} saving={editSaving}>
        <View style={{ padding: 4, gap: 12 }}>
          <Text style={styles.fieldLabel}>Amount</Text>
          <TextInput style={styles.input} value={editAmount} onChangeText={setEditAmount} keyboardType="numeric" placeholderTextColor={Colors.textMuted} />
          <Text style={styles.fieldLabel}>Period</Text>
          <Chips options={['daily', 'weekly', 'monthly', 'quarterly', 'annual'] as BudgetPeriod[]} selected={editPeriod} onSelect={setEditPeriod} />
        </View>
      </EditModal>
    </View>
  );
}

// ── goals section ────────────────────────────────────────────────────────────

function GoalsSection() {
  const { goals, create, update, remove } = useGoals();
  const { user } = useAuthStore();

  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [goalType, setGoalType] = useState<GoalType>('savings');
  const [saving, setSaving] = useState(false);

  const [editing, setEditing] = useState<Goal | null>(null);
  const [editName, setEditName] = useState('');
  const [editTarget, setEditTarget] = useState('');
  const [editType, setEditType] = useState<GoalType>('savings');
  const [editSaving, setEditSaving] = useState(false);

  function openEdit(g: Goal) {
    setEditing(g);
    setEditName(g.name);
    setEditTarget(String(g.targetAmount));
    setEditType(g.type);
  }

  async function handleAdd() {
    if (!name.trim() || !targetAmount) return;
    setSaving(true);
    const ok = await create({ name: name.trim(), targetAmount: parseFloat(targetAmount), currency: user?.baseCurrency ?? 'NGN', type: goalType } as GoalCreate);
    setSaving(false);
    if (ok) { setName(''); setTargetAmount(''); }
    else Alert.alert('Error', 'Failed to create goal');
  }

  async function handleSaveEdit() {
    if (!editing) return;
    setEditSaving(true);
    const ok = await update(editing.id, { name: editName.trim(), targetAmount: parseFloat(editTarget), type: editType });
    setEditSaving(false);
    if (ok) setEditing(null);
    else Alert.alert('Error', 'Failed to update goal');
  }

  async function handleDelete(id: string, goalName: string) {
    Alert.alert('Delete', `Remove "${goalName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        const ok = await remove(id);
        if (!ok) Alert.alert('Error', 'Failed to delete goal');
      }},
    ]);
  }

  return (
    <View style={styles.sectionBody}>
      <Text style={styles.fieldLabel}>Goal Type</Text>
      <Chips options={['savings', 'debt', 'emergency', 'investment', 'custom'] as GoalType[]} selected={goalType} onSelect={setGoalType} />
      <View style={styles.addRow}>
        <TextInput style={[styles.input, { flex: 1 }]} placeholder="Goal name" placeholderTextColor={Colors.textMuted} value={name} onChangeText={setName} />
      </View>
      <View style={[styles.addRow, { marginTop: 8 }]}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder={`Target (${user?.baseCurrency ?? 'NGN'})`}
          placeholderTextColor={Colors.textMuted}
          value={targetAmount}
          onChangeText={setTargetAmount}
          keyboardType="numeric"
        />
        <TouchableOpacity style={styles.addBtn} onPress={handleAdd} disabled={saving}>
          {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.addBtnText}>Add</Text>}
        </TouchableOpacity>
      </View>

      {goals.map((g) => {
        const pct = g.targetAmount > 0 ? Math.min((g.currentAmount / g.targetAmount) * 100, 100) : 0;
        return (
          <View key={g.id} style={styles.listItem}>
            <Text style={styles.itemIcon}>🎯</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{g.name}</Text>
              <Text style={styles.itemSub}>{g.currency} {g.currentAmount.toLocaleString()} / {g.targetAmount.toLocaleString()} · {g.type}</Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${pct}%` as `${number}%` }]} />
              </View>
            </View>
            <RowActions onEdit={() => openEdit(g)} onDelete={() => handleDelete(g.id, g.name)} />
          </View>
        );
      })}

      <EditModal visible={!!editing} title="Edit Goal" onClose={() => setEditing(null)} onSave={handleSaveEdit} saving={editSaving}>
        <View style={{ padding: 4, gap: 12 }}>
          <Text style={styles.fieldLabel}>Name</Text>
          <TextInput style={styles.input} value={editName} onChangeText={setEditName} placeholderTextColor={Colors.textMuted} />
          <Text style={styles.fieldLabel}>Target Amount</Text>
          <TextInput style={styles.input} value={editTarget} onChangeText={setEditTarget} keyboardType="numeric" placeholderTextColor={Colors.textMuted} />
          <Text style={styles.fieldLabel}>Type</Text>
          <Chips options={['savings', 'debt', 'emergency', 'investment', 'custom'] as GoalType[]} selected={editType} onSelect={setEditType} />
        </View>
      </EditModal>
    </View>
  );
}

// ── currency section ─────────────────────────────────────────────────────────

function CurrencySection() {
  const { user, setUser } = useAuthStore();
  const [saving, setSaving] = useState(false);

  async function select(code: string) {
    if (code === user?.baseCurrency) return;
    setSaving(true);
    try {
      const updated = await authApi.updateProfile({ baseCurrency: code });
      setUser(updated);
    } catch {
      Alert.alert('Error', 'Failed to update currency');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.sectionBody}>
      {saving && <ActivityIndicator style={{ marginBottom: 8 }} />}
      {POPULAR_CURRENCIES.map((c) => (
        <TouchableOpacity
          key={c.code}
          style={[styles.listItem, user?.baseCurrency === c.code && styles.listItemActive]}
          onPress={() => select(c.code)}
          activeOpacity={0.7}
        >
          <Text style={styles.itemIcon}>{c.flag}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemName}>{c.name}</Text>
            <Text style={styles.itemSub}>{c.code} · {c.symbol}</Text>
          </View>
          {user?.baseCurrency === c.code && <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />}
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── risk tolerance section ───────────────────────────────────────────────────

function RiskSection() {
  const { user, setUser } = useAuthStore();
  const [saving, setSaving] = useState(false);

  const options = [
    { value: 'low',    desc: 'Stable returns, minimal risk' },
    { value: 'medium', desc: 'Balanced growth and safety' },
    { value: 'high',   desc: 'Maximum growth, higher volatility' },
  ] as const;

  async function select(value: 'low' | 'medium' | 'high') {
    if (value === user?.riskTolerance) return;
    setSaving(true);
    try {
      const updated = await authApi.updateProfile({ riskTolerance: value });
      setUser(updated);
    } catch {
      Alert.alert('Error', 'Failed to update risk tolerance');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.sectionBody}>
      {saving && <ActivityIndicator style={{ marginBottom: 8 }} />}
      {options.map((o) => (
        <TouchableOpacity
          key={o.value}
          style={[styles.listItem, user?.riskTolerance === o.value && styles.listItemActive]}
          onPress={() => select(o.value)}
          activeOpacity={0.7}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.itemName} className="capitalize">{o.value}</Text>
            <Text style={styles.itemSub}>{o.desc}</Text>
          </View>
          {user?.riskTolerance === o.value && <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />}
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── main screen ──────────────────────────────────────────────────────────────

type Section = 'categories' | 'budgets' | 'goals' | 'currency' | 'risk' | null;

export default function SettingsScreen() {
  const { user, clearAuth } = useAuthStore();
  const [open, setOpen] = useState<Section>(null);
  function toggle(s: Section) { setOpen((p) => (p === s ? null : s)); }

  async function handleLogout() {
    Alert.alert('Log out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out', style: 'destructive',
        onPress: async () => { await authApi.logout(); clearAuth(); router.replace('/(auth)/login'); },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Card style={styles.profile}>
          <Text style={styles.avatar}>👤</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{user?.name}</Text>
            <Text style={styles.email}>{user?.email}</Text>
            <Text style={styles.meta}>{user?.baseCurrency} · {user?.riskTolerance} risk</Text>
          </View>
        </Card>

        <Card style={{ padding: 0 }}>
          <SectionHeader title="💰  Spending Categories" expanded={open === 'categories'} onPress={() => toggle('categories')} />
          {open === 'categories' && <CategoriesSection />}

          <SectionHeader title="📊  Budgets"            expanded={open === 'budgets'}    onPress={() => toggle('budgets')} />
          {open === 'budgets' && <BudgetsSection />}

          <SectionHeader title="🎯  Financial Goals"   expanded={open === 'goals'}      onPress={() => toggle('goals')} />
          {open === 'goals' && <GoalsSection />}

          <SectionHeader title="💱  Currency"           expanded={open === 'currency'}   onPress={() => toggle('currency')} />
          {open === 'currency' && <CurrencySection />}

          <View style={{ borderTopWidth: 1, borderTopColor: Colors.divider }}>
            <SectionHeader title="📈  Risk Tolerance"   expanded={open === 'risk'}       onPress={() => toggle('risk')} />
          </View>
          {open === 'risk' && <RiskSection />}
        </Card>

        <Card style={{ padding: 0 }}>
          <TouchableOpacity style={styles.dangerRow} onPress={handleLogout} activeOpacity={0.7}>
            <Text style={styles.itemIcon}>🚪</Text>
            <Text style={[styles.itemName, { color: Colors.danger, flex: 1 }]}>Log out</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.danger} />
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: Colors.background },
  scroll:         { flex: 1 },
  content:        { padding: 20, gap: 16, paddingBottom: 48 },
  profile:        { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar:         { fontSize: 40 },
  name:           { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  email:          { fontSize: 13, color: Colors.textSecondary },
  meta:           { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  sectionHeader:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  sectionTitle:   { flex: 1, fontSize: 15, fontWeight: '500', color: Colors.textPrimary },
  sectionBody:    { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: Colors.divider, gap: 4 },
  fieldLabel:     { fontSize: 11, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 8, marginBottom: 4 },
  chipRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip:           { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: Colors.divider, backgroundColor: Colors.surface },
  chipActive:     { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText:       { fontSize: 13, color: Colors.textSecondary, textTransform: 'capitalize' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  addRow:         { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 4 },
  input:          { backgroundColor: Colors.surface, borderRadius: 10, borderWidth: 1, borderColor: Colors.divider, paddingHorizontal: 12, paddingVertical: 10, color: Colors.textPrimary, fontSize: 14 },
  addBtn:         { backgroundColor: Colors.primary, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 },
  addBtnText:     { color: '#fff', fontWeight: '600', fontSize: 14 },
  listItem:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10, borderTopWidth: 1, borderTopColor: Colors.divider, marginTop: 2 },
  listItemActive: { backgroundColor: Colors.primary + '14' },
  itemIcon:       { fontSize: 20 },
  itemName:       { fontSize: 14, fontWeight: '500', color: Colors.textPrimary },
  itemSub:        { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  rowActions:     { flexDirection: 'row', gap: 6 },
  actionBtn:      { padding: 6, borderRadius: 8, backgroundColor: Colors.surface },
  progressTrack:  { height: 4, backgroundColor: Colors.divider, borderRadius: 2, marginTop: 4, overflow: 'hidden' },
  progressFill:   { height: '100%', backgroundColor: Colors.primary, borderRadius: 2 },
  dangerRow:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  comboboxTrigger:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  comboboxItem:   { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  // modal
  modalOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard:      { backgroundColor: Colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 36, gap: 8, maxHeight: '80%' },
  modalHeader:    { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  modalTitle:     { flex: 1, fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  saveBtn:        { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 12 },
  saveBtnText:    { color: '#fff', fontWeight: '700', fontSize: 15 },
});
