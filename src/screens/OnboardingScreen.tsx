import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
  BackHandler,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../constants/theme';
import { useLanguage } from '../contexts/LanguageContext';
import { CALCULATION_METHODS, MADHABS } from '../constants/prayerMethods';
import { storage } from '../services/storage';
import { captureError } from '../services/sentry';
import { ArabicText } from '../components/ui/ArabicText';
import type { CalculationMethodId, MadhabId, FiqhSchool } from '../constants/prayerMethods';

// Default Asr madhab for a calculation method, used until the user picks a
// madhab explicitly. The Karachi method targets Pakistan/Bangladesh/India,
// which are overwhelmingly Hanafi — pairing it with the old blanket 'Shafi'
// default put Asr ~1h early for exactly the audience the default targets.
function defaultMadhabFor(method: CalculationMethodId): MadhabId {
  return method === 'Karachi' ? 'Hanafi' : 'Shafi';
}

function isKnownMethod(id: string): id is CalculationMethodId {
  return CALCULATION_METHODS.some((m) => m.id === id);
}

function isKnownMadhab(id: string): id is MadhabId {
  return MADHABS.some((m) => m.id === id);
}

type Props = {
  onComplete: () => void;
};

type Step = 'language' | 'school' | 'method' | 'done';

export function OnboardingScreen({ onComplete }: Props) {
  const { language, setLanguage } = useLanguage();
  const [step, setStep] = useState<Step>('language');
  const [selectedSchool, setSelectedSchool] = useState<FiqhSchool>('sunni');
  const [selectedMethod, setSelectedMethod] = useState<CalculationMethodId>('Karachi');
  const [selectedMadhab, setSelectedMadhab] = useState<MadhabId>(defaultMadhabFor('Karachi'));

  const isUrdu = language === 'ur';
  const isArabic = language === 'ar';

  // Once the user explicitly taps a prayer option, the storage hydration
  // below must never overwrite it; once they explicitly pick a madhab or a
  // calculation method, the per-school/per-method defaults stop
  // second-guessing them.
  const touchedRef = useRef(false);
  const madhabTouchedRef = useRef(false);
  const methodTouchedRef = useRef(false);
  // finish() awaits this so Skip/Get Started tapped before the hydration
  // read resolves can never persist the regional defaults over a returning
  // user's saved settings (this screen re-shows exactly when storage is
  // slow, which is also when the race is most likely).
  const hydrationPromiseRef = useRef<Promise<void> | null>(null);
  // Latest selections, kept in lockstep with the state via the apply*
  // helpers below. finish() reads these after awaiting hydration — its
  // render closure may predate the hydration setStates, so reading the
  // state variables there would persist stale defaults.
  const selectionRef = useRef<{
    school: FiqhSchool;
    method: CalculationMethodId;
    madhab: MadhabId;
  }>({ school: 'sunni', method: 'Karachi', madhab: defaultMadhabFor('Karachi') });

  const applySchool = (school: FiqhSchool) => {
    selectionRef.current.school = school;
    setSelectedSchool(school);
  };
  const applyMethod = (method: CalculationMethodId) => {
    selectionRef.current.method = method;
    setSelectedMethod(method);
  };
  const applyMadhab = (madhab: MadhabId) => {
    selectionRef.current.madhab = madhab;
    setSelectedMadhab(madhab);
  };

  // This screen can re-show for users who already completed onboarding
  // (slow/failed onboarding-flag read in App.tsx). finish() — including the
  // Skip path — writes the on-screen selections to storage, so seed them
  // from any previously saved settings; otherwise a re-onboard silently
  // resets the user's calculation method, madhab, and fiqh school.
  useEffect(() => {
    let mounted = true;
    hydrationPromiseRef.current = (async () => {
      const [settings, school] = await Promise.all([
        storage.getPrayerSettings(),
        storage.getFiqhSchool(),
      ]);
      if (!mounted || touchedRef.current) return;
      if (settings) {
        if (isKnownMethod(settings.calculationMethod)) {
          applyMethod(settings.calculationMethod);
          // Stored method is an earlier explicit/derived choice — preserve it.
          methodTouchedRef.current = true;
        }
        if (isKnownMadhab(settings.madhab)) {
          applyMadhab(settings.madhab);
          // Stored madhab is an earlier explicit/derived choice — preserve it.
          madhabTouchedRef.current = true;
        }
      }
      const storedSchool = settings?.fiqhSchool ?? school;
      if (storedSchool) applySchool(storedSchool);
    })().catch(() => {
      // Best-effort hydration; keep the regional defaults on a failed read.
    });
    return () => { mounted = false; };
  }, []);

  const selectSchool = (school: FiqhSchool) => {
    touchedRef.current = true;
    applySchool(school);
    if (school === 'shia') {
      applyMethod('Jafari');
      applyMadhab('Shafi');
    } else if (selectionRef.current.method === 'Jafari' || !methodTouchedRef.current) {
      // Only fall back to the regional default when switching away from Shia
      // (Jafari is invalid for Sunni) or when no explicit/saved method
      // exists — re-tapping the already-selected Sunni card must not
      // silently reset a chosen method (e.g. ISNA) to Karachi.
      applyMethod('Karachi');
      if (!madhabTouchedRef.current) applyMadhab(defaultMadhabFor('Karachi'));
    }
  };

  const selectMethod = (method: CalculationMethodId) => {
    touchedRef.current = true;
    methodTouchedRef.current = true;
    applyMethod(method);
    if (!madhabTouchedRef.current) applyMadhab(defaultMadhabFor(method));
  };

  const selectMadhab = (madhab: MadhabId) => {
    touchedRef.current = true;
    madhabTouchedRef.current = true;
    applyMadhab(madhab);
  };

  // Hardware back on Android should step backwards through the flow, not
  // exit the app and lose the user's progress.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (step === 'language') return false; // let the OS handle (exit)
      if (step === 'school') { setStep('language'); return true; }
      if (step === 'method') { setStep('school'); return true; }
      return false;
    });
    return () => sub.remove();
  }, [step]);

  // Debounce a second tap during the storage writes so we don't double-fire
  // setLanguage + setFiqhSchool + setPrayerSettings on slow Android devices
  // where three sequential AsyncStorage writes can take ~1s.
  const finishingRef = useRef(false);
  const finish = async () => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    try {
      // A returning user can hit Skip before the seed-from-storage read
      // resolves; wait for it so we never write regional defaults over
      // saved settings. Resolves immediately once hydration has settled
      // (it never rejects — failures are caught in the effect).
      await hydrationPromiseRef.current;
      const { school, method, madhab } = selectionRef.current;
      await setLanguage(language);
      await storage.setFiqhSchool(school);
      await storage.setPrayerSettings({
        calculationMethod: method,
        madhab,
        fiqhSchool: school,
      });
    } catch (e) {
      // Storage may fail (full disk, corrupted SQLite). Still advance the
      // user out of onboarding rather than trapping them — next launch will
      // re-show the flow if nothing got persisted. Report it so repeated
      // re-onboarding in the wild is visible.
      captureError(e, { scope: 'onboarding-finish' });
    } finally {
      onComplete();
    }
  };

  if (step === 'language') {
    return (
      <SafeAreaView edges={['bottom']} style={styles.container}>
        <LinearGradient
          colors={['rgba(200, 120, 10, 0.12)', 'rgba(26, 122, 60, 0.06)', 'transparent']}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={styles.center}>
          <Text style={styles.appName}>Noor</Text>
          <ArabicText style={styles.appTagline}>بِسْمِ اللَّهِ الرَّحْمٰنِ الرَّحِيْمِ</ArabicText>
          <Text style={styles.stepTitle}>Choose your language{'\n'}اپنی زبان منتخب کریں</Text>

          <TouchableOpacity
            style={[styles.langCard, language === 'en' && styles.langCardActive]}
            onPress={() => setLanguage('en')}
          >
            <Text style={styles.langCardIcon}>🇬🇧</Text>
            <View>
              <Text style={styles.langCardTitle}>English</Text>
              <Text style={styles.langCardSub}>International</Text>
            </View>
            {language === 'en' && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.langCard, language === 'ur' && styles.langCardActive]}
            onPress={() => setLanguage('ur')}
          >
            <Text style={styles.langCardIcon}>🇵🇰</Text>
            <View>
              <Text style={styles.langCardTitle}>اردو</Text>
              <Text style={styles.langCardSub}>Urdu — Pakistan / India</Text>
            </View>
            {language === 'ur' && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.langCard, language === 'ar' && styles.langCardActive]}
            onPress={() => setLanguage('ar')}
          >
            <Text style={styles.langCardIcon}>🇸🇦</Text>
            <View>
              <Text style={styles.langCardTitle}>العربية</Text>
              <Text style={styles.langCardSub}>Arabic</Text>
            </View>
            {language === 'ar' && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.fixedBottom}>
          <TouchableOpacity style={styles.nextBtn} onPress={() => setStep('school')}>
            <Text style={styles.nextBtnText}>
              {isUrdu ? 'آگے بڑھیں ←' : isArabic ? 'متابعة ←' : 'Continue →'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (step === 'school') {
    return (
      <SafeAreaView edges={['bottom']} style={styles.container}>
        <LinearGradient
          colors={['rgba(26, 122, 60, 0.10)', 'rgba(200, 120, 10, 0.06)', 'transparent']}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={styles.center}>
          <Text style={styles.stepNum}>{isUrdu ? 'مرحلہ ۱ از ۲' : isArabic ? 'الخطوة ١ من ٢' : 'Step 1 of 2'}</Text>
          <Text style={styles.stepTitle}>
            {isUrdu ? 'اپنا مسلک منتخب کریں' : isArabic ? 'اختر المذهب' : 'Your School of Thought'}
          </Text>
          <Text style={[styles.langCardSub, { textAlign: 'center', marginBottom: 28, color: '#888' }]}>
            {isUrdu
              ? 'نماز کے اوقات اسی کے مطابق ترتیب دیے جائیں گے۔ بعد میں تبدیل کیا جا سکتا ہے۔'
              : isArabic
              ? 'سيتم حساب أوقات الصلاة بناء على اختيارك. يمكنك تغييره لاحقا.'
              : 'Prayer times will be calculated accordingly. Can be changed later.'}
          </Text>

          <TouchableOpacity
            style={[styles.langCard, selectedSchool === 'sunni' && styles.langCardActive]}
            onPress={() => selectSchool('sunni')}
          >
            <Text style={styles.langCardIcon}>☽</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.langCardTitle}>
                {isUrdu ? 'سنی' : isArabic ? 'سني' : 'Sunni'}
              </Text>
              <Text style={styles.langCardSub}>
                {isUrdu
                  ? 'حنفی، شافعی، مالکی، حنبلی'
                  : isArabic
                  ? 'حنفي · شافعي · مالكي · حنبلي'
                  : 'Hanafi · Shafi\'i · Maliki · Hanbali'}
              </Text>
            </View>
            {selectedSchool === 'sunni' && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.langCard, selectedSchool === 'shia' && styles.langCardActive]}
            onPress={() => selectSchool('shia')}
          >
            <Text style={styles.langCardIcon}>🌙</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.langCardTitle}>
                {isUrdu ? 'شیعہ' : isArabic ? 'شيعي' : 'Shia'}
              </Text>
              <Text style={styles.langCardSub}>
                {isUrdu
                  ? 'جعفری / اثنا عشری — اوقات نماز: لیوا ریسرچ انسٹیٹیوٹ، قم'
                  : isArabic
                  ? 'جعفري / اثنا عشري — معهد ليفا للأبحاث، قم'
                  : 'Jafari / Ithna-Ashari — Leva Research Institute, Qum'}
              </Text>
            </View>
            {selectedSchool === 'shia' && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.fixedBottom}>
          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep('language')}>
              <Text style={styles.backBtnText}>{isUrdu ? '← واپس' : isArabic ? '← رجوع' : '← Back'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.nextBtn, { flex: 2 }]} onPress={() => setStep('method')}>
              <Text style={styles.nextBtnText}>{isUrdu ? 'آگے بڑھیں →' : isArabic ? 'متابعة →' : 'Continue →'}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.skipLink} onPress={finish}>
            <Text style={styles.skipLinkText}>
              {isUrdu ? 'بعد میں منتخب کروں گا — ابھی چھوڑیں' : isArabic ? 'سأختار لاحقاً — تخطّى' : 'Skip — choose later'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (step === 'method') {
    return (
      <SafeAreaView edges={['bottom']} style={styles.container}>
        <LinearGradient
          colors={['rgba(200, 120, 10, 0.1)', 'transparent']}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.stepNum}>{isUrdu ? 'مرحلہ ۲ از ۲' : isArabic ? 'الخطوة ٢ من ٢' : 'Step 2 of 2'}</Text>
          <Text style={styles.stepTitle}>
            {isUrdu ? 'نماز کا طریقہ منتخب کریں' : isArabic ? 'اختر طريقة الصلاة' : 'Select Prayer Method'}
          </Text>
          <Text style={styles.stepSubtitle}>
            {isUrdu
              ? 'اپنے علاقے کا طریقہ منتخب کریں — بعد میں بھی تبدیل کیا جا سکتا ہے'
              : isArabic
              ? 'اختر الطريقة المستخدمة في بلدك — يمكنك تغييرها لاحقا'
              : 'Choose the method used in your country — can be changed later'}
          </Text>

          <Text style={styles.sectionLabel}>
            {isUrdu ? 'حساب کتاب کا طریقہ' : isArabic ? 'طريقة الحساب' : 'Calculation Method'}
          </Text>
          {CALCULATION_METHODS
            .filter((m) => selectedSchool === 'shia' ? m.id === 'Jafari' : m.id !== 'Jafari')
            .map((m) => (
              <TouchableOpacity
                key={m.id}
                style={[styles.optionCard, selectedMethod === m.id && styles.optionCardActive]}
                onPress={() => selectMethod(m.id)}
              >
                <View style={styles.optionLeft}>
                  <Text style={styles.optionLabel}>{m.label}</Text>
                  <Text style={styles.optionRegion}>{m.region}</Text>
                </View>
                {selectedMethod === m.id && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}

          {selectedSchool === 'sunni' && (
            <>
              <Text style={[styles.sectionLabel, { marginTop: theme.spacing.xl }]}>
                {isUrdu ? 'عصر کا طریقہ (مذہب)' : isArabic ? 'حساب العصر (المذهب)' : 'Asr Calculation (Madhab)'}
              </Text>
              <Text style={styles.stepSubtitle}>
                {isUrdu ? 'عصر کے وقت پر اثر ڈالتا ہے' : isArabic ? 'يؤثر فقط على وقت صلاة العصر' : 'This affects only the Asr prayer time'}
              </Text>
              {MADHABS.map((m) => (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.optionCard, selectedMadhab === m.id && styles.optionCardActive]}
                  onPress={() => selectMadhab(m.id)}
                >
                  <View style={styles.optionLeft}>
                    <Text style={styles.optionLabel}>{m.label}</Text>
                    <Text style={styles.optionRegion}>{m.region}</Text>
                  </View>
                  {selectedMadhab === m.id && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              ))}
            </>
          )}
        </ScrollView>

        <View style={styles.fixedBottom}>
          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep('school')}>
              <Text style={styles.backBtnText}>{isUrdu ? '← واپس' : isArabic ? '← رجوع' : '← Back'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.nextBtn, { flex: 2 }]} onPress={finish}>
              <Text style={styles.nextBtnText}>
                {isUrdu ? 'شروع کریں ✦' : isArabic ? 'ابدأ الآن ✦' : 'Get Started ✦'}
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.skipLink} onPress={finish}>
            <Text style={styles.skipLinkText}>
              {isUrdu ? 'بعد میں منتخب کروں گا — ابھی چھوڑیں' : isArabic ? 'سأختار لاحقاً — تخطّى' : 'Skip — choose later'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  fixedBottom: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  scrollContent: {
    padding: theme.spacing.xl,
    paddingTop: 64,
    paddingBottom: theme.spacing.xxxl,
  },
  appName: {
    fontSize: 42,
    fontWeight: '700',
    color: theme.colors.accent,
    fontFamily: theme.typography.fontHeadingBold,
    letterSpacing: -1,
    marginBottom: 4,
  },
  appTagline: {
    fontSize: 18,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.xxxl,
    fontFamily: theme.typography.fontQuranUthmani,
    textAlign: 'center',
  },
  stepNum: {
    fontSize: 13,
    color: theme.colors.accent,
    fontFamily: theme.typography.fontBodyMedium,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
    fontFamily: theme.typography.fontHeadingBold,
    textAlign: 'center',
    marginBottom: theme.spacing.xxl,
    lineHeight: 34,
  },
  stepSubtitle: {
    fontSize: 13,
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontBody,
    marginBottom: theme.spacing.lg,
    lineHeight: 20,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
    fontFamily: theme.typography.fontBodyBold,
    marginBottom: theme.spacing.sm,
  },
  langCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg,
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...Platform.select({
      ios: { shadowColor: '#7A5A40', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },
  langCardActive: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.surface,
  },
  langCardIcon: {
    fontSize: 32,
  },
  langCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    fontFamily: theme.typography.fontBodyBold,
  },
  langCardSub: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontBody,
    marginTop: 2,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...Platform.select({
      ios: { shadowColor: '#7A5A40', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  optionCardActive: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.surface,
  },
  optionLeft: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
    fontFamily: theme.typography.fontBodyBold,
  },
  optionRegion: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
    fontFamily: theme.typography.fontBody,
  },
  checkmark: {
    fontSize: 18,
    color: theme.colors.accent,
    fontWeight: '700',
  },
  btnRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  backBtn: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    fontSize: 15,
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontBodyBold,
  },
  nextBtn: {
    minHeight: 52,
    paddingVertical: 14,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: theme.colors.accent, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  nextBtnText: {
    fontSize: 15,
    color: '#fff',
    fontFamily: theme.typography.fontBodyBold,
  },
  skipLink: {
    alignSelf: 'center',
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xs,
  },
  skipLinkText: {
    fontSize: 13,
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontBodyMedium,
    textDecorationLine: 'underline',
  },
});
