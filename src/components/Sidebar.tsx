import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  StyleSheet,
  Platform,
  Modal,
  Share,
  Alert,
  Linking,
  BackHandler,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useSidebar } from '../contexts/SidebarContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useSimpleMode } from '../contexts/SimpleModeContext';
import { theme } from '../constants/theme';
import { PLAY_STORE_URL } from '../constants/appLinks';

const SIDEBAR_WIDTH = 300;
const ANIM_DURATION = 260;

type NavItem = {
  name: string;
  icon: string;
  labelEn: string;
  labelUr: string;
  labelAr: string;
};

type NavGroup = {
  id: 'practice' | 'guides' | 'journey';
  titleEn: string;
  titleUr: string;
  titleAr: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    id: 'practice',
    titleEn: 'PRACTICE',
    titleUr: 'روزمرہ عبادات',
    titleAr: 'العبادات اليومية',
    items: [
      { name: 'Tasbih',      icon: '📿', labelEn: 'Tasbih Counter',     labelUr: 'تسبیح کاؤنٹر',      labelAr: 'عدّاد التسبيح' },
      { name: 'Qibla',      icon: '🧭', labelEn: 'Qibla Direction',    labelUr: 'قبلہ سمت',          labelAr: 'اتجاه القبلة' },
      { name: 'Duas',       icon: '🤲', labelEn: 'Dua Library',        labelUr: 'دعاؤں کی لائبریری', labelAr: 'مكتبة الأدعية' },
      { name: 'Names',      icon: '✨', labelEn: '99 Names of Allah',  labelUr: 'اللہ کے ۹۹ نام',   labelAr: 'أسماء الله الحسنى' },
      { name: 'Learn',      icon: '📖', labelEn: 'Kalimas & Duas',     labelUr: 'کلمے اور دعائیں',   labelAr: 'الكلمات والأدعية' },
    ],
  },
  {
    id: 'guides',
    titleEn: 'GUIDES',
    titleUr: 'گائیڈز',
    titleAr: 'الأدلة',
    items: [
      { name: 'Hajj',   icon: '🕋', labelEn: 'Hajj Guide',   labelUr: 'حج گائیڈ',    labelAr: 'دليل الحج' },
      { name: 'Umrah',  icon: '⭐', labelEn: 'Umrah Guide',  labelUr: 'عمرہ گائیڈ',  labelAr: 'دليل العمرة' },
      { name: 'Eid',    icon: '🕌', labelEn: 'Eid Guide',    labelUr: 'عید گائیڈ',    labelAr: 'دليل العيد' },
      { name: 'Janaza', icon: '🤲', labelEn: 'Janaza Guide', labelUr: 'جنازہ گائیڈ', labelAr: 'دليل الجنازة' },
    ],
  },
  {
    id: 'journey',
    titleEn: 'MY JOURNEY',
    titleUr: 'میرا سفر',
    titleAr: 'رحلتي',
    items: [
      { name: 'SacredJourney', icon: '🌙', labelEn: 'Sacred Journey', labelUr: 'مقدس سفر',     labelAr: 'الرحلة المقدسة' },
      { name: 'Hifz',         icon: '📚', labelEn: 'Hifz Tracker',  labelUr: 'حفظ ٹریکر',  labelAr: 'متابعة الحفظ' },
      { name: 'Mood',         icon: '💚', labelEn: 'Mood Coach',     labelUr: 'موڈ کوچ',    labelAr: 'مرشد المزاج' },
      { name: 'Stats',        icon: '📊', labelEn: 'My Stats',       labelUr: 'میرے اعداد', labelAr: 'إحصائياتي' },
    ],
  },
];

const LANGUAGES: Array<{ code: 'en' | 'ur' | 'ar'; label: string; native: string }> = [
  { code: 'en', label: 'English',  native: 'English' },
  { code: 'ur', label: 'Urdu',     native: 'اردو' },
  { code: 'ar', label: 'Arabic',   native: 'العربية' },
];

export function Sidebar() {
  const { isOpen, closeSidebar } = useSidebar();
  const { language, setLanguage } = useLanguage();
  const { simpleMode, toggleSimpleMode, fs } = useSimpleMode();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const isUrdu = language === 'ur';
  const isArabic = language === 'ar';
  const navLabel = (item: NavItem) =>
    isUrdu ? item.labelUr : isArabic ? item.labelAr : item.labelEn;
  const groupTitle = (g: NavGroup) =>
    isUrdu ? g.titleUr : isArabic ? g.titleAr : g.titleEn;

  const [mounted, setMounted] = useState(false);
  const [disclaimerVisible, setDisclaimerVisible] = useState(false);
  const [langPickerVisible, setLangPickerVisible] = useState(false);

  const translateX = useRef(new Animated.Value(SIDEBAR_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: ANIM_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: ANIM_DURATION,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: SIDEBAR_WIDTH,
          duration: ANIM_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: ANIM_DURATION,
          useNativeDriver: true,
        }),
      ]).start(() => setMounted(false));
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      closeSidebar();
      return true;
    });
    return () => sub.remove();
  }, [isOpen, closeSidebar]);

  if (!mounted) return null;

  const navigateTo = (screenName: string) => {
    closeSidebar();
    setTimeout(() => {
      (navigation as any).navigate(screenName);
    }, 50);
  };

  const onShareApp = async () => {
    try {
      const message = isUrdu
        ? `🌙 Noor — قرآن، نماز کے اوقات، اذان، قبلہ، دعا، عید گائیڈ اور تسبیح۔ مفت، بغیر اکاؤنٹ۔\n${PLAY_STORE_URL}`
        : isArabic
        ? `🌙 Noor — القرآن، أوقات الصلاة، الأذان، القبلة، الأدعية، دليل العيد والتسبيح. مجاني، بدون حساب.\n${PLAY_STORE_URL}`
        : `🌙 Noor — Quran with Tajweed, Prayer Times, Azan, Qibla, Dua, Eid Guide & Tasbih. Free, no account, private.\n${PLAY_STORE_URL}`;
      await Share.share({ message });
    } catch {
      Alert.alert(isUrdu ? 'خرابی' : 'Error', isUrdu ? 'شیئر نہیں ہو سکا' : 'Could not share app');
    }
  };

  const onRateApp = async () => {
    try {
      const supported = await Linking.canOpenURL(PLAY_STORE_URL);
      if (supported) {
        await Linking.openURL(PLAY_STORE_URL);
      } else {
        Alert.alert(isUrdu ? 'خرابی' : 'Error', isUrdu ? 'لنک نہیں کھل سکا' : 'Could not open store link');
      }
    } catch {
      Alert.alert(isUrdu ? 'خرابی' : 'Error', isUrdu ? 'لنک نہیں کھل سکا' : 'Could not open store link');
    }
  };

  const currentLangNative = LANGUAGES.find((l) => l.code === language)?.native ?? 'English';

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* About / Disclaimer modal */}
      <Modal
        visible={disclaimerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDisclaimerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              {isUrdu ? 'اہم نوٹ' : isArabic ? 'عن Noor' : 'About Noor'}
            </Text>
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalText}>
                {isUrdu
                  ? 'قرآنی آیات العثمانی اسکرپٹ (عربی)، Saheeh International (انگریزی)، اور مودودی (اردو) ترجمہ سے لی گئی ہیں۔\n\nاحادیث اور دعائیں معتبر مصادر سے احتیاط کے ساتھ جمع کی گئی ہیں۔ جہاں کوئی روایت کمزور یا محل نظر ہو، وہاں نوٹ شامل ہے۔\n\nیہ ایپ ایک تعلیمی اور حوصلہ افزائی کا ذریعہ ہے، کسی مستند عالم کا متبادل نہیں۔ کسی بھی شرعی مسئلہ کے لیے اپنے عالم سے رابطہ کریں۔\n\nآپ کی نماز، قرآن، حفظ، موڈ، اور اہداف کا ڈیٹا آپ کے فون پر رہتا ہے۔ مفت ایپ چلانے کے لیے کچھ اسکرینز پر Google AdMob بینر اشتہارات دکھائے جاتے ہیں، اور خرابی سمجھنے کے لیے Sentry گمنام کریش رپورٹس لے سکتا ہے۔'
                  : isArabic
                  ? 'نص القرآن مأخوذ من الرسم العثماني، وترجمة Saheeh International الإنجليزية، وترجمة المودودي الأردية.\n\nتم جمع مراجع الأحاديث والأدعية بعناية من مصادر معتبرة، ومع التنبيه عند وجود خلاف أو ضعف معروف.\n\nهذا التطبيق وسيلة تعليمية وتحفيزية، وليس بديلا عن العالم المؤهل. في المسائل الشرعية الخاصة، راجع عالما موثوقا في بلدك.\n\nتبقى بيانات الصلاة والقرآن والحفظ والمزاج والأهداف على جهازك. لتمويل التطبيق المجاني قد تظهر إعلانات بانر من Google AdMob في بعض الشاشات، وقد يستقبل Sentry تقارير أعطال مجهولة لمساعدتنا على إصلاح الأخطاء.'
                  : 'Quran text is sourced from the Uthmani script, Saheeh International English translation, and Maududi Urdu translation.\n\nHadith references and duas have been compiled carefully from established sources. Where a narration is known to be disputed or weak, a note is included.\n\nThis app is an educational and motivational aid, not a substitute for a qualified Islamic scholar. For personal religious rulings, consult a trusted local scholar.\n\nYour prayer, Quran, hifz, mood, and goal data stays on your device. To keep Noor free, some screens show Google AdMob banner ads, and Sentry may receive anonymous crash reports so we can fix bugs.'}
              </Text>
              <Text style={styles.modalVersion}>Noor v1.0.1</Text>
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setDisclaimerVisible(false)}
            >
              <Text style={styles.modalCloseBtnText}>
                {isUrdu ? 'بند کریں' : 'Close'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Language picker modal */}
      <Modal
        visible={langPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLangPickerVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setLangPickerVisible(false)}>
          <Pressable style={styles.langBox} onPress={() => {}}>
            <Text style={styles.modalTitle}>
              {isUrdu ? 'زبان منتخب کریں' : isArabic ? 'اختر اللغة' : 'Choose Language'}
            </Text>
            {LANGUAGES.map((l) => {
              const selected = l.code === language;
              return (
                <TouchableOpacity
                  key={l.code}
                  style={[styles.langOption, selected && styles.langOptionSelected]}
                  onPress={() => {
                    setLanguage(l.code);
                    setLangPickerVisible(false);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.langOptionNative, selected && styles.langOptionNativeSelected]}>
                    {l.native}
                  </Text>
                  {l.code !== 'en' && (
                    <Text style={[styles.langOptionLabel, selected && styles.langOptionLabelSelected]}>
                      {l.label}
                    </Text>
                  )}
                  {selected && <Text style={styles.langOptionCheck}>✓</Text>}
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              style={styles.langCancel}
              onPress={() => setLangPickerVisible(false)}
            >
              <Text style={styles.langCancelText}>
                {isUrdu ? 'منسوخ' : isArabic ? 'إلغاء' : 'Cancel'}
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Dim overlay */}
      <TouchableWithoutFeedback onPress={closeSidebar}>
        <Animated.View
          style={[styles.overlay, { opacity: overlayOpacity }]}
          pointerEvents={isOpen ? 'auto' : 'none'}
        />
      </TouchableWithoutFeedback>

      {/* Panel (slides in from right) */}
      <Animated.View
        style={[
          styles.panel,
          {
            transform: [{ translateX }],
            paddingTop: insets.top + 12,
            paddingBottom: Math.max(insets.bottom, 12),
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(200,120,10,0.10)', 'rgba(26,122,60,0.04)', 'transparent']}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={closeSidebar}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Close menu"
          >
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>

          <View style={styles.logoRow}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoEmoji}>☾</Text>
            </View>
            <View style={styles.logoTextWrap}>
              <Text style={[styles.appName, { fontSize: fs(22) }]}>Noor</Text>
              <Text style={[styles.appTagline, { fontSize: fs(13) }]}>
                {isUrdu ? 'آپ کا اسلامی ساتھی' : isArabic ? 'رفيقك المسلم' : 'Your Muslim Companion'}
              </Text>
            </View>
          </View>
        </View>

        {/* Scrollable navigation area */}
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {NAV_GROUPS.map((group, gi) => (
            <View key={group.id} style={[styles.group, gi === 0 && { marginTop: theme.spacing.sm }]}>
              <Text style={[styles.sectionLabel, { fontSize: fs(11) }]}>
                {groupTitle(group)}
              </Text>
              <View style={styles.groupCard}>
                {group.items.map((item, idx) => (
                  <React.Fragment key={item.name}>
                    <TouchableOpacity
                      style={styles.item}
                      onPress={() => navigateTo(item.name)}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={navLabel(item)}
                    >
                      <View style={styles.itemIconWrap}>
                        <Text style={styles.itemIcon}>{item.icon}</Text>
                      </View>
                      <Text style={[styles.itemLabel, { fontSize: fs(15) }]}>
                        {navLabel(item)}
                      </Text>
                      <Text style={styles.itemArrow}>›</Text>
                    </TouchableOpacity>
                    {idx < group.items.length - 1 && <View style={styles.itemDivider} />}
                  </React.Fragment>
                ))}
              </View>
            </View>
          ))}

          {/* Support section — demoted visually */}
          <View style={[styles.group, { marginTop: theme.spacing.md }]}>
            <Text style={[styles.sectionLabel, { fontSize: fs(11) }]}>
              {isUrdu ? 'سپورٹ' : isArabic ? 'الدعم' : 'SUPPORT'}
            </Text>
            <View style={styles.growthRow}>
              <TouchableOpacity style={styles.growthBtn} onPress={onShareApp} activeOpacity={0.8}>
                <Text style={[styles.growthBtnText, { fontSize: fs(13) }]}>
                  {isUrdu ? '📤 شیئر' : isArabic ? '📤 شارك' : '📤 Share'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.growthBtn} onPress={onRateApp} activeOpacity={0.8}>
                <Text style={[styles.growthBtnText, { fontSize: fs(13) }]}>
                  {isUrdu ? '⭐ ریٹ کریں' : isArabic ? '⭐ قيّم' : '⭐ Rate'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Pinned footer */}
        <View style={styles.footer}>
          <View style={styles.divider} />
          <View style={styles.footerRow}>
            <TouchableOpacity
              style={styles.footerBtn}
              onPress={() => setLangPickerVisible(true)}
              activeOpacity={0.8}
              accessibilityLabel="Change language"
            >
              <Text style={styles.footerBtnIcon}>🌐</Text>
              <Text style={[styles.footerBtnText, { fontSize: fs(13) }]} numberOfLines={1}>
                {currentLangNative}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.footerBtn, simpleMode && styles.footerBtnActive]}
              onPress={toggleSimpleMode}
              activeOpacity={0.8}
              accessibilityLabel="Toggle large text"
              accessibilityState={{ selected: simpleMode }}
            >
              <Text style={[styles.footerBtnIcon, simpleMode && { color: theme.colors.accent }]}>Aa</Text>
              <Text
                style={[
                  styles.footerBtnText,
                  { fontSize: fs(13) },
                  simpleMode && styles.footerBtnTextActive,
                ]}
                numberOfLines={1}
              >
                {isUrdu ? 'بڑا فونٹ' : isArabic ? 'نص كبير' : 'Large Text'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.aboutLink}
            onPress={() => setDisclaimerVisible(true)}
            activeOpacity={0.6}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.aboutLinkText, { fontSize: fs(11) }]}>
              {isUrdu ? 'ℹ  اہم نوٹ / ڈس کلیمر' : isArabic ? 'ℹ  عن التطبيق' : 'ℹ  About & Disclaimer'}
              <Text style={styles.aboutVersion}>  ·  v1.0.1</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(28, 15, 6, 0.50)',
  },
  panel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: theme.colors.background,
    ...Platform.select({
      ios: {
        shadowColor: '#1C0F06',
        shadowOffset: { width: -4, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      android: { elevation: 16 },
    }),
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    gap: theme.spacing.md,
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  closeBtnText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  logoRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.accentMuted,
    borderWidth: 2,
    borderColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoEmoji: {
    fontSize: 22,
    color: theme.colors.accent,
  },
  logoTextWrap: {
    flex: 1,
  },
  appName: {
    fontFamily: theme.typography.fontHeadingBold,
    color: theme.colors.text,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  appTagline: {
    fontFamily: theme.typography.fontBody,
    color: theme.colors.textMuted,
    marginTop: 2,
  },

  /* Scroll area */
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing.md,
  },

  /* Sections */
  group: {
    marginBottom: theme.spacing.md,
  },
  sectionLabel: {
    fontFamily: theme.typography.fontBodyBold,
    color: theme.colors.textMuted,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xl,
  },
  groupCard: {
    marginHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.md,
    minHeight: 56,
  },
  itemDivider: {
    height: 1,
    backgroundColor: theme.colors.borderSoft,
    marginLeft: 60,
  },
  itemIconWrap: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemIcon: {
    fontSize: 18,
  },
  itemLabel: {
    flex: 1,
    fontFamily: theme.typography.fontBodyMedium,
    color: theme.colors.textSecondary,
  },
  itemArrow: {
    fontSize: 22,
    color: theme.colors.textMuted,
    lineHeight: 24,
    marginRight: 4,
  },

  /* Support */
  growthRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginHorizontal: theme.spacing.lg,
  },
  growthBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
  },
  growthBtnText: {
    fontFamily: theme.typography.fontBodyMedium,
    color: theme.colors.textSecondary,
  },

  /* Footer */
  footer: {
    paddingTop: theme.spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  footerRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },
  footerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 46,
  },
  footerBtnActive: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accentMuted,
  },
  footerBtnIcon: {
    fontSize: 15,
    color: theme.colors.textSecondary,
  },
  footerBtnText: {
    fontFamily: theme.typography.fontBodyMedium,
    color: theme.colors.textSecondary,
  },
  footerBtnTextActive: {
    color: theme.colors.accent,
  },
  aboutLink: {
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    marginTop: 2,
  },
  aboutLinkText: {
    fontFamily: theme.typography.fontBody,
    color: theme.colors.textMuted,
  },
  aboutVersion: {
    color: theme.colors.textMuted,
  },

  /* Modals */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  modalBox: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    width: '100%',
    maxHeight: '75%',
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16 },
      android: { elevation: 12 },
    }),
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    fontFamily: theme.typography.fontHeadingBold,
    marginBottom: theme.spacing.lg,
  },
  modalScroll: {
    marginBottom: theme.spacing.lg,
  },
  modalText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontBody,
    lineHeight: 22,
  },
  modalVersion: {
    marginTop: theme.spacing.lg,
    fontSize: 12,
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontBody,
    textAlign: 'center',
  },
  modalCloseBtn: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCloseBtnText: {
    color: '#fff',
    fontFamily: theme.typography.fontBodyBold,
    fontSize: 15,
  },

  /* Language picker */
  langBox: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    width: '100%',
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16 },
      android: { elevation: 12 },
    }),
  },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.md,
  },
  langOptionSelected: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accentMuted,
  },
  langOptionNative: {
    fontFamily: theme.typography.fontBodyBold,
    fontSize: 17,
    color: theme.colors.text,
    flex: 1,
  },
  langOptionNativeSelected: {
    color: theme.colors.accent,
  },
  langOptionLabel: {
    fontFamily: theme.typography.fontBody,
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  langOptionLabelSelected: {
    color: theme.colors.accent,
  },
  langOptionCheck: {
    fontSize: 18,
    color: theme.colors.accent,
    fontWeight: '700',
  },
  langCancel: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: theme.spacing.xs,
  },
  langCancelText: {
    fontFamily: theme.typography.fontBodyMedium,
    fontSize: 14,
    color: theme.colors.textMuted,
  },
});
