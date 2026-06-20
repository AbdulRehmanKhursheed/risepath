import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  StyleProp,
  ViewStyle,
  ScrollViewProps,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { theme } from '../../constants/theme';

type ScreenProps = {
  children: React.ReactNode;
  /** If true, content is wrapped in a ScrollView. Default true. */
  scroll?: boolean;
  /** Background override. Default theme.colors.background. */
  background?: string;
  /** Extra style on the outer SafeAreaView. */
  style?: StyleProp<ViewStyle>;
  /** Extra style on the content container (inside the ScrollView). */
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** Pass-through ScrollView props (refresh control, onScroll, etc.). Ignored when `scroll={false}`. */
  scrollViewProps?: Omit<ScrollViewProps, 'children' | 'style' | 'contentContainerStyle'>;
  /** If true, wraps in KeyboardAvoidingView. Default false. */
  avoidKeyboard?: boolean;
  /** StatusBar style. Default 'dark-content' (we have light backgrounds). */
  statusBarStyle?: 'light-content' | 'dark-content';
  /** Safe-area edges to apply. Default ['top']. Tabs handle 'bottom' themselves. */
  edges?: readonly Edge[];
  /**
   * Pinned content rendered OUTSIDE the scroll, at the bottom of the screen
   * (above the tab bar) — i.e. always visible. Used for an anchored ad banner
   * so it isn't buried at the end of scroll content (low ad viewability).
   */
  footer?: React.ReactNode;
};

/**
 * Top-level screen wrapper. Handles safe area, status bar, optional scroll,
 * optional keyboard avoidance. Every screen in the app should wrap in this.
 */
export function Screen({
  children,
  scroll = true,
  background = theme.colors.background,
  style,
  contentContainerStyle,
  scrollViewProps,
  avoidKeyboard = false,
  statusBarStyle = 'dark-content',
  edges = ['top'],
  footer,
}: ScreenProps) {
  const inner = scroll ? (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      {...scrollViewProps}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.staticContent, contentContainerStyle]}>{children}</View>
  );

  const body = avoidKeyboard ? (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.flex}
    >
      {inner}
    </KeyboardAvoidingView>
  ) : (
    inner
  );

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: background }, style]}
      edges={edges as Edge[]}
    >
      <StatusBar barStyle={statusBarStyle} />
      {body}
      {footer}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:          { flex: 1 },
  flex:          { flex: 1 },
  scroll:        { flex: 1 },
  scrollContent: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop:        theme.spacing.xl,
    paddingBottom:     theme.spacing.xxxl,
  },
  staticContent: {
    flex:              1,
    paddingHorizontal: theme.spacing.xl,
    paddingTop:        theme.spacing.xl,
  },
});
