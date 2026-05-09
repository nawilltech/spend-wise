import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { authApi } from '@services/api/auth';
import { Colors } from '@constants/colors';

export function VerificationBanner() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleResend() {
    setLoading(true);
    try {
      await authApi.resendVerification();
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.banner}>
      <View style={styles.left}>
        <Text style={styles.title}>Verify your email</Text>
        <Text style={styles.sub}>
          {sent ? 'Verification email sent! Check your inbox.' : 'Check your inbox to activate all features.'}
        </Text>
      </View>
      {!sent && (
        <TouchableOpacity onPress={handleResend} disabled={loading} style={styles.btn}>
          {loading
            ? <ActivityIndicator size="small" color={Colors.primary} />
            : <Text style={styles.btnText}>Resend</Text>}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 12,
  },
  left:    { flex: 1 },
  title:   { fontSize: 13, fontWeight: '600', color: '#92400E' },
  sub:     { fontSize: 12, color: '#B45309', marginTop: 2 },
  btn:     { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#FEF3C7', borderRadius: 8, borderWidth: 1, borderColor: '#FCD34D' },
  btnText: { fontSize: 13, fontWeight: '600', color: '#92400E' },
});
