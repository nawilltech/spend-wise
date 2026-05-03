import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { isAxiosError } from 'axios';
import { router, useLocalSearchParams } from 'expo-router';
import { Button } from '@components/common/Button';
import { Input } from '@components/common/Input';
import { authApi } from '@services/api/auth';
import { Colors } from '@constants/colors';

export default function ResetPasswordScreen() {
  const { email, session } = useLocalSearchParams<{ email: string; session: string }>();
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleReset() {
    if (!otp || !newPassword || !confirmNewPassword) return;
    setLoading(true);
    try {
      await authApi.resetPassword({
        session: session ?? '',
        otp,
        newPassword,
        confirmNewPassword,
      });
      Alert.alert('Success', 'Password updated. Please log in.', [
        { text: 'OK', onPress: () => router.replace('/(auth)/login') },
      ]);
    } catch (err) {
      const detail = isAxiosError(err) ? err.response?.data?.detail : null;
      const message =
        typeof detail === 'string'
          ? detail
          : Array.isArray(detail)
          ? detail.map((d: { msg?: string }) => d.msg ?? String(d)).join('\n')
          : 'Invalid or expired code. Please try again.';
      Alert.alert('Failed', message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit code sent to{'\n'}{email}
        </Text>
      </View>

      <View style={styles.form}>
        <Input
          label="6-digit Code"
          value={otp}
          onChangeText={setOtp}
          keyboardType="number-pad"
          maxLength={6}
          placeholder="123456"
        />
        <Input
          label="New Password"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          placeholder="••••••••"
        />
        <Input
          label="Confirm New Password"
          value={confirmNewPassword}
          onChangeText={setConfirmNewPassword}
          secureTextEntry
          placeholder="••••••••"
        />
        <Button label="Reset Password" onPress={handleReset} loading={loading} />
        <Button
          label="Resend Code"
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
  subtitle:  { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  form:      { gap: 16 },
});
