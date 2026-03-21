// Local Islamic motivation engine — no API key or internet required.
// Responses drawn from Quran, Hadith, and Islamic wisdom,
// tailored to the user's current mood level and prayer consistency.

const RESPONSES: Record<number, string[]> = {
  1: [
    `SubhanAllah. Even in your lowest moment, Allah sees you. "No fatigue, anxiety, or sorrow befalls a believer, even the prick of a thorn, except that Allah expiates some of his sins." (Bukhari). Your pain is not wasted. 🤲`,
    `"And He found you lost and guided you." (Quran 93:7). You are never truly lost when Allah knows exactly where you are. Make wudu, sit quietly, and whisper a dua. That is enough for now.`,
    `Ibrahim (AS) was tested by fire. Yunus (AS) was tested in darkness. Ayub (AS) was tested by pain. They all called on Allah — and He answered every single time. Call on Him now. He is listening. 💛`,
    `"Verily, with hardship comes ease — verily, with hardship comes ease." (Quran 94:5-6). Allah repeated it twice. He wants you to hear it twice. Your relief is already written.`,
    `Imam Ahmad used to say "Alhamdulillah in every state." Even this state. Even this moment. Breathe. Say it once: Alhamdulillah. Then say it again. 🌿`,
  ],
  2: [
    `"Verily, with every hardship comes ease." (Quran 94:6). Feeling down is not failure — it is human. The difference is what you do next. One salah. One dua. One small step forward.`,
    `"La hawla wa la quwwata illa billah" — There is no power except with Allah. Let that truth settle in. He is your source. Plug back in. ✨`,
    `Umar (RA) had hard days. Ali (RA) had hard days. The Sahaba had hard days. What made them great was that they turned toward Allah instead of away. One prayer. One step. That is all.`,
    `"So remember Me, and I will remember you." (Quran 2:152). Allah is waiting for you to turn to Him. A few words of dhikr right now — SubhanAllah, Alhamdulillah, Allahu Akbar — and He responds.`,
    `The Prophet (SAW) said: "When you wake up in the morning, do not expect to see the evening." We are here for a short time. Do not let a low moment steal a precious day. 💪`,
  ],
  3: [
    `Alhamdulillah for stability. "The most beloved deeds to Allah are those done consistently, even if small." (Bukhari). You are building something lasting. Stay the course. ⚡`,
    `Renew your niyyah right now. The same action with a renewed intention earns fresh reward. A prayer prayed with full presence is worth more than a hundred prayed mindlessly. 🌱`,
    `You are in the middle — that is not bad, that is a foundation. Add one small extra today: one extra ayah, one act of kindness, one moment of gratitude. Small + consistent = extraordinary in Allah's sight.`,
    `"Whoever is content with what Allah has given him, he will be the richest of people." (Tirmidhi) Steady, calm, grateful — that is a powerful state to be in. 💛`,
    `The Prophet (SAW) said: "Make things easy and do not make them difficult." You do not have to be perfect today. Just be present. Pray. Make dhikr. That is enough. 🌿`,
  ],
  4: [
    `Masha Allah! This good feeling is a blessing. Do not let the high go to waste — make a big dua NOW while your heart is open. 🌟`,
    `Alhamdulillah! Use this energy wisely — pray your Sunnah prayers, call your parents, smile at someone. "Smiling at your brother is sadaqah." (Tirmidhi). You can afford to be generous today. 😊`,
    `"If you are grateful, I will surely increase you." (Quran 14:7). Good mood = perfect time for shukr. Count three blessings right now. Watch what happens to your heart. 🙏`,
    `Feeling good? This is the best time to make a serious commitment to Allah. Pick ONE habit for the next 30 days — Fajr on time, Quran after Isha, no complaining. Lock it in today. 🏆`,
    `The Prophet (SAW) said the heart is most receptive when it feels at peace. Right now, ask Allah for something big. Something you have wanted for a long time. Ask with certainty. ✨`,
  ],
  5: [
    `ALLAHU AKBAR! You are on fire! Days like this are rare gifts — do not waste a single minute. Make a commitment, give sadaqah, pray every Sunnah. "If you are grateful, I will surely increase you." (Quran 14:7) 🔥`,
    `You are at your peak! This is the moment to make a promise to Allah — one habit, 30 days. No negotiating. Your future self will be grateful you decided today. 💪`,
    `"Whoever does an atom's weight of good will see it." (Quran 99:7). Every action you take today is being recorded. You are building something eternal right now. Do not stop. ✨🏆`,
    `Masha Allah! Your energy, your momentum, your streak — all of it is seen by Allah. "Indeed, Allah does not allow to be lost the reward of those who do good." (Quran 11:115). Keep going! 🌟`,
    `The Prophet (SAW) said: "Take advantage of five before five: youth before old age, health before sickness, wealth before poverty, free time before business, and life before death." You are in a great moment — use it! ⚡`,
  ],
};

const MISSED_NOTES = [
  `P.S. — You still have a missed prayer today. Make it up before you sleep — the door is always open. Allah loves the one who returns. 🤲`,
  `One more thing — do not forget your missed prayer(s). Qadha before you sleep. "The best of sinners are those who repent." (Ibn Majah) 🌙`,
  `Reminder — make up your missed prayer(s) today. It takes only a few minutes and wipes the slate clean. 🙌`,
];

export function getLocalMotivation(streak: number, mood: number, missed: number): string {
  const level = Math.min(Math.max(Math.round(mood), 1), 5);
  const pool = RESPONSES[level];
  let response = pool[Math.floor(Math.random() * pool.length)];

  if (streak >= 30) {
    response += `\n\n🔥 ${streak} day streak — you are building something real. Do not break it now.`;
  } else if (streak >= 7) {
    response += `\n\n⚡ ${streak} day streak — keep the momentum going!`;
  } else if (streak === 0) {
    response += `\n\n🌱 Every expert was once a beginner. Your streak starts with today.`;
  }

  if (missed > 0) {
    const note = MISSED_NOTES[Math.floor(Math.random() * MISSED_NOTES.length)];
    response += `\n\n${note}`;
  }

  return response;
}
