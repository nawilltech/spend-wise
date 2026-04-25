import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@components/common/Card';
import { useAuthStore } from '@store/auth.store';
import { Colors } from '@constants/colors';
import { getCurrencySymbol } from '@constants/currencies';

export default function DashboardScreen() {
  const { user } = useAuthStore();
  const symbol = getCurrencySymbol(user?.baseCurrency ?? 'NGN');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning 👋</Text>
            <Text style={styles.name}>{user?.name ?? 'User'}</Text>
          </View>
        </View>

        <Card style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Net Balance this month</Text>
          <Text style={styles.balanceAmount}>{symbol}0</Text>
          <View style={styles.balanceRow}>
            <View>
              <Text style={styles.balanceSubLabel}>Income</Text>
              <Text style={[styles.balanceSubAmount, { color: Colors.income }]}>{symbol}0</Text>
            </View>
            <View style={styles.divider} />
            <View>
              <Text style={styles.balanceSubLabel}>Expenses</Text>
              <Text style={[styles.balanceSubAmount, { color: Colors.expense }]}>{symbol}0</Text>
            </View>
          </View>
        </Card>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <Card>
            <Text style={styles.emptyText}>No transactions yet.{'\n'}Tap + to add your first one.</Text>
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Insight</Text>
          <Card style={styles.insightCard}>
            <Text style={styles.insightIcon}>💡</Text>
            <Text style={styles.insightText}>Add a few transactions and your AI advisor will give you personalised insights.</Text>
          </Card>
        </View>
      </ScrollView>
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
  balanceCard:      { backgroundColor: Colors.primary, padding: 24 },
  balanceLabel:     { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 8 },
  balanceAmount:    { fontSize: 36, fontWeight: '700', color: '#fff', marginBottom: 20 },
  balanceRow:       { flexDirection: 'row', gap: 24 },
  balanceSubLabel:  { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  balanceSubAmount: { fontSize: 18, fontWeight: '600', marginTop: 2 },
  divider:          { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  section:          { gap: 12 },
  sectionTitle:     { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  emptyText:        { textAlign: 'center', color: Colors.textMuted, fontSize: 14, paddingVertical: 20, lineHeight: 22 },
  insightCard:      { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  insightIcon:      { fontSize: 20 },
  insightText:      { flex: 1, color: Colors.textSecondary, fontSize: 14, lineHeight: 20 },
});
