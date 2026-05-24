import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { theme } from '../../constants/theme';
import { useSimpleMode } from '../../contexts/SimpleModeContext';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  /** Optional left icon (emoji string or any React node). */
  icon?: React.ReactNode;
  /** Stretches the button to fill its container's width. */
  fullWidth?: boolean;
  /** Used for accessibility — defaults to `label`. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

const SIZE_PADDING: Record<Size, { v: number; h: number; font: number }> = {
  sm: { v: theme.spacing.sm, h: theme.spacing.md, font: theme.typography.sizes.caption },
  md: { v: theme.spacing.md, h: theme.spacing.lg, font: theme.typography.sizes.body },
  lg: { v: theme.spacing.lg, h: theme.spacing.xl, font: theme.typography.sizes.body },
};

function getVariantStyles(variant: Variant, disabled: boolean): {
  container: ViewStyle;
  text: TextStyle;
  spinnerColor: string;
} {
  if (disabled) {
    return {
      container: { backgroundColor: theme.colors.borderSoft, borderWidth: 0 },
      text:      { color: theme.colors.textMuted },
      spinnerColor: theme.colors.textMuted,
    };
  }
  switch (variant) {
    case 'primary':
      return {
        container: { backgroundColor: theme.colors.accent, borderWidth: 0 },
        text:      { color: theme.colors.inverseText },
        spinnerColor: theme.colors.inverseText,
      };
    case 'secondary':
      return {
        container: { backgroundColor: theme.colors.accentMuted, borderWidth: 0 },
        text:      { color: theme.colors.accent },
        spinnerColor: theme.colors.accent,
      };
    case 'outline':
      return {
        container: {
          backgroundColor: 'transparent',
          borderWidth:     1,
          borderColor:     theme.colors.accent,
        },
        text:      { color: theme.colors.accent },
        spinnerColor: theme.colors.accent,
      };
    case 'ghost':
      return {
        container: { backgroundColor: 'transparent', borderWidth: 0 },
        text:      { color: theme.colors.accent },
        spinnerColor: theme.colors.accent,
      };
  }
}

/**
 * Primary interactive primitive. Built-in activeOpacity, hitSlop, and
 * accessibility. Every CTA, secondary action, and dialog button in the
 * app should use this — no hand-rolled TouchableOpacity-with-bg-color.
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  fullWidth = false,
  accessibilityLabel,
  style,
}: ButtonProps) {
  const { fs } = useSimpleMode();
  const isInactive = disabled || loading;
  const variantStyle = getVariantStyles(variant, disabled);
  const padding = SIZE_PADDING[size];
  const fontSize = fs(padding.font);

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isInactive}
      activeOpacity={theme.opacity.pressed}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isInactive, busy: loading }}
      style={[
        styles.base,
        {
          paddingVertical:   padding.v,
          paddingHorizontal: padding.h,
        },
        fullWidth && styles.fullWidth,
        variantStyle.container,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variantStyle.spinnerColor} />
      ) : (
        <View style={styles.row}>
          {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
          <Text
            numberOfLines={1}
            style={[
              styles.label,
              { fontSize },
              variantStyle.text,
            ]}
          >
            {label}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.borderRadius.md,
    alignItems:   'center',
    justifyContent: 'center',
    alignSelf:    'flex-start',
  },
  fullWidth: { alignSelf: 'stretch' },
  row:       { flexDirection: 'row', alignItems: 'center' },
  iconWrap:  { marginRight: theme.spacing.sm },
  label: {
    fontFamily:    theme.typography.fontBodyBold,
    letterSpacing: theme.typography.letterSpacing.wide,
  },
});
