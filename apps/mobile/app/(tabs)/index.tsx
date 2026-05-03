import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@components/common/Card';
import { TransactionItem } from '@components/transactions/TransactionItem';
import { AddTransactionModal } from '@components/transactions/AddTransactionModal';
import { useAuthStore } from '@store/auth.store';
import { useTransactions } from '@hooks/useTransactions';
import { useAnalytics } from '@hooks/useAnalytics';
import { useCategories } from '@hooks/useCategories';
import { useBudgets } from '@hooks/useBudgets';
import { VerificationBanner } from '@components/common/VerificationBanner';
import { Colors } from '@constants/colors';
import { getCurrencySymbol } from '@constants/currencies';
import type { AnalyticsPeriod } from '@/types';
import type { AnalyticsFilter } from '@services/api/reports';

type PeriodMode = AnalyticsPeriod | 'custom';

const PERIOD_LABELS: { key: PeriodMode; label: string }[] = [
  { key: 'daily',     label: 'Day' },
  { key: 'weekly',    label: 'Week' },
  { key: 'monthly',   label: 'Month' },
  { key: 'quarterly', label: 'Quarter' },
  { key: 'annual',    label: 'Year' },
  { key: 'custom',    label: 'Custom' },
];

function getPeriodRange(period: AnalyticsPeriod): { start: string; end: string } {
  const now = new Date();
  const s = new Date(now);
  switch (period) {
    case 'daily':     s.setHours(0, 0, 0, 0); break;
    case 'weekly':    s.setDate(now.getDate() - now.getDay()); s.setHours(0, 0, 0, 0); break;
    case 'monthly':   s.setDate(1); s.setHours(0, 0, 0, 0); break;
    case 'quarterly': s.setMonth(Math.floor(now.getMonth() / 3) * 3, 1); s.setHours(0, 0, 0, 0); break;
    case 'annual':    s.setMonth(0, 1); s.setHours(0, 0, 0, 0); break;
  }
  return { start: s.toISOString(), end: now.toISOString() };
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardScreen() {
  const { user } = useAuthStore();
  const symbol = getCurrencySymbol(user?.baseCurrency ?? 'NGN');
  const [modalVisible, setModalVisible] = useState(false);

  const [periodMode, setPeriodMode] = useState<PeriodMode>('monthly');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const analyticsFilter = useMemo((): AnalyticsFilter => {
    if (periodMode === 'custom' && customStart && customEnd) {
      return { startDate: new Date(customStart).toISOString(), endDate: new Date(customEnd + 'T23:59:59').toISOString() };
    }
    if (periodMode !== 'custom') return { period: periodMode };
    return { period: 'monthly' };
  }, [periodMode, customStart, customEnd]);

  const txDates = useMemo(() => {
    if (periodMode === 'custom' && customStart && customEnd) {
      return { fromDate: new Date(customStart).toISOString(), toDate: new Date(customEnd + 'T23:59:59').toISOString() };
    }
    if (periodMode !== 'custom') {
      const { start, end } = getPeriodRange(periodMode);
      return { fromDate: start, toDate: end };
    }
    return {};
  }, [periodMode, customStart, customEnd]);

  const { analytics, loading: analyticsLoading } = useAnalytics(analyticsFilter);
  const { transactions, loading: txLoading, create } = useTransactions({ limit: 10, ...txDates });
  const { categories } = useCategories();
  const { budgets } = useBudgets();

  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  const budgetSpent = useMemo(() => {
    const map: Record<string, number> = {};
    if (analytics?.budgetBreakdown) {
      for (const b of analytics.budgetBreakdown) map[b.budgetId] = b.amount;
    }
    return map;
  }, [analytics]);

  const handleCreate = async (payload: Parameters<typeof create>[0]) => {
    const result = await create(payload);
    return result !== null;
  };

  const periodLabel = periodMode === 'custom' && customStart && customEnd
    ? `${customStart} → ${customEnd}`
    : `${PERIOD_LABELS.find((p) => p.key === periodMode)?.label ?? 'Period'} balance`;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {user && !user.emailVerified && <VerificationBanner />}

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.name}>{user?.name ?? 'User'}</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
            <Text style={styles.addBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Period filter */}
        <View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.periodScroll}>
            {PERIOD_LABELS.map(({ key, label }) => (
              <TouchableOpacity
                key={key}
                style={[styles.periodChip, periodMode === key && styles.periodChipActive]}
                onPress={() => setPeriodMode(key)}
              >
                <Text style={[styles.periodChipText, periodMode === key && styles.periodChipTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {periodMode === 'custom' && (
            <View style={styles.customDateRow}>
              <TextInput
                style={styles.dateInput}
                value={customStart}
                onChangeText={setCustomStart}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numbers-and-punctuation"
              />
              <Text style={styles.dateSeparator}>to</Text>
              <TextInput
                style={styles.dateInput}
                value={customEnd}
                onChangeText={setCustomEnd}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numbers-and-punctuation"
              />
            </View>
          )}
        </View>

        {/* Balance card */}
        <Card style={styles.balanceCard}>
          {analyticsLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.balanceLabel}>{periodLabel}</Text>
              <Text style={styles.balanceAmount}>
                {symbol}{(analytics?.netSavings ?? 0).toLocaleString()}
              </Text>
              <View style={styles.balanceRow}>
                <View>
                  <Text style={styles.balanceSubLabel}>Income</Text>
                  <Text style={[styles.balanceSubAmount, { color: Colors.income }]}>
                    {symbol}{(analytics?.totalIncome ?? 0).toLocaleString()}
                  </Text>
                </View>
                <View style={styles.divider} />
                <View>
                  <Text style={styles.balanceSubLabel}>Expenses</Text>
                  <Text style={[styles.balanceSubAmount, { color: '#ffb3b3' }]}>
                    {symbol}{(analytics?.totalExpense ?? 0).toLocaleString()}
                  </Text>
                </View>
                <View style={styles.divider} />
                <View>
                  <Text style={styles.balanceSubLabel}>Savings rate</Text>
                  <Text style={[styles.balanceSubAmount, { color: 'rgba(255,255,255,0.9)' }]}>
                    {(analytics?.savingsRate ?? 0).toFixed(1)}%
                  </Text>
                </View>
              </View>
            </>
          )}
        </Card>

        {/* Budget utilization */}
        {budgets.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Budget Utilization</Text>
            <Card>
              {budgets.map((b, i) => {
                const spent = budgetSpent[b.id] ?? 0;
                const pct = b.amount > 0 ? Math.min((spent / b.amount) * 100, 100) : 0;
                const over = spent > b.amount;
                return (
                  <View key={b.id}>
                    {i > 0 && <View style={styles.separator} />}
                    <View style={styles.budgetRow}>
                      <View style={styles.budgetLeft}>
                        <Text style={styles.budgetIcon}>{b.category?.icon ?? '💰'}</Text>
                        <View>
                          <Text style={styles.budgetName}>{b.category?.name}</Text>
                          <Text style={styles.budgetMeta}>{b.type} · {b.period}</Text>
                        </View>
                      </View>
                      <View style={styles.budgetRight}>
                        <Text style={[styles.budgetAmount, over && { color: Colors.danger }]}>
                          {symbol}{spent.toLocaleString()} / {symbol}{b.amount.toLocaleString()}
                        </Text>
                        <Text style={styles.budgetPct}>{pct.toFixed(0)}% used</Text>
                      </View>
                    </View>
                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${pct}%`, backgroundColor: over ? Colors.danger : Colors.primary },
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </Card>
          </View>
        )}

        {/* Recent transactions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <Card padding={0}>
            {txLoading ? (
              <ActivityIndicator style={styles.loader} color={Colors.primary} />
            ) : transactions.length === 0 ? (
              <Text style={styles.emptyText}>No transactions in this period.</Text>
            ) : (
              <View style={styles.txList}>
                {transactions.map((tx, i) => {
                  const cat = tx.categoryId ? categoryMap[tx.categoryId] : null;
                  return (
                    <View key={tx.id}>
                      {i > 0 && <View style={styles.separator} />}
                      <TransactionItem
                        type={tx.type}
                        amount={tx.amount}
                        currency={tx.currency}
                        description={tx.description}
                        categoryName={cat?.name ?? 'Uncategorised'}
                        categoryIcon={cat?.icon ?? '💳'}
                        date={new Date(tx.transactionDate)}
                      />
                    </View>
                  );
                })}
              </View>
            )}
          </Card>
        </View>

        {/* Top spending categories */}
        {analytics && analytics.categoryBreakdown.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Spending Categories</Text>
            <Card>
              {analytics.categoryBreakdown.slice(0, 4).map((item) => (
                <View key={item.categoryId ?? item.categoryName} style={styles.breakdownRow}>
                  <View style={styles.breakdownInfo}>
                    <Text style={styles.breakdownName}>{item.categoryName ?? 'Other'}</Text>
                    <Text style={styles.breakdownCount}>{item.count} transactions</Text>
                  </View>
                  <View style={styles.breakdownRight}>
                    <Text style={styles.breakdownAmount}>{symbol}{item.amount.toLocaleString()}</Text>
                    <Text style={styles.breakdownPct}>{item.percentage.toFixed(1)}%</Text>
                  </View>
                </View>
              ))}
            </Card>
          </View>
        )}
      </ScrollView>

      <AddTransactionModal
        visible={modalVisible}
        categories={categories}
        budgets={budgets}
        onClose={() => setModalVisible(false)}
        onSubmit={handleCreate}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:                 { flex: 1, backgroundColor: Colors.background },
  scroll:               { flex: 1 },
  content:              { padding: 20, gap: 20, paddingBottom: 40 },
  header:               { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting:             { fontSize: 13, color: Colors.textSecondary },
  name:                 { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  addBtn:               { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  addBtnText:           { fontSize: 24, color: '#fff', marginTop: -2 },

  periodScroll:         { flexGrow: 0 },
  periodChip:           { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, marginRight: 8, backgroundColor: Colors.background },
  periodChipActive:     { borderColor: Colors.primary, backgroundColor: Colors.primary },
  periodChipText:       { fontSize: 13, color: Colors.textSecondary },
  periodChipTextActive: { color: '#fff', fontWeight: '500' },
  customDateRow:        { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  dateInput:            { flex: 1, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, color: Colors.textPrimary, backgroundColor: Colors.background },
  dateSeparator:        { fontSize: 12, color: Colors.textMuted },

  balanceCard:          { backgroundColor: Colors.primary, padding: 24 },
  balanceLabel:         { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 8 },
  balanceAmount:        { fontSize: 36, fontWeight: '700', color: '#fff', marginBottom: 20 },
  balanceRow:           { flexDirection: 'row', gap: 16 },
  balanceSubLabel:      { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  balanceSubAmount:     { fontSize: 16, fontWeight: '600', marginTop: 2 },
  divider:              { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },

  section:              { gap: 12 },
  sectionTitle:         { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },

  budgetRow:            { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  budgetLeft:           { flexDirection: 'row', alignItems: 'center', gap: 10 },
  budgetIcon:           { fontSize: 20 },
  budgetName:           { fontSize: 14, fontWeight: '500', color: Colors.textPrimary },
  budgetMeta:           { fontSize: 11, color: Colors.textMuted, textTransform: 'capitalize', marginTop: 1 },
  budgetRight:          { alignItems: 'flex-end' },
  budgetAmount:         { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  budgetPct:            { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  progressTrack:        { height: 5, backgroundColor: Colors.divider, borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  progressFill:         { height: '100%', borderRadius: 3 },

  loader:               { paddingVertical: 24 },
  emptyText:            { textAlign: 'center', color: Colors.textMuted, fontSize: 14, paddingVertical: 24, lineHeight: 22 },
  txList:               { paddingHorizontal: 16 },
  separator:            { height: 1, backgroundColor: Colors.divider },

  breakdownRow:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  breakdownInfo:        { gap: 2 },
  breakdownName:        { fontSize: 14, fontWeight: '500', color: Colors.textPrimary },
  breakdownCount:       { fontSize: 12, color: Colors.textMuted },
  breakdownRight:       { alignItems: 'flex-end', gap: 2 },
  breakdownAmount:      { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  breakdownPct:         { fontSize: 12, color: Colors.textSecondary },
});
