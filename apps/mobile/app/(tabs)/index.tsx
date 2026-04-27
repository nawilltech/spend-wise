import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@components/common/Card';
import { TransactionItem } from '@components/transactions/TransactionItem';
import { AddTransactionModal } from '@components/transactions/AddTransactionModal';
import { useAuthStore } from '@store/auth.store';
import { useTransactions } from '@hooks/useTransactions';
import { useAnalytics } from '@hooks/useAnalytics';
import { useCategories } from '@hooks/useCategories';
import { Colors } from '@constants/colors';
import { getCurrencySymbol } from '@constants/currencies';

export default function DashboardScreen() {
  const { user } = useAuthStore();
  const symbol = getCurrencySymbol(user?.baseCurrency ?? 'NGN');
  const [modalVisible, setModalVisible] = useState(false);

  const { analytics, loading: analyticsLoading } = useAnalytics('monthly');
  const { transactions, loading: txLoading, create } = useTransactions({ limit: 5 });
  const { categories } = useCategories();

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));
  const recent = transactions.slice(0, 5);

  const handleCreate = async (payload: Parameters<typeof create>[0]) => {
    const result = await create(payload);
    return result !== null;
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting()}</Text>
            <Text style={styles.name}>{user?.name ?? 'User'}</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
            <Text style={styles.addBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        <Card style={styles.balanceCard}>
          {analyticsLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.balanceLabel}>Net Balance this month</Text>
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <Card padding={0}>
            {txLoading ? (
              <ActivityIndicator style={styles.loader} color={Colors.primary} />
            ) : recent.length === 0 ? (
              <Text style={styles.emptyText}>No transactions yet.{'\n'}Tap + to add your first one.</Text>
            ) : (
              <View style={styles.txList}>
                {recent.map((tx, i) => {
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
        onClose={() => setModalVisible(false)}
        onSubmit={handleCreate}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: Colors.background },
  scroll:           { flex: 1 },
  content:          { padding: 20, gap: 20, paddingBottom: 40 },
  header:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting:         { fontSize: 13, color: Colors.textSecondary },
  name:             { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  addBtn:           { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  addBtnText:       { fontSize: 24, color: '#fff', marginTop: -2 },
  balanceCard:      { backgroundColor: Colors.primary, padding: 24 },
  balanceLabel:     { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 8 },
  balanceAmount:    { fontSize: 36, fontWeight: '700', color: '#fff', marginBottom: 20 },
  balanceRow:       { flexDirection: 'row', gap: 16 },
  balanceSubLabel:  { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  balanceSubAmount: { fontSize: 16, fontWeight: '600', marginTop: 2 },
  divider:          { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  section:          { gap: 12 },
  sectionTitle:     { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  loader:           { paddingVertical: 24 },
  emptyText:        { textAlign: 'center', color: Colors.textMuted, fontSize: 14, paddingVertical: 24, lineHeight: 22 },
  txList:           { paddingHorizontal: 16 },
  separator:        { height: 1, backgroundColor: Colors.divider },
  breakdownRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  breakdownInfo:    { gap: 2 },
  breakdownName:    { fontSize: 14, fontWeight: '500', color: Colors.textPrimary },
  breakdownCount:   { fontSize: 12, color: Colors.textMuted },
  breakdownRight:   { alignItems: 'flex-end', gap: 2 },
  breakdownAmount:  { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  breakdownPct:     { fontSize: 12, color: Colors.textSecondary },
});
