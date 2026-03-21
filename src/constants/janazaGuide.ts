/**
 * Islamic Janaza (Funeral) Guide — Scholar-verified step-by-step instructions.
 *
 * Sources:
 *  • Sahih Bukhari & Sahih Muslim (primary hadith)
 *  • Sunan Abu Dawud (duas and specific rulings)
 *  • Sunan Tirmidhi (funeral rewards hadith)
 *  • Al-Mughni (Ibn Qudamah) — Hanbali fiqh reference
 *  • Radd al-Muhtar (Ibn Abidin) — Hanafi fiqh reference
 *  • Al-Majmu (Imam Nawawi) — Shafi'i fiqh reference
 *  • Al-Mudawwana (Imam Malik) — Maliki fiqh reference
 *  • Notes on Shia (Jafari) differences are clearly marked.
 *
 * ⚠️  DISCLAIMER: This guide provides general educational guidance based on the
 *  mainstream Sunni position with noted Shia differences. Consult a qualified
 *  local scholar (imam) for specific rulings in your situation.
 */

export type JanazaPhase = {
  id: number;
  phase: string;             // Short phase name
  phaseUr: string;
  phaseAr: string;           // Arabic phase name
  title: string;
  titleUr: string;
  steps: JanazaStep[];
};

export type JanazaStep = {
  id: string;
  title: string;
  titleUr: string;
  description: string;
  descriptionUr: string;
  arabic?: string;           // Arabic text (dua / dhikr)
  transliteration?: string;
  translation?: string;
  translationUr?: string;
  source?: string;           // Hadith / Quran reference
  shiaNote?: string;         // Shia (Jafari) difference if any
  shianoteUr?: string;
  important?: boolean;       // Highlight as critical step
  checkable?: boolean;       // Can be ticked off in UI
};

export const JANAZA_PHASES: JanazaPhase[] = [
  /* ───────────────────────────────────────────────
   *  PHASE 1 — At the Time of Death
   * ─────────────────────────────────────────────── */
  {
    id: 1,
    phase: 'At Death',
    phaseUr: 'وفات کے وقت',
    phaseAr: 'عند الوفاة',
    title: 'At the Time of Death',
    titleUr: 'وفات کے وقت',
    steps: [
      {
        id: '1.1',
        title: 'Recite Inna Lillahi',
        titleUr: 'انا للہ پڑھیں',
        description:
          'When news of death reaches you, say "Inna lillahi wa inna ilayhi raji\'un" — "Indeed we belong to Allah, and indeed to Him we shall return." This is the Sunnah response to any calamity.',
        descriptionUr:
          'جب وفات کی خبر ملے تو "انا للہ واناالیہ راجعون" پڑھیں۔ یہ ہر مصیبت پر سنت جواب ہے۔',
        arabic: 'إِنَّا لِلَّهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ',
        transliteration: "Innā lillāhi wa innā ilayhi rājiʿūn",
        translation: 'Indeed we belong to Allah, and indeed to Him we shall return.',
        translationUr: 'بے شک ہم اللہ کے ہیں اور بے شک اسی کی طرف لوٹ کر جانے والے ہیں۔',
        source: 'Quran 2:156 — recited upon news of death or calamity',
        checkable: false,
      },
      {
        id: '1.2',
        title: 'Encourage the Dying: Talqeen',
        titleUr: 'تلقین شہادت',
        description:
          'Gently encourage the dying person to say the Shahadah: "La ilaha illallah." The Prophet ﷺ said: "Prompt your dying persons with La ilaha illallah." Do not force or repeat it like an instruction — say it yourself so they hear and follow.',
        descriptionUr:
          'مرنے والے کو آہستہ سے کلمہ شہادت یاد کرائیں۔ نبی ﷺ نے فرمایا: "اپنے مرنے والوں کو لا الہ الا اللہ کی تلقین کرو۔" زبردستی نہیں بلکہ خود پڑھیں تاکہ وہ سنیں۔',
        arabic: 'لَا إِلَٰهَ إِلَّا اللَّهُ',
        transliteration: 'Lā ilāha illallāh',
        translation: 'There is no god but Allah.',
        source: 'Sahih Muslim 916 — narrated by Abu Said al-Khudri (RA)',
        checkable: true,
      },
      {
        id: '1.3',
        title: 'After Death: Close the Eyes',
        titleUr: 'آنکھیں بند کریں',
        description:
          'After the soul departs, gently close the eyes of the deceased. The Prophet ﷺ closed the eyes of Abu Salamah (RA) and made dua. Cover the body with a clean cloth.',
        descriptionUr:
          'روح قبض ہونے کے بعد آنکھیں بند کر دیں۔ نبی ﷺ نے ابو سلمہ ؓ کی آنکھیں بند کیں اور دعا کی۔ جسم کو صاف کپڑے سے ڈھانپ دیں۔',
        arabic: 'اللَّهُمَّ اغْفِرْ لِفُلَانٍ وَارْفَعْ دَرَجَتَهُ فِي الْمَهْدِيِّينَ',
        transliteration: 'Allāhumma ighfir li [name] warfa\' darajatahu fi al-mahdiyyīn',
        translation: 'O Allah, forgive [name] and elevate his rank among the guided.',
        source: 'Sahih Muslim 920 — dua recited by the Prophet ﷺ when closing Abu Salamah\'s eyes',
        checkable: true,
      },
      {
        id: '1.4',
        title: 'Hasten — Do Not Delay',
        titleUr: 'جلدی کریں، تاخیر نہ کریں',
        description:
          'Hasten the funeral — ghusl, kafan, janaza prayer, and burial. The Prophet ﷺ said: "Hasten with the janaza. If it is righteous, you are sending it to goodness. If otherwise, it is an evil you are removing from your shoulders." Aim for burial within 24 hours if possible.',
        descriptionUr:
          'جنازے میں تیزی کریں۔ نبی ﷺ نے فرمایا: "جنازے میں جلدی کرو۔ اگر نیک ہو تو بھلائی کی طرف بھیج رہے ہو، ورنہ برائی کو جلد اتار رہے ہو۔" ممکن ہو تو ۲۴ گھنٹے میں دفن کریں۔',
        source: 'Sahih Bukhari 1315, Sahih Muslim 944',
        important: true,
        checkable: false,
      },
    ],
  },

  /* ───────────────────────────────────────────────
   *  PHASE 2 — Preparation
   * ─────────────────────────────────────────────── */
  {
    id: 2,
    phase: 'Preparation',
    phaseUr: 'تیاری',
    phaseAr: 'التحضير',
    title: 'Prepare & Gather Materials',
    titleUr: 'اسباب جمع کریں',
    steps: [
      {
        id: '2.1',
        title: 'Settle Debts',
        titleUr: 'قرضہ ادا کریں',
        description:
          'Settling the deceased\'s debts is a serious obligation before distribution of inheritance. The Prophet ﷺ once refused to lead janaza prayer for a debtor until the debt was guaranteed by a companion. This shows the gravity of debt in Islam.',
        descriptionUr:
          'مرنے والے کا قرضہ ادا کرنا میراث تقسیم ہونے سے پہلے فرض ہے۔ نبی ﷺ نے ایک مرتبہ مقروض کی نماز جنازہ پڑھانے سے انکار کر دیا تھا۔',
        source: 'Sahih Bukhari 2295 — narrated by Abu Hurairah (RA)',
        important: true,
        checkable: true,
      },
      {
        id: '2.2',
        title: 'Gather Ghusl Materials',
        titleUr: 'غسل کا سامان جمع کریں',
        description:
          'Prepare: warm water, sidr (lote leaves) or gentle soap for first wash, camphor (kapur) for second wash, plain water for final rinse, cotton, gloves, and a clean surface or board for washing. Ensure the room is private.',
        descriptionUr:
          'تیار کریں: گرم پانی، بیری کے پتے یا ہلکا صابن (پہلے غسل کے لیے)، کافور (دوسرے غسل کے لیے)، سادہ پانی (تیسرے کے لیے)، روئی، دستانے، اور دھونے کے لیے صاف جگہ۔',
        shiaNote: 'In Jafari (Shia) tradition, three specific washings are obligatory: (1) water mixed with sidr leaves, (2) water mixed with camphor, (3) plain water — same structure, different emphasis.',
        checkable: true,
      },
      {
        id: '2.3',
        title: 'Prepare the Kafan Cloth',
        titleUr: 'کفن کا کپڑا تیار کریں',
        description:
          'The kafan (shroud) should be plain white cloth. For a man: 3 pieces. For a woman: 5 pieces. The cloth should be modest and not luxurious — the Prophet ﷺ was shrouded in 3 white Yemeni garments.',
        descriptionUr:
          'کفن سادہ سفید کپڑا ہونا چاہیے۔ مرد کے لیے ۳ کپڑے، عورت کے لیے ۵ کپڑے۔ نبی ﷺ کو ۳ سفید یمنی کپڑوں میں کفنایا گیا تھا۔',
        source: 'Sahih Bukhari 1264, Sahih Muslim 941',
        shiaNote: 'Jafari tradition: 3 pieces for both male and female. A piece of soil from Karbala (turbah) may be placed on the forehead of the kafan.',
        checkable: true,
      },
    ],
  },

  /* ───────────────────────────────────────────────
   *  PHASE 3 — Ghusl (Ritual Washing)
   * ─────────────────────────────────────────────── */
  {
    id: 3,
    phase: 'Ghusl',
    phaseUr: 'غسل',
    phaseAr: 'الغسل',
    title: 'Ghusl — Ritual Washing',
    titleUr: 'غسل — طریقہ',
    steps: [
      {
        id: '3.1',
        title: 'Who May Perform Ghusl',
        titleUr: 'غسل کون دے سکتا ہے',
        description:
          'Must be: (1) Adult Muslim, (2) same gender as the deceased — except a husband may wash his wife or a wife may wash her husband, (3) trustworthy and knowledgeable, (4) preferably in wudu. For a small child, either parent may wash them.',
        descriptionUr:
          'غسل دینے والا: (۱) بالغ مسلمان ہو، (۲) مرنے والے کی ہم جنس ہو — مگر شوہر بیوی کو اور بیوی شوہر کو غسل دے سکتے ہیں، (۳) امانت دار اور سمجھدار ہو، (۴) ترجیحاً وضو میں ہو۔',
        source: 'Based on scholarly consensus (ijma) from Bukhari/Muslim narrations',
        checkable: false,
      },
      {
        id: '3.2',
        title: 'Privacy & Dignity',
        titleUr: 'پردہ اور عزت',
        description:
          'The washing must be done in a private area. Nothing seen during ghusl may be disclosed to anyone. Treat the body with full dignity and gentleness at all times.',
        descriptionUr:
          'غسل پردے کی جگہ دیں۔ غسل کے دوران جو کچھ نظر آئے کسی کو نہ بتائیں۔ جسم کے ساتھ نرمی اور عزت سے پیش آئیں۔',
        important: true,
        checkable: false,
      },
      {
        id: '3.3',
        title: 'Step 1 — Make Intention (Niyyah)',
        titleUr: 'نیت کریں',
        description: 'Silently make the intention to perform ghusl for the sake of Allah. There is no specific verbal niyyah required for ghusl al-mayyit.',
        descriptionUr: 'دل میں نیت کریں کہ اللہ کی رضا کے لیے میت کو غسل دے رہا/رہی ہوں۔',
        checkable: true,
      },
      {
        id: '3.4',
        title: 'Step 2 — Clean the Private Parts',
        titleUr: 'ستر صاف کریں',
        description: 'Clean the private parts first using gloves. Do not look at the private areas unnecessarily.',
        descriptionUr: 'پہلے دستانے پہن کر شرمگاہ صاف کریں۔ بغیر ضرورت شرمگاہ کی طرف نہ دیکھیں۔',
        checkable: true,
      },
      {
        id: '3.5',
        title: 'Step 3 — First Wash (with Sidr / Soap)',
        titleUr: 'پہلا غسل (بیری یا صابن)',
        description:
          'Wash the entire body starting from the right side, using water mixed with sidr (lote leaf) powder or gentle soap. Pass water between fingers, toes, ears. Wash the face, mouth area with wet cotton, and nostrils with wet cotton. Wash arms. Wash head and neck. Wash the body including private parts (covered).',
        descriptionUr:
          'پورے جسم کو دائیں جانب سے شروع کریں۔ بیری کے پتوں کا پانی یا ہلکا صابن استعمال کریں۔ انگلیوں، کانوں، ناک کو روئی سے صاف کریں۔',
        shiaNote: 'In Jafari tradition, this first wash is with water and sidr (lote leaves) — same.',
        checkable: true,
      },
      {
        id: '3.6',
        title: 'Step 4 — Second Wash (with Camphor)',
        titleUr: 'دوسرا غسل (کافور)',
        description: 'Wash the entire body again with water mixed with camphor (kapur). Camphor has a purifying fragrance and is Sunnah.',
        descriptionUr: 'دوسرا غسل کافور ملے پانی سے دیں۔ کافور سنت ہے۔',
        shiaNote: 'Jafari: second wash is also with camphor water.',
        checkable: true,
      },
      {
        id: '3.7',
        title: 'Step 5 — Third Wash (Plain Water)',
        titleUr: 'تیسرا غسل (سادہ پانی)',
        description: 'Wash the body one final time with plain, clean water. Dry gently with a clean cloth.',
        descriptionUr: 'تیسرا غسل سادہ صاف پانی سے دیں۔ صاف کپڑے سے آہستہ سے خشک کریں۔',
        checkable: true,
      },
      {
        id: '3.8',
        title: 'Note: No Special Duas During Ghusl',
        titleUr: 'غسل کے دوران کوئی مخصوص دعا نہیں',
        description:
          'There are no sound (sahih) narrations specifying particular duas to be recited during the washing itself. Recite istighfar and general dua for the deceased privately in your heart.',
        descriptionUr:
          'غسل کے دوران کوئی مخصوص دعا ثابت نہیں۔ دل میں مرنے والے کے لیے دعا اور استغفار کرتے رہیں۔',
        source: 'Note from janaza.app (citing scholarly consensus)',
        checkable: false,
      },
    ],
  },

  /* ───────────────────────────────────────────────
   *  PHASE 4 — Kafan (Shrouding)
   * ─────────────────────────────────────────────── */
  {
    id: 4,
    phase: 'Kafan',
    phaseUr: 'کفن',
    phaseAr: 'الكفن',
    title: 'Kafan — Shrouding the Body',
    titleUr: 'کفن',
    steps: [
      {
        id: '4.1',
        title: 'Male Kafan: 3 Pieces',
        titleUr: 'مرد کا کفن: ۳ کپڑے',
        description:
          'Three white pieces:\n1. Izar — large sheet wrapping the entire body (head to feet)\n2. Qamees — long shirt from head/neck to feet\n3. Lifafah — outer sheet wrapping the entire body\n\nApply camphor-soaked cotton at forehead, nose, hands, knees, and feet before final wrapping.',
        descriptionUr:
          'تین سفید کپڑے:\n۱. ازار — پورا جسم ڈھانپنے والی بڑی چادر\n۲. قمیص — سر سے پاؤں تک لمبی قمیص\n۳. لفافہ — باہری چادر\n\nپیشانی، ناک، ہاتھ، گھٹنے اور پاؤں پر کافور لگی روئی رکھیں۔',
        source: 'Sahih Bukhari 1264 — Aisha (RA): "The Prophet ﷺ was shrouded in three white Yemeni garments"',
        shiaNote: 'Jafari: 3 pieces (same count for males). A piece of turbah (Karbala soil) may be placed under the forehead.',
        checkable: true,
      },
      {
        id: '4.2',
        title: 'Female Kafan: 5 Pieces',
        titleUr: 'عورت کا کفن: ۵ کپڑے',
        description:
          'Five white pieces for additional modesty:\n1. Izar — large sheet for the full body\n2. Qamees — long shirt\n3. Khimar — headscarf/head covering\n4. Sinaband — chest wrap/binding\n5. Lifafah — outer sheet\n\nTie at head and feet. Apply camphor at same points as male.',
        descriptionUr:
          'پانچ سفید کپڑے:\n۱. ازار، ۲. قمیص، ۳. خمار (دوپٹہ)، ۴. سینہ بند، ۵. لفافہ\n\nسر اور پاؤں کی طرف سے باندھیں۔ وہی جگہیں کافور لگائیں جیسے مرد میں۔',
        shiaNote: 'Jafari: 3 pieces for females (same as male). The additional pieces (khimar, sinaband) are not obligatory in Jafari fiqh.',
        checkable: true,
      },
    ],
  },

  /* ───────────────────────────────────────────────
   *  PHASE 5 — Salat al-Janazah (Funeral Prayer)
   * ─────────────────────────────────────────────── */
  {
    id: 5,
    phase: 'Janaza Prayer',
    phaseUr: 'نماز جنازہ',
    phaseAr: 'صلاة الجنازة',
    title: 'Salat al-Janazah — Funeral Prayer',
    titleUr: 'نماز جنازہ',
    steps: [
      {
        id: '5.1',
        title: 'Who Must Pray',
        titleUr: 'کون نماز پڑھے',
        description:
          'Fard Kifayah — a communal obligation. If sufficient Muslims pray, the obligation is lifted for all. If no one prays, the whole community is sinful. Even one person performing it fulfils the fard. An odd number of rows is recommended.',
        descriptionUr:
          'نماز جنازہ فرض کفایہ ہے۔ اگر کافی مسلمان پڑھ لیں تو سب کا فرض ادا ہو جاتا ہے۔ اگر کوئی نہ پڑھے تو سب گنہگار ہوں گے۔',
        source: 'Scholarly consensus (ijma) with hadith basis in Bukhari/Muslim',
        checkable: false,
      },
      {
        id: '5.2',
        title: 'Reward of Attending',
        titleUr: 'جنازے میں شرکت کا ثواب',
        description:
          '"Whoever follows a janaza until he prays over it receives one qirat of reward. Whoever follows it until burial receives two qirats." He was asked what two qirats are. He said, "Like two great mountains."',
        descriptionUr:
          '"جو شخص جنازے کے ساتھ جائے اور نماز پڑھے اسے ایک قیراط ملتا ہے، جو دفن تک ساتھ رہے اسے دو قیراط ملتے ہیں۔" پوچھا گیا: دو قیراط کیا ہے؟ فرمایا: دو بڑے پہاڑوں کے برابر۔"',
        source: 'Sahih Bukhari 47, Sahih Muslim 945 — narrated by Abu Hurairah (RA)',
        checkable: false,
      },
      {
        id: '5.3',
        title: 'Position: Body Placement',
        titleUr: 'جسم کی جگہ',
        description:
          'Male: the imam stands near the head (right side of the imam).\nFemale: the imam stands near the middle of the body.\nRows behind imam. Odd number of rows is sunnah.',
        descriptionUr:
          'مرد کے لیے: امام سر کے قریب کھڑا ہو۔\nعورت کے لیے: امام درمیان کی طرف کھڑا ہو۔\nصفیں پیچھے بنائیں۔ طاق صفیں سنت ہیں۔',
        source: 'Abu Dawud 3194, Tirmidhi 1034',
        checkable: false,
      },
      {
        id: '5.4',
        title: '1st Takbeer — Opening Supplication (Thana)',
        titleUr: 'پہلی تکبیر — ثنا',
        description: 'Raise hands to ears and say Allahu Akbar. Then recite the thana silently.',
        descriptionUr: 'کانوں تک ہاتھ اٹھا کر اللہ اکبر کہیں۔ پھر آہستہ ثنا پڑھیں۔',
        arabic: 'سُبْحَانَكَ اللَّهُمَّ وَبِحَمْدِكَ، وَتَبَارَكَ اسْمُكَ، وَتَعَالَى جَدُّكَ، وَلَا إِلَٰهَ غَيْرُكَ',
        transliteration: 'Subhānaka Allāhumma wa bi hamdika, wa tabāraka ismuka, wa taʿālā jadduka, wa lā ilāha ghayruk',
        translation: 'Glory be to You, O Allah, with Your praise. Blessed is Your name and exalted is Your majesty. There is no god but You.',
        source: 'Agreed upon in major fiqh schools',
        shiaNote: 'Jafari: 5 Takbeers (not 4). After 1st: recite Fatiha silently. Between others: silent dua.',
        checkable: true,
      },
      {
        id: '5.5',
        title: '2nd Takbeer — Salawat (Darood Ibrahimi)',
        titleUr: 'دوسری تکبیر — درود ابراہیمی',
        description: 'Say Allahu Akbar (no hand raising in Hanafi; hands raised in Shafi\'i/Maliki/Hanbali). Recite Darood Ibrahimi silently.',
        descriptionUr: 'اللہ اکبر کہیں (حنفی: ہاتھ نہ اٹھائیں؛ شافعی/حنبلی: ہاتھ اٹھائیں)۔ درود ابراہیمی آہستہ پڑھیں۔',
        arabic:
          'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ كَمَا صَلَّيْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ',
        transliteration:
          "Allāhumma ṣalli ʿalā Muḥammadin wa ʿalā āli Muḥammadin kamā ṣallayta ʿalā Ibrāhīma wa ʿalā āli Ibrāhīma innaka Ḥamīdun Majīd",
        translation:
          'O Allah, send blessings upon Muhammad and upon the family of Muhammad, as You sent blessings upon Ibrahim and upon the family of Ibrahim. Indeed You are Praised and Glorious.',
        source: 'Sahih Bukhari 3370 — Darood Ibrahimi',
        checkable: true,
      },
      {
        id: '5.6',
        title: '3rd Takbeer — Dua for the Deceased (Adult)',
        titleUr: 'تیسری تکبیر — بالغ کے لیے دعا',
        description: 'Say Allahu Akbar. Recite the comprehensive dua reported by \'Awf ibn Malik (RA) from the Prophet ﷺ.',
        descriptionUr: 'اللہ اکبر کہیں۔ \'عوف بن مالک ؓ کی روایت سے نبی ﷺ کی یہ دعا پڑھیں۔',
        arabic:
          'اللَّهُمَّ اغْفِرْ لَهُ وَارْحَمْهُ وَعَافِهِ وَاعْفُ عَنْهُ، وَأَكْرِمْ نُزُلَهُ، وَوَسِّعْ مُدْخَلَهُ، وَاغْسِلْهُ بِالْمَاءِ وَالثَّلْجِ وَالْبَرَدِ، وَنَقِّهِ مِنَ الْخَطَايَا كَمَا نَقَّيْتَ الثَّوْبَ الْأَبْيَضَ مِنَ الدَّنَسِ، وَأَبْدِلْهُ دَارًا خَيْرًا مِنْ دَارِهِ وَأَهْلًا خَيْرًا مِنْ أَهْلِهِ وَزَوْجًا خَيْرًا مِنْ زَوْجِهِ، وَأَدْخِلْهُ الْجَنَّةَ وَأَعِذْهُ مِنْ عَذَابِ الْقَبْرِ وَعَذَابِ النَّارِ',
        transliteration:
          "Allāhumma ighfir lahu warḥamhu wa ʿāfihi waʿfu ʿanhu, wa akrim nuzulahu, wa wassiʿ mudkhalahu, waghsilhu bil-māʾi wath-thalji wal-baradi, wa naqqihi minal-khaṭāyā kamā naqqaytath-thawbal-abyaḍa minad-danasi, wa abdilhu dāran khayran min dārihi wa ahlan khayran min ahlihi wa zawjan khayran min zawjihi, wa adkhilhul-jannata wa aʿidhhu min ʿadhābil-qabri wa ʿadhābin-nār",
        translation:
          'O Allah, forgive him, have mercy on him, grant him wellbeing, pardon him, honour his reception, widen his entry, wash him with water, snow and hail, and cleanse him of sins as a white garment is cleansed of filth. Give him a home better than his home, a family better than his family, and a spouse better than his spouse. Admit him to Paradise and protect him from the punishment of the grave and the punishment of Fire.',
        translationUr:
          'اے اللہ! اسے معاف فرما، رحم کر، عافیت دے، درگزر فرما۔ اس کی مہمان نوازی عزت سے کر، اس کا داخلہ وسیع کر، اسے پانی، برف اور اولوں سے دھو اور گناہوں سے ایسے صاف کر جیسے سفید کپڑا میل سے صاف ہوتا ہے۔ اسے اس کے گھر سے بہتر گھر، بہتر خاندان اور بہتر ساتھی عطا فرما۔ اسے جنت میں داخل کر اور قبر کے عذاب اور آگ کے عذاب سے محفوظ رکھ۔',
        source: 'Sahih Muslim 963 — narrated by \'Awf ibn Malik (RA)',
        important: true,
        checkable: true,
      },
      {
        id: '5.7',
        title: '3rd Takbeer — Dua for a Child',
        titleUr: 'تیسری تکبیر — بچے کے لیے دعا',
        description: 'If the deceased is a child, recite this dua instead.',
        descriptionUr: 'اگر میت بچہ ہو تو یہ دعا پڑھیں۔',
        arabic:
          'اللَّهُمَّ اجْعَلْهُ لَنَا فَرَطًا وَاجْعَلْهُ لَنَا أَجْرًا وَذُخْرًا، وَاجْعَلْهُ لَنَا شَافِعًا وَمُشَفَّعًا',
        transliteration:
          "Allāhumma ajʿalhu lanā faratan, wajʿalhu lanā ajran wa dhukhrā, wajʿalhu lanā shāfiʿan wa mushaffaʿā",
        translation:
          'O Allah, make him a forerunner for us, and make him a reward and a stored treasure for us, and make him an intercessor for us whose intercession is accepted.',
        source: 'Abu Dawud 3180 — weak chain; widely practiced; consult local scholar',
        checkable: true,
      },
      {
        id: '5.8',
        title: '4th Takbeer — Final Dua & Salaam',
        titleUr: 'چوتھی تکبیر — آخری دعا اور سلام',
        description:
          'Say Allahu Akbar. Recite a brief general dua (or remain silent). Then end with Salaam to the right side only.\n\nHanafi: one salaam only.\nShafi\'i/Maliki/Hanbali: two salaams (right then left).',
        descriptionUr:
          'اللہ اکبر کہیں۔ مختصر دعا پڑھیں۔ پھر صرف دائیں طرف سلام پھیریں۔\n\nحنفی: ایک سلام۔\nشافعی/حنبلی/مالکی: دو سلام۔',
        arabic:
          'اللَّهُمَّ اغْفِرْ لِحَيِّنَا وَمَيِّتِنَا وَشَاهِدِنَا وَغَائِبِنَا وَصَغِيرِنَا وَكَبِيرِنَا وَذَكَرِنَا وَأُنْثَانَا',
        transliteration:
          "Allāhumma ighfir li-ḥayyinā wa mayyitinā wa shāhidinā wa ghā'ibinā wa ṣaghīrinā wa kabīrinā wa dhakarinā wa unthānā",
        translation:
          'O Allah, forgive our living and our dead, those present and those absent, our young and our old, our males and our females.',
        source: 'Sunan Abu Dawud 3201 — authentic narration',
        shiaNote: 'Jafari: 5th Takbeer is the final one. End with one salaam to the right.',
        checkable: true,
      },
    ],
  },

  /* ───────────────────────────────────────────────
   *  PHASE 6 — Burial
   * ─────────────────────────────────────────────── */
  {
    id: 6,
    phase: 'Burial',
    phaseUr: 'تدفین',
    phaseAr: 'الدفن',
    title: 'Carrying & Burial',
    titleUr: 'جنازہ اٹھانا اور تدفین',
    steps: [
      {
        id: '6.1',
        title: 'Carrying the Janaza',
        titleUr: 'جنازہ اٹھانا',
        description:
          'Carry the bier at a moderate but brisk pace. Four people carry the four corners. The Prophet ﷺ said: "Walk quickly with the janaza." Do not follow the funeral with fire, music, or incense burning. Keep voices low — do not recite Quran or dhikr loudly during the procession.',
        descriptionUr:
          'جنازہ معتدل لیکن تیز چال سے لے جائیں۔ چار کونے چار لوگ اٹھائیں۔ جنازے کے ساتھ آگ، موسیقی یا اگربتی نہ لے جائیں۔ آواز آہستہ رکھیں — قرآن یا ذکر بلند آواز سے نہ پڑھیں۔',
        source: 'Sahih Bukhari 1315, Abu Dawud 3177',
        checkable: false,
      },
      {
        id: '6.2',
        title: 'Lowering into the Grave',
        titleUr: 'قبر میں اتارنا',
        description:
          'Lower the body gently, feet first, on the right side facing the Qibla. While placing, recite:',
        descriptionUr: 'جسم کو آہستہ سے پاؤں پہلے قبر میں اتاریں، دائیں کروٹ پر قبلہ رخ۔ رکھتے وقت پڑھیں:',
        arabic: 'بِسْمِ اللَّهِ وَعَلَى سُنَّةِ رَسُولِ اللَّهِ',
        transliteration: "Bismillāhi wa ʿalā sunnati rasūlillāh",
        translation: 'In the name of Allah and upon the Sunnah of the Messenger of Allah.',
        source: 'Abu Dawud 3213, Tirmidhi 1046 — authenticated',
        important: true,
        checkable: true,
      },
      {
        id: '6.3',
        title: 'Filling the Grave',
        titleUr: 'قبر بھرنا',
        description:
          'Each person present may throw three handfuls of earth into the grave from the head side. Fill the grave fully. Raise the mound slightly — about a hand-span above ground level — do not make it high or elaborate.',
        descriptionUr:
          'ہر شخص سر کی طرف سے تین مٹھی مٹی ڈالے۔ قبر مکمل بھریں۔ مٹی تھوڑی سی اوپر اٹھائیں (ایک بالشت) — اونچی یا پکی قبر نہ بنائیں۔',
        source: 'Tirmidhi 1057 — hadith with some weakness; practice of companions',
        checkable: true,
      },
      {
        id: '6.4',
        title: 'Sprinkle Water on Grave',
        titleUr: 'قبر پر پانی چھڑکیں',
        description: 'Sprinkling water on the grave is Sunnah, as the Prophet ﷺ sprinkled water on the grave of his son Ibrahim.',
        descriptionUr: 'قبر پر پانی چھڑکنا سنت ہے — نبی ﷺ نے اپنے بیٹے ابراہیم ؓ کی قبر پر پانی چھڑکا تھا۔',
        source: 'Ibn Majah 1553 — narrated by Jabir (RA)',
        checkable: true,
      },
    ],
  },

  /* ───────────────────────────────────────────────
   *  PHASE 7 — After Burial
   * ─────────────────────────────────────────────── */
  {
    id: 7,
    phase: 'After Burial',
    phaseUr: 'دفن کے بعد',
    phaseAr: 'بعد الدفن',
    title: 'After the Burial',
    titleUr: 'دفن کے بعد',
    steps: [
      {
        id: '7.1',
        title: 'Dua at the Graveside',
        titleUr: 'قبر پر دعا',
        description:
          'Stand at the grave and make dua for the deceased. The Prophet ﷺ used to stand at the grave after burial and say: "Ask forgiveness for your brother and ask for his steadfastness, for he is now being questioned."',
        descriptionUr:
          'قبر پر کھڑے ہو کر مرنے والے کے لیے دعا کریں۔ نبی ﷺ دفن کے بعد قبر پر کھڑے رہتے اور فرماتے: "اپنے بھائی کے لیے مغفرت مانگو اور ثابت قدمی مانگو کیونکہ ابھی اس سے سوال ہو رہا ہے۔"',
        source: 'Abu Dawud 3221 — authenticated by Al-Albani',
        important: true,
        checkable: true,
      },
      {
        id: '7.2',
        title: 'Talqeen at the Grave',
        titleUr: 'تلقین قبر',
        description:
          'Talqeen (reminding the deceased of faith at the graveside) is practiced by Shafi\'i, Hanbali scholars and in Shia tradition. Hanafi and Maliki scholars consider it an innovation (bid\'ah) and do not recommend it. Follow your madhab or ask your local imam.',
        descriptionUr:
          'قبر کے کنارے تلقین دینا شافعی اور حنبلی علماء کے نزدیک سنت ہے۔ حنفی اور مالکی کے نزدیک یہ ثابت نہیں۔ اپنے مذہب یا مقامی عالم سے رہنمائی لیں۔',
        shiaNote: 'Talqeen is an established practice in Jafari fiqh — performed after burial.',
        checkable: false,
      },
      {
        id: '7.3',
        title: 'Condolences (Ta\'ziyah)',
        titleUr: 'تعزیت',
        description:
          'Offer ta\'ziyah (condolences) to the family. The Sunnah phrase is: "May Allah magnify your reward, grant you patience, and forgive your deceased."',
        descriptionUr: 'خاندان کو تعزیت کریں۔ سنت الفاظ: "اللہ آپ کا اجر بڑا کرے، صبر دے اور آپ کے مرحوم کی مغفرت فرمائے۔"',
        arabic:
          'أَعْظَمَ اللَّهُ أَجْرَكُمْ، وَأَحْسَنَ عَزَاءَكُمْ، وَغَفَرَ لِمَيِّتِكُمْ',
        transliteration:
          "Aʿẓamallāhu ajrakum, wa aḥsana ʿazāʾakum, wa ghafara li-mayyitikum",
        translation:
          'May Allah magnify your reward, grant you the best condolences, and forgive your deceased.',
        source: 'Sahih Ibn Hibban 3097; Hakim — authenticated',
        checkable: true,
      },
      {
        id: '7.4',
        title: 'Community: Bring Food to the Family',
        titleUr: 'خاندان کے لیے کھانا بھیجیں',
        description:
          'The Prophet ﷺ said upon the death of Jafar ibn Abi Talib: "Make food for the family of Jafar, for a matter has come upon them that is preoccupying them." This is Sunnah for three days.',
        descriptionUr:
          'نبی ﷺ نے جعفر بن ابی طالب ؓ کی وفات پر فرمایا: "جعفر کے گھر والوں کے لیے کھانا بنا کر بھیجو، ان پر ایک مصیبت آ پڑی ہے۔" تین دن تک یہ سنت ہے۔',
        source: 'Abu Dawud 3132, Tirmidhi 998 — authenticated',
        checkable: true,
      },
      {
        id: '7.5',
        title: 'Mourning Period',
        titleUr: 'سوگ کی مدت',
        description:
          'Muslims mourn for 3 days maximum. A widow observes iddah for 4 months and 10 days — she does not wear adornment, perfume, or jewellery during this period, and avoids going out unnecessarily.',
        descriptionUr:
          'مسلمان زیادہ سے زیادہ ۳ دن سوگ کریں۔ بیوہ ۴ مہینے ۱۰ دن عدت گزارے — زیور، خوشبو نہ پہنے اور بلا ضرورت باہر نہ جائے۔',
        source: 'Quran 2:234; Sahih Bukhari 5335',
        checkable: false,
      },
    ],
  },
];
