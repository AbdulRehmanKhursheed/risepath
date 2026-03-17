export const MOTIVATIONAL_QUOTES = [
  // Quran
  { text: 'Verily, with hardship comes ease.', source: 'Quran 94:6' },
  { text: 'Do not lose hope, nor be sad.', source: 'Quran 3:139' },
  { text: 'And whoever relies upon Allah — then He is sufficient for him.', source: 'Quran 65:3' },
  { text: 'Your Lord has not abandoned you, nor has He become displeased.', source: 'Quran 93:3' },
  { text: 'Indeed, Allah is with the patient.', source: 'Quran 2:153' },
  { text: 'He knows what is in every heart.', source: 'Quran 67:13' },
  { text: 'So which of the favors of your Lord would you deny?', source: 'Quran 55:13' },
  { text: 'Allah does not burden a soul beyond that it can bear.', source: 'Quran 2:286' },
  { text: 'Call upon Me; I will respond to you.', source: 'Quran 40:60' },
  { text: 'And He found you lost and guided you.', source: 'Quran 93:7' },
  { text: 'Unquestionably, to Allah belongs whatever is in the heavens and the earth.', source: 'Quran 10:55' },
  { text: 'Indeed it is only in the remembrance of Allah that hearts find rest.', source: 'Quran 13:28' },
  { text: 'We are closer to him than his jugular vein.', source: 'Quran 50:16' },
  { text: 'And give good tidings to the patient.', source: 'Quran 2:155' },
  { text: 'Whoever fears Allah, He will make a way out for him.', source: 'Quran 65:2' },
  { text: 'He is with you wherever you are.', source: 'Quran 57:4' },
  { text: 'Allah is the ally of those who believe.', source: 'Quran 2:257' },
  { text: 'After every darkness there is light.', source: 'Quran 65:5' },
  // Hadith
  { text: 'The strong person is not the one who can overpower others. The strong person is the one who controls themselves when angry.', source: 'Prophet ﷺ' },
  { text: 'Make things easy, do not make them hard. Give good news and do not drive people away.', source: 'Prophet ﷺ' },
  { text: 'The best among you is the one who learns the Quran and teaches it.', source: 'Prophet ﷺ' },
  { text: 'Be in this world as if you were a stranger or a traveler.', source: 'Prophet ﷺ' },
  { text: 'Tie your camel, then put your trust in Allah.', source: 'Prophet ﷺ' },
  { text: 'Take up good deeds only as much as you are able, for the best deeds are those done regularly even if they are few.', source: 'Prophet ﷺ' },
  { text: 'None of you truly believes until he wishes for his brother what he wishes for himself.', source: 'Prophet ﷺ' },
  { text: 'Cleanliness is half of faith.', source: 'Prophet ﷺ' },
  { text: 'A good word is charity.', source: 'Prophet ﷺ' },
  { text: 'Smiling at your brother is charity.', source: 'Prophet ﷺ' },
  { text: 'The worldly life is a prison for the believer and a paradise for the disbeliever.', source: 'Prophet ﷺ' },
  { text: 'Whoever is kind, Allah will be kind to him.', source: 'Prophet ﷺ' },
  // Islamic wisdom
  { text: 'Dua is the weapon of the believer.', source: 'Islamic wisdom' },
  { text: 'Patience is a pillar of faith.', source: 'Islamic wisdom' },
  { text: 'The heart that beats for Allah is always in a state of peace.', source: 'Islamic wisdom' },
  { text: 'The dunya is a shadow — do not build your home in a shadow.', source: 'Ibn Qayyim' },
  { text: 'Whoever knows himself knows his Lord.', source: 'Islamic wisdom' },
  { text: 'Rush towards prayer like you rush towards what you love.', source: 'Islamic wisdom' },
  { text: 'The wound is where the light enters.', source: 'Rumi' },
  { text: 'Live in this world like rain — pure, gentle, and life-giving.', source: 'Islamic wisdom' },
  { text: 'Grieve not. Whatever you lost in life was never yours to keep. Whatever remains is still a gift.', source: 'Islamic wisdom' },
];

export type QuoteEntry = { text: string; source: string };

export function getRandomQuote(): QuoteEntry {
  return MOTIVATIONAL_QUOTES[
    Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)
  ];
}
