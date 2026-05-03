import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal,
  TextInput, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@constants/colors';
import { POPULAR_CURRENCIES } from '@constants/currencies';
import { Card } from '@components/common/Card';
import { useAuthStore } from '@store/auth.store';
import { authApi } from '@services/api/auth';
import { useCategories } from '@hooks/useCategories';
import { useBudgets } from '@hooks/useBudgets';
import { useGoals } from '@hooks/useGoals';
import type { CategoryCreate, BudgetCreate, GoalCreate, GoalType, BudgetPeriod, CategoryType } from '@/types';

// ── small helpers ────────────────────────────────────────────────────────────

function SectionHeader({ title, expanded, onPress }: { title: string; expanded: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.sectionHeader} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.textMuted} />
    </TouchableOpacity>
  );
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
      activeOpacity={0.7}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ── categories section ───────────────────────────────────────────────────────

function CategoriesSection() {
  const { categories, create, remove, loading } = useCategories();
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
    else Alert.alert('Error', 'Failed to create category');
  }

  async function handleDelete(id: string, catName: string) {
    Alert.alert('Delete Category', `Remove "${catName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await remove(id); } },
    ]);
  }

  return (
    <View style={styles.sectionBody}>
      <View style={styles.chipRow}>
        {(['expense', 'income', 'both'] as CategoryType[]).map((t) => (
          <Chip key={t} label={t} selected={type === t} onPress={() => setType(t)} />
        ))}
      </View>
      <View style={styles.addRow}>
        <TextInput
          style={styles.textInput}
          placeholder="Category name"
          placeholderTextColor={Colors.textMuted}
          value={name}
          onChangeText={setName}
        />
        <TouchableOpacity style={styles.addBtn} onPress={handleAdd} disabled={saving}>
          {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.addBtnText}>Add</Text>}
        </TouchableOpacity>
      </View>
      {loading && <ActivityIndicator style={{ marginTop: 8 }} />}
      {categories.map((c) => (
        <View key={c.id} style={styles.listItem}>
          <Text style={styles.listItemIcon}>{c.icon || '📂'}</Text>
          <View style={styles.listItemBody}>
            <Text style={styles.listItemName}>{c.name}</Text>
            <Text style={styles.listItemSub}>{c.type}</Text>
          </View>
          {!c.isDefault && (
            <TouchableOpacity onPress={() => handleDelete(c.id, c.name)}>
              <Ionicons name="trash-outline" size={18} color={Colors.danger} />
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  );
}

// ── budgets section ──────────────────────────────────────────────────────────

function BudgetsSection() {
  const { budgets, create, remove, loading } = useBudgets();
  const { categories } = useCategories();
  const { user } = useAuthStore();
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState<BudgetPeriod>('monthly');
  const [categoryId, setCategoryId] = useState('');
  const [saving, setSaving] = useState(false);

  const expenseCategories = categories.filter((c) => c.type === 'expense' || c.type === 'both');

  async function handleAdd() {
    if (!amount || !categoryId) {
      Alert.alert('Missing fields', 'Select a category and enter an amount');
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
    else Alert.alert('Error', 'Failed to create budget');
  }

  async function handleDelete(id: string) {
    Alert.alert('Delete Budget', 'Remove this budget?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await remove(id); } },
    ]);
  }

  return (
    <View style={styles.sectionBody}>
      <Text style={styles.fieldLabel}>Period</Text>
      <View style={styles.chipRow}>
        {(['daily', 'weekly', 'monthly', 'quarterly', 'annual'] as BudgetPeriod[]).map((p) => (
          <Chip key={p} label={p} selected={period === p} onPress={() => setPeriod(p)} />
        ))}
      </View>
      <Text style={styles.fieldLabel}>Category</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
        <View style={styles.chipRow}>
          {expenseCategories.map((c) => (
            <Chip key={c.id} label={c.name} selected={categoryId === c.id} onPress={() => setCategoryId(c.id)} />
          ))}
        </View>
      </ScrollView>
      <View style={styles.addRow}>
        <TextInput
          style={[styles.textInput, { flex: 1 }]}
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
      {loading && <ActivityIndicator style={{ marginTop: 8 }} />}
      {budgets.map((b) => (
        <View key={b.id} style={styles.listItem}>
          <Text style={styles.listItemIcon}>{b.category?.icon || '💰'}</Text>
          <View style={styles.listItemBody}>
            <Text style={styles.listItemName}>{b.category?.name}</Text>
            <Text style={styles.listItemSub}>{b.period} · {b.currency} {b.amount.toLocaleString()}</Text>
          </View>
          <TouchableOpacity onPress={() => handleDelete(b.id)}>
            <Ionicons name="trash-outline" size={18} color={Colors.danger} />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}

// ── goals section ────────────────────────────────────────────────────────────

function GoalsSection() {
  const { goals, create, remove, loading } = useGoals();
  const { user } = useAuthStore();
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
    else Alert.alert('Error', 'Failed to create goal');
  }

  async function handleDelete(id: string, goalName: string) {
    Alert.alert('Delete Goal', `Remove "${goalName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await remove(id); } },
    ]);
  }

  return (
    <View style={styles.sectionBody}>
      <Text style={styles.fieldLabel}>Goal Type</Text>
      <View style={styles.chipRow}>
        {(['savings', 'debt', 'emergency', 'investment', 'custom'] as GoalType[]).map((t) => (
          <Chip key={t} label={t} selected={goalType === t} onPress={() => setGoalType(t)} />
        ))}
      </View>
      <View style={styles.addRow}>
        <TextInput
          style={[styles.textInput, { flex: 1 }]}
          placeholder="Goal name"
          placeholderTextColor={Colors.textMuted}
          value={name}
          onChangeText={setName}
        />
      </View>
      <View style={[styles.addRow, { marginTop: 8 }]}>
        <TextInput
          style={[styles.textInput, { flex: 1 }]}
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
      {loading && <ActivityIndicator style={{ marginTop: 8 }} />}
      {goals.map((g) => (
        <View key={g.id} style={styles.listItem}>
          <Text style={styles.listItemIcon}>🎯</Text>
          <View style={styles.listItemBody}>
            <Text style={styles.listItemName}>{g.name}</Text>
            <Text style={styles.listItemSub}>
              {g.currency} {g.currentAmount.toLocaleString()} / {g.targetAmount.toLocaleString()} · {g.type}
            </Text>
          </View>
          <TouchableOpacity onPress={() => handleDelete(g.id, g.name)}>
            <Ionicons name="trash-outline" size={18} color={Colors.danger} />
          </TouchableOpacity>
        </View>
      ))}
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
          style={[styles.listItem, user?.baseCurrency === c.code && styles.listItemSelected]}
          onPress={() => select(c.code)}
          activeOpacity={0.7}
        >
          <Text style={styles.listItemIcon}>{c.flag}</Text>
          <View style={styles.listItemBody}>
            <Text style={styles.listItemName}>{c.name}</Text>
            <Text style={styles.listItemSub}>{c.code} · {c.symbol}</Text>
          </View>
          {user?.baseCurrency === c.code && (
            <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── risk tolerance section ───────────────────────────────────────────────────

function RiskToleranceSection() {
  const { user, setUser } = useAuthStore();
  const [saving, setSaving] = useState(false);

  const options = [
    { value: 'low',    label: 'Low',    desc: 'Stable returns, minimal risk' },
    { value: 'medium', label: 'Medium', desc: 'Balanced growth and safety' },
    { value: 'high',   label: 'High',   desc: 'Maximum growth, higher volatility' },
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
          style={[styles.listItem, user?.riskTolerance === o.value && styles.listItemSelected]}
          onPress={() => select(o.value)}
          activeOpacity={0.7}
        >
          <View style={styles.listItemBody}>
            <Text style={styles.listItemName}>{o.label}</Text>
            <Text style={styles.listItemSub}>{o.desc}</Text>
          </View>
          {user?.riskTolerance === o.value && (
            <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── main screen ──────────────────────────────────────────────────────────────

type Section = 'categories' | 'budgets' | 'goals' | 'currency' | 'risk' | null;

export default function SettingsScreen() {
  const { user, clearAuth } = useAuthStore();
  const [openSection, setOpenSection] = useState<Section>(null);

  function toggle(section: Section) {
    setOpenSection((prev) => (prev === section ? null : section));
  }

  async function handleLogout() {
    Alert.alert('Log out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out', style: 'destructive',
        onPress: async () => {
          await authApi.logout();
          clearAuth();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Profile card */}
        <Card style={styles.profile}>
          <Text style={styles.avatar}>👤</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{user?.name}</Text>
            <Text style={styles.email}>{user?.email}</Text>
            <Text style={styles.currency}>{user?.baseCurrency} · {user?.riskTolerance} risk</Text>
          </View>
        </Card>

        {/* Preferences */}
        <Card style={{ padding: 0 }}>
          <SectionHeader title="💰  Spending Categories" expanded={openSection === 'categories'} onPress={() => toggle('categories')} />
          {openSection === 'categories' && <CategoriesSection />}

          <SectionHeader title="📊  Budgets" expanded={openSection === 'budgets'} onPress={() => toggle('budgets')} />
          {openSection === 'budgets' && <BudgetsSection />}

          <SectionHeader title="🎯  Financial Goals" expanded={openSection === 'goals'} onPress={() => toggle('goals')} />
          {openSection === 'goals' && <GoalsSection />}

          <SectionHeader title="💱  Currency" expanded={openSection === 'currency'} onPress={() => toggle('currency')} />
          {openSection === 'currency' && <CurrencySection />}

          <View style={{ borderTopWidth: 1, borderTopColor: Colors.divider }}>
            <SectionHeader title="📈  Risk Tolerance" expanded={openSection === 'risk'} onPress={() => toggle('risk')} />
          </View>
          {openSection === 'risk' && <RiskToleranceSection />}
        </Card>

        {/* Logout */}
        <Card style={{ padding: 0 }}>
          <TouchableOpacity style={styles.dangerRow} onPress={handleLogout} activeOpacity={0.7}>
            <Text style={styles.dangerRowIcon}>🚪</Text>
            <Text style={[styles.listItemName, { color: Colors.danger, flex: 1 }]}>Log out</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.danger} />
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:              { flex: 1, backgroundColor: Colors.background },
  scroll:            { flex: 1 },
  content:           { padding: 20, gap: 16, paddingBottom: 48 },
  profile:           { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar:            { fontSize: 40 },
  name:              { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  email:             { fontSize: 13, color: Colors.textSecondary },
  currency:          { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  sectionHeader:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  sectionTitle:      { flex: 1, fontSize: 15, fontWeight: '500', color: Colors.textPrimary },
  sectionBody:       { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  fieldLabel:        { fontSize: 12, color: Colors.textMuted, marginBottom: 6, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  chipRow:           { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  chip:              { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: Colors.divider, backgroundColor: Colors.surface },
  chipSelected:      { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText:          { fontSize: 13, color: Colors.textSecondary },
  chipTextSelected:  { color: '#fff', fontWeight: '600' },
  addRow:            { flexDirection: 'row', gap: 8, alignItems: 'center' },
  textInput:         { flex: 1, backgroundColor: Colors.surface, borderRadius: 10, borderWidth: 1, borderColor: Colors.divider, paddingHorizontal: 12, paddingVertical: 10, color: Colors.textPrimary, fontSize: 14 },
  addBtn:            { backgroundColor: Colors.primary, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 },
  addBtnText:        { color: '#fff', fontWeight: '600', fontSize: 14 },
  listItem:          { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12, borderTopWidth: 1, borderTopColor: Colors.divider },
  listItemSelected:  { backgroundColor: Colors.primary + '12' },
  listItemIcon:      { fontSize: 20 },
  listItemBody:      { flex: 1 },
  listItemName:      { fontSize: 14, fontWeight: '500', color: Colors.textPrimary },
  listItemSub:       { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  dangerRow:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  dangerRowIcon:     { fontSize: 20 },
});
