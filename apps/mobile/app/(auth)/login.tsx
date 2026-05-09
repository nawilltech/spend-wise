import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { isAxiosError } from 'axios';
import { router } from 'expo-router';
import { Button } from '@components/common/Button';
import { Input } from '@components/common/Input';
import { authApi } from '@services/api/auth';
import { useAuthStore } from '@store/auth.store';
import { Colors } from '@constants/colors';

interface AttemptInfo { attempts: number; maxAttempts: number }

function getLoginErrorDetail(err: unknown): AttemptInfo | null {
  if (!isAxiosError(err)) return null;
  const detail = err.response?.data?.detail;
  if (detail && typeof detail === 'object' && 'attempts' in detail) {
    return { attempts: detail.attempts, maxAttempts: detail.maxAttempts };
  }
  return null;
}

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [attemptInfo, setAttemptInfo] = useState<AttemptInfo | null>(null);
  const { setUser } = useAuthStore();

  async function handleLogin() {
    if (!email || !password) return;
    setLoading(true);
    try {
      const { user } = await authApi.login({ email, password });
      setAttemptInfo(null);
      setUser(user);
      router.replace('/(tabs)');
    } catch (err) {
      const detail = getLoginErrorDetail(err);
      if (detail) {
        setAttemptInfo(detail);
      } else {
        setAttemptInfo(null);
        const message = isAxiosError(err)
          ? err.response?.data?.detail ?? 'Check your email and password.'
          : 'Check your email and password.';
        Alert.alert('Login failed', typeof message === 'string' ? message : 'Check your email and password.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Log in to your SpendWise account</Text>
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
        <View>
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
          />
          {attemptInfo && (
            <Text style={styles.attemptText}>
              Incorrect password — {attemptInfo.attempts}/{attemptInfo.maxAttempts} attempts used.
              {attemptInfo.attempts >= attemptInfo.maxAttempts - 1 ? ' Account locks on next failure.' : ''}
            </Text>
          )}
        </View>
        <Button label="Log in" onPress={handleLogin} loading={loading} />
        <Button
          label="Create account"
          onPress={() => router.push('/(auth)/register')}
          variant="ghost"
        />
        <Button
          label="Forgot password?"
          onPress={() => router.push('/(auth)/forgot-password')}
          variant="ghost"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:   { flexGrow: 1, backgroundColor: Colors.background, padding: 24, justifyContent: 'center' },
  header:      { alignItems: 'center', marginBottom: 40, gap: 6 },
  title:       { fontSize: 26, fontWeight: '700', color: Colors.textPrimary },
  subtitle:    { fontSize: 15, color: Colors.textSecondary },
  form:        { gap: 16 },
  attemptText: { fontSize: 12, color: Colors.danger, fontWeight: '500', marginTop: 6 },
});
