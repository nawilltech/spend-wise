import { StyleSheet, Text, TouchableOpacity, ActivityIndicator, ViewStyle } from 'react-native';
import { Colors } from '@constants/colors';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
}: ButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.base, styles[variant], styles[size], (disabled || loading) && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'ghost' ? Colors.primary : Colors.textInverse} size="small" />
      ) : (
        <Text style={[styles.label, styles[`${variant}Label`]]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base:          { borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  primary:       { backgroundColor: Colors.primary },
  secondary:     { backgroundColor: Colors.secondary },
  danger:        { backgroundColor: Colors.danger },
  ghost:         { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Colors.primary },
  sm:            { paddingVertical: 8,  paddingHorizontal: 16 },
  md:            { paddingVertical: 14, paddingHorizontal: 24 },
  lg:            { paddingVertical: 18, paddingHorizontal: 32 },
  disabled:      { opacity: 0.5 },
  label:         { fontWeight: '600', fontSize: 15 },
  primaryLabel:  { color: Colors.textInverse },
  secondaryLabel:{ color: Colors.textInverse },
  dangerLabel:   { color: Colors.textInverse },
  ghostLabel:    { color: Colors.primary },
});
