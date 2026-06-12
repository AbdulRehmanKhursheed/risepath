import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Linking,
  AppState,
} from 'react-native';
import * as Location from 'expo-location';
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
import { AdBanner } from '../components/AdBanner';
import { AD_UNITS } from '../services/ads';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIZE = SCREEN_WIDTH * 0.82;
const C = SIZE / 2;
const OUTER_R = C - 4;
const INNER_R = C - 28;
const FACE_R  = C - 48;

const TICKS = Array.from({ length: 72 }, (_, i) => i * 5); // every 5°
const CARDINAL = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
const CARDINAL_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

function degToRad(deg: number) {
  return (deg * Math.PI) / 180;
}

function polarToXY(angleDeg: number, r: number) {
  // 0° at top, clockwise (compass convention).
  const rad = degToRad(angleDeg - 90);
  return { x: C + r * Math.cos(rad), y: C + r * Math.sin(rad) };
}

export function QiblaScreen() {
  const { t, language } = useLanguage();
  const isUrdu = language === 'ur';
  const isArabic = language === 'ar';
  const { location, loading, usingFallback, permissionDenied, retry } = useLocation();
  const { heading, available, lowAccuracy } = useCompass();
  const lat = location?.latitude ?? 24.8607;
  const lng = location?.longitude ?? 67.0011;
  const qiblaAngle = useQibla(lat, lng);

  // The GPS fix has no timeout in useLocation — don't block the screen
  // forever behind it; after 8s render with whatever we have and let the
  // fix land in the background.
  const [gpsTimedOut, setGpsTimedOut] = useState(false);
  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => setGpsTimedOut(true), 8000);
    return () => clearTimeout(timer);
  }, [loading]);

  // Returning from OS Settings doesn't remount this screen — re-fetch
  // location on foreground if we're stuck on denied/fallback coords.
  // MUST pre-check the permission silently first: retry() goes through
  // requestForegroundPermissionsAsync, and firing that uninvited on every
  // foreground while denied re-pops the OS dialog (and on Android the
  // dialog itself backgrounds the app — a deny re-prompt loop that burns
  // the user's last 'ask' and forces Settings-only recovery).
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active' || !(permissionDenied || usingFallback)) return;
      Location.getForegroundPermissionsAsync()
        .then(({ status }) => {
          if (status === 'granted') retry();
        })
        .catch(() => {});
    });
    return () => sub.remove();
  }, [permissionDenied, usingFallback, retry]);

  // True when the bearing comes from the Karachi default, not the user.
  const approximate = usingFallback || !location;

  const angleToQibla = heading != null
    ? (qiblaAngle - heading + 360) % 360
    : null;

  // ±5° tolerance — handle the 0/360 wrap (357° = 3° off).
  const isFacingQibla = angleToQibla != null && (angleToQibla < 5 || angleToQibla > 355);

  const turnDirection = angleToQibla != null
    ? (angleToQibla > 180 ? 'left' : 'right')
    : null;
  const turnDegrees = angleToQibla != null
    ? (angleToQibla > 180 ? 360 - angleToQibla : angleToQibla)
    : null;

  // Ring rotates opposite to device heading so North always points to real North.
  const ringRotation = heading != null ? -heading : 0;

  // Cached coords render immediately; only block when we have nothing yet.
  if (loading && !location && !gpsTimedOut) {
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

      <View style={styles.compassContainer}>
        <Svg width={SIZE} height={SIZE}>
          <Defs>
            <RadialGradient id="faceBg" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={theme.colors.surface} />
              <Stop offset="100%" stopColor={theme.colors.backgroundSoft} />
            </RadialGradient>
          </Defs>

          <Circle cx={C} cy={C} r={OUTER_R} fill={theme.colors.text} />
          <Circle cx={C} cy={C} r={OUTER_R - 3} fill="#2A1A08" />

          {/* Face rotates with device heading. */}
          <G transform={`rotate(${ringRotation} ${C} ${C})`}>
            <Circle cx={C} cy={C} r={INNER_R} fill="url(#faceBg)" />

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

          <Circle cx={C} cy={C} r={8} fill={theme.colors.accent} />
          <Circle cx={C} cy={C} r={4} fill="#fff" />

          {/* Qibla arrow: fixed bearing from North. */}
          <G transform={`rotate(${qiblaAngle + ringRotation} ${C} ${C})`}>
            <SvgText
              x={C}
              y={C - FACE_R + 4}
              fontSize={28}
              textAnchor="middle"
            >
              🕋
            </SvgText>
            <Line
              x1={C} y1={C - 18}
              x2={C} y2={C - FACE_R + 36}
              stroke={theme.colors.success}
              strokeWidth={3}
              strokeLinecap="round"
              opacity={0.9}
            />
            <Path
              d={`M ${C} ${C - FACE_R + 36} L ${C - 7} ${C - FACE_R + 50} L ${C + 7} ${C - FACE_R + 50} Z`}
              fill={theme.colors.success}
            />
          </G>
        </Svg>

        {isFacingQibla && (
          <View style={styles.alignedRing} />
        )}
      </View>

      {/* Suppressed while the compass permission card (!available) is up —
          two stacked cards about the same denial gave conflicting CTAs.
          When denied, 'retry' can't show a dialog anymore (iOS never
          re-prompts; Android suppresses after two denials) — deep-link to
          Settings instead. */}
      {approximate && available && (
        <TouchableOpacity
          style={styles.warningCard}
          onPress={permissionDenied ? () => Linking.openSettings().catch(() => {}) : retry}
          accessibilityRole="button"
        >
          <Text style={styles.warningTitle}>
            {isUrdu
              ? '⚠️ تخمینی سمت — مقام دستیاب نہیں'
              : isArabic
                ? '⚠️ اتجاه تقريبي — الموقع غير متاح'
                : '⚠️ Approximate — location unavailable'}
          </Text>
          <Text style={styles.warningBody}>
            {permissionDenied
              ? (isUrdu
                  ? 'قبلہ کی سمت ایک طے شدہ مقام سے دکھائی جا رہی ہے۔ درست سمت کے لیے سیٹنگز میں لوکیشن کی اجازت دیں — کھولنے کے لیے دبائیں۔'
                  : isArabic
                    ? 'يُعرض اتجاه القبلة بناءً على موقع افتراضي. للاتجاه الدقيق فعّل إذن الموقع من الإعدادات — اضغط للفتح.'
                    : 'Qibla is shown for a default location. Enable location in Settings for your real direction — tap to open.')
              : (isUrdu
                  ? 'قبلہ کی سمت ایک طے شدہ مقام سے دکھائی جا رہی ہے اور غلط ہو سکتی ہے۔ دوبارہ کوشش کے لیے دبائیں۔'
                  : isArabic
                    ? 'يُعرض اتجاه القبلة بناءً على موقع افتراضي وقد يكون خاطئًا. اضغط لإعادة المحاولة.'
                    : 'Qibla is shown for a default location and may be wrong here. Tap to retry.')}
          </Text>
        </TouchableOpacity>
      )}

      {available && lowAccuracy && (
        <Text style={styles.calibrationHint}>
          {isUrdu
            ? '🧭 کمپاس کی درستگی کم ہے — فون کو 8 کی شکل میں گھمائیں'
            : isArabic
              ? '🧭 دقة البوصلة منخفضة — حرّك هاتفك على شكل الرقم 8'
              : '🧭 Compass accuracy is low — wave your phone in a figure-8'}
        </Text>
      )}

      {isFacingQibla ? (
        <View style={[styles.statusCard, styles.statusCardAligned]}>
          <Text style={styles.statusEmoji}>🕋</Text>
          <Text style={styles.statusTitle}>
            {isUrdu
              ? 'آپ قبلہ کی طرف ہیں!'
              : isArabic
                ? 'أنت باتجاه القبلة!'
                : 'Facing Qibla!'}
          </Text>
          <Text style={styles.statusSub}>
            {isUrdu
              ? 'ابھی نماز پڑھ سکتے ہیں'
              : isArabic
                ? 'يمكنك بدء الصلاة الآن'
                : 'You may begin your prayer'}
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
          {!available && (
            <TouchableOpacity
              style={styles.permissionCard}
              onPress={() => Linking.openSettings().catch(() => {})}
              accessibilityRole="button"
            >
              <Text style={styles.permissionTitle}>
                {isUrdu
                  ? '📍 قبلہ کمپاس کے لیے لوکیشن کی اجازت درکار ہے'
                  : '📍 Compass needs location permission'}
              </Text>
              <Text style={styles.permissionBody}>
                {isUrdu
                  ? 'سیٹنگز میں جا کر لوکیشن کی اجازت دیں — یہ آپ کی پوزیشن یاد نہیں رکھتا، صرف قبلہ سمت کے لیے درکار ہے۔'
                  : 'Tap to open Settings and enable location. We don\'t store your position — it\'s only used to compute the Qibla bearing.'}
              </Text>
            </TouchableOpacity>
          )}
          {available && heading == null && (
            <Text style={styles.hintText}>
              {t.pointPhoneNorth}
            </Text>
          )}
        </View>
      )}

      <Text style={styles.footerHint}>{t.holdPhoneFlat}</Text>

      <View style={styles.adWrap}>
        <AdBanner unitId={AD_UNITS.bannerQibla} />
      </View>
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
  warningCard: {
    backgroundColor: theme.colors.errorMuted,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.error,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    width: '100%',
    marginBottom: theme.spacing.md,
  },
  warningTitle: {
    fontSize: 14,
    color: theme.colors.error,
    fontFamily: theme.typography.fontBodyBold,
    textAlign: 'center',
    marginBottom: 4,
  },
  warningBody: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontBody,
    textAlign: 'center',
    lineHeight: 17,
  },
  calibrationHint: {
    fontSize: 13,
    color: theme.colors.accent,
    fontFamily: theme.typography.fontBody,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
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
  permissionCard: {
    marginTop: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accentMuted,
    alignItems: 'center',
  },
  permissionTitle: {
    fontSize: 14,
    color: theme.colors.accent,
    fontFamily: theme.typography.fontBodyBold,
    textAlign: 'center',
    marginBottom: 4,
  },
  permissionBody: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontBody,
    textAlign: 'center',
    lineHeight: 17,
  },
  footerHint: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontBody,
    textAlign: 'center',
    marginTop: 4,
  },
  adWrap: {
    marginTop: theme.spacing.xl,
    alignItems: 'center',
    width: '100%',
  },
});
