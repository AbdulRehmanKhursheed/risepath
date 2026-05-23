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
