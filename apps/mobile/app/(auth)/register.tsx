import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { Button } from '@components/common/Button';
import { Input } from '@components/common/Input';
import { authApi } from '@services/api/auth';
import { useAuthStore } from '@store/auth.store';
import { Colors } from '@constants/colors';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuthStore();

  async function handleRegister() {
    if (!name || !email || !password) return;
    setLoading(true);
    try {
      const { user } = await authApi.register({
        name, email, password,
        baseCurrency: 'NGN',
        location: '',
      });
      setUser(user);
      router.replace('/(tabs)');
    } catch {
      Alert.alert('Registration failed', 'Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Create account</Text>

      <View style={styles.form}>
        <Input label="Full name" value={name} onChangeText={setName} placeholder="John Doe" />
        <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="you@example.com" />
        <Input label="Password" value={password} onChangeText={setPassword} secureTextEntry placeholder="Min. 8 characters" />
        <Button label="Create account" onPress={handleRegister} loading={loading} />
        <Button label="Already have an account? Log in" onPress={() => router.back()} variant="ghost" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: Colors.background, padding: 24, justifyContent: 'center' },
  title:     { fontSize: 26, fontWeight: '700', color: Colors.textPrimary, marginBottom: 32 },
  form:      { gap: 16 },
});
