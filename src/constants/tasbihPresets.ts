export type TasbihPreset = {
  id: string;
  arabic: string;
  transliteration: string;
  translationEn: string;
  translationUr: string;
  translationAr: string;
  defaultTarget: number;
  virtue: string;
  virtueUr: string;
  virtueAr: string;
};

export const TASBIH_PRESETS: TasbihPreset[] = [
  {
    id: 'subhanallah',
    arabic: 'سُبْحَانَ اللّٰهِ',
    transliteration: 'Subhan Allah',
    translationEn: 'Glory be to Allah',
    translationUr: 'اللہ پاک ہے',
    translationAr: 'سبحان الله',
    defaultTarget: 33,
    virtue: 'Part of the post-prayer tasbih (Bukhari 843, Muslim 595).',
    virtueUr: 'نماز کے بعد کی تسبیح کا حصہ (بخاری ۸۴۳، مسلم ۵۹۵)',
    virtueAr: 'جزء من تسبيح ما بعد الصلاة (البخاري ٨٤٣، مسلم ٥٩٥)',
  },
  {
    id: 'alhamdulillah',
    arabic: 'اَلْحَمْدُ لِلّٰهِ',
    transliteration: 'Alhamdulillah',
    translationEn: 'All praise is for Allah',
    translationUr: 'تمام تعریفیں اللہ کے لیے',
    translationAr: 'الحمد لله',
    defaultTarget: 33,
    virtue: 'Fills the scales (Muslim 223).',
    virtueUr: 'یہ میزان کو بھر دیتا ہے (مسلم ۲۲۳)',
    virtueAr: 'تملأ الميزان (مسلم ٢٢٣)',
  },
  {
    id: 'allahuakbar',
    arabic: 'اَللّٰهُ أَكْبَرُ',
    transliteration: 'Allahu Akbar',
    translationEn: 'Allah is the Greatest',
    translationUr: 'اللہ سب سے بڑا ہے',
    translationAr: 'الله أكبر',
    defaultTarget: 34,
    virtue: 'Completes the 99 post-prayer dhikr (Muslim 597).',
    virtueUr: 'نماز کے بعد ۹۹ اذکار مکمل کرتی ہے (مسلم ۵۹۷)',
    virtueAr: 'يُكمل الـ٩٩ ذكر بعد الصلاة (مسلم ٥٩٧)',
  },
  {
    id: 'tahlil',
    arabic: 'لَا إِلٰهَ إِلَّا اللّٰهُ',
    transliteration: 'La ilaha illallah',
    translationEn: 'There is no god but Allah',
    translationUr: 'اللہ کے سوا کوئی معبود نہیں',
    translationAr: 'لا إله إلا الله',
    defaultTarget: 100,
    virtue: 'The best dhikr (Tirmidhi 3383, hasan).',
    virtueUr: 'بہترین ذکر (ترمذی ۳۳۸۳، حسن)',
    virtueAr: 'أفضل الذكر (الترمذي ٣٣٨٣، حسن)',
  },
  {
    id: 'istighfar',
    arabic: 'أَسْتَغْفِرُ اللّٰهَ',
    transliteration: 'Astaghfirullah',
    translationEn: 'I seek forgiveness from Allah',
    translationUr: 'میں اللہ سے بخشش مانگتا ہوں',
    translationAr: 'أستغفر الله',
    defaultTarget: 100,
    virtue: 'The Prophet ﷺ said over 70 times daily (Bukhari 6307).',
    virtueUr: 'حضور ﷺ روزانہ ۷۰ سے زائد بار پڑھتے تھے (بخاری ۶۳۰۷)',
    virtueAr: 'كان النبي ﷺ يستغفر أكثر من ٧٠ مرة يوميًا (البخاري ٦٣٠٧)',
  },
  {
    id: 'durood',
    arabic: 'اَللّٰهُمَّ صَلِّ عَلٰى مُحَمَّدٍ',
    transliteration: 'Allahumma salli ala Muhammad',
    translationEn: 'O Allah, send blessings upon Muhammad',
    translationUr: 'اے اللہ! محمد ﷺ پر درود بھیج',
    translationAr: 'اللهم صلِّ على محمد',
    defaultTarget: 100,
    virtue: 'Allah sends 10 blessings for every 1 (Muslim 408).',
    virtueUr: 'ایک بار کے بدلے اللہ دس رحمتیں نازل فرماتا ہے (مسلم ۴۰۸)',
    virtueAr: 'الله يصلي على العبد عشرًا مقابل كل صلاة (مسلم ٤٠٨)',
  },
  {
    id: 'hawqala',
    arabic: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللّٰهِ',
    transliteration: 'La hawla wa la quwwata illa billah',
    translationEn: 'There is no power or might except by Allah',
    translationUr: 'نہ کوئی تدبیر ہے نہ قوت مگر اللہ کی توفیق سے',
    translationAr: 'لا حول ولا قوة إلا بالله',
    defaultTarget: 100,
    virtue: 'A treasure from Paradise (Bukhari 4205, Muslim 2704).',
    virtueUr: 'جنت کے خزانوں میں سے ایک خزانہ (بخاری ۴۲۰۵، مسلم ۲۷۰۴)',
    virtueAr: 'كنز من كنوز الجنة (البخاري ٤٢٠٥، مسلم ٢٧٠٤)',
  },
];
