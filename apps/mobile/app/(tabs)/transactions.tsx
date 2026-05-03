import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TransactionItem } from '@components/transactions/TransactionItem';
import { AddTransactionModal } from '@components/transactions/AddTransactionModal';
import { useTransactions } from '@hooks/useTransactions';
import { useCategories } from '@hooks/useCategories';
import { useBudgets } from '@hooks/useBudgets';
import { Colors } from '@constants/colors';
import type { Transaction, TransactionType } from '@/types';

type Filter = 'all' | TransactionType;
type ModalMode = { mode: 'create' } | { mode: 'edit'; tx: Transaction };

const FILTERS: { label: string; value: Filter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Income', value: 'income' },
  { label: 'Expenses', value: 'expense' },
];

export default function TransactionsScreen() {
  const [filter, setFilter] = useState<Filter>('all');
  const [modalMode, setModalMode] = useState<ModalMode | null>(null);

  const { transactions, loading, refetch, create, update, remove } = useTransactions({
    limit: 100,
    type: filter === 'all' ? undefined : filter,
  });
  const { categories } = useCategories();
  const { budgets } = useBudgets();

  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  const handleCreate = async (payload: Parameters<typeof create>[0]) => {
    const result = await create(payload);
    if (result) await refetch();
    return result !== null;
  };

  const handleUpdate = async (tx: Transaction, payload: Parameters<typeof create>[0]) => {
    const result = await update(tx.id, payload);
    return result !== null;
  };

  function confirmDelete(tx: Transaction) {
    Alert.alert(
      'Delete transaction?',
      `Remove "${tx.description || 'this transaction'}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            const ok = await remove(tx.id);
            if (!ok) Alert.alert('Error', 'Failed to delete transaction');
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        {/* Filter tabs */}
        <View style={styles.filterRow}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.value}
              style={[styles.filterBtn, filter === f.value && styles.filterBtnActive]}
              onPress={() => {
                setFilter(f.value);
                refetch(f.value === 'all' ? undefined : (f.value as TransactionType));
              }}
            >
              <Text style={[styles.filterText, filter === f.value && styles.filterTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator style={styles.loader} color={Colors.primary} />
        ) : (
          <FlatList
            data={transactions}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>📋</Text>
                <Text style={styles.emptyTitle}>No transactions yet</Text>
                <Text style={styles.emptyText}>Tap the + button to log your first income or expense.</Text>
              </View>
            }
            renderItem={({ item: tx }) => {
              const cat = tx.categoryId ? categoryMap[tx.categoryId] : null;
              return (
                <TransactionItem
                  type={tx.type}
                  amount={tx.amount}
                  currency={tx.currency}
                  description={tx.description}
                  categoryName={cat?.name ?? 'Uncategorised'}
                  categoryIcon={cat?.icon ?? '💳'}
                  date={new Date(tx.transactionDate)}
                  onEdit={() => setModalMode({ mode: 'edit', tx })}
                  onDelete={() => confirmDelete(tx)}
                />
              );
            }}
          />
        )}
      </View>

      {/* Floating add button */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalMode({ mode: 'create' })}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <AddTransactionModal
        key={modalMode?.mode === 'edit' ? modalMode.tx.id : 'new'}
        visible={modalMode !== null}
        categories={categories}
        budgets={budgets}
        initial={modalMode?.mode === 'edit' ? modalMode.tx : undefined}
        onClose={() => setModalMode(null)}
        onSubmit={async (payload) => {
          if (modalMode?.mode === 'edit') {
            return handleUpdate(modalMode.tx, payload);
          }
          return handleCreate(payload);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: Colors.background },
  container:       { flex: 1 },
  filterRow:       { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingVertical: 12 },
  filterBtn:       { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  filterBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText:      { fontSize: 14, color: Colors.textSecondary },
  filterTextActive:{ color: '#fff', fontWeight: '600' },
  loader:          { flex: 1, marginTop: 60 },
  list:            { paddingHorizontal: 20, paddingBottom: 100 },
  separator:       { height: 1, backgroundColor: Colors.divider },
  empty:           { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyIcon:       { fontSize: 48 },
  emptyTitle:      { fontSize: 18, fontWeight: '600', color: Colors.textPrimary },
  emptyText:       { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  fab:             { position: 'absolute', bottom: 28, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
  fabText:         { fontSize: 28, color: '#fff', marginTop: -2 },
});
