import { View, Text, StyleSheet, SafeAreaView, Pressable } from 'react-native';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { Button } from '@components/common/Button';
import { Colors } from '@constants/colors';

const FEATURES = [
  { icon: '📊', title: 'Plan your budget', description: 'Set spending limits by category and stay on track every month.' },
  { icon: '💳', title: 'Track your spending', description: 'Log transactions instantly and see exactly where your money goes.' },
  { icon: '🤖', title: 'Get smart insights', description: 'AI-powered analysis helps you spot patterns and save more.' },
];

export default function LandingScreen() {
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.hero}>
        <Text style={styles.logo}>💰</Text>
        <Text style={styles.appName}>SpendWise</Text>
        <Text style={styles.tagline}>Save more. Stress less.</Text>
        <Text style={styles.pitch}>
          SpendWise helps you take control of your finances — plan your budget,
          document every purchase, and get AI-powered advice tailored to your goals.
        </Text>
      </View>

      <View style={styles.features}>
        {FEATURES.map((f) => (
          <View key={f.title} style={styles.featureRow}>
            <Text style={styles.featureIcon}>{f.icon}</Text>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureDesc}>{f.description}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <Button label="Get started" onPress={() => router.push('/(auth)/register')} size="lg" />
        <Button label="I already have an account" onPress={() => router.push('/(auth)/login')} variant="ghost" size="lg" />
        <View style={styles.poweredBy}>
          <Text style={styles.poweredByText}>Powered by </Text>
          <Pressable onPress={() => Linking.openURL('https://nawill.ng')}>
            <Text style={styles.poweredByLink}>Nawill</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:         { flex: 1, backgroundColor: Colors.background, paddingHorizontal: 28, paddingBottom: 32 },

  hero:         { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10, paddingTop: 48 },
  logo:         { fontSize: 64 },
  appName:      { fontSize: 36, fontWeight: '800', color: Colors.primary, letterSpacing: -0.5 },
  tagline:      { fontSize: 18, fontWeight: '600', color: Colors.textSecondary },
  pitch:        { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginTop: 8, paddingHorizontal: 8 },

  features:     { gap: 20, marginBottom: 36 },
  featureRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  featureIcon:  { fontSize: 28, marginTop: 2 },
  featureText:  { flex: 1 },
  featureTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 2 },
  featureDesc:  { fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },

  actions:      { gap: 12 },
  poweredBy:    { flexDirection: 'row', justifyContent: 'center', marginTop: 4 },
  poweredByText:{ fontSize: 12, color: Colors.textMuted },
  poweredByLink:{ fontSize: 12, color: Colors.primary, fontWeight: '600' },
});
