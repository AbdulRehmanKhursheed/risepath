import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocation } from '../hooks/useLocation';
import { usePrayerTimes, PrayerName } from '../hooks/usePrayerTimes';
import { PrayerRow } from '../components/PrayerRow';
import { PrayerSettingsModal } from '../components/PrayerSettingsModal';
import { storage, PrayerRecord } from '../services/storage';
import {
  requestNotificationPermissions,
  schedulePrayerNotifications,
  scheduleSacredCountdownNotifications,
  setupNotificationChannel,
} from '../services/notifications';
import { theme } from '../constants/theme';
import { useLanguage } from '../contexts/LanguageContext';
import { MenuButton } from '../components/MenuButton';
import type { CalculationMethodId, MadhabId } from '../constants/prayerMethods';
import { detectRegionFromCoords } from '../constants/islamicCalendar';

function getDateString(d: Date): string {
  return d.toISOString().split('T')[0];
}

function getWeekDates(): Date[] {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

export function PrayerTrackerScreen() {
  const { t, language } = useLanguage();
  const { location, loading: locationLoading } = useLocation();
  const [prayers, setPrayers] = useState<Record<string, PrayerRecord>>({});
  const [loading, setLoading] = useState(true);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [calculationMethod, setCalculationMethod] = useState<CalculationMethodId>('Karachi');
  const [madhab, setMadhab] = useState<MadhabId>('Shafi');

  const lat = location?.latitude ?? 24.8607;
  const lng = location?.longitude ?? 67.0011;
  // Stable date: only changes when the calendar day changes, not on every render.
  const today = useMemo(() => new Date(), [getDateString(new Date())]);
  const prayerTimes = usePrayerTimes(lat, lng, today, calculationMethod, madhab);

  // Translated prayer display names keyed by PrayerName
  const prayerDisplayNames: Record<PrayerName, string> = {
    fajr: t.fajr,
    dhuhr: t.dhuhr,
    asr: t.asr,
    maghrib: t.maghrib,
    isha: t.isha,
  };

  useEffect(() => {
    storage.getPrayerSettings().then((s) => {
      if (s) {
        setCalculationMethod(s.calculationMethod as CalculationMethodId);
        setMadhab(s.madhab as MadhabId);
      }
    });
  }, []);

  const loadPrayers = useCallback(async () => {
    const data = await storage.getPrayers();
    setPrayers(data);
  }, []);

  useEffect(() => {
    loadPrayers().finally(() => setLoading(false));
  }, [loadPrayers]);

  const todayKey = getDateString(today);
  const todayRecord = prayers[todayKey] ?? {
    fajr: false,
    dhuhr: false,
    asr: false,
    maghrib: false,
    isha: false,
  };

  const markPrayer = useCallback(
    async (key: PrayerName) => {
      const newRecord = { ...todayRecord, [key]: !todayRecord[key] };
      const updated = { ...prayers, [todayKey]: newRecord };
      setPrayers(updated);
      await storage.setPrayers(updated);
    },
    [todayRecord, prayers, todayKey]
  );

  // Guard: only reschedule notifications once per day to avoid repeated
  // cancel/reschedule cycles every time a parent re-render occurs.
  const lastScheduledDate = useRef<string>('');
  useEffect(() => {
    const todayKey = getDateString(today);
    if (lastScheduledDate.current === todayKey) return;
    (async () => {
      const granted = await requestNotificationPermissions();
      if (granted) {
        await setupNotificationChannel();
        await schedulePrayerNotifications(
          prayerTimes.map((p) => ({ name: p.name, time: p.time }))
        );

        // Sacred Countdown — region-aware, sect-aware, with per-event mute.
        const [fiqh, savedRegion, prefs, loc] = await Promise.all([
          storage.getFiqhSchool(),
          storage.getCalendarRegion(),
          storage.getSacredCountdownPrefs(),
          storage.getLocation(),
        ]);
        const region =
          savedRegion ??
          (loc ? detectRegionFromCoords(loc.latitude, loc.longitude) : 'global');
        if (!savedRegion) await storage.setCalendarRegion(region);
        if (prefs.enabled) {
          await scheduleSacredCountdownNotifications(
            fiqh,
            region,
            prefs.mutedEventIds,
            language
          );
        }
        await storage.setSacredCountdownPrefs({
          ...prefs,
          lastScheduledAt: todayKey,
        });

        lastScheduledDate.current = todayKey;
      }
    })();
  }, [prayerTimes, today, language]);

  const getStatus = (key: PrayerName, prayerTime: Date): 'prayed' | 'missed' | 'upcoming' => {
    if (todayRecord[key]) return 'prayed';
    const now = new Date();
    if (prayerTime > now) return 'upcoming';
    return 'missed';
  };

  const weekDates = getWeekDates();
  const weekPrayerCounts = weekDates.map((d) => {
    const key = getDateString(d);
    const rec = prayers[key];
    if (!rec) return 0;
    return [rec.fajr, rec.dhuhr, rec.asr, rec.maghrib, rec.isha].filter(Boolean).length;
  });

  if (locationLoading || loading) {
    return (
      <View style={styles.center}>
        <LinearGradient
          colors={['rgba(200, 120, 10, 0.1)', 'transparent']}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <ActivityIndicator size="large" color={theme.colors.accent} />
        <Text style={styles.loadingText}>{t.loadingPrayerTimes}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={false}
          onRefresh={() => loadPrayers()}
          tintColor={theme.colors.accent}
        />
      }
    >
      <LinearGradient
        colors={['rgba(200, 120, 10, 0.07)', 'transparent']}
        style={styles.heroGradient}
        pointerEvents="none"
      />
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>{t.prayerTracker}</Text>
            <Text style={styles.subtitle}>
              {location
                ? `${t.timesForLocation} • ${calculationMethod}`
                : `${t.usingDefault} • ${calculationMethod}`}
            </Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.settingsBtn}
              onPress={() => setSettingsVisible(true)}
            >
              <Text style={styles.settingsIcon}>⚙️</Text>
            </TouchableOpacity>
            <MenuButton />
          </View>
        </View>
      </View>

      <PrayerSettingsModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        calculationMethod={calculationMethod}
        madhab={madhab}
        onSave={async (method, m) => {
          setCalculationMethod(method);
          setMadhab(m);
          await storage.setPrayerSettings({ calculationMethod: method, madhab: m });
        }}
      />

      <View style={styles.weekCard}>
        <Text style={styles.weekLabel}>{t.thisWeek}</Text>
        <View style={styles.weekDots}>
          {t.weekDays.map((day, i) => (
            <View key={day} style={styles.dayCol}>
              <View
                style={[
                  styles.dot,
                  weekPrayerCounts[i] >= 5 && styles.dotFull,
                  weekPrayerCounts[i] > 0 && weekPrayerCounts[i] < 5 && styles.dotPartial,
                ]}
              />
              <Text style={styles.dayLabel}>{day}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.prayerList}>
        {prayerTimes.map((p) => (
          <PrayerRow
            key={p.key}
            name={prayerDisplayNames[p.key]}
            prayerKey={p.key}
            time={p.time}
            status={getStatus(p.key, p.time)}
            onPress={() => markPrayer(p.key)}
          />
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>{t.tapToMarkReminders}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.xl,
    paddingTop: theme.spacing.xxl,
    paddingBottom: theme.spacing.xxxl,
  },
  heroGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: theme.spacing.lg,
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontBody,
    fontSize: 15,
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
    paddingRight: theme.spacing.md,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingsBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: {
    fontSize: 22,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: theme.colors.text,
    fontFamily: theme.typography.fontHeadingBold,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: theme.colors.textMuted,
    marginTop: 6,
    fontFamily: theme.typography.fontBody,
  },
  weekCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#7A5A40',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
    }),
  },
  weekLabel: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.md,
    fontFamily: theme.typography.fontBodyMedium,
  },
  weekDots: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCol: {
    alignItems: 'center',
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: theme.colors.border,
    marginBottom: 6,
  },
  dotPartial: {
    backgroundColor: theme.colors.accent,
    opacity: 0.6,
  },
  dotFull: {
    backgroundColor: theme.colors.accent,
  },
  dayLabel: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontBody,
  },
  prayerList: {
    marginBottom: theme.spacing.lg,
  },
  footer: {
    padding: theme.spacing.md,
  },
  footerText: {
    fontSize: 13,
    color: theme.colors.textMuted,
    textAlign: 'center',
    fontFamily: theme.typography.fontBody,
  },
});
