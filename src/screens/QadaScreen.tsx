import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../constants/theme';
import { useLanguage } from '../contexts/LanguageContext';
import { useSimpleMode } from '../contexts/SimpleModeContext';
import { storage } from '../services/storage';
import { AdBanner } from '../components/AdBanner';
import { AD_UNITS } from '../services/ads';
import {
  QADA_PRAYER_KEYS,
  QadaPrayerKey,
  QadaState,
  applyEstimate,
  emptyQadaState,
  estimateMissedDays,
  logQadaPrayed,
  qadaProgress,
  sanitizeQadaState,
  setOwed,
  totalCompleted,
  totalOwed,
  undoQadaPrayed,
} from '../utils/qada';

type Locale = 'en' | 'ur' | 'ar';

const PRAYER_LABELS: Record<QadaPrayerKey, { en: string; ur: string; ar: string; icon: string }> = {
  fajr: { en: 'Fajr', ur: 'فجر', ar: 'الفجر', icon: '🌅' },
  dhuhr: { en: 'Dhuhr', ur: 'ظہر', ar: 'الظهر', icon: '☀️' },
  asr: { en: 'Asr', ur: 'عصر', ar: 'العصر', icon: '🌤' },
  maghrib: { en: 'Maghrib', ur: 'مغرب', ar: 'المغرب', icon: '🌇' },
  isha: { en: 'Isha', ur: 'عشاء', ar: 'العشاء', icon: '🌙' },
  witr: { en: 'Witr', ur: 'وتر', ar: 'الوتر', icon: '⭐' },
};

export function QadaScreen() {
  const { language } = useLanguage();
  const { fs } = useSimpleMode();
  const locale: Locale = (['en', 'ur', 'ar'].includes(language as string) ? language : 'en') as Locale;
  const isUrdu = locale === 'ur';
  const isArabic = locale === 'ar';

  const [state, setState] = useState<QadaState>(() => emptyQadaState(Date.now(), false));
  const [years, setYears] = useState('');
  const [months, setMonths] = useState('');
  const hydrated = useRef(false);

  // Hydrate; default the Witr toggle from the stored madhab on first use
  // (wajib per Hanafi, so Hanafi users get it on by default).
  useEffect(() => {
    let mounted = true;
    (async () => {
      const [raw, settings] = await Promise.all([
        storage.getQadaStateRaw(),
        storage.getPrayerSettings(),
      ]);
      if (!mounted) return;
      if (raw) {
        setState(sanitizeQadaState(raw, Date.now()));
      } else {
        setState(emptyQadaState(Date.now(), settings?.madhab === 'Hanafi'));
      }
      hydrated.current = true;
    })().catch(() => {
      hydrated.current = true;
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Persist on every change after hydration. Counter taps are discrete events,
  // so no debounce — losing a logged prayer to a crash would be worse than the
  // extra writes.
  useEffect(() => {
    if (!hydrated.current) return;
    storage.setQadaState(state).catch(() => {});
  }, [state]);

  const L = {
    en: {
      title: 'Qada Tracker',
      subtitle: 'Make up missed prayers, one by one — and watch the debt shrink',
      estimate: 'ESTIMATE YOUR MISSED PRAYERS',
      years: 'Years',
      months: 'Months',
      estimateBtn: 'Estimate',
      estimateNote:
        'Enter roughly how long you missed prayers for. One of each prayer is counted per day — then adjust any count below.',
      overwriteTitle: 'Replace current counts?',
      overwriteBody: 'This replaces your remaining counts with the new estimate. Prayers you already made up stay counted.',
      overwriteOk: 'Replace',
      cancel: 'Cancel',
      remaining: 'PRAYERS TO MAKE UP',
      prayedBtn: '✓ Prayed',
      witrToggle: 'Include Witr',
      witrNote: 'Wajib in the Hanafi school',
      progress: 'YOUR PROGRESS',
      madeUp: 'Made up so far',
      left: 'Remaining',
      allDone: 'No qada prayers remaining. Alhamdulillah!',
      undoHint: 'Tip: long-press ✓ Prayed to undo a mistaken tap. Counts are editable — tap any number.',
      disclaimer:
        'This is a personal estimate and tracker, not a ruling. Schools differ on how qada is calculated and prioritised — consult a trusted scholar about your situation.',
    },
    ur: {
      title: 'قضا نمازیں',
      subtitle: 'چھوٹی ہوئی نمازیں ایک ایک کر کے ادا کریں — اور بوجھ کم ہوتا دیکھیں',
      estimate: 'اپنی قضا نمازوں کا اندازہ',
      years: 'سال',
      months: 'مہینے',
      estimateBtn: 'اندازہ لگائیں',
      estimateNote:
        'اندازاً کتنا عرصہ نمازیں چھوٹیں، درج کریں۔ ہر دن کی ہر نماز شمار ہوتی ہے — پھر نیچے کوئی بھی تعداد درست کر لیں۔',
      overwriteTitle: 'موجودہ تعداد بدلیں؟',
      overwriteBody: 'اس سے باقی تعداد نئے اندازے سے بدل جائے گی۔ جو نمازیں ادا کر چکے ہیں وہ محفوظ رہیں گی۔',
      overwriteOk: 'بدل دیں',
      cancel: 'منسوخ',
      remaining: 'ادا کرنی باقی نمازیں',
      prayedBtn: '✓ ادا کی',
      witrToggle: 'وتر شامل کریں',
      witrNote: 'حنفی مسلک میں واجب',
      progress: 'آپ کی پیش رفت',
      madeUp: 'اب تک ادا کیں',
      left: 'باقی',
      allDone: 'کوئی قضا نماز باقی نہیں۔ الحمد للہ!',
      undoHint: 'نوٹ: غلط ٹیپ واپس لینے کے لیے ✓ کو دیر تک دبائیں۔ کوئی بھی نمبر ٹیپ کر کے بدل سکتے ہیں۔',
      disclaimer:
        'یہ ذاتی اندازہ اور ٹریکر ہے، شرعی حکم نہیں۔ قضا کے حساب میں مسالک مختلف ہیں — اپنے معاملے کے لیے معتبر عالم سے رجوع کریں۔',
    },
    ar: {
      title: 'قضاء الصلوات',
      subtitle: 'اقضِ ما فاتك صلاةً صلاةً — وشاهد الدين يتناقص',
      estimate: 'قدّر صلواتك الفائتة',
      years: 'سنوات',
      months: 'أشهر',
      estimateBtn: 'احسب التقدير',
      estimateNote:
        'أدخل المدة التقريبية التي فاتتك فيها الصلاة. تُحسب كل صلاة عن كل يوم — ثم عدّل أي عدد أدناه.',
      overwriteTitle: 'استبدال الأعداد الحالية؟',
      overwriteBody: 'سيستبدل هذا الأعداد المتبقية بالتقدير الجديد. ما قضيته يبقى محسوباً.',
      overwriteOk: 'استبدال',
      cancel: 'إلغاء',
      remaining: 'الصلوات المتبقية للقضاء',
      prayedBtn: '✓ قضيتها',
      witrToggle: 'إدراج الوتر',
      witrNote: 'واجب عند الحنفية',
      progress: 'تقدمك',
      madeUp: 'قضيت حتى الآن',
      left: 'المتبقي',
      allDone: 'لا صلوات قضاء متبقية. الحمد لله!',
      undoHint: 'ملاحظة: اضغط مطولاً على ✓ للتراجع عن ضغطة خاطئة. الأعداد قابلة للتعديل — انقر أي رقم.',
      disclaimer:
        'هذه أداة تقدير ومتابعة شخصية، لا فتوى. تختلف المذاهب في حساب القضاء وترتيبه — راجع عالماً موثوقاً في حالتك.',
    },
  }[locale];

  const prayerName = (k: QadaPrayerKey) => PRAYER_LABELS[k][locale];
  const visibleKeys = QADA_PRAYER_KEYS.filter((k) => k !== 'witr' || state.includeWitr);

  const owedTotal = totalOwed(state);
  const doneTotal = totalCompleted(state);
  const progress = qadaProgress(state);

  const runEstimate = () => {
    const days = estimateMissedDays(years, months);
    if (days <= 0) return;
    const apply = () => setState((s) => applyEstimate(s, days, Date.now()));
    if (owedTotal > 0) {
      Alert.alert(L.overwriteTitle, L.overwriteBody, [
        { text: L.cancel, style: 'cancel' },
        { text: L.overwriteOk, style: 'destructive', onPress: apply },
      ]);
    } else {
      apply();
    }
  };

  const fmt = (n: number) => n.toLocaleString('en-US');

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <LinearGradient
          colors={['rgba(26,122,60,0.16)', 'rgba(200,120,10,0.10)', 'transparent']}
          style={styles.hero}
        >
          <Text style={styles.heroEmoji}>⏳</Text>
          <Text style={[styles.heroTitle, { fontSize: fs(24) }]}>{L.title}</Text>
          <Text style={[styles.heroSub, { fontSize: fs(13) }]}>{L.subtitle}</Text>
        </LinearGradient>

        {/* Estimator */}
        <Text style={[styles.sectionLabel, { fontSize: fs(11) }]}>{L.estimate}</Text>
        <View style={styles.card}>
          <View style={styles.estimateRow}>
            <View style={styles.estimateField}>
              <Text style={[styles.inputLabel, { fontSize: fs(12) }]}>{L.years}</Text>
              <TextInput
                style={[styles.numInput, { fontSize: fs(16) }]}
                value={years}
                onChangeText={setYears}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={theme.colors.textMuted}
                maxLength={2}
              />
            </View>
            <View style={styles.estimateField}>
              <Text style={[styles.inputLabel, { fontSize: fs(12) }]}>{L.months}</Text>
              <TextInput
                style={[styles.numInput, { fontSize: fs(16) }]}
                value={months}
                onChangeText={setMonths}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={theme.colors.textMuted}
                maxLength={2}
              />
            </View>
            <TouchableOpacity style={styles.estimateBtn} onPress={runEstimate} activeOpacity={0.85}>
              <Text style={[styles.estimateBtnText, { fontSize: fs(13) }]}>{L.estimateBtn}</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.cardNote, { fontSize: fs(11) }]}>{L.estimateNote}</Text>
        </View>

        {/* Witr toggle */}
        <TouchableOpacity
          style={[styles.witrBtn, state.includeWitr && styles.witrBtnOn]}
          onPress={() => setState((s) => ({ ...s, includeWitr: !s.includeWitr, updatedAt: Date.now() }))}
          activeOpacity={0.8}
        >
          <Text style={[styles.witrText, state.includeWitr && styles.witrTextOn, { fontSize: fs(13) }]}>
            {state.includeWitr ? '✓ ' : ''}
            {L.witrToggle}
          </Text>
          <Text style={[styles.witrNote, { fontSize: fs(10) }]}>{L.witrNote}</Text>
        </TouchableOpacity>

        {/* Per-prayer counters */}
        <Text style={[styles.sectionLabel, { fontSize: fs(11) }]}>{L.remaining}</Text>
        <View style={styles.card}>
          {visibleKeys.map((k, idx) => (
            <React.Fragment key={k}>
              {idx > 0 && <View style={styles.divider} />}
              <View style={styles.prayerRow}>
                <Text style={styles.prayerIcon}>{PRAYER_LABELS[k].icon}</Text>
                <Text style={[styles.prayerName, { fontSize: fs(15) }]}>{prayerName(k)}</Text>
                <TextInput
                  style={[styles.countInput, { fontSize: fs(16) }]}
                  value={String(state.owed[k])}
                  onChangeText={(t) => setState((s) => setOwed(s, k, t, Date.now()))}
                  keyboardType="number-pad"
                  maxLength={6}
                  selectTextOnFocus
                />
                <TouchableOpacity
                  style={[styles.prayedBtn, state.owed[k] <= 0 && styles.prayedBtnDisabled]}
                  onPress={() => setState((s) => logQadaPrayed(s, k, Date.now()))}
                  onLongPress={() => setState((s) => undoQadaPrayed(s, k, Date.now()))}
                  disabled={state.owed[k] <= 0 && state.completed[k] <= 0}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.prayedBtnText, { fontSize: fs(12) }]}>{L.prayedBtn}</Text>
                </TouchableOpacity>
              </View>
            </React.Fragment>
          ))}
        </View>

        {/* Progress */}
        <Text style={[styles.sectionLabel, { fontSize: fs(11) }]}>{L.progress}</Text>
        <View style={[styles.card, styles.progressCard]}>
          {owedTotal === 0 && doneTotal > 0 ? (
            <Text style={[styles.allDone, { fontSize: fs(15) }]}>🎉 {L.allDone}</Text>
          ) : (
            <>
              <View style={styles.progressStats}>
                <View style={styles.statBox}>
                  <Text style={[styles.statValue, { fontSize: fs(22) }]} allowFontScaling={false}>
                    {fmt(doneTotal)}
                  </Text>
                  <Text style={[styles.statLabel, { fontSize: fs(11) }]}>{L.madeUp}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statValue, styles.statValueOwed, { fontSize: fs(22) }]} allowFontScaling={false}>
                    {fmt(owedTotal)}
                  </Text>
                  <Text style={[styles.statLabel, { fontSize: fs(11) }]}>{L.left}</Text>
                </View>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
              </View>
              <Text style={[styles.progressPct, { fontSize: fs(12) }]}>
                {Math.round(progress * 100)}%
              </Text>
            </>
          )}
        </View>

        <Text style={[styles.footNote, { fontSize: fs(11) }]}>{L.undoHint}</Text>
        <Text style={[styles.disclaimer, { fontSize: fs(11) }]}>{L.disclaimer}</Text>
        <AdBanner unitId={AD_UNITS.bannerGuides} size="rectangle" />
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
    paddingVertical: theme.spacing.sm,
  },
  estimateRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  estimateField: { gap: 4 },
  inputLabel: { fontFamily: theme.typography.fontBodyMedium, color: theme.colors.textSecondary },
  numInput: {
    width: 64,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    fontFamily: theme.typography.fontBodyBold,
    color: theme.colors.text,
    textAlign: 'center',
  },
  estimateBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
  },
  estimateBtnText: { color: '#fff', fontFamily: theme.typography.fontBodyBold },
  cardNote: {
    fontFamily: theme.typography.fontBody,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
    paddingVertical: theme.spacing.md,
    lineHeight: 16,
  },
  witrBtn: {
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
  witrBtnOn: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accentMuted,
  },
  witrText: { fontFamily: theme.typography.fontBodyMedium, color: theme.colors.textSecondary },
  witrTextOn: { color: theme.colors.accent, fontFamily: theme.typography.fontBodyBold },
  witrNote: { fontFamily: theme.typography.fontBody, color: theme.colors.textMuted },
  divider: { height: 1, backgroundColor: theme.colors.borderSoft },
  prayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  prayerIcon: { fontSize: 20, width: 26, textAlign: 'center' },
  prayerName: {
    flex: 1,
    fontFamily: theme.typography.fontBodyMedium,
    color: theme.colors.text,
  },
  countInput: {
    minWidth: 64,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    fontFamily: theme.typography.fontBodyBold,
    color: theme.colors.text,
    textAlign: 'center',
  },
  prayedBtn: {
    paddingVertical: 8,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.accent,
  },
  prayedBtnDisabled: { opacity: 0.35 },
  prayedBtnText: { color: '#fff', fontFamily: theme.typography.fontBodyBold },
  progressCard: {
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  progressStats: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    justifyContent: 'space-around',
  },
  statBox: { alignItems: 'center', gap: 2 },
  statValue: {
    fontFamily: theme.typography.fontHeadingBold,
    color: theme.colors.success,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  statValueOwed: { color: theme.colors.text },
  statLabel: {
    fontFamily: theme.typography.fontBodyMedium,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  progressTrack: {
    alignSelf: 'stretch',
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.borderSoft,
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.success,
  },
  progressPct: { fontFamily: theme.typography.fontBodyBold, color: theme.colors.textSecondary },
  allDone: {
    fontFamily: theme.typography.fontBodyBold,
    color: theme.colors.success,
    textAlign: 'center',
    paddingVertical: theme.spacing.md,
  },
  footNote: {
    marginHorizontal: theme.spacing.xl,
    marginTop: theme.spacing.md,
    fontFamily: theme.typography.fontBody,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 17,
  },
  disclaimer: {
    marginHorizontal: theme.spacing.xl,
    marginTop: theme.spacing.lg,
    fontFamily: theme.typography.fontBody,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
    lineHeight: 16,
    textAlign: 'center',
  },
});
