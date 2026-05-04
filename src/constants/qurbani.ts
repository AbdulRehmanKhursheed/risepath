// Qurbani / Udhiyah animal options and reference data.
// Used by QurbaniScreen for the share calculator + eligibility view.
// Detailed fiqh (who is obligated, conditions, slaughter dua, full distribution
// rulings) lives in eidGuide.ts under the 'adha-qurbani' section — this file
// is purely the interactive data the calculator surfaces.

export type AnimalKey = 'goat' | 'sheep' | 'cow' | 'buffalo' | 'camel';

export type QurbaniAnimal = {
  key: AnimalKey;
  icon: string;
  shares: 1 | 7;
  minAgeMonths: number;
  nameEn: string;
  nameUr: string;
  nameAr: string;
  // What "shares" means in plain language for each animal type.
  sharesNoteEn: string;
  sharesNoteUr: string;
  sharesNoteAr: string;
};

export const QURBANI_ANIMALS: QurbaniAnimal[] = [
  {
    key: 'goat',
    icon: '🐐',
    shares: 1,
    minAgeMonths: 12,
    nameEn: 'Goat',
    nameUr: 'بکرا / بکری',
    nameAr: 'ماعز',
    sharesNoteEn: '1 person per goat',
    sharesNoteUr: 'ایک بکرا = ایک شخص',
    sharesNoteAr: 'ماعز واحد = شخص واحد',
  },
  {
    key: 'sheep',
    icon: '🐑',
    shares: 1,
    minAgeMonths: 12,
    nameEn: 'Sheep',
    nameUr: 'دنبہ / بھیڑ',
    nameAr: 'خروف',
    sharesNoteEn: '1 person per sheep',
    sharesNoteUr: 'ایک دنبہ = ایک شخص',
    sharesNoteAr: 'خروف واحد = شخص واحد',
  },
  {
    key: 'cow',
    icon: '🐄',
    shares: 7,
    minAgeMonths: 24,
    nameEn: 'Cow',
    nameUr: 'گائے',
    nameAr: 'بقرة',
    sharesNoteEn: 'Up to 7 people share',
    sharesNoteUr: 'زیادہ سے زیادہ ۷ افراد',
    sharesNoteAr: 'حتى ٧ أشخاص',
  },
  {
    key: 'buffalo',
    icon: '🐃',
    shares: 7,
    minAgeMonths: 24,
    nameEn: 'Buffalo',
    nameUr: 'بھینس',
    nameAr: 'جاموس',
    sharesNoteEn: 'Up to 7 people share',
    sharesNoteUr: 'زیادہ سے زیادہ ۷ افراد',
    sharesNoteAr: 'حتى ٧ أشخاص',
  },
  {
    key: 'camel',
    icon: '🐪',
    shares: 7,
    minAgeMonths: 60,
    nameEn: 'Camel',
    nameUr: 'اونٹ',
    nameAr: 'جمل',
    sharesNoteEn: 'Up to 7 people share',
    sharesNoteUr: 'زیادہ سے زیادہ ۷ افراد',
    sharesNoteAr: 'حتى ٧ أشخاص',
  },
];

// Slaughter niyyah / dua. Same wording surfaced inside the Eid Guide masala
// 'adha-qr-5'; duplicated here so the calculator screen is self-contained.
export const QURBANI_NIYYAH = {
  arabic: 'بِسْمِ اللّٰهِ، اللّٰهُ أَكْبَرُ، اللّٰهُمَّ هٰذَا مِنْكَ وَلَكَ',
  transliteration: 'Bismillahi Allahu Akbar, Allahumma haaza minka wa laka',
  translationEn: 'In the name of Allah, Allah is the Greatest. O Allah, this is from You and for You.',
  translationUr: 'اللہ کے نام سے، اللہ سب سے بڑا ہے۔ اے اللہ! یہ تیری طرف سے ہے اور تیرے لیے ہے۔',
  translationAr: 'بِاسْمِ اللهِ، واللهُ أَكْبَرُ. اللَّهُمَّ هَذَا مِنْكَ وَلَكَ',
  source: 'Abu Dawud 2795',
};

export type QurbaniCondition = {
  id: string;
  textEn: string;
  textUr: string;
  textAr: string;
  ok: boolean; // whether this is a "must-have" (true) or a "must-avoid" (false)
};

// Conditions rendered as a checklist on the screen. Sourced from masala
// adha-qr-4 (Abu Dawud 2802, Tirmidhi 1497).
export const QURBANI_CONDITIONS: QurbaniCondition[] = [
  {
    id: 'eyes',
    textEn: 'Not blind in one or both eyes',
    textUr: 'ایک یا دونوں آنکھوں سے اندھا نہ ہو',
    textAr: 'ليس أعور أو أعمى',
    ok: true,
  },
  {
    id: 'lame',
    textEn: 'Not severely lame — must walk to slaughter',
    textUr: 'اتنا لنگڑا نہ ہو کہ چل نہ سکے',
    textAr: 'ليس أعرج لا يستطيع المشي',
    ok: true,
  },
  {
    id: 'disease',
    textEn: 'Free of clear disease',
    textUr: 'واضح بیماری سے پاک',
    textAr: 'خال من المرض الظاهر',
    ok: true,
  },
  {
    id: 'thin',
    textEn: 'Not so thin its bones lack marrow',
    textUr: 'انتہائی کمزور نہ ہو',
    textAr: 'ليس هزيلاً جداً',
    ok: true,
  },
  {
    id: 'ear-tail',
    textEn: 'No more than one-third of ear or tail missing',
    textUr: 'کان یا دم کا ایک تہائی نہ کٹا ہوا ہو',
    textAr: 'لم يُقطع ثلث الأذن أو الذيل أو أكثر',
    ok: true,
  },
];

// Three-way distribution. Mustahabb (recommended), not obligatory — see
// adha-qr-6 in eidGuide.ts.
export const QURBANI_DISTRIBUTION = [
  {
    id: 'family',
    pct: 33,
    icon: '🏠',
    labelEn: 'Family',
    labelUr: 'گھر والے',
    labelAr: 'العائلة',
    color: '#C8780A',
  },
  {
    id: 'friends',
    pct: 33,
    icon: '🤝',
    labelEn: 'Relatives & Friends',
    labelUr: 'رشتہ دار و دوست',
    labelAr: 'الأقارب والأصدقاء',
    color: '#1A7A3C',
  },
  {
    id: 'needy',
    pct: 34,
    icon: '🤲',
    labelEn: 'Poor & Needy',
    labelUr: 'فقراء و مساکین',
    labelAr: 'الفقراء والمحتاجون',
    color: '#7A5A40',
  },
];
