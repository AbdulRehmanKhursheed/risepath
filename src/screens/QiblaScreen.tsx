import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Svg, {
  Circle,
  Line,
  Text as SvgText,
  G,
  Path,
  Defs,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocation } from '../hooks/useLocation';
import { useQibla, getCardinalDirection } from '../hooks/useQibla';
import { useCompass } from '../hooks/useCompass';
import { theme } from '../constants/theme';
import { useLanguage } from '../contexts/LanguageContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIZE = SCREEN_WIDTH * 0.82;
const C = SIZE / 2;           // center
const OUTER_R = C - 4;        // outer ring radius
const INNER_R = C - 28;       // inner ring (degree labels)
const FACE_R  = C - 48;       // compass face radius

// Pre-compute degree tick positions
const TICKS = Array.from({ length: 72 }, (_, i) => i * 5); // every 5°
const CARDINAL = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
const CARDINAL_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

function degToRad(deg: number) {
  return (deg * Math.PI) / 180;
}

function polarToXY(angleDeg: number, r: number) {
  const rad = degToRad(angleDeg - 90); // 0° at top
  return { x: C + r * Math.cos(rad), y: C + r * Math.sin(rad) };
}

export function QiblaScreen() {
  const { t, language } = useLanguage();
  const { location, loading } = useLocation();
  const { heading, available } = useCompass();
  const lat = location?.latitude ?? 24.8607;
  const lng = location?.longitude ?? 67.0011;
  const qiblaAngle = useQibla(lat, lng);

  // How many degrees to turn to face Qibla from current heading
  const angleToQibla = heading != null
    ? (qiblaAngle - heading + 360) % 360
    : null;

  // Accept ±5° tolerance and correctly handle the 360/0 wrap-around
  // (e.g. angleToQibla of 357° means only 3° off — the user IS aligned).
  const isFacingQibla = angleToQibla != null && (angleToQibla < 5 || angleToQibla > 355);

  const turnDirection = angleToQibla != null
    ? (angleToQibla > 180 ? 'left' : 'right')
    : null;
  const turnDegrees = angleToQibla != null
    ? (angleToQibla > 180 ? 360 - angleToQibla : angleToQibla)
    : null;

  // The compass RING rotates opposite to device heading
  // so that North on the ring always points to real North
  const ringRotation = heading != null ? -heading : 0;

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>{t.gettingLocation}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={['rgba(200, 120, 10, 0.09)', 'transparent']}
        style={styles.heroGradient}
        pointerEvents="none"
      />

      <Text style={styles.title}>{t.qiblaDirection}</Text>
      <Text style={styles.subtitle}>{t.qiblaSubtitle}</Text>

      {/* Compass */}
      <View style={styles.compassContainer}>
        <Svg width={SIZE} height={SIZE}>
          <Defs>
            <RadialGradient id="faceBg" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={theme.colors.surface} />
              <Stop offset="100%" stopColor={theme.colors.backgroundSoft} />
            </RadialGradient>
          </Defs>

          {/* Outer bezel ring */}
          <Circle cx={C} cy={C} r={OUTER_R} fill={theme.colors.text} />
          <Circle cx={C} cy={C} r={OUTER_R - 3} fill="#2A1A08" />

          {/* Compass face — this rotates with device heading */}
          <G transform={`rotate(${ringRotation} ${C} ${C})`}>
            {/* Face background */}
            <Circle cx={C} cy={C} r={INNER_R} fill="url(#faceBg)" />

            {/* Degree ticks */}
            {TICKS.map((deg) => {
              const isMajor = deg % 45 === 0;
              const isMid   = deg % 10 === 0;
              const tickLen = isMajor ? 12 : isMid ? 8 : 5;
              const strokeW = isMajor ? 2.5 : 1;
              const outer = polarToXY(deg, INNER_R - 2);
              const inner = polarToXY(deg, INNER_R - 2 - tickLen);
              return (
                <Line
                  key={deg}
                  x1={outer.x} y1={outer.y}
                  x2={inner.x} y2={inner.y}
                  stroke={isMajor ? theme.colors.accent : theme.colors.border}
                  strokeWidth={strokeW}
                />
              );
            })}

            {/* Cardinal + intercardinal labels */}
            {CARDINAL.map((label, i) => {
              const angle = CARDINAL_ANGLES[i];
              const isNorth = label === 'N';
              const isCardinal = i % 2 === 0;
              const pos = polarToXY(angle, INNER_R - 22);
              return (
                <SvgText
                  key={label}
                  x={pos.x}
                  y={pos.y + 5}
                  fontSize={isNorth ? 18 : isCardinal ? 14 : 11}
                  fontWeight={isNorth || isCardinal ? 'bold' : 'normal'}
                  fill={isNorth ? theme.colors.error : isCardinal ? theme.colors.text : theme.colors.textMuted}
                  textAnchor="middle"
                >
                  {label}
                </SvgText>
              );
            })}

            {/* Degree numbers at 30° intervals */}
            {[30, 60, 120, 150, 210, 240, 300, 330].map((deg) => {
              const pos = polarToXY(deg, INNER_R - 22);
              return (
                <SvgText
                  key={`d${deg}`}
                  x={pos.x}
                  y={pos.y + 4}
                  fontSize={9}
                  fill={theme.colors.textMuted}
                  textAnchor="middle"
                >
                  {deg}
                </SvgText>
              );
            })}
          </G>

          {/* Center pivot dot */}
          <Circle cx={C} cy={C} r={8} fill={theme.colors.accent} />
          <Circle cx={C} cy={C} r={4} fill="#fff" />

          {/* Qibla indicator — fixed, always points to Qibla bearing from North */}
          <G transform={`rotate(${qiblaAngle + ringRotation} ${C} ${C})`}>
            {/* Kaaba emoji positioned at tip of Qibla arrow */}
            <SvgText
              x={C}
              y={C - FACE_R + 4}
              fontSize={28}
              textAnchor="middle"
            >
              🕋
            </SvgText>
            {/* Qibla arrow shaft */}
            <Line
              x1={C} y1={C - 18}
              x2={C} y2={C - FACE_R + 36}
              stroke={theme.colors.success}
              strokeWidth={3}
              strokeLinecap="round"
              opacity={0.9}
            />
            {/* Arrowhead */}
            <Path
              d={`M ${C} ${C - FACE_R + 36} L ${C - 7} ${C - FACE_R + 50} L ${C + 7} ${C - FACE_R + 50} Z`}
              fill={theme.colors.success}
            />
          </G>
        </Svg>

        {/* Qibla facing indicator ring — glows green when aligned */}
        {isFacingQibla && (
          <View style={styles.alignedRing} />
        )}
      </View>

      {/* Status card */}
      {isFacingQibla ? (
        <View style={[styles.statusCard, styles.statusCardAligned]}>
          <Text style={styles.statusEmoji}>🕋</Text>
          <Text style={styles.statusTitle}>
            {language === 'ur' ? 'آپ قبلہ کی طرف ہیں!' : 'Facing Qibla!'}
          </Text>
          <Text style={styles.statusSub}>
            {language === 'ur' ? 'ابھی نماز پڑھ سکتے ہیں' : 'You may begin your prayer'}
          </Text>
        </View>
      ) : (
        <View style={styles.statusCard}>
          <Text style={[styles.angleText]}>
            {Math.round(qiblaAngle)}° {getCardinalDirection(qiblaAngle)}
          </Text>
          <Text style={styles.angleLabel}>{t.fromNorth}</Text>
          {available && heading != null && turnDirection && turnDegrees != null && (
            <Text style={styles.turnText}>
              {turnDirection === 'left' ? t.turnLeft : t.turnRight}{' '}
              {Math.round(turnDegrees)}°
            </Text>
          )}
          {(!available || heading == null) && (
            <Text style={styles.hintText}>
              {t.pointPhoneNorth}
            </Text>
          )}
        </View>
      )}

      <Text style={styles.footerHint}>{t.holdPhoneFlat}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    padding: theme.spacing.xl,
    paddingTop: theme.spacing.xxl,
    paddingBottom: theme.spacing.xxxl,
    alignItems: 'center',
  },
  heroGradient: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
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
    fontSize: 15,
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
    textAlign: 'center',
  },
  compassContainer: {
    width: SIZE,
    height: SIZE,
    marginBottom: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alignedRing: {
    position: 'absolute',
    width: SIZE + 12,
    height: SIZE + 12,
    borderRadius: (SIZE + 12) / 2,
    borderWidth: 3,
    borderColor: theme.colors.success,
    opacity: 0.6,
  },
  statusCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
  },
  statusCardAligned: {
    borderColor: theme.colors.success,
    backgroundColor: theme.colors.successMuted,
  },
  statusEmoji: {
    fontSize: 32,
    marginBottom: 6,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.success,
    fontFamily: theme.typography.fontBodyBold,
    marginBottom: 4,
  },
  statusSub: {
    fontSize: 14,
    color: theme.colors.success,
    fontFamily: theme.typography.fontBody,
    opacity: 0.8,
  },
  angleText: {
    fontSize: 30,
    fontWeight: '700',
    color: theme.colors.accent,
    fontFamily: theme.typography.fontHeadingBold,
    marginBottom: 4,
  },
  angleLabel: {
    fontSize: 13,
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontBody,
    marginBottom: 8,
  },
  turnText: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.colors.text,
    fontFamily: theme.typography.fontBodyBold,
  },
  hintText: {
    fontSize: 13,
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontBody,
    textAlign: 'center',
    marginTop: 4,
  },
  footerHint: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontBody,
    textAlign: 'center',
    marginTop: 4,
  },
});
