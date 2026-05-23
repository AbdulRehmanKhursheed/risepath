# Noor — Day 1: HomeScreen + Foundation Primitives

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a redesigned HomeScreen at "Premium Spiritual" quality, extracting reusable primitives (`<Screen>`, `<Heading>/<Body>/<Caption>`, `<Card>`, `<Button>`) as a byproduct, and add the design tokens those primitives need to `theme.ts`. End of day = a visibly upgraded app on every push.

**Architecture:** Token-first additions to `src/constants/theme.ts` come in Task 1 so every subsequent primitive can reference them. Primitives go under `src/components/ui/` (new folder) so they're discoverable and separated from feature components. HomeScreen is migrated incrementally — each visual section (greeting / streak / today / quote / goals) is a separate commit so any regression is bisectable.

**Tech Stack:** React Native 0.74 / Expo SDK 51, TypeScript, `expo-linear-gradient`, `@react-navigation/native`. No new dependencies. No new test infrastructure (per spec — visual verification only).

**Verification model:** Per the [parent spec](../specs/2026-05-24-noor-architectural-overhaul-design.md), tests are out of scope. Each task's verification step is **(a) TypeScript compiles** (`npx tsc --noEmit`) and **(b) Open the app on iOS Simulator + Android emulator and visually confirm** the described outcome. The "Definition of Done" checklist at the end of the plan codifies this.

**Reference reading:** Spec is at `docs/superpowers/specs/2026-05-24-noor-architectural-overhaul-design.md`. Audit findings are summarized in the conversation that produced this plan.

---

## File Structure

**Create:**
- `src/components/ui/Screen.tsx` — top-level screen wrapper (safe area + scroll + status bar)
- `src/components/ui/Heading.tsx` — semantic heading component (h1/h2/h3 levels)
- `src/components/ui/Text.tsx` — exports `Body`, `Caption`, `Label` typography components
- `src/components/ui/Card.tsx` — white surface with shadow, padding
- `src/components/ui/Button.tsx` — primary/secondary/outline/ghost variants
- `src/components/ui/index.ts` — barrel export for the ui/ primitives
- `src/contexts/I18nProvider.tsx` — RTL scaffold (no-op behavior change yet, structural)

**Modify:**
- `src/constants/theme.ts` — add `typography.sizes`, `typography.weights`, `typography.lineHeights`, `typography.letterSpacing`, `colors.inverseText`, `colors.inverseMuted`, `colors.scrim`, `colors.divider`, `colors.disabled`, `opacity` block, `motion` block.
- `src/screens/HomeScreen.tsx` — refactor to use new primitives, drop inline hex colors, drop inline `fontSize`, drop inline shadows.
- `App.tsx` — wrap root in `<I18nProvider>`.

**Do not modify in this plan:** `TodayCard.tsx`, `QuickActions.tsx`, `StreakRing.tsx`, `StreakCelebrationModal.tsx`, `HadithOfDay.tsx`, `NextEventCard.tsx`, `EidHubCard.tsx`, `MenuButton.tsx`, `GoalItem.tsx`, `AdBanner.tsx`. These will be touched in later plans as their parent screens get rebuilt. HomeScreen still consumes them as-is — the visual upgrade comes from the screen-level container and the primitives that wrap *around* them.

---

## Task 1: Add Design Tokens to theme.ts

**Files:**
- Modify: `src/constants/theme.ts`

The entire primitive library reads from these tokens. Without this task, nothing else compiles cleanly.

- [ ] **Step 1: Replace `src/constants/theme.ts` with the expanded token set**

Open the file. Replace its full content with:

```ts
import { Platform, Easing } from 'react-native';

// Standard motion curve used across the app. Lives at module scope (not
// inside the `theme` literal) because Easing factories must be invoked.
const standardEasing = Easing.bezier(0.4, 0, 0.2, 1);

export const theme = {
  colors: {
    // Surface family
    background:       '#FAF4E8',
    backgroundSoft:   '#F2EAD6',
    surface:          '#FFFFFF',
    surfaceElevated:  '#FFF9F0',

    // Accent (warm amber — primary brand)
    accent:           '#C8780A',
    accentLight:      '#E08A1A',
    accentGlow:       'rgba(200, 120, 10, 0.30)',
    accentMuted:      'rgba(200, 120, 10, 0.12)',

    // Text
    text:             '#1C0F06',
    textSecondary:    '#3C2510',
    textMuted:        '#7A5A40',

    // Inverse (text/icons placed on dark/accent backgrounds)
    inverseText:      '#FFFFFF',
    inverseMuted:     'rgba(255, 255, 255, 0.78)',
    inverseSecondary: 'rgba(255, 255, 255, 0.55)',

    // Semantic
    success:          '#1A7A3C',
    successMuted:     'rgba(26, 122, 60, 0.14)',
    error:            '#B83025',
    errorMuted:       'rgba(184, 48, 37, 0.13)',

    // Structural
    border:           '#DCCAAA',
    borderSoft:       '#EAD9BF',
    divider:          'rgba(124, 90, 64, 0.12)',
    scrim:            'rgba(28, 15, 6, 0.55)',
    disabled:         'rgba(28, 15, 6, 0.35)',

    // Shadow base — referenced from `shadows.*` below
    shadowBase:       '#7A5A40',
  },

  spacing: {
    xs:   4,
    sm:   8,
    md:   12,
    lg:   16,
    xl:   24,
    xxl:  32,
    xxxl: 48,
  },

  borderRadius: {
    sm:   10,
    md:   14,
    lg:   18,
    xl:   24,
    full: 9999,
  },

  typography: {
    // Font family names (already bundled via expo-google-fonts + /assets)
    fontHeading:        'Syne_600SemiBold',
    fontHeadingBold:    'Syne_700Bold',
    fontBody:           'PlusJakartaSans_400Regular',
    fontBodyMedium:     'PlusJakartaSans_500Medium',
    fontBodyBold:       'PlusJakartaSans_600SemiBold',
    // Quran-specific Arabic fonts — bundled in /assets/fonts.
    // Uthmani = Madinah Mushaf (KFGQPC-style, used in Saudi-printed Qurans).
    // IndoPak = Pakistani/Indian Mushaf script — what most South-Asian
    // Muslims grew up reading from a physical Quran.
    fontQuranUthmani:   'AmiriQuran',
    fontQuranIndopak:   'NoorehudaQuran',

    // Semantic size scale — every screen reads from here, never inlines fontSize
    sizes: {
      h1:      28,
      h2:      22,
      h3:      18,
      body:    15,
      caption: 12,
      micro:   10,
    },

    weights: {
      regular:  '400' as const,
      medium:   '500' as const,
      semibold: '600' as const,
      bold:     '700' as const,
    },

    lineHeights: {
      tight:   1.20,
      normal:  1.45,
      relaxed: 1.70,
      arabic:  2.00,
    },

    letterSpacing: {
      tight:     -0.4,
      normal:     0,
      wide:       0.5,
      ultraWide:  1.5,
    },
  },

  shadows: {
    sm: Platform.select({
      ios: { shadowColor: '#7A5A40', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
    md: Platform.select({
      ios: { shadowColor: '#7A5A40', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 10 },
      android: { elevation: 4 },
    }),
    lg: Platform.select({
      ios: { shadowColor: '#7A5A40', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.22, shadowRadius: 18 },
      android: { elevation: 8 },
    }),
    glow: Platform.select({
      ios: { shadowColor: '#C8780A', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.40, shadowRadius: 18 },
      android: { elevation: 6 },
    }),
  },

  opacity: {
    border:   0.25,
    muted:    0.12,
    disabled: 0.50,
    pressed:  0.80,
  },

  motion: {
    durations: { fast: 150, normal: 220, slow: 320 },
    easing: { standard: standardEasing },
  },
} as const;

export type Theme = typeof theme;
```

- [ ] **Step 2: Type-check**

Run from project root:

```bash
npx tsc --noEmit
```

Expected: no errors. The existing app already references `theme.colors.*`, `theme.spacing.*`, `theme.typography.font*`, `theme.shadows.*` — none of those keys were removed, only added to.

- [ ] **Step 3: Commit**

```bash
git add src/constants/theme.ts
git commit -m "theme: add typography scale, inverse colors, motion, opacity tokens

Foundation for Day-1 primitives. Adds:
- typography.sizes (h1/h2/h3/body/caption/micro)
- typography.weights / lineHeights / letterSpacing
- colors.inverseText / inverseMuted / scrim / divider / disabled
- opacity scale, motion durations + standard easing

All existing token keys preserved — pure addition."
```

---

## Task 2: Create `<Screen>` Wrapper

**Files:**
- Create: `src/components/ui/Screen.tsx`

Every screen will wrap in this. Replaces the ad-hoc `<View style={{flex:1, backgroundColor: theme.colors.background}}>` + `<ScrollView>` boilerplate scattered across the app.

- [ ] **Step 1: Create `src/components/ui/Screen.tsx` with the following content**

```tsx
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
```

- [ ] **Step 2: Verify `react-native-safe-area-context` is already a dependency**

```bash
grep -q '"react-native-safe-area-context"' package.json && echo OK || echo MISSING
```

Expected: `OK`. (It is — confirmed in the audit; SafeAreaProvider is wired in `App.tsx`.)

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/Screen.tsx
git commit -m "ui: add <Screen> wrapper (safe-area + scroll + status bar)

First of the Day-1 primitives. Centralizes the per-screen
boilerplate that's currently inlined in every screen file:
SafeAreaView edges, StatusBar style, optional ScrollView,
optional KeyboardAvoidingView. Default padding from theme."
```

---

## Task 3: Create Typography Primitives (`<Heading>`, `<Body>`, `<Caption>`, `<Label>`)

**Files:**
- Create: `src/components/ui/Heading.tsx`
- Create: `src/components/ui/Text.tsx`

Replaces ~50 inline `<Text style={{ fontSize: 22, fontFamily: theme.typography.fontHeadingBold, ... }}>` repetitions.

- [ ] **Step 1: Create `src/components/ui/Heading.tsx`**

```tsx
import React from 'react';
import { Text, StyleProp, TextStyle, TextProps } from 'react-native';
import { theme } from '../../constants/theme';
import { useSimpleMode } from '../../contexts/SimpleModeContext';

type Level = 1 | 2 | 3;

type HeadingProps = Omit<TextProps, 'style'> & {
  level?: Level;
  /** Use Syne (display) instead of body bold. Default true for level 1, false otherwise. */
  display?: boolean;
  style?: StyleProp<TextStyle>;
  children: React.ReactNode;
};

const SIZE_BY_LEVEL = {
  1: theme.typography.sizes.h1,
  2: theme.typography.sizes.h2,
  3: theme.typography.sizes.h3,
} as const;

const LETTER_SPACING_BY_LEVEL = {
  1: theme.typography.letterSpacing.tight,
  2: theme.typography.letterSpacing.tight,
  3: theme.typography.letterSpacing.normal,
} as const;

/**
 * Semantic heading. Level 1 is the screen title; 2 is a section title;
 * 3 is a sub-section. By default level 1 uses Syne display font, levels
 * 2 and 3 use Plus Jakarta bold. Respects useSimpleMode().fs for global
 * accessibility font-scaling — consumers never need to call fs themselves.
 */
export function Heading({
  level = 2,
  display,
  style,
  children,
  ...rest
}: HeadingProps) {
  const { fs } = useSimpleMode();
  const useDisplay = display ?? level === 1;
  const fontFamily = useDisplay
    ? theme.typography.fontHeadingBold
    : theme.typography.fontBodyBold;
  const size = fs(SIZE_BY_LEVEL[level]);

  return (
    <Text
      accessibilityRole="header"
      {...rest}
      style={[
        {
          fontSize:       size,
          color:          theme.colors.text,
          fontFamily,
          letterSpacing:  LETTER_SPACING_BY_LEVEL[level],
          // React Native expects an absolute lineHeight in dp, not a multiplier.
          lineHeight:     size * theme.typography.lineHeights.tight,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
```

- [ ] **Step 2: Create `src/components/ui/Text.tsx`**

```tsx
import React from 'react';
import { Text as RNText, StyleProp, TextStyle, TextProps } from 'react-native';
import { theme } from '../../constants/theme';
import { useSimpleMode } from '../../contexts/SimpleModeContext';

type Tone = 'default' | 'secondary' | 'muted' | 'accent' | 'success' | 'error' | 'inverse' | 'inverseMuted';
type Weight = 'regular' | 'medium' | 'semibold' | 'bold';

type BaseProps = Omit<TextProps, 'style'> & {
  tone?: Tone;
  weight?: Weight;
  italic?: boolean;
  style?: StyleProp<TextStyle>;
  children: React.ReactNode;
};

const COLOR_BY_TONE: Record<Tone, string> = {
  default:      theme.colors.text,
  secondary:    theme.colors.textSecondary,
  muted:        theme.colors.textMuted,
  accent:       theme.colors.accent,
  success:      theme.colors.success,
  error:        theme.colors.error,
  inverse:      theme.colors.inverseText,
  inverseMuted: theme.colors.inverseMuted,
};

const FONT_BY_WEIGHT: Record<Weight, string> = {
  regular:  theme.typography.fontBody,
  medium:   theme.typography.fontBodyMedium,
  semibold: theme.typography.fontBodyBold,
  bold:     theme.typography.fontBodyBold,
};

/**
 * Internal factory that builds a typography variant locked to a base size.
 * Reads useSimpleMode().fs so global font-scaling Just Works without each
 * consumer having to call fs(...) on their own.
 */
function makeText(baseSize: number, defaultWeight: Weight) {
  return function TextVariant({
    tone = 'default',
    weight = defaultWeight,
    italic = false,
    style,
    children,
    ...rest
  }: BaseProps) {
    const { fs } = useSimpleMode();
    const size = fs(baseSize);
    return (
      <RNText
        {...rest}
        style={[
          {
            fontSize:    size,
            color:       COLOR_BY_TONE[tone],
            fontFamily:  FONT_BY_WEIGHT[weight],
            lineHeight:  size * theme.typography.lineHeights.normal,
            fontStyle:   italic ? 'italic' : 'normal',
          },
          style,
        ]}
      >
        {children}
      </RNText>
    );
  };
}

/** 15pt body text. Default tone: default. */
export const Body    = makeText(theme.typography.sizes.body,    'regular');
/** 12pt caption. Use for secondary metadata, source attributions. */
export const Caption = makeText(theme.typography.sizes.caption, 'regular');
/** 10pt micro-label. Use for uppercase eyebrows above headings. */
export const Label   = makeText(theme.typography.sizes.micro,   'semibold');
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/Heading.tsx src/components/ui/Text.tsx
git commit -m "ui: add <Heading>, <Body>, <Caption>, <Label> primitives

Read from theme.typography.sizes/weights/lineHeights. Replaces
the ad-hoc inline fontSize/fontFamily pattern across screens.
Heading auto-applies accessibilityRole='header'."
```

---

## Task 4: Create `<Card>` Primitive

**Files:**
- Create: `src/components/ui/Card.tsx`

- [ ] **Step 1: Create `src/components/ui/Card.tsx`**

```tsx
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
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/Card.tsx
git commit -m "ui: add <Card> primitive (default / elevated / flat variants)

Centralizes the white-surface + shadow + radius + padding
combo that's repeated 15+ times across screens with slight
variations. Default uses theme.shadows.md."
```

---

## Task 5: Create `<Button>` Primitive

**Files:**
- Create: `src/components/ui/Button.tsx`

- [ ] **Step 1: Create `src/components/ui/Button.tsx`**

```tsx
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
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/Button.tsx
git commit -m "ui: add <Button> primitive (primary/secondary/outline/ghost)

Built-in activeOpacity (theme.opacity.pressed), hitSlop:10,
accessibilityRole='button', accessibilityState for loading
and disabled. Replaces 70+ hand-rolled TouchableOpacity-with-
bg-color patterns across the app."
```

---

## Task 6: Add `ui/index.ts` Barrel Export

**Files:**
- Create: `src/components/ui/index.ts`

- [ ] **Step 1: Create the barrel**

```ts
export { Screen }              from './Screen';
export { Heading }             from './Heading';
export { Body, Caption, Label } from './Text';
export { Card }                from './Card';
export { Button }              from './Button';
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/index.ts
git commit -m "ui: add barrel export for the primitive library"
```

---

## Task 7: Create `<I18nProvider>` Scaffold

**Files:**
- Create: `src/contexts/I18nProvider.tsx`
- Modify: `App.tsx`

This is a scaffold — it does NOT change behavior today. It centralizes the RTL detection so future per-screen RTL fixes have one source of truth. Future plans (e.g., the Quran reader RTL work) can hang behavior off this provider without re-discovering language state.

- [ ] **Step 1: Create `src/contexts/I18nProvider.tsx`**

```tsx
import React, { createContext, useContext, useMemo } from 'react';
import { I18nManager } from 'react-native';
import { useLanguage } from './LanguageContext';

type I18nValue = {
  /** Current language code: 'en' | 'ur' | 'ar'. */
  language: 'en' | 'ur' | 'ar';
  /** True if the current language is right-to-left. */
  isRTL: boolean;
  /** 'rtl' or 'ltr' — pass to Text style.writingDirection where needed. */
  writingDirection: 'rtl' | 'ltr';
  /** 'row-reverse' or 'row' — for flex containers that should flip in RTL. */
  flexDirection: 'row' | 'row-reverse';
  /** 'right' or 'left' — for text alignment in RTL. */
  textAlign: 'left' | 'right';
};

const I18nContext = createContext<I18nValue | null>(null);

const RTL_LANGUAGES: ReadonlyArray<'ur' | 'ar'> = ['ur', 'ar'];

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const { language } = useLanguage();

  const value = useMemo<I18nValue>(() => {
    const isRTL = (RTL_LANGUAGES as ReadonlyArray<string>).includes(language);
    return {
      language: language as I18nValue['language'],
      isRTL,
      writingDirection: isRTL ? 'rtl' : 'ltr',
      flexDirection:    isRTL ? 'row-reverse' : 'row',
      textAlign:        isRTL ? 'right' : 'left',
    };
  }, [language]);

  // Keep I18nManager in sync (no-op forceRTL — we render bidirectionally
  // instead of restarting the bundle, which is what I18nManager.forceRTL
  // would require). This is intentional: we don't want a relaunch loop.
  void I18nManager;

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/** Read RTL/language info. Throws if used outside <I18nProvider>. */
export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>');
  return ctx;
}
```

- [ ] **Step 2: Wire `<I18nProvider>` into `App.tsx`**

`App.tsx`'s provider tree currently nests like this (verified against the current file):

```tsx
<LanguageProvider>
  <SimpleModeProvider>
    <SidebarProvider>
      <QuranNavProvider>
        {/* NavigationContainer + children */}
      </QuranNavProvider>
    </SidebarProvider>
  </SimpleModeProvider>
</LanguageProvider>
```

Make two edits to `App.tsx`:

**Edit 1** — add this import alongside the existing context-provider imports near the top of the file (after `import { LanguageProvider, useLanguage } from './src/contexts/LanguageContext';` is a natural place):

```tsx
import { I18nProvider } from './src/contexts/I18nProvider';
```

**Edit 2** — wrap `SimpleModeProvider` with `I18nProvider` so it sits between `LanguageProvider` and `SimpleModeProvider`. Change:

```tsx
<LanguageProvider>
  <SimpleModeProvider>
    <SidebarProvider>
      <QuranNavProvider>
```

To:

```tsx
<LanguageProvider>
  <I18nProvider>
    <SimpleModeProvider>
      <SidebarProvider>
        <QuranNavProvider>
```

And add the matching closing tag (so the existing `</LanguageProvider>` line becomes `</I18nProvider>` immediately above a new `</LanguageProvider>`). The closing block changes from:

```tsx
          </QuranNavProvider>
        </SidebarProvider>
      </SimpleModeProvider>
    </LanguageProvider>
```

To:

```tsx
          </QuranNavProvider>
        </SidebarProvider>
      </SimpleModeProvider>
    </I18nProvider>
  </LanguageProvider>
```

Why this nesting: `I18nProvider` calls `useLanguage()`, so it must be inside `LanguageProvider`. Everything else can read `useI18n()`, so `I18nProvider` goes outside them.

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Run the app on iOS Simulator and verify no regression**

```bash
npx expo start --ios
```

Confirm: the app launches, you can switch language (Settings → Language), and HomeScreen looks identical to before. No visible change is expected — the provider is a scaffold.

- [ ] **Step 5: Commit**

```bash
git add src/contexts/I18nProvider.tsx App.tsx
git commit -m "i18n: add I18nProvider scaffold for RTL infrastructure

No behavior change today — provider exposes language, isRTL,
writingDirection, flexDirection, textAlign. Future RTL work
(Quran reader, dua screen) reads from one source instead of
re-deriving from language strings."
```

---

## Task 8: Refactor HomeScreen — Container & Layout

**Files:**
- Modify: `src/screens/HomeScreen.tsx`

This task replaces only the screen-level container chrome (root View / ScrollView / styles) with `<Screen>`. Child components (TodayCard, QuickActions, GoalItem, etc.) stay as-is for this plan. The visible diff: same content, cleaner container; the `styles.root`, `styles.container`, `styles.content`, and `styles.heroGradient` chunks are absorbed.

- [ ] **Step 1: Update the `react-native` import on line 2**

Open `src/screens/HomeScreen.tsx`. The current import on line 2 reads:

```tsx
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, Alert } from 'react-native';
```

Replace it with:

```tsx
import { View, Text, StyleSheet, Alert } from 'react-native';
```

Reasoning: `ScrollView` is now provided by `<Screen>`, `TouchableOpacity` has no direct uses left in HomeScreen, and `Platform` was only used by the about-to-be-deleted root/container/content style entries. `View`, `Text`, `StyleSheet`, and `Alert` are still referenced.

- [ ] **Step 2: Add the primitive imports**

Immediately below the `LinearGradient` import line (currently line 3), add:

```tsx
import { Screen, Heading, Body, Caption, Card, Label } from '../components/ui';
```

Leave every other import in the file untouched.

- [ ] **Step 3: Replace the JSX return block — wrap the existing content in `<Screen>`**

Locate the `return (...)` block at the bottom of the `HomeScreen()` component (it currently starts with `return (<View style={styles.root}>` around line 212). The existing JSX has this overall shape:

```tsx
return (
  <View style={styles.root}>
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient ... />
      <View style={styles.topRow}>...</View>
      <View style={styles.streakSection}>...</View>
      <TodayCard ... />
      <EidHubCard />
      <NextEventCard />
      <QuickActions />
      <HadithOfDay />
      <View style={styles.quoteCard}>...</View>
      <View style={styles.goalsSection}>...</View>
    </ScrollView>
    <AdBanner unitId={AD_UNITS.bannerHome} />
    <StreakCelebrationModal ... />
  </View>
);
```

Rewrite it to:

```tsx
return (
  <Screen background={theme.colors.background}>
    <LinearGradient
      colors={['rgba(200, 120, 10, 0.09)', 'transparent']}
      style={styles.heroGradient}
      pointerEvents="none"
    />
    <View style={styles.topRow}>
      <View style={styles.greetingBlock}>
        <Text style={[styles.greeting, { fontSize: fs(26) }]} numberOfLines={1} adjustsFontSizeToFit>{t.greeting}</Text>
        <Text style={[styles.hijriBadge, { fontSize: fs(12) }]}>{hijri}</Text>
        <Text style={[styles.subGreeting, { fontSize: fs(15) }]}>{getSubGreeting(t)}</Text>
      </View>
      <MenuButton />
    </View>

    <View style={styles.streakSection}>
      <StreakRing current={streak} target={7} size={140} label={t.dayStreak} />
      <View style={styles.longestBadge}>
        <Text style={styles.longestText}>
          {t.bestStreak}: {longest} {t.days}
        </Text>
      </View>
    </View>

    <TodayCard hijriOffset={hijriOffset} />
    <EidHubCard />
    <NextEventCard />
    <QuickActions />

    <HadithOfDay />

    <View style={styles.quoteCard}>
      <Text style={styles.quoteMark}>"</Text>
      <Text style={[styles.quote, { fontSize: fs(16) }]}>{quote.text}</Text>
      <Text style={[styles.quoteSource, { fontSize: fs(13) }]}>— {quote.source}</Text>
    </View>

    <View style={styles.goalsSection}>
      <Text style={[styles.sectionTitle, { fontSize: fs(20) }]}>{t.todaysGoals}</Text>
      <Text style={[styles.sectionSubtitle, { fontSize: fs(14) }]}>{t.tapToComplete}</Text>
      {goals.map((g) => (
        <GoalItem
          key={g.id}
          text={g.text}
          completed={g.completed && g.date === today}
          onToggle={() => toggleGoal(g.id)}
        />
      ))}
    </View>

    <AdBanner unitId={AD_UNITS.bannerHome} />
    <StreakCelebrationModal
      visible={day1CelebrationVisible}
      title={t.day1CelebrationTitle}
      body={t.day1CelebrationBody}
      cta={t.day1CelebrationCta}
      onClose={() => setDay1CelebrationVisible(false)}
    />
  </Screen>
);
```

This step **preserves all inline `<Text>` styling** — tasks 9–11 below replace those `<Text>` blocks with primitives one section at a time so each commit is a small, bisectable change.

- [ ] **Step 4: Delete the now-redundant style entries**

In the `styles = StyleSheet.create({...})` block at the bottom of `HomeScreen.tsx`, **delete** these three entries entirely (they are replaced by `<Screen>`'s behavior):

```ts
root: { ... },
container: { ... },
content: { ... },
```

**Keep every other style entry** (`heroGradient`, `topRow`, `greetingBlock`, `greeting`, `subGreeting`, `hijriBadge`, `tasbihShortcut`*, `streakSection`, `longestBadge`, `longestText`, `quoteCard`, `quoteMark`, `quote`, `quoteSource`, `goalsSection`, `sectionTitle`, `sectionSubtitle`). Tasks 9–11 will delete the typography-related ones as they get migrated to primitives.

*If `tasbihShortcut` and its sub-styles (`tasbihIconCircle`, `tasbihIcon`, `tasbihTitle`, `tasbihSub`, `tasbihArrow`) are present but unused in JSX (they appear orphaned in the file inspection), leave them — a sweep to remove dead styles is a separate plan, not Day 1's responsibility.

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Visual smoke-check on iOS Simulator**

```bash
npx expo start --ios
```

Confirm: HomeScreen renders. Greeting visible at top. Streak ring visible. TodayCard, EidHubCard, NextEventCard, QuickActions, HadithOfDay, quote card, goals all render in the same order. Scroll works. No clipped content at top. No clipped content at bottom (AdBanner visible).

- [ ] **Step 4: Commit**

```bash
git add src/screens/HomeScreen.tsx
git commit -m "home: wrap HomeScreen in <Screen> primitive

Drops the bespoke <View><ScrollView> container in favor of
the shared <Screen> wrapper. AdBanner moves inside Screen so
the safe-area/scroll boundary stays correct. Visual output
unchanged — pure container refactor."
```

---

## Task 9: HomeScreen — Greeting Block + Streak Section (use primitives)

**Files:**
- Modify: `src/screens/HomeScreen.tsx`

Convert the top of HomeScreen (greeting + Hijri badge + sub-greeting + streak section) to use `<Heading>`, `<Body>`, `<Caption>`, `<Label>`. Drop inline `fontSize`. Drop inline hex colors.

- [ ] **Step 1: Replace the `topRow` and `streakSection` JSX**

In `HomeScreen.tsx`, locate the JSX block starting `<View style={styles.topRow}>` (around line 225 in the original). Replace it with:

```tsx
<View style={styles.topRow}>
  <View style={styles.greetingBlock}>
    <Heading level={1} numberOfLines={1} adjustsFontSizeToFit>{t.greeting}</Heading>
    <Caption
      tone="accent"
      weight="semibold"
      style={{ marginTop: theme.spacing.xs, letterSpacing: theme.typography.letterSpacing.wide }}
    >
      {hijri}
    </Caption>
    <Body tone="muted" style={{ marginTop: theme.spacing.xs }}>
      {getSubGreeting(t)}
    </Body>
  </View>
  <MenuButton />
</View>

<View style={styles.streakSection}>
  <StreakRing current={streak} target={7} size={140} label={t.dayStreak} />
  <View style={styles.longestBadge}>
    <Caption tone="muted" weight="medium">
      {t.bestStreak}: {longest} {t.days}
    </Caption>
  </View>
</View>
```

- [ ] **Step 2: Delete now-unused style entries**

In the `styles = StyleSheet.create({...})` block at the bottom of `HomeScreen.tsx`, **delete** these entries: `greeting`, `subGreeting`, `hijriBadge`, `longestText`. They are now replaced by the primitive components above.

**Keep** these entries (they style layout, not text): `topRow`, `greetingBlock`, `streakSection`, `longestBadge`.

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Visual check**

Reload the simulator (press `r` in the Metro terminal). Confirm: greeting still renders large at top, Hijri date still shows in accent color underneath, sub-greeting (morning/afternoon/evening) still shows muted under that. Streak ring + "Best streak: N days" badge still visible. Font weights look right.

- [ ] **Step 5: Commit**

```bash
git add src/screens/HomeScreen.tsx
git commit -m "home: greeting + streak use <Heading>/<Body>/<Caption> primitives

Drops inline fontSize (26/12/15/14) and inline fontFamily
references in favor of semantic typography primitives.
Hijri date uses Caption tone='accent'."
```

---

## Task 10: HomeScreen — Quote Card uses `<Card>` Primitive

**Files:**
- Modify: `src/screens/HomeScreen.tsx`

- [ ] **Step 1: Replace the quote card JSX**

Locate the `<View style={styles.quoteCard}>` block (around line 250 in the original). Replace with:

```tsx
<Card
  style={{
    marginBottom: theme.spacing.xxl,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.accent,
    paddingLeft: theme.spacing.xxl,
  }}
>
  <Text style={styles.quoteMark}>"</Text>
  <Body italic tone="secondary" style={{ fontSize: 16, lineHeight: 26 }}>
    {quote.text}
  </Body>
  <Caption
    tone="accent"
    weight="medium"
    style={{ marginTop: theme.spacing.md, textAlign: 'right' }}
  >
    — {quote.source}
  </Caption>
</Card>
```

- [ ] **Step 2: Delete now-unused style entries**

In `styles = StyleSheet.create({...})`, **delete**: `quoteCard`, `quote`, `quoteSource`. **Keep** `quoteMark` (positioned decoration, still used).

- [ ] **Step 3: Type-check + visual check**

```bash
npx tsc --noEmit
```

Reload simulator. Confirm: quote card still renders with the left accent border, the large decorative `"` mark in the top-left, the quote italic body, and the source attribution right-aligned in accent color.

- [ ] **Step 4: Commit**

```bash
git add src/screens/HomeScreen.tsx
git commit -m "home: quote block uses <Card> primitive

Drops bespoke shadow/border/padding in favor of <Card>.
Left accent border + decorative quote mark preserved via
style overrides."
```

---

## Task 11: HomeScreen — Goals Section Uses Heading + Body

**Files:**
- Modify: `src/screens/HomeScreen.tsx`

- [ ] **Step 1: Replace the goals section JSX**

Locate the `<View style={styles.goalsSection}>` block. Replace with:

```tsx
<View style={styles.goalsSection}>
  <Heading level={2} style={{ marginBottom: theme.spacing.xs }}>
    {t.todaysGoals}
  </Heading>
  <Body tone="muted" style={{ marginBottom: theme.spacing.lg }}>
    {t.tapToComplete}
  </Body>
  {goals.map((g) => (
    <GoalItem
      key={g.id}
      text={g.text}
      completed={g.completed && g.date === today}
      onToggle={() => toggleGoal(g.id)}
    />
  ))}
</View>
```

- [ ] **Step 2: Delete now-unused style entries**

Delete: `sectionTitle`, `sectionSubtitle` from the StyleSheet.

- [ ] **Step 3: Type-check + visual check**

```bash
npx tsc --noEmit
```

Reload. Confirm: "Today's Goals" heading is large and bold, sub-text below is muted, goal items unchanged.

- [ ] **Step 4: Commit**

```bash
git add src/screens/HomeScreen.tsx
git commit -m "home: goals section uses <Heading> + <Body>

Drops sectionTitle/sectionSubtitle inline styles."
```

---

## Task 12: HomeScreen — Visual Polish Pass (Premium Spiritual)

**Files:**
- Modify: `src/screens/HomeScreen.tsx`

This is the visible "wow" change — the same content, but with the Premium Spiritual treatment applied. Three concrete moves:

1. The hero gradient at the top becomes wider, taller, and uses a richer warm-amber wash (still subtle).
2. The greeting block gets `theme.spacing.xl` extra top margin so it breathes against the gradient.
3. The streak section's "longest streak" badge becomes a `<Card variant="flat">` for visual coherence with the rest.
4. Vertical rhythm between cards normalized to `theme.spacing.lg` (was a mix of `xl` and `xxl`).

- [ ] **Step 1: Polish the hero gradient**

Find the `heroGradient` style in `StyleSheet.create`. Replace it with:

```ts
heroGradient: {
  position: 'absolute',
  top: 0,
  left: -theme.spacing.xl,   // extends past Screen's horizontal padding
  right: -theme.spacing.xl,  // extends past Screen's horizontal padding
  height: 360,
},
```

And change the LinearGradient colors prop in JSX from:

```tsx
colors={['rgba(200, 120, 10, 0.09)', 'transparent']}
```

To:

```tsx
colors={['rgba(200, 120, 10, 0.14)', 'rgba(200, 120, 10, 0.04)', 'transparent']}
```

- [ ] **Step 2: Wrap the "longest streak" badge in `<Card variant="flat">`**

In the streak section JSX (from Task 9), change:

```tsx
<View style={styles.longestBadge}>
  <Caption tone="muted" weight="medium">
    {t.bestStreak}: {longest} {t.days}
  </Caption>
</View>
```

To:

```tsx
<Card
  variant="flat"
  padding={theme.spacing.sm}
  radius={theme.borderRadius.full}
  style={{ marginTop: theme.spacing.lg, paddingHorizontal: theme.spacing.lg }}
>
  <Caption tone="muted" weight="medium">
    {t.bestStreak}: {longest} {t.days}
  </Caption>
</Card>
```

And **delete** the `longestBadge` style entry from the StyleSheet — it's now a `<Card>`.

- [ ] **Step 3: Normalize spacing between content cards**

In the JSX, between the existing content blocks (TodayCard / EidHubCard / NextEventCard / QuickActions / HadithOfDay / quote / goals), wrap their parent flow such that every block has consistent `marginBottom`. Easiest move: add a wrapper that injects the spacing:

There is no clean way to do this without touching every child (which is out of scope for Day 1). Instead, accept that today's content blocks each provide their own `marginBottom` and **only** adjust the top spacing of the goals section in Task 11. Defer the spacing-normalization sweep to the Day-2+ plans that touch those child components.

(No code change for Step 3 — this step is a deliberate scope hold. Documented here so a future reader doesn't think it was forgotten.)

- [ ] **Step 4: Type-check + visual check on iOS and Android**

```bash
npx tsc --noEmit
```

```bash
npx expo start --ios
# Then in a separate terminal:
npx expo start --android
```

Confirm on **both** simulators:
- Hero gradient is now visibly warmer and extends edge-to-edge (no inset).
- Greeting reads against a soft amber wash at the top of the screen.
- "Best streak" badge is now a pill-shaped flat card with thin border instead of a rectangular bordered View.
- Scrolling smooth, no jank.

- [ ] **Step 5: Commit**

```bash
git add src/screens/HomeScreen.tsx
git commit -m "home: Premium Spiritual polish — hero gradient + flat badge

- Hero gradient extends to screen edges with 3-stop warm wash
- Best-streak badge becomes Card variant='flat' pill
- Visual upgrade applied to greeting block ambient color"
```

---

## Task 13: HomeScreen — Accessibility Labels Pass

**Files:**
- Modify: `src/screens/HomeScreen.tsx`

- [ ] **Step 1: Audit interactive elements**

In `HomeScreen.tsx`, find every interactive element. They are:

1. `<MenuButton />` (already has internal a11y per audit — leave as-is)
2. `<TodayCard hijriOffset={hijriOffset} />` (internal `TouchableOpacity` — out of scope, will be fixed in TodayCard's own plan)
3. `<EidHubCard />` (internal — out of scope)
4. `<NextEventCard />` (internal — out of scope)
5. `<QuickActions />` (already has `accessibilityLabel` per file inspection — leave as-is)
6. `<HadithOfDay />` (internal — out of scope)
7. `<GoalItem>` (internal — out of scope)
8. `<StreakCelebrationModal>` (modal — Day 2 plan)
9. The quote card itself is non-interactive — no a11y change needed.

For Day 1, the screen-level a11y change is to ensure the **`<Screen>` container** does not break VoiceOver order. Read the rendered tree once with VoiceOver enabled on iOS Simulator:

```
Simulator → Settings → Accessibility → VoiceOver → On
```

Or use the rotor (`Cmd+F5` toggles VoiceOver on Sim). Tab through the HomeScreen. Confirm: greeting → Hijri date → sub-greeting → streak ring → best-streak badge → cards → goals → goal items. Order should be top-to-bottom and read aloud sensibly.

If any element is announced as "Button, button" (double-button) or has no description, capture the element + open a follow-up bug — but for Day 1, the new primitives we added (`<Heading>` with `accessibilityRole="header"`) should improve announcement quality compared to plain `<Text>` headings.

- [ ] **Step 2: Note any HomeScreen-level a11y bugs found in this audit**

Append a short list to a new file `docs/superpowers/notes/2026-05-24-homescreen-a11y-followups.md` with anything found. If none, skip this step.

- [ ] **Step 3: Commit (only if step 2 created a file)**

```bash
git add docs/superpowers/notes/2026-05-24-homescreen-a11y-followups.md
git commit -m "notes: HomeScreen VoiceOver audit follow-ups for later plans"
```

---

## Task 14: Final Cross-Platform Verification + Tag

**Files:** none modified.

- [ ] **Step 1: Final type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 2: Run on iOS Simulator end-to-end**

```bash
npx expo start --ios --clear
```

Walk through:
- App launches.
- HomeScreen renders correctly (greeting, streak, cards, goals).
- Switch tabs to Quran, then back to Home — useFocusEffect re-fires, streak refreshes.
- Tap a goal to toggle completion — value persists across tab switches.
- Open Sidebar (MenuButton) — sidebar opens, doesn't break HomeScreen.
- Change language to Urdu (Settings → Language → اردو) — HomeScreen re-renders with Urdu greeting + Hijri date.
- Restart app — language and goals persist.

- [ ] **Step 3: Run on Android Emulator end-to-end**

```bash
npx expo start --android --clear
```

Repeat the same walkthrough. Pay special attention to: hero gradient renders cleanly on Android (no banding), shadow on the quote `<Card>` renders via `elevation` correctly, font fallbacks still pick up Syne/Plus Jakarta correctly.

- [ ] **Step 4: Tag the release point**

```bash
git tag day1-homescreen-foundation
git push origin main
git push origin day1-homescreen-foundation
```

This creates a stable rollback point. If Day 2's modal work introduces a regression, you can `git reset --hard day1-homescreen-foundation` (with user confirmation per safety protocol).

---

## Definition of Done (Day 1)

The plan is complete when **all** of the following are true:

- [ ] `src/components/ui/` contains `Screen.tsx`, `Heading.tsx`, `Text.tsx`, `Card.tsx`, `Button.tsx`, `index.ts`.
- [ ] `src/contexts/I18nProvider.tsx` exists and is wired into `App.tsx` inside `<LanguageProvider>`.
- [ ] `src/constants/theme.ts` exports the expanded token set (typography sizes/weights/lineHeights/letterSpacing, inverse colors, scrim, divider, disabled, opacity, motion).
- [ ] `src/screens/HomeScreen.tsx` wraps in `<Screen>`, uses `<Heading>/<Body>/<Caption>/<Label>/<Card>` for all directly-rendered typography and the quote block.
- [ ] `npx tsc --noEmit` passes with no errors.
- [ ] HomeScreen renders correctly on iOS Simulator and Android Emulator.
- [ ] Language switch (en / ur / ar) still works end-to-end.
- [ ] Tab navigation re-fires useFocusEffect (streak/goals refresh).
- [ ] Tag `day1-homescreen-foundation` exists on `main`.
- [ ] Every task above resulted in a commit — `git log --oneline` shows ~12 commits added this day.

When all checks pass, this plan is done. The next plan (Day 2 — modal system) can begin.
