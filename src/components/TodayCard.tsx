import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  AppState,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { theme } from '../constants/theme';
import { useLanguage } from '../contexts/LanguageContext';
import { useSimpleMode } from '../contexts/SimpleModeContext';
import { useQuranNav } from '../contexts/QuranNavContext';
import { getTodayAct, DailyAct } from '../constants/dailyAct';
import { storage } from '../services/storage';
import { getLocalDateKey } from '../utils/date';
import type { Sect } from '../constants/islamicCalendar';

// Shared day-rollover tick for the keep-alive Home tab. The tab navigator
// never unmounts HomeScreen, so anything derived from `new Date()` in a
// mount-time memo freezes at first compute and shows yesterday's content
// after midnight (very common on Android, where the process survives days).
// Re-derives the local date key on focus, on app foreground, and on a cheap
// minute tick; setState bails out when the key hasn't changed, so consumers
// only re-render at the actual day boundary.
//
// One module-level AppState listener + interval serves every hook instance
// (HomeScreen, TodayCard, and HadithOfDay all call useDayKey and stay
// mounted all session — per-hook timers tripled the cost for no benefit).
// The shared timer tears down when the last subscriber leaves.
type DayKeySubscriber = () => void;
const dayKeySubscribers = new Set<DayKeySubscriber>();
let stopDayKeyTick: (() => void) | null = null;

function notifyDayKeySubscribers() {
  dayKeySubscribers.forEach((fn) => fn());
}

function subscribeDayKey(fn: DayKeySubscriber): () => void {
  dayKeySubscribers.add(fn);
  if (!stopDayKeyTick) {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') notifyDayKeySubscribers();
    });
    const id = setInterval(notifyDayKeySubscribers, 60_000);
    stopDayKeyTick = () => {
      sub.remove();
      clearInterval(id);
    };
  }
  return () => {
    dayKeySubscribers.delete(fn);
    if (dayKeySubscribers.size === 0 && stopDayKeyTick) {
      stopDayKeyTick();
      stopDayKeyTick = null;
    }
  };
}

export function useDayKey(): string {
  const [dayKey, setDayKey] = useState(() => getLocalDateKey());
  const refresh = useCallback(() => {
    setDayKey((prev) => {
      const next = getLocalDateKey();
      return next === prev ? prev : next;
    });
  }, []);
  useFocusEffect(refresh);
  useEffect(() => subscribeDayKey(refresh), [refresh]);
  return dayKey;
}

type TodayCardProps = {
  // Hijri offset passed down from HomeScreen — single source of truth so
  // the card's day-of-Dhul-Hijjah always matches the header's Hijri date.
  // Previously this component read storage independently, which caused
  // a 2-day drift after HomeScreen refreshed the offset from Aladhan but
  // TodayCard kept its stale local copy.
  hijriOffset?: number;
};

// "Today's Recommended Act" — the most time-sensitive, sacred-day-aware,
// retention-driving card on Home. Picks one of: Hijri-event override (Eid,
// Arafah, Ramadan, last 10 nights, Ashura, etc.), Friday Jumu'ah, or a daily
// rotation. Tap → opens the relevant in-app screen.
export function TodayCard({ hijriOffset = 0 }: TodayCardProps = {}) {
  const { language } = useLanguage();
  const { fs } = useSimpleMode();
  const navigation = useNavigation();
  const { openSurah } = useQuranNav();
  const isUrdu = language === 'ur';
  const isArabic = language === 'ar';

  // Sect drives the Ashura override (Sunni: fast / Shia: mourning Husayn).
  // Hydrate after mount; null until then — getTodayAct falls back to Sunni
  // rendering, which is the safe default for an unknown user.
  const [sect, setSect] = useState<Sect | null>(null);
  // useFocusEffect — HomeScreen never unmounts, so a plain useEffect would
  // freeze the sect at first read. If the user changes calc method (Jafari →
  // sets fiqh shia) later, this card needs to pick up the new sect.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      storage.getFiqhSchool().then((s) => {
        if (!cancelled) setSect(s);
      });
      return () => { cancelled = true; };
    }, [])
  );

  // dayKey in the deps so the act recomputes when the day rolls over — the
  // card otherwise kept showing yesterday's act (no Jumu'ah card on Friday,
  // stale sacred-day card on Eid/Arafah/Ashura) for as long as the process
  // stayed alive.
  const dayKey = useDayKey();
  const act: DailyAct = useMemo(
    () => getTodayAct(new Date(), sect, hijriOffset),
    [sect, hijriOffset, dayKey]
  );

  const title = isUrdu ? act.titleUr : isArabic ? act.titleAr : act.titleEn;
  const action = isUrdu ? act.actionUr : isArabic ? act.actionAr : act.actionEn;
  const eyebrow = isUrdu
    ? 'آج کا عمل'
    : isArabic
    ? 'عمل اليوم'
    : "TODAY'S ACT";
  const ctaText = isUrdu ? 'ابھی شروع کریں' : isArabic ? 'ابدأ الآن' : 'Start now';

  const onPress = () => {
    if (!act.screen) return;
    if (act.screen === 'Quran') {
      // Deep-link to the specific surah when the act calls for it (e.g. Ayat
      // al-Kursi → al-Baqarah, Friday → al-Kahf). QuranNavContext drives the
      // QuranTab to mount with `initialSurah` set; navigation just switches tab.
      if (act.surah) openSurah(act.surah);
      (navigation as any).navigate('MainTabs', { screen: 'Quran' });
    } else {
      (navigation as any).navigate(act.screen);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={act.screen ? 0.9 : 1}
      onPress={onPress}
      disabled={!act.screen}
      style={styles.wrap}
    >
      <LinearGradient
        colors={['#C8780A', '#8A4F05']}
        style={styles.card}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerRow}>
          <Text style={styles.icon}>{act.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.eyebrow, { fontSize: fs(10) }]}>{eyebrow}</Text>
            <Text style={[styles.title, { fontSize: fs(17) }]} numberOfLines={2}>
              {title}
            </Text>
          </View>
        </View>

        <Text style={[styles.body, { fontSize: fs(13) }]} numberOfLines={3}>
          {action}
        </Text>

        <View style={styles.footerRow}>
          <Text style={[styles.source, { fontSize: fs(11) }]}>— {act.source}</Text>
          {act.screen && (
            <Text style={[styles.cta, { fontSize: fs(12) }]}>{ctaText} ›</Text>
          )}
        </View>
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
        shadowColor: theme.colors.accent,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.28,
        shadowRadius: 14,
      },
      android: { elevation: 6 },
    }),
  },
  card: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  icon: {
    fontSize: 32,
  },
  eyebrow: {
    color: 'rgba(255,255,255,0.78)',
    fontFamily: theme.typography.fontBodyBold,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  title: {
    color: '#FFFFFF',
    fontFamily: theme.typography.fontHeadingBold,
    fontWeight: '700',
    letterSpacing: -0.3,
    lineHeight: 22,
  },
  body: {
    color: 'rgba(255,255,255,0.92)',
    fontFamily: theme.typography.fontBody,
    lineHeight: 19,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
    marginTop: 2,
  },
  source: {
    color: 'rgba(255,255,255,0.7)',
    fontFamily: theme.typography.fontBodyMedium,
    fontStyle: 'italic',
    flex: 1,
  },
  cta: {
    color: '#FFFFFF',
    fontFamily: theme.typography.fontBodyBold,
    letterSpacing: 0.4,
  },
});
