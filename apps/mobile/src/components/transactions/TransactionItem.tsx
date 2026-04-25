import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Colors } from '@constants/colors';
import { getCurrencySymbol } from '@constants/currencies';
import { format } from 'date-fns';

interface TransactionItemProps {
  type: 'income' | 'expense';
  amount: number;
  currency: string;
  description: string;
  categoryName: string;
  categoryIcon: string;
  date: Date;
  onPress?: () => void;
}

export function TransactionItem({
  type, amount, currency, description, categoryName, categoryIcon, date, onPress,
}: TransactionItemProps) {
  const isIncome = type === 'income';
  const symbol = getCurrencySymbol(currency);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.icon}>
        <Text style={styles.iconText}>{categoryIcon}</Text>
      </View>
      <View style={styles.details}>
        <Text style={styles.description} numberOfLines={1}>{description}</Text>
        <Text style={styles.category}>{categoryName} · {format(date, 'MMM d')}</Text>
      </View>
      <Text style={[styles.amount, isIncome ? styles.income : styles.expense]}>
        {isIncome ? '+' : '-'}{symbol}{amount.toLocaleString()}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  icon:        { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  iconText:    { fontSize: 20 },
  details:     { flex: 1, gap: 3 },
  description: { fontSize: 15, fontWeight: '500', color: Colors.textPrimary },
  category:    { fontSize: 12, color: Colors.textSecondary },
  amount:      { fontSize: 15, fontWeight: '600' },
  income:      { color: Colors.income },
  expense:     { color: Colors.expense },
});
