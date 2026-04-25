import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@constants/colors';
import { Card } from '@components/common/Card';
import { useAuthStore } from '@store/auth.store';
import { authApi } from '@services/api/auth';

interface SettingRowProps { icon: string; label: string; onPress: () => void; danger?: boolean }

function SettingRow({ icon, label, onPress, danger }: SettingRowProps) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.rowIcon}>{icon}</Text>
      <Text style={[styles.rowLabel, danger && { color: Colors.danger }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const { user, clearAuth } = useAuthStore();

  async function handleLogout() {
    Alert.alert('Log out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out', style: 'destructive',
        onPress: async () => {
          await authApi.logout();
          clearAuth();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Card style={styles.profile}>
          <Text style={styles.avatar}>👤</Text>
          <View>
            <Text style={styles.name}>{user?.name}</Text>
            <Text style={styles.email}>{user?.email}</Text>
          </View>
        </Card>

        <Card>
          <SettingRow icon="💰" label="Spending Categories"  onPress={() => {}} />
          <SettingRow icon="🎯" label="Financial Goals"     onPress={() => {}} />
          <SettingRow icon="💱" label="Currency Settings"   onPress={() => {}} />
          <SettingRow icon="🔔" label="Notifications"       onPress={() => {}} />
          <SettingRow icon="📊" label="Risk Tolerance"      onPress={() => {}} />
        </Card>

        <Card>
          <SettingRow icon="📤" label="Export Data"         onPress={() => {}} />
          <SettingRow icon="🔒" label="Security"            onPress={() => {}} />
        </Card>

        <Card>
          <SettingRow icon="🚪" label="Log out" onPress={handleLogout} danger />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.background },
  scroll:  { flex: 1 },
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar:  { fontSize: 40 },
  name:    { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  email:   { fontSize: 13, color: Colors.textSecondary },
  row:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  rowIcon: { fontSize: 20 },
  rowLabel:{ flex: 1, fontSize: 15, color: Colors.textPrimary },
});
