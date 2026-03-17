import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import Svg, { Circle, Line, G } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocation } from '../hooks/useLocation';
import { useQibla, getCardinalDirection } from '../hooks/useQibla';
import { useCompass } from '../hooks/useCompass';
import { theme } from '../constants/theme';
import { useLanguage } from '../contexts/LanguageContext';

const SIZE = Dimensions.get('window').width * 0.75;
const CENTER = SIZE / 2;
const RADIUS = CENTER - 20;

export function QiblaScreen() {
  const { t } = useLanguage();
  const { location, loading } = useLocation();
  const { heading, available } = useCompass();
  const lat = location?.latitude ?? 24.8607;
  const lng = location?.longitude ?? 67.0011;
  const qiblaAngle = useQibla(lat, lng);

  const angleToQibla = heading != null
    ? (qiblaAngle - heading + 360) % 360
    : null;

  const turnDirection =
    angleToQibla != null
      ? angleToQibla > 180
        ? 'left'
        : 'right'
      : null;
  const turnDegrees =
    angleToQibla != null
      ? angleToQibla > 180
        ? 360 - angleToQibla
        : angleToQibla
      : null;

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>{t.gettingLocation}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(200, 120, 10, 0.09)', 'transparent']}
        style={styles.heroGradient}
        pointerEvents="none"
      />
      <Text style={styles.title}>{t.qiblaDirection}</Text>
      <Text style={styles.subtitle}>{t.qiblaSubtitle}</Text>

      <View style={styles.compassContainer}>
        <Svg width={SIZE} height={SIZE} style={styles.compass}>
          <Circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            stroke={theme.colors.border}
            strokeWidth={2}
            fill="none"
          />
          <G transform={`rotate(${heading ?? 0} ${CENTER} ${CENTER})`}>
            <Line
              x1={CENTER}
              y1={CENTER}
              x2={CENTER}
              y2={CENTER - RADIUS + 15}
              stroke={theme.colors.accent}
              strokeWidth={4}
              strokeLinecap="round"
            />
          </G>
          <G transform={`rotate(${qiblaAngle} ${CENTER} ${CENTER})`}>
            <Line
              x1={CENTER}
              y1={CENTER}
              x2={CENTER}
              y2={CENTER - RADIUS + 15}
              stroke={theme.colors.success}
              strokeWidth={3}
              strokeLinecap="round"
              opacity={0.9}
            />
          </G>
        </Svg>
        <View style={styles.compassLabels}>
          <Text style={styles.compassLabel}>N</Text>
        </View>
          <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: theme.colors.accent }]} />
            <Text style={styles.legendText}>{t.you}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: theme.colors.success }]} />
            <Text style={styles.legendText}>{t.qiblaLabel}</Text>
          </View>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.angleText}>
          {Math.round(qiblaAngle)}° {getCardinalDirection(qiblaAngle)}
        </Text>
        <Text style={styles.angleLabel}>{t.fromNorth}</Text>
      </View>

      {available && heading != null && turnDirection && turnDegrees != null && (
        <View style={styles.turnCard}>
          <Text style={styles.turnText}>
            {turnDirection === 'left' ? t.turnLeft : t.turnRight} {Math.round(turnDegrees)}°
          </Text>
          <Text style={styles.turnHint}>{t.holdPhoneFlat}</Text>
        </View>
      )}

      {(!available || heading == null) && (
        <View style={styles.turnCard}>
          <Text style={styles.turnHint}>
            {t.pointPhoneNorth} ({Math.round(qiblaAngle)}°)
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.xl,
    paddingTop: theme.spacing.xxl,
    alignItems: 'center',
  },
  heroGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 250,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontBody,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text,
    fontFamily: theme.typography.fontHeadingBold,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.xl,
    fontFamily: theme.typography.fontBody,
  },
  compassContainer: {
    width: SIZE,
    marginBottom: theme.spacing.xl,
    alignItems: 'center',
  },
  compass: {
    position: 'absolute',
  },
  compassLabels: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 8,
  },
  compassLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontBodyBold,
  },
  legend: {
    flexDirection: 'row',
    gap: theme.spacing.xl,
    marginTop: theme.spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontBody,
  },
  infoCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    minWidth: 200,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  angleText: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.accent,
    fontFamily: theme.typography.fontHeadingBold,
  },
  angleLabel: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginTop: 4,
    fontFamily: theme.typography.fontBody,
  },
  turnCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  turnText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    fontFamily: theme.typography.fontBodyBold,
  },
  turnHint: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginTop: 6,
    textAlign: 'center',
    fontFamily: theme.typography.fontBody,
  },
});
