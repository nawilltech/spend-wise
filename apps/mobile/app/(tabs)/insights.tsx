import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@constants/colors';
import { Card } from '@components/common/Card';

export default function InsightsScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <Text style={styles.icon}>🤖</Text>
          <Text style={styles.title}>AI Insights</Text>
          <Text style={styles.text}>Once you have 7+ days of transactions, your AI advisor will analyse your spending patterns and give you personalised recommendations.</Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.background },
  scroll:  { flex: 1 },
  content: { padding: 20 },
  card:    { alignItems: 'center', gap: 12, padding: 32 },
  icon:    { fontSize: 48 },
  title:   { fontSize: 18, fontWeight: '600', color: Colors.textPrimary },
  text:    { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
});
