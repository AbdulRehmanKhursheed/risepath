import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../constants/theme';
import { useLanguage } from '../contexts/LanguageContext';
import { useSimpleMode } from '../contexts/SimpleModeContext';
import { storage, StoredZakatInputs } from '../services/storage';
import { AdBanner } from '../components/AdBanner';
import { AD_UNITS } from '../services/ads';
import {
  ZAKAT_ASSET_FIELDS,
  ZAKAT_RECIPIENTS,
  ZakatFieldKey,
  ZAKAT_RATE,
  TOLA_GRAMS,
  NISAB_GOLD_GRAMS,
  NISAB_SILVER_GRAMS,
} from '../constants/zakat';
import { computeZakat, NisabBasis, ZakatInputs } from '../utils/zakat';

type Locale = 'en' | 'ur' | 'ar';

const EMPTY: StoredZakatInputs = {
  currency: '',
  goldPricePerGram: '',
  silverPricePerGram: '',
  goldGrams: '',
  silverGrams: '',
  cash: '',
  bank: '',
  business: '',
  receivables: '',
  investments: '',
  liabilities: '',
  nisabBasis: null,
};

function fmtMoney(n: number, currency: string): string {
  const fixed = (Math.round(n * 100) / 100).toFixed(2);
  const [int, dec] = fixed.split('.');
  const withSep = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const body = dec === '00' ? withSep : `${withSep}.${dec}`;
  return currency ? `${currency} ${body}` : body;
}

export function ZakatScreen() {
  const { language } = useLanguage();
  const { fs } = useSimpleMode();
  const locale: Locale = (['en', 'ur', 'ar'].includes(language as string) ? language : 'en') as Locale;
  const isUrdu = locale === 'ur';
  const isArabic = locale === 'ar';

  const [data, setData] = useState<StoredZakatInputs>(EMPTY);
  const [basis, setBasis] = useState<NisabBasis>('silver');
  const hydrated = useRef(false);

  // Hydrate saved inputs; resolve nisab basis from madhab on first use (Hanafi
  // → silver, majority → gold), matching the classical positions.
  useEffect(() => {
    let mounted = true;
    (async () => {
      const [stored, settings] = await Promise.all([
        storage.getZakatInputs(),
        storage.getPrayerSettings(),
      ]);
      if (!mounted) return;
      if (stored) {
        setData({ ...EMPTY, ...stored });
        setBasis(stored.nisabBasis ?? (settings?.madhab === 'Hanafi' ? 'silver' : 'gold'));
      } else {
        setBasis(settings?.madhab === 'Hanafi' ? 'silver' : 'gold');
      }
      hydrated.current = true;
    })().catch(() => {
      hydrated.current = true;
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Persist (debounced) whenever inputs or basis change, after hydration.
  useEffect(() => {
    if (!hydrated.current) return;
    const id = setTimeout(() => {
      storage.setZakatInputs({ ...data, nisabBasis: basis }).catch(() => {});
    }, 500);
    return () => clearTimeout(id);
  }, [data, basis]);

  const result = useMemo(() => {
    const inputs: ZakatInputs = {
      currency: data.currency,
      goldPricePerGram: data.goldPricePerGram,
      silverPricePerGram: data.silverPricePerGram,
      goldGrams: data.goldGrams,
      silverGrams: data.silverGrams,
      assets: {
        cash: data.cash,
        bank: data.bank,
        business: data.business,
        receivables: data.receivables,
        investments: data.investments,
      },
      liabilities: data.liabilities,
      nisabBasis: basis,
    };
    return computeZakat(inputs);
  }, [data, basis]);

  const set = (key: keyof StoredZakatInputs, value: string) =>
    setData((d) => ({ ...d, [key]: value }));

  const L = {
    en: {
      title: 'Zakat Calculator',
      subtitle: 'Work out the Zakat due on your wealth — 2.5% above nisab',
      basis: 'NISAB BASIS',
      gold: 'Gold',
      silver: 'Silver',
      thresholdGold: `Gold nisab · ${NISAB_GOLD_GRAMS}g`,
      thresholdSilver: `Silver nisab · ${NISAB_SILVER_GRAMS}g`,
      threshold: 'Your nisab threshold',
      enterPrice: 'Enter the metal price to set your nisab.',
      prices: 'TODAY’S METAL PRICES',
      currency: 'Currency',
      currencyHint: 'e.g. $, £, PKR, ₹, ﷼',
      goldPrice: 'Gold price / gram',
      silverPrice: 'Silver price / gram',
      priceNote: `Check today’s local rate. Tip: 1 tola ≈ ${TOLA_GRAMS.toFixed(2)}g.`,
      assets: 'ZAKATABLE ASSETS',
      goldHeld: 'Gold you own (grams)',
      silverHeld: 'Silver you own (grams)',
      liabilities: 'LIABILITIES',
      debts: 'Debts & bills due now',
      debtsHint: 'Amounts you owe and can deduct',
      resultTitle: 'ZAKAT DUE',
      meets: 'Your wealth is above nisab — Zakat is due.',
      below: 'Your wealth is below nisab — no Zakat due.',
      netWealth: 'Net zakatable wealth',
      nisabLine: 'Nisab threshold',
      rate: 'Rate',
      hawlTitle: 'One lunar year (hawl)',
      hawlBody:
        'Zakat is due on wealth you have held above nisab for one full lunar year. This tool values your wealth today — track your own hawl date.',
      recipients: 'WHO CAN RECEIVE ZAKAT',
      recipientsNote: 'The eight categories — Qur’an 9:60.',
      disclaimer:
        'This calculator is an educational aid using the standard 2.5% rate and classical nisab weights. Rulings on specific assets (pensions, mortgages, business stock) differ between scholars — consult a trusted scholar for your situation.',
    },
    ur: {
      title: 'زکوٰۃ کیلکولیٹر',
      subtitle: 'اپنے مال پر واجب زکوٰۃ معلوم کریں — نصاب سے اوپر ۲.۵٪',
      basis: 'نصاب کی بنیاد',
      gold: 'سونا',
      silver: 'چاندی',
      thresholdGold: `سونے کا نصاب · ${NISAB_GOLD_GRAMS} گرام`,
      thresholdSilver: `چاندی کا نصاب · ${NISAB_SILVER_GRAMS} گرام`,
      threshold: 'آپ کا نصاب',
      enterPrice: 'نصاب مقرر کرنے کے لیے دھات کی قیمت درج کریں۔',
      prices: 'آج دھات کی قیمتیں',
      currency: 'کرنسی',
      currencyHint: 'مثلاً $, £, PKR, ₹, ﷼',
      goldPrice: 'سونا فی گرام قیمت',
      silverPrice: 'چاندی فی گرام قیمت',
      priceNote: `آج کا مقامی ریٹ دیکھیں۔ نوٹ: ۱ تولہ ≈ ${TOLA_GRAMS.toFixed(2)} گرام۔`,
      assets: 'قابلِ زکوٰۃ اثاثے',
      goldHeld: 'آپ کا سونا (گرام)',
      silverHeld: 'آپ کی چاندی (گرام)',
      liabilities: 'واجبات',
      debts: 'قرض اور واجب الادا بل',
      debtsHint: 'وہ رقم جو آپ پر واجب ہے اور منہا کر سکتے ہیں',
      resultTitle: 'واجب زکوٰۃ',
      meets: 'آپ کا مال نصاب سے اوپر ہے — زکوٰۃ واجب ہے۔',
      below: 'آپ کا مال نصاب سے کم ہے — زکوٰۃ واجب نہیں۔',
      netWealth: 'خالص قابلِ زکوٰۃ مال',
      nisabLine: 'نصاب کی حد',
      rate: 'شرح',
      hawlTitle: 'ایک قمری سال (حول)',
      hawlBody:
        'زکوٰۃ اس مال پر واجب ہے جو ایک مکمل قمری سال نصاب سے اوپر رہا ہو۔ یہ ٹول آج کے مال کی قیمت لگاتا ہے — اپنے حول کی تاریخ خود یاد رکھیں۔',
      recipients: 'زکوٰۃ کے مستحق کون؟',
      recipientsNote: 'آٹھ مصارف — سورۃ التوبہ ۹:۶۰۔',
      disclaimer:
        'یہ کیلکولیٹر ایک تعلیمی معاون ہے جو معیاری ۲.۵٪ شرح اور کلاسیکی نصاب وزن استعمال کرتا ہے۔ مخصوص اثاثوں (پنشن، مارگیج، کاروباری مال) کے احکام علماء میں مختلف ہیں — اپنے معاملے کے لیے کسی معتبر عالم سے رجوع کریں۔',
    },
    ar: {
      title: 'حاسبة الزكاة',
      subtitle: 'احسب زكاة مالك — ٢.٥٪ فوق النصاب',
      basis: 'أساس النصاب',
      gold: 'ذهب',
      silver: 'فضة',
      thresholdGold: `نصاب الذهب · ${NISAB_GOLD_GRAMS} غرام`,
      thresholdSilver: `نصاب الفضة · ${NISAB_SILVER_GRAMS} غرام`,
      threshold: 'نصابك',
      enterPrice: 'أدخل سعر المعدن لتحديد النصاب.',
      prices: 'أسعار المعادن اليوم',
      currency: 'العملة',
      currencyHint: 'مثل $، £، ﷼، ﷼',
      goldPrice: 'سعر غرام الذهب',
      silverPrice: 'سعر غرام الفضة',
      priceNote: `تحقق من سعر اليوم المحلي. ملاحظة: ١ تولة ≈ ${TOLA_GRAMS.toFixed(2)} غرام.`,
      assets: 'الأموال الزكوية',
      goldHeld: 'ذهبك (غرام)',
      silverHeld: 'فضتك (غرام)',
      liabilities: 'الالتزامات',
      debts: 'الديون والفواتير المستحقة',
      debtsHint: 'ما عليك من ديون يمكن خصمها',
      resultTitle: 'الزكاة المستحقة',
      meets: 'مالك فوق النصاب — الزكاة واجبة.',
      below: 'مالك دون النصاب — لا زكاة.',
      netWealth: 'صافي المال الزكوي',
      nisabLine: 'حد النصاب',
      rate: 'النسبة',
      hawlTitle: 'حول كامل (سنة قمرية)',
      hawlBody:
        'تجب الزكاة على المال الذي بقي فوق النصاب حولاً كاملاً. تحسب هذه الأداة قيمة مالك اليوم — تابع تاريخ حولك بنفسك.',
      recipients: 'من يستحق الزكاة',
      recipientsNote: 'الأصناف الثمانية — التوبة ٩:٦٠.',
      disclaimer:
        'هذه الحاسبة أداة تعليمية تستخدم نسبة ٢.٥٪ القياسية وأوزان النصاب الكلاسيكية. تختلف أحكام أصول معينة (المعاشات، الرهون، بضاعة التجارة) بين العلماء — راجع عالماً موثوقاً في حالتك.',
    },
  }[locale];

  const label = (f: (typeof ZAKAT_ASSET_FIELDS)[number]) =>
    isUrdu ? f.labelUr : isArabic ? f.labelAr : f.labelEn;
  const hint = (f: (typeof ZAKAT_ASSET_FIELDS)[number]) =>
    isUrdu ? f.hintUr : isArabic ? f.hintAr : f.hintEn;

  const cur = data.currency;
  const align = isUrdu || isArabic ? 'right' : 'left';

  // A render-FUNCTION, not a component. Called as {moneyRow({...})} so its
  // <TextInput> stays a stable child by position — defining it as an inner
  // <Component/> would give it a fresh identity each render and remount the
  // input on every keystroke (focus loss after each character).
  const moneyRow = ({
    icon,
    labelText,
    hintText,
    field,
    prefixCurrency = true,
  }: {
    icon: string;
    labelText: string;
    hintText?: string;
    field: keyof StoredZakatInputs;
    prefixCurrency?: boolean;
  }) => (
    <View style={styles.inputRow}>
      <Text style={styles.inputIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={[styles.inputLabel, { fontSize: fs(13) }]}>{labelText}</Text>
        {!!hintText && <Text style={[styles.inputHint, { fontSize: fs(11) }]}>{hintText}</Text>}
      </View>
      <View style={styles.inputFieldWrap}>
        {prefixCurrency && !!cur && <Text style={[styles.curPrefix, { fontSize: fs(13) }]}>{cur}</Text>}
        <TextInput
          style={[styles.numInput, { fontSize: fs(16) }]}
          value={(data[field] as string) ?? ''}
          onChangeText={(t) => set(field, t)}
          keyboardType="decimal-pad"
          inputMode="decimal"
          placeholder="0"
          placeholderTextColor={theme.colors.textMuted}
          maxLength={13}
        />
      </View>
    </View>
  );

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <LinearGradient
          colors={['rgba(26,122,60,0.18)', 'rgba(200,120,10,0.10)', 'transparent']}
          style={styles.hero}
        >
          <Text style={styles.heroEmoji}>💰</Text>
          <Text style={[styles.heroTitle, { fontSize: fs(24) }]}>{L.title}</Text>
          <Text style={[styles.heroSub, { fontSize: fs(13) }]}>{L.subtitle}</Text>
        </LinearGradient>

        {/* Nisab basis */}
        <Text style={[styles.sectionLabel, { fontSize: fs(11) }]}>{L.basis}</Text>
        <View style={styles.segment}>
          {(['gold', 'silver'] as NisabBasis[]).map((b) => {
            const active = basis === b;
            return (
              <TouchableOpacity
                key={b}
                style={[styles.segmentBtn, active && styles.segmentBtnOn]}
                onPress={() => setBasis(b)}
                activeOpacity={0.85}
              >
                <Text style={[styles.segmentText, active && styles.segmentTextOn, { fontSize: fs(14) }]}>
                  {b === 'gold' ? `🥇 ${L.gold}` : `🥈 ${L.silver}`}
                </Text>
                <Text style={[styles.segmentSub, active && styles.segmentSubOn, { fontSize: fs(10) }]}>
                  {b === 'gold' ? L.thresholdGold : L.thresholdSilver}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={styles.thresholdBox}>
          <Text style={[styles.thresholdLabel, { fontSize: fs(12) }]}>{L.threshold}</Text>
          <Text style={[styles.thresholdValue, { fontSize: fs(18) }]}>
            {result.nisabThreshold > 0 ? fmtMoney(result.nisabThreshold, cur) : '—'}
          </Text>
          {result.nisabThreshold === 0 && (
            <Text style={[styles.thresholdHint, { fontSize: fs(11) }]}>{L.enterPrice}</Text>
          )}
        </View>

        {/* Metal prices */}
        <Text style={[styles.sectionLabel, { fontSize: fs(11) }]}>{L.prices}</Text>
        <View style={styles.card}>
          <View style={styles.inputRow}>
            <Text style={styles.inputIcon}>💱</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.inputLabel, { fontSize: fs(13) }]}>{L.currency}</Text>
            </View>
            <TextInput
              style={[styles.numInput, styles.curInput, { fontSize: fs(16), textAlign: align }]}
              value={data.currency}
              onChangeText={(t) => set('currency', t)}
              placeholder={L.currencyHint}
              placeholderTextColor={theme.colors.textMuted}
              maxLength={5}
            />
          </View>
          <View style={styles.divider} />
          {moneyRow({ icon: '🥇', labelText: L.goldPrice, field: 'goldPricePerGram' })}
          <View style={styles.divider} />
          {moneyRow({ icon: '🥈', labelText: L.silverPrice, field: 'silverPricePerGram' })}
          <Text style={[styles.cardNote, { fontSize: fs(11) }]}>{L.priceNote}</Text>
        </View>

        {/* Assets */}
        <Text style={[styles.sectionLabel, { fontSize: fs(11) }]}>{L.assets}</Text>
        <View style={styles.card}>
          {moneyRow({ icon: '🥇', labelText: L.goldHeld, field: 'goldGrams', prefixCurrency: false })}
          <View style={styles.divider} />
          {moneyRow({ icon: '🥈', labelText: L.silverHeld, field: 'silverGrams', prefixCurrency: false })}
          {ZAKAT_ASSET_FIELDS.map((f) => (
            <React.Fragment key={f.key}>
              <View style={styles.divider} />
              {moneyRow({
                icon: f.icon,
                labelText: label(f),
                hintText: hint(f),
                field: f.key as keyof StoredZakatInputs,
              })}
            </React.Fragment>
          ))}
        </View>

        {/* Liabilities */}
        <Text style={[styles.sectionLabel, { fontSize: fs(11) }]}>{L.liabilities}</Text>
        <View style={styles.card}>
          {moneyRow({ icon: '🧾', labelText: L.debts, hintText: L.debtsHint, field: 'liabilities' })}
        </View>

        {/* Result */}
        <View style={[styles.resultCard, result.meetsNisab ? styles.resultDue : styles.resultNone]}>
          <Text style={[styles.resultLabel, { fontSize: fs(11) }]}>{L.resultTitle}</Text>
          <Text
            style={[styles.resultAmount, { fontSize: fs(36) }, result.meetsNisab ? styles.resultAmountDue : styles.resultAmountNone]}
            allowFontScaling={false}
          >
            {fmtMoney(result.zakatDue, cur)}
          </Text>
          <Text style={[styles.resultStatus, { fontSize: fs(12) }]}>
            {result.meetsNisab ? `✓ ${L.meets}` : L.below}
          </Text>
          <View style={styles.resultBreakdown}>
            <View style={styles.breakRow}>
              <Text style={[styles.breakLabel, { fontSize: fs(12) }]}>{L.netWealth}</Text>
              <Text style={[styles.breakValue, { fontSize: fs(12) }]}>{fmtMoney(result.netWealth, cur)}</Text>
            </View>
            <View style={styles.breakRow}>
              <Text style={[styles.breakLabel, { fontSize: fs(12) }]}>{L.nisabLine}</Text>
              <Text style={[styles.breakValue, { fontSize: fs(12) }]}>
                {result.nisabThreshold > 0 ? fmtMoney(result.nisabThreshold, cur) : '—'}
              </Text>
            </View>
            <View style={styles.breakRow}>
              <Text style={[styles.breakLabel, { fontSize: fs(12) }]}>{L.rate}</Text>
              <Text style={[styles.breakValue, { fontSize: fs(12) }]}>{(ZAKAT_RATE * 100).toFixed(1)}%</Text>
            </View>
          </View>
        </View>

        {/* Hawl note */}
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>🌙</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.infoTitle, { fontSize: fs(13) }]}>{L.hawlTitle}</Text>
            <Text style={[styles.infoBody, { fontSize: fs(12) }]}>{L.hawlBody}</Text>
          </View>
        </View>

        {/* Recipients */}
        <Text style={[styles.sectionLabel, { fontSize: fs(11) }]}>{L.recipients}</Text>
        <View style={styles.card}>
          {ZAKAT_RECIPIENTS.map((r) => (
            <View key={r.id} style={styles.recipientRow}>
              <Text style={styles.recipientIcon}>{r.icon}</Text>
              <Text style={[styles.recipientText, { fontSize: fs(13) }]}>
                {isUrdu ? r.labelUr : isArabic ? r.labelAr : r.labelEn}
              </Text>
            </View>
          ))}
          <Text style={[styles.cardNote, { fontSize: fs(11) }]}>{L.recipientsNote}</Text>
        </View>

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
  segment: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginHorizontal: theme.spacing.xl,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    gap: 2,
  },
  segmentBtnOn: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accentMuted,
    borderWidth: 2,
  },
  segmentText: {
    fontFamily: theme.typography.fontBodyMedium,
    color: theme.colors.textSecondary,
  },
  segmentTextOn: { color: theme.colors.accent, fontFamily: theme.typography.fontBodyBold },
  segmentSub: { fontFamily: theme.typography.fontBody, color: theme.colors.textMuted },
  segmentSubOn: { color: theme.colors.accent },
  thresholdBox: {
    marginHorizontal: theme.spacing.xl,
    marginTop: theme.spacing.md,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    alignItems: 'center',
  },
  thresholdLabel: {
    fontFamily: theme.typography.fontBodyMedium,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  thresholdValue: {
    fontFamily: theme.typography.fontHeadingBold,
    color: theme.colors.text,
    fontWeight: '700',
    marginTop: 4,
  },
  thresholdHint: {
    fontFamily: theme.typography.fontBody,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
    marginTop: 4,
    textAlign: 'center',
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  inputIcon: { fontSize: 20, width: 26, textAlign: 'center' },
  inputLabel: { fontFamily: theme.typography.fontBodyMedium, color: theme.colors.text },
  inputHint: { fontFamily: theme.typography.fontBody, color: theme.colors.textMuted, marginTop: 1 },
  inputFieldWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 96,
    justifyContent: 'flex-end',
  },
  curPrefix: { fontFamily: theme.typography.fontBodyMedium, color: theme.colors.textMuted },
  numInput: {
    minWidth: 72,
    maxWidth: 130,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    fontFamily: theme.typography.fontBodyBold,
    color: theme.colors.text,
    textAlign: 'right',
  },
  curInput: { minWidth: 96, textAlign: 'left' },
  divider: { height: 1, backgroundColor: theme.colors.borderSoft },
  cardNote: {
    fontFamily: theme.typography.fontBody,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
    paddingVertical: theme.spacing.md,
    lineHeight: 16,
  },
  resultCard: {
    marginHorizontal: theme.spacing.xl,
    marginTop: theme.spacing.xl,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    alignItems: 'center',
  },
  resultDue: {
    backgroundColor: 'rgba(26,122,60,0.10)',
    borderColor: theme.colors.success,
  },
  resultNone: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
  },
  resultLabel: {
    fontFamily: theme.typography.fontBodyBold,
    color: theme.colors.textMuted,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  resultAmount: {
    fontFamily: theme.typography.fontHeadingBold,
    fontWeight: '700',
    letterSpacing: -1,
    marginTop: 4,
  },
  resultAmountDue: { color: theme.colors.success },
  resultAmountNone: { color: theme.colors.text },
  resultStatus: {
    fontFamily: theme.typography.fontBodyMedium,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  resultBreakdown: {
    alignSelf: 'stretch',
    marginTop: theme.spacing.lg,
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderSoft,
    paddingTop: theme.spacing.md,
  },
  breakRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  breakLabel: { fontFamily: theme.typography.fontBody, color: theme.colors.textMuted },
  breakValue: { fontFamily: theme.typography.fontBodyBold, color: theme.colors.textSecondary },
  infoCard: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginHorizontal: theme.spacing.xl,
    marginTop: theme.spacing.lg,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'flex-start',
  },
  infoIcon: { fontSize: 22, width: 28, textAlign: 'center' },
  infoTitle: { fontFamily: theme.typography.fontBodyBold, color: theme.colors.text, marginBottom: 4 },
  infoBody: { fontFamily: theme.typography.fontBody, color: theme.colors.textSecondary, lineHeight: 18 },
  recipientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: 9,
  },
  recipientIcon: { fontSize: 18, width: 26, textAlign: 'center' },
  recipientText: { flex: 1, fontFamily: theme.typography.fontBodyMedium, color: theme.colors.textSecondary },
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
