import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { Button } from '@components/common/Button';
import { Input } from '@components/common/Input';
import { authApi } from '@services/api/auth';
import { useAuthStore } from '@store/auth.store';
import { Colors } from '@constants/colors';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuthStore();

  async function handleLogin() {
    if (!email || !password) return;
    setLoading(true);
    try {
      const { user } = await authApi.login({ email, password });
      setUser(user);
      router.replace('/(tabs)');
    } catch {
      Alert.alert('Login failed', 'Check your email and password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.logo}>💰</Text>
        <Text style={styles.title}>SpendWise</Text>
        <Text style={styles.subtitle}>Your personal finance advisor</Text>
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
        <Input
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
        />
        <Button label="Log in" onPress={handleLogin} loading={loading} />
        <Button
          label="Create account"
          onPress={() => router.push('/(auth)/register')}
          variant="ghost"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: Colors.background, padding: 24, justifyContent: 'center' },
  header:    { alignItems: 'center', marginBottom: 40, gap: 8 },
  logo:      { fontSize: 56 },
  title:     { fontSize: 28, fontWeight: '700', color: Colors.textPrimary },
  subtitle:  { fontSize: 15, color: Colors.textSecondary },
  form:      { gap: 16 },
});
