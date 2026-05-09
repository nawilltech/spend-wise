import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { Button } from '@components/common/Button';
import { Input } from '@components/common/Input';
import { authApi } from '@services/api/auth';
import { Colors } from '@constants/colors';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!email) return;
    setLoading(true);
    try {
      const { session } = await authApi.forgotPassword({ email });
      router.push({ pathname: '/(auth)/reset-password', params: { email, session } });
    } catch {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.title}>Forgot Password</Text>
        <Text style={styles.subtitle}>
          Enter your email and we'll send you a 6-digit reset code.
        </Text>
      </View>

      <View style={styles.form}>
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="you@example.com"
        />
        <Button label="Send Reset Code" onPress={handleSubmit} loading={loading} />
        <Button
          label="Back to Login"
          onPress={() => router.back()}
          variant="ghost"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: Colors.background, padding: 24, justifyContent: 'center' },
  header:    { alignItems: 'center', marginBottom: 40, gap: 12 },
  title:     { fontSize: 26, fontWeight: '700', color: Colors.textPrimary },
  subtitle:  { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  form:      { gap: 16 },
});
