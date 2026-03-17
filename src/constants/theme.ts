import { Platform } from 'react-native';

// Warm Islamic manuscript palette — parchment, amber-gold, deep green
// High contrast for elders, warm & inviting for children
export const theme = {
  colors: {
    background: '#FAF4E8',        // aged parchment — easy on aging eyes
    backgroundSoft: '#F2EAD6',    // slightly deeper parchment
    surface: '#FFFFFF',            // clean white cards — sharp contrast
    surfaceElevated: '#FFF9F0',    // warm white elevated surface
    accent: '#C8780A',             // rich amber-gold — warm, not harsh orange
    accentLight: '#E08A1A',        // lighter gold for highlights
    accentGlow: 'rgba(200, 120, 10, 0.3)',
    accentMuted: 'rgba(200, 120, 10, 0.12)',
    text: '#1C0F06',               // dark warm brown — never cold black
    textSecondary: '#3C2510',      // medium warm brown
    textMuted: '#7A5A40',          // muted warm brown — readable for elders
    success: '#1A7A3C',            // deep Islamic green
    successMuted: 'rgba(26, 122, 60, 0.14)',
    error: '#B83025',              // warm deep red
    errorMuted: 'rgba(184, 48, 37, 0.13)',
    border: '#DCCAAA',             // warm beige border
    borderSoft: '#EAD9BF',         // softer warm border
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
