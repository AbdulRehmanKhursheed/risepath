import { Platform } from 'react-native';

export const theme = {
  colors: {
    background: '#FAF4E8',
    backgroundSoft: '#F2EAD6',
    surface: '#FFFFFF',
    surfaceElevated: '#FFF9F0',
    accent: '#C8780A',
    accentLight: '#E08A1A',
    accentGlow: 'rgba(200, 120, 10, 0.3)',
    accentMuted: 'rgba(200, 120, 10, 0.12)',
    text: '#1C0F06',
    textSecondary: '#3C2510',
    textMuted: '#7A5A40',
    success: '#1A7A3C',
    successMuted: 'rgba(26, 122, 60, 0.14)',
    error: '#B83025',
    errorMuted: 'rgba(184, 48, 37, 0.13)',
    border: '#DCCAAA',
    borderSoft: '#EAD9BF',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    xxxl: 48,
  },
  borderRadius: {
    sm: 10,
    md: 14,
    lg: 18,
    xl: 24,
    full: 9999,
  },
  typography: {
    fontHeading: 'Syne_600SemiBold',
    fontHeadingBold: 'Syne_700Bold',
    fontBody: 'PlusJakartaSans_400Regular',
    fontBodyMedium: 'PlusJakartaSans_500Medium',
    fontBodyBold: 'PlusJakartaSans_600SemiBold',
    // Quran-specific Arabic fonts — bundled in /assets/fonts.
    // Uthmani = Madinah Mushaf (KFGQPC-style, used in Saudi-printed Qurans).
    // IndoPak = Pakistani/Indian Mushaf script — what most South-Asian
    // Muslims grew up reading from a physical Quran.
    fontQuranUthmani: 'AmiriQuran',
    fontQuranIndopak: 'NoorehudaQuran',
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
      ios: { shadowColor: '#C8780A', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 18 },
      android: { elevation: 6 },
    }),
  },
} as const;
