import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@constants/colors';
import { Card } from '@components/common/Card';
import { Button } from '@components/common/Button';

export default function BudgetScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Card style={styles.emptyCard}>
          <Text style={styles.icon}>🎯</Text>
          <Text style={styles.title}>Set up your budget</Text>
          <Text style={styles.text}>Define spending limits per category and track how you're doing throughout the month.</Text>
          <Button label="Create budget" onPress={() => {}} />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: Colors.background },
  scroll:    { flex: 1 },
  content:   { padding: 20, paddingBottom: 40 },
  emptyCard: { alignItems: 'center', gap: 12, padding: 32 },
  icon:      { fontSize: 48 },
  title:     { fontSize: 18, fontWeight: '600', color: Colors.textPrimary },
  text:      { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
});
