import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../constants/theme';
import { useLanguage } from '../contexts/LanguageContext';
import { CALCULATION_METHODS, MADHABS } from '../constants/prayerMethods';
import { storage } from '../services/storage';
import type { CalculationMethodId, MadhabId, FiqhSchool } from '../constants/prayerMethods';

type Props = {
  onComplete: () => void;
};

type Step = 'language' | 'school' | 'method' | 'done';

export function OnboardingScreen({ onComplete }: Props) {
  const { language, setLanguage } = useLanguage();
  const [step, setStep] = useState<Step>('language');
  const [selectedSchool, setSelectedSchool] = useState<FiqhSchool>('sunni');
  const [selectedMethod, setSelectedMethod] = useState<CalculationMethodId>('Karachi');
  const [selectedMadhab, setSelectedMadhab] = useState<MadhabId>('Shafi');

  const isUrdu = language === 'ur';

  const selectSchool = (school: FiqhSchool) => {
    setSelectedSchool(school);
    if (school === 'shia') {
      setSelectedMethod('Jafari');
      setSelectedMadhab('Shafi');
    } else {
      setSelectedMethod('Karachi');
    }
  };

  const finish = async () => {
    await storage.setFiqhSchool(selectedSchool);
    await storage.setPrayerSettings({
      calculationMethod: selectedMethod,
      madhab: selectedMadhab,
      fiqhSchool: selectedSchool,
    });
    onComplete();
  };

  /* ── Step 1: Language ── */
  if (step === 'language') {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['rgba(200, 120, 10, 0.12)', 'rgba(26, 122, 60, 0.06)', 'transparent']}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        {/* Content centered in remaining space above the fixed button */}
        <View style={styles.center}>
          <Text style={styles.appName}>Noor</Text>
          <Text style={styles.appTagline}>بِسْمِ اللَّهِ الرَّحْمٰنِ الرَّحِيْمِ</Text>
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
        </View>

        {/* Fixed absolute button at bottom — always visible without scrolling */}
        <View style={styles.fixedBottom}>
          <TouchableOpacity style={styles.nextBtn} onPress={() => setStep('school')}>
            <Text style={styles.nextBtnText}>
              {isUrdu ? 'آگے بڑھیں ←' : 'Continue →'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  /* ── Step 1.5: School of Thought (Sunni / Shia) ── */
  if (step === 'school') {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['rgba(26, 122, 60, 0.10)', 'rgba(200, 120, 10, 0.06)', 'transparent']}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={styles.center}>
          <Text style={styles.stepNum}>{isUrdu ? 'مرحلہ ۱ از ۲' : 'Step 1 of 2'}</Text>
          <Text style={styles.stepTitle}>
            {isUrdu ? 'اپنا مسلک منتخب کریں' : 'Your School of Thought'}
          </Text>
          <Text style={[styles.langCardSub, { textAlign: 'center', marginBottom: 28, color: '#888' }]}>
            {isUrdu
              ? 'نماز کے اوقات اسی کے مطابق ترتیب دیے جائیں گے۔ بعد میں تبدیل کیا جا سکتا ہے۔'
              : 'Prayer times will be calculated accordingly. Can be changed later.'}
          </Text>

          {/* Sunni card */}
          <TouchableOpacity
            style={[styles.langCard, selectedSchool === 'sunni' && styles.langCardActive]}
            onPress={() => selectSchool('sunni')}
          >
            <Text style={styles.langCardIcon}>☽</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.langCardTitle}>
                {isUrdu ? 'سنی' : 'Sunni'}
              </Text>
              <Text style={styles.langCardSub}>
                {isUrdu
                  ? 'حنفی، شافعی، مالکی، حنبلی'
                  : 'Hanafi · Shafi\'i · Maliki · Hanbali'}
              </Text>
            </View>
            {selectedSchool === 'sunni' && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>

          {/* Shia card */}
          <TouchableOpacity
            style={[styles.langCard, selectedSchool === 'shia' && styles.langCardActive]}
            onPress={() => selectSchool('shia')}
          >
            <Text style={styles.langCardIcon}>🌙</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.langCardTitle}>
                {isUrdu ? 'شیعہ' : 'Shia'}
              </Text>
              <Text style={styles.langCardSub}>
                {isUrdu
                  ? 'جعفری / اثنا عشری — اوقات نماز: لیوا ریسرچ انسٹیٹیوٹ، قم'
                  : 'Jafari / Ithna-Ashari — Leva Research Institute, Qum'}
              </Text>
            </View>
            {selectedSchool === 'shia' && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.fixedBottom}>
          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep('language')}>
              <Text style={styles.backBtnText}>{isUrdu ? '← واپس' : '← Back'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.nextBtn, { flex: 2 }]} onPress={() => setStep('method')}>
              <Text style={styles.nextBtnText}>{isUrdu ? 'آگے بڑھیں →' : 'Continue →'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  /* ── Step 2: Prayer Method ── */
  if (step === 'method') {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['rgba(200, 120, 10, 0.1)', 'transparent']}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        {/* Scrollable options list — ends before fixed buttons */}
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 110 }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.stepNum}>{isUrdu ? 'مرحلہ ۲ از ۲' : 'Step 2 of 2'}</Text>
          <Text style={styles.stepTitle}>
            {isUrdu ? 'نماز کا طریقہ منتخب کریں' : 'Select Prayer Method'}
          </Text>
          <Text style={styles.stepSubtitle}>
            {isUrdu
              ? 'اپنے علاقے کا طریقہ منتخب کریں — بعد میں بھی تبدیل کیا جا سکتا ہے'
              : 'Choose the method used in your country — can be changed later'}
          </Text>

          <Text style={styles.sectionLabel}>
            {isUrdu ? 'حساب کتاب کا طریقہ' : 'Calculation Method'}
          </Text>
          {CALCULATION_METHODS
            .filter((m) => selectedSchool === 'shia' ? m.id === 'Jafari' : m.id !== 'Jafari')
            .map((m) => (
              <TouchableOpacity
                key={m.id}
                style={[styles.optionCard, selectedMethod === m.id && styles.optionCardActive]}
                onPress={() => setSelectedMethod(m.id)}
              >
                <View style={styles.optionLeft}>
                  <Text style={styles.optionLabel}>{m.label}</Text>
                  <Text style={styles.optionRegion}>{m.region}</Text>
                </View>
                {selectedMethod === m.id && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}

          {/* Madhab selector is only relevant for Sunni users */}
          {selectedSchool === 'sunni' && (
            <>
              <Text style={[styles.sectionLabel, { marginTop: theme.spacing.xl }]}>
                {isUrdu ? 'عصر کا طریقہ (مذہب)' : 'Asr Calculation (Madhab)'}
              </Text>
              <Text style={styles.stepSubtitle}>
                {isUrdu ? 'عصر کے وقت پر اثر ڈالتا ہے' : 'This affects only the Asr prayer time'}
              </Text>
              {MADHABS.map((m) => (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.optionCard, selectedMadhab === m.id && styles.optionCardActive]}
                  onPress={() => setSelectedMadhab(m.id)}
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

        {/* Fixed absolute buttons — always visible */}
        <View style={styles.fixedBottom}>
          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep('school')}>
              <Text style={styles.backBtnText}>{isUrdu ? '← واپس' : '← Back'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.nextBtn, { flex: 2 }]} onPress={finish}>
              <Text style={styles.nextBtnText}>
                {isUrdu ? 'شروع کریں ✦' : 'Get Started ✦'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
    paddingBottom: 110, // leave room for the fixed bottom button
  },
  fixedBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
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
    fontFamily: theme.typography.fontBody,
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
    borderWidth: 2,
    borderColor: theme.colors.border,
    ...Platform.select({
      ios: { shadowColor: '#7A5A40', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },
  langCardActive: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accentMuted,
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
    borderWidth: 2,
    borderColor: 'transparent',
    ...Platform.select({
      ios: { shadowColor: '#7A5A40', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  optionCardActive: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accentMuted,
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
    marginTop: theme.spacing.xl,
  },
  backBtn: {
    flex: 1,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  backBtnText: {
    fontSize: 15,
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontBodyBold,
  },
  nextBtn: {
    flex: 1,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: theme.colors.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
      android: { elevation: 4 },
    }),
  },
  nextBtnText: {
    fontSize: 15,
    color: '#fff',
    fontFamily: theme.typography.fontBodyBold,
  },
});
