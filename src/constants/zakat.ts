// Zakat calculator domain constants. Zakat is 2.5% of net zakatable wealth,
// due once wealth has been held above the nisab threshold for one lunar year
// (hawl). Nisab is defined by the value of a fixed weight of gold OR silver at
// today's spot price — so the monetary threshold moves with the market. Noor
// is offline / no-tracking, so the user supplies the current per-gram price
// themselves (no price API); the same price also values their own holdings.
//
// References: Qur'an 9:60 (the eight categories of recipients), 9:103, 2:267;
// classical nisab weights per Hanafi/Shafi'i/Maliki/Hanbali fiqh.

// Classical nisab weights in grams. The widely-cited modern figures used by
// Islamic Relief, NZF and most calculators. (20 mithqal gold ≈ 87.48g,
// 200 dirham silver ≈ 612.36g.)
export const NISAB_GOLD_GRAMS = 87.48;
export const NISAB_SILVER_GRAMS = 612.36;

// Zakat rate on wealth: 1/40 = 2.5%.
export const ZAKAT_RATE = 0.025;

// 1 tola (South-Asian jewellery unit) ≈ 11.6638 g. Surfaced as a helper so
// users who know their gold in tolas can convert.
export const TOLA_GRAMS = 11.6638;

export type ZakatFieldKey =
  | 'cash'
  | 'bank'
  | 'business'
  | 'receivables'
  | 'investments';

export type ZakatFieldDef = {
  key: ZakatFieldKey;
  icon: string;
  labelEn: string;
  labelUr: string;
  labelAr: string;
  hintEn: string;
  hintUr: string;
  hintAr: string;
};

// Monetary asset categories (entered directly in the user's currency). Gold
// and silver are handled separately because they are entered in grams and
// valued via the per-gram price the user provides.
export const ZAKAT_ASSET_FIELDS: ZakatFieldDef[] = [
  {
    key: 'cash',
    icon: '💵',
    labelEn: 'Cash in hand',
    labelUr: 'نقد رقم',
    labelAr: 'النقد',
    hintEn: 'Physical cash you hold',
    hintUr: 'آپ کے پاس موجود نقدی',
    hintAr: 'النقد الذي بحوزتك',
  },
  {
    key: 'bank',
    icon: '🏦',
    labelEn: 'Bank balance & savings',
    labelUr: 'بینک بیلنس اور بچت',
    labelAr: 'رصيد البنك والمدخرات',
    hintEn: 'Current, savings & deposit accounts',
    hintUr: 'کرنٹ، سیونگ اور ڈپازٹ اکاؤنٹس',
    hintAr: 'الحسابات الجارية والادخارية والودائع',
  },
  {
    key: 'business',
    icon: '📦',
    labelEn: 'Business assets',
    labelUr: 'کاروباری اثاثے',
    labelAr: 'أصول التجارة',
    hintEn: 'Stock & merchandise for sale (at value)',
    hintUr: 'فروخت کے لیے مال و سامان (قیمت کے حساب سے)',
    hintAr: 'البضائع المعروضة للبيع (بقيمتها)',
  },
  {
    key: 'receivables',
    icon: '🤝',
    labelEn: 'Money owed to you',
    labelUr: 'آپ کو واجب الادا رقم',
    labelAr: 'الديون المستحقة لك',
    hintEn: 'Loans & receivables you expect back',
    hintUr: 'قرض اور رقوم جو واپس ملنی ہیں',
    hintAr: 'القروض والمبالغ التي تتوقع استردادها',
  },
  {
    key: 'investments',
    icon: '📈',
    labelEn: 'Investments & shares',
    labelUr: 'سرمایہ کاری اور حصص',
    labelAr: 'الاستثمارات والأسهم',
    hintEn: 'Stocks, funds, crypto (zakatable value)',
    hintUr: 'اسٹاکس، فنڈز، کرپٹو (قابلِ زکوٰۃ قیمت)',
    hintAr: 'الأسهم والصناديق والعملات الرقمية (القيمة الزكوية)',
  },
];

// The eight categories of zakat recipients — Qur'an 9:60. Displayed as
// education so users know where their zakat may go.
export type ZakatRecipient = {
  id: string;
  icon: string;
  labelEn: string;
  labelUr: string;
  labelAr: string;
};

export const ZAKAT_RECIPIENTS: ZakatRecipient[] = [
  { id: 'fuqara', icon: '🫴', labelEn: 'The poor (al-fuqarā)', labelUr: 'فقراء', labelAr: 'الفقراء' },
  { id: 'masakin', icon: '🍞', labelEn: 'The needy (al-masākīn)', labelUr: 'مساکین', labelAr: 'المساكين' },
  { id: 'amilin', icon: '📋', labelEn: 'Zakat administrators', labelUr: 'زکوٰۃ کے عاملین', labelAr: 'العاملين عليها' },
  { id: 'muallafa', icon: '🤍', labelEn: 'Those whose hearts are to be reconciled', labelUr: 'مؤلفۃ القلوب', labelAr: 'المؤلفة قلوبهم' },
  { id: 'riqab', icon: '🕊️', labelEn: 'Freeing captives & the enslaved', labelUr: 'غلاموں کی آزادی', labelAr: 'في الرقاب' },
  { id: 'gharimin', icon: '🧾', labelEn: 'Those in debt (al-ghārimīn)', labelUr: 'مقروض', labelAr: 'الغارمين' },
  { id: 'sabilillah', icon: '🌙', labelEn: 'In the cause of Allah', labelUr: 'فی سبیل اللہ', labelAr: 'في سبيل الله' },
  { id: 'ibnsabil', icon: '🧳', labelEn: 'The stranded traveller', labelUr: 'مسافر', labelAr: 'ابن السبيل' },
];
