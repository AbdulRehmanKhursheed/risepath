export type Kalima = {
  id: number;
  name: string;
  nameAr: string;
  arabic: string;
  transliteration: string;
  translation: string;
};

export type Dua = {
  id: string;
  title: string;
  titleUr: string;
  arabic: string;
  transliteration: string;
  translation: string;
  when: string;
};

export const KALIMAS: Kalima[] = [
  {
    id: 1,
    name: 'Kalima Tayyab',
    nameAr: 'كَلِمَةُ الطَّيِّبَة',
    arabic: 'لَا إِلَٰهَ إِلَّا ٱللَّٰهُ مُحَمَّدٌ رَسُولُ ٱللَّٰهِ',
    transliteration: 'Lā ilāha illallāhu Muḥammadur Rasūlullāh',
    translation: 'There is no god but Allah; Muhammad is the Messenger of Allah.',
  },
  {
    id: 2,
    name: 'Kalima Shahadat',
    nameAr: 'كَلِمَةُ الشَّهَادَة',
    arabic: 'أَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا ٱللَّٰهُ وَحْدَهُ لَا شَرِيكَ لَهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ',
    transliteration: 'Ashhadu an lā ilāha illallāhu waḥdahu lā sharīka lahu, wa ashhadu anna Muḥammadan ʿabduhu wa rasūluhu',
    translation: 'I bear witness that there is no god but Allah, He is alone and has no partner, and I bear witness that Muhammad is His servant and Messenger.',
  },
  {
    id: 3,
    name: 'Kalima Tamjeed',
    nameAr: 'كَلِمَةُ التَّمْجِيد',
    arabic: 'سُبْحَانَ ٱللَّٰهِ وَٱلْحَمْدُ لِلَّٰهِ وَلَا إِلَٰهَ إِلَّا ٱللَّٰهُ وَٱللَّٰهُ أَكْبَرُ وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِٱللَّٰهِ ٱلْعَلِيِّ ٱلْعَظِيمِ',
    transliteration: 'Subḥānallāhi walḥamdu lillāhi wa lā ilāha illallāhu wallāhu akbar. Wa lā ḥawla wa lā quwwata illā billāhil ʿaliyyil ʿaẓīm',
    translation: 'Glory be to Allah, and praise be to Allah, and there is no god but Allah, and Allah is the Greatest. There is no might or power except with Allah, the Exalted, the Great.',
  },
  {
    id: 4,
    name: 'Kalima Tauheed',
    nameAr: 'كَلِمَةُ التَّوْحِيد',
    arabic: 'لَا إِلَٰهَ إِلَّا ٱللَّٰهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ ٱلْمُلْكُ وَلَهُ ٱلْحَمْدُ، يُحْيِي وَيُمِيتُ وَهُوَ حَيٌّ لَا يَمُوتُ أَبَدًا أَبَدًا، ذُو ٱلْجَلَالِ وَٱلْإِكْرَامِ بِيَدِهِ ٱلْخَيْرُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ',
    transliteration: 'Lā ilāha illallāhu waḥdahu lā sharīka lahu, lahul mulku wa lahul ḥamd, yuḥyī wa yumītu wa huwa ḥayyul lā yamūtu abadan abadā, dhul jalāli wal ikrām, biyadihil khayr, wa huwa ʿalā kulli shayin qadīr',
    translation: 'There is no god but Allah. He is alone and has no partner. His is the kingdom and His is the praise. He gives life and causes death. And He is alive. He will not die, forever and ever. Possessor of Majesty and Honour. In His hand is all good. And He has power over everything.',
  },
  {
    id: 5,
    name: 'Kalima Astaghfar',
    nameAr: 'كَلِمَةُ الِاسْتِغْفَار',
    arabic: 'أَسْتَغْفِرُ ٱللَّٰهَ رَبِّي مِنْ كُلِّ ذَنْبٍ أَذْنَبْتُهُ عَمَدًا أَوْ خَطَأً سِرًّا أَوْ عَلَانِيَةً وَأَتُوبُ إِلَيْهِ مِنَ ٱلذَّنْبِ ٱلَّذِي أَعْلَمُ وَمِنَ ٱلذَّنْبِ ٱلَّذِي لَا أَعْلَمُ إِنَّكَ أَنْتَ عَلَّامُ ٱلْغُيُوبِ وَسَتَّارُ ٱلْعُيُوبِ وَغَفَّارُ ٱلذُّنُوبِ وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِٱللَّٰهِ ٱلْعَلِيِّ ٱلْعَظِيمِ',
    transliteration: 'Astaghfirullāha rabbī min kulli dhanbin adhnabtuhu ʿamadan aw khaṭaʾan sirran aw ʿalāniyatan wa atūbu ilayhi minadh dhanbilladhī aʿlamu wa minadh dhanbilladhī lā aʿlam. Innaka anta ʿallāmul ghuyūbi wa sattārul ʿuyūbi wa ghaffārudh dhunūbi wa lā ḥawla wa lā quwwata illā billāhil ʿaliyyil ʿaẓīm',
    translation: 'I seek forgiveness from Allah, my Lord, from every sin I committed knowingly or unknowingly, secretly or openly, and I turn towards Him from the sin that I know and from the sin that I do not know. Certainly You are the Knower of the hidden, the Concealer of faults, and the Forgiver of sins. There is no power and no strength except from Allah, the Most High, the Most Great.',
  },
  {
    id: 6,
    name: 'Kalima Radde Kufr',
    nameAr: 'كَلِمَةُ رَدِّ الْكُفْر',
    arabic: 'ٱللَّٰهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ أَنْ أُشْرِكَ بِكَ شَيْئًا وَأَنَا أَعْلَمُ وَأَسْتَغْفِرُكَ لِمَا لَا أَعْلَمُ تُبْتُ عَنْهُ وَتَبَرَّأَتُ مِنَ ٱلْكُفْرِ وَٱلشِّرْكِ وَٱلْكِذْبِ وَٱلْغِيبَةِ وَٱلْبِدْعَةِ وَٱلنَّمِيمَةِ وَٱلْفَوَاحِشِ وَٱلْبُهْتَانِ وَٱلْمَعَاصِي كُلِّهَا وَأَسْلَمْتُ وَأَقُولُ لَا إِلَٰهَ إِلَّا ٱللَّٰهُ مُحَمَّدٌ رَسُولُ ٱللَّٰهِ',
    transliteration: 'Allāhumma innī aʿūdhu bika min an ushrika bika shayʾan wa anā aʿlamu wa astaghfiruka limā lā aʿlam. Tubtu ʿanhu wa tabarraʾtu min al-kufri wash-shirki wal-kidhbi wal-ghībati wal-bidʿati wan-namīmati wal-fawāḥishi wal-buhtāni wal-maʿāṣī kullihā wa aslamtu wa aqūlu lā ilāha illallāhu Muḥammadur Rasūlullāh',
    translation: 'O Allah! I seek refuge in You from associating partners with You knowingly. I seek Your forgiveness for what I do not know. I repent from it and free myself from disbelief, polytheism, lying, backbiting, innovation, tale-bearing, evil deeds, slander, and all disobedience. I submit and say: There is no god but Allah, Muhammad is the Messenger of Allah.',
  },
];

export const DUAS: Dua[] = [
  {
    id: 'eating-before',
    title: 'Before Eating',
    titleUr: 'Khana khane se pehle',
    arabic: 'بِسْمِ ٱللَّٰهِ',
    transliteration: 'Bismillāh',
    translation: 'In the name of Allah.',
    when: 'Before starting a meal',
  },
  {
    id: 'eating-after',
    title: 'After Eating',
    titleUr: 'Khana khane ke baad',
    arabic: 'ٱلْحَمْدُ لِلَّٰهِ ٱلَّذِي أَطْعَمَنِي هَٰذَا وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلَا قُوَّةٍ',
    transliteration: 'Alḥamdulillāhilladhī aṭʿamanī hādhā wa razaqanīhi min ghayri ḥawlin minnī wa lā quwwah',
    translation: 'All praise is for Allah who has fed me this and provided it for me without any might or power from myself.',
    when: 'After finishing a meal',
  },
  {
    id: 'bathroom-enter',
    title: 'Before Entering Bathroom',
    titleUr: 'Bathroom jane se pehle',
    arabic: 'ٱللَّٰهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ ٱلْخُبُثِ وَٱلْخَبَائِثِ',
    transliteration: 'Allāhumma innī aʿūdhu bika min al-khubuthi wal-khabāʾith',
    translation: 'O Allah, I seek refuge in You from male and female evil (spirits).',
    when: 'Before entering the toilet/bathroom',
  },
  {
    id: 'bathroom-exit',
    title: 'After Leaving Bathroom',
    titleUr: 'Bathroom se nikalne ke baad',
    arabic: 'غُفْرَانَكَ ٱلْحَمْدُ لِلَّٰهِ ٱلَّذِي أَذْهَبَ عَنِّي ٱلْأَذَىٰ وَعَافَانِي',
    transliteration: 'Ghufrānak. Alḥamdulillāhilladhī adhhaba ʿannī al-adhā wa ʿāfānī',
    translation: 'I seek Your forgiveness. All praise is for Allah who has removed the harm from me and granted me health.',
    when: 'After leaving the toilet/bathroom',
  },
  {
    id: 'sleep',
    title: 'Before Sleeping',
    titleUr: 'Sone se pehle',
    arabic: 'بِٱسْمِكَ ٱللَّٰهُمَّ أَمُوتُ وَأَحْيَا',
    transliteration: 'Bismika Allāhumma amūtu wa aḥyā',
    translation: 'In Your name, O Allah, I die and I live.',
    when: 'When going to bed',
  },
  {
    id: 'wake',
    title: 'Upon Waking',
    titleUr: 'Jagne ke baad',
    arabic: 'ٱلْحَمْدُ لِلَّٰهِ ٱلَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ ٱلنُّشُورُ',
    transliteration: 'Alḥamdulillāhilladhī aḥyānā baʿda mā amātanā wa ilayhin nushūr',
    translation: 'All praise is for Allah who gave us life after death, and to Him is the resurrection.',
    when: 'When waking up in the morning',
  },
  {
    id: 'wudu-before',
    title: 'Before Wudu',
    titleUr: 'Wudu se pehle',
    arabic: 'بِسْمِ ٱللَّٰهِ',
    transliteration: 'Bismillāh',
    translation: 'In the name of Allah.',
    when: 'Before starting ablution',
  },
  {
    id: 'wudu-after',
    title: 'After Wudu',
    titleUr: 'Wudu ke baad',
    arabic: 'أَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا ٱللَّٰهُ وَحْدَهُ لَا شَرِيكَ لَهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ',
    transliteration: 'Ashhadu an lā ilāha illallāhu waḥdahu lā sharīka lahu wa ashhadu anna Muḥammadan ʿabduhu wa rasūluhu',
    translation: 'I bear witness that there is no god but Allah alone, with no partner, and I bear witness that Muhammad is His servant and Messenger.',
    when: 'After completing ablution',
  },
  {
    id: 'leave-home',
    title: 'When Leaving Home',
    titleUr: 'Ghar se nikalte waqt',
    arabic: 'بِسْمِ ٱللَّٰهِ تَوَكَّلْتُ عَلَى ٱللَّٰهِ وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِٱللَّٰهِ',
    transliteration: 'Bismillāhi tawakkaltu ʿalallāhi wa lā ḥawla wa lā quwwata illā billāh',
    translation: 'In the name of Allah, I place my trust in Allah. There is no might or power except with Allah.',
    when: 'When stepping out of the house',
  },
  {
    id: 'enter-home',
    title: 'When Entering Home',
    titleUr: 'Ghar mein aate waqt',
    arabic: 'بِسْمِ ٱللَّٰهِ وَلَجْنَا وَبِسْمِ ٱللَّٰهِ خَرَجْنَا وَعَلَىٰ رَبِّنَا تَوَكَّلْنَا',
    transliteration: 'Bismillāhi walajnā wa bismillāhi kharajnā wa ʿalā rabbinā tawakkalanā',
    translation: 'In the name of Allah we enter, in the name of Allah we leave, and upon our Lord we rely.',
    when: 'When entering the house',
  },
  {
    id: 'travel',
    title: 'When Traveling',
    titleUr: 'Safar karte waqt',
    arabic: 'سُبْحَانَ ٱلَّذِي سَخَّرَ لَنَا هَٰذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ وَإِنَّا إِلَىٰ رَبِّنَا لَمُنقَلِبُونَ',
    transliteration: 'Subḥānalladhī sakhkhara lanā hādhā wa mā kunnā lahu muqrinīn. Wa innā ilā rabbinā lamunqalibūn',
    translation: 'Glory be to Him who has subjected this to us, and we could not have done it ourselves. And indeed, to our Lord we will return.',
    when: 'When boarding a vehicle',
  },
  {
    id: 'sneeze',
    title: 'After Sneezing',
    titleUr: 'Chheenk aane ke baad',
    arabic: 'ٱلْحَمْدُ لِلَّٰهِ',
    transliteration: 'Alḥamdulillāh',
    translation: 'All praise is for Allah.',
    when: 'After sneezing',
  },
  {
    id: 'distress',
    title: 'In Distress',
    titleUr: 'Pareshani mein',
    arabic: 'لَا إِلَٰهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنتُ مِنَ ٱلظَّالِمِينَ',
    transliteration: 'Lā ilāha illā anta subḥānaka innī kuntu minaẓ-ẓālimīn',
    translation: 'There is no god but You. Glory be to You. Indeed, I was among the wrongdoers.',
    when: 'When in difficulty or distress',
  },
];
