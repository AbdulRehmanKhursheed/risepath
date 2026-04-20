import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { theme } from '../constants/theme';

type Props = {
  current: number;
  target?: number;
  size?: number;
  label?: string;
};

export function StreakRing({ current, target = 7, size = 140, label = 'day streak' }: Props) {
  const progress = Math.min(current / target, 1);
  const strokeWidth = size * 0.1;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        <Defs>
          <LinearGradient id="streakGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={theme.colors.accentLight} />
            <Stop offset="100%" stopColor={theme.colors.accent} />
          </LinearGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {progress > 0 && (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#streakGradient)"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        )}
      </Svg>
      <View style={styles.center}>
        <Text style={[styles.number, { fontSize: size * 0.32 }]}>{current}</Text>
        <Text style={styles.label}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    position: 'absolute',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  number: {
    color: theme.colors.text,
    fontWeight: '700',
    fontFamily: 'Syne_700Bold',
    textShadowColor: 'rgba(122, 90, 64, 0.25)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  label: {
    color: theme.colors.textMuted,
    fontSize: 13,
    marginTop: 2,
    fontFamily: 'PlusJakartaSans_500Medium',
    letterSpacing: 0.5,
  },
});
