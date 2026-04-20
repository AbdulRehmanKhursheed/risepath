import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../constants/theme';
import { useLanguage } from '../contexts/LanguageContext';
import { useSimpleMode } from '../contexts/SimpleModeContext';
import { storage } from '../services/storage';
import {
  CalendarRegion,
  detectRegionFromCoords,
  getNextEvent,
  ResolvedEvent,
  Sect,
} from '../constants/islamicCalendar';

const TICK_MS = 60 * 1000;

function computeDaysHours(target: Date, now: Date = new Date()) {
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return { days: 0, hours: 0, isNow: true };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    isNow: false,
  };
}

export function NextEventCard() {
  const { language } = useLanguage();
  const { fs } = useSimpleMode();
  const navigation = useNavigation();
  const isUrdu = language === 'ur';
  const isArabic = language === 'ar';

  const [sect, setSect] = useState<Sect | null>(null);
  const [region, setRegion] = useState<CalendarRegion | null>(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    (async () => {
      const [fiqh, savedRegion, loc] = await Promise.all([
        storage.getFiqhSchool(),
        storage.getCalendarRegion(),
        storage.getLocation(),
      ]);
      setSect(fiqh);
      const r = savedRegion ?? (loc ? detectRegionFromCoords(loc.latitude, loc.longitude) : 'global');
      if (!savedRegion) await storage.setCalendarRegion(r);
      setRegion(r);
    })();
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), TICK_MS);
    return () => clearInterval(id);
  }, []);

  const event: ResolvedEvent | null = useMemo(() => {
    if (!region) return null;
    return getNextEvent(sect, region, now);
  }, [sect, region, now]);

  if (!event) return null;

  const { days, hours, isNow } = computeDaysHours(event.effectiveDate, now);
  const name = isUrdu ? event.nameUr : isArabic ? event.nameAr : event.nameEn;
  const label = isUrdu ? 'اگلا مقدس دن' : isArabic ? 'الحدث القادم' : 'Next Sacred Event';
  const countdownTxt = isNow
    ? isUrdu ? 'آج کا دن' : isArabic ? 'اليوم' : 'Today'
    : isUrdu
    ? `${days} دن · ${hours} گھنٹے`
    : isArabic
    ? `${days} يوم · ${hours} ساعة`
    : `${days}d · ${hours}h`;

  return (
    <TouchableOpacity
      style={styles.wrap}
      onPress={() => (navigation as any).navigate('SacredJourney')}
      activeOpacity={0.85}
    >
      <LinearGradient
        colors={['#4A3B1A', '#1F2B1C']}
        style={styles.card}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.iconCircle}>
          <Text style={styles.icon}>{event.icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.label, { fontSize: fs(10) }]}>{label}</Text>
          <Text style={[styles.title, { fontSize: fs(16) }]} numberOfLines={1}>
            {name}
          </Text>
          <Text style={[styles.countdown, { fontSize: fs(13) }]}>{countdownTxt}</Text>
        </View>
        <Text style={styles.arrow}>›</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#1C0F06',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.22,
        shadowRadius: 14,
      },
      android: { elevation: 6 },
    }),
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 22 },
  label: {
    color: 'rgba(255,255,255,0.7)',
    fontFamily: theme.typography.fontBodyBold,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  title: {
    color: '#FFFFFF',
    fontFamily: theme.typography.fontBodyBold,
    letterSpacing: -0.2,
  },
  countdown: {
    color: 'rgba(255,255,255,0.82)',
    fontFamily: theme.typography.fontBodyMedium,
    marginTop: 2,
    letterSpacing: 0.4,
  },
  arrow: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 26,
    marginLeft: 4,
  },
});
