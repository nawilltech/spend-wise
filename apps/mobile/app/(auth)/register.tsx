import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { Button } from '@components/common/Button';
import { Input } from '@components/common/Input';
import { PasswordStrengthHints } from '@components/common/PasswordStrengthHints';
import { authApi } from '@services/api/auth';
import { useAuthStore } from '@store/auth.store';
import { Colors } from '@constants/colors';

const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+\[\]{};:'",.<>?/\\|`~]).{8,}$/;

function passwordError(pw: string): string | null {
  if (pw.length < 8)           return 'At least 8 characters';
  if (!/[A-Z]/.test(pw))      return 'At least one uppercase letter';
  if (!/[a-z]/.test(pw))      return 'At least one lowercase letter';
  if (!/\d/.test(pw))         return 'At least one number';
  if (!/[!@#$%^&*()\-_=+\[\]{};:'",.<>?/\\|`~]/.test(pw)) return 'At least one special character';
  return null;
}

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuthStore();

  const confirmErr = confirmPassword && password !== confirmPassword ? 'Passwords do not match' : null;

  async function handleRegister() {
    if (!name || !email || !password || !confirmPassword) return;
    if (passwordError(password)) {
      Alert.alert('Weak password', passwordError(password)!);
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Passwords do not match', 'Please make sure both passwords are identical.');
      return;
    }
    setLoading(true);
    try {
      const { user } = await authApi.register({
        name, email, password, confirmPassword,
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
        <View>
          <Input label="Password" value={password} onChangeText={setPassword} secureTextEntry placeholder="Min. 8 characters" />
          <PasswordStrengthHints password={password} />
        </View>
        <View>
          <Input label="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry placeholder="Re-enter your password" />
          {confirmErr && <Text style={styles.hint}>{confirmErr}</Text>}
        </View>
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
