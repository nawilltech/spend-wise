import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@constants/colors';
import { Card } from '@components/common/Card';
import { aiApi } from '@services/api/ai';
import { useAuthStore } from '@store/auth.store';
import { getCurrencySymbol } from '@constants/currencies';
import type { BudgetAdvice, InvestmentSuggestionsResponse } from '@/types';

type Tab = 'budget' | 'invest';

export default function InsightsScreen() {
  const { user } = useAuthStore();
  const symbol = getCurrencySymbol(user?.baseCurrency ?? 'NGN');

  const [tab, setTab] = useState<Tab>('budget');
  const [budgetAdvice, setBudgetAdvice] = useState<BudgetAdvice | null>(null);
  const [investData, setInvestData] = useState<InvestmentSuggestionsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBudgetAdvice = useCallback(async () => {
    if (budgetAdvice) return;
    setLoading(true);
    setError(null);
    try {
      const data = await aiApi.getBudgetAdvice();
      setBudgetAdvice(data);
    } catch {
      setError('Could not load budget advice. Make sure you have some transactions first.');
    } finally {
      setLoading(false);
    }
  }, [budgetAdvice]);

  const loadInvestments = useCallback(async () => {
    if (investData) return;
    setLoading(true);
    setError(null);
    try {
      const data = await aiApi.getInvestmentSuggestions() as unknown as InvestmentSuggestionsResponse;
      setInvestData(data);
    } catch {
      setError('Could not load investment suggestions.');
    } finally {
      setLoading(false);
    }
  }, [investData]);

  const handleTabChange = (t: Tab) => {
    setTab(t);
    setError(null);
    if (t === 'budget') loadBudgetAdvice();
    else loadInvestments();
  };

  const riskColor = (level: string) => {
    if (level === 'low') return Colors.success;
    if (level === 'medium') return Colors.warning;
    return Colors.danger;
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.pageTitle}>AI Insights</Text>

        {/* Tab selector */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, tab === 'budget' && styles.tabActive]}
            onPress={() => handleTabChange('budget')}
          >
            <Text style={[styles.tabText, tab === 'budget' && styles.tabTextActive]}>Budget Advice</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === 'invest' && styles.tabActive]}
            onPress={() => handleTabChange('invest')}
          >
            <Text style={[styles.tabText, tab === 'invest' && styles.tabTextActive]}>Investments</Text>
          </TouchableOpacity>
        </View>

        {/* Load trigger */}
        {!loading && !error && ((tab === 'budget' && !budgetAdvice) || (tab === 'invest' && !investData)) && (
          <Card style={styles.promptCard}>
            <Text style={styles.promptIcon}>🤖</Text>
            <Text style={styles.promptTitle}>
              {tab === 'budget' ? 'Get personalised budget advice' : 'Discover investment opportunities'}
            </Text>
            <Text style={styles.promptText}>
              {tab === 'budget'
                ? 'Your AI advisor will analyse your spending and suggest optimal budget allocations.'
                : 'Based on your income and savings rate, get tailored investment ideas.'}
            </Text>
            <TouchableOpacity
              style={styles.analyseBtn}
              onPress={() => tab === 'budget' ? loadBudgetAdvice() : loadInvestments()}
            >
              <Text style={styles.analyseBtnText}>Analyse now</Text>
            </TouchableOpacity>
          </Card>
        )}

        {loading && <ActivityIndicator color={Colors.primary} style={styles.loader} />}

        {error && (
          <Card style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => tab === 'budget' ? (setBudgetAdvice(null), loadBudgetAdvice()) : (setInvestData(null), loadInvestments())}
            >
              <Text style={styles.retryText}>Try again</Text>
            </TouchableOpacity>
          </Card>
        )}

        {/* Budget advice */}
        {tab === 'budget' && budgetAdvice && (
          <>
            {budgetAdvice.insights.length > 0 && (
              <Card style={styles.insightsList}>
                <Text style={styles.sectionHeader}>Key Insights</Text>
                {budgetAdvice.insights.map((insight, i) => (
                  <View key={i} style={styles.insightRow}>
                    <Text style={styles.insightBullet}>💡</Text>
                    <Text style={styles.insightText}>{insight}</Text>
                  </View>
                ))}
              </Card>
            )}

            {budgetAdvice.allocations.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recommended Allocations</Text>
                {budgetAdvice.allocations.map((alloc, i) => (
                  <Card key={i} style={styles.allocCard}>
                    <View style={styles.allocHeader}>
                      <Text style={styles.allocCategory}>{alloc.category}</Text>
                      <Text style={styles.allocPct}>{alloc.percentage}%</Text>
                    </View>
                    <View style={styles.allocAmounts}>
                      <Text style={styles.allocLabel}>Suggested: <Text style={styles.allocValue}>{symbol}{alloc.amount.toLocaleString()}</Text></Text>
                      <Text style={styles.allocLabel}>Current: <Text style={styles.allocValue}>{symbol}{alloc.current.toLocaleString()}</Text></Text>
                    </View>
                  </Card>
                ))}
              </View>
            )}

            {budgetAdvice.actions.length > 0 && (
              <Card style={styles.actionsList}>
                <Text style={styles.sectionHeader}>Action Steps</Text>
                {budgetAdvice.actions.map((action, i) => (
                  <View key={i} style={styles.actionRow}>
                    <Text style={styles.actionNumber}>{i + 1}</Text>
                    <Text style={styles.actionText}>{action}</Text>
                  </View>
                ))}
              </Card>
            )}
          </>
        )}

        {/* Investments */}
        {tab === 'invest' && investData && (
          <>
            {investData.monthlySurplus > 0 && (
              <Card style={styles.surplusCard}>
                <Text style={styles.surplusLabel}>Monthly surplus available to invest</Text>
                <Text style={styles.surplusAmount}>{symbol}{investData.monthlySurplus.toLocaleString()}</Text>
              </Card>
            )}

            {investData.suggestions.map((s, i) => (
              <Card key={i} style={styles.investCard}>
                <View style={styles.investHeader}>
                  <View style={styles.investInfo}>
                    <Text style={styles.investName}>{s.name}</Text>
                    <Text style={styles.investType}>{s.type}</Text>
                  </View>
                  <View style={[styles.riskBadge, { backgroundColor: riskColor(s.riskLevel) + '20', borderColor: riskColor(s.riskLevel) }]}>
                    <Text style={[styles.riskText, { color: riskColor(s.riskLevel) }]}>{s.riskLevel} risk</Text>
                  </View>
                </View>
                <Text style={styles.investDesc}>{s.description}</Text>
                <View style={styles.investMeta}>
                  <Text style={styles.investMetaItem}>Return: <Text style={styles.investMetaValue}>{s.expectedReturn}</Text></Text>
                  <Text style={styles.investMetaItem}>Min: <Text style={styles.investMetaValue}>{symbol}{s.minimumAmount.toLocaleString()}</Text></Text>
                </View>
                {s.platforms && s.platforms.length > 0 && (
                  <View style={styles.platforms}>
                    {s.platforms.map((p) => (
                      <View key={p} style={styles.platformChip}>
                        <Text style={styles.platformText}>{p}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </Card>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:               { flex: 1, backgroundColor: Colors.background },
  scroll:             { flex: 1 },
  content:            { padding: 20, gap: 16, paddingBottom: 40 },
  pageTitle:          { fontSize: 24, fontWeight: '700', color: Colors.textPrimary },
  tabRow:             { flexDirection: 'row', gap: 0, backgroundColor: Colors.surface, borderRadius: 12, padding: 4, borderWidth: 1, borderColor: Colors.border },
  tab:                { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  tabActive:          { backgroundColor: Colors.primary },
  tabText:            { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },
  tabTextActive:      { color: '#fff', fontWeight: '600' },
  promptCard:         { alignItems: 'center', gap: 12, padding: 28 },
  promptIcon:         { fontSize: 48 },
  promptTitle:        { fontSize: 17, fontWeight: '600', color: Colors.textPrimary, textAlign: 'center' },
  promptText:         { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  analyseBtn:         { backgroundColor: Colors.primary, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 10, marginTop: 4 },
  analyseBtnText:     { color: '#fff', fontWeight: '600', fontSize: 15 },
  loader:             { marginTop: 40 },
  errorCard:          { alignItems: 'center', gap: 12, padding: 24 },
  errorText:          { color: Colors.textSecondary, textAlign: 'center', fontSize: 14, lineHeight: 20 },
  retryBtn:           { borderWidth: 1, borderColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8 },
  retryText:          { color: Colors.primary, fontWeight: '600' },
  section:            { gap: 10 },
  sectionTitle:       { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  sectionHeader:      { fontSize: 15, fontWeight: '600', color: Colors.textPrimary, marginBottom: 8 },
  insightsList:       { gap: 0 },
  insightRow:         { flexDirection: 'row', gap: 10, paddingVertical: 6 },
  insightBullet:      { fontSize: 16 },
  insightText:        { flex: 1, fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  allocCard:          { gap: 8 },
  allocHeader:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  allocCategory:      { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  allocPct:           { fontSize: 18, fontWeight: '700', color: Colors.primary },
  allocAmounts:       { flexDirection: 'row', gap: 20 },
  allocLabel:         { fontSize: 13, color: Colors.textSecondary },
  allocValue:         { fontWeight: '600', color: Colors.textPrimary },
  actionsList:        { gap: 0 },
  actionRow:          { flexDirection: 'row', gap: 12, paddingVertical: 8, alignItems: 'flex-start' },
  actionNumber:       { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.primary, color: '#fff', textAlign: 'center', lineHeight: 24, fontSize: 13, fontWeight: '700' },
  actionText:         { flex: 1, fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  surplusCard:        { backgroundColor: Colors.primary, padding: 20, gap: 6 },
  surplusLabel:       { fontSize: 13, color: 'rgba(255,255,255,0.75)' },
  surplusAmount:      { fontSize: 28, fontWeight: '700', color: '#fff' },
  investCard:         { gap: 10 },
  investHeader:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  investInfo:         { flex: 1, gap: 2 },
  investName:         { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  investType:         { fontSize: 12, color: Colors.textSecondary },
  riskBadge:          { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  riskText:           { fontSize: 12, fontWeight: '600' },
  investDesc:         { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  investMeta:         { flexDirection: 'row', gap: 20 },
  investMetaItem:     { fontSize: 13, color: Colors.textSecondary },
  investMetaValue:    { fontWeight: '600', color: Colors.textPrimary },
  platforms:          { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  platformChip:       { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border },
  platformText:       { fontSize: 12, color: Colors.textSecondary },
});
