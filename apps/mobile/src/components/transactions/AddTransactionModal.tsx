import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Modal, StyleSheet,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Colors } from '@constants/colors';
import { POPULAR_CURRENCIES } from '@constants/currencies';
import type { TransactionCreate, TransactionType, Category } from '@/types';

interface AddTransactionModalProps {
  visible: boolean;
  categories: Category[];
  onClose: () => void;
  onSubmit: (payload: TransactionCreate) => Promise<boolean>;
}

export function AddTransactionModal({ visible, categories, onClose, onSubmit }: AddTransactionModalProps) {
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('NGN');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = categories.filter((c) => c.type === type || c.type === 'both');

  const reset = () => {
    setType('expense');
    setAmount('');
    setCurrency('NGN');
    setCategoryId(null);
    setDate(new Date().toISOString().split('T')[0]);
    setDescription('');
    setError(null);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async () => {
    const parsed = parseFloat(amount);
    if (!amount || isNaN(parsed) || parsed <= 0) {
      setError('Enter a valid amount');
      return;
    }
    setError(null);
    setSubmitting(true);
    const ok = await onSubmit({
      type,
      amount: parsed,
      currency,
      description: description.trim() || type,
      categoryId: categoryId ?? undefined,
      transactionDate: date,
    });
    setSubmitting(false);
    if (ok) { reset(); onClose(); }
    else setError('Failed to save transaction');
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} hitSlop={8}>
            <Text style={styles.cancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Add Transaction</Text>
          <TouchableOpacity onPress={handleSubmit} hitSlop={8} disabled={submitting}>
            {submitting
              ? <ActivityIndicator size="small" color={Colors.primary} />
              : <Text style={styles.save}>Save</Text>}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} keyboardShouldPersistTaps="handled">
          {/* Type toggle */}
          <View style={styles.typeRow}>
            {(['expense', 'income'] as TransactionType[]).map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.typeBtn, type === t && (t === 'expense' ? styles.typeBtnExpense : styles.typeBtnIncome)]}
                onPress={() => { setType(t); setCategoryId(null); }}
              >
                <Text style={[styles.typeBtnText, type === t && styles.typeBtnTextActive]}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Currency chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.currencyScroll}>
            {POPULAR_CURRENCIES.slice(0, 6).map((c) => (
              <TouchableOpacity
                key={c.code}
                style={[styles.currencyChip, currency === c.code && styles.currencyChipActive]}
                onPress={() => setCurrency(c.code)}
              >
                <Text style={[styles.currencyChipText, currency === c.code && styles.currencyChipTextActive]}>
                  {c.flag} {c.code}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Amount */}
          <View style={styles.inputWrap}>
            <Text style={styles.label}>Amount</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor={Colors.textMuted}
              keyboardType="decimal-pad"
              autoFocus
            />
          </View>

          {/* Category */}
          {filtered.length > 0 && (
            <View style={styles.inputWrap}>
              <Text style={styles.label}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                {filtered.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.categoryChip, categoryId === cat.id && styles.categoryChipActive]}
                    onPress={() => setCategoryId(categoryId === cat.id ? null : cat.id)}
                  >
                    <Text style={styles.categoryIcon}>{cat.icon}</Text>
                    <Text style={[styles.categoryChipText, categoryId === cat.id && styles.categoryChipTextActive]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Date */}
          <View style={styles.inputWrap}>
            <Text style={styles.label}>Date</Text>
            <TextInput
              style={styles.input}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numbers-and-punctuation"
            />
          </View>

          {/* Description */}
          <View style={styles.inputWrap}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={styles.input}
              value={description}
              onChangeText={setDescription}
              placeholder="Optional"
              placeholderTextColor={Colors.textMuted}
            />
          </View>

          {error && <Text style={styles.error}>{error}</Text>}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex:                  { flex: 1, backgroundColor: Colors.surface },
  header:                { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title:                 { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  cancel:                { fontSize: 16, color: Colors.textSecondary },
  save:                  { fontSize: 16, fontWeight: '600', color: Colors.primary },
  body:                  { flex: 1 },
  bodyContent:           { padding: 20, gap: 20, paddingBottom: 40 },
  typeRow:               { flexDirection: 'row', gap: 12 },
  typeBtn:               { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center' },
  typeBtnExpense:        { backgroundColor: Colors.expense, borderColor: Colors.expense },
  typeBtnIncome:         { backgroundColor: Colors.income, borderColor: Colors.income },
  typeBtnText:           { fontSize: 15, fontWeight: '500', color: Colors.textSecondary },
  typeBtnTextActive:     { color: '#fff' },
  currencyScroll:        { flexGrow: 0 },
  currencyChip:          { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, marginRight: 8, backgroundColor: Colors.background },
  currencyChipActive:    { borderColor: Colors.primary, backgroundColor: Colors.primary },
  currencyChipText:      { fontSize: 13, color: Colors.textSecondary },
  currencyChipTextActive:{ color: '#fff' },
  inputWrap:             { gap: 6 },
  label:                 { fontSize: 13, fontWeight: '500', color: Colors.textSecondary },
  input:                 { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: Colors.textPrimary, backgroundColor: Colors.background },
  categoryScroll:        { flexGrow: 0 },
  categoryChip:          { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, marginRight: 8, backgroundColor: Colors.background },
  categoryChipActive:    { borderColor: Colors.primary, backgroundColor: '#EFF6FF' },
  categoryIcon:          { fontSize: 16 },
  categoryChipText:      { fontSize: 13, color: Colors.textSecondary },
  categoryChipTextActive:{ color: Colors.primary, fontWeight: '500' },
  error:                 { fontSize: 13, color: Colors.danger, textAlign: 'center' },
});
