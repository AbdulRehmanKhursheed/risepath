export type UmrahStep = {
  id: number;
  phase: string;
  title: string;
  titleUr: string;
  icon: string;
  description: string;
  descriptionUr: string;
  dua?: {
    arabic: string;
    transliteration: string;
    translation: string;
    translationUr: string;
  };
  tips: string[];
  tipsUr: string[];
  womenNote?: string;
};

export const UMRAH_STEPS: UmrahStep[] = [
  {
    id: 1,
    phase: 'Before Travel',
    title: 'Prepare & Make Intention',
    titleUr: 'تیاری اور نیت',
    icon: '🌙',
    description:
      'Before leaving home, settle all debts and seek forgiveness from anyone you may have wronged. Make sincere tawbah. Inform family of your journey. Pack modestly. Perform ghusl (full bath) and wear clean clothes.',
    descriptionUr:
      'گھر سے روانہ ہونے سے پہلے تمام قرضے ادا کریں اور جن سے کوئی زیادتی ہوئی ہو معافی مانگ لیں۔ سچی توبہ کریں۔ خاندان کو سفر سے آگاہ کریں۔ غسل کریں اور پاک کپڑے پہنیں۔',
    dua: {
      arabic: 'اَللّٰهُمَّ إِنِّيْ أُرِيْدُ الْعُمْرَةَ فَيَسِّرْهَا لِيْ وَتَقَبَّلْهَا مِنِّيْ',
      transliteration: 'Allahumma inni uridu al-Umrata fa-yassirha li wa taqabbalha minni',
      translation: 'O Allah, I intend to perform Umrah — make it easy for me and accept it from me.',
      translationUr: 'اے اللہ، میں عمرہ کا ارادہ رکھتا ہوں — اسے میرے لیے آسان فرما اور قبول فرما۔',
    },
    tips: [
      'Settle all financial obligations before departing',
      'Perform ghusl at home before entering ihram',
      'Cut nails and trim hair before ihram — you cannot after',
      'Men: no stitched garments. Women: normal modest clothing',
    ],
    tipsUr: [
      'روانگی سے پہلے تمام مالی ذمہ داریاں پوری کریں',
      'احرام باندھنے سے پہلے گھر پر غسل کریں',
      'احرام سے پہلے ناخن کاٹیں اور بال ٹھیک کریں',
      'مرد: سلا ہوا کپڑا نہیں۔ خواتین: عام شائستہ لباس',
    ],
  },
  {
    id: 2,
    phase: 'Ihram',
    title: 'Enter the State of Ihram',
    titleUr: 'احرام باندھنا',
    icon: '🤍',
    description:
      'At the Miqat (designated boundary), perform ghusl, apply perfume to body only (not clothes), and wear the two white unstitched sheets (for men). Pray 2 rakats Sunnah of Ihram. Then make your intention (niyyah) aloud and begin reciting the Talbiyah. Once in ihram, avoid: perfume, cutting hair/nails, intercourse, hunting, and arguments.',
    descriptionUr:
      'میقات پر غسل کریں، صرف جسم پر عطر لگائیں (کپڑوں پر نہیں)، اور دو سفید بغیر سلے چادریں پہنیں (مردوں کے لیے)۔ احرام کی 2 رکعت سنت پڑھیں۔ پھر بلند آواز میں نیت کریں اور تلبیہ شروع کریں۔',
    dua: {
      arabic:
        'لَبَّيْكَ اللّٰهُمَّ لَبَّيْكَ، لَبَّيْكَ لَا شَرِيْكَ لَكَ لَبَّيْكَ، إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ، لَا شَرِيْكَ لَكَ',
      transliteration:
        'Labbayk Allahumma labbayk. Labbayk la sharika laka labbayk. Innal hamda wan-ni\'mata laka wal-mulk. La sharika lak.',
      translation:
        'Here I am, O Allah, here I am. Here I am — You have no partner — here I am. Truly all praise, grace, and sovereignty belong to You. You have no partner.',
      translationUr:
        'حاضر ہوں، اے اللہ، حاضر ہوں۔ حاضر ہوں، تیرا کوئی شریک نہیں، حاضر ہوں۔ بیشک تمام تعریف، نعمت اور بادشاہت تیری ہے۔ تیرا کوئی شریک نہیں۔',
    },
    tips: [
      'Recite Talbiyah loudly (men) until you reach the Kaaba',
      'Women recite Talbiyah quietly',
      'No perfume on ihram garments — body only is fine beforehand',
      'Avoid arguments and ill speech — this is sacred time',
    ],
    tipsUr: [
      'مرد بلند آواز میں تلبیہ پڑھیں جب تک کعبہ نہ پہنچ جائیں',
      'خواتین آہستہ آواز میں تلبیہ پڑھیں',
      'احرام کے کپڑوں پر عطر نہیں — پہلے صرف جسم پر لگانا ٹھیک ہے',
      'بحث اور بری بات سے بچیں — یہ مقدس وقت ہے',
    ],
    womenNote:
      'Women wear normal modest clothing (no face veil required during tawaf). They should not shout the Talbiyah — recite softly.',
  },
  {
    id: 3,
    phase: 'Arriving in Makkah',
    title: 'Enter Makkah & Masjid al-Haram',
    titleUr: 'مکہ اور مسجد الحرام میں داخلہ',
    icon: '🕌',
    description:
      'Upon entering Makkah, make dua as you enter the city. Enter Masjid al-Haram with your right foot first, reciting the dua for entering the mosque. When you first see the Kaaba, stop — this is a moment when duas are accepted. Make as much dua as you can at this first sight.',
    descriptionUr:
      'مکہ میں داخل ہوتے وقت دعا کریں۔ مسجد الحرام میں داخل ہوتے وقت دائیں پاؤں سے داخل ہوں اور مسجد میں داخلے کی دعا پڑھیں۔ جب پہلی بار کعبہ نظر آئے تو رک جائیں — یہ وہ لمحہ ہے جب دعائیں قبول ہوتی ہیں۔',
    dua: {
      arabic:
        'اَللّٰهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ، تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ',
      transliteration:
        'Allahumma antas-salam wa minkas-salam, tabarakta ya dhal-jalali wal-ikram',
      translation:
        'O Allah, You are Peace and from You comes peace. Blessed are You, O Possessor of Majesty and Honor.',
      translationUr:
        'اے اللہ، تو سلامتی ہے اور تجھ سے سلامتی آتی ہے۔ بابرکت ہے تو اے عزت و جلال والے۔',
    },
    tips: [
      'First sight of the Kaaba — stop and make dua. It is a special moment',
      'Do not rush — take it in and talk to Allah',
      'Recite durood on the Prophet (SAW) as you enter',
      'Keep reciting Talbiyah until you begin Tawaf',
    ],
    tipsUr: [
      'کعبہ کا پہلا نظارہ — رک کر دعا مانگیں۔ یہ خاص لمحہ ہے',
      'جلدی مت کریں — اللہ سے دل کھول کر بات کریں',
      'داخل ہوتے وقت نبی کریم پر درود پڑھیں',
      'تواف شروع کرنے تک تلبیہ پڑھتے رہیں',
    ],
  },
  {
    id: 4,
    phase: 'Tawaf',
    title: 'Perform Tawaf (7 Circuits)',
    titleUr: 'طواف (۷ چکر)',
    icon: '⭕',
    description:
      'Tawaf means walking around the Kaaba 7 times counterclockwise, starting and ending at the Black Stone (Hajar al-Aswad). Uncover your right shoulder (men only — called Idtiba). Kiss, touch, or point to the Black Stone at each circuit. There is no specific dua for each circuit — talk to Allah freely. Stop Talbiyah once you begin Tawaf.',
    descriptionUr:
      'طواف کا مطلب ہے خانہ کعبہ کے گرد ۷ چکر لگانا، حجر اسود سے شروع اور وہیں ختم۔ مردوں کو دائیں کندھا کھلا رکھنا ہے (اضطباع)۔ ہر چکر میں حجر اسود کو بوسہ دیں، چھوئیں یا اشارہ کریں۔ ہر چکر کے لیے کوئی مخصوص دعا نہیں — آزادانہ اللہ سے بات کریں۔',
    dua: {
      arabic: 'بِسْمِ اللَّهِ وَاللَّهُ أَكْبَرُ',
      transliteration: 'Bismillahi wallahu Akbar',
      translation: 'In the name of Allah, and Allah is the Greatest. (Said when reaching the Black Stone)',
      translationUr: 'اللہ کے نام سے، اور اللہ سب سے بڑا ہے۔ (حجر اسود تک پہنچنے پر کہیں)',
    },
    tips: [
      'Start and end each circuit at the Black Stone',
      'Walk counterclockwise — Kaaba always on your left',
      'Circuit 1-3: walk briskly (raml) — men only. Circuit 4-7: normal pace',
      'If very crowded, pointing to the Black Stone counts — no need to push',
      'Make dua in your own language — Allah understands everything',
    ],
    tipsUr: [
      'ہر چکر حجر اسود پر شروع اور ختم ہو',
      'الٹی سمت چلیں — کعبہ ہمیشہ بائیں طرف',
      'چکر ۱-۳: تیز چلیں (رمل) — صرف مردوں کے لیے۔ ۴-۷: عام رفتار',
      'بہت بھیڑ ہو تو حجر اسود کی طرف اشارہ کافی ہے — دھکم پیل نہ کریں',
      'اپنی زبان میں دعا مانگیں — اللہ سب کچھ سمجھتا ہے',
    ],
    womenNote:
      'Women do not perform raml (brisk walking) — walk at normal pace all 7 circuits.',
  },
  {
    id: 5,
    phase: 'Tawaf',
    title: 'Pray 2 Rakats at Maqam Ibrahim',
    titleUr: 'مقام ابراہیم پر ۲ رکعت',
    icon: '🙏',
    description:
      'After completing Tawaf, proceed to Maqam Ibrahim (the stone where Ibrahim AS stood while building the Kaaba). Pray 2 rakats behind it (if possible) or anywhere in the Masjid facing the Kaaba. In the first rakat recite Surah Al-Kafirun, and in the second Surah Al-Ikhlas.',
    descriptionUr:
      'طواف مکمل کرنے کے بعد مقام ابراہیم کی طرف جائیں۔ اگر ممکن ہو تو اس کے پیچھے ۲ رکعت پڑھیں، ورنہ مسجد میں کہیں بھی کعبہ کی طرف منہ کر کے پڑھیں۔ پہلی رکعت میں سورۃ الکافرون اور دوسری میں سورۃ الاخلاص پڑھیں۔',
    dua: {
      arabic: 'وَاتَّخِذُوا مِن مَّقَامِ إِبْرَاهِيمَ مُصَلًّى',
      transliteration: 'Wattakhidhu min maqami Ibrahima musalla',
      translation: 'And take the station of Ibrahim as a place of prayer. (Quran 2:125)',
      translationUr: 'اور مقام ابراہیم کو نماز کی جگہ بناؤ۔ (قرآن ۲:۱۲۵)',
    },
    tips: [
      'If crowded, do not struggle for the exact spot — pray anywhere',
      'After prayer, go to Zamzam well to drink water',
      'Make dua after the 2 rakats — Allah is near',
      'Face the Kaaba during this prayer',
    ],
    tipsUr: [
      'بھیڑ ہو تو بالکل اس جگہ کے لیے نہ لڑیں — کہیں بھی پڑھیں',
      'نماز کے بعد زمزم پر جائیں اور پانی پئیں',
      '۲ رکعت کے بعد دعا مانگیں — اللہ قریب ہے',
      'اس نماز میں کعبہ کی طرف منہ کریں',
    ],
  },
  {
    id: 6,
    phase: 'Zamzam',
    title: 'Drink Zamzam Water',
    titleUr: 'زمزم کا پانی پینا',
    icon: '💧',
    description:
      'Go to the Zamzam well area inside the Masjid. Face the Qibla, drink in 3 breaths, and make dua while drinking. The Prophet (SAW) said: "Zamzam water is for whatever it is drunk for." So make dua for health, knowledge, rizq, or whatever you need before drinking.',
    descriptionUr:
      'مسجد کے اندر زمزم کنویں کی طرف جائیں۔ قبلہ رخ ہو کر تین سانسوں میں پئیں اور پیتے ہوئے دعا مانگیں۔ نبی کریم نے فرمایا: "زمزم کا پانی جس نیت سے پیا جائے اسی کے لیے ہے۔"',
    dua: {
      arabic:
        'اَللّٰهُمَّ إِنِّيْ أَسْأَلُكَ عِلْماً نَافِعاً وَرِزْقاً وَاسِعاً وَشِفَاءً مِنْ كُلِّ دَاءٍ',
      transliteration:
        'Allahumma inni as-aluka ilman nafi\'an wa rizqan wasi\'an wa shifa-an min kulli da\'in',
      translation:
        'O Allah, I ask You for beneficial knowledge, wide provision, and cure from every illness.',
      translationUr:
        'اے اللہ، میں تجھ سے نفع بخش علم، وسیع رزق اور ہر بیماری سے شفاء مانگتا ہوں۔',
    },
    tips: [
      'Drink standing, facing Qibla, in 3 breaths',
      'Make your personal dua before and while drinking',
      'Pour some on your head and body — it is sunnah',
      'You can fill a bottle to take home for family',
    ],
    tipsUr: [
      'کھڑے ہو کر، قبلہ رخ، تین سانسوں میں پئیں',
      'پینے سے پہلے اور پیتے ہوئے ذاتی دعا مانگیں',
      'کچھ سر اور جسم پر ڈالیں — یہ سنت ہے',
      'گھر والوں کے لیے بوتل بھر کر لے جا سکتے ہیں',
    ],
  },
  {
    id: 7,
    phase: "Sa'i",
    title: "Perform Sa'i (Safa to Marwa — 7 Times)",
    titleUr: 'سعی (صفا سے مروہ — ۷ مرتبہ)',
    icon: '🚶',
    description:
      "Sa'i is walking 7 times between the hills of Safa and Marwa, commemorating Hajar AS searching for water for her son Ismail AS. Start at Safa (1st), end at Marwa (7th). Face the Kaaba at Safa and Marwa and make dua. Between the green lights (men only), walk briskly.",
    descriptionUr:
      'سعی کا مطلب ہے صفا اور مروہ کی پہاڑیوں کے درمیان ۷ مرتبہ چلنا۔ یہ حضرت ہاجرہ کی یاد میں ہے۔ صفا سے شروع (۱)، مروہ پر ختم (۷)۔ صفا اور مروہ پر کعبہ کی طرف منہ کر کے دعا مانگیں۔',
    dua: {
      arabic: 'إِنَّ الصَّفَا وَالْمَرْوَةَ مِنْ شَعَائِرِ اللَّهِ',
      transliteration: 'Innas-Safa wal-Marwata min sha\'a\'irillah',
      translation: 'Indeed, Safa and Marwa are among the symbols of Allah. (Quran 2:158)',
      translationUr: 'بیشک صفا اور مروہ اللہ کی نشانیوں میں سے ہیں۔ (قرآن ۲:۱۵۸)',
    },
    tips: [
      'Recite the above ayah when climbing Safa and Marwa',
      'Face the Kaaba, raise hands and make dua on Safa and Marwa',
      'Men walk briskly between the two green lights',
      'No specific dua for each lap — talk to Allah freely',
      'You do NOT need to be in wudu for Sa\'i (though preferable)',
    ],
    tipsUr: [
      'صفا اور مروہ پر چڑھتے وقت یہ آیت پڑھیں',
      'کعبہ کی طرف منہ کر کے ہاتھ اٹھائیں اور دعا مانگیں',
      'مرد دو سبز بتیوں کے درمیان تیز چلیں',
      'ہر چکر کے لیے مخصوص دعا نہیں — آزادانہ بات کریں',
      'سعی کے لیے وضو ضروری نہیں (بہتر ضرور ہے)',
    ],
    womenNote:
      "Women walk at normal pace throughout all of Sa'i — no brisk walking between the green lights.",
  },
  {
    id: 8,
    phase: 'Completion',
    title: "Halq or Taqsir — Exit Ihram",
    titleUr: 'حلق یا تقصیر — احرام سے باہر',
    icon: '✂️',
    description:
      "After Sa'i, men either shave their head completely (Halq — more rewarding) or cut at least an inch of hair from all parts of the head (Taqsir). Women cut only a fingertip-length (about 1cm) from the ends of their hair. After this, you are out of ihram. Congratulations — your Umrah is complete!",
    descriptionUr:
      'سعی کے بعد مرد یا تو پورا سر منڈوائیں (حلق — زیادہ ثواب) یا کم از کم ایک انچ بال کٹوائیں (تقصیر)۔ خواتین صرف انگلی کی پور کے برابر (تقریباً ۱ سینٹی میٹر) بال کٹوائیں۔ اس کے بعد آپ احرام سے باہر ہیں۔ مبارک ہو — آپ کا عمرہ مکمل ہو گیا!',
    dua: {
      arabic:
        'اَللّٰهُمَّ تَقَبَّلْ مِنِّيْ، إِنَّكَ أَنْتَ السَّمِيْعُ الْعَلِيْمُ',
      transliteration: 'Allahumma taqabbal minni, innaka antas-Sami\' ul-Alim',
      translation: 'O Allah, accept from me. Verily You are the All-Hearing, the All-Knowing.',
      translationUr: 'اے اللہ، مجھ سے قبول فرما۔ بیشک تو سننے والا، جاننے والا ہے۔',
    },
    tips: [
      'Halq (full shave) carries more reward than Taqsir',
      'Women must NOT shave — only trim a fingertip length',
      'After cutting hair, all ihram restrictions are lifted',
      'Normal clothes can be worn again',
      'Make this dua of acceptance after completing Umrah',
    ],
    tipsUr: [
      'حلق (پورا سر منڈوانا) تقصیر سے زیادہ ثواب ہے',
      'خواتین سر نہیں منڈوائیں گی — صرف انگلی کی پور کے برابر کاٹیں',
      'بال کاٹنے کے بعد احرام کی تمام پابندیاں ختم ہو جاتی ہیں',
      'اب عام کپڑے پہن سکتے ہیں',
      'عمرہ مکمل ہونے کے بعد قبولیت کی یہ دعا مانگیں',
    ],
    womenNote:
      'Women trim only about 1cm from the ends of their hair — shaving is prohibited for women.',
  },
];

export const UMRAH_PHASES = [
  'Before Travel',
  'Ihram',
  'Arriving in Makkah',
  'Tawaf',
  "Sa'i",
  'Completion',
];
