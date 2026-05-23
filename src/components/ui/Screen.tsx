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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
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
  /** Pass-through ScrollView props (refresh control, onScroll, etc.). */
  scrollViewProps?: Omit<ScrollViewProps, 'children' | 'style' | 'contentContainerStyle'>;
  /** If true, wraps in KeyboardAvoidingView. Default false. */
  avoidKeyboard?: boolean;
  /** StatusBar style. Default 'dark-content' (we have light backgrounds). */
  statusBarStyle?: 'light-content' | 'dark-content';
  /** Safe-area edges to apply. Default ['top']. Tabs handle 'bottom' themselves. */
  edges?: ReadonlyArray<'top' | 'right' | 'bottom' | 'left'>;
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
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  void insets; // future: pass into nested components if needed

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
      edges={edges as any}
    >
      <StatusBar barStyle={statusBarStyle} />
      {body}
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
