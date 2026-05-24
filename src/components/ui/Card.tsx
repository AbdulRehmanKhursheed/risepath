import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, Platform } from 'react-native';
import { theme } from '../../constants/theme';

type Variant = 'default' | 'elevated' | 'flat';

type CardProps = {
  children: React.ReactNode;
  /** default = subtle shadow. elevated = heavier shadow (hero cards). flat = no shadow. */
  variant?: Variant;
  /** Override internal padding. Default theme.spacing.xl. */
  padding?: number;
  /** Override surface background. Default theme.colors.surface. */
  background?: string;
  /** Override border radius. Default theme.borderRadius.lg. */
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * White surface with shadow + rounded corners + internal padding. The
 * default visual container for content blocks across the app.
 */
export function Card({
  children,
  variant = 'default',
  padding = theme.spacing.xl,
  background = theme.colors.surface,
  radius = theme.borderRadius.lg,
  style,
}: CardProps) {
  const shadow =
    variant === 'flat' ? undefined
    : variant === 'elevated' ? theme.shadows.lg
    : theme.shadows.md;

  return (
    <View
      style={[
        {
          backgroundColor: background,
          borderRadius:    radius,
          padding,
          ...(variant === 'flat' ? styles.flatBorder : null),
        },
        shadow as ViewStyle,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  flatBorder: {
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
  },
});

// Suppress unused-import lint for Platform in environments without it.
void Platform;
