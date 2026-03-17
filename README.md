# RisePath

A motivational + Islamic lifestyle tracker combining Namaz times, daily goals, streak system, mood tracking, and an AI motivation coach. Target market: Pakistan/Muslim users.

## Features

- **Home**: Streak ring, daily quote, goals checklist, time-based greeting
- **Learn**: 6 Kalimas (Arabic + transliteration + translation) + 13 everyday Duas (eating, bathroom, sleep, wudu, travel, etc.)
- **Prayer Tracker**: Auto prayer times with **13 regional calculation methods**
- **Qibla**: Compass showing direction to Kaaba (Mecca), with live device heading when available (Karachi, Muslim World League, Umm Al-Qura, etc.) + Hanafi/Shafi madhab, mark prayed/missed, weekly consistency dots, 5-min-before notifications
- **Mood + AI Coach**: 5-point mood scale, Claude-powered motivation based on streak & mood
- **Stats**: Prayer consistency %, goals completed, mood trend, longest streak

## Tech Stack

- Expo SDK 54 + TypeScript (compatible with Expo Go on Play Store & App Store)
- React Navigation (bottom tabs)
- expo-notifications, expo-location
- adhan (prayer times)
- AsyncStorage, react-native-reanimated
- Syne + Plus Jakarta Sans fonts

## Setup

```bash
npm install
cp .env.example .env
# Add EXPO_PUBLIC_CLAUDE_KEY to .env for AI coach
npx expo start
```

## Run

- **iOS**: `npx expo start --ios`
- **Android**: `npx expo start --android`
- **Web**: `npx expo install react-dom react-native-web` then `npx expo start --web`

## Publishing to Google Play

1. **Build EAS**: `npx eas build --platform android --profile production`
2. **Create Play Console** account, add app, complete store listing
3. **Upload AAB** from `eas build` output
4. **Target Pakistan**: In Play Console → Countries, enable Pakistan (and others)
5. **ASO**: Use keywords like "namaz", "azan", "prayer times", "Islamic", "Muslim", "Pakistan"

## Folder Structure

```
src/
  screens/     Home, Prayers, Mood, Stats
  components/  StreakRing, PrayerRow, GoalItem, MoodButton, ChatBubble
  hooks/       usePrayerTimes, useLocation, useStreak
  services/    ai.ts, notifications.ts, storage.ts
  constants/   theme.ts, quotes.ts
```
