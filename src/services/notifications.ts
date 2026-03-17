import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

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

export async function setupNotificationChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('azan-reminders', {
      name: 'Prayer Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
  }
}
