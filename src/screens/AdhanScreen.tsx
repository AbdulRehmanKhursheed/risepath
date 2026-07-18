import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  AppState,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../constants/theme';
import { useLanguage } from '../contexts/LanguageContext';
import { useSimpleMode } from '../contexts/SimpleModeContext';
import { storage, AdhanSettings, AdhanPrayerName, DEFAULT_ADHAN_SETTINGS } from '../services/storage';
import {
  AdhanDiagnostics,
  getAdhanDiagnostics,
  isAdhanAvailable,
  openBatteryOptimizationSettings,
  openExactAlarmSettings,
  openOemPowerManagerSettings,
  rebuildAdhanAlarmsFromStorage,
  requestAdhanNotificationPermission,
  sendTestAdhan,
} from '../services/adhanAlarm';
import { AdBanner } from '../components/AdBanner';
import { AD_UNITS } from '../services/ads';

type Locale = 'en' | 'ur' | 'ar';

const PRAYERS: { key: AdhanPrayerName; en: string; ur: string; ar: string; icon: string }[] = [
  { key: 'Fajr', en: 'Fajr', ur: 'فجر', ar: 'الفجر', icon: '🌅' },
  { key: 'Dhuhr', en: 'Dhuhr', ur: 'ظہر', ar: 'الظهر', icon: '☀️' },
  { key: 'Asr', en: 'Asr', ur: 'عصر', ar: 'العصر', icon: '🌤' },
  { key: 'Maghrib', en: 'Maghrib', ur: 'مغرب', ar: 'المغرب', icon: '🌇' },
  { key: 'Isha', en: 'Isha', ur: 'عشاء', ar: 'العشاء', icon: '🌙' },
];

export function AdhanScreen() {
  const { language } = useLanguage();
  const { fs } = useSimpleMode();
  const locale: Locale = (['en', 'ur', 'ar'].includes(language as string) ? language : 'en') as Locale;

  const [settings, setSettings] = useState<AdhanSettings>(DEFAULT_ADHAN_SETTINGS);
  const [available, setAvailable] = useState(true);
  const [diag, setDiag] = useState<AdhanDiagnostics | null>(null);
  const [testState, setTestState] = useState<'idle' | 'armed'>('idle');
  const hydrated = useRef(false);

  const refreshDiagnostics = useCallback(() => {
    getAdhanDiagnostics().then(setDiag).catch(() => {});
  }, []);

  useEffect(() => {
    let mounted = true;
    storage.getAdhanSettings().then((s) => {
      if (mounted) {
        setSettings(s);
        hydrated.current = true;
      }
    }).catch(() => {
      hydrated.current = true;
    });
    isAdhanAvailable().then((ok) => {
      if (mounted) setAvailable(ok);
    }).catch(() => {});
    refreshDiagnostics();
    // Every checklist action bounces through system settings — refresh the
    // statuses whenever the user comes back.
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshDiagnostics();
    });
    return () => {
      mounted = false;
      sub.remove();
    };
  }, [refreshDiagnostics]);

  const persist = useCallback(async (next: AdhanSettings) => {
    setSettings(next);
    try {
      await storage.setAdhanSettings(next);
      await rebuildAdhanAlarmsFromStorage();
    } catch {
      // Settings are saved best-effort; the boot/resume re-arm will retry.
    }
  }, []);

  const L = {
    en: {
      title: 'Azan Alarm',
      subtitle: 'The full azan, out loud, at the exact prayer time — even from silent mode',
      unavailable: 'This feature needs the latest app version. Update Noor to enable the Azan Alarm.',
      prayers: 'PLAY AZAN FOR',
      sound: 'AZAN LENGTH',
      short: 'Short (55s)',
      full: 'Full (3 min)',
      fajrGentle: 'Gentle Fajr azan',
      fajrGentleNote: 'Slow fade-in, softer volume',
      checklist: 'MAKE IT RELIABLE',
      checklistNote:
        'Phone makers aggressively kill background apps — these three switches are why azan apps go silent. Green-check all of them once and your azan will fire.',
      stepNotif: 'Notifications allowed',
      stepExact: 'Alarms & reminders allowed',
      stepBattery: 'Battery optimization off for Noor',
      stepOem: 'Autostart / background permission',
      fix: 'Fix',
      done: '✓',
      test: '🔔 Test azan in 10 seconds',
      testArmed: 'Armed — lock your phone and wait…',
      testNote: 'Locks the full path: exact alarm, wake screen, sound, silent-mode bypass.',
      credit:
        'Azan recording: public-domain (CC0) field recording, Marrakech. More voices and custom azan import are coming.',
    },
    ur: {
      title: 'اذان الارم',
      subtitle: 'عین نماز کے وقت مکمل اذان کی آواز — سائلنٹ موڈ میں بھی',
      unavailable: 'اس فیچر کے لیے ایپ کا تازہ ورژن درکار ہے۔ نور کو اپڈیٹ کریں۔',
      prayers: 'اذان چلائیں',
      sound: 'اذان کی طوالت',
      short: 'مختصر (۵۵ سیکنڈ)',
      full: 'مکمل (۳ منٹ)',
      fajrGentle: 'فجر کی نرم اذان',
      fajrGentleNote: 'آہستہ آغاز، دھیمی آواز',
      checklist: 'اذان کو یقینی بنائیں',
      checklistNote:
        'فون کمپنیاں پس منظر کی ایپس بند کر دیتی ہیں — اسی لیے اذان ایپس خاموش ہو جاتی ہیں۔ یہ تین سیٹنگز ایک بار درست کر لیں۔',
      stepNotif: 'نوٹیفکیشن کی اجازت',
      stepExact: 'الارم اور یاددہانیوں کی اجازت',
      stepBattery: 'نور کے لیے بیٹری آپٹیمائزیشن بند',
      stepOem: 'آٹو اسٹارٹ / پس منظر کی اجازت',
      fix: 'درست کریں',
      done: '✓',
      test: '🔔 ۱۰ سیکنڈ میں اذان ٹیسٹ کریں',
      testArmed: 'تیار — فون لاک کر کے انتظار کریں…',
      testNote: 'پورا راستہ جانچتا ہے: عین وقت، اسکرین جاگنا، آواز، سائلنٹ بائی پاس۔',
      credit: 'اذان کی ریکارڈنگ: پبلک ڈومین (CC0)، مراکش۔ مزید آوازیں جلد آ رہی ہیں۔',
    },
    ar: {
      title: 'منبّه الأذان',
      subtitle: 'الأذان كاملاً بصوت مسموع في وقت الصلاة تماماً — حتى في الوضع الصامت',
      unavailable: 'تحتاج هذه الميزة إلى أحدث إصدار من التطبيق. حدّث نور لتفعيلها.',
      prayers: 'تشغيل الأذان لـ',
      sound: 'مدة الأذان',
      short: 'قصير (٥٥ ثانية)',
      full: 'كامل (٣ دقائق)',
      fajrGentle: 'أذان فجر هادئ',
      fajrGentleNote: 'بداية متدرجة وصوت أخفض',
      checklist: 'اجعله موثوقاً',
      checklistNote:
        'تقتل الشركات المصنّعة تطبيقات الخلفية — لهذا تصمت تطبيقات الأذان. فعّل هذه الإعدادات الثلاثة مرة واحدة.',
      stepNotif: 'الإشعارات مسموحة',
      stepExact: 'المنبهات والتذكيرات مسموحة',
      stepBattery: 'تحسين البطارية متوقف لنور',
      stepOem: 'إذن التشغيل التلقائي / الخلفية',
      fix: 'إصلاح',
      done: '✓',
      test: '🔔 جرّب الأذان بعد ١٠ ثوانٍ',
      testArmed: 'جاهز — اقفل هاتفك وانتظر…',
      testNote: 'يختبر المسار كاملاً: الدقة، إيقاظ الشاشة، الصوت، تجاوز الصامت.',
      credit: 'تسجيل الأذان: ملكية عامة (CC0)، مراكش. أصوات إضافية قريباً.',
    },
  }[locale];

  const prayerLabel = (p: (typeof PRAYERS)[number]) =>
    locale === 'ur' ? p.ur : locale === 'ar' ? p.ar : p.en;

  const togglePrayer = (key: AdhanPrayerName) => {
    persist({ ...settings, enabled: { ...settings.enabled, [key]: !settings.enabled[key] } });
    if (!settings.enabled[key]) requestAdhanNotificationPermission();
  };

  const runTest = async () => {
    const ok = await sendTestAdhan();
    if (ok) {
      setTestState('armed');
      setTimeout(() => setTestState('idle'), 15_000);
    }
  };

  type Step = { label: string; ok: boolean; action: () => void };
  const steps: Step[] = diag
    ? [
        { label: L.stepNotif, ok: diag.notificationsGranted, action: () => requestAdhanNotificationPermission().then(refreshDiagnostics) },
        { label: L.stepExact, ok: diag.exactAlarmGranted, action: () => openExactAlarmSettings() },
        { label: L.stepBattery, ok: !diag.batteryOptimized, action: () => openBatteryOptimizationSettings() },
        ...(diag.hasOemPowerManager
          ? [{ label: L.stepOem, ok: false, action: () => openOemPowerManagerSettings() }]
          : []),
      ]
    : [];

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['rgba(200,120,10,0.18)', 'rgba(26,122,60,0.08)', 'transparent']}
          style={styles.hero}
        >
          <Text style={styles.heroEmoji}>🕌</Text>
          <Text style={[styles.heroTitle, { fontSize: fs(24) }]}>{L.title}</Text>
          <Text style={[styles.heroSub, { fontSize: fs(13) }]}>{L.subtitle}</Text>
        </LinearGradient>

        {!available && (
          <View style={styles.unavailableCard}>
            <Text style={[styles.unavailableText, { fontSize: fs(13) }]}>{L.unavailable}</Text>
          </View>
        )}

        {/* Per-prayer toggles */}
        <Text style={[styles.sectionLabel, { fontSize: fs(11) }]}>{L.prayers}</Text>
        <View style={styles.card}>
          {PRAYERS.map((p, idx) => {
            const on = settings.enabled[p.key];
            return (
              <React.Fragment key={p.key}>
                {idx > 0 && <View style={styles.divider} />}
                <View style={styles.prayerRow}>
                  <Text style={styles.prayerIcon}>{p.icon}</Text>
                  <Text style={[styles.prayerName, { fontSize: fs(15) }]}>{prayerLabel(p)}</Text>
                  <Pressable
                    onPress={() => togglePrayer(p.key)}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    accessibilityRole="switch"
                    accessibilityState={{ checked: on }}
                    accessibilityLabel={prayerLabel(p)}
                    disabled={!available}
                  >
                    <View style={[styles.switch, on && styles.switchOn]}>
                      <View style={[styles.knob, on && styles.knobOn]} />
                    </View>
                  </Pressable>
                </View>
              </React.Fragment>
            );
          })}
        </View>

        {/* Sound options */}
        <Text style={[styles.sectionLabel, { fontSize: fs(11) }]}>{L.sound}</Text>
        <View style={styles.segment}>
          {(['short', 'full'] as const).map((len) => {
            const active = settings.soundLength === len;
            return (
              <TouchableOpacity
                key={len}
                style={[styles.segmentBtn, active && styles.segmentBtnOn]}
                onPress={() => persist({ ...settings, soundLength: len })}
                activeOpacity={0.85}
              >
                <Text style={[styles.segmentText, active && styles.segmentTextOn, { fontSize: fs(13) }]}>
                  {len === 'short' ? L.short : L.full}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <TouchableOpacity
          style={[styles.fajrBtn, settings.fajrGentle && styles.fajrBtnOn]}
          onPress={() => persist({ ...settings, fajrGentle: !settings.fajrGentle })}
          activeOpacity={0.8}
        >
          <Text style={[styles.fajrText, settings.fajrGentle && styles.fajrTextOn, { fontSize: fs(13) }]}>
            {settings.fajrGentle ? '✓ ' : ''}
            {L.fajrGentle}
          </Text>
          <Text style={[styles.fajrNote, { fontSize: fs(10) }]}>{L.fajrGentleNote}</Text>
        </TouchableOpacity>

        {/* Reliability checklist */}
        <Text style={[styles.sectionLabel, { fontSize: fs(11) }]}>{L.checklist}</Text>
        <View style={styles.card}>
          <Text style={[styles.cardNote, { fontSize: fs(11) }]}>{L.checklistNote}</Text>
          {steps.map((s, idx) => (
            <React.Fragment key={s.label}>
              {idx > 0 && <View style={styles.divider} />}
              <View style={styles.stepRow}>
                <Text style={[styles.stepStatus, { fontSize: fs(15) }, s.ok ? styles.stepOk : styles.stepPending]}>
                  {s.ok ? '✅' : '⚠️'}
                </Text>
                <Text style={[styles.stepLabel, { fontSize: fs(13) }]}>{s.label}</Text>
                {!s.ok && (
                  <TouchableOpacity style={styles.fixBtn} onPress={s.action} activeOpacity={0.85}>
                    <Text style={[styles.fixBtnText, { fontSize: fs(12) }]}>{L.fix}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </React.Fragment>
          ))}
        </View>

        {/* Test */}
        <TouchableOpacity
          style={[styles.testBtn, testState === 'armed' && styles.testBtnArmed]}
          onPress={runTest}
          disabled={!available || testState === 'armed'}
          activeOpacity={0.85}
        >
          <Text style={[styles.testBtnText, { fontSize: fs(14) }]}>
            {testState === 'armed' ? L.testArmed : L.test}
          </Text>
        </TouchableOpacity>
        <Text style={[styles.footNote, { fontSize: fs(11) }]}>{L.testNote}</Text>

        <Text style={[styles.credit, { fontSize: fs(10) }]}>{L.credit}</Text>
        <AdBanner unitId={AD_UNITS.bannerPrayer} size="rectangle" />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  content: { paddingBottom: 40 },
  hero: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: theme.spacing.xl,
  },
  heroEmoji: { fontSize: 40, marginBottom: 4 },
  heroTitle: {
    fontFamily: theme.typography.fontHeadingBold,
    color: theme.colors.text,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  heroSub: {
    fontFamily: theme.typography.fontBody,
    color: theme.colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  unavailableCard: {
    marginHorizontal: theme.spacing.xl,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.accentMuted,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.accent,
  },
  unavailableText: { fontFamily: theme.typography.fontBodyMedium, color: theme.colors.text },
  sectionLabel: {
    fontFamily: theme.typography.fontBodyBold,
    color: theme.colors.textMuted,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  card: {
    marginHorizontal: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xs,
  },
  divider: { height: 1, backgroundColor: theme.colors.borderSoft },
  prayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  prayerIcon: { fontSize: 20, width: 26, textAlign: 'center' },
  prayerName: { flex: 1, fontFamily: theme.typography.fontBodyMedium, color: theme.colors.text },
  switch: {
    width: 46,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.border,
    padding: 3,
    justifyContent: 'center',
  },
  switchOn: { backgroundColor: theme.colors.accent },
  knob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
  },
  knobOn: { alignSelf: 'flex-end' },
  segment: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginHorizontal: theme.spacing.xl,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
  },
  segmentBtnOn: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accentMuted,
    borderWidth: 2,
  },
  segmentText: { fontFamily: theme.typography.fontBodyMedium, color: theme.colors.textSecondary },
  segmentTextOn: { color: theme.colors.accent, fontFamily: theme.typography.fontBodyBold },
  fajrBtn: {
    marginHorizontal: theme.spacing.xl,
    marginTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fajrBtnOn: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accentMuted,
  },
  fajrText: { fontFamily: theme.typography.fontBodyMedium, color: theme.colors.textSecondary },
  fajrTextOn: { color: theme.colors.accent, fontFamily: theme.typography.fontBodyBold },
  fajrNote: { fontFamily: theme.typography.fontBody, color: theme.colors.textMuted },
  cardNote: {
    fontFamily: theme.typography.fontBody,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
    paddingVertical: theme.spacing.md,
    lineHeight: 16,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  stepStatus: { width: 26, textAlign: 'center' },
  stepOk: {},
  stepPending: {},
  stepLabel: { flex: 1, fontFamily: theme.typography.fontBodyMedium, color: theme.colors.text },
  fixBtn: {
    paddingVertical: 7,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.accent,
  },
  fixBtnText: { color: '#fff', fontFamily: theme.typography.fontBodyBold },
  testBtn: {
    marginHorizontal: theme.spacing.xl,
    marginTop: theme.spacing.xl,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
  },
  testBtnArmed: { backgroundColor: theme.colors.success },
  testBtnText: { color: '#fff', fontFamily: theme.typography.fontBodyBold },
  footNote: {
    marginHorizontal: theme.spacing.xl,
    marginTop: theme.spacing.sm,
    fontFamily: theme.typography.fontBody,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 17,
  },
  credit: {
    marginHorizontal: theme.spacing.xl,
    marginTop: theme.spacing.lg,
    fontFamily: theme.typography.fontBody,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 15,
  },
});
