/**
 * Hajj Guide — complete step-by-step for all five days of Hajj.
 *
 * NOTE: This covers Hajj al-Tamattu' (most common for international pilgrims)
 * where Umrah is performed first, then Hajj. For Hajj al-Ifrad and Hajj al-Qiran,
 * consult a local scholar.
 *
 * Sources:
 *  • Sahih Bukhari & Sahih Muslim (primary hadith)
 *  • Sunan Abu Dawud, Tirmidhi, Nasa'i
 *  • Al-Mughni (Ibn Qudamah) — Hanbali
 *  • Radd al-Muhtar (Ibn Abidin) — Hanafi
 *  • Al-Majmu (Imam Nawawi) — Shafi'i
 *
 * ⚠️  DISCLAIMER: This guide is for educational purposes. Consult a qualified
 *  scholar or your Hajj group leader for specific rulings.
 */

export type HajjStep = {
  id: number;
  day: string;
  dayUr: string;
  dayAr: string;
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

export const HAJJ_STEPS: HajjStep[] = [
  /* ─── BEFORE HAJJ ─── */
  {
    id: 1,
    day: 'Before Hajj',
    dayUr: 'حج سے پہلے',
    dayAr: 'قبل الحج',
    title: 'Prepare & Make Intention',
    titleUr: 'تیاری اور نیت',
    icon: '🌙',
    description:
      'Hajj is the 5th pillar of Islam — obligatory once in a lifetime for those who can afford it. Before departing: settle all debts, write a will, seek forgiveness from people, make sincere tawbah, and ensure all expenses are from halal income. The Prophet ﷺ said: "Whoever performs Hajj and does not utter obscene speech or commit sin, he returns like the day his mother bore him." (Bukhari 1521)',
    descriptionUr:
      'حج اسلام کا پانچواں رکن ہے — زندگی میں ایک بار ان پر فرض ہے جو استطاعت رکھیں۔ روانگی سے پہلے: تمام قرضے ادا کریں، وصیت لکھیں، لوگوں سے معافی مانگیں، سچی توبہ کریں، اور خرچ حلال کمائی سے ہو۔',
    dua: {
      arabic: 'اَللّٰهُمَّ إِنِّيْ أُرِيْدُ الْحَجَّ فَيَسِّرْهُ لِيْ وَتَقَبَّلْهُ مِنِّيْ',
      transliteration: "Allahumma inni uridu al-Hajja fa-yassirhu li wa taqabbalhu minni",
      translation: 'O Allah, I intend to perform Hajj — make it easy for me and accept it from me.',
      translationUr: 'اے اللہ، میں حج کا ارادہ رکھتا ہوں — اسے میرے لیے آسان فرما اور قبول فرما۔',
    },
    tips: [
      'Ensure all debts are settled and a will is written',
      'Hajj money must be from halal sources',
      'Learn the Hajj rituals before you travel — it reduces stress',
      'Register with your Hajj group and attend briefings',
      'Pack simple: ihram, toiletries, comfortable sandals, medicines',
    ],
    tipsUr: [
      'تمام قرضے ادا کریں اور وصیت لکھیں',
      'حج کا خرچ حلال کمائی سے ہو',
      'سفر سے پہلے حج کے مناسک سیکھ لیں — پریشانی کم ہوگی',
      'اپنے حج گروپ میں رجسٹر ہوں اور بریفنگ میں شرکت کریں',
      'سادہ سامان لے جائیں: احرام، صابن، آرام دہ چپل، ادویات',
    ],
  },
  {
    id: 2,
    day: 'Before Hajj',
    dayUr: 'حج سے پہلے',
    dayAr: 'قبل الحج',
    title: "Enter Ihram for Hajj (Tamattu')",
    titleUr: 'احرام حج باندھنا (تمتع)',
    icon: '🤍',
    description:
      'On the 8th of Dhul Hijjah (Day of Tarwiyah), enter ihram again from your hotel in Makkah. Perform ghusl, wear ihram garments, and make intention specifically for Hajj: "Labbayk Allahumma Hajjan." Then begin reciting the Talbiyah continuously.',
    descriptionUr:
      '۸ ذوالحجہ (یوم الترویہ) کو مکہ میں اپنے ہوٹل سے دوبارہ احرام باندھیں۔ غسل کریں، احرام پہنیں، اور حج کی نیت کریں: "لبیک اللہم حجاً۔" پھر مسلسل تلبیہ پڑھتے رہیں۔',
    dua: {
      arabic: 'لَبَّيْكَ اللّٰهُمَّ حَجًّا',
      transliteration: "Labbayk Allahumma Hajjan",
      translation: 'Here I am, O Allah, for Hajj.',
      translationUr: 'حاضر ہوں اے اللہ، حج کے لیے۔',
    },
    tips: [
      'Tamattu: Umrah first, then exit ihram, then re-enter for Hajj on 8th',
      'Ifrad: Hajj only, no Umrah before. Qiran: both together without exiting ihram',
      'Most international pilgrims do Tamattu — a sacrifice (hady) is required',
      'Keep reciting Talbiyah from ihram until you throw stones on 10th',
    ],
    tipsUr: [
      'تمتع: پہلے عمرہ، پھر احرام کھولیں، پھر ۸ تاریخ کو حج کا احرام',
      'افراد: صرف حج۔ قران: دونوں ایک ساتھ بغیر احرام کھولے',
      'زیادہ تر بین الاقوامی حاجی تمتع کرتے ہیں — قربانی فرض ہے',
      '۱۰ تاریخ کو پتھر مارنے تک تلبیہ پڑھتے رہیں',
    ],
  },

  /* ─── 8TH DHUL HIJJAH: MINA ─── */
  {
    id: 3,
    day: '8th Dhul Hijjah — Mina',
    dayUr: '۸ ذوالحجہ — منیٰ',
    dayAr: '٨ ذو الحجة — منى',
    title: 'Travel to Mina & Stay the Night',
    titleUr: 'منیٰ روانگی اور رات قیام',
    icon: '⛺',
    description:
      'Travel to the tent city of Mina (approx. 5 km from Makkah). Pray all five daily prayers there — Dhuhr, Asr, Maghrib, Isha, and Fajr — each shortened (2 rakat instead of 4) but NOT combined. Spend the day and night in worship: Quran, dhikr, dua, and istighfar. This is the Day of Tarwiyah.',
    descriptionUr:
      'منیٰ (مکہ سے تقریباً ۵ کلومیٹر) کی خیمہ بستی میں جائیں۔ پانچوں نمازیں پڑھیں — قصر (۴ رکعت والی ۲ رکعت) مگر جمع نہیں۔ دن اور رات عبادت میں گزاریں: قرآن، ذکر، دعا، استغفار۔ یہ یوم الترویہ ہے۔',
    tips: [
      'Prayers are shortened (qasr) but NOT combined at Mina',
      'Spend the night in your tent — it is Sunnah to stay in Mina this night',
      'Make plenty of dua — this is the beginning of the great journey',
      'Stay hydrated — Mina can be very hot',
      'Keep your ID / Hajj badge with you at all times',
    ],
    tipsUr: [
      'نمازیں قصر پڑھیں لیکن جمع نہیں',
      'رات خیمے میں گزاریں — یہ سنت ہے',
      'بہت سی دعائیں مانگیں — یہ عظیم سفر کی شروعات ہے',
      'پانی پیتے رہیں — منیٰ بہت گرم ہو سکتا ہے',
      'اپنا شناختی کارڈ / حج بیج ہمیشہ ساتھ رکھیں',
    ],
  },

  /* ─── 9TH DHUL HIJJAH: ARAFAH ─── */
  {
    id: 4,
    day: '9th Dhul Hijjah — Arafah',
    dayUr: '۹ ذوالحجہ — عرفہ',
    dayAr: '٩ ذو الحجة — عرفة',
    title: 'Day of Arafah — The Greatest Day',
    titleUr: 'یوم عرفہ — سب سے عظیم دن',
    icon: '🤲',
    description:
      'After Fajr at Mina, proceed to the plain of Arafah. This is the MOST important day of Hajj — "Hajj is Arafah" (Tirmidhi 889). Combine Dhuhr and Asr (shortened) at Masjid Namirah or your camp. Then devote the ENTIRE afternoon to dua — standing, crying, begging Allah for forgiveness. The Prophet ﷺ said: "The best dua is the dua of the Day of Arafah." (Tirmidhi 3585). Stay in Arafah until AFTER sunset — leaving before sunset invalidates Hajj in some schools.',
    descriptionUr:
      'منیٰ سے فجر کے بعد میدان عرفات کی طرف روانہ ہوں۔ یہ حج کا سب سے اہم دن ہے — "حج عرفہ ہے" (ترمذی ۸۸۹)۔ ظہر اور عصر جمع اور قصر کریں۔ پھر پوری دوپہر دعا میں لگے رہیں — کھڑے ہو کر، رو رو کر اللہ سے مغفرت مانگیں۔ غروب کے بعد تک عرفات میں رہیں — اس سے پہلے جانا بعض مذاہب میں حج باطل کر دیتا ہے۔',
    dua: {
      arabic: 'لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
      transliteration: "Lā ilāha illallāhu waḥdahu lā sharīka lahu, lahul-mulku wa lahul-ḥamdu wa huwa ʿalā kulli shay'in qadīr",
      translation: 'There is no god but Allah, alone, without partner. To Him belongs sovereignty and praise, and He is over all things capable.',
      translationUr: 'اللہ کے سوا کوئی معبود نہیں، وہ اکیلا ہے، اس کا کوئی شریک نہیں۔ بادشاہت اسی کی ہے اور تعریف اسی کی ہے اور وہ ہر چیز پر قادر ہے۔',
    },
    tips: [
      '"Hajj is Arafah" — if you miss Arafah, your Hajj is invalid',
      'This is the day Allah frees the most people from the Fire',
      'Combine Dhuhr + Asr (shortened) then make dua until sunset',
      'Face the Qibla with raised hands — cry, beg, ask for everything',
      'Recite istighfar, durood, Quran, and personal dua in any language',
      'Do NOT leave Arafah before sunset',
    ],
    tipsUr: [
      '"حج عرفہ ہے" — عرفہ چھوٹ گیا تو حج باطل ہے',
      'یہ وہ دن ہے جب اللہ سب سے زیادہ لوگوں کو آگ سے آزاد کرتا ہے',
      'ظہر اور عصر جمع کر کے دعا میں لگ جائیں',
      'قبلہ رخ ہاتھ اٹھا کر — رو رو کر — ہر چیز مانگیں',
      'استغفار، درود، قرآن اور کسی بھی زبان میں دعا',
      'غروب سے پہلے عرفات نہ چھوڑیں',
    ],
    womenNote: 'Women make the same duas as men. There is no restriction on dua at Arafah for women. The key is sincerity.',
  },

  /* ─── 9TH NIGHT: MUZDALIFAH ─── */
  {
    id: 5,
    day: '9th Night — Muzdalifah',
    dayUr: '۹ کی رات — مزدلفہ',
    dayAr: 'ليلة ١٠ — مزدلفة',
    title: 'Muzdalifah — Under the Open Sky',
    titleUr: 'مزدلفہ — کھلے آسمان تلے',
    icon: '🌃',
    description:
      'After sunset at Arafah, proceed to Muzdalifah. Combine and shorten Maghrib (3 rakat) and Isha (2 rakat) together. Sleep under the open sky. Collect 49 pebbles (small, marble-sized) for the stoning ritual over the next days. Wake for Fajr prayer at Muzdalifah, then make dua facing Qibla until just before sunrise. Then proceed to Mina.',
    descriptionUr:
      'عرفات سے غروب کے بعد مزدلفہ روانہ ہوں۔ مغرب (۳ رکعت) اور عشا (۲ رکعت) جمع کر کے پڑھیں۔ کھلے آسمان تلے سوئیں۔ آنے والے دنوں کے لیے ۴۹ کنکریاں (چھوٹی، کنچے کے سائز) جمع کریں۔ فجر مزدلفہ میں پڑھیں، پھر قبلہ رخ دعا کریں جب تک سورج نکلنے قریب نہ ہو۔ پھر منیٰ روانہ ہوں۔',
    tips: [
      'Combine Maghrib + Isha (shorten Isha to 2 rakat)',
      'Collect 49 pebbles minimum (7 per day × 3 days + 7 for 10th = 49; or 70 if staying 13th)',
      'Sleeping at Muzdalifah is Sunnah — the elderly and sick may leave after midnight',
      'Fajr at Muzdalifah, then dua until just before sunrise',
      'Leave for Mina before sunrise on the 10th',
    ],
    tipsUr: [
      'مغرب اور عشا جمع کریں (عشا قصر)',
      'کم از کم ۴۹ کنکریاں جمع کریں (۱۳ تاریخ تک رہیں تو ۷۰)',
      'مزدلفہ میں سونا سنت ہے — بوڑھے اور مریض آدھی رات کے بعد جا سکتے ہیں',
      'فجر مزدلفہ میں پڑھیں، پھر طلوع آفتاب سے پہلے تک دعا',
      '۱۰ تاریخ کو طلوع سے پہلے منیٰ روانہ ہوں',
    ],
    womenNote: 'Elderly women and those with difficulty may leave Muzdalifah after midnight — this is permitted.',
  },

  /* ─── 10TH DHUL HIJJAH: EID DAY ─── */
  {
    id: 6,
    day: '10th Dhul Hijjah — Eid',
    dayUr: '۱۰ ذوالحجہ — عید',
    dayAr: '١٠ ذو الحجة — يوم النحر',
    title: 'Rami — Stone the Large Jamrah',
    titleUr: 'رمی — بڑے جمرے کو کنکریاں مارنا',
    icon: '🪨',
    description:
      'On the 10th (Yawm al-Nahr / Eid day), go to the Jamarat area in Mina and throw 7 pebbles at Jamrat al-Aqabah (the large pillar only) saying "Allahu Akbar" with each throw. Stop reciting Talbiyah once you begin stoning. Throw after sunrise and before sunset.',
    descriptionUr:
      '۱۰ ذوالحجہ (یوم النحر / عید) کو جمرات منیٰ میں جائیں اور جمرہ عقبہ (صرف بڑے ستون) پر ۷ کنکریاں ماریں، ہر کنکری کے ساتھ "اللہ اکبر" کہیں۔ رمی شروع ہونے پر تلبیہ بند کریں۔',
    tips: [
      'Only stone the LARGE Jamrah today (not the other two)',
      'Throw 7 pebbles one by one, saying "Allahu Akbar" each time',
      'Stop Talbiyah once you begin stoning',
      'Can be done anytime from sunrise to sunset on the 10th',
      'If crowded, going later in the day is permissible',
    ],
    tipsUr: [
      'آج صرف بڑے جمرے کو کنکریاں ماریں (باقی دو کو نہیں)',
      '۷ کنکریاں ایک ایک کر کے ماریں، ہر بار "اللہ اکبر" کہیں',
      'رمی شروع ہونے پر تلبیہ بند کریں',
      'طلوع آفتاب سے غروب تک کسی بھی وقت کر سکتے ہیں',
      'بھیڑ ہو تو دوپہر کے بعد جائیں — جائز ہے',
    ],
    womenNote: 'Women may stone at off-peak times to avoid crushing crowds. This is well-established in fiqh.',
  },
  {
    id: 7,
    day: '10th Dhul Hijjah — Eid',
    dayUr: '۱۰ ذوالحجہ — عید',
    dayAr: '١٠ ذو الحجة — يوم النحر',
    title: 'Sacrifice (Hady) & Shave/Trim',
    titleUr: 'قربانی (ہدی) اور حلق / تقصیر',
    icon: '🐑',
    description:
      'After stoning, offer your sacrifice (hady) — a sheep, goat, or share in a cow/camel. Most pilgrims arrange this through their Hajj group or a certified slaughterhouse. After sacrifice, men shave the head completely (halq — more rewarding) or trim at least 1 inch (taqsir). Women cut a fingertip-length (1 cm) from the ends of their hair. After this, first tahallul (partial release from ihram): you can change clothes, wear perfume, but marital relations remain prohibited until after Tawaf al-Ifadah.',
    descriptionUr:
      'رمی کے بعد قربانی دیں — بھیڑ، بکری، یا گائے/اونٹ میں حصہ۔ زیادہ تر حاجی یہ اپنے گروپ کے ذریعے کراتے ہیں۔ قربانی کے بعد مرد سر مونڈوائیں (حلق) یا بال کٹوائیں (تقصیر)۔ خواتین انگلی کی پور برابر بال کاٹیں۔ اس کے بعد پہلی تحلل: کپڑے بدل سکتے ہیں، خوشبو لگا سکتے ہیں، لیکن ازدواجی تعلقات طواف افاضہ تک ممنوع ہیں۔',
    tips: [
      'Order of 10th: Rami → Sacrifice → Shave/Trim → Tawaf al-Ifadah',
      'If the order is changed, most scholars say it is still valid',
      'Halq (full shave) is preferred; Prophet ﷺ made dua 3 times for those who shave',
      'After shaving, you can wear normal clothes and use perfume',
    ],
    tipsUr: [
      '۱۰ تاریخ کی ترتیب: رمی ← قربانی ← حلق/تقصیر ← طواف افاضہ',
      'اگر ترتیب بدل جائے تو اکثر علماء کے نزدیک حج درست ہے',
      'حلق (پورا سر مونڈوانا) افضل ہے',
      'حلق کے بعد عام کپڑے پہن سکتے ہیں اور خوشبو لگا سکتے ہیں',
    ],
    womenNote: 'Women only trim a fingertip-length from the ends of their hair — shaving the head is prohibited for women.',
  },
  {
    id: 8,
    day: '10th Dhul Hijjah — Eid',
    dayUr: '۱۰ ذوالحجہ — عید',
    dayAr: '١٠ ذو الحجة — يوم النحر',
    title: 'Tawaf al-Ifadah & Sa\'i',
    titleUr: 'طواف افاضہ اور سعی',
    icon: '🕋',
    description:
      'Go to Masjid al-Haram and perform Tawaf al-Ifadah (also called Tawaf al-Ziyarah) — 7 circuits around the Kaaba. This is a PILLAR of Hajj and cannot be skipped. Then perform Sa\'i between Safa and Marwa (7 times). After this, second tahallul: ALL ihram restrictions are lifted, including marital relations. You can delay this tawaf up to the 12th if needed.',
    descriptionUr:
      'مسجد الحرام جائیں اور طواف افاضہ (طواف الزیارہ) کریں — کعبہ کے ۷ چکر۔ یہ حج کا رکن ہے — چھوڑا نہیں جا سکتا۔ پھر صفا اور مروہ کے درمیان سعی کریں (۷ مرتبہ)۔ اس کے بعد دوسری تحلل: احرام کی تمام پابندیاں ختم۔ ضرورت ہو تو ۱۲ تاریخ تک مؤخر کر سکتے ہیں۔',
    tips: [
      'Tawaf al-Ifadah is a PILLAR — Hajj is incomplete without it',
      'Can be delayed until 12th if too exhausted on 10th',
      'After Tawaf + Sa\'i, all ihram restrictions are completely lifted',
      'Pray 2 rakat after Tawaf at Maqam Ibrahim',
    ],
    tipsUr: [
      'طواف افاضہ حج کا رکن ہے — اس کے بغیر حج مکمل نہیں',
      'بہت تھکان ہو تو ۱۲ تاریخ تک مؤخر کر سکتے ہیں',
      'طواف اور سعی کے بعد احرام کی تمام پابندیاں ختم',
      'طواف کے بعد مقام ابراہیم پر ۲ رکعت پڑھیں',
    ],
    womenNote: 'Women who are menstruating may delay Tawaf al-Ifadah until they are pure. They should consult their Hajj group leader.',
  },

  /* ─── 11th–12th (13th): AYYAM AL-TASHREEQ ─── */
  {
    id: 9,
    day: '11th–12th Dhul Hijjah',
    dayUr: '۱۱-۱۲ ذوالحجہ',
    dayAr: '١١-١٢ ذو الحجة',
    title: 'Ayyam al-Tashreeq — Days in Mina',
    titleUr: 'ایام تشریق — منیٰ کے دن',
    icon: '⛺',
    description:
      'Return to Mina and spend the nights of 11th and 12th. Each day after Dhuhr (or after Zawaal), go to the Jamarat and stone ALL THREE pillars — 7 pebbles each, small to large (Jamarah al-Sughra → Jamarah al-Wusta → Jamarah al-Kubra). That is 21 pebbles per day. After stoning on 12th, you may leave Mina if you wish (before sunset). Staying the 13th earns extra reward.',
    descriptionUr:
      'منیٰ واپس جائیں اور ۱۱ اور ۱۲ کی راتیں گزاریں۔ ہر دن ظہر کے بعد تینوں جمرات کو ۷-۷ کنکریاں ماریں — چھوٹے سے بڑے (جمرہ صغریٰ ← وسطیٰ ← کبریٰ)۔ ہر دن ۲۱ کنکریاں۔ ۱۲ تاریخ کو رمی کے بعد غروب سے پہلے منیٰ چھوڑ سکتے ہیں۔ ۱۳ تاریخ رکنا زیادہ ثواب ہے۔',
    dua: {
      arabic: 'وَاذْكُرُوا اللَّهَ فِي أَيَّامٍ مَّعْدُودَاتٍ',
      transliteration: "Wadhkurullāha fī ayyāmin ma'dūdāt",
      translation: 'And remember Allah during the appointed days. (Quran 2:203)',
      translationUr: 'اور اللہ کا ذکر کرو گنتی کے دنوں میں۔ (قرآن ۲:۲۰۳)',
    },
    tips: [
      'Stone after Dhuhr (zawaal) — before zawaal is invalid in Hanafi school',
      'Order: Small pillar → Medium pillar → Large pillar (7 each)',
      'After stoning the small and medium pillars, stop and make dua',
      'After stoning the large pillar, leave without stopping for dua',
      'If leaving on 12th, you must depart Mina BEFORE sunset',
      'Takbeer at-Tashreeq after every fard prayer: "Allahu Akbar, Allahu Akbar..."',
    ],
    tipsUr: [
      'ظہر (زوال) کے بعد رمی کریں — حنفی مذہب میں پہلے نہیں',
      'ترتیب: چھوٹا ← درمیانہ ← بڑا جمرہ (ہر ایک ۷ کنکریاں)',
      'چھوٹے اور درمیانے جمرے کے بعد رک کر دعا مانگیں',
      'بڑے جمرے کے بعد بغیر رکے واپس آئیں',
      '۱۲ تاریخ کو جانا ہو تو غروب سے پہلے منیٰ چھوڑ دیں',
      'ہر فرض نماز کے بعد تکبیر تشریق: "اللہ اکبر، اللہ اکبر..."',
    ],
  },

  /* ─── FAREWELL ─── */
  {
    id: 10,
    day: 'Before Leaving Makkah',
    dayUr: 'مکہ سے روانگی سے پہلے',
    dayAr: 'قبل مغادرة مكة',
    title: 'Tawaf al-Wida — Farewell Tawaf',
    titleUr: 'طواف الوداع — الوداعی طواف',
    icon: '🕌',
    description:
      'Before leaving Makkah, perform Tawaf al-Wida (farewell Tawaf) — 7 circuits around the Kaaba. This is the last thing you do before departing. The Prophet ﷺ said: "Let not any one of you leave until his last act is Tawaf around the House." (Muslim 1327). After Tawaf, pray 2 rakat, drink Zamzam, and make dua looking at the Kaaba for the last time. Leave without turning your back to the Kaaba.',
    descriptionUr:
      'مکہ سے روانگی سے پہلے طواف الوداع کریں — کعبہ کے ۷ چکر۔ یہ روانگی سے پہلے آخری عمل ہو۔ نبی ﷺ نے فرمایا: "تم میں سے کوئی نہ جائے جب تک اس کا آخری عمل کعبہ کا طواف نہ ہو۔" طواف کے بعد ۲ رکعت پڑھیں، زمزم پئیں، اور آخری بار کعبہ کی طرف دیکھتے ہوئے دعا مانگیں۔',
    dua: {
      arabic: 'اَللّٰهُمَّ إِنَّ الْبَيْتَ بَيْتُكَ وَالْحَرَمَ حَرَمُكَ وَالْأَمْنَ أَمْنُكَ وَهَذَا مَقَامُ الْعَائِذِ بِكَ مِنَ النَّارِ',
      transliteration: "Allahumma innal-bayta baytuka wal-harama haramuka wal-amna amnuka wa hadha maqamul-'a'idhi bika minan-nar",
      translation: 'O Allah, this House is Your House, this Sanctuary is Your Sanctuary, the peace here is Your peace, and this is the standing place of one who seeks refuge in You from the Fire.',
      translationUr: 'اے اللہ، یہ گھر تیرا گھر ہے، یہ حرم تیرا حرم ہے، یہ امن تیرا امن ہے، اور یہ آگ سے تیری پناہ مانگنے والے کا مقام ہے۔',
    },
    tips: [
      'Tawaf al-Wida is the LAST act before departing Makkah',
      'Menstruating women are excused from farewell Tawaf',
      'Walk backwards away from the Kaaba if possible — showing respect',
      'Make your final dua looking at the Kaaba — ask to return',
      'May Allah accept your Hajj. Hajj Mabroor!',
    ],
    tipsUr: [
      'طواف الوداع مکہ سے روانگی سے پہلے آخری عمل ہو',
      'حائضہ خواتین کو طواف الوداع سے استثنیٰ ہے',
      'ممکن ہو تو پیٹھ کعبہ کی طرف نہ کریں — احترام کی علامت',
      'آخری دعا کعبہ کی طرف دیکھتے ہوئے مانگیں — واپسی کی دعا کریں',
      'اللہ تعالیٰ آپ کا حج قبول فرمائے — حج مبرور!',
    ],
    womenNote: 'Menstruating women are excused from Tawaf al-Wida (Ibn Abbas narration in Bukhari). They should make dua from outside the Haram area.',
  },
];

export const HAJJ_DAYS = [
  'Before Hajj',
  '8th Dhul Hijjah — Mina',
  '9th Dhul Hijjah — Arafah',
  '9th Night — Muzdalifah',
  '10th Dhul Hijjah — Eid',
  '11th–12th Dhul Hijjah',
  'Before Leaving Makkah',
];
