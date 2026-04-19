import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { UPCOMING_EID_DATES } from '../constants/eidGuide';

export type PrayerTime = {
  name: string;
  time: Date;
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function schedulePrayerNotifications(
  prayerTimes: PrayerTime[]
): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await scheduleEidNotifications();

  for (const prayer of prayerTimes) {
    const triggerTime = new Date(prayer.time.getTime() - 5 * 60 * 1000); // 5 min before
    if (triggerTime > new Date()) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `⏰ ${prayer.name} in 5 minutes`,
          body: 'Time to prepare for prayer.',
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerTime,
          channelId: 'azan-reminders',
        },
      });
    }
  }
}

export async function scheduleEidNotifications(): Promise<void> {
  const now = new Date();
  for (const eid of UPCOMING_EID_DATES) {
    const dayBefore = new Date(eid.date);
    dayBefore.setDate(dayBefore.getDate() - 1);
    dayBefore.setHours(8, 0, 0, 0);

    const eidMorning = new Date(eid.date);
    eidMorning.setHours(6, 0, 0, 0);

    const isAdha = eid.type === 'adha';

    if (dayBefore > now) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `🌙 ${eid.name} Tomorrow`,
          body: isAdha
            ? 'Prepare your Qurbani. Recite Takbeer al-Tashreeq. Don\'t cut hair/nails!'
            : 'Give your Zakat ul-Fitr before the prayer tomorrow. Eid Mubarak!',
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: dayBefore,
          channelId: 'azan-reminders',
        },
      });
    }

    if (eidMorning > now) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `🌟 ${eid.name} Today — Eid Mubarak!`,
          body: isAdha
            ? 'Don\'t eat before prayer. Perform Qurbani after Eid salah. Takbeer!'
            : 'Eat dates before prayer. Give Zakat ul-Fitr now. Taqabbalallahu Minna wa Minkum!',
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: eidMorning,
          channelId: 'azan-reminders',
        },
      });
    }
  }
}

export async function setupNotificationChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('azan-reminders', {
      name: 'Prayer Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
  }
}
