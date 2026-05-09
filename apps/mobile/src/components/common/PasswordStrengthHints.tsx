import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@constants/colors';

const CRITERIA = [
  { label: 'At least 8 characters',     test: (pw: string) => pw.length >= 8 },
  { label: 'One uppercase letter (A–Z)', test: (pw: string) => /[A-Z]/.test(pw) },
  { label: 'One lowercase letter (a–z)', test: (pw: string) => /[a-z]/.test(pw) },
  { label: 'One number (0–9)',           test: (pw: string) => /\d/.test(pw) },
  { label: 'One special character',      test: (pw: string) => /[!@#$%^&*()\-_=+\[\]{};:'",.<>?/\\|`~]/.test(pw) },
];

interface Props { password: string }

export function PasswordStrengthHints({ password }: Props) {
  if (!password) return null;
  return (
    <View style={styles.container}>
      {CRITERIA.map((c) => {
        const met = c.test(password);
        return (
          <View key={c.label} style={styles.row}>
            <Ionicons
              name={met ? 'checkmark-circle' : 'ellipse-outline'}
              size={15}
              color={met ? Colors.income : Colors.textMuted}
            />
            <Text style={[styles.label, met && styles.labelMet]}>{c.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 5, marginTop: 8 },
  row:       { flexDirection: 'row', alignItems: 'center', gap: 7 },
  label:     { fontSize: 12, color: Colors.textMuted },
  labelMet:  { color: Colors.income },
});
