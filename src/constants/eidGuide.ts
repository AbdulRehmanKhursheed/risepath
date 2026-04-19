export type EidDua = {
  arabic: string;
  transliteration: string;
  translation: string;
  translationUr: string;
};

export type EidMasala = {
  id: string;
  title: string;
  titleUr: string;
  description: string;
  descriptionUr: string;
  dua?: EidDua;
  tips?: string[];
  tipsUr?: string[];
  womenNote?: string;
  womenNoteUr?: string;
  madhabNote?: string;
  madhabNoteUr?: string;
  source?: string;
  important?: boolean;
};

export type EidSection = {
  id: string;
  icon: string;
  title: string;
  titleUr: string;
  masail: EidMasala[];
};

export const EID_FITR_SECTIONS: EidSection[] = [
  {
    id: 'fitr-zakatul-fitr',
    icon: '🤲',
    title: 'Zakat ul-Fitr',
    titleUr: 'زکوٰۃ الفطر',
    masail: [
      {
        id: 'fitr-zf-1',
        title: 'Who Must Pay?',
        titleUr: 'کس پر واجب ہے؟',
        description:
          'Zakat ul-Fitr is obligatory (Wajib) on every free Muslim who possesses food beyond their own and their family\'s needs on the day and night of Eid. In the Hanafi school, the head of the household pays on behalf of all dependents (wife, minor children). Other schools require each adult to pay for themselves.',
        descriptionUr:
          'ہر آزاد مسلمان پر جو عیدالفطر کی رات اپنی اور اپنے زیرکفالت افراد کی ایک دن کی خوراک سے زیادہ مال رکھتا ہو، زکوٰۃ الفطر واجب ہے۔ حنفی مسلک میں گھر کا سرپرست اپنی اور اہلِ خانہ کی طرف سے ادا کرتا ہے۔',
        source: 'Bukhari 1503, Muslim 985',
        important: true,
      },
      {
        id: 'fitr-zf-2',
        title: 'Amount to Pay',
        titleUr: 'مقدار',
        description:
          'Half a sa\' (~2.25 kg) of wheat, or one full sa\' (~4.5 kg) of barley, dates, or raisins per person. Paying the cash equivalent of the staple food of your country is also valid and often more practical (preferred Hanafi view).',
        descriptionUr:
          'گندم: آدھا صاع (تقریباً ۲.۲۵ کلو)، جَو/کھجور/کشمش: ایک پورا صاع (تقریباً ۴.۵ کلو)، یا اس کے برابر نقد رقم۔ نقد رقم دینا حنفی مسلک میں جائز اور آسان ہے۔',
        source: 'Bukhari 1503, Abu Dawud 1616',
      },
      {
        id: 'fitr-zf-3',
        title: 'When to Give',
        titleUr: 'کب ادا کریں؟',
        description:
          'Must be given before the Eid prayer — this is its most virtuous time. Paying 1–2 days early is permissible. If delayed past the Eid prayer without a valid reason, the obligation is not properly fulfilled — it should still be given as general charity.',
        descriptionUr:
          'نماز عید سے پہلے ادا کرنا ضروری ہے۔ ایک دو دن پہلے بھی دے سکتے ہیں۔ نماز عید کے بعد بلاعذر دیا جائے تو فریضہ پوری طرح ادا نہیں ہوتا۔',
        source: 'Abu Dawud 1609',
        important: true,
      },
      {
        id: 'fitr-zf-4',
        title: 'Who Receives It?',
        titleUr: 'کسے دیں؟',
        description:
          'Give to the poor and needy (fuqara\' and masakeen). The purpose is to provide them with enough food so they can celebrate Eid without begging. Give to deserving Muslims in your local community.',
        descriptionUr:
          'فقراء اور مساکین کو دیں تاکہ وہ عید کے دن مانگنے سے بچ سکیں۔ اپنے علاقے کے مستحق مسلمانوں کو دیں۔',
        source: 'Abu Dawud 1609',
      },
    ],
  },
  {
    id: 'fitr-preparation',
    icon: '✨',
    title: 'Night & Morning of Eid',
    titleUr: 'شبِ عید اور صبح',
    masail: [
      {
        id: 'fitr-prep-1',
        title: 'Night of Eid — Keep it Alive',
        titleUr: 'شبِ عید — عبادت میں گزاریں',
        description:
          'It is recommended to keep the night of Eid alive with worship — extra prayers, dhikr, and recitation of Quran. The Prophet ﷺ said: "Whoever keeps alive the two Eid nights hoping for Allah\'s reward, his heart will not die on the day when hearts die." (Ibn Majah — note: some scholars consider the chain weak, but acting on it is encouraged)',
        descriptionUr:
          'عید کی رات عبادت میں گزارنا مستحب ہے۔ حضور ﷺ نے فرمایا: جو دونوں عیدوں کی راتیں ثواب کی نیت سے زندہ رکھے، اس کا دل اس دن نہیں مرے گا جب دل مر جاتے ہیں۔ (ابنِ ماجہ)',
        source: 'Ibn Majah 1782',
        tips: [
          'Pray Tahajjud or extra nawafil',
          'Engage in istighfar and dhikr',
          'Make dua for yourself, family, and the ummah',
        ],
        tipsUr: [
          'تہجد یا نفل نماز پڑھیں',
          'استغفار اور ذکر میں مشغول رہیں',
          'اپنے، اہلِ خانہ اور امت کے لیے دعا کریں',
        ],
      },
      {
        id: 'fitr-prep-2',
        title: 'Ghusl (Ritual Bath)',
        titleUr: 'غسل',
        description:
          'Taking a ghusl on Eid morning before the prayer is an established Sunnah. Ibn Umar RA used to bathe before going to the Eid prayer ground. Time it before Fajr or between Fajr and Eid prayer.',
        descriptionUr:
          'عید کی صبح نمازِ عید سے پہلے غسل کرنا سنت ہے۔ ابنِ عمرؓ عید کے روز عیدگاہ جانے سے پہلے غسل فرماتے تھے۔',
        source: 'Muwatta Malik, Ibn Majah 1315',
      },
      {
        id: 'fitr-prep-3',
        title: 'Eat Before Prayer (Sunnah)',
        titleUr: 'نماز سے پہلے کھائیں',
        description:
          'It is Sunnah to eat an odd number of dates (1, 3, 5…) before going to Eid ul-Fitr prayer. The Prophet ﷺ would not go out until he had eaten dates. Do not fast today — fasting on Eid ul-Fitr is haram.',
        descriptionUr:
          'عیدالفطر کی نماز سے پہلے طاق تعداد میں کھجوریں (۱، ۳، ۵…) کھانا سنت ہے۔ حضور ﷺ کھجوریں کھائے بغیر نماز کے لیے نہیں جاتے تھے۔ آج روزہ حرام ہے۔',
        source: 'Bukhari 953',
        important: true,
      },
      {
        id: 'fitr-prep-4',
        title: 'Best Clothes & Ittar',
        titleUr: 'بہترین لباس اور عطر',
        description:
          'Wear your best or newest clothes on Eid. Apply ittar (perfume). Use miswaak. These are all established Sunnahs.',
        descriptionUr:
          'عید پر اپنا بہترین یا نیا لباس پہنیں۔ عطر لگائیں اور مسواک کریں۔ یہ سب سنتیں ہیں۔',
        source: 'Muwatta Malik, Bayhaqi',
        womenNote:
          'Women should wear modest attire appropriate for going out. Perfume should not be worn outside the home.',
        womenNoteUr:
          'خواتین باہر جانے کے لیے مناسب پردے کا اہتمام کریں۔ باہر نکلتے وقت خوشبو نہ لگائیں۔',
      },
      {
        id: 'fitr-prep-5',
        title: 'Two Different Routes',
        titleUr: 'جاتے اور آتے مختلف راستے',
        description:
          'It is Sunnah to go to the Eid prayer by one route and return by a different route. The Prophet ﷺ consistently did this. Wisdom cited: spreading the symbols of Islam, meeting more people.',
        descriptionUr:
          'عید کی نماز کے لیے ایک راستے سے جانا اور دوسرے سے واپس آنا سنت ہے۔ حضور ﷺ ہمیشہ اسی طرح فرماتے تھے۔',
        source: 'Bukhari 986',
      },
    ],
  },
  {
    id: 'fitr-takbeer',
    icon: '📣',
    title: 'Eid Takbeer',
    titleUr: 'تکبیراتِ عید',
    masail: [
      {
        id: 'fitr-tb-1',
        title: 'When & How to Recite',
        titleUr: 'کب اور کیسے پڑھیں',
        description:
          'Recite from Maghrib of the night before Eid until the imam begins the Eid prayer. Men recite aloud; women recite quietly.',
        descriptionUr:
          'عید سے پہلی رات مغرب سے لے کر امام کے نمازِ عید شروع کرنے تک پڑھیں۔ مرد بلند آواز سے، خواتین آہستہ پڑھیں۔',
        dua: {
          arabic:
            'اللّٰهُ أَكْبَرُ، اللّٰهُ أَكْبَرُ، لَا إِلٰهَ إِلَّا اللّٰهُ، وَاللّٰهُ أَكْبَرُ، اللّٰهُ أَكْبَرُ، وَلِلّٰهِ الْحَمْدُ',
          transliteration:
            'Allahu Akbar, Allahu Akbar, La ilaha illallah, Wallahu Akbar, Allahu Akbar, Wa Lillahil Hamd',
          translation:
            'Allah is the Greatest, Allah is the Greatest, there is no god but Allah, and Allah is the Greatest, Allah is the Greatest, and to Allah belongs all praise.',
          translationUr:
            'اللہ سب سے بڑا ہے، اللہ سب سے بڑا ہے، اللہ کے سوا کوئی معبود نہیں، اللہ سب سے بڑا ہے، اللہ سب سے بڑا ہے، اور تمام تعریفیں اللہ کے لیے ہیں۔',
        },
        source: 'Musannaf Ibn Abi Shaybah, Silsila Sahiha',
      },
    ],
  },
  {
    id: 'fitr-salah',
    icon: '🕌',
    title: 'Eid Prayer',
    titleUr: 'نمازِ عید',
    masail: [
      {
        id: 'fitr-sal-1',
        title: 'Time of Prayer',
        titleUr: 'نمازِ عید کا وقت',
        description:
          'Begins ~20 minutes after sunrise (when sun is a spear\'s length up) and continues until just before midday (zawal). Praying early is recommended.',
        descriptionUr:
          'طلوعِ آفتاب کے تقریباً ۲۰ منٹ بعد شروع ہوتا ہے اور زوال سے پہلے تک رہتا ہے۔ جلدی پڑھنا بہتر ہے۔',
        source: 'Abu Dawud 1135',
      },
      {
        id: 'fitr-sal-2',
        title: 'How to Pray — Extra Takbeers',
        titleUr: 'نمازِ عید کا طریقہ',
        description:
          'Eid prayer is 2 rakats. No adhan, no iqamah.\n\nHanafi: After the opening takbeer, say 3 additional takbeers (hands drop at sides between each), then recite Surah Fatiha + surah. In the second rakat, recite first, then say 3 additional takbeers before ruku\'.\n\nShafi\'i / Maliki / Hanbali: 7 takbeers in the first rakat after the opening (before Fatiha); 5 takbeers in the second rakat after rising from the last sujood (before Fatiha).',
        descriptionUr:
          'نمازِ عید دو رکعت ہے، اذان اور اقامت نہیں۔\n\nحنفی: افتتاحی تکبیر کے بعد تین زائد تکبیریں (ہر تکبیر کے بعد ہاتھ چھوڑیں)، پھر قرأت۔ دوسری رکعت میں پہلے قرأت، پھر رکوع سے پہلے تین زائد تکبیریں۔\n\nشافعی/مالکی/حنبلی: پہلی رکعت میں سات تکبیریں (فاتحہ سے پہلے)، دوسری رکعت میں پانچ تکبیریں۔',
        source: 'Abu Dawud 1149, Tirmidhi 536',
        important: true,
        madhabNote:
          'Hanafi: hands drop at sides between extra takbeers. Shafi\'i / Maliki / Hanbali: hands are folded. Follow your own madhab.',
        madhabNoteUr:
          'حنفی: زائد تکبیروں کے درمیان ہاتھ چھوڑیں۔ شافعی/مالکی/حنبلی: ہاتھ باندھیں۔ اپنے مسلک پر عمل کریں۔',
      },
      {
        id: 'fitr-sal-3',
        title: 'The Khutbah',
        titleUr: 'خطبہ',
        description:
          'The Eid khutbah is delivered AFTER the prayer — unlike Jumu\'ah where it comes before. Listening is Sunnah Mu\'akkadah. The prayer is valid once completed; staying for the khutbah is strongly recommended.',
        descriptionUr:
          'عید کا خطبہ نماز کے بعد ہوتا ہے، جمعہ کی طرح پہلے نہیں۔ خطبہ سننا سنتِ مؤکدہ ہے۔',
        source: 'Muslim 885, Bukhari 962',
      },
      {
        id: 'fitr-sal-4',
        title: 'Location',
        titleUr: 'نماز کی جگہ',
        description:
          'An open ground (eidgah / musalla) is preferred — the consistent Sunnah of the Prophet ﷺ. Praying in a mosque is valid when needed (rain, no open ground available).',
        descriptionUr:
          'عیدگاہ یا کھلے میدان میں نماز پڑھنا سنت ہے۔ مجبوری میں مسجد میں پڑھنا بھی جائز ہے۔',
        source: 'Bukhari 956, Abu Dawud 1158',
        womenNote:
          'Women should attend Eid prayer if they can maintain proper hijab. The Prophet ﷺ explicitly commanded women to come — including those in menses, who should stay away from the prayer area itself.',
        womenNoteUr:
          'خواتین کو بھی عیدگاہ جانا چاہیے اگر پردے کا اہتمام ہو۔ حائضہ خواتین بھی جائیں مگر نماز کی جگہ سے الگ رہیں۔',
      },
    ],
  },
  {
    id: 'fitr-greeting',
    icon: '🤝',
    title: 'Eid Greeting',
    titleUr: 'عید مبارک کہنا',
    masail: [
      {
        id: 'fitr-gr-1',
        title: 'Taqabbalallahu Minna wa Minkum',
        titleUr: 'تقبل اللہ منا و منکم',
        description:
          'The Companions used to greet one another on Eid with this phrase. It is the most authentic Eid greeting from the early Muslims (salaf).',
        descriptionUr:
          'صحابہ کرامؓ عید پر ایک دوسرے کو یہ دعا دیتے تھے۔ یہ سلف سے ثابت سب سے مستند عید مبارک ہے۔',
        dua: {
          arabic: 'تَقَبَّلَ اللّٰهُ مِنَّا وَمِنْكُمْ',
          transliteration: 'Taqabbalallahu Minna wa Minkum',
          translation: 'May Allah accept (good deeds) from us and from you.',
          translationUr: 'اللہ ہم سے اور آپ سے قبول فرمائے۔',
        },
        source: 'Fath ul-Bari (Ibn Hajar), graded hasan',
        tips: [
          'Reply: "Wa minkum, Jazakallahu Khayran"',
          'Handshaking and embracing are permissible',
          'Exchanging gifts on Eid is a praised practice',
        ],
        tipsUr: [
          'جواب میں: "و منکم، جزاکم اللہ خیراً" کہیں',
          'مصافحہ اور معانقہ جائز ہے',
          'عید پر تحائف دینا اچھا عمل ہے',
        ],
      },
    ],
  },
  {
    id: 'fitr-prohibition',
    icon: '⚠️',
    title: 'Prohibitions on Eid ul-Fitr',
    titleUr: 'عیدالفطر پر حرام کام',
    masail: [
      {
        id: 'fitr-pr-1',
        title: 'Fasting is Haram',
        titleUr: 'روزہ حرام ہے',
        description:
          'It is absolutely forbidden (haram) to fast on the day of Eid ul-Fitr (1st Shawwal). This is one of the five permanently prohibited fasting days in Islam.',
        descriptionUr:
          'یکم شوال (عیدالفطر) کو روزہ رکھنا حرام ہے۔ یہ اسلام کے ان پانچ دنوں میں سے ایک ہے جن میں روزہ ہمیشہ ممنوع ہے۔',
        source: 'Bukhari 1991, Muslim 1137',
        important: true,
      },
    ],
  },
];

export const EID_ADHA_SECTIONS: EidSection[] = [
  {
    id: 'adha-preparation',
    icon: '✨',
    title: 'Night & Morning of Eid',
    titleUr: 'شبِ عید اور صبح',
    masail: [
      {
        id: 'adha-prep-1',
        title: 'Do NOT Eat Before Prayer',
        titleUr: 'نماز سے پہلے نہ کھائیں',
        description:
          'Unlike Eid ul-Fitr, it is Sunnah NOT to eat before the Eid ul-Adha prayer. The Prophet ﷺ would eat only after the prayer — and his first meal would be from his qurbani meat.',
        descriptionUr:
          'عیدالاضحی میں نماز سے پہلے نہ کھانا سنت ہے۔ حضور ﷺ پہلے نماز پڑھتے، پھر اپنی قربانی کا گوشت تناول فرماتے۔ یہ عیدالفطر کے برعکس ہے۔',
        source: 'Tirmidhi 542, Ibn Majah 1756',
        important: true,
      },
      {
        id: 'adha-prep-2',
        title: 'Do Not Cut Hair or Nails',
        titleUr: 'بال اور ناخن نہ کاٹیں',
        description:
          'The person intending to perform qurbani should not cut their hair or trim their nails from the 1st of Dhul Hijjah until after the qurbani is done. This Sunnah applies only to the one offering qurbani, not all family members.',
        descriptionUr:
          'جو شخص قربانی کرنا چاہتا ہو، وہ یکم ذوالحجہ سے قربانی تک بال اور ناخن نہ کاٹے۔ یہ حکم صرف قربانی کرنے والے پر ہے، پورے گھر پر نہیں۔',
        source: 'Muslim 1977',
        important: true,
        tips: [
          'Cut hair and nails before the 1st of Dhul Hijjah if you plan qurbani',
        ],
        tipsUr: ['قربانی کی نیت ہو تو یکم ذوالحجہ سے پہلے بال اور ناخن کاٹ لیں'],
      },
      {
        id: 'adha-prep-3',
        title: 'Ghusl, Best Clothes & Ittar',
        titleUr: 'غسل، لباس اور عطر',
        description:
          'Ghusl, wearing best clothes, and applying ittar on Eid ul-Adha carry the same ruling as Eid ul-Fitr — all are established Sunnahs.',
        descriptionUr:
          'عیدالاضحی میں بھی غسل، بہترین لباس اور عطر لگانا وہی سنتیں ہیں جو عیدالفطر میں ہیں۔',
        source: 'Bayhaqi, Muwatta Malik',
        womenNote: 'Wear full hijab. Do not apply perfume when going out.',
        womenNoteUr: 'مکمل پردے میں جائیں اور باہر خوشبو استعمال نہ کریں۔',
      },
    ],
  },
  {
    id: 'adha-takbeer',
    icon: '📣',
    title: 'Takbeer al-Tashreeq',
    titleUr: 'تکبیراتِ تشریق',
    masail: [
      {
        id: 'adha-tb-1',
        title: 'When, How & Who',
        titleUr: 'کب، کیسے اور کس پر',
        description:
          'Recite after every obligatory (fard) salah from Fajr of 9th Dhul Hijjah to Asr of 13th Dhul Hijjah — 23 prayers in total.\n\nHanafi: Wajib on every adult Muslim (praying alone or in congregation).\nShafi\'i / Maliki / Hanbali: Sunnah Mu\'akkadah.\n\nMen recite once audibly; women recite quietly.',
        descriptionUr:
          '۹ ذوالحجہ کی فجر سے ۱۳ ذوالحجہ کی عصر تک ہر فرض نماز کے بعد — کل ۲۳ نمازیں۔\n\nحنفی: ہر بالغ مسلمان پر واجب۔\nمرد ایک بار بلند آواز سے، خواتین آہستہ پڑھیں۔',
        dua: {
          arabic:
            'اللّٰهُ أَكْبَرُ، اللّٰهُ أَكْبَرُ، لَا إِلٰهَ إِلَّا اللّٰهُ، وَاللّٰهُ أَكْبَرُ، اللّٰهُ أَكْبَرُ، وَلِلّٰهِ الْحَمْدُ',
          transliteration:
            'Allahu Akbar, Allahu Akbar, La ilaha illallah, Wallahu Akbar, Allahu Akbar, Wa Lillahil Hamd',
          translation:
            'Allah is the Greatest, Allah is the Greatest, there is no god but Allah, and Allah is the Greatest, Allah is the Greatest, and to Allah belongs all praise.',
          translationUr:
            'اللہ سب سے بڑا ہے، اللہ سب سے بڑا ہے، اللہ کے سوا کوئی معبود نہیں، اللہ سب سے بڑا ہے، اللہ سب سے بڑا ہے، اور تمام تعریفیں اللہ کے لیے ہیں۔',
        },
        source: 'Musannaf Ibn Abi Shaybah (from Umar, Ali, Ibn Masud RA)',
        important: true,
      },
    ],
  },
  {
    id: 'adha-salah',
    icon: '🕌',
    title: 'Eid Prayer',
    titleUr: 'نمازِ عید',
    masail: [
      {
        id: 'adha-sal-1',
        title: 'Same Rules as Eid ul-Fitr',
        titleUr: 'عیدالفطر والی نماز',
        description:
          'The method, time, and rulings of Eid ul-Adha prayer are identical to Eid ul-Fitr: 2 rakats with extra takbeers, no adhan or iqamah, khutbah delivered after the prayer, open ground preferred. Refer to the Eid ul-Fitr section for full details.',
        descriptionUr:
          'عیدالاضحی کی نماز کا طریقہ، وقت اور احکام عیدالفطر جیسے ہیں۔ تفصیل کے لیے عیدالفطر کا سیکشن دیکھیں۔',
        source: 'Muslim 885, Abu Dawud 1149',
      },
    ],
  },
  {
    id: 'adha-qurbani',
    icon: '🐑',
    title: 'Qurbani (Udhiyah)',
    titleUr: 'قربانی',
    masail: [
      {
        id: 'adha-qr-1',
        title: 'Who Must Do Qurbani?',
        titleUr: 'قربانی کس پر واجب ہے؟',
        description:
          'Every adult Muslim who possesses nisab (≈ value of 612g silver in cash) on the days of qurbani must perform it.\n\nHanafi: Wajib. One qurbani suffices for the whole household (head of family acts on behalf of all).\nShafi\'i / Maliki / Hanbali: Sunnah Mu\'akkadah — one per individual adult.',
        descriptionUr:
          'ہر وہ بالغ مسلمان جو قربانی کے دنوں میں نصاب (تقریباً ۶۱۲ گرام چاندی کی قیمت) کے برابر مال رکھتا ہو۔\n\nحنفی: واجب — ایک قربانی پورے گھرانے کی طرف سے کافی ہے۔\nشافعی/مالکی/حنبلی: سنتِ مؤکدہ — ہر بالغ کے لیے الگ۔',
        source: 'Abu Dawud 2788, Ibn Majah 3123',
        important: true,
      },
      {
        id: 'adha-qr-2',
        title: 'Time of Qurbani',
        titleUr: 'قربانی کا وقت',
        description:
          'Qurbani begins after the Eid prayer on 10th Dhul Hijjah and continues until sunset of 13th Dhul Hijjah (3 days, 2 nights). The best time is the 10th, immediately after the Eid prayer.',
        descriptionUr:
          '۱۰ ذوالحجہ کو نمازِ عید کے بعد سے ۱۳ ذوالحجہ کے غروب تک (۳ دن، ۲ راتیں)۔ سب سے بہتر وقت: ۱۰ ذوالحجہ کو نماز کے فوراً بعد۔',
        source: 'Musnad Ahmad, Daraqutni',
        important: true,
      },
      {
        id: 'adha-qr-3',
        title: 'Animals & Minimum Age',
        titleUr: 'جانور اور کم از کم عمر',
        description:
          '• Goat / Sheep — 1 person. Min. 1 full year. (Hanafi: 6+ months if large & healthy)\n• Cow / Buffalo / Bull — up to 7 people. Min. 2 full years.\n• Camel — up to 7 people. Min. 5 full years.\n\nWhen 7 people share a cow or camel, all shares must be for qurbani (or aqeeqah) — not commercial purposes.',
        descriptionUr:
          '• بکرا/بکری/دنبہ — ۱ شخص، کم از کم ۱ سال (حنفی: ۶ ماہ اگر بڑا ہو)\n• گائے/بھینس/بیل — ۷ افراد، کم از کم ۲ سال\n• اونٹ — ۷ افراد، کم از کم ۵ سال\n\nاشتراک میں سب حصے قربانی (یا عقیقہ) کی نیت سے ہوں۔',
        source: 'Muslim 1318, Abu Dawud 2799',
        important: true,
      },
      {
        id: 'adha-qr-4',
        title: 'Conditions — Animal Must Be Sound',
        titleUr: 'جانور کی شرائط',
        description:
          'The animal must be free of major defects:\n✗ Blind in one or both eyes\n✗ Severely lame (cannot walk to slaughter)\n✗ Clearly diseased\n✗ So thin its bones have no marrow\n✗ One-third or more of an ear or tail missing\n\nMinor defects do not invalidate the qurbani but are disliked.',
        descriptionUr:
          'جانور ان عیوب سے پاک ہو:\n✗ ایک یا دونوں آنکھوں سے اندھا\n✗ اتنا لنگڑا کہ چل نہ سکے\n✗ واضح طور پر بیمار\n✗ انتہائی کمزور\n✗ کان یا دم کا ایک تہائی کٹا ہوا\n\nچھوٹے عیوب قربانی کو باطل نہیں کرتے مگر مکروہ ہیں۔',
        source: 'Abu Dawud 2802, Tirmidhi 1497',
      },
      {
        id: 'adha-qr-5',
        title: 'The Slaughter',
        titleUr: 'ذبح کرنا',
        description:
          'Face the animal toward Qibla. Lay small animals on their left side. Recite the dua, then swiftly sever the windpipe, esophagus, and both jugular veins with a sharp knife. Using a blunt knife is haram — it causes undue pain.',
        descriptionUr:
          'جانور کا رخ قبلہ کی طرف کریں۔ چھوٹے جانور کو بائیں کروٹ لٹائیں۔ دعا پڑھ کر تیز دھار چھری سے گردن کی رگیں ایک وار میں کاٹ دیں۔ کند چھری استعمال کرنا حرام ہے۔',
        dua: {
          arabic: 'بِسْمِ اللّٰهِ، اللّٰهُ أَكْبَرُ، اللّٰهُمَّ هٰذَا مِنْكَ وَلَكَ',
          transliteration:
            'Bismillahi Allahu Akbar, Allahumma haaza minka wa laka',
          translation:
            'In the name of Allah, Allah is the Greatest. O Allah, this is from You and for You.',
          translationUr:
            'اللہ کے نام سے، اللہ سب سے بڑا ہے۔ اے اللہ! یہ تیری طرف سے ہے اور تیرے لیے ہے۔',
        },
        source: 'Abu Dawud 2795, Ahmad',
        important: true,
        tips: [
          'Do not sharpen the knife in front of the animal',
          'Do not slaughter one animal in front of another',
          'For someone else\'s qurbani add: "Allahumma taqabbal min [name]"',
        ],
        tipsUr: [
          'جانور کے سامنے چھری تیز نہ کریں',
          'ایک جانور دوسرے کے سامنے ذبح نہ کریں',
          'کسی اور کی طرف سے ہو تو: "اللّٰهُمَّ تَقَبَّلْ مِنْ [نام]" شامل کریں',
        ],
        womenNote: 'Women may perform the slaughter — it is valid and permissible.',
        womenNoteUr: 'خواتین بھی ذبح کر سکتی ہیں — یہ جائز ہے۔',
      },
      {
        id: 'adha-qr-6',
        title: 'Distribution of Meat',
        titleUr: 'گوشت کی تقسیم',
        description:
          'Recommended: Divide into three equal parts — one for yourself, one for relatives / friends, one for the poor. This is recommended (mustahabb), not obligatory.\n\nHanafi: The hide (skin) must not be sold — keep for personal use or give as charity.',
        descriptionUr:
          'مستحب: تین برابر حصے — ایک اپنے لیے، ایک رشتہ داروں/دوستوں کو، ایک فقراء کو۔ یہ تقسیم مستحب ہے، واجب نہیں۔\n\nحنفی: قربانی کی کھال فروخت نہ کریں — ذاتی استعمال یا صدقہ۔',
        source: 'Ibn Qudama, Bukhari 5547',
        tips: [
          'Give the poor\'s share as raw meat so they can cook it themselves',
          'Qurbani meat may be given to non-Muslims in need',
        ],
        tipsUr: [
          'غریبوں کو کچا گوشت دیں تاکہ وہ خود پکا سکیں',
          'غیر مسلم محتاجوں کو بھی دے سکتے ہیں',
        ],
      },
    ],
  },
  {
    id: 'adha-tashreeq',
    icon: '📅',
    title: 'Ayyam al-Tashreeq (11–13 Dhul Hijjah)',
    titleUr: 'ایامِ تشریق',
    masail: [
      {
        id: 'adha-ts-1',
        title: 'Days of Eating, Drinking & Dhikr',
        titleUr: 'کھانے، پینے اور ذکر کے دن',
        description:
          'The 11th, 12th, and 13th of Dhul Hijjah are the Ayyam al-Tashreeq. The Prophet ﷺ said: "These are days of eating, drinking, and dhikr of Allah." (Muslim 1141)\n\nQurbani remains valid on all three days. Takbeer al-Tashreeq continues after every fard salah through Asr of the 13th.',
        descriptionUr:
          '۱۱، ۱۲، ۱۳ ذوالحجہ ایامِ تشریق ہیں — کھانے، پینے اور اللہ کے ذکر کے دن۔\nان تمام دنوں میں قربانی جائز ہے اور تکبیراتِ تشریق جاری رہتی ہیں۔',
        source: 'Muslim 1141',
      },
    ],
  },
  {
    id: 'adha-prohibition',
    icon: '⚠️',
    title: 'Prohibitions',
    titleUr: 'حرام کام',
    masail: [
      {
        id: 'adha-pr-1',
        title: 'Fasting on These 4 Days is Haram',
        titleUr: 'ان چار دنوں میں روزہ حرام',
        description:
          'Fasting on the 10th, 11th, 12th, and 13th of Dhul Hijjah is absolutely forbidden (haram). These four days are among the five permanently prohibited fasting days in Islam.',
        descriptionUr:
          '۱۰، ۱۱، ۱۲ اور ۱۳ ذوالحجہ کو روزہ رکھنا حرام ہے۔ یہ چاروں دن ان پانچ دنوں میں شامل ہیں جن میں روزہ ہمیشہ ممنوع ہے۔',
        source: 'Muslim 1141, Bukhari 1997',
        important: true,
      },
    ],
  },
];

// Approximate Gregorian dates — actual date depends on moon sighting in your region
export type EidDate = {
  name: string;
  nameUr: string;
  date: Date;
  type: 'fitr' | 'adha';
};

export const UPCOMING_EID_DATES: EidDate[] = [
  { name: 'Eid ul-Adha 2026', nameUr: 'عیدالاضحی ۲۰۲۶', date: new Date(2026, 5, 6), type: 'adha' },
  { name: 'Eid ul-Fitr 2027', nameUr: 'عیدالفطر ۲۰۲۷', date: new Date(2027, 2, 20), type: 'fitr' },
  { name: 'Eid ul-Adha 2027', nameUr: 'عیدالاضحی ۲۰۲۷', date: new Date(2027, 4, 27), type: 'adha' },
  { name: 'Eid ul-Fitr 2028', nameUr: 'عیدالفطر ۲۰۲۸', date: new Date(2028, 2, 9), type: 'fitr' },
];
