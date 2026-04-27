import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@constants/colors';
import { Card } from '@components/common/Card';
import { useBudgets } from '@hooks/useBudgets';
import { useAuthStore } from '@store/auth.store';
import { getCurrencySymbol } from '@constants/currencies';

function ProgressBar({ percent }: { percent: number }) {
  const clamped = Math.min(Math.max(percent, 0), 100);
  const color = clamped >= 90 ? Colors.danger : clamped >= 70 ? Colors.warning : Colors.success;
  return (
    <View style={bar.track}>
      <View style={[bar.fill, { width: `${clamped}%` as `${number}%`, backgroundColor: color }]} />
    </View>
  );
}

const bar = StyleSheet.create({
  track: { height: 6, borderRadius: 3, backgroundColor: Colors.divider, overflow: 'hidden', marginTop: 8 },
  fill:  { height: '100%', borderRadius: 3 },
});

export default function BudgetScreen() {
  const { user } = useAuthStore();
  const symbol = getCurrencySymbol(user?.baseCurrency ?? 'NGN');
  const { budgets, loading, error } = useBudgets();

  const active = budgets.filter((b) => b.isActive);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.pageTitle}>Budgets</Text>

        {loading ? (
          <ActivityIndicator color={Colors.primary} style={styles.loader} />
        ) : error ? (
          <Card>
            <Text style={styles.errorText}>{error}</Text>
          </Card>
        ) : active.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.icon}>🎯</Text>
            <Text style={styles.title}>No budgets yet</Text>
            <Text style={styles.text}>Set spending limits per category to stay on track.</Text>
          </Card>
        ) : (
          <>
            {/* Summary row */}
            <View style={styles.summaryRow}>
              <Card style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{active.length}</Text>
                <Text style={styles.summaryLabel}>Active</Text>
              </Card>
              <Card style={styles.summaryCard}>
                <Text style={[styles.summaryValue, { color: Colors.danger }]}>
                  {active.filter((b) => b.percentUsed >= 90).length}
                </Text>
                <Text style={styles.summaryLabel}>Near limit</Text>
              </Card>
              <Card style={styles.summaryCard}>
                <Text style={[styles.summaryValue, { color: Colors.success }]}>
                  {active.filter((b) => b.percentUsed < 70).length}
                </Text>
                <Text style={styles.summaryLabel}>On track</Text>
              </Card>
            </View>

            {/* Budget cards */}
            {active.map((budget) => (
              <Card key={budget.id} style={styles.budgetCard}>
                <View style={styles.budgetHeader}>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryIcon}>{budget.category.icon}</Text>
                  </View>
                  <View style={styles.budgetInfo}>
                    <Text style={styles.budgetName}>{budget.category.name}</Text>
                    <Text style={styles.budgetPeriod}>{budget.period} · {budget.category.type}</Text>
                  </View>
                  <View style={styles.budgetAmountCol}>
                    <Text style={styles.budgetLimit}>{symbol}{budget.amount.toLocaleString()}</Text>
                    <Text style={styles.budgetPeriodSmall}>limit</Text>
                  </View>
                </View>

                <ProgressBar percent={budget.percentUsed} />

                <View style={styles.budgetFooter}>
                  <Text style={styles.spentText}>
                    Spent: <Text style={styles.spentValue}>{symbol}{budget.spent.toLocaleString()}</Text>
                  </Text>
                  <Text style={[
                    styles.remainingText,
                    budget.remaining === 0 ? { color: Colors.danger } : { color: Colors.success },
                  ]}>
                    {budget.remaining === 0
                      ? 'Over budget'
                      : `${symbol}${budget.remaining.toLocaleString()} left`}
                  </Text>
                </View>
              </Card>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: Colors.background },
  scroll:         { flex: 1 },
  content:        { padding: 20, gap: 16, paddingBottom: 40 },
  pageTitle:      { fontSize: 24, fontWeight: '700', color: Colors.textPrimary },
  loader:         { marginTop: 40 },
  errorText:      { textAlign: 'center', color: Colors.danger, paddingVertical: 20 },
  emptyCard:      { alignItems: 'center', gap: 12, padding: 32 },
  icon:           { fontSize: 48 },
  title:          { fontSize: 18, fontWeight: '600', color: Colors.textPrimary },
  text:           { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  summaryRow:     { flexDirection: 'row', gap: 12 },
  summaryCard:    { flex: 1, alignItems: 'center', padding: 14, gap: 4 },
  summaryValue:   { fontSize: 24, fontWeight: '700', color: Colors.textPrimary },
  summaryLabel:   { fontSize: 12, color: Colors.textSecondary },
  budgetCard:     { gap: 0 },
  budgetHeader:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  categoryBadge:  { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  categoryIcon:   { fontSize: 20 },
  budgetInfo:     { flex: 1, gap: 2 },
  budgetName:     { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  budgetPeriod:   { fontSize: 12, color: Colors.textSecondary, textTransform: 'capitalize' },
  budgetAmountCol:{ alignItems: 'flex-end', gap: 2 },
  budgetLimit:    { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  budgetPeriodSmall: { fontSize: 11, color: Colors.textMuted },
  budgetFooter:   { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  spentText:      { fontSize: 13, color: Colors.textSecondary },
  spentValue:     { fontWeight: '600', color: Colors.textPrimary },
  remainingText:  { fontSize: 13, fontWeight: '500' },
});
