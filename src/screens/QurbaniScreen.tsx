import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../constants/theme';
import { useLanguage } from '../contexts/LanguageContext';
import { useSimpleMode } from '../contexts/SimpleModeContext';
import {
  QURBANI_ANIMALS,
  QURBANI_NIYYAH,
  QURBANI_CONDITIONS,
  QURBANI_DISTRIBUTION,
  AnimalKey,
  QurbaniAnimal,
} from '../constants/qurbani';
import { gregorianToHijri } from '../utils/hijri';
import {
  animalsNeededFor,
  isQurbaniWindow,
  isDontCutWindow,
} from '../utils/qurbani';
import { UPCOMING_EID_DATES } from '../constants/eidGuide';
import { AdBanner } from '../components/AdBanner';
import { AD_UNITS } from '../services/ads';
import { getAnimalIcon, PersonIcon } from '../components/AnimalSvgIcons';

type Locale = 'en' | 'ur' | 'ar';

function nextEidAdha(): Date | null {
  const now = new Date();
  const next = UPCOMING_EID_DATES.find((e) => e.type === 'adha' && e.date > now);
  return next?.date ?? null;
}

function ageLabel(months: number, locale: Locale): string {
  const years = Math.floor(months / 12);
  if (locale === 'ur') {
    if (months < 12) return `کم از کم ${months} ماہ`;
    return `کم از کم ${years} سال`;
  }
  if (locale === 'ar') {
    if (months < 12) return `الحد الأدنى ${months} شهراً`;
    return `الحد الأدنى ${years} سنة`;
  }
  if (months < 12) return `Min. ${months} months`;
  return `Min. ${years} year${years > 1 ? 's' : ''}`;
}

export function QurbaniScreen() {
  const { language } = useLanguage();
  const { fs } = useSimpleMode();
  const navigation = useNavigation();
  const locale: Locale = (['en', 'ur', 'ar'].includes(language as string)
    ? language
    : 'en') as Locale;
  const isUrdu = locale === 'ur';
  const isArabic = locale === 'ar';

  const [selectedKey, setSelectedKey] = useState<AnimalKey>('goat');
  const [people, setPeople] = useState<number>(1);

  const selected: QurbaniAnimal = useMemo(
    () => QURBANI_ANIMALS.find((a) => a.key === selectedKey) ?? QURBANI_ANIMALS[0],
    [selectedKey]
  );

  const animalsNeeded = useMemo(
    () => animalsNeededFor(selected, people),
    [people, selected]
  );

  const hijri = useMemo(() => gregorianToHijri(new Date()), []);
  // Qurbani days are 10–13 Dhul Hijjah (month index 12). The Hijri-conversion
  // util is approximate — we still display the window banner outside it as an
  // informational countdown rather than as a hard gate.
  const inQurbaniWindow = isQurbaniWindow(hijri.month, hijri.day);
  const inDontCutWindow = isDontCutWindow(hijri.month, hijri.day);

  const eidAdha = nextEidAdha();
  const daysUntil = eidAdha
    ? Math.max(
        0,
        Math.round(
          (new Date(eidAdha.getFullYear(), eidAdha.getMonth(), eidAdha.getDate()).getTime() -
            new Date(new Date().setHours(0, 0, 0, 0)).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : null;

  const labels = {
    en: {
      title: 'Qurbani Calculator',
      subtitle: 'Plan your Udhiyah this Eid al-Adha',
      windowOpen: 'Qurbani window is open',
      windowSoon: daysUntil !== null ? `${daysUntil} ${daysUntil === 1 ? 'day' : 'days'} until Eid al-Adha` : '',
      windowClosed: 'Qurbani window has passed',
      pickAnimal: 'CHOOSE ANIMAL',
      sharing: 'How many people are sharing?',
      result: 'You need',
      animalWord: animalsNeeded === 1 ? selected.nameEn.toLowerCase() : selected.nameEn.toLowerCase() + (selected.nameEn.endsWith('o') ? 's' : 's'),
      forPeople: people === 1 ? 'for 1 person' : `for ${people} people`,
      niyyah: 'NIYYAH (At Slaughter)',
      copy: 'Copy',
      copied: 'Copied to clipboard',
      distribution: 'DISTRIBUTION (Recommended)',
      distributionNote: 'Three equal parts is mustahabb, not obligatory.',
      conditions: 'ANIMAL CONDITIONS',
      conditionsNote: 'The animal must be free from major defects.',
      hairNailsTitle: 'Don\'t cut hair or nails',
      hairNailsBody: 'If you intend Qurbani, refrain from cutting hair or trimming nails from 1st Dhul Hijjah until your sacrifice is done.',
      timing: 'TIMING WINDOW',
      timingBody: 'After Eid prayer on 10th Dhul Hijjah → before sunset on 13th Dhul Hijjah. Earliest is best.',
      fullGuide: 'Open full Qurbani section in Eid Guide ›',
      sourceLine: 'Reference: Abu Dawud 2799, Muslim 1318, Al-Hidayah, Al-Mughni',
    },
    ur: {
      title: 'قربانی کیلکولیٹر',
      subtitle: 'اس عیدالاضحی پر اپنی قربانی کی منصوبہ بندی کریں',
      windowOpen: 'قربانی کے دن جاری ہیں',
      windowSoon: daysUntil !== null ? `عیدالاضحی میں ${daysUntil} دن باقی` : '',
      windowClosed: 'قربانی کا وقت گزر چکا ہے',
      pickAnimal: 'جانور منتخب کریں',
      sharing: 'کتنے لوگ شامل ہیں؟',
      result: 'آپ کو چاہیے',
      animalWord: selected.nameUr,
      forPeople: people === 1 ? 'ایک شخص کے لیے' : `${people} افراد کے لیے`,
      niyyah: 'نیت / دعا (ذبح کے وقت)',
      copy: 'کاپی',
      copied: 'کلپ بورڈ پر نقل ہو گیا',
      distribution: 'گوشت کی تقسیم (مستحب)',
      distributionNote: 'تین برابر حصے کرنا مستحب ہے، واجب نہیں۔',
      conditions: 'جانور کی شرائط',
      conditionsNote: 'جانور بڑے عیوب سے پاک ہونا چاہیے۔',
      hairNailsTitle: 'بال اور ناخن نہ کاٹیں',
      hairNailsBody: 'اگر قربانی کا ارادہ ہو تو یکم ذوالحجہ سے قربانی تک بال اور ناخن نہ کاٹیں۔',
      timing: 'قربانی کا وقت',
      timingBody: '۱۰ ذوالحجہ کو نمازِ عید کے بعد سے ۱۳ ذوالحجہ کے غروب تک۔ پہلا دن سب سے بہتر ہے۔',
      fullGuide: 'عید گائیڈ میں مکمل تفصیل پڑھیں ›',
      sourceLine: 'مأخذ: ابو داؤد ۲۷۹۹، مسلم ۱۳۱۸، الہدایہ، المغنی',
    },
    ar: {
      title: 'حاسبة الأضحية',
      subtitle: 'خطط لأضحيتك في عيد الأضحى',
      windowOpen: 'أيام الأضحية قائمة',
      windowSoon: daysUntil !== null ? `${daysUntil} يوم حتى عيد الأضحى` : '',
      windowClosed: 'انتهى وقت الأضحية',
      pickAnimal: 'اختر الحيوان',
      sharing: 'كم عدد المشاركين؟',
      result: 'تحتاج إلى',
      animalWord: selected.nameAr,
      forPeople: people === 1 ? 'لشخص واحد' : `لـ ${people} أشخاص`,
      niyyah: 'النية (عند الذبح)',
      copy: 'نسخ',
      copied: 'تم النسخ',
      distribution: 'توزيع اللحم (مستحب)',
      distributionNote: 'التقسيم إلى ثلاثة أجزاء مستحب وليس واجباً.',
      conditions: 'شروط الحيوان',
      conditionsNote: 'يجب أن يخلو الحيوان من العيوب الكبرى.',
      hairNailsTitle: 'لا تقص الشعر أو الأظافر',
      hairNailsBody: 'من نوى الأضحية فلا يأخذ من شعره وأظافره من غرة ذي الحجة حتى يضحي.',
      timing: 'وقت الأضحية',
      timingBody: 'من بعد صلاة العيد في ١٠ ذي الحجة إلى غروب شمس ١٣ ذي الحجة. الأول أفضل.',
      fullGuide: 'افتح القسم الكامل في دليل العيد ›',
      sourceLine: 'المرجع: أبو داود ٢٧٩٩، مسلم ١٣١٨، الهداية، المغني',
    },
  }[locale];

  const onCopyNiyyah = async () => {
    const text = `${QURBANI_NIYYAH.arabic}\n${QURBANI_NIYYAH.transliteration}\n${
      isUrdu
        ? QURBANI_NIYYAH.translationUr
        : isArabic
        ? QURBANI_NIYYAH.translationAr
        : QURBANI_NIYYAH.translationEn
    }`;
    try {
      await Clipboard.setStringAsync(text);
      Alert.alert('', labels.copied);
    } catch {
      // ignore — copy is a nice-to-have
    }
  };

  const onDecPeople = () => setPeople((n) => Math.max(1, n - 1));
  const onIncPeople = () => {
    const cap = selected.shares === 1 ? 10 : 7;
    setPeople((n) => Math.min(cap, n + 1));
  };

  // Re-clamp when switching to a goat/sheep (max 1) from a 7-share animal.
  // Simple guard, runs on every render but short-circuits when already valid.
  if (selected.shares === 1 && people > 1 && animalsNeeded > 1) {
    // allow many goats — keep people as-is, animalsNeeded reflects count.
  }

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['rgba(26,122,60,0.18)', 'rgba(200,120,10,0.10)', 'transparent']}
          style={styles.hero}
        >
          <View style={styles.heroIconRow}>
            {getAnimalIcon('sheep', { size: 50, color: theme.colors.accent })}
            {getAnimalIcon('cow', { size: 60, color: theme.colors.text, showShares: true })}
            {getAnimalIcon('camel', { size: 50, color: theme.colors.accent })}
          </View>
          <Text style={[styles.heroTitle, { fontSize: fs(24) }]}>{labels.title}</Text>
          <Text style={[styles.heroSub, { fontSize: fs(13) }]}>{labels.subtitle}</Text>
        </LinearGradient>

        {/* Window banner */}
        <View
          style={[
            styles.banner,
            inQurbaniWindow ? styles.bannerActive : styles.bannerSoft,
          ]}
        >
          <Text style={[styles.bannerIcon]}>{inQurbaniWindow ? '✦' : '⏳'}</Text>
          <Text
            style={[
              styles.bannerText,
              { fontSize: fs(13) },
              inQurbaniWindow && styles.bannerTextActive,
            ]}
          >
            {inQurbaniWindow ? labels.windowOpen : labels.windowSoon}
          </Text>
        </View>

        {/* Animal picker */}
        <Text style={[styles.sectionLabel, { fontSize: fs(11) }]}>{labels.pickAnimal}</Text>
        <View style={styles.animalGrid}>
          {QURBANI_ANIMALS.map((a) => {
            const active = a.key === selectedKey;
            const iconColor = active ? theme.colors.accent : theme.colors.textSecondary;
            return (
              <TouchableOpacity
                key={a.key}
                style={[styles.animalTile, active && styles.animalTileActive]}
                onPress={() => {
                  setSelectedKey(a.key);
                  if (a.shares === 1) setPeople(1);
                }}
                activeOpacity={0.85}
              >
                <View style={styles.animalIconWrap}>
                  {getAnimalIcon(a.key, { size: 56, color: iconColor })}
                </View>
                <Text
                  style={[
                    styles.animalName,
                    active && styles.animalNameActive,
                    { fontSize: fs(13) },
                  ]}
                  numberOfLines={1}
                >
                  {isUrdu ? a.nameUr : isArabic ? a.nameAr : a.nameEn}
                </Text>
                <Text
                  style={[
                    styles.animalAge,
                    active && styles.animalAgeActive,
                    { fontSize: fs(10) },
                  ]}
                  numberOfLines={1}
                >
                  {ageLabel(a.minAgeMonths, locale)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Animal hero illustration — large silhouette + share-visualizer for
            multi-share animals. Replaces the static emoji with something
            recognisable enough to convey the calculator at a glance. */}
        <View style={styles.heroAnimal}>
          {getAnimalIcon(selected.key, {
            size: 140,
            color: theme.colors.text,
            showShares: selected.shares === 7,
          })}
          {selected.shares === 7 && (
            <View style={styles.peopleRow}>
              {Array.from({ length: 7 }).map((_, i) => (
                <PersonIcon
                  key={i}
                  size={26}
                  filled={i < people}
                  fillColor={theme.colors.accent}
                  outlineColor={theme.colors.border}
                />
              ))}
            </View>
          )}
          {selected.shares === 7 && (
            <Text style={[styles.peopleRowLabel, { fontSize: fs(11) }]}>
              {isUrdu
                ? `${people} میں سے ۷ حصے`
                : isArabic
                ? `${people} من ٧ أنصبة`
                : `${people} of 7 shares claimed`}
            </Text>
          )}
        </View>

        {/* People stepper + result */}
        <View style={styles.calcCard}>
          <Text style={[styles.calcQuestion, { fontSize: fs(14) }]}>{labels.sharing}</Text>
          <View style={styles.stepperRow}>
            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={onDecPeople}
              activeOpacity={0.7}
              accessibilityLabel="Decrease people"
            >
              <Text style={styles.stepperBtnText}>−</Text>
            </TouchableOpacity>
            <View style={styles.stepperValue}>
              <Text style={[styles.stepperNumber, { fontSize: fs(36) }]}>{people}</Text>
              <Text style={[styles.stepperLabel, { fontSize: fs(11) }]}>
                {isUrdu ? 'افراد' : isArabic ? 'أشخاص' : 'PEOPLE'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={onIncPeople}
              activeOpacity={0.7}
              accessibilityLabel="Increase people"
            >
              <Text style={styles.stepperBtnText}>+</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.resultBox}>
            <Text style={[styles.resultLine, { fontSize: fs(15) }]}>
              {labels.result}{' '}
              <Text style={styles.resultNumber}>{animalsNeeded}</Text>{' '}
              <Text style={styles.resultAnimal}>
                {isUrdu ? selected.nameUr : isArabic ? selected.nameAr : selected.nameEn.toLowerCase()}
                {!isUrdu && !isArabic && animalsNeeded > 1 ? 's' : ''}
              </Text>
            </Text>
            <Text style={[styles.resultSub, { fontSize: fs(12) }]}>{labels.forPeople}</Text>
            <Text style={[styles.resultNote, { fontSize: fs(11) }]}>
              {isUrdu ? selected.sharesNoteUr : isArabic ? selected.sharesNoteAr : selected.sharesNoteEn}
            </Text>
          </View>
        </View>

        {/* Niyyah */}
        <Text style={[styles.sectionLabel, { fontSize: fs(11) }]}>{labels.niyyah}</Text>
        <View style={styles.niyyahCard}>
          <Text style={styles.niyyahArabic}>{QURBANI_NIYYAH.arabic}</Text>
          <Text style={[styles.niyyahTranslit, { fontSize: fs(12) }]}>
            {QURBANI_NIYYAH.transliteration}
          </Text>
          <Text style={[styles.niyyahTrans, { fontSize: fs(13) }]}>
            {isUrdu
              ? QURBANI_NIYYAH.translationUr
              : isArabic
              ? QURBANI_NIYYAH.translationAr
              : QURBANI_NIYYAH.translationEn}
          </Text>
          <View style={styles.niyyahFooter}>
            <Text style={[styles.niyyahSource, { fontSize: fs(11) }]}>
              {QURBANI_NIYYAH.source}
            </Text>
            <TouchableOpacity style={styles.copyBtn} onPress={onCopyNiyyah} activeOpacity={0.8}>
              <Text style={[styles.copyBtnText, { fontSize: fs(12) }]}>⧉ {labels.copy}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Distribution visualizer */}
        <Text style={[styles.sectionLabel, { fontSize: fs(11) }]}>{labels.distribution}</Text>
        <View style={styles.distCard}>
          <View style={styles.distBar}>
            {QURBANI_DISTRIBUTION.map((seg, i) => (
              <View
                key={seg.id}
                style={{
                  flex: seg.pct,
                  backgroundColor: seg.color,
                  borderTopLeftRadius: i === 0 ? 8 : 0,
                  borderBottomLeftRadius: i === 0 ? 8 : 0,
                  borderTopRightRadius: i === QURBANI_DISTRIBUTION.length - 1 ? 8 : 0,
                  borderBottomRightRadius: i === QURBANI_DISTRIBUTION.length - 1 ? 8 : 0,
                }}
              />
            ))}
          </View>
          <View style={styles.distLegend}>
            {QURBANI_DISTRIBUTION.map((seg) => (
              <View key={seg.id} style={styles.distRow}>
                <View style={[styles.distSwatch, { backgroundColor: seg.color }]} />
                <Text style={[styles.distLabel, { fontSize: fs(13) }]}>
                  {seg.icon}{' '}
                  {isUrdu ? seg.labelUr : isArabic ? seg.labelAr : seg.labelEn}
                </Text>
                <Text style={[styles.distPct, { fontSize: fs(12) }]}>~{seg.pct}%</Text>
              </View>
            ))}
          </View>
          <Text style={[styles.distNote, { fontSize: fs(11) }]}>{labels.distributionNote}</Text>
        </View>

        {/* Timing window */}
        <View style={styles.infoCard}>
          <Text style={[styles.infoIcon]}>📅</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.infoTitle, { fontSize: fs(13) }]}>{labels.timing}</Text>
            <Text style={[styles.infoBody, { fontSize: fs(12) }]}>{labels.timingBody}</Text>
          </View>
        </View>

        {/* Don't-cut reminder, only emphasized when in window */}
        <View style={[styles.infoCard, inDontCutWindow && styles.infoCardActive]}>
          <Text style={[styles.infoIcon]}>✂︎</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.infoTitle, { fontSize: fs(13) }]}>{labels.hairNailsTitle}</Text>
            <Text style={[styles.infoBody, { fontSize: fs(12) }]}>{labels.hairNailsBody}</Text>
          </View>
        </View>

        {/* Conditions checklist */}
        <Text style={[styles.sectionLabel, { fontSize: fs(11) }]}>{labels.conditions}</Text>
        <View style={styles.condCard}>
          {QURBANI_CONDITIONS.map((c) => (
            <View key={c.id} style={styles.condRow}>
              <Text style={styles.condCheck}>✓</Text>
              <Text style={[styles.condText, { fontSize: fs(13) }]}>
                {isUrdu ? c.textUr : isArabic ? c.textAr : c.textEn}
              </Text>
            </View>
          ))}
          <Text style={[styles.condNote, { fontSize: fs(11) }]}>{labels.conditionsNote}</Text>
        </View>

        <TouchableOpacity
          style={styles.guideLink}
          onPress={() => (navigation as any).navigate('Eid')}
          activeOpacity={0.7}
        >
          <Text style={[styles.guideLinkText, { fontSize: fs(13) }]}>{labels.fullGuide}</Text>
        </TouchableOpacity>

        <Text style={[styles.sourceLine, { fontSize: fs(11) }]}>{labels.sourceLine}</Text>
        <AdBanner unitId={AD_UNITS.bannerGuides} />
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
  heroEmoji: { fontSize: 44, marginBottom: 6 },
  heroIconRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
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
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginHorizontal: theme.spacing.xl,
    paddingVertical: 10,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    marginBottom: theme.spacing.lg,
  },
  bannerActive: {
    backgroundColor: 'rgba(26,122,60,0.10)',
    borderColor: theme.colors.success,
  },
  bannerSoft: {
    backgroundColor: theme.colors.accentMuted,
    borderColor: theme.colors.accent,
  },
  bannerIcon: {
    fontSize: 16,
    color: theme.colors.accent,
  },
  bannerText: {
    flex: 1,
    fontFamily: theme.typography.fontBodyMedium,
    color: theme.colors.textSecondary,
  },
  bannerTextActive: {
    color: theme.colors.success,
    fontFamily: theme.typography.fontBodyBold,
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
  animalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.md,
  },
  animalTile: {
    width: '31%',
    aspectRatio: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    gap: 2,
  },
  animalTileActive: {
    backgroundColor: theme.colors.accentMuted,
    borderColor: theme.colors.accent,
    borderWidth: 2,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.accent,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      },
      android: { elevation: 3 },
    }),
  },
  animalIconWrap: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  animalName: {
    fontFamily: theme.typography.fontBodyMedium,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  animalNameActive: {
    color: theme.colors.accent,
    fontFamily: theme.typography.fontBodyBold,
  },
  animalAge: {
    fontFamily: theme.typography.fontBody,
    color: theme.colors.textMuted,
  },
  animalAgeActive: { color: theme.colors.accent },

  heroAnimal: {
    marginHorizontal: theme.spacing.xl,
    marginTop: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  peopleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  peopleRowLabel: {
    fontFamily: theme.typography.fontBodyBold,
    color: theme.colors.textMuted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },

  calcCard: {
    marginHorizontal: theme.spacing.xl,
    marginTop: theme.spacing.lg,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.lg,
  },
  calcQuestion: {
    fontFamily: theme.typography.fontBodyMedium,
    color: theme.colors.text,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.lg,
  },
  stepperBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.accentMuted,
    borderWidth: 1,
    borderColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: {
    fontSize: 28,
    color: theme.colors.accent,
    fontFamily: theme.typography.fontHeadingBold,
    fontWeight: '700',
    lineHeight: 32,
  },
  stepperValue: {
    flex: 1,
    alignItems: 'center',
  },
  stepperNumber: {
    fontFamily: theme.typography.fontHeadingBold,
    color: theme.colors.text,
    fontWeight: '700',
    letterSpacing: -1,
  },
  stepperLabel: {
    fontFamily: theme.typography.fontBodyBold,
    color: theme.colors.textMuted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  resultBox: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
  },
  resultLine: {
    fontFamily: theme.typography.fontBodyMedium,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  resultNumber: {
    fontFamily: theme.typography.fontHeadingBold,
    color: theme.colors.accent,
    fontWeight: '700',
  },
  resultAnimal: {
    fontFamily: theme.typography.fontBodyBold,
    color: theme.colors.text,
  },
  resultSub: {
    marginTop: 4,
    fontFamily: theme.typography.fontBody,
    color: theme.colors.textMuted,
  },
  resultNote: {
    marginTop: 6,
    fontFamily: theme.typography.fontBody,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
  },

  niyyahCard: {
    marginHorizontal: theme.spacing.xl,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 8,
  },
  niyyahArabic: {
    fontFamily: 'System',
    fontSize: 22,
    color: theme.colors.text,
    textAlign: 'right',
    lineHeight: 38,
    writingDirection: 'rtl',
  },
  niyyahTranslit: {
    fontFamily: theme.typography.fontBody,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
  },
  niyyahTrans: {
    fontFamily: theme.typography.fontBodyMedium,
    color: theme.colors.textSecondary,
  },
  niyyahFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  niyyahSource: {
    fontFamily: theme.typography.fontBody,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
  },
  copyBtn: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    backgroundColor: theme.colors.accentMuted,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.accent,
  },
  copyBtnText: {
    fontFamily: theme.typography.fontBodyBold,
    color: theme.colors.accent,
  },

  distCard: {
    marginHorizontal: theme.spacing.xl,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.md,
  },
  distBar: {
    flexDirection: 'row',
    height: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  distLegend: {
    gap: 8,
  },
  distRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  distSwatch: {
    width: 14,
    height: 14,
    borderRadius: 4,
  },
  distLabel: {
    flex: 1,
    fontFamily: theme.typography.fontBodyMedium,
    color: theme.colors.textSecondary,
  },
  distPct: {
    fontFamily: theme.typography.fontBodyBold,
    color: theme.colors.textMuted,
    letterSpacing: 0.5,
  },
  distNote: {
    fontFamily: theme.typography.fontBody,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
  },

  infoCard: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginHorizontal: theme.spacing.xl,
    marginTop: theme.spacing.md,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'flex-start',
  },
  infoCardActive: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accentMuted,
  },
  infoIcon: {
    fontSize: 22,
    color: theme.colors.accent,
    width: 28,
    textAlign: 'center',
  },
  infoTitle: {
    fontFamily: theme.typography.fontBodyBold,
    color: theme.colors.text,
    marginBottom: 4,
  },
  infoBody: {
    fontFamily: theme.typography.fontBody,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },

  condCard: {
    marginHorizontal: theme.spacing.xl,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 10,
  },
  condRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  condCheck: {
    fontSize: 16,
    color: theme.colors.success,
    fontFamily: theme.typography.fontBodyBold,
    width: 18,
    lineHeight: 20,
  },
  condText: {
    flex: 1,
    fontFamily: theme.typography.fontBody,
    color: theme.colors.textSecondary,
    lineHeight: 19,
  },
  condNote: {
    marginTop: 4,
    fontFamily: theme.typography.fontBody,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
  },

  guideLink: {
    marginHorizontal: theme.spacing.xl,
    marginTop: theme.spacing.lg,
    paddingVertical: 14,
    backgroundColor: theme.colors.accent,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  guideLinkText: {
    color: '#fff',
    fontFamily: theme.typography.fontBodyBold,
  },

  sourceLine: {
    marginTop: theme.spacing.md,
    marginHorizontal: theme.spacing.xl,
    fontFamily: theme.typography.fontBody,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
